/**
 * useSpeak Hook
 * 
 * Provides speaking/printing functionality to subsystems.
 * A simple "hello world" example hook that implements the speak contract.
 * 
 * @param {Object} ctx - Context object containing config.speak for speak configuration
 * @param {Object} api - Subsystem API being built
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {Facet} Facet object with speak methods
 */
import { Facet } from '../../core/facet.js';
import { createHook } from '../../core/create-hook.js';
import { getDebugFlag } from '../../utils/debug-flag.js';
import { createLogger } from '../../utils/logger.js';

export const useSpeak = createHook({
  kind: 'speak',
  version: '1.0.0',
  overwrite: false,
  required: [],
  attach: true,
  source: import.meta.url,
  contract: 'speak',
  // eslint-disable-next-line no-unused-vars
  fn: (ctx, api, _subsystem) => {
    const { name } = api;
    const config = ctx.config?.speak || {};
    const debug = getDebugFlag(config, ctx);
    const logger = createLogger(debug, `useSpeak ${name}`);
    
    // Default output function (can be overridden via config)
    const outputFn = config.output || console.log;
    const prefix = config.prefix || '';
    
    return new Facet('speak', { attach: true, source: import.meta.url, contract: 'speak' })
      .add({
        /**
         * Say a message (without newline)
         * @param {string} message - Message to say
         * @returns {void}
         * 
         * @example
         * subsystem.speak.say('Hello');
         * subsystem.speak.say(' World');
         * // Output: "Hello World"
         */
        say(message) {
          if (typeof message !== 'string') {
            throw new Error('speak.say() requires a string message');
          }
          outputFn(prefix + message);
          if (debug) {
            logger.log(`Said: ${message}`);
          }
        },
        
        /**
         * Say a message with a newline
         * @param {string} message - Message to say
         * @returns {void}
         * 
         * @example
         * subsystem.speak.sayLine('Hello, World!');
         * // Output: "Hello, World!\n"
         */
        sayLine(message) {
          if (typeof message !== 'string') {
            throw new Error('speak.sayLine() requires a string message');
          }
          outputFn(prefix + message);
          if (debug) {
            logger.log(`Said line: ${message}`);
          }
        }
      });
  }
});

