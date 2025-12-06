/**
 * Router Facet Contract
 * 
 * Defines the contract that router facets must satisfy.
 * Ensures all required routing methods are implemented and validates
 * internal structure for compatibility with other hooks.
 * 
 * @example
 * import { routerContract } from './router.contract.js';
 * 
 * // Enforce contract on a router facet
 * routerContract.enforce(ctx, api, subsystem, routerFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Router Facet Contract
 * 
 * Required methods:
 * - registerRoute: Register a route pattern with a handler
 * - match: Match a path against registered routes
 * - route: Route a message by matching its path and executing the handler
 * - unregisterRoute: Unregister a route pattern
 * - hasRoute: Check if a route pattern is registered
 * - getRoutes: Get all registered routes
 * 
 * Required properties:
 * - _routeRegistry: Internal router instance (used by useMessageProcessor)
 * 
 * Custom validation:
 * - Validates _routeRegistry is an object (not null or primitive)
 */
export const routerContract = createFacetContract({
  name: 'router',
  requiredMethods: [
    'registerRoute',
    'match',
    'route',
    'unregisterRoute',
    'hasRoute',
    'getRoutes'
  ],
  requiredProperties: [
    '_routeRegistry'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate that _routeRegistry is an object (not null or primitive)
    if (typeof facet._routeRegistry !== 'object' || facet._routeRegistry === null) {
      throw new Error('Router facet _routeRegistry must be an object');
    }
  }
});

