/**
 * ListenerManager Class
 * 
 * Manages listener registration and notification for subsystems using pluggable policies.
 * Provides optional listener functionality that subsystems can opt-in to use.
 * 
 * @example
 * // Create listener manager with multiple policy
 * const listenerManager = new ListenerManager({
 *   registrationPolicy: 'multiple',
 *   debug: true
 * });
 * 
 * @example
 * // Register listeners
 * listenerManager.on('layers/create', (message) => {
 *   console.log('Layer created:', message.getBody());
 * });
 * 
 * @example
 * // Notify listeners
 * listenerManager.notifyListeners('layers/create', message);
 */
import { 
  DEFAULT_POLICIES, 
  getAvailablePolicies, 
  validatePolicyOptions 
} from './listener-manager-policies.js';
import { ListenerRegistry } from './listener-registry.js';
import { PatternMatcher } from './pattern-matcher.js';
import { HandlerGroupManager } from './handler-group-manager.js';
import { ListenerStatistics } from './listener-statistics.js';

export class ListenerManager {
  /**
   * Create a new ListenerManager instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.registrationPolicy='multiple'] - Registration policy
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {Object} [options.policyOptions={}] - Policy-specific options
   * 
   * @example
   * // Basic listener manager
   * const listenerManager = new ListenerManager();
   * 
   * @example
   * // Configured listener manager
   * const listenerManager = new ListenerManager({
   *   registrationPolicy: 'single',
   *   debug: true,
   *   policyOptions: { maxListeners: 5 }
   * });
   */
  constructor(options = {}) {
    this.registrationPolicy = options.registrationPolicy || 'multiple';
    this.debug = options.debug || false;
    this.policyOptions = options.policyOptions || {};
    
    // Policy registry - start with default policies
    this.allowedPolicies = new Map(DEFAULT_POLICIES);
    
    // Initialize component modules
    this.registry = new ListenerRegistry({ debug: this.debug });
    this.patternMatcher = new PatternMatcher({ debug: this.debug });
    this.handlerGroupManager = new HandlerGroupManager();
    this.statistics = new ListenerStatistics();
    
    if (this.debug) {
      console.log(`ListenerManager: Initialized with policy '${this.registrationPolicy}'`);
      console.log(`ListenerManager: Available policies:`, getAvailablePolicies());
    }
  }

  /**
   * Register a handler group for a specific path
   * Handler groups contain onSuccess, onFailure, and onTimeout callbacks.
   * 
   * @param {string} path - Message path to listen for
   * @param {Object} handlers - Handler group object with onSuccess, onFailure, onTimeout
   * @param {Object} [options={}] - Registration options
   * @returns {boolean} Success status
   * 
   * @example
   * // Register a handler group
   * listenerManager.registerHandlerGroup('save/msg_123', {
   *   onSuccess: (message) => console.log('Success:', message),
   *   onFailure: (message) => console.error('Failure:', message),
   *   onTimeout: (message) => console.warn('Timeout:', message)
   * });
   */
  registerHandlerGroup(path, handlers, options = {}) {
    const wrappedHandler = this.handlerGroupManager.wrap(handlers);
    return this.on(path, wrappedHandler, options);
  }

  /**
   * Register a listener for a specific path
   * @param {string} path - Message path to listen for
   * @param {Function} handler - Handler function to call when message is received
   * @param {Object} [options={}] - Registration options (for future use)
   * @returns {boolean} Success status
   * 
   * @example
   * // Register a listener for layer creation
   * listenerManager.on('layers/create', (message) => {
   *   console.log('Layer created:', message.getBody());
   * });
   */
  on(path, handler, _options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    const existingListeners = this.registry.get(path);
    const policyFunction = this.allowedPolicies.get(this.registrationPolicy);
    
    if (!policyFunction) {
      throw new Error(`Unknown policy: ${this.registrationPolicy}. Available: ${Array.from(this.allowedPolicies.keys()).join(', ')}`);
    }

    // Apply policy function
    const result = policyFunction(existingListeners, path, handler, {
      policy: this.registrationPolicy,
      debug: this.debug,
      ...this.policyOptions
    });

    if (result.success) {
      this.registry.register(path, handler, result.listeners);
      this.statistics.recordRegistration();
      return true;
    } else {
      throw new Error(result.error);
    }
  }

