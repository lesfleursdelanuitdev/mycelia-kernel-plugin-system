/**
 * Custom composable for accessing the todos facet
 * 
 * Uses createFacetComposable to generate a domain-specific composable
 * for better readability and maintainability.
 */

import { createFacetComposable } from '../../../../src/vue/index.js';

export const useTodosFacet = createFacetComposable('todos');

