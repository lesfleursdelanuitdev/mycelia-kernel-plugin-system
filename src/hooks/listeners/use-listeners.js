/**
 * useListeners Hook
 * 
 * Provides listener management functionality to subsystems.
 * Wraps ListenerManager and exposes on(), off(), hasListeners() methods.
 * 
 * @param {Object} ctx - Context object containing config.listeners for listener configuration
 * @param {Object} api - Subsystem API being built
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {Facet} Facet object with listener methods
 */
import { ListenerManager } from './listener-manager.js';
import { Facet } from '../../core/facet.js';
import { createHook } from '../../core/create-hook.js';
import { getDebugFlag } from '../../utils/debug-flag.js';
import { createLogger } from '../../utils/logger.js';

export const useListeners = createHook({
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
    let listeners = null;
    let listenersEnabled = false;
    
    return new Facet('listeners', { attach: true, source: import.meta.url, contract: 'listeners' })
      .add({
      
      /**
       * Check if listeners are enabled
       * @returns {boolean} True if listeners are enabled
       */
      hasListeners() {
        return listenersEnabled && listeners !== null;
      },
      
      /**
       * Enable listeners
       * @param {Object} [listenerOptions={}] - ListenerManager options (overrides config)
       */
      enableListeners(listenerOptions = {}) {
        if (listeners === null) {
          listeners = new ListenerManager({
            registrationPolicy: listenerOptions.registrationPolicy || config.registrationPolicy || 'multiple',
            debug: listenerOptions.debug !== undefined ? listenerOptions.debug : getDebugFlag(config, ctx),
            policyOptions: listenerOptions.policyOptions || config.policyOptions || {}
          });
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
       * @param {Function|Object} handlers - Handler function or handler group object
       * @param {Object} [options={}] - Registration options
       * @param {boolean} [options.isHandlerGroup=false] - Whether handlers is a handler group object
       * @returns {boolean} Success status
       */
      on(path, handlers, options = {}) {
        // Check if listeners are enabled
        if (!listenersEnabled || listeners === null) {
          // Use runtime debug flag from options, fallback to hook debug
          const runtimeDebug = options.debug !== undefined ? options.debug : debug;
          if (runtimeDebug) {
            const runtimeLogger = createLogger(runtimeDebug, `useListeners ${name}`);
            runtimeLogger.warn('Cannot register listener - listeners not enabled');
          }
          return false;
        }
        
        // If it's a handler group, delegate to ListenerManager's handler group method
        if (options.isHandlerGroup && typeof handlers === 'object') {
          return listeners.registerHandlerGroup(path, handlers, options);
        }
        
        // Delegate to ListenerManager for regular handlers
        return listeners.on(path, handlers);
      },
      
      /**
       * Unregister a listener for a specific path
       * @param {string} path - Message path
       * @param {Function|Object} handlers - Handler function or handler group object to remove
       * @param {Object} [options={}] - Unregistration options
       * @param {boolean} [options.isHandlerGroup=false] - Whether handlers is a handler group object
       * @returns {boolean} Success status
       */
      off(path, handlers, options = {}) {
        // Check if listeners are enabled
        if (!listenersEnabled || listeners === null) {
          // Use runtime debug flag from options, fallback to hook debug
          const runtimeDebug = options.debug !== undefined ? options.debug : debug;
          if (runtimeDebug) {
            const runtimeLogger = createLogger(runtimeDebug, `useListeners ${name}`);
            runtimeLogger.warn('Cannot unregister listener - listeners not enabled');
          }
          return false;
        }
        
        // If it's a handler group, delegate to ListenerManager's handler group unregistration
        if (options.isHandlerGroup && typeof handlers === 'object') {
          return listeners.unregisterHandlerGroup(path, handlers, options);
        }
        
        // Delegate to ListenerManager for regular handlers
        return listeners.off(path, handlers);
      },
      
      /**
       * Emit an event to listeners for a specific path
       * @param {string} path - Message path to emit to
       * @param {Message} message - Message to send to listeners
       * @returns {number} Number of listeners notified, or 0 if listeners not enabled
       * 
       * @example
       * // Emit event to listeners
       * const notified = subsystem.listeners.emit('layers/create', message);
       */
      emit(path, message) {
        // Check if listeners are enabled
        if (!listenersEnabled || listeners === null) {
          if (debug) {
            const runtimeLogger = createLogger(debug, `useListeners ${name}`);
            runtimeLogger.warn('Cannot emit event - listeners not enabled');
          }
          return 0;
        }
        
        // Delegate to ListenerManager
        return listeners.emit(path, message);
      },
      
      /**
       * Expose listeners property for direct access
       * Returns null if listeners are not enabled
       */
      get listeners() {
        return listeners;
      },
      
      // Expose listener manager for internal use
      _listenerManager: () => listeners
      });
  }
});

