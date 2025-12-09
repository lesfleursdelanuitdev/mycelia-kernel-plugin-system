/**
 * useSimpleListeners Hook
 * 
 * Provides simple listener management functionality to subsystems using mitt.
 * A lightweight alternative to useListeners that wraps the mitt event emitter.
 * 
 * @param {Object} ctx - Context object containing config.listeners for listener configuration
 * @param {Object} api - Subsystem API being built
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {Facet} Facet object with listener methods
 */
import mitt from 'mitt';
import { Facet } from '../../core/facet.js';
import { createHook } from '../../core/create-hook.js';
import { getDebugFlag } from '../../utils/debug-flag.js';
import { createLogger } from '../../utils/logger.js';

export const useSimpleListeners = createHook({
  kind: 'listeners',
  version: '1.0.0',
  overwrite: false,
  required: [],
  attach: true,
  source: import.meta.url,
  contract: 'listeners',
  // eslint-disable-next-line no-unused-vars
  fn: (ctx, api, _subsystem) => {
    const { name } = api;
    const config = ctx.config?.listeners || {};
    const debug = getDebugFlag(config, ctx);
    
    // Listeners are optional - can be enabled/disabled
    let emitter = null;
    let listenersEnabled = false;
    
    return new Facet('listeners', { attach: true, source: import.meta.url, contract: 'listeners' })
      .add({
      
      /**
       * Check if listeners are enabled
       * @returns {boolean} True if listeners are enabled
       */
      hasListeners() {
        return listenersEnabled && emitter !== null;
      },
      
      /**
       * Enable listeners
       * @param {Object} [listenerOptions={}] - Options (currently unused, for API compatibility)
       */
      enableListeners(listenerOptions = {}) {
        if (emitter === null) {
          emitter = mitt();
        }
        listenersEnabled = true;
      },
      
      /**
       * Disable listeners
       */
      disableListeners() {
        listenersEnabled = false;
      },
      
      /**
       * Register a listener for a specific path
       * @param {string} path - Message path to listen for
       * @param {Function} handler - Handler function
       * @param {Object} [options={}] - Registration options (for API compatibility)
       * @returns {boolean} Success status
       */
      on(path, handler, options = {}) {
        // Check if listeners are enabled
        if (!listenersEnabled || emitter === null) {
          const runtimeDebug = options.debug !== undefined ? options.debug : debug;
          if (runtimeDebug) {
            const runtimeLogger = createLogger(runtimeDebug, `useSimpleListeners ${name}`);
            runtimeLogger.warn('Cannot register listener - listeners not enabled');
          }
          return false;
        }
        
        // Validate handler is a function
        if (typeof handler !== 'function') {
          if (debug) {
            const runtimeLogger = createLogger(debug, `useSimpleListeners ${name}`);
            runtimeLogger.warn('Handler must be a function');
          }
          return false;
        }
        
        // Register with mitt
        emitter.on(path, handler);
        return true;
      },
      
      /**
       * Unregister a listener for a specific path
       * @param {string} path - Message path
       * @param {Function} handler - Handler function to remove
       * @param {Object} [options={}] - Unregistration options (for API compatibility)
       * @returns {boolean} Success status
       */
      off(path, handler, options = {}) {
        // Check if listeners are enabled
        if (!listenersEnabled || emitter === null) {
          const runtimeDebug = options.debug !== undefined ? options.debug : debug;
          if (runtimeDebug) {
            const runtimeLogger = createLogger(runtimeDebug, `useSimpleListeners ${name}`);
            runtimeLogger.warn('Cannot unregister listener - listeners not enabled');
          }
          return false;
        }
        
        // Validate handler is a function
        if (typeof handler !== 'function') {
          if (debug) {
            const runtimeLogger = createLogger(debug, `useSimpleListeners ${name}`);
            runtimeLogger.warn('Handler must be a function');
          }
          return false;
        }
        
        // Unregister from mitt
        emitter.off(path, handler);
        return true;
      },
      
      /**
       * Emit an event to listeners for a specific path
       * @param {string} path - Message path to emit to
       * @param {any} message - Message/data to send to listeners
       * @returns {number} Number of listeners notified, or 0 if listeners not enabled
       * 
       * @example
       * // Emit event to listeners
       * const notified = subsystem.listeners.emit('layers/create', message);
       */
      emit(path, message) {
        // Check if listeners are enabled
        if (!listenersEnabled || emitter === null) {
          if (debug) {
            const runtimeLogger = createLogger(debug, `useSimpleListeners ${name}`);
            runtimeLogger.warn('Cannot emit event - listeners not enabled');
          }
          return 0;
        }
        
        // Get listeners count before emitting (mitt doesn't return count)
        const listeners = emitter.all.get(path);
        const count = listeners ? listeners.length : 0;
        
        // Emit to mitt
        emitter.emit(path, message);
        
        return count;
      },
      
      /**
       * Expose emitter property for direct access
       * Returns null if listeners are not enabled
       */
      get listeners() {
        return emitter;
      },
      
      // Expose emitter for internal use (compatible with listeners contract)
      _listenerManager: () => emitter
      });
  }
});

