/**
 * base-subsystem.utils.js
 * 
 * Hierarchy lifecycle utilities for collecting, building, and disposing child subsystems.
 * These are read-only helpers that work with or without the useHierarchy facet.
 */

// Constant for hierarchy facet kind (used if hierarchy facet is available)
const HIERARCHY_KIND = 'hierarchy';

/**
 * Collects all children from a parent subsystem.
 * 
 * Prefers useHierarchy facet → registry, with fallbacks to Map or array.
 * 
 * @param {object} parent - The parent subsystem
 * @returns {object[]} Array of child subsystem instances
 * 
 * @example
 * const children = collectChildren(parent);
 * console.log(`Parent has ${children.length} children`);
 */
export function collectChildren(parent) {
  if (!parent || typeof parent !== 'object') {
    return [];
  }

  // Prefer useHierarchy facet → registry
  const hierarchy = parent.find?.(HIERARCHY_KIND);
  const reg = hierarchy?.children || parent.children;
  
  if (!reg) {
    return [];
  }

  // Try registry's list() method (ChildSubsystemRegistry)
  if (typeof reg.list === 'function') {
    return reg.list();
  }

  // Fallback to Map
  if (reg instanceof Map) {
    return Array.from(reg.values());
  }

  // Fallback to array
  if (Array.isArray(reg)) {
    return reg;
  }

  return [];
}

/**
 * Builds all child subsystems of a parent.
 * 
 * Iterates through children and calls build() on each if not already built.
 * Parent's ctx should already be fully resolved.
 * 
 * @param {object} parent - The parent subsystem
 * @returns {Promise<void>}
 * 
 * @example
 * await buildChildren(parent);
 * console.log('All children built');
 */
export async function buildChildren(parent) {
  const children = collectChildren(parent);
  
  for (const child of children) {
    if (child && typeof child.build === 'function' && !child._isBuilt) {
      // Merge parent context into child context
      if (!child.ctx) {
        child.ctx = {};
      }
      child.ctx.parent = parent.ctx;
      child.ctx.graphCache = parent.ctx.graphCache;
      await child.build(); // parent.ctx is now accessible via child.ctx.parent
    }
  }
}

/**
 * Disposes all child subsystems of a parent.
 * 
 * Disposes children in reverse order (bottom-up) for proper cleanup.
 * Deep trees recurse via child.dispose().
 * 
 * @param {object} parent - The parent subsystem
 * @returns {Promise<void>}
 * 
 * @example
 * await disposeChildren(parent);
 * console.log('All children disposed');
 */
export async function disposeChildren(parent) {
  const children = collectChildren(parent);
  
  // Bottom-up: reverse shallow order; deep trees recurse via child.dispose()
  for (const child of [...children].reverse()) {
    if (child && typeof child.dispose === 'function') {
      await child.dispose();
    }
  }
}

