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
 * Creates a directed graph where:
 * - Vertices = facet kinds
 * - Edges = dependencies (if A depends on B, edge goes from B -> A)
 * 
 * The graph is represented as:
 * - graph: Map<depKind, Set<dependentKinds>> - adjacency list
 * - indeg: Map<kind, number> - in-degree count (how many dependencies)
 * 
 * This graph is used by topological sort to determine initialization order.
 * 
 * @param {Object} hooksByKind - Object mapping hook kinds to hook metadata
 * @param {Object} facetsByKind - Object mapping facet kinds to Facet instances
 * @param {BaseSubsystem} subsystem - Subsystem instance (optional, for future use)
 * @returns {Object} Dependency graph with { graph, indeg, kinds }
 */
export function buildDepGraph(hooksByKind, facetsByKind, subsystem = null) {
  const kinds = Object.keys(facetsByKind);
  
  // Initialize graph data structures:
  // - graph: adjacency list (dep -> Set of dependents)
  // - indeg: in-degree counter (how many incoming edges)
  const graph = new Map(); // dep -> Set(of dependents)
  const indeg = new Map(); // kind -> indegree

  // Initialize all vertices with empty adjacency lists and zero indegree
  for (const k of kinds) {
    graph.set(k, new Set());
    indeg.set(k, 0);
  }

  // Phase 1: Add dependencies from hook metadata (hook.required)
  // hooksByKind now contains arrays of hooks per kind (multiple hooks can create same facet)
  for (const [kind, hookList] of Object.entries(hooksByKind)) {
    if (!Array.isArray(hookList)) continue;
    
    // Use the last hook's metadata for dependency graph (most recent/enhanced version)
    // The dependency graph is for facets, not hooks, so we use the final facet's dependencies
    const lastHook = hookList[hookList.length - 1];
    const hookDeps = (lastHook?.required && Array.isArray(lastHook.required)) ? lastHook.required : [];
    const hookOverwrite = lastHook?.overwrite === true;
    
    // Process each dependency declared by the hook
    for (const dep of hookDeps) {
      // Special case: overwrite hooks may require their own kind
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
      
      // Validate dependency exists
      if (!facetsByKind[dep]) {
        const src = lastHook?.source || kind;
        throw new Error(`Hook '${kind}' (from ${src}) requires missing facet '${dep}'.`);
      }
      
      // Add edge: dep -> kind (if not already present)
      // This means "kind depends on dep", so dep must be initialized first
      if (!graph.get(dep).has(kind)) {
        graph.get(dep).add(kind);
        indeg.set(kind, (indeg.get(kind) || 0) + 1);
      }
    }
  }

  // Phase 2: Add dependencies from facet metadata (facet.getDependencies())
  // Facets can declare additional dependencies at runtime (beyond hook.required)
  for (const [kind, facet] of Object.entries(facetsByKind)) {
    const facetDeps = (typeof facet.getDependencies === 'function' && facet.getDependencies()) || [];
    for (const dep of facetDeps) {
      // Validate dependency exists
      if (!facetsByKind[dep]) {
        const src = facet.getSource?.() || kind;
        throw new Error(`Facet '${kind}' (from ${src}) depends on missing '${dep}'.`);
      }
      
      // Add edge: dep -> kind (if not already present)
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
 * Implements Kahn's algorithm for topological sorting (O(V + E) complexity).
 * This algorithm finds a linear ordering of vertices such that for every directed
 * edge (u, v), vertex u comes before v in the ordering.
 * 
 * Algorithm steps:
 * 1. Find all vertices with no incoming edges (indegree = 0)
 * 2. Add them to a queue
 * 3. Process queue: remove vertex, add to result, decrement indegree of neighbors
 * 4. If any neighbor's indegree becomes 0, add it to the queue
 * 5. If result length < total vertices, a cycle exists
 * 
 * @param {Object} graphData - Dependency graph data { graph, indeg, kinds }
 * @param {DependencyGraphCache} graphCache - Optional cache for storing results
 * @param {string} cacheKey - Optional cache key
 * @returns {string[]} Ordered array of facet kinds
 * @throws {Error} If a dependency cycle is detected
 */
export function topoSort({ graph, indeg, kinds }, graphCache = null, cacheKey = null) {
  // Check cache if provided - avoid recomputing if we've seen this graph before
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

  // Step 1: Initialize queue with all vertices that have no incoming edges
  // These are the "roots" of the dependency graph - they can be processed first
  const q = [];
  for (const k of kinds) {
    if ((indeg.get(k) || 0) === 0) {
      q.push(k);
    }
  }

  // Step 2: Process queue using Kahn's algorithm
  const ordered = [];
  while (q.length) {
    // Remove a vertex with no incoming edges
    const n = q.shift();
    ordered.push(n);
    
    // Step 3: For each neighbor (dependent) of this vertex:
    // - Decrement its indegree (one less dependency to wait for)
    // - If indegree becomes 0, add it to queue (ready to process)
    for (const m of graph.get(n)) {
      const newIndeg = indeg.get(m) - 1;
      indeg.set(m, newIndeg);
      if (newIndeg === 0) {
        q.push(m);
      }
    }
  }

  // Step 4: Check for cycles
  // If we couldn't process all vertices, there's a circular dependency
  // The "stuck" vertices are those still with indegree > 0 (part of a cycle)
  if (ordered.length !== kinds.length) {
    const stuck = kinds.filter(k => (indeg.get(k) || 0) > 0);
    const error = `Facet dependency cycle detected among: ${stuck.join(', ')}`;
    
    // Cache invalid result so we don't recompute the same invalid graph
    if (graphCache && cacheKey) {
      graphCache.set(cacheKey, false, null, error);
    }
    
    throw new Error(error);
  }

  // Step 5: Cache valid result for future use
  // This significantly speeds up repeated builds with the same dependency structure
  if (graphCache && cacheKey) {
    graphCache.set(cacheKey, true, ordered, null);
  }

  return ordered;
}

