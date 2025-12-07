/**
 * Custom hook for accessing the todos facet
 * 
 * Uses createFacetHook to generate a domain-specific hook
 * for better readability and maintainability.
 */

import { createFacetHook } from '../../../../src/react/index.js';

export const useTodosFacet = createFacetHook('todos');