  /**
   * Unregister a handler group for a specific path
   * Finds and removes the handler group that matches the provided handlers.
   * 
   * @param {string} path - Message path
   * @param {Object} handlers - Handler group object with onSuccess, onFailure, onTimeout
   * @param {Object} [options={}] - Unregistration options
   * @returns {boolean} Success status
   * 
   * @example
   * // Remove a handler group
   * listenerManager.unregisterHandlerGroup('save/msg_123', {
   *   onSuccess: handlerGroup.onSuccess,
   *   onFailure: handlerGroup.onFailure,
   *   onTimeout: handlerGroup.onTimeout
   * });
   */
  unregisterHandlerGroup(path, handlers, _options = {}) {
    if (!this.registry.has(path)) {
      return false;
    }

    const existingListeners = this.registry.get(path);
    const wrappedHandler = this.handlerGroupManager.find(existingListeners, handlers);

    if (wrappedHandler) {
      return this.off(path, wrappedHandler);
    }

    return false;
  }

  /**
   * Unregister a specific listener for a path
   * @param {string} path - Message path
   * @param {Function} handler - Handler function to remove
   * @returns {boolean} Success status
   * 
   * @example
   * // Remove a specific listener
   * listenerManager.off('layers/create', myHandler);
   */
  off(path, handler) {
    const removed = this.registry.unregister(path, handler);
    if (removed) {
      this.statistics.recordUnregistration();
    }
    return removed;
  }

  /**
   * Unregister all listeners for a specific path
   * @param {string} path - Message path
   * @returns {number} Number of listeners removed
   * 
   * @example
   * // Remove all listeners for a path
   * const removed = listenerManager.offAll('layers/create');
   */
  offAll(path) {
    const count = this.registry.unregisterAll(path);
    if (count > 0) {
      // Record multiple unregistrations
      for (let i = 0; i < count; i++) {
        this.statistics.recordUnregistration();
      }
    }
    return count;
  }

  /**
   * Clear all listeners
   * @returns {number} Total number of listeners removed
   * 
   * @example
   * // Clear all listeners
   * const removed = listenerManager.clearListeners();
   */
  clearListeners() {
    const exactRemoved = this.registry.clear();
    const patternRemoved = this.patternMatcher.getTotalCount();
    this.patternMatcher.clear();
    
    // Record unregistrations
    for (let i = 0; i < exactRemoved; i++) {
      this.statistics.recordUnregistration();
    }
    for (let i = 0; i < patternRemoved; i++) {
      this.statistics.recordPatternUnregistration();
    }
    
    return exactRemoved + patternRemoved;
  }

  /**
   * Check if there are listeners for a specific path
   * @param {string} path - Message path
   * @returns {boolean} True if listeners exist
   * 
   * @example
   * if (listenerManager.hasListeners('layers/create')) {
   *   console.log('Has listeners for layer creation');
   * }
   */
  hasListeners(path) {
    return this.registry.has(path);
  }

  /**
   * Get the number of listeners for a specific path
   * @param {string} path - Message path
   * @returns {number} Number of listeners
   * 
   * @example
   * const count = listenerManager.getListenerCount('layers/create');
   */
  getListenerCount(path) {
    return this.registry.getCount(path);
  }

  /**
   * Get all listeners for a specific path
   * @param {string} path - Message path
   * @returns {Array<Function>} Array of handler functions
   * 
   * @example
   * const handlers = listenerManager.getListeners('layers/create');
   */
  getListeners(path) {
    return this.registry.get(path);
  }

  /**
   * Get all listeners (for debugging)
   * @returns {Object} Object with paths as keys and handler arrays as values
   * 
   * @example
   * const allListeners = listenerManager.getAllListeners();
   */
  getAllListeners() {
    return this.registry.getAll();
  }

  /**
   * Emit an event to listeners for a specific path
   * Checks both exact path matches and pattern matches
   * @param {string} path - Message path
   * @param {Message} message - Message to send to listeners
   * @returns {number} Number of listeners notified
   * 
   * @example
   * // Emit event to listeners
   * const notified = listenerManager.emit('layers/create', message);
   */
  emit(path, message) {
    return this.notifyListeners(path, message);
  }

  /**
   * Notify listeners for a specific path
   * Checks both exact path matches and pattern matches
   * @param {string} path - Message path
   * @param {Message} message - Message to send to listeners
   * @returns {number} Number of listeners notified
   * 
   * @example
   * // Notify listeners after processing a message
   * const notified = listenerManager.notifyListeners('layers/create', message);
   */
  notifyListeners(path, message) {
    let totalNotified = 0;

    // 1. Check exact path matches first (existing behavior)
    if (this.registry.has(path)) {
      const handlers = this.registry.get(path);
      totalNotified += this._notifyHandlers(handlers, path, message);
    }

    // 2. Check pattern matches
    const patternMatches = this.patternMatcher.findMatches(path);
    for (const { patternEntry, params } of patternMatches) {
      totalNotified += this._notifyHandlers(patternEntry.handlers, patternEntry.pattern, message, params);
      this.statistics.recordPatternMatch();
    }

    this.statistics.recordNotifications(totalNotified);

    if (this.debug && totalNotified > 0) {
      console.log(`ListenerManager: Notified ${totalNotified} listeners for '${path}'`);
    }

    return totalNotified;
  }

