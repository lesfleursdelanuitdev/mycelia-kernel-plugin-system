/**
 * ListenerRegistry Class
 * 
 * Manages listener storage and basic registration/unregistration operations.
 * Handles exact path matching only (no pattern matching).
 * 
 * @example
 * const registry = new ListenerRegistry();
 * registry.register('layers/create', handler);
 * const handlers = registry.get('layers/create');
 */
export class ListenerRegistry {
  /**
   * Create a new ListenerRegistry instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    
    // Listener storage: path -> [handler1, handler2, ...]
    this.listeners = new Map();
  }

  /**
   * Register a listener for a specific path
   * @param {string} path - Message path to listen for
   * @param {Function} handler - Handler function to call when message is received
   * @param {Array<Function>} existingListeners - Existing listeners for this path (from policy)
   * @returns {void}
   */
  register(path, handler, existingListeners = []) {
    this.listeners.set(path, existingListeners);
    
    if (this.debug) {
      console.log(`ListenerRegistry: Registered listener for '${path}' (${existingListeners.length} total)`);
    }
  }

  /**
   * Unregister a specific listener for a path
   * @param {string} path - Message path
   * @param {Function} handler - Handler function to remove
   * @returns {boolean} Success status
   */
  unregister(path, handler) {
    if (!this.listeners.has(path)) {
      return false;
    }

    const existingListeners = this.listeners.get(path);
    const index = existingListeners.indexOf(handler);
    
    if (index === -1) {
      return false;
    }

    existingListeners.splice(index, 1);

    // Clean up empty arrays
    if (existingListeners.length === 0) {
      this.listeners.delete(path);
    }

    if (this.debug) {
      console.log(`ListenerRegistry: Unregistered listener for '${path}' (${existingListeners.length} remaining)`);
    }

    return true;
  }

  /**
   * Unregister all listeners for a specific path
   * @param {string} path - Message path
   * @returns {number} Number of listeners removed
   */
  unregisterAll(path) {
    if (!this.listeners.has(path)) {
      return 0;
    }

    const count = this.listeners.get(path).length;
    this.listeners.delete(path);

    if (this.debug) {
      console.log(`ListenerRegistry: Removed ${count} listeners for '${path}'`);
    }

    return count;
  }

  /**
   * Clear all listeners
   * @returns {number} Total number of listeners removed
   */
  clear() {
    let totalRemoved = 0;
    
    for (const [_path, handlers] of this.listeners) {
      totalRemoved += handlers.length;
    }

    this.listeners.clear();

    if (this.debug) {
      console.log(`ListenerRegistry: Cleared ${totalRemoved} listeners`);
    }

    return totalRemoved;
  }

  /**
   * Check if there are listeners for a specific path
   * @param {string} path - Message path
   * @returns {boolean} True if listeners exist
   */
  has(path) {
    return this.listeners.has(path) && this.listeners.get(path).length > 0;
  }

  /**
   * Get the number of listeners for a specific path
   * @param {string} path - Message path
   * @returns {number} Number of listeners
   */
  getCount(path) {
    return this.listeners.has(path) ? this.listeners.get(path).length : 0;
  }

  /**
   * Get all listeners for a specific path
   * @param {string} path - Message path
   * @returns {Array<Function>} Array of handler functions
   */
  get(path) {
    return this.listeners.has(path) ? [...this.listeners.get(path)] : [];
  }

  /**
   * Get all listeners (for debugging)
   * @returns {Object} Object with paths as keys and handler arrays as values
   */
  getAll() {
    const result = {};
    for (const [path, handlers] of this.listeners) {
      result[path] = [...handlers];
    }
    return result;
  }

  /**
   * Get all registered paths
   * @returns {Array<string>} Array of path strings
   */
  getPaths() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get total listener count across all paths
   * @returns {number} Total number of listeners
   */
  getTotalCount() {
    return Array.from(this.listeners.values()).reduce((sum, handlers) => sum + handlers.length, 0);
  }

  /**
   * Get number of paths with listeners
   * @returns {number} Number of paths
   */
  getPathCount() {
    return this.listeners.size;
  }
}

