/**
 * Logger Utilities
 * 
 * Provides a simple logger abstraction for improved testability and consistency.
 */

/**
 * Simple logger that conditionally logs based on debug flag.
 * 
 * @param {boolean} debug - Whether debug logging is enabled
 * @param {string} prefix - Optional prefix for log messages (e.g., subsystem name)
 * @returns {Object} Logger object with log, error, warn methods
 * 
 * @example
 * ```javascript
 * const logger = createLogger(debug, subsystem.name);
 * logger.log('System initialized');
 * logger.error('Failed to initialize', error);
 * logger.warn('Deprecated feature used');
 * ```
 */
export function createLogger(debug = false, prefix = '') {
  const prefixStr = prefix ? `[${prefix}] ` : '';
  
  return {
    /**
     * Log an info message (only if debug is enabled)
     * @param {...any} args - Arguments to log
     */
    log(...args) {
      if (debug) {
        console.log(prefixStr, ...args);
      }
    },
    
    /**
     * Log an error message (always logged, but with prefix only if debug is enabled)
     * @param {...any} args - Arguments to log
     */
    error(...args) {
      if (debug) {
        console.error(prefixStr, ...args);
      } else {
        // Still log errors even if debug is off, but without prefix
        console.error(...args);
      }
    },
    
    /**
     * Log a warning message (only if debug is enabled)
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
      if (debug) {
        console.warn(prefixStr, ...args);
      }
    },
    
    /**
     * Check if debug logging is enabled
     * @returns {boolean} True if debug is enabled
     */
    isDebugEnabled() {
      return debug;
    }
  };
}

/**
 * Create a logger for a subsystem
 * 
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {Object} Logger object
 * 
 * @example
 * ```javascript
 * const logger = createSubsystemLogger(subsystem);
 * logger.log('Built successfully');
 * ```
 */
export function createSubsystemLogger(subsystem) {
  return createLogger(subsystem?.debug || false, subsystem?.name || '');
}

