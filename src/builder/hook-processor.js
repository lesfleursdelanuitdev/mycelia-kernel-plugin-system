/**
 * Hook Processor Utilities
 * 
 * Handles hook ordering, execution, and facet creation during subsystem verification.
 */

import { Facet } from '../core/facet.js';

/**
 * Order hooks based on their dependencies using topological sort.
 * 
 * Handles multiple hooks per kind by assigning unique IDs and creating
 * dependencies between overwrite hooks and their predecessors.
 * 
 * @param {Array} hooks - Array of hook functions
 * @returns {Array} Ordered array of hooks
 */
export function orderHooksByDependencies(hooks) {
  // Extract hook metadata (now returns arrays per kind)
  const hooksByKind = extractHookMetadata(hooks);
  
  // Flatten to get all hooks with unique IDs
  const hookArray = [];
  const hookIdMap = new Map(); // hookId -> { hook, kind, required, overwrite, index }
  const kindToHookIds = new Map(); // kind -> [hookId1, hookId2, ...]
  
  // Assign unique IDs to each hook
  for (const [kind, hookList] of Object.entries(hooksByKind)) {
    const hookIds = [];
    for (const hookMeta of hookList) {
      const hookId = `${kind}:${hookMeta.index}`; // e.g., "router:0", "router:1"
      hookArray.push({
        hookId,
        hook: hookMeta.hook,
        kind,
        required: hookMeta.required,
        overwrite: hookMeta.overwrite,
        index: hookMeta.index
      });
      hookIdMap.set(hookId, hookArray[hookArray.length - 1]);
      hookIds.push(hookId);
    }
    kindToHookIds.set(kind, hookIds);
  }

  // Build dependency graph using hook IDs
  const hookDepGraph = new Map(); // hookId -> Set(dependent hookIds)
  const hookIndeg = new Map(); // hookId -> indegree
  
  // Initialize graph
  for (const { hookId } of hookArray) {
    hookDepGraph.set(hookId, new Set());
    hookIndeg.set(hookId, 0);
  }
  
  // Add edges: if hook A requires kind X, find the hook(s) that create X
  for (const { hookId, kind, required, overwrite, index } of hookArray) {
    for (const depKind of required) {
      const depHookIds = kindToHookIds.get(depKind) || [];
      
      if (depHookIds.length === 0) {
        // Dependency not in our hook list (might be external or not yet created)
        continue;
      }
      
      // If this hook requires its own kind (overwrite scenario)
      if (depKind === kind && overwrite) {
        // Find the previous hook of this kind (the one it's overwriting)
        if (index > 0) {
          const previousHookId = `${kind}:${index - 1}`;
          if (hookIdMap.has(previousHookId)) {
            // Overwrite hook depends on the previous hook of same kind
            hookDepGraph.get(previousHookId).add(hookId);
            hookIndeg.set(hookId, (hookIndeg.get(hookId) || 0) + 1);
          }
        }
        continue; // Skip adding other dependencies for self-kind
      }
      
      // For other dependencies, depend on the LAST hook that creates that kind
      // (the most recent/enhanced version)
      if (depHookIds.length > 0) {
        const lastDepHookId = depHookIds[depHookIds.length - 1];
        hookDepGraph.get(lastDepHookId).add(hookId);
        hookIndeg.set(hookId, (hookIndeg.get(hookId) || 0) + 1);
      }
    }
  }
  
  // Topological sort on hook IDs
  const orderedHookIds = [];
  const queue = [];
  for (const { hookId } of hookArray) {
    if (hookIndeg.get(hookId) === 0) {
      queue.push(hookId);
    }
  }
  
  while (queue.length > 0) {
    const hookId = queue.shift();
    orderedHookIds.push(hookId);
    
    for (const dependent of hookDepGraph.get(hookId)) {
      const newIndeg = hookIndeg.get(dependent) - 1;
      hookIndeg.set(dependent, newIndeg);
      if (newIndeg === 0) {
        queue.push(dependent);
      }
    }
  }
  
  // Build ordered hooks array
  const orderedHooks = [];
  for (const hookId of orderedHookIds) {
    orderedHooks.push(hookIdMap.get(hookId).hook);
  }
  
  // Add any hooks that weren't in the dependency graph (shouldn't happen, but safety)
  for (const { hookId, hook } of hookArray) {
    if (!orderedHookIds.includes(hookId)) {
      orderedHooks.push(hook);
    }
  }

  return orderedHooks;
}

/**
 * Execute hooks and create facets.
 * 
 * @param {Array} orderedHooks - Ordered array of hooks to execute
 * @param {Object} resolvedCtx - Resolved context object
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @param {Object} hooksByKind - Object mapping hook kinds to hook metadata
 * @returns {Object} Object with { facetsByKind, hooksByKind }
 */
