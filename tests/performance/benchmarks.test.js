import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem, createHook, Facet, useBase } from '../../src/index.js';

/**
 * Performance Benchmarks
 * 
 * Tests that measure and report performance metrics for various operations:
 * - System build time
 * - Hook execution time
 * - Facet lookup time
 * - Dependency resolution time
 * - Transaction rollback time
 */

describe('Performance Benchmarks', () => {
  let system;

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  /**
   * Helper to create a simple hook for testing
   */
  function createSimpleHook(kind, dependencies = []) {
    return createHook({
      kind,
      version: '1.0.0',
      required: dependencies,
      attach: true,
      source: `test://${kind}`,
      fn: (ctx, api, subsystem) => {
        return new Facet(kind, {
          attach: true,
          source: `test://${kind}`,
          required: dependencies
        })
        .add({
          value: `${kind}-value`,
          getValue() {
            return this.value;
          }
        });
      }
    });
  }

  describe('System Build Performance', () => {
    it('should build a system with 10 plugins quickly', async () => {
      system = new StandalonePluginSystem('bench-10', {});
      
      // Create 10 independent hooks
      for (let i = 0; i < 10; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }

      const start = performance.now();
      await system.build();
      const duration = performance.now() - start;

      // Should complete in reasonable time (< 100ms for 10 plugins)
      expect(duration).toBeLessThan(100);
      console.log(`[Benchmark] 10 plugins build time: ${duration.toFixed(2)}ms`);
    });

    it('should build a system with 100 plugins efficiently', async () => {
      system = new StandalonePluginSystem('bench-100', {});
      
      // Create 100 independent hooks
      for (let i = 0; i < 100; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }

      const start = performance.now();
      await system.build();
      const duration = performance.now() - start;

      // Should complete in reasonable time (< 500ms for 100 plugins)
      expect(duration).toBeLessThan(500);
      console.log(`[Benchmark] 100 plugins build time: ${duration.toFixed(2)}ms`);
    });

    it('should handle deep dependency chains efficiently', async () => {
      system = new StandalonePluginSystem('bench-chain', {});
      
      // Create a chain: plugin-0 -> plugin-1 -> ... -> plugin-9
      for (let i = 0; i < 10; i++) {
        const deps = i > 0 ? [`plugin-${i - 1}`] : [];
        system.use(createSimpleHook(`plugin-${i}`, deps));
      }

      const start = performance.now();
      await system.build();
      const duration = performance.now() - start;

      // Should complete quickly even with deep chains
      expect(duration).toBeLessThan(100);
      console.log(`[Benchmark] 10-plugin chain build time: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Facet Lookup Performance', () => {
    beforeEach(async () => {
      system = new StandalonePluginSystem('bench-lookup', {});
      
      // Create 50 plugins
      for (let i = 0; i < 50; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }
      
      await system.build();
    });

    it('should find facets quickly', () => {
      const iterations = 1000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const kind = `plugin-${i % 50}`;
        const facet = system.find(kind);
        expect(facet).toBeDefined();
      }
      
      const duration = performance.now() - start;
      const avgTime = duration / iterations;
      
      // Average lookup should be very fast (< 0.1ms)
      expect(avgTime).toBeLessThan(0.1);
      console.log(`[Benchmark] Average facet lookup time: ${avgTime.toFixed(4)}ms (${iterations} iterations)`);
    });

    it('should handle find() with non-existent facets efficiently', () => {
      const iterations = 1000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const result = system.find(`non-existent-${i}`);
        expect(result).toBeUndefined();
      }
      
      const duration = performance.now() - start;
      const avgTime = duration / iterations;
      
      // Should be fast even for non-existent facets
      expect(avgTime).toBeLessThan(0.1);
      console.log(`[Benchmark] Average non-existent lookup time: ${avgTime.toFixed(4)}ms`);
    });
  });

  describe('Dependency Resolution Performance', () => {
    it('should resolve complex dependency graphs efficiently', async () => {
      system = new StandalonePluginSystem('bench-deps', {});
      
      // Create a complex dependency graph:
      // - 20 base plugins (no deps)
      // - 20 plugins depending on base plugins
      // - 10 plugins depending on second layer
      for (let i = 0; i < 20; i++) {
        system.use(createSimpleHook(`base-${i}`));
      }
      
      for (let i = 0; i < 20; i++) {
        system.use(createSimpleHook(`middle-${i}`, [`base-${i % 20}`]));
      }
      
      for (let i = 0; i < 10; i++) {
        system.use(createSimpleHook(`top-${i}`, [`middle-${i % 20}`]));
      }

      const start = performance.now();
      await system.build();
      const duration = performance.now() - start;

      // Should handle complex graphs efficiently
      expect(duration).toBeLessThan(200);
      console.log(`[Benchmark] Complex dependency graph (50 plugins) build time: ${duration.toFixed(2)}ms`);
    });

    it('should cache dependency graph results', async () => {
      system = new StandalonePluginSystem('bench-cache', {});
      
      // Create 30 plugins
      for (let i = 0; i < 30; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }

      // First build (no cache)
      const start1 = performance.now();
      await system.build();
      const duration1 = performance.now() - start1;

      // Dispose and create a new system with same structure (should use cache)
      await system.dispose();
      system = new StandalonePluginSystem('bench-cache-2', {});
      
      // Create same plugins (same dependency structure)
      for (let i = 0; i < 30; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }
      
      const start2 = performance.now();
      await system.build();
      const duration2 = performance.now() - start2;

      // Second build should be similar or faster due to caching
      // (though the difference may be small for simple graphs)
      console.log(`[Benchmark] First build: ${duration1.toFixed(2)}ms, Second build: ${duration2.toFixed(2)}ms`);
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.5); // Allow some variance
    });
  });

  describe('Transaction Rollback Performance', () => {
    it('should rollback quickly on failure', async () => {
      system = new StandalonePluginSystem('bench-rollback', {});
      
      // Create 20 working plugins
      for (let i = 0; i < 20; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }
      
      // Add a failing plugin
      const failingHook = createHook({
        kind: 'failing',
        version: '1.0.0',
        attach: true,
        source: 'test://failing',
        fn: (ctx, api, subsystem) => {
          return new Facet('failing', { attach: true, source: 'test://failing' })
            .add({})
            .onInit(async () => {
              throw new Error('Intentional failure');
            });
        }
      });
      
      system.use(failingHook);

      const start = performance.now();
      try {
        await system.build();
        expect.fail('Should have thrown an error');
      } catch (error) {
        const duration = performance.now() - start;
        
        // Rollback should be fast
        expect(duration).toBeLessThan(100);
        console.log(`[Benchmark] Rollback time: ${duration.toFixed(2)}ms`);
        
        // System should be in clean state
        expect(system.isBuilt).toBe(false);
      }
    });
  });

  describe('useBase Fluent API Performance', () => {
    it('should build with useBase efficiently', async () => {
      const start = performance.now();
      
      system = await useBase('bench-usebase')
        .config('test', { value: 1 })
        .use(createSimpleHook('plugin-1'))
        .use(createSimpleHook('plugin-2'))
        .use(createSimpleHook('plugin-3'))
        .build();
      
      const duration = performance.now() - start;
      
      // Should be efficient
      expect(duration).toBeLessThan(50);
      console.log(`[Benchmark] useBase build time: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Parallel Initialization Performance', () => {
    it('should initialize independent facets in parallel', async () => {
      system = new StandalonePluginSystem('bench-parallel', {});
      
      let initOrder = [];
      
      // Create 10 independent plugins with async init
      for (let i = 0; i < 10; i++) {
        const hook = createHook({
          kind: `plugin-${i}`,
          version: '1.0.0',
          attach: true,
          source: `test://plugin-${i}`,
          fn: (ctx, api, subsystem) => {
            return new Facet(`plugin-${i}`, {
              attach: true,
              source: `test://plugin-${i}`
            })
            .add({})
            .onInit(async () => {
              // Simulate async work
              await new Promise(resolve => setTimeout(resolve, 10));
              initOrder.push(i);
            });
          }
        });
        system.use(hook);
      }

      const start = performance.now();
      await system.build();
      const duration = performance.now() - start;

      // Should be faster than sequential (10 * 10ms = 100ms)
      // Parallel should be closer to 10ms + overhead
      expect(duration).toBeLessThan(50);
      console.log(`[Benchmark] Parallel initialization time: ${duration.toFixed(2)}ms`);
      
      // All should have initialized
      expect(initOrder.length).toBe(10);
    });
  });
});

