import { BaseSubsystem } from './base-subsystem.js';

/**
 * StandalonePluginSystem
 * 
 * A specialized BaseSubsystem designed for standalone plugin systems without message processing.
 * Automatically overrides message-specific methods as no-ops.
 * 
 * This class is ideal for:
 * - Plugin architectures
 * - Modular applications
 * - Component systems
 * - Service containers
 * 
 * @example
 * ```javascript
 * import { StandalonePluginSystem } from './standalone-plugin-system.js';
 * import { useDatabase } from './plugins/use-database.js';
 * 
 * const system = new StandalonePluginSystem('my-app', {
 *   config: {
 *     database: { host: 'localhost' }
 *   }
 * });
 * 
 * system
 *   .use(useDatabase)
 *   .build();
 * 
 * const db = system.find('database');
 * ```
 */
export class StandalonePluginSystem extends BaseSubsystem {
  /**
   * @param {string} name - Unique name for the plugin system
   * @param {Object} options - Configuration options
   * @param {Object} [options.config={}] - Optional configuration object keyed by facet kind.
   *   Each key corresponds to a facet kind (e.g., 'database', 'cache').
   *   Each value is the configuration object for that specific hook/facet.
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {Array} [options.defaultHooks=[]] - Optional default hooks to install
   */
  constructor(name, options = {}) {
    // Pass null for message system - not needed for standalone plugin system
    super(name, { ...options, ms: null });
    
    // No default hooks by default (can be set via options.defaultHooks)
    // Users can add hooks via .use() method
    this.defaultHooks = options.defaultHooks || [];
  }

  // ==== Message Flow Methods (No-Ops) ====
  // Inherited from BaseSubsystem - already no-ops

  // ==== Routing Methods (No-Ops) ====
  // Inherited from BaseSubsystem - already returns null if router not available

  // ==== Lifecycle Methods (Kept from BaseSubsystem) ====
  // build(), dispose(), onInit(), onDispose() are inherited and work as expected
  
  // ==== Plugin Management Methods (Kept from BaseSubsystem) ====
  // use(), find() are inherited and work as expected
  
  // ==== Hierarchy Methods (Kept from BaseSubsystem) ====
  // setParent(), getParent(), isRoot(), getRoot(), getNameString() are inherited
  
  // ==== State Getters (Kept from BaseSubsystem) ====
  // isBuilt getter is inherited
}

