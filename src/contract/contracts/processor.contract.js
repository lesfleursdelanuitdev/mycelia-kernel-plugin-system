/**
 * Processor Facet Contract
 * 
 * Defines the contract that processor facets must satisfy.
 * Ensures all required message processing methods are implemented.
 * 
 * @example
 * import { processorContract } from './processor.contract.js';
 * 
 * // Enforce contract on a processor facet
 * processorContract.enforce(ctx, api, subsystem, processorFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Processor Facet Contract
 * 
 * Required methods:
 * - accept: Accept a message and place it on the queue (or process immediately for queries)
 * - processMessage: Process a message through the complete processing pipeline
 * - processTick: Process a single message from the queue (process one tick)
 * - processImmediately: Process a message immediately without queuing
 * 
 * Required properties:
 * - None (processor doesn't expose internal properties)
 * 
 * Custom validation:
 * - None (methods are validated by requiredMethods check)
 */
export const processorContract = createFacetContract({
  name: 'processor',
  requiredMethods: [
    'accept',
    'processMessage',
    'processTick',
    'processImmediately'
  ],
  requiredProperties: [],
  validate: null
});







