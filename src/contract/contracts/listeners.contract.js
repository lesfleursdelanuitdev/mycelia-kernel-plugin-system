/**
 * Listeners Facet Contract
 * 
 * Defines the contract that listeners facets must satisfy.
 * Ensures all required listener management methods are implemented and validates
 * internal structure for compatibility with other hooks.
 * 
 * @example
 * import { listenersContract } from './listeners.contract.mycelia.js';
 * 
 * // Enforce contract on a listeners facet
 * listenersContract.enforce(ctx, api, subsystem, listenersFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Listeners Facet Contract
 * 
 * Required methods:
 * - on: Register a listener for a specific message path
 * - off: Unregister a listener for a specific message path
 * - emit: Emit an event to listeners for a specific path
 * - hasListeners: Check if listeners are enabled
 * - enableListeners: Enable listeners and initialize ListenerManager
 * - disableListeners: Disable listeners (but keep manager instance)
 * 
 * Required properties:
 * - listeners: Getter for direct access to ListenerManager instance (can be null)
 * - _listenerManager: Function accessor that returns ListenerManager or null
 * 
 * Custom validation:
 * - Validates _listenerManager is a function
 * - Validates listeners property exists
 * - Validates _listenerManager() returns object or null
 */
export const listenersContract = createFacetContract({
  name: 'listeners',
  requiredMethods: [
    'on',
    'off',
    'emit',
    'hasListeners',
    'enableListeners',
    'disableListeners'
  ],
  requiredProperties: [
    'listeners',
    '_listenerManager'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate _listenerManager is a function
    if (typeof facet._listenerManager !== 'function') {
      throw new Error('Listeners facet _listenerManager must be a function');
    }
    
    // Validate listeners property exists (getter)
    if (!('listeners' in facet)) {
      throw new Error('Listeners facet must have listeners property');
    }
    
    // Validate _listenerManager() returns object or null
    const manager = facet._listenerManager();
    if (manager !== null && (typeof manager !== 'object' || manager === null)) {
      throw new Error('Listeners facet _listenerManager() must return an object or null');
    }
  }
});