  /**
   * Notify handlers for a path
   * @param {Array} handlers - Array of handler functions or handler entries
   * @param {string} path - Path for logging
   * @param {Message} message - Message to send
   * @param {Object} [params=null] - Extracted parameters from pattern match
   * @returns {number} Number of handlers notified
   * @private
   */
  _notifyHandlers(handlers, path, message, params = null) {
    let notified = 0;

    for (const handlerEntry of handlers) {
      try {
        // Handle priority policy: extract handler from object
        // Priority policy stores: { handler, priority, path }
        // Other policies store: function directly
        const handler = typeof handlerEntry === 'function' 
          ? handlerEntry 
          : (handlerEntry && handlerEntry.handler ? handlerEntry.handler : handlerEntry);
        
        if (typeof handler !== 'function') {
          if (this.debug) {
            console.error(`ListenerManager: Handler for '${path}' is not a function:`, handler);
          }
          continue;
        }
        
        // Call handler with message and params (if pattern match)
        if (params) {
          handler(message, params);
        } else {
          handler(message);
        }
        notified++;
      } catch (error) {
        this.statistics.recordError();
        if (this.debug) {
          console.error(`ListenerManager: Error in listener for '${path}':`, error);
        }
      }
    }

    return notified;
  }

  /**
   * Notify all listeners (broadcast)
   * @param {Message} message - Message to send to all listeners
   * @returns {number} Total number of listeners notified
   * 
   * @example
   * // Broadcast to all listeners
   * const notified = listenerManager.notifyAllListeners(message);
   */
  notifyAllListeners(message) {
    let totalNotified = 0;

    for (const path of this.registry.getPaths()) {
      totalNotified += this.notifyListeners(path, message);
    }

    if (this.debug && totalNotified > 0) {
      console.log(`ListenerManager: Broadcast to ${totalNotified} listeners`);
    }

    return totalNotified;
  }

  /**
   * Set the listener registration policy
   * @param {string} policy - Registration policy
   * @param {Object} [options={}] - Policy-specific options
   * @returns {boolean} Success status
   * 
   * @example
   * // Set policy to only allow one listener per path
   * listenerManager.setListenerPolicy('single');
   * 
   * @example
   * // Set policy with options
   * listenerManager.setListenerPolicy('limited', { maxListeners: 5 });
   */
  setListenerPolicy(policy, options = {}) {
    if (!this.allowedPolicies.has(policy)) {
      throw new Error(`Unknown policy: ${policy}. Available: ${Array.from(this.allowedPolicies.keys()).join(', ')}`);
    }

    // Validate policy options
    const validation = validatePolicyOptions(policy, options);
    if (!validation.valid) {
      throw new Error(`Invalid options for policy '${policy}': ${validation.errors.join(', ')}`);
    }

    this.registrationPolicy = policy;
    this.policyOptions = { ...this.policyOptions, ...options };

    if (this.debug) {
      console.log(`ListenerManager: Policy set to '${policy}' with options:`, options);
    }

    return true;
  }

  /**
   * Get the current listener registration policy
   * @returns {string} Current policy
   * 
   * @example
   * const policy = listenerManager.getListenerPolicy();
   */
  getListenerPolicy() {
    return this.registrationPolicy;
  }

  /**
   * Register a new policy
   * @param {string} name - Policy name
   * @param {Function} policyFunction - Policy function
   * @example
   * listenerManager.registerPolicy('my-custom', (existingListeners, path, handler, options) => {
   *   // Custom policy logic
   *   return { success: true, listeners: [...existingListeners, handler], error: null };
   * });
   */
  registerPolicy(name, policyFunction) {
    if (typeof policyFunction !== 'function') {
      throw new Error('Policy must be a function');
    }
    
    this.allowedPolicies.set(name, policyFunction);
    
    if (this.debug) {
      console.log(`ListenerManager: Registered policy '${name}'`);
    }
  }

  /**
   * Unregister a policy
   * @param {string} name - Policy name
   * @example
   * listenerManager.unregisterPolicy('my-custom');
   */
  unregisterPolicy(name) {
    if (DEFAULT_POLICIES.has(name)) {
      throw new Error(`Cannot unregister default policy: ${name}`);
    }
    
    const removed = this.allowedPolicies.delete(name);
    
    if (this.debug && removed) {
      console.log(`ListenerManager: Unregistered policy '${name}'`);
    }
    
    return removed;
  }

  /**
   * Get available policy names
   * @returns {Array<string>} Array of policy names
   * @example
   * const policies = listenerManager.getAvailablePolicies();
   * console.log('Available policies:', policies);
   */
  getAvailablePolicies() {
    return Array.from(this.allowedPolicies.keys());
  }

