/**
 * PatternMatcher Class
 * 
 * Handles pattern-based listener registration and matching.
 * Supports {param} syntax in paths (e.g., 'command/completed/id/{id}').
 * 
 * @example
 * const matcher = new PatternMatcher({ debug: false });
 * matcher.register('command/completed/id/{id}', handler);
 * const matches = matcher.findMatches('command/completed/id/123');
 */
export class PatternMatcher {
  /**
   * Create a new PatternMatcher instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    this.debug = options.debug || false;
    
    // Pattern listener storage: pattern -> [{ handlers, paramNames, regex }, ...]
    // Each entry contains handlers for that pattern and compiled regex for matching
    this.patternListeners = new Map();
  }

  /**
   * Check if a path contains pattern syntax (e.g., {param})
   * @param {string} path - Path to check
   * @returns {boolean} True if path contains pattern syntax
   */
  isPattern(path) {
    return /\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(path);
  }

  /**
   * Parse pattern to extract parameter names
   * @param {string} pattern - Pattern string (e.g., 'command/completed/id/{id}')
   * @returns {Array<string>} Array of parameter names (e.g., ['id'])
   */
  parsePattern(pattern) {
    const paramNames = [];
    const paramRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    let match;
    
    while ((match = paramRegex.exec(pattern)) !== null) {
      const paramName = match[1];
      if (!paramNames.includes(paramName)) {
        paramNames.push(paramName);
      }
    }
    
    return paramNames;
  }

  /**
   * Convert pattern to regex with capture groups
   * @param {string} pattern - Pattern string (e.g., 'command/completed/id/{id}')
   * @returns {RegExp} Regex with capture groups
   */
  patternToRegex(pattern) {
    // Escape special regex characters except the pattern syntax
    let regexStr = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, (char) => {
        // Don't escape { and } as they're used for pattern syntax
        if (char === '{' || char === '}') {
          return char;
        }
        return '\\' + char;
      });
    
