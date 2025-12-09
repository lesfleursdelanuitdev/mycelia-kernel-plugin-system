import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem, createHook, Facet, useBase } from '../../src/index.js';

/**
 * Stress Tests
 * 
 * Tests that push the system to its limits with:
 * - Many plugins (100+)
 * - Complex dependency graphs
 * - Deep dependency chains
 * - Multiple facets per kind
 * - Overwrite scenarios
 */

describe('Stress Tests', () => {
  let system;

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  /**
   * Helper to create a hook with optional dependencies
   */
  function createHookWithDeps(kind, dependencies = []) {
    return createHook({
      kind,
      version: '1.0.0',
      required: dependencies,
      attach: true,
      source: `test://${kind}`,
      fn: (ctx, api, subsystem) => {
        const facet = new Facet(kind, {
          attach: true,
          source: `test://${kind}`,
          required: dependencies
        })
        .add({
          id: kind,
          dependencies,
          getValue() {
            return `${kind}-value`;
          }
        });

        // Access dependencies if they exist
        if (dependencies.length > 0) {
          facet.add({
            getDependencyValues() {
              return dependencies.map(dep => {
                const depFacet = subsystem.find(dep);
                return depFacet ? depFacet.getValue() : null;
              });
            }
          });
        }

        return facet;
      }
    });
  }

  describe('Many Plugins', () => {
    it('should handle 100 independent plugins', async () => {
      system = new StandalonePluginSystem('stress-100', {});
      
      for (let i = 0; i < 100; i++) {
        system.use(createHookWithDeps(`plugin-${i}`));
      }

      await system.build();
      
      // Verify all plugins are accessible
      for (let i = 0; i < 100; i++) {
        const facet = system.find(`plugin-${i}`);
        expect(facet).toBeDefined();
        expect(facet.getValue()).toBe(`plugin-${i}-value`);
      }
    });

    it('should handle 500 independent plugins', async () => {
      system = new StandalonePluginSystem('stress-500', {});
      
      for (let i = 0; i < 500; i++) {
        system.use(createHookWithDeps(`plugin-${i}`));
      }

      await system.build();
      
      // Sample check - verify a subset
      for (let i = 0; i < 10; i++) {
        const facet = system.find(`plugin-${i * 50}`);
        expect(facet).toBeDefined();
      }
    });

    it('should handle 1000 independent plugins', async () => {
      system = new StandalonePluginSystem('stress-1000', {});
      
      for (let i = 0; i < 1000; i++) {
        system.use(createHookWithDeps(`plugin-${i}`));
      }

      await system.build();
      
      // Sample check
      expect(system.find('plugin-0')).toBeDefined();
      expect(system.find('plugin-500')).toBeDefined();
      expect(system.find('plugin-999')).toBeDefined();
    });
  });

  describe('Complex Dependency Graphs', () => {
    it('should handle a diamond dependency pattern', async () => {
      system = new StandalonePluginSystem('stress-diamond', {});
      
      // Create diamond pattern:
      //     A
      //   /   \
      //  B     C
      //   \   /
      //     D
      
      system.use(createHookWithDeps('A'));
      system.use(createHookWithDeps('B', ['A']));
      system.use(createHookWithDeps('C', ['A']));
      system.use(createHookWithDeps('D', ['B', 'C']));

      await system.build();
      
      const d = system.find('D');
      expect(d).toBeDefined();
      expect(d.getDependencyValues()).toEqual(['B-value', 'C-value']);
    });

    it('should handle a large dependency tree', async () => {
      system = new StandalonePluginSystem('stress-tree', {});
      
      // Create a binary tree structure with 31 nodes (5 levels)
      // Level 0: 1 node
      // Level 1: 2 nodes
      // Level 2: 4 nodes
      // Level 3: 8 nodes
      // Level 4: 16 nodes
      
      // Root
      system.use(createHookWithDeps('root'));
      
      // Level 1
      system.use(createHookWithDeps('l1-0', ['root']));
      system.use(createHookWithDeps('l1-1', ['root']));
      
      // Level 2
      for (let i = 0; i < 4; i++) {
        const parent = `l1-${Math.floor(i / 2)}`;
        system.use(createHookWithDeps(`l2-${i}`, [parent]));
      }
      
      // Level 3
      for (let i = 0; i < 8; i++) {
        const parent = `l2-${Math.floor(i / 2)}`;
        system.use(createHookWithDeps(`l3-${i}`, [parent]));
      }
      
      // Level 4
      for (let i = 0; i < 16; i++) {
        const parent = `l3-${Math.floor(i / 2)}`;
        system.use(createHookWithDeps(`l4-${i}`, [parent]));
      }

      await system.build();
      
      // Verify root and some leaves
      expect(system.find('root')).toBeDefined();
      expect(system.find('l4-0')).toBeDefined();
      expect(system.find('l4-15')).toBeDefined();
    });

    it('should handle a chain of 100 dependencies', async () => {
      system = new StandalonePluginSystem('stress-chain', {});
      
      // Create chain: p0 -> p1 -> ... -> p99
      for (let i = 0; i < 100; i++) {
        const deps = i > 0 ? [`p${i - 1}`] : [];
        system.use(createHookWithDeps(`p${i}`, deps));
      }

      await system.build();
      
      // Verify chain
      const last = system.find('p99');
      expect(last).toBeDefined();
      expect(last.getDependencyValues()).toEqual(['p98-value']);
    });

    it('should handle multiple dependencies per plugin', async () => {
      system = new StandalonePluginSystem('stress-multi-deps', {});
      
      // Create 20 base plugins
      for (let i = 0; i < 20; i++) {
        system.use(createHookWithDeps(`base-${i}`));
      }
      
      // Create plugins that depend on multiple bases
      for (let i = 0; i < 10; i++) {
        const deps = [
          `base-${i * 2}`,
          `base-${i * 2 + 1}`
        ];
        system.use(createHookWithDeps(`multi-${i}`, deps));
      }

      await system.build();
      
      // Verify
      const multi = system.find('multi-5');
      expect(multi).toBeDefined();
      expect(multi.getDependencyValues().length).toBe(2);
    });
  });

  describe('Multiple Facets Per Kind', () => {
    it('should handle multiple hooks creating the same kind with overwrite', async () => {
      system = new StandalonePluginSystem('stress-multi-facets', {});
      
      // Create 10 hooks that all create 'shared' facet with overwrite
      for (let i = 0; i < 10; i++) {
        system.use(createHook({
          kind: 'shared',
          version: '1.0.0',
          overwrite: true,
          attach: true,
          source: `test://shared-${i}`,
          fn: (ctx, api, subsystem) => {
            return new Facet('shared', {
              attach: true,
              overwrite: true,
              source: `test://shared-${i}`
            })
            .add({
              index: i,
              getIndex() {
                return this.index;
              }
            });
          }
        }));
      }

      await system.build();
      
      // Should have the last overwritten facet
      const facet = system.find('shared');
      expect(facet).toBeDefined();
      expect(facet.getIndex()).toBe(9); // Last one wins
    });
  });

  describe('Overwrite Scenarios', () => {
    it('should handle multiple overwrites', async () => {
      system = new StandalonePluginSystem('stress-overwrite', {});
      
      // Create original
      system.use(createHookWithDeps('plugin'));
      
      // Create 10 overwrite hooks
      for (let i = 0; i < 10; i++) {
        system.use(createHook({
          kind: 'plugin',
          version: '1.0.0',
          overwrite: true,
          required: ['plugin'], // Overwrite hooks can depend on themselves
          attach: true,
          source: `test://plugin-${i}`,
          fn: (ctx, api, subsystem) => {
            return new Facet('plugin', {
              attach: true,
              overwrite: true,
              source: `test://plugin-${i}`
            })
            .add({
              version: i,
              getVersion() {
                return this.version;
              }
            });
          }
        }));
      }

      await system.build();
      
      // Should have the last overwrite
      const plugin = system.find('plugin');
      expect(plugin).toBeDefined();
      expect(plugin.getVersion()).toBe(9);
    });
  });

  describe('Hot Reloading Stress', () => {
    it('should handle multiple reload cycles', async () => {
      system = new StandalonePluginSystem('stress-reload', {});
      
      // Initial build with 50 plugins
      for (let i = 0; i < 50; i++) {
        system.use(createHookWithDeps(`plugin-${i}`));
      }
      await system.build();
      
      // Reload and add 50 more
      await system.reload();
      for (let i = 50; i < 100; i++) {
        system.use(createHookWithDeps(`plugin-${i}`));
      }
      await system.build();
      
      // Reload and add 50 more
      await system.reload();
      for (let i = 100; i < 150; i++) {
        system.use(createHookWithDeps(`plugin-${i}`));
      }
      await system.build();
      
      // Verify all are accessible
      expect(system.find('plugin-0')).toBeDefined();
      expect(system.find('plugin-75')).toBeDefined();
      expect(system.find('plugin-149')).toBeDefined();
    });
  });

  describe('Mixed Scenarios', () => {
    it('should handle complex real-world scenario', async () => {
      system = new StandalonePluginSystem('stress-mixed', {});
      
      // Mix of independent, dependent, and overwrite plugins
      const total = 200;
      
      // 50 independent
      for (let i = 0; i < 50; i++) {
        system.use(createHookWithDeps(`indep-${i}`));
      }
      
      // 100 with dependencies
      for (let i = 0; i < 100; i++) {
        const dep = `indep-${i % 50}`;
        system.use(createHookWithDeps(`dep-${i}`, [dep]));
      }
      
      // 50 overwrites
      for (let i = 0; i < 50; i++) {
        system.use(createHook({
          kind: `indep-${i}`,
          version: '2.0.0',
          overwrite: true,
          required: [`indep-${i}`],
          attach: true,
          source: `test://overwrite-${i}`,
          fn: (ctx, api, subsystem) => {
            return new Facet(`indep-${i}`, {
              attach: true,
              overwrite: true,
              source: `test://overwrite-${i}`
            })
            .add({
              overwritten: true
            });
          }
        }));
      }

      await system.build();
      
      // Verify sample
      expect(system.find('indep-0')).toBeDefined();
      expect(system.find('dep-50')).toBeDefined();
      expect(system.find('indep-25')?.overwritten).toBe(true);
    });
  });
});

