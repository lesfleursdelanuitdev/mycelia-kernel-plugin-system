/**
 * Mycelia Plugin System - Svelte Store Generator
 * 
 * Utility for generating custom stores for specific facets.
 */

import { useFacet } from './index.js';

/**
 * createFacetStore - Generate a custom store for a specific facet kind
 * 
 * @param {string} kind - Facet kind identifier
 * @returns {Function} Custom store function: () => import('svelte/store').Readable
 * 
 * @example
 * ```js
 * // stores/todos.js
 * import { createFacetStore } from 'mycelia-kernel-plugin/svelte';
 * 
 * export const useTodos = createFacetStore('todos');
 * 
 * // In component
 * <script>
 *   import { useTodos } from './stores/todos.js';
 *   
 *   const todosStore = useTodos();
 *   $: todos = $todosStore;
 * </script>
 * ```
 */
export function createFacetStore(kind) {
  return function useNamedFacet() {
    return useFacet(kind);
  };
}