    // Replace {param} with capture groups
    // Each {param} becomes (.+) to capture any value
    regexStr = regexStr.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, '(.+)');
    
    // Anchor to start and end
    regexStr = '^' + regexStr + '$';
    
    return new RegExp(regexStr);
  }

  /**
   * Extract parameter values from a pattern match
   * @param {string} pattern - Original pattern
   * @param {Array<string>} paramNames - Parameter names in order
   * @param {Array} matchResult - Regex match result array
   * @returns {Object} Parameters object (e.g., { id: 'msg_123' })
   */
  extractParams(pattern, paramNames, matchResult) {
    if (!matchResult || matchResult.length === 0) {
      return {};
    }

    // matchResult[0] is the full match
    // matchResult[1], matchResult[2], ... are capture groups
    const params = {};
    const captureGroups = matchResult.slice(1);
    
    if (paramNames.length !== captureGroups.length) {
      if (this.debug) {
        console.warn(`PatternMatcher: Parameter count mismatch for pattern '${pattern}'. Expected ${paramNames.length}, got ${captureGroups.length}`);
      }
      return {};
    }
    
    for (let i = 0; i < paramNames.length; i++) {
      params[paramNames[i]] = captureGroups[i];
    }
    
    return params;
  }

  /**
   * Register a listener for a pattern path
   * @param {string} pattern - Pattern path with {param} placeholders
   * @param {Function} handler - Handler function to call when pattern matches
   * @param {Array<Function>} existingHandlers - Existing handlers for this pattern (from policy)
   * @returns {void}
   */
  register(pattern, handler, existingHandlers = []) {
    if (!this.isPattern(pattern)) {
      throw new Error(`Path '${pattern}' does not contain pattern syntax. Use exact path matching or onPattern() with {param} syntax.`);
    }

    // Parse pattern to extract parameter names
    const paramNames = this.parsePattern(pattern);
    
    if (paramNames.length === 0) {
      throw new Error(`Pattern '${pattern}' contains no valid parameters. Use {paramName} syntax.`);
    }

    // Convert pattern to regex
    const regex = this.patternToRegex(pattern);

    // Get existing pattern entries or create new array
    const existingEntries = this.patternListeners.get(pattern) || [];
    
    // Check if this pattern already has entries
    let patternEntry = existingEntries.find(entry => 
      entry.paramNames.join(',') === paramNames.join(',') &&
      entry.regex.source === regex.source
    );

    if (!patternEntry) {
      // Create new pattern entry
      patternEntry = {
        pattern: pattern,
        paramNames: paramNames,
        regex: regex,
        handlers: []
      };
      existingEntries.push(patternEntry);
    }

    // Update handlers
    patternEntry.handlers = existingHandlers;
    this.patternListeners.set(pattern, existingEntries);
    
    if (this.debug) {
      console.log(`PatternMatcher: Registered pattern listener for '${pattern}' (${patternEntry.handlers.length} total handlers for this pattern)`);
    }
  }

  /**
   * Unregister a pattern listener
   * @param {string} pattern - Pattern path
   * @param {Function} handler - Handler function to remove
   * @returns {boolean} Success status
   */
  unregister(pattern, handler) {
    if (!this.patternListeners.has(pattern)) {
      return false;
    }

    const patternEntries = this.patternListeners.get(pattern);
    let removed = false;

    for (const patternEntry of patternEntries) {
      const index = patternEntry.handlers.indexOf(handler);
      if (index !== -1) {
        patternEntry.handlers.splice(index, 1);
        removed = true;
      }
    }

    // Clean up empty pattern entries
    const filteredEntries = patternEntries.filter(entry => entry.handlers.length > 0);
    if (filteredEntries.length === 0) {
      this.patternListeners.delete(pattern);
    } else {
      this.patternListeners.set(pattern, filteredEntries);
    }

    if (removed && this.debug) {
      console.log(`PatternMatcher: Unregistered pattern listener for '${pattern}'`);
    }

    return removed;
  }

  /**
   * Find all pattern matches for a given path
   * @param {string} path - Actual path to match against
   * @returns {Array<Object>} Array of { patternEntry, params } objects
   */
  findMatches(path) {
    const matches = [];
    
    for (const [pattern, patternEntries] of this.patternListeners) {
      for (const patternEntry of patternEntries) {
        const matchResult = patternEntry.regex.exec(path);
        if (matchResult) {
          const params = this.extractParams(pattern, patternEntry.paramNames, matchResult);
          matches.push({ patternEntry, params });
        }
      }
    }
    
    return matches;
  }

  /**
   * Check if pattern listeners exist for a pattern
   * @param {string} pattern - Pattern path
   * @returns {boolean} True if pattern listeners exist
   */
  has(pattern) {
    return this.patternListeners.has(pattern) && 
           this.patternListeners.get(pattern).some(entry => entry.handlers.length > 0);
  }

  /**
   * Get pattern listener count for a specific pattern
   * @param {string} pattern - Pattern path
   * @returns {number} Total number of handlers for this pattern
   */
  getCount(pattern) {
    if (!this.patternListeners.has(pattern)) {
      return 0;
    }
    
    return this.patternListeners.get(pattern).reduce((sum, entry) => sum + entry.handlers.length, 0);
  }

  /**
   * Get all registered patterns
   * @returns {Array<string>} Array of pattern strings
   */
  getPatterns() {
    return Array.from(this.patternListeners.keys());
  }

  /**
   * Get total pattern listener count across all patterns
   * @returns {number} Total number of pattern listeners
   */
  getTotalCount() {
    return Array.from(this.patternListeners.values()).reduce((sum, entries) => {
      return sum + entries.reduce((entrySum, entry) => entrySum + entry.handlers.length, 0);
    }, 0);
  }

  /**
   * Get number of registered patterns
   * @returns {number} Number of patterns
   */
  getPatternCount() {
    return this.patternListeners.size;
  }

  /**
   * Clear all pattern listeners
   * @returns {void}
   */
  clear() {
    this.patternListeners.clear();
    
    if (this.debug) {
      console.log(`PatternMatcher: Cleared all pattern listeners`);
    }
  }
}

