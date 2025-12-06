import { describe, it, expect } from 'vitest';
import { createFacetContract, FacetContract } from '../../../src/contract/facet-contract.js';
import { Facet } from '../../../src/core/facet.js';

describe('FacetContract', () => {
  describe('createFacetContract', () => {
    it('should create a contract', () => {
      const contract = createFacetContract({
        name: 'database',
        requiredMethods: ['query', 'close'],
        requiredProperties: ['connection']
      });

      expect(contract).toBeInstanceOf(FacetContract);
      expect(contract.name).toBe('database');
    });

    it('should validate required methods', () => {
      const contract = createFacetContract({
        name: 'database',
        requiredMethods: ['query', 'close']
      });

      const validFacet = new Facet('database')
        .add({
          query() {},
          close() {}
        });

      expect(() => contract.enforce({}, {}, {}, validFacet)).not.toThrow();
    });

    it('should throw if required method is missing', () => {
      const contract = createFacetContract({
        name: 'database',
        requiredMethods: ['query', 'close']
      });

      const invalidFacet = new Facet('database')
        .add({
          query() {}
          // missing close()
        });

      expect(() => contract.enforce({}, {}, {}, invalidFacet)).toThrow();
    });

    it('should validate required properties', () => {
      const contract = createFacetContract({
        name: 'database',
        requiredProperties: ['connection']
      });

      const validFacet = new Facet('database')
        .add({
          connection: {}
        });

      expect(() => contract.enforce({}, {}, {}, validFacet)).not.toThrow();
    });

    it('should throw if required property is missing', () => {
      const contract = createFacetContract({
        name: 'database',
        requiredProperties: ['connection']
      });

      const invalidFacet = new Facet('database')
        .add({
          // missing connection
        });

      expect(() => contract.enforce({}, {}, {}, invalidFacet)).toThrow();
    });

    it('should use custom validation function', () => {
      const contract = createFacetContract({
        name: 'database',
        validate: (ctx, api, subsystem, facet) => {
          if (!facet.query || typeof facet.query !== 'function') {
            throw new Error('Must have query method');
          }
          return true;
        }
      });

      const validFacet = new Facet('database')
        .add({ query() {} });

      expect(() => contract.enforce({}, {}, {}, validFacet)).not.toThrow();

      const invalidFacet = new Facet('database')
        .add({});

      expect(() => contract.enforce({}, {}, {}, invalidFacet)).toThrow('Must have query method');
    });
  });

  describe('FacetContract', () => {
    it('should have name property', () => {
      const contract = new FacetContract('test');
      expect(contract.name).toBe('test');
    });

    it('should validate with no requirements', () => {
      const contract = new FacetContract('test');
      const facet = new Facet('test');
      expect(() => contract.enforce({}, {}, {}, facet)).not.toThrow();
    });
  });
});

