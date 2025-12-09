import { StandalonePluginSystem } from '../system/standalone-plugin-system.js';
import { BaseSubsystem } from '../system/base-subsystem.js';
import { deepMerge } from '../builder/context-resolver.js';

/**
 * useBase - Fluent API Builder for StandalonePluginSystem
 * 
 * Provides a convenient, chainable API for creating and configuring
 * StandalonePluginSystem instances.
 * 
 * @param {string} name - Unique name for the plugin system
 * @param {Object} [options={}] - Initial configuration options
 * @param {Object} [options.config={}] - Initial configuration object keyed by facet kind
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @param {Array} [options.defaultHooks=[]] - Optional default hooks to install
 * @returns {UseBaseBuilder} Builder instance with fluent API
 * 
 * @example
 * ```javascript
 * import { useBase } from 'mycelia-kernel-plugin';
 * import { useDatabase, useCache } from './hooks';
 * 
 * const system = await useBase('my-app')
 *   .config('database', { host: 'localhost' })
 *   .config('cache', { ttl: 3600 })
 *   .use(useDatabase)
 *   .use(useCache)
 *   .onInit(async (api, ctx) => {
 *     console.log('System initialized');
 *   })
 *   .build();
 * ```
 */
export function useBase(name, options = {}) {
  if (!name || typeof name !== 'string') {
    throw new Error('useBase: name must be a non-empty string');
  }

  // Create builder with fluent API (system will be created lazily)
  return new UseBaseBuilder(name, options);
}

/**
 * UseBaseBuilder - Fluent API builder for StandalonePluginSystem or BaseSubsystem
 * 
 * Provides chainable methods for configuring and building the system.
 */
class UseBaseBuilder {
  #name;
  #options;
  #BaseClass = StandalonePluginSystem; // Default to StandalonePluginSystem
  #system = null; // Lazy initialization
  #pendingConfig = {};

  constructor(name, options) {
    this.#name = name;
    this.#options = options;
  }

