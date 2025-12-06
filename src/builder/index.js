export { SubsystemBuilder } from './subsystem-builder.js';
export { DependencyGraphCache } from './dependency-graph-cache.js';
export { buildDepGraph, topoSort, createCacheKey } from './dependency-graph.js';
export { validateFacets } from './facet-validator.js';
export { resolveCtx, deepMerge } from './context-resolver.js';
export { 
  extractHookMetadata,
  orderHooksByDependencies,
  executeHooksAndCreateFacets,
  validateHookDependencies
} from './hook-processor.js';
export { verifySubsystemBuild, buildSubsystem, deepMerge as deepMergeUtils } from './utils.js';

