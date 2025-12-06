import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem } from '../../../src/system/standalone-plugin-system.js';
import { createHook } from '../../../src/core/create-hook.js';
import { Facet } from '../../../src/core/facet.js';

describe('Dependency Resolution', () => {
  let system;

  beforeEach(() => {
    system = new StandalonePluginSystem('test', { config: {} });
  });

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  describe('simple dependencies', () => {
    it('should resolve single dependency', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .add({ connected: true })
      });

      const useCache = createHook({
        kind: 'cache',
        required: ['database'],
        attach: true,
        source: 'test.js',
        fn: (ctx, api) => {
          const db = api.__facets.database;
          expect(db).toBeDefined();
          return new Facet('cache', { attach: true, required: ['database'] });
        }
      });

      await system.use(useCache).use(useDatabase).build();

      expect(system.find('database')).toBeDefined();
      expect(system.find('cache')).toBeDefined();
    });

    it('should initialize dependencies before dependents', async () => {
      const initOrder = [];

      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .onInit(async ({ ctx, api, subsystem, facet }) => {
            initOrder.push('database');
          })
      });

      const useCache = createHook({
        kind: 'cache',
        required: ['database'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('cache', { attach: true, required: ['database'] })
          .onInit(async ({ ctx, api, subsystem, facet }) => {
            initOrder.push('cache');
          })
      });

      await system.use(useCache).use(useDatabase).build();

      expect(initOrder[0]).toBe('database');
      expect(initOrder[1]).toBe('cache');
    });
  });

  describe('multiple dependencies', () => {
    it('should resolve multiple dependencies', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      const useLogger = createHook({
        kind: 'logger',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('logger', { attach: true })
      });

      const useAPI = createHook({
        kind: 'api',
        required: ['database', 'logger'],
        attach: true,
        source: 'test.js',
        fn: (ctx, api) => {
          expect(api.__facets.database).toBeDefined();
          expect(api.__facets.logger).toBeDefined();
          return new Facet('api', { attach: true, required: ['database', 'logger'] });
        }
      });

      await system.use(useAPI).use(useDatabase).use(useLogger).build();

      expect(system.find('database')).toBeDefined();
      expect(system.find('logger')).toBeDefined();
      expect(system.find('api')).toBeDefined();
    });
  });

  describe('dependency chain', () => {
    it('should resolve dependency chain', async () => {
      const initOrder = [];

      const useA = createHook({
        kind: 'a',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('a', { attach: true })
          .onInit(async ({ ctx, api, subsystem, facet }) => { initOrder.push('a'); })
      });

      const useB = createHook({
        kind: 'b',
        required: ['a'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('b', { attach: true, required: ['a'] })
          .onInit(async ({ ctx, api, subsystem, facet }) => { initOrder.push('b'); })
      });

      const useC = createHook({
        kind: 'c',
        required: ['b'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('c', { attach: true, required: ['b'] })
          .onInit(async ({ ctx, api, subsystem, facet }) => { initOrder.push('c'); })
      });

      await system.use(useC).use(useB).use(useA).build();

      expect(initOrder).toEqual(['a', 'b', 'c']);
    });
  });

  describe('circular dependencies', () => {
    it('should detect circular dependencies', async () => {
      const useA = createHook({
        kind: 'a',
        required: ['b'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('a', { attach: true, required: ['b'] })
      });

      const useB = createHook({
        kind: 'b',
        required: ['a'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('b', { attach: true, required: ['a'] })
      });

      await expect(
        system.use(useA).use(useB).build()
      ).rejects.toThrow();
    });
  });

  describe('missing dependencies', () => {
    it('should fail if required dependency is missing', async () => {
      const useCache = createHook({
        kind: 'cache',
        required: ['database'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('cache', { attach: true, required: ['database'] })
      });

      await expect(
        system.use(useCache).build()
      ).rejects.toThrow();
    });
  });

  describe('registration order independence', () => {
    it('should work regardless of registration order', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      const useCache = createHook({
        kind: 'cache',
        required: ['database'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('cache', { attach: true, required: ['database'] })
      });

      // Register in reverse order
      await system.use(useCache).use(useDatabase).build();

      expect(system.find('database')).toBeDefined();
      expect(system.find('cache')).toBeDefined();
    });
  });
});

