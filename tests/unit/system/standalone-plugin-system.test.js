import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StandalonePluginSystem } from '../../../src/system/standalone-plugin-system.js';
import { createHook } from '../../../src/core/create-hook.js';
import { Facet } from '../../../src/core/facet.js';

describe('StandalonePluginSystem', () => {
  let system;

  beforeEach(() => {
    system = new StandalonePluginSystem('test-system', {
      config: {},
      debug: false
    });
  });

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  describe('constructor', () => {
    it('should create a StandalonePluginSystem', () => {
      expect(system).toBeInstanceOf(StandalonePluginSystem);
      expect(system.name).toBe('test-system');
    });

    it('should have null messageSystem', () => {
      expect(system.messageSystem).toBe(null);
      expect(system.ctx.ms).toBe(null);
    });
  });

  describe('message methods (no-ops)', () => {
    it('should have accept as no-op', async () => {
      const result = await system.accept({}, {});
      expect(result).toBe(true);
    });

    it('should have process as no-op', async () => {
      const result = await system.process(100);
      expect(result).toBe(null);
    });

    it('should have processImmediately as no-op', async () => {
      const result = await system.processImmediately({}, {});
      expect(result).toBe(null);
    });

    it('should have pause as no-op', () => {
      const result = system.pause();
      expect(result).toBe(system);
    });

    it('should have resume as no-op', () => {
      const result = system.resume();
      expect(result).toBe(system);
    });
  });

  describe('plugin system functionality', () => {
    it('should work as a plugin system', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .add({ query() { return 'result'; } })
      });

      await system.use(useDatabase).build();

      const db = system.find('database');
      expect(db).toBeDefined();
      expect(db.query()).toBe('result');
    });

    it('should handle multiple plugins', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      const useCache = createHook({
        kind: 'cache',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('cache', { attach: true })
      });

      await system.use(useDatabase).use(useCache).build();

      expect(system.find('database')).toBeDefined();
      expect(system.find('cache')).toBeDefined();
    });
  });
});

