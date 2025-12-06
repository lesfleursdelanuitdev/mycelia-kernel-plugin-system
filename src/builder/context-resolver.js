/**
 * Context Resolver Utilities
 * 
 * Handles context resolution and deep merging for subsystem building.
 */

/**
 * Deep merge helper for objects (only merges plain objects, not arrays or other types)
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
export function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      // Deep merge if both are plain objects (not arrays, null, or other types)
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        // Override with source value
        result[key] = sourceValue;
      }
    }
  }
  return result;
}

/**
 * Pure ctx resolver (verification stays side-effect free).
 * 
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @param {Object} ctx - Additional context to merge
 * @returns {Object} Resolved context object
 */
export function resolveCtx(subsystem, ctx) {
  const base = (subsystem.ctx && typeof subsystem.ctx === 'object') ? subsystem.ctx : {};
  const extra = (ctx && typeof ctx === 'object') ? ctx : {};
  
  // Deep merge ctx.config specifically, shallow merge everything else
  const merged = { ...base, ...extra };
  
  // If both have config objects, deep merge them
  if (base.config && typeof base.config === 'object' && 
      extra.config && typeof extra.config === 'object' &&
      !Array.isArray(base.config) && !Array.isArray(extra.config)) {
    merged.config = deepMerge(base.config, extra.config);
  }
  
  return merged;
}

