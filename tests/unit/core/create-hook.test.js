import { describe, it, expect } from 'vitest';
import { createHook } from '../../../src/core/create-hook.js';
import { Facet } from '../../../src/core/facet.js';

describe('createHook', () => {
  describe('validation', () => {
    it('should throw if kind is missing', () => {
      expect(() => {
        createHook({
          source: 'test.js',
          fn: () => new Facet('test')
        });
      }).toThrow('createHook: kind must be a non-empty string');
    });

    it('should throw if kind is not a string', () => {
      expect(() => {
        createHook({
          kind: 123,
          source: 'test.js',
          fn: () => new Facet('test')
        });
      }).toThrow('createHook: kind must be a non-empty string');
    });

    it('should throw if source is missing', () => {
      expect(() => {
        createHook({
          kind: 'test',
          fn: () => new Facet('test')
        });
      }).toThrow('createHook: source must be a non-empty string');
    });

    it('should throw if fn is not a function', () => {
      expect(() => {
        createHook({
          kind: 'test',
          source: 'test.js',
          fn: 'not a function'
        });
      }).toThrow('createHook: fn must be a function');
    });

    it('should throw if contract is not a string or null', () => {
      expect(() => {
        createHook({
          kind: 'test',
          source: 'test.js',
          fn: () => new Facet('test'),
          contract: 123
        });
      }).toThrow('createHook: contract must be a non-empty string or null');
    });

    it('should throw if version is invalid semver', () => {
      expect(() => {
        createHook({
          kind: 'test',
          version: 'invalid',
          source: 'test.js',
          fn: () => new Facet('test')
        });
      }).toThrow('createHook: invalid semver version');
    });
  });

  describe('hook creation', () => {
    it('should create a hook function', () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: () => new Facet('test')
      });

      expect(typeof hook).toBe('function');
    });

    it('should attach metadata to hook', () => {
      const hook = createHook({
        kind: 'database',
        version: '1.0.0',
        required: ['logger'],
        attach: true,
        overwrite: true,
        source: 'test.js',
        contract: 'database',
        fn: () => new Facet('database')
      });

      expect(hook.kind).toBe('database');
      expect(hook.version).toBe('1.0.0');
      expect(hook.required).toEqual(['logger']);
      expect(hook.attach).toBe(true);
      expect(hook.overwrite).toBe(true);
      expect(hook.source).toBe('test.js');
      expect(hook.contract).toBe('database');
    });

    it('should use default version if not provided', () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: () => new Facet('test')
      });

      expect(hook.version).toBe('0.0.0');
    });

    it('should use default values for optional parameters', () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: () => new Facet('test')
      });

      expect(hook.overwrite).toBe(false);
      expect(hook.required).toEqual([]);
      expect(hook.attach).toBe(false);
      expect(hook.contract).toBe(null);
    });
  });

  describe('hook execution', () => {
    it('should execute hook function with context', () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: (ctx, api, subsystem) => {
          expect(ctx).toBeDefined();
          expect(api).toBeDefined();
          expect(subsystem).toBeDefined();
          return new Facet('test');
        }
      });

      const ctx = { config: {} };
      const api = { name: 'test', __facets: {} };
      const subsystem = {};

      const facet = hook(ctx, api, subsystem);
      expect(facet).toBeInstanceOf(Facet);
    });

    it('should pass contract and version in context', () => {
      let receivedCtx = null;
      const hook = createHook({
        kind: 'test',
        version: '1.2.3',
        contract: 'test-contract',
        source: 'test.js',
        fn: (ctx) => {
          receivedCtx = ctx;
          return new Facet('test');
        }
      });

      hook({ config: {} }, {}, {});
      
      expect(receivedCtx.__contract).toBe('test-contract');
      expect(receivedCtx.__version).toBe('1.2.3');
    });

    it('should merge context with contract and version', () => {
      let receivedCtx = null;
      const hook = createHook({
        kind: 'test',
        version: '1.0.0',
        source: 'test.js',
        fn: (ctx) => {
          receivedCtx = ctx;
          return new Facet('test');
        }
      });

      const originalCtx = { config: { test: true }, debug: true };
      hook(originalCtx, {}, {});
      
      expect(receivedCtx.config).toEqual({ test: true });
      expect(receivedCtx.debug).toBe(true);
      expect(receivedCtx.__version).toBe('1.0.0');
    });
  });
});

