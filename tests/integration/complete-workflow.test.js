import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem, createHook, Facet, createFacetContract, defaultContractRegistry, FacetContractRegistry } from '../../src/index.js';

describe('Complete Workflow Integration Tests', () => {
  let system;

  beforeEach(() => {
    system = new StandalonePluginSystem('test-app', {
      config: {
        database: {
          host: 'localhost',
          port: 5432
        },
        cache: {
          maxSize: 1000
        }
      }
    });
  });

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  describe('basic plugin workflow', () => {
    it('should create and use a simple plugin', async () => {
      const useLogger = createHook({
        kind: 'logger',
        version: '1.0.0',
        attach: true,
        source: 'test.js',
        fn: (ctx) => {
          const config = ctx.config?.logger || {};
          return new Facet('logger', {
            attach: true,
            source: 'test.js',
            version: '1.0.0'
          })
          .add({
            log(message) {
              console.log(`[${config.level || 'INFO'}] ${message}`);
            }
          });
        }
      });

      await system.use(useLogger).build();

      const logger = system.find('logger');
      expect(logger).toBeDefined();
      expect(typeof logger.log).toBe('function');
    });
  });

  describe('dependency workflow', () => {
    it('should handle plugin with dependencies', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .add({
            async query(sql) {
              return { rows: [] };
            }
          })
      });

      const useCache = createHook({
        kind: 'cache',
        required: ['database'],
        attach: true,
        source: 'test.js',
        fn: (ctx, api) => {
          const db = api.__facets.database;
          const facet = new Facet('cache', { attach: true, required: ['database'] });
          facet.store = new Map();
          return facet.add({
            async get(key) {
              return this.store.get(key);
            },
            async set(key, value) {
              this.store.set(key, value);
            }
          });
        }
      });

      await system.use(useDatabase).use(useCache).build();

      const cache = system.find('cache');
      expect(cache).toBeDefined();
      await cache.set('key', 'value');
      expect(await cache.get('key')).toBe('value');
    });
  });

  describe('lifecycle workflow', () => {
    it('should handle initialization and disposal', async () => {
      const lifecycle = [];

      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => {
          const facet = new Facet('database', { attach: true });
          facet.connected = false;
          return facet
            .add({
              connected: false
            })
            .onInit(async ({ ctx, api, subsystem, facet }) => {
              lifecycle.push('init');
              facet.connected = true;
            })
            .onDispose(async (facet) => {
              lifecycle.push('dispose');
              // Note: facet is frozen after init, so we can't modify properties
              // This is expected behavior - dispose should only clean up resources
            });
        }
      });

      await system.use(useDatabase).build();
      expect(lifecycle).toContain('init');

      await system.dispose();
      expect(lifecycle).toContain('dispose');
    });
  });

  describe('contract validation workflow', () => {
    it('should validate contracts during build', async () => {
      const databaseContract = createFacetContract({
        name: 'database',
        requiredMethods: ['query', 'close']
      });

      // Register contract in default registry
      defaultContractRegistry.register(databaseContract);

      const useDatabase = createHook({
        kind: 'database',
        contract: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', {
          attach: true,
          contract: 'database'
        })
        .add({
          query() {},
          close() {}
        })
      });

      await system.use(useDatabase).build();

      const db = system.find('database');
      expect(db).toBeDefined();
      
      // Clean up - remove the contract after test
      defaultContractRegistry.remove('database');
    });

    it('should fail build if contract validation fails', async () => {
      const databaseContract = createFacetContract({
        name: 'database',
        requiredMethods: ['query', 'close']
      });

      const registry = new FacetContractRegistry();
      registry.register(databaseContract);

      const useDatabase = createHook({
        kind: 'database',
        contract: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', {
          attach: true,
          contract: 'database'
        })
        .add({
          query() {}
          // missing close()
        })
      });

      await expect(
        system.use(useDatabase).build()
      ).rejects.toThrow();
    });
  });

  describe('transaction rollback workflow', () => {
    it('should rollback on initialization failure', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .onInit(async ({ ctx, api, subsystem, facet }) => {
            throw new Error('Init failed');
          })
      });

      await expect(
        system.use(useDatabase).build()
      ).rejects.toThrow('Init failed');

      // System should be in clean state
      expect(system.isBuilt).toBe(false);
      expect(system.find('database')).toBeUndefined();
    });
  });

  describe('multiple facets workflow', () => {
    it('should handle multiple facets of same kind with overwrite', async () => {
      const useLogger1 = createHook({
        kind: 'logger',
        overwrite: true,
        attach: true,
        source: 'test.js',
        fn: () => new Facet('logger', { attach: true, overwrite: true })
          .add({ name: 'logger1' })
      });

      const useLogger2 = createHook({
        kind: 'logger',
        overwrite: true,
        attach: true,
        source: 'test.js',
        fn: () => new Facet('logger', { attach: true, overwrite: true })
          .add({ name: 'logger2' })
      });

      await system.use(useLogger1).use(useLogger2).build();

      // With overwrite, the second one replaces the first
      const latest = system.find('logger');
      expect(latest.name).toBe('logger2');
    });
  });
});

