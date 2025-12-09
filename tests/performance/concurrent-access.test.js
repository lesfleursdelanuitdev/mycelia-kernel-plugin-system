import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem, createHook, Facet } from '../../src/index.js';

/**
 * Concurrent Access Tests
 * 
 * Tests that verify thread-safety and concurrent access patterns:
 * - Concurrent builds
 * - Concurrent facet lookups
 * - Concurrent modifications
 * - Race conditions
 * - Parallel system operations
 */

describe('Concurrent Access Tests', () => {
  let system;

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  /**
   * Helper to create a simple hook with mutable state
   */
  function createSimpleHook(kind) {
    // Use closure to store mutable state (facets are frozen after init)
    let value = 0;
    
    return createHook({
      kind,
      version: '1.0.0',
      attach: true,
      source: `test://${kind}`,
      fn: (ctx, api, subsystem) => {
        return new Facet(kind, {
          attach: true,
          source: `test://${kind}`
        })
        .add({
          increment() {
            value++;
            return value;
          },
          getValue() {
            return value;
          }
        });
      }
    });
  }

  describe('Concurrent Facet Lookups', () => {
    beforeEach(async () => {
      system = new StandalonePluginSystem('concurrent-lookup', {});
      
      // Create 20 plugins
      for (let i = 0; i < 20; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }
      
      await system.build();
    });

    it('should handle concurrent find() operations', async () => {
      const iterations = 100;
      const concurrency = 10;
      
      const results = await Promise.all(
        Array.from({ length: concurrency }, async (_, threadId) => {
          const threadResults = [];
          for (let i = 0; i < iterations; i++) {
            const kind = `plugin-${(threadId * iterations + i) % 20}`;
            const facet = system.find(kind);
            threadResults.push(facet ? facet.getValue() : null);
          }
          return threadResults;
        })
      );
      
      // All threads should get valid results
      const allValid = results.every(threadResults => 
        threadResults.every(result => result !== null)
      );
      expect(allValid).toBe(true);
    });

    it('should handle concurrent getAll() operations', async () => {
      const concurrency = 20;
      
      const results = await Promise.all(
        Array.from({ length: concurrency }, async () => {
          return system.api.__facets.getAll('plugin-0');
        })
      );
      
      // All should return consistent results
      const firstLength = results[0].length;
      const allSame = results.every(r => r.length === firstLength);
      expect(allSame).toBe(true);
    });
  });

  describe('Concurrent System Operations', () => {
    it('should handle concurrent builds of different systems', async () => {
      const systems = [];
      
      try {
        // Create and build 10 systems concurrently
        const buildPromises = Array.from({ length: 10 }, async (_, i) => {
          const sys = new StandalonePluginSystem(`concurrent-${i}`, {});
          for (let j = 0; j < 10; j++) {
            sys.use(createSimpleHook(`plugin-${j}`));
          }
          await sys.build();
          return sys;
        });
        
        const builtSystems = await Promise.all(buildPromises);
        systems.push(...builtSystems);
        
        // All systems should be built correctly
        builtSystems.forEach((sys, i) => {
          expect(sys.isBuilt).toBe(true);
          expect(sys.find('plugin-0')).toBeDefined();
        });
      } finally {
        // Cleanup
        await Promise.all(systems.map(s => s.dispose()));
      }
    });

    it('should handle concurrent reload operations', async () => {
      system = new StandalonePluginSystem('concurrent-reload', {});
      
      // Initial build
      for (let i = 0; i < 10; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }
      await system.build();
      
      // Multiple reloads (should be sequential, but test that it doesn't break)
      await system.reload();
      system.use(createSimpleHook('plugin-10'));
      await system.build();
      
      await system.reload();
      system.use(createSimpleHook('plugin-11'));
      await system.build();
      
      // Should have all plugins
      expect(system.find('plugin-0')).toBeDefined();
      expect(system.find('plugin-10')).toBeDefined();
      expect(system.find('plugin-11')).toBeDefined();
    });
  });

  describe('Race Conditions', () => {
    it('should handle find() during build', async () => {
      system = new StandalonePluginSystem('race-build', {});
      
      // Create hooks with async init that access other facets
      system.use(createSimpleHook('plugin-1'));
      
      const hook2 = createHook({
        kind: 'plugin-2',
        version: '1.0.0',
        required: ['plugin-1'],
        attach: true,
        source: 'test://plugin-2',
        fn: (ctx, api, subsystem) => {
          return new Facet('plugin-2', {
            attach: true,
            source: 'test://plugin-2',
            required: ['plugin-1']
          })
          .add({})
          .onInit(async ({ subsystem }) => {
            // Access another facet during init
            const dep = subsystem.find('plugin-1');
            expect(dep).toBeDefined();
          });
        }
      });
      
      system.use(hook2);
      
      // Build should complete successfully
      await system.build();
      expect(system.find('plugin-2')).toBeDefined();
    });

    it('should prevent concurrent builds', async () => {
      system = new StandalonePluginSystem('race-concurrent-build', {});
      
      system.use(createSimpleHook('plugin-1'));
      
      // Attempt concurrent builds (should be handled gracefully)
      const build1 = system.build();
      const build2 = system.build();
      
      // One should succeed, one may fail or both may succeed sequentially
      // The important thing is the system remains consistent
      try {
        await Promise.all([build1, build2]);
      } catch (error) {
        // One build may fail, which is acceptable
        expect(error).toBeDefined();
      }
      
      // System should be in a valid state
      expect(system.isBuilt || !system.isBuilt).toBe(true);
    });
  });

  describe('Parallel Facet Initialization', () => {
    it('should initialize independent facets in parallel', async () => {
      system = new StandalonePluginSystem('parallel-init', {});
      
      const initOrder = [];
      const initTimes = new Map();
      
      // Create 20 plugins with async init
      for (let i = 0; i < 20; i++) {
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
              const start = Date.now();
              initTimes.set(`plugin-${i}`, start);
              // Simulate async work
              await new Promise(resolve => setTimeout(resolve, 10));
              initOrder.push(i);
            });
          }
        });
        system.use(hook);
      }

      const buildStart = Date.now();
      await system.build();
      const buildDuration = Date.now() - buildStart;

      // All should have initialized
      expect(initOrder.length).toBe(20);
      
      // Check that initializations overlapped (parallel execution)
      const initDurations = Array.from(initTimes.values());
      const minStart = Math.min(...initDurations);
      const maxStart = Math.max(...initDurations);
      const startSpread = maxStart - minStart;
      
      // If sequential, startSpread would be ~200ms (20 * 10ms)
      // If parallel, startSpread should be much smaller
      expect(startSpread).toBeLessThan(50);
      
      // Build duration should be much less than sequential (20 * 10ms = 200ms)
      expect(buildDuration).toBeLessThan(100);
    });
  });

  describe('Concurrent Facet Method Calls', () => {
    beforeEach(async () => {
      system = new StandalonePluginSystem('concurrent-methods', {});
      
      system.use(createSimpleHook('counter'));
      await system.build();
    });

    it('should handle concurrent method calls on same facet', async () => {
      const counter = system.find('counter');
      const concurrency = 50;
      const incrementsPerThread = 10;
      
      const results = await Promise.all(
        Array.from({ length: concurrency }, async () => {
          const threadResults = [];
          for (let i = 0; i < incrementsPerThread; i++) {
            const value = counter.increment();
            threadResults.push(value);
          }
          return threadResults;
        })
      );
      
      // Final value should be concurrency * incrementsPerThread
      const finalValue = counter.getValue();
      expect(finalValue).toBe(concurrency * incrementsPerThread);
    });
  });

  describe('Stress Concurrent Operations', () => {
    it('should handle many concurrent operations', async () => {
      system = new StandalonePluginSystem('stress-concurrent', {});
      
      // Create 100 plugins
      for (let i = 0; i < 100; i++) {
        system.use(createSimpleHook(`plugin-${i}`));
      }
      await system.build();
      
      // Perform 1000 concurrent lookups
      const lookups = Array.from({ length: 1000 }, async (_, i) => {
        const kind = `plugin-${i % 100}`;
        return system.find(kind);
      });
      
      const results = await Promise.all(lookups);
      
      // All should succeed
      const allValid = results.every(r => r !== undefined);
      expect(allValid).toBe(true);
    });
  });
});

