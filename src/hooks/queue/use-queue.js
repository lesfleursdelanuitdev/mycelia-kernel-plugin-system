/**
 * useQueue Hook
 * 
 * Provides queue management functionality to subsystems.
 * Wraps SubsystemQueueManager and exposes queue operations.
 * 
 * @param {Object} ctx - Context object containing config.queue for queue configuration
 * @param {Object} api - Subsystem API being built
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @returns {Facet} Facet object with queue methods
 */
import { SubsystemQueueManager } from './subsystem-queue-manager.js';
import { Facet } from '../../core/facet.js';
import { createHook } from '../../core/create-hook.js';
import { getDebugFlag } from '../../utils/debug-flag.js';
import { findFacet } from '../../utils/find-facet.js';

export const useQueue = createHook({
  kind: 'queue',
  version: '1.0.0',
  overwrite: false,
  required: [], // statistics is optional, not required
  attach: true,
  source: import.meta.url,
  contract: 'queue',
  // eslint-disable-next-line no-unused-vars
  fn: (ctx, api, _subsystem) => {
    const { name } = api;
    const config = ctx.config?.queue || {};
    
    // Get statistics hook if available (for onQueueFull callback)
    const statisticsResult = findFacet(api.__facets, 'statistics');
    const statisticsFacet = statisticsResult ? statisticsResult.facet : null;
    
    // Create queue manager
    const queueManager = new SubsystemQueueManager({
      capacity: config.capacity || 1000,
      policy: config.policy || 'drop-oldest',
      debug: getDebugFlag(config, ctx),
      subsystemName: name,
      onQueueFull: () => {
        if (statisticsFacet?._statistics) {
          statisticsFacet._statistics.recordQueueFull();
        }
      }
    });
    
    // Get underlying queue for direct access
    const queue = queueManager.getQueue();
    
    return new Facet('queue', { attach: true, source: import.meta.url, contract: 'queue' })
    .add({
      /**
       * Get queue status
       * @param {Object} [additionalState={}] - Additional state (e.g., isProcessing, isPaused)
       * @returns {Object} Queue status object
       */
      getQueueStatus(additionalState = {}) {
        return queueManager.getStatus(additionalState);
      },
      
      /**
       * Expose queue property for direct access
       * Must have .capacity and methods like .remove()
       */
      queue,
      
      /**
       * Clear all messages from the queue
       */
      clearQueue() {
        queueManager.clear();
      },
      
      /**
       * Check if queue has messages to process
       * @returns {boolean} True if queue has messages
       */
      hasMessagesToProcess() {
        return !queueManager.isEmpty();
      },
      
      /**
       * Select next message to process
       * @returns {{msg: Message, options: Object}|null} Message-options pair or null
       */
      selectNextMessage() {
        return queueManager.dequeue();
      },
      
      // Expose queue manager for internal use by other hooks
      _queueManager: queueManager
    });
  }
});

