import { isValidSemver, getDefaultVersion } from '../utils/semver.js';

/**
 * Hook Factory Function
 * 
 * Creates a hook function with attached metadata describing its behavior.
 * 
 * @param {Object} options - Hook configuration
 * @param {string} options.kind - Facet kind identifier (e.g., 'router', 'queue')
 * @param {string} [options.version='0.0.0'] - Semantic version (e.g., '1.0.0', '2.1.3-alpha')
 * @param {boolean} [options.overwrite=false] - Whether this hook can overwrite an existing hook of the same kind
 * @param {Array<string>} [options.required=[]] - Array of facet kinds this hook depends on
 * @param {boolean} [options.attach=false] - Whether the resulting facet should be attached to the subsystem
 * @param {string} options.source - File location/URL where the hook is defined (e.g., import.meta.url)
 * @param {Function} options.fn - Hook function: (ctx, api, subsystem) => Facet
 * @param {string} [options.contract=null] - Optional contract name (string) for this hook
 * @returns {Function} Hook function with attached metadata
 */
export function createHook({ kind, version, overwrite = false, required = [], attach = false, source, fn, contract = null }) {
  if (!kind || typeof kind !== 'string') {
    throw new Error('createHook: kind must be a non-empty string');
  }
  if (!source || typeof source !== 'string') {
    throw new Error('createHook: source must be a non-empty string');
  }
  if (typeof fn !== 'function') {
    throw new Error('createHook: fn must be a function');
  }
  if (contract !== null && (typeof contract !== 'string' || !contract.trim())) {
    throw new Error('createHook: contract must be a non-empty string or null');
  }

  // Validate version if provided, otherwise use default
  const hookVersion = version || getDefaultVersion();
  if (!isValidSemver(hookVersion)) {
    throw new Error(
      `createHook: invalid semver version "${hookVersion}" for hook "${kind}". ` +
      'Must follow format: MAJOR.MINOR.PATCH (e.g., "1.0.0", "2.1.3-alpha")'
    );
  }

  const hook = function(ctx, api, subsystem) {
    // Pass contract name and version to hook function via context
    const hookCtx = { 
      ...ctx, 
      __contract: contract || null,
      __version: hookVersion
    };
    return fn(hookCtx, api, subsystem);
  };

  // Attach metadata to the hook function
  hook.kind = kind;
  hook.version = hookVersion;
  hook.overwrite = overwrite;
  hook.required = Array.isArray(required) ? [...required] : [];
  hook.attach = attach;
  hook.source = source;
  hook.contract = contract || null;

  return hook;
}

