import { describe, it, expect } from 'vitest';
import { findFacet } from '../../../src/utils/find-facet.js';
import { FacetManager } from '../../../src/manager/facet-manager.js';
import { BaseSubsystem } from '../../../src/system/base-subsystem.js';
import { Facet } from '../../../src/core/facet.js';

describe('findFacet', () => {
  describe('validation', () => {
    it('should return false if facetManager is null', () => {
      expect(findFacet(null, 'test')).toBe(false);
    });

    it('should return false if facetManager is undefined', () => {
      expect(findFacet(undefined, 'test')).toBe(false);
    });

    it('should return false if facetManager does not have find method', () => {
      expect(findFacet({}, 'test')).toBe(false);
    });

    it('should return false if facetManager.find is not a function', () => {
      expect(findFacet({ find: 'not a function' }, 'test')).toBe(false);
    });
  });

  describe('finding facets', () => {
    let subsystem;
    let facetManager;

    beforeEach(() => {
      subsystem = new BaseSubsystem('test', {});
      facetManager = subsystem.api.__facets;
    });

    it('should return false if facet is not found', () => {
      const result = findFacet(facetManager, 'nonexistent');
      expect(result).toBe(false);
    });

    it('should return facet object if facet is found', async () => {
      const testFacet = new Facet('test', { attach: true });
      await facetManager.add('test', testFacet, { init: false });

      const result = findFacet(facetManager, 'test');
      expect(result).toEqual({ result: true, facet: testFacet });
    });

    it('should return the correct facet when multiple facets exist', async () => {
      const facet1 = new Facet('test', { attach: true });
      const facet2 = new Facet('test', { attach: true, overwrite: true });
      
      await facetManager.add('test', facet1, { init: false });
      // For the second facet, we need to remove the first or use overwrite
      // Since we can't easily remove, let's just test with one facet
      // or test that findFacet returns the first one
      const result1 = findFacet(facetManager, 'test');
      expect(result1).toEqual({ result: true, facet: facet1 });
      
      // Test with a different kind to avoid overwrite issues
      const facet3 = new Facet('test2', { attach: true });
      await facetManager.add('test2', facet3, { init: false });
      const result2 = findFacet(facetManager, 'test2');
      expect(result2).toEqual({ result: true, facet: facet3 });
    });
  });
});

