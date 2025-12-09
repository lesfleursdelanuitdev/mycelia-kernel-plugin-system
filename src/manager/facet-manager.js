import { FacetManagerTransaction } from './facet-manager-transaction.js';
import { createSubsystemLogger } from '../utils/logger.js';
import { instrumentFacetInit, instrumentDisposeCallback } from '../utils/instrumentation.js';

export class FacetManager {
  #facets = new Map(); // Map<kind, Array<facet>> - stores arrays of facets per kind, sorted by orderIndex
  #subsystem;
  #txn;

  constructor(subsystem) {
    this.#subsystem = subsystem;
    this.#txn = new FacetManagerTransaction(this, subsystem);
    return new Proxy(this, {
      get: (t, p) => {
        if (typeof t[p] === 'function') return t[p].bind(t);
        if (p in t) return t[p];
        // Map access: check if property exists as a facet key
        // Return the last facet (highest orderIndex) for backward compatibility
        if (t.#facets.has(p)) {
          const facets = t.#facets.get(p);
          return Array.isArray(facets) ? facets[facets.length - 1] : facets;
        }
        return undefined;
      },
      set: (t, p, v) => {
        if (p in t) {
          t[p] = v;
          return true;
        }
        // Map assignment: set as facet (for backward compatibility, store as array)
        if (!t.#facets.has(p)) {
          t.#facets.set(p, []);
        }
        const facets = t.#facets.get(p);
        if (Array.isArray(facets)) {
          facets.push(v);
          // Sort by orderIndex (nulls go to end)
          facets.sort((a, b) => {
            const aIdx = a.orderIndex ?? Infinity;
            const bIdx = b.orderIndex ?? Infinity;
            return aIdx - bIdx;
          });
        } else {
          t.#facets.set(p, [v]);
        }
        return true;
      },
      has: (t, p) => p in t || t.#facets.has(p),
      ownKeys: (t) => [...Object.keys(t), ...t.#facets.keys()]
    });
  }

  /** Begin a transaction frame */
  beginTransaction() {
    this.#txn.beginTransaction();
  }

  /** Commit current transaction frame */
  commit() {
    this.#txn.commit();
  }

  /** Roll back current transaction frame: dispose + remove in reverse add order */
  async rollback() {
    await this.#txn.rollback();
  }

  /** Add → (optional init) → (optional attach). No overwrites. Rolls back current facet on init failure. */
  async add(kind, facet, opts = { init: false, attach: false, ctx: undefined, api: undefined }) {
    if (!kind || typeof kind !== 'string') throw new Error('FacetManager.add: kind must be a non-empty string');
    if (!facet || typeof facet !== 'object') throw new Error('FacetManager.add: facet must be an object');
    if (this.#facets.has(kind)) throw new Error(`FacetManager.add: facet '${kind}' already exists`);

    // 1) Register so deps can be discovered during init()
    // Store as array for consistency with addMany
    this.#facets.set(kind, [facet]);

    // Track for outer transaction rollback (if any)
    this.#txn.trackAddition(kind);

    // 2) Init now
          try {
            if (opts.init && typeof facet.init === 'function') {
              // Use instrumentation for timing (handles init callback internally)
              await instrumentFacetInit(facet, opts.ctx, opts.api, this.#subsystem);
            }
    } catch (err) {
      // local rollback for this facet
      try { facet?.dispose?.(this.#subsystem); } catch { /* best-effort disposal */ }
      // Remove facet from array
      const facets = this.#facets.get(kind);
      if (Array.isArray(facets)) {
        const index = facets.indexOf(facet);
        if (index !== -1) {
          facets.splice(index, 1);
          if (facets.length === 0) {
            this.#facets.delete(kind);
          }
        }
      } else {
        this.#facets.delete(kind);
      }
      throw err;
    }

    // 3) Attach after successful init
    if (opts.attach && facet.shouldAttach?.()) {
      this.attach(kind);
    }

    return true;
  }

  /**
   * Group facets by dependency level for parallel initialization.
   * Uses the topological sort order to identify facets that can be initialized in parallel.
   * Facets at the same level (all dependencies already initialized) can be initialized in parallel.
   * 
   * Since orderedKinds is topologically sorted, we can group facets by finding the maximum
   * level of their dependencies. Facets with no dependencies go to level 0, facets that
   * depend on level 0 facets go to level 1, etc.
   * 
   * @param {string[]} orderedKinds - Topologically sorted facet kinds
   * @param {Object} facetsByKind - Map of facet kind to Facet instance
   * @returns {string[][]} Array of arrays, where each inner array contains facet kinds at the same dependency level
   */
  #groupByDependencyLevel(orderedKinds, facetsByKind) {
    // Build dependency map: kind -> Set of dependencies
    const dependencyMap = new Map();
    
    for (const kind of orderedKinds) {
      const facet = facetsByKind[kind];
      const deps = (typeof facet?.getDependencies === 'function' && facet.getDependencies()) || [];
      // Only include dependencies that are in orderedKinds
      const processedDeps = deps.filter(dep => orderedKinds.includes(dep));
      dependencyMap.set(kind, new Set(processedDeps));
    }
    
    // Build a map of kind -> level for quick lookup
    const kindToLevel = new Map();
    const levels = [];
    
    for (const kind of orderedKinds) {
      const deps = dependencyMap.get(kind) || new Set();
      
      // Find the maximum level of any dependency
      let targetLevel = 0;
      if (deps.size > 0) {
        for (const dep of deps) {
          const depLevel = kindToLevel.get(dep);
          if (depLevel !== undefined) {
            targetLevel = Math.max(targetLevel, depLevel + 1);
          }
        }
      }
      
      // Ensure levels array is large enough
      while (levels.length <= targetLevel) {
        levels.push([]);
      }
      
      levels[targetLevel].push(kind);
      kindToLevel.set(kind, targetLevel);
    }
    
    // Filter out empty levels
    return levels.filter(level => level.length > 0);
  }

  /** Bulk add with automatic rollback on any failure.
   * Initializes facets in parallel when they're at the same dependency level.
   */
  async addMany(orderedKinds, facetsByKind, opts = { init: true, attach: true, ctx: undefined, api: undefined }) {
    this.beginTransaction();
    try {
      // Set order index for each facet based on its position in orderedKinds
      for (let i = 0; i < orderedKinds.length; i++) {
        const kind = orderedKinds[i];
        const facet = facetsByKind[kind];
        if (facet && typeof facet.setOrderIndex === 'function') {
          facet.setOrderIndex(i);
        }
      }
      
      // Group facets by dependency level for parallel initialization
      const levels = this.#groupByDependencyLevel(orderedKinds, facetsByKind);
      
      // Process each level sequentially, but facets within a level in parallel
      for (const level of levels) {
        // First, register all facets at this level (so they're available for dependency lookups)
        for (const kind of level) {
          const facet = facetsByKind[kind];
          if (!facet || typeof facet !== 'object') {
            throw new Error(`FacetManager.addMany: invalid facet for kind '${kind}'`);
          }
          // Check if facet already exists
          if (this.#facets.has(kind)) {
            const existingFacets = this.#facets.get(kind);
            const existingFacetsArray = Array.isArray(existingFacets) ? existingFacets : [existingFacets];
            
            // Check if this is the same facet instance (added during verify phase)
            const isSameInstance = existingFacetsArray.includes(facet);
            
            if (isSameInstance) {
              // Same facet instance - already registered during verify
              // Just track it for initialization, don't add it again
              this.#txn.trackAddition(kind);
              continue; // Skip registration, but it will be initialized below
            }
            
            // Different facet instance - check if we can overwrite
            const canOverwrite = facet.shouldOverwrite?.() === true;
            if (!canOverwrite) {
              throw new Error(`FacetManager.addMany: facet '${kind}' already exists and new facet does not allow overwrite`);
            }
            // Overwrite allowed - dispose old facets but keep them in the array for find() by orderIndex
            // Reuse existingFacets from above
            if (Array.isArray(existingFacets)) {
              // Dispose all existing facets
              for (const oldFacet of existingFacets) {
                try {
                  oldFacet?.dispose?.(this.#subsystem);
                } catch {
                  // Best-effort disposal
                }
              }
            } else {
              // Legacy: single facet (shouldn't happen, but handle it)
              try {
                existingFacets?.dispose?.(this.#subsystem);
              } catch {
                // Best-effort disposal
              }
            }
            // Remove from subsystem property if attached
            if (kind in this.#subsystem) {
              try {
                delete this.#subsystem[kind];
              } catch {
                // Best-effort cleanup
              }
            }
          }
          
          // Register facet (but don't init yet)
          // Store as array, sorted by orderIndex
          if (!this.#facets.has(kind)) {
            this.#facets.set(kind, []);
          }
          const facets = this.#facets.get(kind);
          if (Array.isArray(facets)) {
            // Only add if not already in the array (prevent duplicates)
            if (!facets.includes(facet)) {
              facets.push(facet);
              // Sort by orderIndex (nulls go to end)
              facets.sort((a, b) => {
                const aIdx = a.orderIndex ?? Infinity;
                const bIdx = b.orderIndex ?? Infinity;
                return aIdx - bIdx;
              });
            }
          } else {
            // Legacy: convert to array
            this.#facets.set(kind, [this.#facets.get(kind), facet]);
          }
          this.#txn.trackAddition(kind);
        }
        
        // Then, initialize all facets at this level in parallel
        const initPromises = level.map(async (kind) => {
          const facet = facetsByKind[kind];
          if (!facet) return; // Skip if facet not found
          
          try {
            // Initialize facet (only if not already initialized)
            if (opts.init && typeof facet.init === 'function') {
              await facet.init(opts.ctx, opts.api, this.#subsystem);
            }
            
            // Attach facet after successful init
            if (opts.attach && facet.shouldAttach?.()) {
              // Only attach if not already attached (same instance check)
              // Check both if property exists and if it's the same instance
              const alreadyAttached = kind in this.#subsystem && this.#subsystem[kind] === facet;
              if (!alreadyAttached) {
                this.attach(kind);
              }
            }
          } catch (err) {
            // Local rollback for this facet
            try { 
              facet?.dispose?.(this.#subsystem); 
            } catch { 
              /* best-effort disposal */ 
            }
            // Remove facet from array
            const facets = this.#facets.get(kind);
            if (Array.isArray(facets)) {
              const index = facets.indexOf(facet);
              if (index !== -1) {
                facets.splice(index, 1);
                if (facets.length === 0) {
                  this.#facets.delete(kind);
                }
              }
            } else {
              this.#facets.delete(kind);
            }
            throw err;
          }
        });
        
        // Wait for all facets at this level to initialize
        await Promise.all(initPromises);
      }
      
      this.commit();
    } catch (err) {
      await this.rollback();
      throw err;
    }
  }

  /** Attach facet directly to subsystem. Allows overwrite if facet.shouldOverwrite() returns true. */
  attach(facetKind) {
    if (!facetKind || typeof facetKind !== 'string') {
      throw new Error('FacetManager.attach: facetKind must be a non-empty string');
    }
    const facet = this.find(facetKind);
    if (!facet) throw new Error(`FacetManager.attach: facet '${facetKind}' not found`);
    
    // Check if property already exists and is actually a facet (not the API object or other properties)
    if (facetKind in this.#subsystem) {
      const existingValue = this.#subsystem[facetKind];
      // Skip if it's the API object (which has __facets property) - don't overwrite it!
      if (existingValue && typeof existingValue === 'object' && '__facets' in existingValue && existingValue !== facet) {
        // This is the API object, not a facet - skip attachment to avoid overwriting it
        const logger = createSubsystemLogger(this.#subsystem);
        logger.log(`Skipping attachment of facet '${facetKind}' - property name conflicts with subsystem API object`);
        return facet;
      } else if (existingValue === facet) {
        // If it's the same facet instance, no need to re-attach
        return facet;
      } else {
        // Different facet instance - check if we can overwrite
        const canOverwrite = facet.shouldOverwrite?.() === true;
        if (!canOverwrite) {
          throw new Error(`FacetManager.attach: cannot attach '${facetKind}' – property already exists on subsystem and facet does not allow overwrite`);
        }
        // Overwrite allowed - replace the property
      }
    }
    
    this.#subsystem[facetKind] = facet;
    const logger = createSubsystemLogger(this.#subsystem);
    logger.log(`Attached facet '${facetKind}' to subsystem`);
    return facet;
  }

  remove(kind) {
    if (!kind || typeof kind !== 'string') return false;
    if (!this.#facets.has(kind)) return false;
    
    // Dispose all facets of this kind
    const facets = this.#facets.get(kind);
    if (Array.isArray(facets)) {
      for (const facet of facets) {
        try {
          facet?.dispose?.(this.#subsystem);
        } catch {
          // Best-effort disposal
        }
      }
    } else {
      // Legacy: single facet
      try {
        facets?.dispose?.(this.#subsystem);
      } catch {
        // Best-effort disposal
      }
    }
    
    this.#facets.delete(kind);
    if (kind in this.#subsystem) {
      try { delete this.#subsystem[kind]; } catch { /* best-effort cleanup */ }
    }
    return true;
  }

  /**
   * Find a facet by kind and optional orderIndex
   * @param {string} kind - Facet kind to find
   * @param {number} [orderIndex] - Optional order index. If provided, returns facet at that index. If not, returns the last facet (highest orderIndex).
   * @returns {Object|undefined} Facet instance or undefined if not found
   */
  find(kind, orderIndex = undefined) {
    if (!kind || typeof kind !== 'string') return undefined;
    const facets = this.#facets.get(kind);
    if (!facets) return undefined;
    
    // Handle legacy: single facet (not an array)
    if (!Array.isArray(facets)) {
      return facets;
    }
    
    // If orderIndex is provided, find facet with that exact orderIndex
    if (orderIndex !== undefined) {
      if (typeof orderIndex !== 'number' || orderIndex < 0 || !Number.isInteger(orderIndex)) {
        return undefined;
      }
      return facets.find(f => f.orderIndex === orderIndex);
    }
    
    // Otherwise, return the facet with the highest orderIndex
    // (null/undefined orderIndex values are treated as -Infinity)
    if (facets.length === 0) return undefined;
    let maxFacet = facets[0];
    let maxIndex = maxFacet.orderIndex ?? -Infinity;
    for (const facet of facets) {
      const idx = facet.orderIndex ?? -Infinity;
      if (idx > maxIndex) {
        maxIndex = idx;
        maxFacet = facet;
      }
    }
    return maxFacet;
  }
  
  /**
   * Get a facet by its index in the array of facets of that kind
   * @param {string} kind - Facet kind to find
   * @param {number} index - Zero-based index in the array of facets of this kind
   * @returns {Object|undefined} Facet instance or undefined if not found
   */
  getByIndex(kind, index) {
    if (!kind || typeof kind !== 'string') return undefined;
    if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      return undefined;
    }
    const facets = this.#facets.get(kind);
    if (!facets) return undefined;
    
    // Handle legacy: single facet (not an array)
    if (!Array.isArray(facets)) {
      return index === 0 ? facets : undefined;
    }
    
    // Return facet at the specified index
    return facets[index];
  }
  has(kind) { if (!kind || typeof kind !== 'string') return false; return this.#facets.has(kind); }
  
  /**
   * Get the count of facets of the given kind
   * @param {string} kind - Facet kind to check
   * @returns {number} Number of facets of this kind (0 if none, 1 if single, >1 if multiple)
   */
  getCount(kind) {
    if (!kind || typeof kind !== 'string') return 0;
    const facets = this.#facets.get(kind);
    if (!facets) return 0;
    
    // Handle legacy: single facet (not an array)
    if (!Array.isArray(facets)) {
      return 1;
    }
    
    return facets.length;
  }
  
  /**
   * Check if there are multiple facets of the given kind
   * @param {string} kind - Facet kind to check
   * @returns {boolean} True if there are multiple facets of this kind, false otherwise
   */
  hasMultiple(kind) {
    return this.getCount(kind) > 1;
  }
  
  getAllKinds() { return [...this.#facets.keys()]; }
  
  /**
   * Get all facets of a specific kind, or all facets grouped by kind.
   * @param {string} [kind] - Optional facet kind to retrieve. If provided, returns array of facets for that kind.
   * @returns {Array<Object>|Object} If kind is provided, returns array of facets. Otherwise returns map of kind -> last facet (for backward compatibility).
   */
  getAll(kind) {
    // If kind is provided, return array of facets for that kind
    if (kind !== undefined) {
      if (!kind || typeof kind !== 'string') return [];
      const facets = this.#facets.get(kind);
      if (!facets) return [];
      return Array.isArray(facets) ? [...facets] : [facets]; // Return a copy to prevent external modification
    }
    
    // Return map of kind -> last facet (for backward compatibility)
    const result = {};
    for (const [k, facets] of this.#facets.entries()) {
      if (Array.isArray(facets)) {
        result[k] = facets.length > 0 ? facets[facets.length - 1] : undefined;
      } else {
        result[k] = facets;
      }
    }
    return result;
  }
  size() {
    // Count unique kinds (not total facets)
    return this.#facets.size;
  }
  
  clear() {
    // Dispose all facets before clearing
    for (const [, facets] of this.#facets.entries()) {
      if (Array.isArray(facets)) {
        for (const facet of facets) {
          try {
            facet?.dispose?.(this.#subsystem);
          } catch {
            // Best-effort disposal
          }
        }
      } else {
        // Legacy: single facet
        try {
          facets?.dispose?.(this.#subsystem);
        } catch {
          // Best-effort disposal
        }
      }
    }
    this.#facets.clear();
  }

  /** Legacy helper (kept for compatibility) */
  async initAll(subsystem) {
    for (const [, facet] of this.#facets) {
      if (typeof facet.init === 'function') {
        await facet.init(subsystem);
      }
    }
  }

  /** Dispose all facets; best-effort */
  async disposeAll(subsystem) {
    const errors = [];
    for (const [kind, facets] of this.#facets) {
      if (Array.isArray(facets)) {
        for (const facet of facets) {
          if (typeof facet.dispose === 'function') {
            try { 
              // facet.dispose() will handle instrumentation internally
              await facet.dispose(subsystem);
            }
            catch (e) { errors.push({ kind, error: e }); }
          }
        }
      } else {
        // Legacy: single facet
        if (typeof facets.dispose === 'function') {
          try { 
            // facet.dispose() will handle instrumentation internally
            await facets.dispose(subsystem);
          }
          catch (e) { errors.push({ kind, error: e }); }
        }
      }
    }
    if (errors.length) {
      const logger = createSubsystemLogger(subsystem);
      logger.error('Some facets failed to dispose', errors);
    }
    this.clear();
  }

  [Symbol.iterator]() { return this.#facets[Symbol.iterator](); }
}

