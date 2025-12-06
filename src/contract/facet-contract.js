/**
 * FacetContract Class
 * 
 * Defines a contract that facets must satisfy, including required methods,
 * required properties, and optional custom validation logic.
 * 
 * @example
 * const routerContract = new FacetContract('router', {
 *   requiredMethods: ['registerRoute', 'match'],
 *   requiredProperties: ['_routeRegistry']
 * }, (ctx, api, subsystem, facet) => {
 *   // Additional custom validation
 * });
 * 
 * routerContract.enforce(ctx, api, subsystem, routerFacet);
 */
export class FacetContract {
  #validate = null;

  /**
   * Create a new FacetContract
   * 
   * @param {string} name - Name of the contract (usually same as facet kind)
   * @param {Object} requirements - Requirements object
   * @param {Array<string>} [requirements.requiredMethods=[]] - Array of required method names that must be implemented
   * @param {Array<string>} [requirements.requiredProperties=[]] - Array of required property names that must exist
   * @param {Function} [validate] - Optional validation function with signature (ctx, api, subsystem, facet)
   */
  constructor(name, requirements = {}, validate = null) {
    if (!name || typeof name !== 'string') {
      throw new Error('FacetContract: name must be a non-empty string');
    }
    if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements)) {
      throw new Error('FacetContract: requirements must be an object');
    }
    if (validate !== null && typeof validate !== 'function') {
      throw new Error('FacetContract: validate must be a function or null');
    }

    this.name = name;
    this.requiredMethods = Array.isArray(requirements.requiredMethods) 
      ? [...requirements.requiredMethods] 
      : [];
    this.requiredProperties = Array.isArray(requirements.requiredProperties)
      ? [...requirements.requiredProperties]
      : [];
    this.#validate = validate;
  }

  /**
   * Enforce the contract on a facet
   * 
   * Checks that all required methods and properties exist on the facet,
   * then runs the custom validation function if provided.
   * 
   * @param {Object} ctx - Context object
   * @param {Object} api - Subsystem API object
   * @param {BaseSubsystem} subsystem - Subsystem instance
   * @param {Facet} facet - Facet to validate
   * @throws {Error} If required methods or properties are missing or validation fails
   */
  enforce(ctx, api, subsystem, facet) {
    if (!facet || typeof facet !== 'object') {
      throw new Error(`FacetContract '${this.name}': facet must be an object`);
    }

    // Check that all required methods are implemented
    const missingMethods = [];
    for (const methodName of this.requiredMethods) {
      if (typeof facet[methodName] !== 'function') {
        missingMethods.push(methodName);
      }
    }

    if (missingMethods.length > 0) {
      throw new Error(
        `FacetContract '${this.name}': facet is missing required methods: ${missingMethods.join(', ')}`
      );
    }

    // Check that all required properties exist
    const missingProperties = [];
    for (const propertyName of this.requiredProperties) {
      if (!(propertyName in facet) || facet[propertyName] === undefined) {
        missingProperties.push(propertyName);
      }
    }

    if (missingProperties.length > 0) {
      throw new Error(
        `FacetContract '${this.name}': facet is missing required properties: ${missingProperties.join(', ')}`
      );
    }

    // Run custom validation if provided
    if (this.#validate !== null) {
      try {
        this.#validate(ctx, api, subsystem, facet);
      } catch (error) {
        throw new Error(
          `FacetContract '${this.name}': validation failed: ${error.message}`
        );
      }
    }
  }
}

/**
 * FacetContract Factory Function
 * 
 * Creates a FacetContract instance with validation and error handling.
 * 
 * @param {Object} options - Contract configuration
 * @param {string} options.name - Name of the contract (usually same as facet kind)
 * @param {Array<string>} [options.requiredMethods=[]] - Array of required method names that must be implemented
 * @param {Array<string>} [options.requiredProperties=[]] - Array of required property names that must exist
 * @param {Function} [options.validate] - Optional validation function with signature (ctx, api, subsystem, facet)
 * @returns {FacetContract} New FacetContract instance
 * 
 * @example
 * const routerContract = createFacetContract({
 *   name: 'router',
 *   requiredMethods: ['registerRoute', 'match', 'route'],
 *   requiredProperties: ['_routeRegistry'],
 *   validate: (ctx, api, subsystem, facet) => {
 *     // Additional custom validation
 *     if (typeof facet._routeRegistry !== 'object') {
 *       throw new Error('Router facet _routeRegistry must be an object');
 *     }
 *   }
 * });
 */
export function createFacetContract({ name, requiredMethods = [], requiredProperties = [], validate = null }) {
  return new FacetContract(name, { requiredMethods, requiredProperties }, validate);
}

