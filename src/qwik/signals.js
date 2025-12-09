/**
 * Qwik Signal Generators
 */

import { useFacet } from './index.js';

/**
 * createFacetSignal - Generate a signal for a specific facet kind
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Hook function: () => Signal<Facet | null>
 * 
 * @example
 * ```ts
 * // In bindings/todo-signals.ts
 * export const useTodoStore = createFacetSignal('todoStore');
 * export const useAuth = createFacetSignal('auth');
 * 
 * // In component
 * export const TodoList = component$(() => {
 *   const todoStore = useTodoStore();
 *   // Use todoStore.value...
 * });
 * ```
 */
export function createFacetSignal(kind) {
  return function useNamedFacet() {
    return useFacet(kind);
  };
}


