/**
 * Listener Manager Policies
 * 
 * Pure functions that implement different listener registration policies.
 * Each policy function takes existing listeners and returns new listener state.
 * 
 * @example
 * // Multiple listeners allowed
 * const result = multiplePolicy([handler1], 'layers/create', handler2, options);
 * // result.listeners = [handler1, handler2]
 * 
 * @example
 * // Only one listener allowed
 * const result = singlePolicy([handler1], 'layers/create', handler2, options);
 * // result.success = false, result.error = "Only one listener allowed..."
 */

/**
 * Multiple Policy - Allow multiple listeners per path
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @returns {Object} Registration result
 */
export function multiplePolicy(existingListeners, path, handler, options) {
  return {
    success: true,
    listeners: [...existingListeners, handler],
    error: null
  };
}

/**
 * Single Policy - Only allow one listener per path
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @returns {Object} Registration result
 */
export function singlePolicy(existingListeners, path, handler, options) {
  if (existingListeners.length > 0) {
    return {
      success: false,
      listeners: existingListeners,
      error: `Only one listener allowed for path '${path}' with 'single' policy`
    };
  }
  
  return {
    success: true,
    listeners: [handler],
    error: null
  };
}

/**
 * Replace Policy - Replace all existing listeners with new one
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @returns {Object} Registration result
 */
export function replacePolicy(existingListeners, path, handler, options) {
  return {
    success: true,
    listeners: [handler], // Replace all existing
    error: null
  };
}

/**
 * Append Policy - Always add new listener to end (same as multiple)
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @returns {Object} Registration result
 */
export function appendPolicy(existingListeners, path, handler, options) {
  return {
    success: true,
    listeners: [...existingListeners, handler],
    error: null
  };
}

/**
 * Prepend Policy - Always add new listener to beginning
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @returns {Object} Registration result
 */
export function prependPolicy(existingListeners, path, handler, options) {
  return {
    success: true,
    listeners: [handler, ...existingListeners],
    error: null
  };
}

/**
 * Priority Policy - Add listener with priority, sort by priority
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @param {number} options.priority - Handler priority (higher = first)
 * @returns {Object} Registration result
 */
export function priorityPolicy(existingListeners, path, handler, options) {
  const priority = options.priority || 0;
  
  // Add priority metadata to handler
  const prioritizedHandler = {
    handler,
    priority,
    path
  };
  
  // Add to existing listeners
  const newListeners = [...existingListeners, prioritizedHandler];
  
  // Sort by priority (highest first)
  newListeners.sort((a, b) => b.priority - a.priority);
  
  return {
    success: true,
    listeners: newListeners,
    error: null
  };
}

/**
 * Limited Policy - Allow only up to maxListeners per path
 * @param {Array<Function>} existingListeners - Current handlers for this path
 * @param {string} path - Message path
 * @param {Function} handler - New handler to register
 * @param {Object} options - Policy options
 * @param {string} options.policy - Policy name
 * @param {boolean} options.debug - Debug flag
 * @param {number} options.maxListeners - Maximum listeners allowed
 * @returns {Object} Registration result
 */
export function limitedPolicy(existingListeners, path, handler, options) {
  const maxListeners = options.maxListeners || 10;
  
  if (existingListeners.length >= maxListeners) {
    return {
      success: false,
      listeners: existingListeners,
      error: `Maximum ${maxListeners} listeners allowed for path '${path}' with 'limited' policy`
    };
  }
  
  return {
    success: true,
    listeners: [...existingListeners, handler],
    error: null
  };
}

/**
 * Default policy registry
 */
export const DEFAULT_POLICIES = new Map([
  ['multiple', multiplePolicy],
  ['single', singlePolicy],
  ['replace', replacePolicy],
  ['append', appendPolicy],
  ['prepend', prependPolicy],
  ['priority', priorityPolicy],
  ['limited', limitedPolicy]
]);

/**
 * Get available policy names
 * @returns {Array<string>} Array of policy names
 */
export function getAvailablePolicies() {
  return Array.from(DEFAULT_POLICIES.keys());
}

/**
 * Validate policy options
 * @param {string} policyName - Policy name
 * @param {Object} options - Policy options
 * @returns {Object} Validation result
 */
export function validatePolicyOptions(policyName, options) {
  const errors = [];
  
  switch (policyName) {
    case 'priority':
      if (options.priority !== undefined) {
        if (typeof options.priority !== 'number') {
          errors.push('priority must be a number');
        }
      }
      break;
      
    case 'limited':
      if (options.maxListeners !== undefined) {
        if (typeof options.maxListeners !== 'number' || options.maxListeners < 1) {
          errors.push('maxListeners must be a positive number');
        }
      }
      break;
  }
  
  return { valid: errors.length === 0, errors };
}

