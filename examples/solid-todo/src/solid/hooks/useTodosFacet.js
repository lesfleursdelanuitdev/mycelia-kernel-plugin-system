/**
 * useTodosFacet Hook
 * 
 * Custom hook to access the todos facet from the Mycelia system.
 * This is a convenience wrapper around useFacet('todos').
 */

import { useFacet } from '../../../../src/solid/index.js';

/**
 * Get the todos facet from the Mycelia system
 * @returns {Function} Signal accessor that returns the todos facet or null
 */
export function useTodosFacet() {
  return useFacet('todos');
}

