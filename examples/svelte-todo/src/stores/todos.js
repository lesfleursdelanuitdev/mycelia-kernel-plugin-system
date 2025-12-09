/**
 * Custom store for accessing the todos facet
 * 
 * Uses createFacetStore to generate a domain-specific store
 * for better readability and maintainability.
 */

import { createFacetStore } from '../../../src/svelte/index.js';

export const useTodos = createFacetStore('todos');




