/**
 * DependencyGraphCache Class
 * 
 * Bounded LRU (Least Recently Used) cache for dependency graph topological sort results.
 * Uses Map's insertion order to track access order.
 * 
 * On get(): delete and re-insert to move to end (most recent)
 * On set(): if at capacity, delete first entry (least recent)
 * 
 * @example
 * const cache = new DependencyGraphCache(100);
 * cache.set('hierarchy,listeners,processor', { valid: true, orderedKinds: [...] });
 * const result = cache.get('hierarchy,listeners,processor');
 */
export class DependencyGraphCache {
  /**
   * Create a new DependencyGraphCache
   * 
   * @param {number} [capacity=100] - Maximum number of cached entries
   */
  constructor(capacity = 100) {
    if (typeof capacity !== 'number' || capacity < 1) {
      throw new Error('DependencyGraphCache: capacity must be a positive number');
    }
    
    this.capacity = capacity;
    this.cache = new Map(); // key (sorted kinds string) → { valid: boolean, orderedKinds?: string[], error?: string }
  }
  
  /**
   * Get cached result for a key (updates access order)
   * 
   * @param {string} key - Cache key (sorted facet kinds string)
   * @returns {{ valid: boolean, orderedKinds?: string[], error?: string }|null} Cached result or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    // Move to end (most recently used) by deleting and re-inserting
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  /**
   * Set cached result for a key
   * 
   * @param {string} key - Cache key (sorted facet kinds string)
   * @param {boolean} valid - Whether the result is valid
   * @param {string[]} [orderedKinds] - Topologically sorted kinds (if valid)
   * @param {string} [error] - Error message (if invalid)
   */
  set(key, valid, orderedKinds = null, error = null) {
    // If at capacity, remove least recently used (first entry)
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const value = {
      valid,
      ...(valid && orderedKinds ? { orderedKinds } : {}),
      ...(!valid && error !== null ? { error } : {})
    };
    
    // Remove existing entry if present, then add to end (most recently used)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
  }
  
  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * Get current cache size
   * 
   * @returns {number} Number of cached entries
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {{capacity:number,size:number,keys:string[]}}
   */
  getStats() {
    return {
      capacity: this.capacity,
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

