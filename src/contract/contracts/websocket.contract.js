/**
 * WebSocket Facet Contract
 * 
 * Defines the contract that WebSocket facets must satisfy.
 * Ensures all required WebSocket server methods are implemented and validates
 * internal structure for compatibility with different WebSocket implementations (ws, uWebSockets.js).
 * 
 * @example
 * import { websocketContract } from './websocket.contract.js';
 * 
 * // Enforce contract on a WebSocket facet
 * websocketContract.enforce(ctx, api, subsystem, websocketFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * WebSocket Facet Contract
 * 
 * Required methods:
 * - Lifecycle: start, stop, isRunning
 * - Server Info: getAddress, getPort
 * - Connection Management: getConnection, getAllConnections, getConnectionCount, closeConnection
 * - Message Sending: send, broadcast
 * - Connection Lifecycle Handlers: onConnection, onDisconnection, onError
 * - Message Routing: registerMessageHandler, routeMessage
 * 
 * Required properties:
 * - _server: Internal WebSocket server instance
 * - _isRunning: Running state flag
 * - _connections: Connection manager/registry
 * 
 * Custom validation:
 * - Validates _server is an object (not null or primitive)
 * - Validates _isRunning is a boolean
 * - Validates _connections exists
 */
export const websocketContract = createFacetContract({
  name: 'websocket',
  requiredMethods: [
    // Lifecycle
    'start',
    'stop',
    'isRunning',
    
    // Server Info
    'getAddress',
    'getPort',
    
    // Connection Management
    'getConnection',
    'getAllConnections',
    'getConnectionCount',
    'closeConnection',
    
    // Message Sending
    'send',
    'broadcast',
    
    // Connection Lifecycle Handlers
    'onConnection',
    'onDisconnection',
    'onError',
    
    // Message Routing
    'registerMessageHandler',
    'routeMessage'
  ],
  requiredProperties: [
    '_server',      // Internal WebSocket server instance
    '_isRunning',  // Running state flag
    '_connections'  // Connection manager/registry
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate _server is an object
    if (typeof facet._server !== 'object' || facet._server === null) {
      throw new Error('WebSocket facet _server must be an object');
    }
    
    // Validate _isRunning is a boolean
    if (typeof facet._isRunning !== 'boolean') {
      throw new Error('WebSocket facet _isRunning must be a boolean');
    }
    
    // Validate _connections exists (could be Map, object, or manager instance)
    if (!facet._connections) {
      throw new Error('WebSocket facet _connections must be defined');
    }
  }
});

