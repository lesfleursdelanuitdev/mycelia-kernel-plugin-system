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
import { instrumentBuildPhase } from '../utils/instrumentation.js';

// Re-export deepMerge for backward compatibility
export { deepMerge } from './context-resolver.js';

/**
 * VERIFY (pure, side-effect-free):
 * 
 * This is the first phase of the two-phase build process. It:
 * 1. Resolves context (pure operation)
 * 2. Collects hooks (defaults + user)
 * 3. Orders hooks by dependencies (topological sort)
 * 4. Executes hooks to create facets (temporary, for dependency lookups)
 * 5. Validates facets against contracts
 * 6. Builds dependency graph and sorts facets (with caching)
 * 
 * Key property: This phase is pure - it doesn't mutate the subsystem state.
 * Facets are temporarily added to api.__facets for dependency lookups only.
 * 
 * @param {BaseSubsystem} subsystem - Subsystem to verify
 * @param {Object} ctx - Context to merge
 * @param {DependencyGraphCache} graphCache - Optional cache for dependency graphs
 * @returns {Object} Build plan with { resolvedCtx, orderedKinds, facetsByKind, graphCache }
 */
export function verifySubsystemBuild(subsystem, ctx = {}, graphCache = null) {
  // Step 1: Resolve context (deep merge with subsystem.ctx)
  const resolvedCtx = resolveCtx(subsystem, ctx);

  // Step 2: Collect all hooks (defaults + user)
  // Check whether the defaults are defined as a DefaultHooks instance or an array of hooks. 
  // If it's a DefaultHooks instance, use the list() method to get the array of hooks. 
  const defaults = Array.isArray(subsystem.defaultHooks)
    ? subsystem.defaultHooks
    : (subsystem.defaultHooks?.list?.() || []);

  const user = Array.isArray(subsystem.hooks) ? subsystem.hooks : [];
  const hooks = [...defaults, ...user];

  // Step 3: Extract hook metadata (kind, required, overwrite, etc.)
  const hooksByKind = extractHookMetadata(hooks);

  // Step 4: Order hooks based on their dependencies (topological sort)
  // This ensures hooks are executed in the correct order
  const orderedHooks = orderHooksByDependencies(hooks);

  // Step 5: Execute hooks and create facets
  // Facets are created here temporarily so later hooks can access them via subsystem.find()
  // They will be properly initialized/attached in the execute phase
  const { facetsByKind } = executeHooksAndCreateFacets(orderedHooks, resolvedCtx, subsystem, hooksByKind);

  // Step 6: Validate facets against their contracts (before dependency graph building)
  // This ensures all facets satisfy their declared contracts
  validateFacets(facetsByKind, resolvedCtx, subsystem, defaultContractRegistry);

  // Step 7: Validate hook.required dependencies exist
  // Double-check that all declared dependencies are satisfied
  validateHookDependencies(hooksByKind, facetsByKind, subsystem);

  // Step 8: Create cache key from sorted facet kinds
  // This key is used to cache the dependency graph computation
  const kinds = Object.keys(facetsByKind);
  const cacheKey = graphCache ? createCacheKey(kinds) : null;

  // Include graphCache in resolvedCtx so it persists through buildSubsystem
  if (graphCache) {
    resolvedCtx.graphCache = graphCache;
  }

  // Step 9: Check cache before building graph
  // If we've computed this dependency graph before, reuse the result
  if (graphCache && cacheKey) {
    const cached = graphCache.get(cacheKey);
    if (cached) {
      if (cached.valid) {
        // Return cached result (skip graph building and sorting)
        // This significantly speeds up repeated builds with the same dependency structure
        return { resolvedCtx, orderedKinds: cached.orderedKinds, facetsByKind, graphCache };
      } else {
        // Throw cached error (don't recompute known-invalid graph)
        throw new Error(cached.error || 'Cached dependency graph error');
      }
    }
  }

  // Step 10: Build dependency graph and sort facets
  // This computes the initialization order based on facet dependencies
  // The result will be cached in topoSort for future use
  const graph = buildDepGraph(hooksByKind, facetsByKind, subsystem);
  const orderedKinds = topoSort(graph, graphCache, cacheKey);

  return { resolvedCtx, orderedKinds, facetsByKind, graphCache };
}

