/**
 * Queue Facet Contract
 * 
 * Defines the contract that queue facets must satisfy.
 * Ensures all required queue methods are implemented and validates
 * internal structure for compatibility with other hooks.
 * 
 * @example
 * import { queueContract } from './queue.contract.js';
 * 
 * // Enforce contract on a queue facet
 * queueContract.enforce(ctx, api, subsystem, queueFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Queue Facet Contract
 * 
 * Required methods:
 * - selectNextMessage: Dequeue and return the next message-options pair
 * - hasMessagesToProcess: Check if queue has messages to process
 * - getQueueStatus: Get queue status information (size, capacity, utilization, etc.)
 * 
 * Required properties:
 * - _queueManager: Internal queue manager instance (used by useMessageProcessor for enqueueing)
 * - queue: Direct access to underlying BoundedQueue instance
 * 
 * Custom validation:
 * - Validates _queueManager is an object with enqueue method
 * - Validates queue property is an object
 */
export const queueContract = createFacetContract({
  name: 'queue',
  requiredMethods: [
    'selectNextMessage',
    'hasMessagesToProcess',
    'getQueueStatus'
  ],
  requiredProperties: [
    '_queueManager',
    'queue'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate that _queueManager is an object with enqueue method
    if (typeof facet._queueManager !== 'object' || facet._queueManager === null) {
      throw new Error('Queue facet _queueManager must be an object');
    }
    if (typeof facet._queueManager.enqueue !== 'function') {
      throw new Error('Queue facet _queueManager must have enqueue method');
    }
    
    // Validate queue property is an object
    if (typeof facet.queue !== 'object' || facet.queue === null) {
      throw new Error('Queue facet queue property must be an object');
    }
  }
});

