/**
 * Scheduler Facet Contract
 * 
 * Defines the contract that scheduler facets must satisfy.
 * Ensures all required scheduling methods are implemented and validates
 * internal structure for compatibility with other hooks and BaseSubsystem.
 * 
 * @example
 * import { schedulerContract } from './scheduler.contract.js';
 * 
 * // Enforce contract on a scheduler facet
 * schedulerContract.enforce(ctx, api, subsystem, schedulerFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Scheduler Facet Contract
 * 
 * Required methods:
 * - process: Process messages during a time slice
 * - pauseProcessing: Pause message processing
 * - resumeProcessing: Resume message processing
 * - isPaused: Check if processing is paused
 * - isProcessing: Check if currently processing
 * - getPriority: Get subsystem priority
 * - setPriority: Set subsystem priority
 * - configureScheduler: Configure scheduler options
 * - getScheduler: Get scheduler instance
 * 
 * Required properties:
 * - _scheduler: Internal scheduler instance (used internally by other hooks)
 * 
 * Custom validation:
 * - Validates _scheduler is an object (not null or primitive)
 */
export const schedulerContract = createFacetContract({
  name: 'scheduler',
  requiredMethods: [
    'process',
    'pauseProcessing',
    'resumeProcessing',
    'isPaused',
    'isProcessing',
    'getPriority',
    'setPriority',
    'configureScheduler',
    'getScheduler'
  ],
  requiredProperties: [
    '_scheduler'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate _scheduler is an object
    if (typeof facet._scheduler !== 'object' || facet._scheduler === null) {
      throw new Error('Scheduler facet _scheduler must be an object');
    }
  }
});







