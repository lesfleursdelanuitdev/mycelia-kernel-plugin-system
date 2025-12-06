import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseSubsystem } from '../../../src/system/base-subsystem.js';
import { createHook } from '../../../src/core/create-hook.js';
import { Facet } from '../../../src/core/facet.js';

describe('BaseSubsystem', () => {
  let system;

  beforeEach(() => {
    system = new BaseSubsystem('test-system', {
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
    it('should create a BaseSubsystem', () => {
      expect(system).toBeInstanceOf(BaseSubsystem);
      expect(system.name).toBe('test-system');
    });

    it('should throw if name is missing', () => {
      expect(() => {
        new BaseSubsystem();
      }).toThrow('BaseSubsystem: name must be a non-empty string');
    });

    it('should throw if name is not a string', () => {
      expect(() => {
        new BaseSubsystem(123);
      }).toThrow('BaseSubsystem: name must be a non-empty string');
    });

    it('should initialize with config', () => {
      const sys = new BaseSubsystem('test', {
        config: { database: { host: 'localhost' } }
      });
      expect(sys.ctx.config.database.host).toBe('localhost');
    });

    it('should initialize with debug flag', () => {
      const sys = new BaseSubsystem('test', { debug: true });
      expect(sys.ctx.debug).toBe(true);
      expect(sys.debug).toBe(true);
    });
  });

  describe('use', () => {
    it('should register a hook', () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: () => new Facet('test')
      });

      system.use(hook);
      expect(system.hooks).toContain(hook);
    });

    it('should return this for chaining', () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: () => new Facet('test')
      });

      const result = system.use(hook);
      expect(result).toBe(system);
    });

    it('should throw if called after build', async () => {
      const hook = createHook({
        kind: 'test',
        source: 'test.js',
        fn: () => new Facet('test')
      });

      await system.use(hook).build();

      expect(() => {
        system.use(hook);
      }).toThrow('cannot add hooks after build()');
    });

    it('should throw if hook is not a function', () => {
      expect(() => {
        system.use('not a function');
      }).toThrow('hook must be a function');
    });
  });

  describe('onInit', () => {
    it('should register init callback', () => {
      const callback = async () => {};
      system.onInit(callback);
      expect(system._initCallbacks).toContain(callback);
    });

    it('should return this for chaining', () => {
      const result = system.onInit(async () => {});
      expect(result).toBe(system);
    });

    it('should throw if callback is not a function', () => {
      expect(() => {
        system.onInit('not a function');
      }).toThrow('onInit callback must be a function');
    });
  });

  describe('onDispose', () => {
    it('should register dispose callback', () => {
      const callback = async () => {};
      system.onDispose(callback);
      expect(system._disposeCallbacks).toContain(callback);
    });

    it('should return this for chaining', () => {
      const result = system.onDispose(async () => {});
      expect(result).toBe(system);
    });

    it('should throw if callback is not a function', () => {
      expect(() => {
        system.onDispose('not a function');
      }).toThrow('onDispose callback must be a function');
    });
  });

  describe('find', () => {
    it('should find facet after build', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .add({ query() { return 'result'; } })
      });

      await system.use(useDatabase).build();

      const facet = system.find('database');
      expect(facet).toBeDefined();
      expect(facet.query()).toBe('result');
    });

    it('should return undefined if facet not found', async () => {
      await system.build();
      const facet = system.find('nonexistent');
      expect(facet).toBeUndefined();
    });
  });

  describe('build', () => {
    it('should build the system', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      await system.use(useDatabase).build();

      expect(system.isBuilt).toBe(true);
    });

    it('should be idempotent', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      await system.use(useDatabase).build();
      const firstBuild = system.isBuilt;

      await system.build();
      const secondBuild = system.isBuilt;

      expect(firstBuild).toBe(true);
      expect(secondBuild).toBe(true);
    });

    it('should call onInit callbacks', async () => {
      let initCalled = false;
      system.onInit(async () => {
        initCalled = true;
      });

      await system.build();

      expect(initCalled).toBe(true);
    });

    it('should initialize facets', async () => {
      let initCalled = false;
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .onInit(async ({ ctx, api, subsystem, facet }) => {
            initCalled = true;
          })
      });

      await system.use(useDatabase).build();

      expect(initCalled).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should dispose the system', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      await system.use(useDatabase).build();
      await system.dispose();

      expect(system.isBuilt).toBe(false);
    });

    it('should call onDispose callbacks', async () => {
      let disposeCalled = false;
      system.onDispose(async () => {
        disposeCalled = true;
      });

      await system.build();
      await system.dispose();

      expect(disposeCalled).toBe(true);
    });

    it('should dispose facets', async () => {
      let disposeCalled = false;
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .onDispose(async () => {
            disposeCalled = true;
          })
      });

      await system.use(useDatabase).build();
      await system.dispose();

      expect(disposeCalled).toBe(true);
    });
  });

  describe('capabilities', () => {
    it('should return available facet kinds', async () => {
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

      const capabilities = system.capabilities;
      expect(capabilities).toContain('database');
      expect(capabilities).toContain('cache');
    });
  });

  describe('hierarchy', () => {
    it('should set and get parent', () => {
      const parent = new BaseSubsystem('parent', { config: {} });
      system.setParent(parent);

      expect(system.getParent()).toBe(parent);
    });

    it('should check if root', () => {
      expect(system.isRoot()).toBe(true);

      const parent = new BaseSubsystem('parent', { config: {} });
      system.setParent(parent);
      expect(system.isRoot()).toBe(false);
    });

    it('should get root', () => {
      const root = new BaseSubsystem('root', { config: {} });
      const child = new BaseSubsystem('child', { config: {} });
      const grandchild = new BaseSubsystem('grandchild', { config: {} });

      child.setParent(root);
      grandchild.setParent(child);

      expect(grandchild.getRoot()).toBe(root);
    });

    it('should generate name string', () => {
      const root = new BaseSubsystem('root', { config: {} });
      const child = new BaseSubsystem('child', { config: {} });

      expect(root.getNameString()).toBe('root://');
      
      child.setParent(root);
      expect(child.getNameString()).toBe('root://child');
    });
  });

  describe('reload', () => {
    it('should reset built state and allow adding more hooks', async () => {
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

      // Initial build
      await system.use(useDatabase).build();
      expect(system.isBuilt).toBe(true);
      expect(system.find('database')).toBeDefined();
      expect(system.find('cache')).toBeUndefined();

      // Reload and extend
      await system.reload();
      expect(system.isBuilt).toBe(false);
      expect(system.find('database')).toBeUndefined(); // Facets disposed

      // Should be able to add more hooks
      await system.use(useCache).build();
      expect(system.isBuilt).toBe(true);
      expect(system.find('database')).toBeDefined(); // Rebuilt with old hooks
      expect(system.find('cache')).toBeDefined(); // New hook added
    });

    it('should preserve hooks after reload', async () => {
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

      // Add hooks and build
      system.use(useDatabase);
      await system.build();
      expect(system.hooks.length).toBe(1);

      // Reload
      await system.reload();
      expect(system.hooks.length).toBe(1); // Hooks preserved
      expect(system.isBuilt).toBe(false);

      // Add more hooks and rebuild
      system.use(useCache);
      await system.build();
      expect(system.hooks.length).toBe(2); // Old + new hooks
      expect(system.find('database')).toBeDefined();
      expect(system.find('cache')).toBeDefined();
    });

    it('should preserve defaultHooks after reload', async () => {
      const useLogger = createHook({
        kind: 'logger',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('logger', { attach: true })
      });

      const sys = new BaseSubsystem('test', {
        defaultHooks: [useLogger],
        config: {}
      });

      await sys.build();
      expect(sys.find('logger')).toBeDefined();

      await sys.reload();
      expect(sys.defaultHooks.length).toBe(1); // Default hooks preserved
      expect(sys.isBuilt).toBe(false);

      await sys.build();
      expect(sys.find('logger')).toBeDefined(); // Default hook still works
    });

    it('should be a no-op if not built', async () => {
      expect(system.isBuilt).toBe(false);
      await system.reload();
      expect(system.isBuilt).toBe(false);
      // Should not throw
    });

    it('should wait for in-progress build before reloading', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      // Start build
      const buildPromise = system.use(useDatabase).build();

      // Reload should wait for build
      const reloadPromise = system.reload();

      await Promise.all([buildPromise, reloadPromise]);
      expect(system.isBuilt).toBe(false); // Reload reset it
    });

    it('should dispose all facets on reload', async () => {
      const lifecycle = [];
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
          .onDispose(async () => {
            lifecycle.push('disposed');
          })
      });

      await system.use(useDatabase).build();
      expect(lifecycle.length).toBe(0);

      await system.reload();
      // Dispose callback should be called during reload
      expect(lifecycle.length).toBeGreaterThanOrEqual(1);
      expect(lifecycle[0]).toBe('disposed');
      
      // Mark as not built so afterEach doesn't dispose again
      system._isBuilt = false;
    });

    it('should invalidate builder cache on reload', async () => {
      const useDatabase = createHook({
        kind: 'database',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('database', { attach: true })
      });

      await system.use(useDatabase).build();
      const planBefore = system._builder.getPlan();
      expect(planBefore).toBeDefined();

      await system.reload();
      const planAfter = system._builder.getPlan();
      expect(planAfter).toBeNull(); // Cache invalidated
    });

    it('should allow chaining: reload().use().build()', async () => {
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

      await system.use(useDatabase).build();
      expect(system.find('cache')).toBeUndefined();

      // Reload, then chain use and build
      await system.reload();
      await system.use(useCache).build();
      expect(system.find('database')).toBeDefined();
      expect(system.find('cache')).toBeDefined();
    });
  });
});

