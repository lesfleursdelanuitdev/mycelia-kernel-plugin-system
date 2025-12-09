/**
 * Instrumentation Utilities
 * 
 * Provides timing instrumentation for debugging build, initialization, and disposal phases.
 * Helps identify slow hooks and facets when debugging performance issues.
 */

import { createSubsystemLogger } from './logger.js';

/**
 * Default thresholds for timing warnings (in milliseconds)
 */
const DEFAULT_THRESHOLDS = {
  hookExecution: 50,    // Warn if hook execution takes > 50ms
  facetInit: 100,       // Warn if facet init takes > 100ms
  facetDispose: 50,      // Warn if facet dispose takes > 50ms
};

/**
 * Check if instrumentation is enabled
 * 
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {boolean} True if instrumentation is enabled
 */
export function isInstrumentationEnabled(subsystem) {
  // Enable if debug is on, or if instrumentation is explicitly enabled
  return subsystem?.debug === true || subsystem?.ctx?.instrumentation === true;
}

/**
 * Get timing thresholds from config or use defaults
 * 
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {Object} Thresholds object
 */
function getThresholds(subsystem) {
  const config = subsystem?.ctx?.config?.instrumentation || {};
  return {
    hookExecution: config.hookExecutionThreshold ?? DEFAULT_THRESHOLDS.hookExecution,
    facetInit: config.facetInitThreshold ?? DEFAULT_THRESHOLDS.facetInit,
    facetDispose: config.facetDisposeThreshold ?? DEFAULT_THRESHOLDS.facetDispose,
  };
}

/**
 * Time a hook execution and log if it exceeds threshold
 * 
 * @param {Function} hook - Hook function to execute
 * @param {Object} resolvedCtx - Resolved context
 * @param {Object} api - Subsystem API
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {*} Result of hook execution
 */
export function instrumentHookExecution(hook, resolvedCtx, api, subsystem) {
  if (!isInstrumentationEnabled(subsystem)) {
    // No instrumentation - just execute
    return hook(resolvedCtx, api, subsystem);
  }

  const logger = createSubsystemLogger(subsystem);
  const hookKind = hook.kind || '<unknown>';
  const hookSource = hook.source || '<unknown>';
  const thresholds = getThresholds(subsystem);

  const start = performance.now();
  let result;
  try {
    result = hook(resolvedCtx, api, subsystem);
  } finally {
    const duration = performance.now() - start;
    
    if (duration > thresholds.hookExecution) {
      logger.warn(
        `⚠️  Slow hook execution: '${hookKind}' took ${duration.toFixed(2)}ms ` +
        `(threshold: ${thresholds.hookExecution}ms) [${hookSource}]`
      );
    } else {
      logger.log(`✓ Hook '${hookKind}' executed in ${duration.toFixed(2)}ms [${hookSource}]`);
    }
  }

  return result;
}

/**
 * Time a facet initialization callback and log if it exceeds threshold
 * 
 * @param {Facet} facet - Facet instance
 * @param {Object} ctx - Context object
 * @param {Object} api - Subsystem API
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @param {Function} initCallback - The init callback to execute
 * @returns {Promise<void>}
 */
export async function instrumentFacetInit(facet, ctx, api, subsystem, initCallback) {
  if (!initCallback) {
    return;
  }

  if (!isInstrumentationEnabled(subsystem)) {
    // No instrumentation - call callback directly
    return initCallback({ ctx, api, subsystem, facet });
  }

  const logger = createSubsystemLogger(subsystem);
  const facetKind = facet.getKind?.() || '<unknown>';
  const facetSource = facet.getSource?.() || '<unknown>';
  const thresholds = getThresholds(subsystem);

  const start = performance.now();
  try {
    await initCallback({ ctx, api, subsystem, facet });
  } finally {
    const duration = performance.now() - start;
    
    if (duration > thresholds.facetInit) {
      logger.warn(
        `⚠️  Slow facet initialization: '${facetKind}' took ${duration.toFixed(2)}ms ` +
        `(threshold: ${thresholds.facetInit}ms) [${facetSource}]`
      );
    } else {
      logger.log(`✓ Facet '${facetKind}' initialized in ${duration.toFixed(2)}ms [${facetSource}]`);
    }
  }
}

/**
 * Time a facet disposal callback and warn if it exceeds threshold
 * 
 * @param {Facet} facet - Facet instance
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @param {Function} disposeCallback - The dispose callback to execute
 * @returns {Promise<void>}
 */
export async function instrumentDisposeCallback(facet, subsystem, disposeCallback) {
  if (!disposeCallback) {
    return;
  }

  if (!isInstrumentationEnabled(subsystem)) {
    // No instrumentation - call callback directly
    return disposeCallback(facet);
  }

  const logger = createSubsystemLogger(subsystem);
  const facetKind = facet.getKind?.() || '<unknown>';
  const facetSource = facet.getSource?.() || '<unknown>';
  const thresholds = getThresholds(subsystem);

  const start = performance.now();
  try {
    await disposeCallback(facet);
  } finally {
    const duration = performance.now() - start;
    
    if (duration > thresholds.facetDispose) {
      logger.warn(
        `⚠️  Slow facet disposal: '${facetKind}' took ${duration.toFixed(2)}ms ` +
        `(threshold: ${thresholds.facetDispose}ms) [${facetSource}]`
      );
    } else {
      logger.log(`✓ Facet '${facetKind}' disposed in ${duration.toFixed(2)}ms [${facetSource}]`);
    }
  }
}

/**
 * Time the entire build phase and log summary
 * 
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @param {Function} buildFn - Build function to execute
 * @returns {Promise<void>}
 */
export async function instrumentBuildPhase(subsystem, buildFn) {
  if (!isInstrumentationEnabled(subsystem)) {
    // No instrumentation - just build
    return buildFn();
  }

  const logger = createSubsystemLogger(subsystem);
  const start = performance.now();
  
  try {
    await buildFn();
  } finally {
    const duration = performance.now() - start;
    logger.log(`📦 Build phase completed in ${duration.toFixed(2)}ms`);
  }
}

