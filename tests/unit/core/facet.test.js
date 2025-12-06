import { describe, it, expect } from 'vitest';
import { Facet } from '../../../src/core/facet.js';

describe('Facet', () => {
  describe('constructor', () => {
    it('should create a facet with kind', () => {
      const facet = new Facet('database');
      expect(facet.getKind()).toBe('database');
    });

    it('should use default values for optional parameters', () => {
      const facet = new Facet('test');
      expect(facet.shouldAttach()).toBe(false);
      expect(facet.getDependencies()).toEqual([]);
      expect(facet.getSource()).toBeUndefined();
      expect(facet.getContract()).toBe(null);
      expect(facet.getVersion()).toBe('0.0.0');
    });

    it('should accept options', () => {
      const facet = new Facet('test', {
        attach: true,
        required: ['database'],
        source: 'test.js',
        contract: 'test-contract',
        version: '1.0.0'
      });

      expect(facet.getKind()).toBe('test');
      expect(facet.shouldAttach()).toBe(true);
      expect(facet.getDependencies()).toEqual(['database']);
      expect(facet.getSource()).toBe('test.js');
      expect(facet.getContract()).toBe('test-contract');
      expect(facet.getVersion()).toBe('1.0.0');
    });
  });

  describe('add', () => {
    it('should add methods to facet', () => {
      const facet = new Facet('test')
        .add({
          method1() { return 'result1'; },
          method2() { return 'result2'; }
        });

      expect(typeof facet.method1).toBe('function');
      expect(typeof facet.method2).toBe('function');
      expect(facet.method1()).toBe('result1');
      expect(facet.method2()).toBe('result2');
    });

    it('should return facet for chaining', () => {
      const facet = new Facet('test');
      const result = facet.add({ method() {} });
      expect(result).toBe(facet);
    });

    it('should allow multiple add calls', () => {
      const facet = new Facet('test')
        .add({ method1() { return 1; } })
        .add({ method2() { return 2; } });

      expect(facet.method1()).toBe(1);
      expect(facet.method2()).toBe(2);
    });

    it('should merge properties', () => {
      const facet = new Facet('test')
        .add({ prop: 'value1' })
        .add({ prop: 'value2' });

      // Properties are merged, but existing properties are skipped (not overwritten)
      // This is by design - the add() method skips properties that already exist
      expect(facet.prop).toBe('value1');
    });
  });

  describe('onInit', () => {
    it('should register init callback', () => {
      const facet = new Facet('test');
      const callback = async () => {};
      
      const result = facet.onInit(callback);
      expect(result).toBe(facet); // Returns facet for chaining
    });

    it('should return facet for chaining', () => {
      const facet = new Facet('test');
      const result = facet.onInit(async () => {});
      expect(result).toBe(facet);
    });
  });

  describe('onDispose', () => {
    it('should register dispose callback', () => {
      const facet = new Facet('test');
      const callback = async () => {};
      
      const result = facet.onDispose(callback);
      expect(result).toBe(facet); // Returns facet for chaining
    });

    it('should return facet for chaining', () => {
      const facet = new Facet('test');
      const result = facet.onDispose(async () => {});
      expect(result).toBe(facet);
    });
  });

  describe('introspection methods', () => {
    it('should return kind', () => {
      const facet = new Facet('database');
      expect(facet.getKind()).toBe('database');
    });

    it('should return version', () => {
      const facet = new Facet('test', { version: '1.2.3' });
      expect(facet.getVersion()).toBe('1.2.3');
    });

    it('should return required dependencies', () => {
      const facet = new Facet('test', { required: ['database', 'logger'] });
      expect(facet.getDependencies()).toEqual(['database', 'logger']);
    });

    it('should return source', () => {
      const facet = new Facet('test', { source: 'test.js' });
      expect(facet.getSource()).toBe('test.js');
    });

    it('should return contract', () => {
      const facet = new Facet('test', { contract: 'test-contract' });
      expect(facet.getContract()).toBe('test-contract');
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const facet = new Facet('test')
        .add({ method() { return 'test'; } })
        .onInit(async () => {})
        .onDispose(async () => {});

      expect(facet.getKind()).toBe('test');
      expect(typeof facet.method).toBe('function');
      // Callbacks are stored internally, not as public properties
    });
  });
});

