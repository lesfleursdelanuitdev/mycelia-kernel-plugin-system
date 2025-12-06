/**
 * Speak Contract
 * 
 * Defines the interface for facets that provide speaking/printing functionality.
 * This is a simple example contract for demonstration purposes.
 * 
 * @example
 * // Create a speak contract
 * const speakContract = createFacetContract({
 *   name: 'speak',
 *   requiredMethods: ['say', 'sayLine'],
 *   requiredProperties: []
 * });
 */
import { createFacetContract } from '../facet-contract.js';

export const speakContract = createFacetContract({
  name: 'speak',
  requiredMethods: ['say', 'sayLine'],
  requiredProperties: [],
  validate: (ctx, api, subsystem, facet) => {
    const errors = [];
    
    // Validate say method
    if (typeof facet.say !== 'function') {
      errors.push('speak facet must have a say() method');
    } else {
      // Check method signature (should accept at least one argument)
      if (facet.say.length < 1) {
        errors.push('speak.say() method must accept at least one argument (message)');
      }
    }
    
    // Validate sayLine method
    if (typeof facet.sayLine !== 'function') {
      errors.push('speak facet must have a sayLine() method');
    } else {
      // Check method signature (should accept at least one argument)
      if (facet.sayLine.length < 1) {
        errors.push('speak.sayLine() method must accept at least one argument (message)');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
});

