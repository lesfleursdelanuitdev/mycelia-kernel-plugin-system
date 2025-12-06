/**
 * FacetContractRegistry Class
 * 
 * Manages a collection of facet contracts, allowing registration and enforcement
 * of contracts on facets by name.
 * 
 * @example
 * import { FacetContractRegistry } from './facet-contract-registry.js';
 * import { createFacetContract } from './facet-contract.js';
 * 
 * const registry = new FacetContractRegistry();
 * 
 * const routerContract = createFacetContract({
 *   name: 'router',
 *   requiredMethods: ['registerRoute', 'match']
 * });
 * 
 * registry.register(routerContract);
 * 
 * // Later, enforce the contract
 * registry.enforce('router', ctx, api, subsystem, routerFacet);
 */
import { FacetContract } from './facet-contract.js';

export class FacetContractRegistry {
  /**
   * Map of contract name → FacetContract instance
   * @private
   * @type {Map<string, FacetContract>}
   */
  #contracts = new Map();

  /**
   * Creates a new FacetContractRegistry
   */
  constructor() {
    // No initialization needed
  }

  /**
   * Registers a facet contract in the registry
   * 
   * @param {FacetContract} contract - FacetContract instance to register
   * @returns {FacetContract} The registered contract
   * @throws {Error} If contract is invalid or a contract with the same name already exists
   */
  register(contract) {
    if (!contract || typeof contract !== 'object') {
      throw new Error('FacetContractRegistry.register: contract must be an object');
    }
    if (!(contract instanceof FacetContract)) {
      throw new Error('FacetContractRegistry.register: contract must be a FacetContract instance');
    }
    if (!contract.name || typeof contract.name !== 'string') {
      throw new Error('FacetContractRegistry.register: contract must have a string name property');
    }

    if (this.#contracts.has(contract.name)) {
      throw new Error(`FacetContractRegistry.register: contract with name '${contract.name}' already exists`);
    }

    this.#contracts.set(contract.name, contract);
    return contract;
  }

  /**
   * Checks if a contract exists for the given name
   * 
   * @param {string} name - Contract name to check
   * @returns {boolean} True if contract exists
   */
  has(name) {
    if (typeof name !== 'string') {
      return false;
    }
    return this.#contracts.has(name);
  }

  /**
   * Gets a contract by name
   * 
   * @param {string} name - Contract name
   * @returns {FacetContract|undefined} Contract instance or undefined if not found
   */
  get(name) {
    if (typeof name !== 'string') {
      return undefined;
    }
    return this.#contracts.get(name);
  }

  /**
   * Enforces a contract on a facet
   * 
   * Looks up the contract by name and delegates to its enforce method.
   * 
   * @param {string} name - Name of the contract to enforce
   * @param {Object} ctx - Context object
   * @param {Object} api - Subsystem API object
   * @param {BaseSubsystem} subsystem - Subsystem instance
   * @param {Facet} facet - Facet to validate
   * @throws {Error} If contract not found or validation fails
   */
  enforce(name, ctx, api, subsystem, facet) {
    if (typeof name !== 'string' || !name) {
      throw new Error('FacetContractRegistry.enforce: name must be a non-empty string');
    }

    const contract = this.#contracts.get(name);
    if (!contract) {
      throw new Error(`FacetContractRegistry.enforce: no contract found for name '${name}'`);
    }

    contract.enforce(ctx, api, subsystem, facet);
  }

  /**
   * Removes a contract from the registry
   * 
   * @param {string} name - Contract name to remove
   * @returns {boolean} True if contract was removed, false if not found
   */
  remove(name) {
    if (typeof name !== 'string') {
      return false;
    }
    return this.#contracts.delete(name);
  }

  /**
   * Lists all registered contract names
   * 
   * @returns {Array<string>} Array of contract names
   */
  list() {
    return Array.from(this.#contracts.keys());
  }

  /**
   * Gets the number of registered contracts
   * 
   * @returns {number} Number of contracts
   */
  size() {
    return this.#contracts.size;
  }

  /**
   * Clears all contracts from the registry
   */
  clear() {
    this.#contracts.clear();
  }
}

