import { SubsystemBuilder } from '../builder/subsystem-builder.js';
import { FacetManager } from '../manager/facet-manager.js';
import { disposeChildren } from './base-subsystem.utils.js';
import { createSubsystemLogger } from '../utils/logger.js';
import { DependencyGraphCache } from '../builder/dependency-graph-cache.js';

// Constants for facet kinds (used if facets are available)
const HIERARCHY_KIND = 'hierarchy';

export class BaseSubsystem {
  _isBuilt = false;
  _buildPromise = null;
  _disposePromise = null;
  _builder = null;
  _initCallbacks = [];
  _disposeCallbacks = [];
  _parent = null; // ← parent subsystem

  /**
   * @param {string} name - Unique name for the subsystem
   * @param {Object} options - Configuration options
   * @param {Object} [options.ms] - Optional message system instance (for compatibility, not required for standalone)
   * @param {Object} [options.config={}] - Optional configuration object keyed by facet kind.
   *   Each key corresponds to a facet kind (e.g., 'router', 'queue', 'scheduler').
   *   Each value is the configuration object for that specific hook/facet.
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(name, options = {}) {
    if (!name || typeof name !== 'string')
      throw new Error('BaseSubsystem: name must be a non-empty string');
    
    // ms is optional for standalone plugin system
    // if (!options.ms)
    //   throw new Error('BaseSubsystem: options.ms is required');

    this.name = name;
    this.options = options;
    this.messageSystem = options.ms || null;

    // create the context object
    this.ctx = {};
    this.ctx.ms = options.ms || null; // Optional message system
    this.ctx.config = options.config || {}; // Optional configuration object keyed by facet kind
    this.ctx.debug = !!options.debug;
    
    // Legacy property for backward compatibility (use ctx.debug instead)
    this.debug = this.ctx.debug;

    this.defaultHooks = options.defaultHooks;
    this.hooks = [];
    this._builder = new SubsystemBuilder(this);
    this.api = { name, 
        __facets: new FacetManager(this) };
    this.coreProcessor = null;
  }

  // ==== Hierarchy Management ====

  /** Assign a parent subsystem (called during child registration). */
  setParent(parent) {
    const hierarchy = this.find(HIERARCHY_KIND);
    if (hierarchy) {
      return hierarchy.setParent(parent);
    }
    // Fallback if hierarchy facet not present
    if (parent && typeof parent !== 'object')
      throw new Error(`${this.name}: parent must be an object or null`);
    this._parent = parent;
    return this;
  }

  /** Retrieve the parent subsystem. */
  getParent() {
    const hierarchy = this.find(HIERARCHY_KIND);
    if (hierarchy) {
      return hierarchy.getParent();
    }
    // Fallback if hierarchy facet not present
    return this._parent;
  }

  /** True if this subsystem has no parent (i.e., top-level). */
  isRoot() {
    const hierarchy = this.find(HIERARCHY_KIND);
    if (hierarchy) {
      return hierarchy.isRoot();
    }
    // Fallback if hierarchy facet not present
    return this._parent === null;
  }

  /** Returns the root subsystem by traversing up the parent chain. */
  getRoot() {
    const hierarchy = this.find(HIERARCHY_KIND);
    if (hierarchy) {
      return hierarchy.getRoot();
    }
    // Fallback if hierarchy facet not present
    let current = this;
    while (current._parent !== null) {
      current = current._parent;
    }
    return current;
  }

  /**
   * Returns a fully-qualified subsystem name string.
   * Example:
   * Root subsystem "kernel" → "kernel://"
   * Child subsystem "cache" under "kernel" → "kernel://cache"
   * Grandchild "manager" → "kernel://cache/manager"
   */
  getNameString() {
    if (this._parent === null) {
      return `${this.name}://`;
    }
    const parentName = this._parent.getNameString();
    // ensure no accidental trailing "//"
    return `${parentName.replace(/\/$/, '')}/${this.name}`;
  }

  // ==== State getters ====

  get isBuilt() { return this._isBuilt; }

  /** Returns an array of all facet kinds (capabilities) available on this subsystem. */
  get capabilities() { return this.api.__facets.getAllKinds(); }

  // ==== Hook registration ====

  use(hook) {
    if (this._isBuilt)
      throw new Error(`${this.name}: cannot add hooks after build()`);
    if (typeof hook !== 'function')
      throw new Error(`${this.name}: hook must be a function`);
    this.hooks.push(hook);
    return this;
  }

  onInit(cb) {
    if (typeof cb !== 'function')
      throw new Error(`${this.name}: onInit callback must be a function`);
    this._initCallbacks.push(cb);
    return this;
  }

  onDispose(cb) {
    if (typeof cb !== 'function')
      throw new Error(`${this.name}: onDispose callback must be a function`);
    this._disposeCallbacks.push(cb);
    return this;
  }

  /**
   * Find a facet by kind and optional orderIndex
   * @param {string} kind - Facet kind to find
   * @param {number} [orderIndex] - Optional order index. If provided, returns facet at that index. If not, returns the last facet (highest orderIndex).
   * @returns {Object|undefined} Facet instance or undefined if not found
   */
  find(kind, orderIndex = undefined) { return this.api.__facets.find(kind, orderIndex); }
  
