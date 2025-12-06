/**
 * Facet Contract Registry Index
 * 
 * Creates a default FacetContractRegistry instance and registers all available
 * facet contracts. This provides a centralized registry for enforcing contracts
 * on facets throughout the system.
 * 
 * @example
 * import { defaultContractRegistry } from './index.js';
 * 
 * // Enforce a contract on a facet
 * defaultContractRegistry.enforce('router', ctx, api, subsystem, routerFacet);
 * 
 * // Check if a contract exists
 * if (defaultContractRegistry.has('queue')) {
 *   // Contract is available
 * }
 */
import { FacetContractRegistry } from './facet-contract-registry.js';
import { routerContract } from './contracts/router.contract.js';
import { queueContract } from './contracts/queue.contract.js';
import { processorContract } from './contracts/processor.contract.js';
import { listenersContract } from './contracts/listeners.contract.js';
import { hierarchyContract } from './contracts/hierarchy.contract.js';
import { schedulerContract } from './contracts/scheduler.contract.js';
import { serverContract } from './contracts/server.contract.js';
import { speakContract } from './contracts/speak.contract.js';
import { websocketContract } from './contracts/websocket.contract.js';
import { storageContract } from './contracts/storage.contract.js';

/**
 * Default Facet Contract Registry
 * 
 * Pre-configured registry with all standard facet contracts registered.
 */
export const defaultContractRegistry = new FacetContractRegistry();

// Register all available contracts
defaultContractRegistry.register(routerContract);
defaultContractRegistry.register(queueContract);
defaultContractRegistry.register(processorContract);
defaultContractRegistry.register(listenersContract);
defaultContractRegistry.register(hierarchyContract);
defaultContractRegistry.register(schedulerContract);
defaultContractRegistry.register(serverContract);
defaultContractRegistry.register(speakContract);
defaultContractRegistry.register(websocketContract);
defaultContractRegistry.register(storageContract);

// Also export the registry class and individual contracts for flexibility
export { FacetContractRegistry } from './facet-contract-registry.js';
export { FacetContract, createFacetContract } from './facet-contract.js';
export { routerContract } from './contracts/router.contract.js';
export { queueContract } from './contracts/queue.contract.js';
export { processorContract } from './contracts/processor.contract.js';
export { listenersContract } from './contracts/listeners.contract.js';
export { hierarchyContract } from './contracts/hierarchy.contract.js';
export { schedulerContract } from './contracts/scheduler.contract.js';
export { serverContract } from './contracts/server.contract.js';
export { speakContract } from './contracts/speak.contract.js';
export { websocketContract } from './contracts/websocket.contract.js';
export { storageContract } from './contracts/storage.contract.js';