export function executeHooksAndCreateFacets(orderedHooks, resolvedCtx, subsystem, hooksByKind) {
  const facetsByKind = Object.create(null);

  // Execute hooks in dependency order and create facets
  for (const hook of orderedHooks) {
    if (typeof hook !== 'function') continue;

    const hookKind = hook.kind;
    const hookSource = hook.source || '<unknown>';

    let facet;
    try {
      facet = hook(resolvedCtx, subsystem.api, subsystem);
    } catch (error) {
      throw new Error(`Hook '${hookKind}' (from ${hookSource}) failed during execution: ${error.message}`);
    }

    if (!facet) continue;

    if (!(facet instanceof Facet)) {
      throw new Error(`Hook '${hookKind}' (from ${hookSource}) did not return a Facet instance (got ${typeof facet}).`);
    }

    const facetKind = facet.getKind?.();
    if (!facetKind || typeof facetKind !== 'string') {
      const facetSrc = facet.getSource?.() || '<unknown>';
      throw new Error(`Facet from hook '${hookKind}' (source: ${hookSource}) missing valid kind (facet source: ${facetSrc}).`);
    }

    // Validate hook.kind matches facet.kind
    if (hookKind !== facetKind) {
      throw new Error(`Hook '${hookKind}' (from ${hookSource}) returned facet with mismatched kind '${facetKind}'.`);
    }

    // Check overwrite permission (also check facet.shouldOverwrite for consistency)
    if (facetsByKind[facetKind]) {
      // Get overwrite permission from the current hook (not stored metadata)
      const currentHookOverwrite = hook.overwrite === true;
      const facetOverwrite = facet.shouldOverwrite?.() === true;
      if (!currentHookOverwrite && !facetOverwrite) {
        const prevSrc = facetsByKind[facetKind].getSource?.() || facetKind;
        throw new Error(`Duplicate facet kind '${facetKind}' from [${prevSrc}] and [${hookSource}]. Neither hook nor facet allows overwrite.`);
      }
      // Allow overwrite - replace the existing facet
      facetsByKind[facetKind] = facet;
    } else {
      facetsByKind[facetKind] = facet;
    }
    
    // Make facet available in api.__facets during verification so later hooks can access it via subsystem.find()
    // This is a temporary registration - facets will be properly added/initialized/attached in buildSubsystem
    if (subsystem.api && subsystem.api.__facets) {
      // Use the Proxy setter to add the facet temporarily (without init/attach)
      subsystem.api.__facets[facetKind] = facet;
    }
  }

  return { facetsByKind };
}

/**
 * Extract hook metadata from hooks array.
 * 
 * Stores multiple hooks per kind in registration order (arrays).
 * This allows overwrite hooks to depend on previous hooks of the same kind.
 * 
 * @param {Array} hooks - Array of hook functions
 * @returns {Object} Object mapping hook kinds to arrays of hook metadata
 *   Each entry: { hook, required, source, overwrite, version, index }
 */
export function extractHookMetadata(hooks) {
  const hooksByKind = Object.create(null);

  for (const hook of hooks) {
    if (typeof hook !== 'function') continue;

    const hookKind = hook.kind;
    const hookVersion = hook.version || '0.0.0';
    const hookOverwrite = hook.overwrite === true;
    const hookRequired = (hook.required && Array.isArray(hook.required)) ? hook.required : [];
    const hookSource = hook.source || '<unknown>';

    if (!hookKind || typeof hookKind !== 'string') {
      throw new Error(`Hook missing valid kind property (source: ${hookSource}).`);
    }

    // Store array of hooks per kind, maintaining registration order
    if (!hooksByKind[hookKind]) {
      hooksByKind[hookKind] = [];
    }
    
    hooksByKind[hookKind].push({
      hook,  // Store the actual hook function
      required: hookRequired,
      source: hookSource,
      overwrite: hookOverwrite,
      version: hookVersion,
      index: hooksByKind[hookKind].length  // Track position in array
    });
  }

  return hooksByKind;
}

/**
 * Validate hook.required dependencies exist.
 * 
 * @param {Object} hooksByKind - Object mapping hook kinds to arrays of hook metadata
 * @param {Object} facetsByKind - Object mapping facet kinds to Facet instances
 * @param {BaseSubsystem} subsystem - Subsystem instance (optional, for future use)
 */
export function validateHookDependencies(hooksByKind, facetsByKind, subsystem) {
  for (const [kind, hookList] of Object.entries(hooksByKind)) {
    if (!Array.isArray(hookList)) continue;
    
    for (const hookMeta of hookList) {
      for (const dep of hookMeta.required) {
        // For self-dependency (overwrite hooks requiring their own kind),
        // check if there's a previous hook of that kind
        if (dep === kind && hookMeta.overwrite) {
          // Check if there's a previous hook (index > 0 means there's a predecessor)
          if (hookMeta.index === 0) {
            throw new Error(`Hook '${kind}' (from ${hookMeta.source}) requires '${dep}' but is the first hook of that kind. Overwrite hooks must come after the hook they overwrite.`);
          }
          // Previous hook exists, dependency is satisfied
          continue;
        }
        if (!facetsByKind[dep]) {
          throw new Error(`Hook '${kind}' (from ${hookMeta.source}) requires missing facet '${dep}'.`);
        }
      }
    }
  }
}

