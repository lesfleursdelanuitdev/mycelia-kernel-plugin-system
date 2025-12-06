/**
 * Storage Facet Contract
 * 
 * Defines the contract that storage facets must satisfy.
 * Ensures all required storage methods are implemented and validates
 * internal structure for compatibility with other hooks.
 * 
 * @example
 * import { storageContract } from './storage.contract.js';
 * 
 * // Enforce contract on a storage facet
 * storageContract.enforce(ctx, api, subsystem, storageFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Storage Facet Contract
 * 
 * Required methods:
 * - get: Retrieve a value by key
 * - set: Store a value by key
 * - delete: Delete a value by key
 * - has: Check if a key exists
 * - getMany: Retrieve multiple values by keys
 * - setMany: Store multiple key-value pairs
 * - deleteMany: Delete multiple keys
 * - list: List all keys (or keys matching pattern)
 * - query: Query values by filter criteria
 * - count: Count keys/entries
 * - createNamespace: Create a new namespace/collection
 * - deleteNamespace: Delete a namespace/collection
 * - listNamespaces: List all namespaces
 * - beginTransaction: Begin a transaction (optional)
 * - commit: Commit a transaction (optional)
 * - rollback: Rollback a transaction (optional)
 * - getMetadata: Get metadata for a key
 * - setMetadata: Set metadata for a key
 * - clear: Clear all data (or data in namespace)
 * - getStatus: Get storage status/health
 * 
 * Required properties:
 * - _storageBackend: Internal storage backend instance
 * - _config: Storage configuration
 * 
 * Optional properties:
 * - supportsTransactions: Whether backend supports transactions
 * - supportsQuery: Whether backend supports query operations
 * - supportsMetadata: Whether backend supports metadata
 * 
 * Custom validation:
 * - Validates _storageBackend is an object (not null or primitive)
 * - Validates _config is an object
 */
export const storageContract = createFacetContract({
  name: 'storage',
  requiredMethods: [
    'get',
    'set',
    'delete',
    'has',
    'getMany',
    'setMany',
    'deleteMany',
    'list',
    'query',
    'count',
    'createNamespace',
    'deleteNamespace',
    'listNamespaces',
    'getMetadata',
    'setMetadata',
    'clear',
    'getStatus'
  ],
  requiredProperties: [
    '_storageBackend',
    '_config'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate that _storageBackend is an object (not null or primitive)
    if (typeof facet._storageBackend !== 'object' || facet._storageBackend === null) {
      throw new Error('Storage facet _storageBackend must be an object');
    }
    
    // Validate _config is an object
    if (typeof facet._config !== 'object' || facet._config === null) {
      throw new Error('Storage facet _config must be an object');
    }
    
    // Validate optional properties have correct types if present
    if ('supportsTransactions' in facet && typeof facet.supportsTransactions !== 'boolean') {
      throw new Error('Storage facet supportsTransactions must be a boolean');
    }
    
    if ('supportsQuery' in facet && typeof facet.supportsQuery !== 'boolean') {
      throw new Error('Storage facet supportsQuery must be a boolean');
    }
    
    if ('supportsMetadata' in facet && typeof facet.supportsMetadata !== 'boolean') {
      throw new Error('Storage facet supportsMetadata must be a boolean');
    }
  }
});




