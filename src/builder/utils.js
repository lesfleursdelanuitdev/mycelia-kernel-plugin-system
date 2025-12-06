import { buildChildren } from '../system/base-subsystem.utils.js';
import { defaultContractRegistry } from '../contract/index.js';
import { resolveCtx } from './context-resolver.js';
import { createCacheKey, buildDepGraph, topoSort } from './dependency-graph.js';
import { validateFacets } from './facet-validator.js';
import {
  extractHookMetadata,
  orderHooksByDependencies,
  executeHooksAndCreateFacets,
  validateHookDependencies,
} from './hook-processor.js';

// Re-export deepMerge for backward compatibility
export { deepMerge } from './context-resolver.js';

/**
 * VERIFY (pure):
 * - resolve ctx (pure)
 * - collect hooks (defaults + user)
 * - instantiate facets
 * - validate + topo-sort (with caching)
 */
export function verifySubsystemBuild(subsystem, ctx = {}, graphCache = null) {
  const resolvedCtx = resolveCtx(subsystem, ctx);

  // Check whether the defaults are defined as a DefaultHooks instance or an array of hooks. 
  // If it's a DefaultHooks instance, use the list() method to get the array of hooks. 
  const defaults = Array.isArray(subsystem.defaultHooks)
    ? subsystem.defaultHooks
    : (subsystem.defaultHooks?.list?.() || []);

  const user = Array.isArray(subsystem.hooks) ? subsystem.hooks : [];
  const hooks = [...defaults, ...user];

  // Extract hook metadata
  const hooksByKind = extractHookMetadata(hooks);

  // Order hooks based on dependencies
  const orderedHooks = orderHooksByDependencies(hooks);

  // Execute hooks and create facets
  const { facetsByKind } = executeHooksAndCreateFacets(orderedHooks, resolvedCtx, subsystem, hooksByKind);

  // Validate facets against their contracts (before dependency graph building)
  validateFacets(facetsByKind, resolvedCtx, subsystem, defaultContractRegistry);

  // Validate hook.required dependencies exist
  validateHookDependencies(hooksByKind, facetsByKind, subsystem);

  // Create cache key from sorted facet kinds
  const kinds = Object.keys(facetsByKind);
  const cacheKey = graphCache ? createCacheKey(kinds) : null;

  // Include graphCache in resolvedCtx so it persists through buildSubsystem
  if (graphCache) {
    resolvedCtx.graphCache = graphCache;
  }

  // Check cache before building graph
  if (graphCache && cacheKey) {
    const cached = graphCache.get(cacheKey);
    if (cached) {
      if (cached.valid) {
        // Return cached result (skip graph building and sorting)
        return { resolvedCtx, orderedKinds: cached.orderedKinds, facetsByKind, graphCache };
      } else {
        // Throw cached error
        throw new Error(cached.error || 'Cached dependency graph error');
      }
    }
  }

  // Build graph and sort (will cache result in topoSort)
  const graph = buildDepGraph(hooksByKind, facetsByKind, subsystem);
  const orderedKinds = topoSort(graph, graphCache, cacheKey);

  return { resolvedCtx, orderedKinds, facetsByKind, graphCache };
}

/**
 * EXECUTE (transactional):
 * - assign resolved ctx
 * - add/init/attach facets via FacetManager.addMany
 * - build children
 */
export async function buildSubsystem(subsystem, plan) {
  if (!plan) throw new Error('buildSubsystem: invalid plan');
  const { resolvedCtx, orderedKinds, facetsByKind } = plan;
  if (!Array.isArray(orderedKinds)) throw new Error('buildSubsystem: invalid plan');
  if (!facetsByKind || typeof facetsByKind !== 'object' || Array.isArray(facetsByKind)) throw new Error('buildSubsystem: invalid plan');
  
  // Validate consistency: if one is non-empty, the other must match
  const hasOrderedKinds = orderedKinds.length > 0;
  const hasFacetsByKind = Object.keys(facetsByKind).length > 0;
  
  // If orderedKinds is empty but facetsByKind has items, that's invalid
  if (!hasOrderedKinds && hasFacetsByKind) throw new Error('buildSubsystem: invalid plan');
  // If facetsByKind is empty but orderedKinds has items, that's invalid
  if (hasOrderedKinds && !hasFacetsByKind) throw new Error('buildSubsystem: invalid plan');
  // Both empty is valid (no facets to add)

  subsystem.ctx = resolvedCtx;

  // Separate facets into new and overwrite
  const facetsToAdd = {};
  const kindsToAdd = [];
  const facetsToOverwrite = {};
  const kindsToOverwrite = [];
  
  for (const kind of orderedKinds) {
    const facet = facetsByKind[kind];
    const existingFacet = subsystem.api.__facets.find(kind);
    
    if (!existingFacet) {
      // New facet - add normally
      facetsToAdd[kind] = facet;
      kindsToAdd.push(kind);
    } else if (existingFacet === facet) {
      // Same facet instance - this was added during verify phase for dependency lookups
      // It needs to be properly initialized/attached, so add it
      facetsToAdd[kind] = facet;
      kindsToAdd.push(kind);
    } else {
      // Different facet instance - check if we can overwrite
      const canOverwrite = facet.shouldOverwrite?.() === true;
      if (canOverwrite) {
        // Remove old facet first, then add new one
        facetsToOverwrite[kind] = facet;
        kindsToOverwrite.push(kind);
      } else {
        // Cannot overwrite - skip (keep existing)
        continue;
      }
    }
  }

  // First, remove overwritten facets
  for (const kind of kindsToOverwrite) {
    subsystem.api.__facets.remove(kind);
    // Also remove from subsystem property if it exists
    if (kind in subsystem) {
      try {
        delete subsystem[kind];
      } catch {
        // Best-effort cleanup
      }
    }
  }

  // Then add all facets (new + overwritten)
  const allFacets = { ...facetsToAdd, ...facetsToOverwrite };
  const allKinds = [...kindsToAdd, ...kindsToOverwrite];
  
  if (allKinds.length > 0) {
    await subsystem.api.__facets.addMany(allKinds, allFacets, {
      init: true,
      attach: true,
      ctx: resolvedCtx,
      api: subsystem.api
    });
  }

  await buildChildren(subsystem);
}

