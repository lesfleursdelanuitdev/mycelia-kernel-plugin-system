/**
 * Mycelia Plugin System - Vue Composable Generator
 * 
 * Utility for generating custom composables for specific facets.
 */

import { useFacet } from './index.js';

/**
 * createFacetComposable - Generate a custom composable for a specific facet kind
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Custom composable: () => import('vue').Ref<Object|null>
 * 
 * @example
 * ```js
 * // In composables/todo.js
 * import { createFacetComposable } from 'mycelia-kernel-plugin/vue';
 * 
 * export const useTodos = createFacetComposable('todos');
 * export const useAuth = createFacetComposable('auth');
 * 
 * // In component
 * export default {
 *   setup() {
 *     const todos = useTodos();
 *     // Use todos.value...
 *   }
 * }
 * ```
 */
export function createFacetComposable(kind) {
  return function useNamedFacet() {
    return useFacet(kind);
  };
}

