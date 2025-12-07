import { StandalonePluginSystem } from '../system/standalone-plugin-system.js';
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

  // Create the system instance
  const system = new StandalonePluginSystem(name, options);

  // Create builder with fluent API
  return new UseBaseBuilder(system);
}

/**
 * UseBaseBuilder - Fluent API builder for StandalonePluginSystem
 * 
 * Provides chainable methods for configuring and building the system.
 */
class UseBaseBuilder {
  #system;
  #pendingConfig = {};

  constructor(system) {
    this.#system = system;
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
    this.#system.use(hook);
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

    // Initialize config object if needed
    if (!this.#system.ctx.config || typeof this.#system.ctx.config !== 'object') {
      this.#system.ctx.config = {};
    }

    // Get existing config for this kind
    const existingConfig = this.#system.ctx.config[kind];
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
    this.#system.onInit(callback);
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
    this.#system.onDispose(callback);
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
    // Apply pending configurations
    if (Object.keys(this.#pendingConfig).length > 0) {
      // Merge pending config into system config
      if (!this.#system.ctx.config || typeof this.#system.ctx.config !== 'object') {
        this.#system.ctx.config = {};
      }

      // Deep merge pending configs
      for (const [kind, config] of Object.entries(this.#pendingConfig)) {
        const existing = this.#system.ctx.config[kind];
        if (
          existing &&
          typeof existing === 'object' &&
          !Array.isArray(existing) &&
          config &&
          typeof config === 'object' &&
          !Array.isArray(config)
        ) {
          this.#system.ctx.config[kind] = deepMerge(existing, config);
        } else {
          this.#system.ctx.config[kind] = config;
        }
      }

      // Clear pending configs
      this.#pendingConfig = {};
    }

    // Merge any additional context
    if (ctx && typeof ctx === 'object' && !Array.isArray(ctx)) {
      if (ctx.config && typeof ctx.config === 'object' && !Array.isArray(ctx.config)) {
        if (!this.#system.ctx.config) {
          this.#system.ctx.config = {};
        }
        this.#system.ctx.config = deepMerge(this.#system.ctx.config, ctx.config);
      }
      // Merge other ctx properties (shallow)
      Object.assign(this.#system.ctx, ctx);
    }

    // Build the system
    await this.#system.build(ctx);

    // Return the system instance
    return this.#system;
  }
}

