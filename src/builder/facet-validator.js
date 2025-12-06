/**
 * Facet Validator Utilities
 * 
 * Handles validation of facets against their contracts.
 */

/**
 * Validate facets against their contracts
 * 
 * Iterates through all collected facets and enforces their contracts if they have one.
 * Throws immediately if any contract validation fails.
 * 
 * @param {Object} facetsByKind - Object mapping facet kinds to Facet instances
 * @param {Object} resolvedCtx - Resolved context object
 * @param {BaseSubsystem} subsystem - Subsystem instance
 * @param {FacetContractRegistry} contractRegistry - Contract registry to use for validation
 * @throws {Error} If a facet has a contract that doesn't exist in the registry, or if contract enforcement fails
 */
export function validateFacets(facetsByKind, resolvedCtx, subsystem, contractRegistry) {
  for (const [kind, facet] of Object.entries(facetsByKind)) {
    const contractName = facet.getContract?.();
    
    // Skip if facet has no contract
    if (!contractName || typeof contractName !== 'string' || !contractName.trim()) {
      continue;
    }
    
    // Check if contract exists in registry
    if (!contractRegistry.has(contractName)) {
      const facetSource = facet.getSource?.() || '<unknown>';
      throw new Error(`Facet '${kind}' (from ${facetSource}) has contract '${contractName}' which is not registered in the contract registry.`);
    }
    
    // Enforce the contract (will throw if validation fails)
    try {
      contractRegistry.enforce(contractName, resolvedCtx, subsystem.api, subsystem, facet);
    } catch (error) {
      const facetSource = facet.getSource?.() || '<unknown>';
      throw new Error(`Facet '${kind}' (from ${facetSource}) failed contract validation for '${contractName}': ${error.message}`);
    }
  }
}