  /**
   * Validate if a listener can be added for a path
   * @param {string} path - Message path
   * @param {Function} handler - Handler function
   * @returns {Object} Validation result
   * 
   * @example
   * const validation = listenerManager.validateListener('layers/create', handler);
   * if (!validation.valid) {
   *   console.log('Cannot add listener:', validation.reason);
   * }
   */
  validateListener(path, handler) {
    if (typeof handler !== 'function') {
      return { valid: false, reason: 'Handler must be a function' };
    }

    const existingListeners = this.registry.get(path);
    const policyFunction = this.allowedPolicies.get(this.registrationPolicy);
    
    if (!policyFunction) {
      return { valid: false, reason: `Unknown policy: ${this.registrationPolicy}` };
    }

    // Test the policy function
    const result = policyFunction(existingListeners, path, handler, {
      policy: this.registrationPolicy,
      debug: this.debug,
      ...this.policyOptions
    });

    return { valid: result.success, reason: result.error };
  }

  /**
   * Get listener manager statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const exactListeners = this.registry.getTotalCount();
    const patternListeners = this.patternMatcher.getTotalCount();
    
    return this.statistics.get({
      registrationPolicy: this.registrationPolicy,
      policyOptions: this.policyOptions,
      availablePolicies: this.getAvailablePolicies(),
      totalPaths: this.registry.getPathCount(),
      totalListeners: exactListeners + patternListeners,
      exactPaths: this.registry.getPathCount(),
      exactListeners: exactListeners,
      patternCount: this.patternMatcher.getPatternCount(),
      patternListeners: patternListeners
    });
  }

  /**
   * Check if a path contains pattern syntax (e.g., {param})
   * @param {string} path - Path to check
   * @returns {boolean} True if path contains pattern syntax
   * 
   * @example
   * listenerManager.isPattern('command/completed/id/{id}'); // true
   * listenerManager.isPattern('command/completed'); // false
   */
  isPattern(path) {
    return this.patternMatcher.isPattern(path);
  }

  /**
   * Register a listener for a pattern path
   * @param {string} pattern - Pattern path with {param} placeholders (e.g., 'command/completed/id/{id}')
   * @param {Function} handler - Handler function to call when pattern matches
   * @returns {boolean} Success status
   * 
   * @example
   * // Register a pattern listener
   * listenerManager.onPattern('command/completed/id/{id}', (message, params) => {
   *   console.log('Command completed:', params.id);
   * });
   */
  onPattern(pattern, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    const existingHandlers = this.patternMatcher.has(pattern) 
      ? this.patternMatcher.findMatches(pattern)[0]?.patternEntry?.handlers || []
      : [];

    const policyFunction = this.allowedPolicies.get(this.registrationPolicy);
    
    if (!policyFunction) {
      throw new Error(`Unknown policy: ${this.registrationPolicy}. Available: ${Array.from(this.allowedPolicies.keys()).join(', ')}`);
    }

    // Apply policy function to handlers array
    const result = policyFunction(existingHandlers, pattern, handler, {
      policy: this.registrationPolicy,
      debug: this.debug,
      ...this.policyOptions
    });

    if (result.success) {
      this.patternMatcher.register(pattern, handler, result.listeners);
      this.statistics.recordPatternRegistration();
      return true;
    } else {
      throw new Error(result.error);
    }
  }

  /**
   * Unregister a pattern listener
   * @param {string} pattern - Pattern path
   * @param {Function} handler - Handler function to remove
   * @returns {boolean} Success status
   * 
   * @example
   * // Remove a pattern listener
   * listenerManager.offPattern('command/completed/id/{id}', myHandler);
   */
  offPattern(pattern, handler) {
    const removed = this.patternMatcher.unregister(pattern, handler);
    if (removed) {
      this.statistics.recordPatternUnregistration();
    }
    return removed;
  }

  /**
   * Check if pattern listeners exist for a pattern
   * @param {string} pattern - Pattern path
   * @returns {boolean} True if pattern listeners exist
   */
  hasPatternListeners(pattern) {
    return this.patternMatcher.has(pattern);
  }

  /**
   * Get pattern listener count for a specific pattern
   * @param {string} pattern - Pattern path
   * @returns {number} Total number of handlers for this pattern
   */
  getPatternListenerCount(pattern) {
    return this.patternMatcher.getCount(pattern);
  }

  /**
   * Get all registered patterns
   * @returns {Array<string>} Array of pattern strings
   */
  getRegisteredPatterns() {
    return this.patternMatcher.getPatterns();
  }

  /**
   * Clear statistics and reset state
   */
  clear() {
    this.statistics.clear();
    this.registry.clear();
    this.patternMatcher.clear();
    
    if (this.debug) {
      console.log(`ListenerManager: Cleared all data`);
    }
  }
}

