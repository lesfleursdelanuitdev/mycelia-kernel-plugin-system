/**
 * Hierarchy Facet Contract
 * 
 * Defines the contract that hierarchy facets must satisfy.
 * Ensures all required hierarchy management methods are implemented and validates
 * internal structure for compatibility with other hooks and BaseSubsystem.
 * 
 * @example
 * import { hierarchyContract } from './hierarchy.contract.mycelia.js';
 * 
 * // Enforce contract on a hierarchy facet
 * hierarchyContract.enforce(ctx, api, subsystem, hierarchyFacet);
 */
import { createFacetContract } from '../facet-contract.js';

/**
 * Hierarchy Facet Contract
 * 
 * Required methods:
 * - addChild: Register a child subsystem under the current subsystem
 * - removeChild: Remove a registered child subsystem by reference or by name
 * - getChild: Retrieve a specific child subsystem by name
 * - listChildren: Return an array of all currently registered child subsystems
 * - setParent: Set the parent subsystem
 * - getParent: Get the parent subsystem
 * - isRoot: Check if this subsystem is a root (has no parent)
 * - getRoot: Get the root subsystem by traversing up the parent chain
 * - getLineage: Return the full ancestor chain (from root to node)
 * 
 * Required properties:
 * - children: Getter for direct access to registry instance (returns an object)
 * 
 * Custom validation:
 * - Validates children getter returns an object (not null or primitive)
 */
export const hierarchyContract = createFacetContract({
  name: 'hierarchy',
  requiredMethods: [
    'addChild',
    'removeChild',
    'getChild',
    'listChildren',
    'setParent',
    'getParent',
    'isRoot',
    'getRoot',
    'getLineage'
  ],
  requiredProperties: [
    'children'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate children getter exists and returns an object
    const registry = facet.children;
    if (typeof registry !== 'object' || registry === null) {
      throw new Error('Hierarchy facet children getter must return an object');
    }
  }
});