  /**
   * Get a facet by its index in the array of facets of that kind
   * @param {string} kind - Facet kind to find
   * @param {number} index - Zero-based index in the array of facets of this kind
   * @returns {Object|undefined} Facet instance or undefined if not found
   */
  getByIndex(kind, index) { return this.api.__facets.getByIndex(kind, index); }

  // ==== Lifecycle ====

  async build(ctx = {}) {
    if (this._isBuilt) return this;
    if (this._buildPromise) return this._buildPromise;

    this._buildPromise = (async () => {
      try {
        // Determine graphCache: use provided, inherited from parent, or create new
        let graphCache = ctx.graphCache || this.ctx?.graphCache || this.ctx?.parent?.graphCache;
        
        if (!graphCache) {
          // Create new cache with default capacity (configurable via ctx.config.graphCache.capacity)
          const cacheCapacity = ctx.config?.graphCache?.capacity || 100;
          graphCache = new DependencyGraphCache(cacheCapacity);
        }
        
        // Set graphCache on ctx so it's available after build
        this.ctx.graphCache = graphCache;
        
        this._builder.withCtx(ctx); // any additional context to be passed to the builder
        await this._builder.build(graphCache); // Pass graphCache explicitly
        for (const cb of this._initCallbacks)
          await cb(this.api, this.ctx);
        this._isBuilt = true;
        
        // Note: coreProcessor is not set for standalone plugin system
        // (no message processing needed)
        this.coreProcessor = null;
        
        const logger = createSubsystemLogger(this);
        logger.log('Built successfully');
        return this;
      } finally {
        this._buildPromise = null;
      }
    })();

    return this._buildPromise;
  }

  async dispose() {
    if (!this._isBuilt && !this._buildPromise) return;
    if (this._disposePromise) return this._disposePromise;

    const waitBuild = this._buildPromise ? this._buildPromise.catch(() => {}) : Promise.resolve();

    this._disposePromise = (async () => {
      try {
        await waitBuild;
        if (!this._isBuilt) return;

        await disposeChildren(this);
        if (this.api && this.api.__facets) {
          await this.api.__facets.disposeAll(this);
        }

        const logger = createSubsystemLogger(this);
        for (const cb of this._disposeCallbacks) {
          try { await cb(); }
          catch (err) { logger.error('Dispose callback error:', err); }
        }

        this._isBuilt = false;
        this.coreProcessor = null;
        this._builder.invalidate();

        logger.log('Disposed');
      } finally {
        this._disposePromise = null;
      }
    })();

    return this._disposePromise;
  }

  // ==== Message flow (No-ops for standalone plugin system) ====

  /**
   * No-op: Message acceptance is not needed for standalone plugin system.
   * @param {*} _message - Ignored
   * @param {*} _options - Ignored
   * @returns {Promise<boolean>} Always returns true
   */
  async accept(_message, _options = {}) {
    // No-op for standalone plugin system
    return true;
  }

  /**
   * No-op: Message processing is not needed for standalone plugin system.
   * @param {*} _timeSlice - Ignored
   * @returns {Promise<null>} Always returns null
   */
  async process(_timeSlice) {
    // No-op for standalone plugin system
    return null;
  }

  /**
   * No-op: Immediate message processing is not needed for standalone plugin system.
   * @param {*} _message - Ignored
   * @param {*} _options - Ignored
   * @returns {Promise<null>} Always returns null
   */
  async processImmediately(_message, _options = {}) {
    // No-op for standalone plugin system
    return null;
  }

  /**
   * No-op: Pause functionality is not needed for standalone plugin system.
   * @returns {BaseSubsystem} Returns this for chaining
   */
  pause() {
    // No-op for standalone plugin system
    return this;
  }

  /**
   * No-op: Resume functionality is not needed for standalone plugin system.
   * @returns {BaseSubsystem} Returns this for chaining
   */
  resume() {
    // No-op for standalone plugin system
    return this;
  }

  /**
   * Get queue status (returns default if queue facet not available).
   * @returns {Object} Queue status object
   */
  getQueueStatus() {
    const queue = this.find('queue');
    if (!queue?.getStatus) {
      // Return default status if queue facet is not available
      return { size: 0, maxSize: 0, isFull: false };
    }
    return queue.getStatus();
  }

  // ==== Routing (Optional - returns null if router not available) ====

  /**
   * Register a route (optional - returns null if router facet not available).
   * @param {string} pattern - Route pattern
   * @param {Function} handler - Route handler
   * @param {Object} routeOptions - Route options
   * @returns {boolean|null} True if registered, null if router not available
   */
  registerRoute(pattern, handler, routeOptions = {}) {
    const router = this.find('router');
    if (!router?.registerRoute) {
      return null;
    }
    return router.registerRoute(pattern, handler, routeOptions);
  }

  /**
   * Unregister a route (optional - returns null if router facet not available).
   * @param {string} pattern - Route pattern
   * @returns {boolean|null} True if unregistered, null if router not available
   */
  unregisterRoute(pattern) {
    const router = this.find('router');
    if (!router?.unregisterRoute) {
      return null; 
    }
    return router.unregisterRoute(pattern);
  }
}

