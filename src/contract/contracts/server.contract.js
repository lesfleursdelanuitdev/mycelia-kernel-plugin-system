/**
 * Server Facet Contract
 * 
 * Defines the contract that server facets must satisfy.
 * Ensures all required HTTP server methods are implemented and validates
 * internal structure for compatibility with different server implementations (Fastify, Express).
 * 
 * @example
 * import { serverContract } from './server.contract.js';
 * 
 * // Enforce contract on a server facet
 * serverContract.enforce(ctx, api, subsystem, serverFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Server Facet Contract
 * 
 * Required methods:
 * - Lifecycle: start, stop, isRunning
 * - Route Registration (Single): get, post, put, patch, delete, all
 * - Route Registration (Batch): registerRoutes, registerMyceliaRoutes
 * - Middleware: use, useRoute
 * - Error Handling: setErrorHandler
 * - Server Info: getAddress, getPort
 * - Mycelia Integration: registerMyceliaRoute, registerMyceliaCommand, registerMyceliaQuery
 * 
 * Required properties:
 * - _server: Internal server instance (Fastify/Express)
 * - _isRunning: Running state flag
 * 
 * Custom validation:
 * - Validates _server is an object (not null or primitive)
 * - Validates _isRunning is a boolean
 */
export const serverContract = createFacetContract({
  name: 'server',
  requiredMethods: [
    // Lifecycle
    'start',
    'stop',
    'isRunning',
    
    // Route Registration (Single)
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'all',  // All HTTP methods
    
    // Route Registration (Batch)
    'registerRoutes',  // Register multiple routes at once
    'registerMyceliaRoutes',  // Register multiple Mycelia routes at once
    
    // Middleware
    'use',  // Global middleware
    'useRoute',  // Route-specific middleware
    
    // Error Handling
    'setErrorHandler',
    
    // Server Info
    'getAddress',
    'getPort',
    
    // Integration
    'registerMyceliaRoute',  // Register Mycelia route as HTTP endpoint
    'registerMyceliaCommand', // Register Mycelia command as HTTP endpoint
    'registerMyceliaQuery'    // Register Mycelia query as HTTP endpoint
  ],
  requiredProperties: [
    '_server',  // Internal server instance (Fastify/Express)
    '_isRunning'  // Running state flag
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate _server is an object
    if (typeof facet._server !== 'object' || facet._server === null) {
      throw new Error('Server facet _server must be an object');
    }
    
    // Validate _isRunning is a boolean
    if (typeof facet._isRunning !== 'boolean') {
      throw new Error('Server facet _isRunning must be a boolean');
    }
  }
});