  /**
   * Get or create the system instance (lazy initialization)
   * @private
   */
  #getSystem() {
    if (!this.#system) {
      this.#system = new this.#BaseClass(this.#name, this.#options);
    }
    return this.#system;
  }

  /**
   * Set the base class for the system
   * 
   * @param {Function} BaseClass - The base class to use (StandalonePluginSystem or BaseSubsystem)
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * import { BaseSubsystem } from 'mycelia-kernel-plugin';
   * 
   * builder.setBase(BaseSubsystem);
   * ```
   * 
   * @example
   * ```javascript
   * // Must be called before any methods that use the system
   * const system = await useBase('my-app')
   *   .setBase(BaseSubsystem)
   *   .use(useDatabase)
   *   .build();
   * ```
   */
  setBase(BaseClass) {
    if (this.#system) {
      throw new Error('useBase.setBase: cannot change base class after system is created');
    }
    if (typeof BaseClass !== 'function') {
      throw new Error('useBase.setBase: BaseClass must be a constructor function');
    }
    // Validate it's a subclass of BaseSubsystem
    if (BaseClass !== BaseSubsystem && !(BaseClass.prototype instanceof BaseSubsystem)) {
      throw new Error('useBase.setBase: BaseClass must be BaseSubsystem or a subclass of BaseSubsystem');
    }
    this.#BaseClass = BaseClass;
    return this;
  }

  /**
   * Register a hook
   * 
   * @param {Function} hook - Hook function to register
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.use(useDatabase).use(useCache);
   * ```
   */
  use(hook) {
    if (typeof hook !== 'function') {
      throw new Error('useBase.use: hook must be a function');
    }
    this.#getSystem().use(hook);
    return this;
  }

  /**
   * Conditionally register a hook
   * 
   * @param {boolean} condition - Whether to register the hook
   * @param {Function} hook - Hook function to register if condition is true
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.useIf(process.env.ENABLE_CACHE === 'true', useCache);
   * ```
   */
  useIf(condition, hook) {
    if (condition) {
      return this.use(hook);
    }
    return this;
  }

  /**
   * Register multiple hooks at once
   * 
   * @param {Array<Function>} hooks - Array of hook functions to register
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.useMultiple([useDatabase, useCache, useAuth]);
   * ```
   * 
   * @example
   * ```javascript
   * // Can be combined with other methods
   * builder
   *   .use(useLogger)
   *   .useMultiple([useDatabase, useCache])
   *   .use(useAuth);
   * ```
   */
  useMultiple(hooks) {
    if (!Array.isArray(hooks)) {
      throw new Error('useBase.useMultiple: hooks must be an array');
    }
    
    const system = this.#getSystem();
    for (const hook of hooks) {
      if (typeof hook !== 'function') {
        throw new Error('useBase.useMultiple: all hooks must be functions');
      }
      system.use(hook);
    }
    
    return this;
  }

  /**
   * Conditionally register multiple hooks
   * 
   * @param {boolean} condition - Whether to register the hooks
   * @param {Array<Function>} hooks - Array of hook functions to register if condition is true
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.useIfMultiple(process.env.NODE_ENV === 'development', [
   *   useDebugTools,
   *   useDevLogger
   * ]);
   * ```
   * 
   * @example
   * ```javascript
   * const optionalHooks = [];
   * if (enableCache) optionalHooks.push(useCache);
   * if (enableAuth) optionalHooks.push(useAuth);
   * 
   * builder
   *   .use(useDatabase)
   *   .useIfMultiple(optionalHooks.length > 0, optionalHooks);
   * ```
   */
  useIfMultiple(condition, hooks) {
    if (condition) {
      return this.useMultiple(hooks);
    }
    return this;
  }

  /**
   * Add or update configuration for a specific facet kind
   * 
   * Configurations are merged when possible (deep merge for objects).
   * 
   * @param {string} kind - Facet kind identifier (e.g., 'database', 'cache')
   * @param {*} config - Configuration value for this facet kind
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder
   *   .config('database', { host: 'localhost', port: 5432 })
   *   .config('cache', { ttl: 3600 });
   * ```
   * 
   * @example
   * ```javascript
   * // Merge configurations
   * builder
   *   .config('database', { host: 'localhost' })
   *   .config('database', { port: 5432 }); // Merges with existing
   * ```
   */
  config(kind, config) {
    if (!kind || typeof kind !== 'string') {
      throw new Error('useBase.config: kind must be a non-empty string');
    }

    // Get existing config for this kind (from pending or system if created)
    let existingConfig;
    if (this.#system) {
      if (!this.#system.ctx.config || typeof this.#system.ctx.config !== 'object') {
        this.#system.ctx.config = {};
      }
      existingConfig = this.#system.ctx.config[kind];
    } else {
      // System not created yet, check pending config
      existingConfig = this.#pendingConfig[kind];
    }

    const pendingConfig = this.#pendingConfig[kind];

    // Determine the base config (existing or pending)
    const baseConfig = pendingConfig !== undefined ? pendingConfig : existingConfig;

    // Merge if both are objects
    if (
      baseConfig &&
      typeof baseConfig === 'object' &&
      !Array.isArray(baseConfig) &&
      config &&
      typeof config === 'object' &&
      !Array.isArray(config)
    ) {
      // Deep merge
      this.#pendingConfig[kind] = deepMerge(baseConfig, config);
    } else {
      // Override
      this.#pendingConfig[kind] = config;
    }

    return this;
  }

  /**
   * Add or update configurations for multiple facet kinds at once
   * 
   * Configurations are merged when possible (deep merge for objects).
   * 
   * @param {Object} configs - Object where keys are facet kinds and values are configurations
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.configMultiple({
   *   database: { host: 'localhost', port: 5432 },
   *   cache: { ttl: 3600 },
   *   auth: { secret: 'abc123' }
   * });
   * ```
   * 
   * @example
   * ```javascript
   * // Merge configurations
   * builder
   *   .configMultiple({
   *     database: { host: 'localhost' },
   *     cache: { ttl: 3600 }
   *   })
   *   .configMultiple({
   *     database: { port: 5432 }, // Merges with existing
   *     auth: { secret: 'abc123' }
   *   });
   * ```
   */
  configMultiple(configs) {
    if (!configs || typeof configs !== 'object' || Array.isArray(configs)) {
      throw new Error('useBase.configMultiple: configs must be an object');
    }

    for (const [kind, config] of Object.entries(configs)) {
      this.config(kind, config);
    }

    return this;
  }

  /**
   * Add an initialization callback
   * 
   * @param {Function} callback - Callback function: (api, ctx) => Promise<void> | void
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.onInit(async (api, ctx) => {
   *   console.log('System initialized:', api.name);
   * });
   * ```
   */
  onInit(callback) {
    if (typeof callback !== 'function') {
      throw new Error('useBase.onInit: callback must be a function');
    }
    this.#getSystem().onInit(callback);
    return this;
  }

  /**
   * Add a disposal callback
   * 
   * @param {Function} callback - Callback function: () => Promise<void> | void
   * @returns {UseBaseBuilder} This builder for chaining
   * 
   * @example
   * ```javascript
   * builder.onDispose(async () => {
   *   console.log('System disposed');
   * });
   * ```
   */
  onDispose(callback) {
    if (typeof callback !== 'function') {
      throw new Error('useBase.onDispose: callback must be a function');
    }
    this.#getSystem().onDispose(callback);
    return this;
  }

  /**
   * Build the system
   * 
   * This method is required and must be called to build the system.
   * It applies any pending configurations and builds the system.
   * 
   * @param {Object} [ctx={}] - Additional context to pass to build
   * @returns {Promise<StandalonePluginSystem>} The built system instance
   * 
   * @example
   * ```javascript
   * const system = await useBase('my-app')
   *   .use(useDatabase)
   *   .build();
   * ```
   */
  async build(ctx = {}) {
    const system = this.#getSystem();

    // Apply pending configurations
    if (Object.keys(this.#pendingConfig).length > 0) {
      // Merge pending config into system config
      if (!system.ctx.config || typeof system.ctx.config !== 'object') {
        system.ctx.config = {};
      }

      // Deep merge pending configs
      for (const [kind, config] of Object.entries(this.#pendingConfig)) {
        const existing = system.ctx.config[kind];
        if (
          existing &&
          typeof existing === 'object' &&
          !Array.isArray(existing) &&
          config &&
          typeof config === 'object' &&
          !Array.isArray(config)
        ) {
          system.ctx.config[kind] = deepMerge(existing, config);
        } else {
          system.ctx.config[kind] = config;
        }
      }

      // Clear pending configs
      this.#pendingConfig = {};
    }

    // Merge any additional context
    if (ctx && typeof ctx === 'object' && !Array.isArray(ctx)) {
      if (ctx.config && typeof ctx.config === 'object' && !Array.isArray(ctx.config)) {
        if (!system.ctx.config) {
          system.ctx.config = {};
        }
        system.ctx.config = deepMerge(system.ctx.config, ctx.config);
      }
      // Merge other ctx properties (shallow)
      Object.assign(system.ctx, ctx);
    }

    // Build the system
    await system.build(ctx);

    // Return the system instance
    return system;
  }
}