/**
 * EXECUTE (transactional):
 * 
 * This is the second phase of the two-phase build process. It:
 * 1. Assigns resolved context to subsystem
 * 2. Separates facets into new vs overwrite
 * 3. Removes overwritten facets
 * 4. Adds/initializes/attaches facets via FacetManager.addMany (transactional)
 * 5. Builds child subsystems recursively
 * 
 * Key property: This phase is transactional - if any step fails, all changes are rolled back.
 * Facets are properly initialized (onInit callbacks) and attached to the subsystem.
 * 
 * @param {BaseSubsystem} subsystem - Subsystem to build
 * @param {Object} plan - Build plan from verifySubsystemBuild
 */
export async function buildSubsystem(subsystem, plan) {
  // Instrument the build phase if enabled
  return instrumentBuildPhase(subsystem, async () => {
    return buildSubsystemInternal(subsystem, plan);
  });
}

async function buildSubsystemInternal(subsystem, plan) {
  if (!plan) throw new Error('buildSubsystem: invalid plan');
  const { resolvedCtx, orderedKinds, facetsByKind } = plan;
  if (!Array.isArray(orderedKinds)) throw new Error('buildSubsystem: invalid plan');
  if (!facetsByKind || typeof facetsByKind !== 'object' || Array.isArray(facetsByKind)) throw new Error('buildSubsystem: invalid plan');
  
  // Validate consistency: if one is non-empty, the other must match
  // This ensures the plan is internally consistent
  const hasOrderedKinds = orderedKinds.length > 0;
  const hasFacetsByKind = Object.keys(facetsByKind).length > 0;
  
  // If orderedKinds is empty but facetsByKind has items, that's invalid
  if (!hasOrderedKinds && hasFacetsByKind) throw new Error('buildSubsystem: invalid plan');
  // If facetsByKind is empty but orderedKinds has items, that's invalid
  if (hasOrderedKinds && !hasFacetsByKind) throw new Error('buildSubsystem: invalid plan');
  // Both empty is valid (no facets to add)

  // Step 1: Assign resolved context to subsystem
  subsystem.ctx = resolvedCtx;

  // Step 2: Separate facets into new and overwrite categories
  // This allows us to handle overwrites correctly (remove old, add new)
  const facetsToAdd = {};
  const kindsToAdd = [];
  const facetsToOverwrite = {};
  const kindsToOverwrite = [];
  
  // Process facets in dependency order (from topological sort)
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
      // This handles the case where facets are temporarily added in verify phase
      facetsToAdd[kind] = facet;
      kindsToAdd.push(kind);
    } else {
      // Different facet instance - check if we can overwrite
      const canOverwrite = facet.shouldOverwrite?.() === true;
      if (canOverwrite) {
        // Mark for overwrite: remove old facet first, then add new one
        facetsToOverwrite[kind] = facet;
        kindsToOverwrite.push(kind);
      } else {
        // Cannot overwrite - skip (keep existing)
        continue;
      }
    }
  }

  // Step 3: Remove overwritten facets first (before adding new ones)
  // This ensures clean state before adding replacements
  for (const kind of kindsToOverwrite) {
    subsystem.api.__facets.remove(kind);
    // Also remove from subsystem property if it exists
    if (kind in subsystem) {
      try {
        delete subsystem[kind];
      } catch {
        // Best-effort cleanup (property might be non-configurable)
      }
    }
  }

  // Step 4: Add all facets (new + overwritten) in a single transactional operation
  // This ensures atomicity - if any facet fails to initialize, all are rolled back
  const allFacets = { ...facetsToAdd, ...facetsToOverwrite };
  const allKinds = [...kindsToAdd, ...kindsToOverwrite];
  
  if (allKinds.length > 0) {
    // addMany is transactional - it will:
    // 1. Register all facets
    // 2. Initialize them (call onInit callbacks) in parallel within dependency levels
    // 3. Attach them to the subsystem
    // 4. Roll back everything if any initialization fails
    await subsystem.api.__facets.addMany(allKinds, allFacets, {
      init: true,
      attach: true,
      ctx: resolvedCtx,
      api: subsystem.api
    });
  }

  // Step 5: Build child subsystems recursively
  // This allows nested plugin systems with their own dependency graphs
  await buildChildren(subsystem);
}

