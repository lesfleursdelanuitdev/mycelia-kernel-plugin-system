/**
 * Dependency Graph Utilities
 * 
 * Handles building dependency graphs and topological sorting for facet ordering.
 */

/**
 * Create cache key from sorted facet kinds
 * 
 * @param {string[]} kinds - Array of facet kinds
 * @returns {string} Cache key (sorted, comma-separated)
 */
export function createCacheKey(kinds) {
  return [...kinds].sort().join(',');
}

/**
 * Build a dependency graph from hook metadata and facet dependencies.
 * 
 * @param {Object} hooksByKind - Object mapping hook kinds to hook metadata
 * @param {Object} facetsByKind - Object mapping facet kinds to Facet instances
 * @param {BaseSubsystem} subsystem - Subsystem instance (optional, for future use)
 * @returns {Object} Dependency graph with { graph, indeg, kinds }
 */
export function buildDepGraph(hooksByKind, facetsByKind, subsystem = null) {
  const kinds = Object.keys(facetsByKind);
  const graph = new Map(); // dep -> Set(of dependents)
  const indeg = new Map(); // kind -> indegree

  for (const k of kinds) {
    graph.set(k, new Set());
    indeg.set(k, 0);
  }

  // First, add dependencies from hook metadata (hook.required)
  // hooksByKind now contains arrays of hooks per kind
  for (const [kind, hookList] of Object.entries(hooksByKind)) {
    if (!Array.isArray(hookList)) continue;
    
    // Use the last hook's metadata for dependency graph (most recent/enhanced version)
    // The dependency graph is for facets, not hooks, so we use the final facet's dependencies
    const lastHook = hookList[hookList.length - 1];
    const hookDeps = (lastHook?.required && Array.isArray(lastHook.required)) ? lastHook.required : [];
    const hookOverwrite = lastHook?.overwrite === true;
    
    for (const dep of hookDeps) {
      // Skip self-dependency for overwrite hooks (they need the original facet to exist,
      // but they're replacing it, so no cycle in facet dependency graph)
      if (dep === kind && hookOverwrite) {
        // Still validate that the facet exists (the overwrite hook needs it)
        if (!facetsByKind[dep]) {
          const src = lastHook?.source || kind;
          throw new Error(`Hook '${kind}' (from ${src}) requires missing facet '${dep}'.`);
        }
        // But don't add the dependency edge (no cycle in facet graph)
        continue;
      }
      if (!facetsByKind[dep]) {
        const src = lastHook?.source || kind;
        throw new Error(`Hook '${kind}' (from ${src}) requires missing facet '${dep}'.`);
      }
      if (!graph.get(dep).has(kind)) {
        graph.get(dep).add(kind);
        indeg.set(kind, (indeg.get(kind) || 0) + 1);
      }
    }
  }

  // Then, add dependencies from facet metadata (facet.getDependencies())
  for (const [kind, facet] of Object.entries(facetsByKind)) {
    const facetDeps = (typeof facet.getDependencies === 'function' && facet.getDependencies()) || [];
    for (const dep of facetDeps) {
      if (!facetsByKind[dep]) {
        const src = facet.getSource?.() || kind;
        throw new Error(`Facet '${kind}' (from ${src}) depends on missing '${dep}'.`);
      }
      if (!graph.get(dep).has(kind)) {
        graph.get(dep).add(kind);
        indeg.set(kind, (indeg.get(kind) || 0) + 1);
      }
    }
  }

  return { graph, indeg, kinds };
}

/**
 * Kahn topological sort with diagnostics and caching.
 * 
 * @param {Object} graphData - Dependency graph data { graph, indeg, kinds }
 * @param {DependencyGraphCache} graphCache - Optional cache for storing results
 * @param {string} cacheKey - Optional cache key
 * @returns {string[]} Ordered array of facet kinds
 * @throws {Error} If a dependency cycle is detected
 */
export function topoSort({ graph, indeg, kinds }, graphCache = null, cacheKey = null) {
  // Check cache if provided
  if (graphCache && cacheKey) {
    const cached = graphCache.get(cacheKey);
    if (cached) {
      if (cached.valid) {
        return cached.orderedKinds;
      } else {
        throw new Error(cached.error || 'Cached dependency graph error');
      }
    }
  }

  const q = [];
  for (const k of kinds) if ((indeg.get(k) || 0) === 0) q.push(k);

  const ordered = [];
  while (q.length) {
    const n = q.shift();
    ordered.push(n);
    for (const m of graph.get(n)) {
      indeg.set(m, indeg.get(m) - 1);
      if (indeg.get(m) === 0) q.push(m);
    }
  }

  if (ordered.length !== kinds.length) {
    const stuck = kinds.filter(k => (indeg.get(k) || 0) > 0);
    const error = `Facet dependency cycle detected among: ${stuck.join(', ')}`;
    
    // Cache invalid result
    if (graphCache && cacheKey) {
      graphCache.set(cacheKey, false, null, error);
    }
    
    throw new Error(error);
  }

  // Cache valid result
  if (graphCache && cacheKey) {
    graphCache.set(cacheKey, true, ordered, null);
  }

  return ordered;
}

