import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem, createHook, Facet, useBase } from '../../src/index.js';

/**
 * Long-Running System Tests
 * 
 * Tests that verify system stability over extended periods:
 * - Long-running operations
 * - Continuous build/reload cycles
 * - Sustained load
 * - Time-based operations
 * - Resource stability
 */

describe('Long-Running System Tests', () => {
  let system;

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  /**
   * Helper to create a hook with state tracking
   */
  function createStatefulHook(kind, initialState = {}) {
    return createHook({
      kind,
      version: '1.0.0',
      attach: true,
      source: `test://${kind}`,
      fn: (ctx, api, subsystem) => {
        let state = { ...initialState, callCount: 0 };
        
        return new Facet(kind, {
          attach: true,
          source: `test://${kind}`
        })
        .add({
          getState() {
            return { ...state };
          },
          increment() {
            state.callCount++;
            return state.callCount;
          },
          setValue(key, value) {
            state[key] = value;
          },
          getValue(key) {
            return state[key];
          }
        })
        .onInit(async () => {
          state.initialized = true;
          state.initTime = Date.now();
        })
        .onDispose(async () => {
          state.disposed = true;
          state.disposeTime = Date.now();
        });
      }
    });
  }

  describe('Sustained Operations', () => {
    it('should handle continuous operations over time', async () => {
      system = new StandalonePluginSystem('long-sustained', {});
      
      system.use(createStatefulHook('counter'));
      await system.build();
      
      const counter = system.find('counter');
      const operations = 1000;
      
      // Perform many operations
      for (let i = 0; i < operations; i++) {
        counter.increment();
        const state = counter.getState();
        expect(state.callCount).toBe(i + 1);
      }
      
      const finalState = counter.getState();
      expect(finalState.callCount).toBe(operations);
      expect(finalState.initialized).toBe(true);
    });

    it('should maintain state across many method calls', async () => {
      system = new StandalonePluginSystem('long-state', {});
      
      system.use(createStatefulHook('stateful', { value: 0 }));
      await system.build();
      
      const stateful = system.find('stateful');
      const iterations = 500;
      
      for (let i = 0; i < iterations; i++) {
        stateful.setValue('value', i);
        stateful.increment();
        expect(stateful.getValue('value')).toBe(i);
      }
      
      const state = stateful.getState();
      expect(state.value).toBe(iterations - 1);
      expect(state.callCount).toBe(iterations);
    });
  });

  describe('Continuous Build/Reload Cycles', () => {
    it('should handle many reload cycles', async () => {
      system = new StandalonePluginSystem('long-reload', {});
      
      const cycles = 50;
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        // Add a plugin
        system.use(createStatefulHook(`plugin-${cycle}`));
        
        await system.build();
        expect(system.find(`plugin-${cycle}`)).toBeDefined();
        
        // Reload
        await system.reload();
        expect(system.isBuilt).toBe(false);
      }
      
      // Final build - hooks from all cycles are preserved by reload
      await system.build();
      
      // Verify all plugins are accessible
      for (let cycle = 0; cycle < cycles; cycle++) {
        const plugin = system.find(`plugin-${cycle}`);
        expect(plugin).toBeDefined();
        expect(plugin.getState().initialized).toBe(true);
      }
    });

    it('should handle alternating build/dispose cycles', async () => {
      system = new StandalonePluginSystem('long-alternating', {});
      
      const cycles = 30;
      
      for (let cycle = 0; cycle < cycles; cycle++) {
        // Clear hooks from previous cycle
        system.hooks = [];
        
        // Add hook with unique kind for each cycle to avoid conflicts
        system.use(createStatefulHook(`plugin-${cycle}`));
        await system.build();
        
        const plugin = system.find(`plugin-${cycle}`);
        expect(plugin.getState().initialized).toBe(true);
        
        await system.dispose();
        expect(system.isBuilt).toBe(false);
      }
    });
  });

  describe('Time-Based Operations', () => {
    it('should handle operations over extended time period', async () => {
      system = new StandalonePluginSystem('long-time', {});
      
      system.use(createHook({
        kind: 'timer',
        version: '1.0.0',
        attach: true,
        source: 'test://timer',
        fn: (ctx, api, subsystem) => {
          const startTime = Date.now();
          const events = [];
          
          return new Facet('timer', {
            attach: true,
            source: 'test://timer'
          })
          .add({
            getUptime() {
              return Date.now() - startTime;
            },
            recordEvent(name) {
              events.push({ name, time: Date.now() });
            },
            getEvents() {
              return [...events];
            }
          });
        }
      }));
      
      await system.build();
      
      const timer = system.find('timer');
      
      // Record events over time
      timer.recordEvent('start');
      await new Promise(resolve => setTimeout(resolve, 10));
      timer.recordEvent('middle');
      await new Promise(resolve => setTimeout(resolve, 10));
      timer.recordEvent('end');
      
      const events = timer.getEvents();
      expect(events.length).toBe(3);
      expect(events[0].name).toBe('start');
      expect(events[2].name).toBe('end');
      
      // Uptime should be positive
      const uptime = timer.getUptime();
      expect(uptime).toBeGreaterThan(0);
    });
  });

  describe('Resource Stability', () => {
    it('should maintain stability with many facets', async () => {
      system = new StandalonePluginSystem('long-stability', {});
      
      // Create 200 plugins
      for (let i = 0; i < 200; i++) {
        system.use(createStatefulHook(`plugin-${i}`));
      }
      
      await system.build();
      
      // Access all facets multiple times
      for (let round = 0; round < 10; round++) {
        for (let i = 0; i < 200; i++) {
          const plugin = system.find(`plugin-${i}`);
          expect(plugin).toBeDefined();
          plugin.increment();
        }
      }
      
      // Verify state is maintained
      const plugin0 = system.find('plugin-0');
      expect(plugin0.getState().callCount).toBe(10);
    });

    it('should handle memory-efficient operations', async () => {
      system = new StandalonePluginSystem('long-memory', {});
      
      system.use(createHook({
        kind: 'memory-test',
        version: '1.0.0',
        attach: true,
        source: 'test://memory-test',
        fn: (ctx, api, subsystem) => {
          // Use WeakMap for memory efficiency
          const data = new WeakMap();
          
          return new Facet('memory-test', {
            attach: true,
            source: 'test://memory-test'
          })
          .add({
            setData(obj, value) {
              data.set(obj, value);
            },
            getData(obj) {
              return data.get(obj);
            }
          });
        }
      }));
      
      await system.build();
      
      const memoryTest = system.find('memory-test');
      const testObjects = [];
      
      // Create and use many objects
      for (let i = 0; i < 1000; i++) {
        const obj = { id: i };
        testObjects.push(obj);
        memoryTest.setData(obj, `value-${i}`);
      }
      
      // Verify data is accessible
      for (let i = 0; i < 100; i++) {
        const value = memoryTest.getData(testObjects[i]);
        expect(value).toBe(`value-${i}`);
      }
    });
  });

  describe('Concurrent Long-Running Operations', () => {
    it('should handle concurrent long-running operations', async () => {
      system = new StandalonePluginSystem('long-concurrent', {});
      
      system.use(createStatefulHook('worker'));
      await system.build();
      
      const worker = system.find('worker');
      const concurrency = 10;
      const operationsPerThread = 100;
      
      const results = await Promise.all(
        Array.from({ length: concurrency }, async (_, threadId) => {
          const threadResults = [];
          for (let i = 0; i < operationsPerThread; i++) {
            const value = worker.increment();
            threadResults.push(value);
            // Small delay to simulate real work
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          return threadResults;
        })
      );
      
      // All operations should complete
      expect(results.length).toBe(concurrency);
      results.forEach(threadResults => {
        expect(threadResults.length).toBe(operationsPerThread);
      });
      
      // Final count should be correct
      const finalCount = worker.getState().callCount;
      expect(finalCount).toBe(concurrency * operationsPerThread);
    });
  });

  describe('Stress Over Time', () => {
    it('should handle sustained stress operations', async () => {
      system = new StandalonePluginSystem('long-stress', {});
      
      // Create 50 plugins
      for (let i = 0; i < 50; i++) {
        system.use(createStatefulHook(`plugin-${i}`));
      }
      
      await system.build();
      
      // Perform many operations over time
      const rounds = 100;
      for (let round = 0; round < rounds; round++) {
        // Access random plugins
        for (let i = 0; i < 20; i++) {
          const index = Math.floor(Math.random() * 50);
          const plugin = system.find(`plugin-${index}`);
          plugin.increment();
        }
      }
      
      // System should still be functional
      expect(system.isBuilt).toBe(true);
      
      // Verify some plugins have been accessed
      let totalCalls = 0;
      for (let i = 0; i < 50; i++) {
        const plugin = system.find(`plugin-${i}`);
        totalCalls += plugin.getState().callCount;
      }
      
      expect(totalCalls).toBeGreaterThan(0);
    });
  });

  describe('useBase Long-Running', () => {
    it('should handle long-running useBase systems', async () => {
      system = await useBase('long-usebase')
        .use(createStatefulHook('plugin-1'))
        .use(createStatefulHook('plugin-2'))
        .use(createStatefulHook('plugin-3'))
        .build();
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const plugin = system.find(`plugin-${(i % 3) + 1}`);
        plugin.increment();
      }
      
      // All plugins should have been accessed
      expect(system.find('plugin-1').getState().callCount).toBeGreaterThan(0);
      expect(system.find('plugin-2').getState().callCount).toBeGreaterThan(0);
      expect(system.find('plugin-3').getState().callCount).toBeGreaterThan(0);
    });
  });
});

