/**
 * Debug Flag Utilities
 * 
 * Provides standardized debug flag extraction from configuration and context.
 */

/**
 * Extract debug flag from config and context with proper fallback chain.
 * 
 * Checks in order:
 * 1. config.debug (if explicitly set, including false)
 * 2. ctx.debug (if available)
 * 3. false (default)
 * 
 * @param {Object} config - Facet-specific configuration object (may be undefined)
 * @param {Object} ctx - Context object with debug flag (may be undefined)
 * @returns {boolean} Debug flag value
 * 
 * @example
 * ```javascript
 * const config = ctx.config?.router || {};
 * const debug = getDebugFlag(config, ctx);
 * ```
 */
export function getDebugFlag(config, ctx) {
  if (config?.debug !== undefined) {
    return !!config.debug;
  }
  if (ctx?.debug !== undefined) {
    return !!ctx.debug;
  }
  return false;
}

