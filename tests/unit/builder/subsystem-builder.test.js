import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseSubsystem } from '../../../src/system/base-subsystem.js';
import { createHook } from '../../../src/core/create-hook.js';
import { Facet } from '../../../src/core/facet.js';

describe('SubsystemBuilder', () => {
  let system;

  beforeEach(() => {
    system = new BaseSubsystem('test', { config: {} });
  });

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  describe('build process', () => {
    it('should build system with hooks', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      await system.use(useDatabase).build();

      expect(system.isBuilt).toBe(true);
      expect(system.find('database')).toBeDefined();
    });

    it('should handle dependency ordering', async () => {
      const initOrder = [];

      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .onInit(async ({ ctx, api, subsystem, facet }) => { initOrder.push('database'); })
      });

      const useCache = createHook({
        kind: 'cache',
        required: ['database'],
        attach: true,
        source: 'test.js',
        fn: () => new Facet('cache', { attach: true, required: ['database'] })
          .onInit(async ({ ctx, api, subsystem, facet }) => { initOrder.push('cache'); })
      });

      await system.use(useCache).use(useDatabase).build();

      expect(initOrder[0]).toBe('database');
      expect(initOrder[1]).toBe('cache');
    });
  });

  describe('plan caching', () => {
    it('should cache build plans', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      await system.use(useDatabase).build();

      // Second build should use cached plan
      const builder = system._builder;
      const plan1 = builder.plan();
      const plan2 = builder.plan();

      // Plans should be the same (cached)
      expect(plan1).toBe(plan2);
    });
  });
});

