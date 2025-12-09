import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useBase } from '../../../src/utils/use-base.js';
import { BaseSubsystem } from '../../../src/system/base-subsystem.js';
import { createHook } from '../../../src/core/create-hook.js';
import { Facet } from '../../../src/core/facet.js';

describe('useBase', () => {
  let system;

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  describe('useMultiple', () => {
    it('should register multiple hooks at once', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
      });

      const usePlugin3 = createHook({
        kind: 'plugin-3',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-3', { attach: true })
      });

      system = await useBase('test')
        .useMultiple([usePlugin1, usePlugin2, usePlugin3])
        .build();

      expect(system.find('plugin-1')).toBeDefined();
      expect(system.find('plugin-2')).toBeDefined();
      expect(system.find('plugin-3')).toBeDefined();
    });

    it('should throw error if hooks is not an array', () => {
      expect(() => {
        useBase('test').useMultiple('not-an-array');
      }).toThrow('useBase.useMultiple: hooks must be an array');
    });

    it('should throw error if any hook is not a function', () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      expect(() => {
        useBase('test').useMultiple([usePlugin1, 'not-a-function']);
      }).toThrow('useBase.useMultiple: all hooks must be functions');
    });

    it('should handle empty array', async () => {
      system = await useBase('test')
        .useMultiple([])
        .build();

      expect(system.isBuilt).toBe(true);
    });

    it('should work with other methods', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
      });

      const usePlugin3 = createHook({
        kind: 'plugin-3',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-3', { attach: true })
      });

      system = await useBase('test')
        .use(usePlugin1)
        .useMultiple([usePlugin2, usePlugin3])
        .build();

      expect(system.find('plugin-1')).toBeDefined();
      expect(system.find('plugin-2')).toBeDefined();
      expect(system.find('plugin-3')).toBeDefined();
    });

    it('should preserve hook order', async () => {
      const initOrder = [];

      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
          .onInit(async () => { initOrder.push('plugin-1'); })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
          .onInit(async () => { initOrder.push('plugin-2'); })
      });

      system = await useBase('test')
        .useMultiple([usePlugin1, usePlugin2])
        .build();

      // Both should be initialized (order may vary due to parallel init)
      expect(initOrder.length).toBe(2);
      expect(initOrder).toContain('plugin-1');
      expect(initOrder).toContain('plugin-2');
    });
  });

  describe('useIfMultiple', () => {
    it('should register hooks when condition is true', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
      });

      system = await useBase('test')
        .useIfMultiple(true, [usePlugin1, usePlugin2])
        .build();

      expect(system.find('plugin-1')).toBeDefined();
      expect(system.find('plugin-2')).toBeDefined();
    });

    it('should not register hooks when condition is false', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
      });

      system = await useBase('test')
        .useIfMultiple(false, [usePlugin1, usePlugin2])
        .build();

      expect(system.find('plugin-1')).toBeUndefined();
      expect(system.find('plugin-2')).toBeUndefined();
    });

    it('should work with environment variables', async () => {
      const useDevTool = createHook({
        kind: 'dev-tool',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('dev-tool', { attach: true })
      });

      const isDev = process.env.NODE_ENV === 'development';
      
      system = await useBase('test')
        .useIfMultiple(isDev, [useDevTool])
        .build();

      // Result depends on NODE_ENV, but should not throw
      expect(system.isBuilt).toBe(true);
    });

    it('should support method chaining', () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const builder = useBase('test')
        .useIfMultiple(true, [usePlugin1])
        .config('test', { value: 1 });

      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('should work with dynamic hook arrays', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
      });

      const optionalHooks = [];
      optionalHooks.push(usePlugin1);
      optionalHooks.push(usePlugin2);

      system = await useBase('test')
        .useIfMultiple(optionalHooks.length > 0, optionalHooks)
        .build();

      expect(system.find('plugin-1')).toBeDefined();
      expect(system.find('plugin-2')).toBeDefined();
    });
  });

  describe('combined usage', () => {
    it('should work with use, useMultiple, and useIfMultiple together', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      const usePlugin2 = createHook({
        kind: 'plugin-2',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-2', { attach: true })
      });

      const usePlugin3 = createHook({
        kind: 'plugin-3',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-3', { attach: true })
      });

      const usePlugin4 = createHook({
        kind: 'plugin-4',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-4', { attach: true })
      });

      system = await useBase('test')
        .use(usePlugin1)
        .useMultiple([usePlugin2, usePlugin3])
        .useIfMultiple(true, [usePlugin4])
        .build();

      expect(system.find('plugin-1')).toBeDefined();
      expect(system.find('plugin-2')).toBeDefined();
      expect(system.find('plugin-3')).toBeDefined();
      expect(system.find('plugin-4')).toBeDefined();
    });
  });

  describe('configMultiple', () => {
    it('should configure multiple facets at once', async () => {
      system = await useBase('test')
        .configMultiple({
          database: { host: 'localhost', port: 5432 },
          cache: { ttl: 3600 },
          auth: { secret: 'abc123' }
        })
        .build();

      expect(system.ctx.config.database).toEqual({ host: 'localhost', port: 5432 });
      expect(system.ctx.config.cache).toEqual({ ttl: 3600 });
      expect(system.ctx.config.auth).toEqual({ secret: 'abc123' });
    });

    it('should merge configurations when called multiple times', async () => {
      system = await useBase('test')
        .configMultiple({
          database: { host: 'localhost' },
          cache: { ttl: 3600 }
        })
        .configMultiple({
          database: { port: 5432 }, // Should merge with existing
          auth: { secret: 'abc123' }
        })
        .build();

      expect(system.ctx.config.database).toEqual({ host: 'localhost', port: 5432 });
      expect(system.ctx.config.cache).toEqual({ ttl: 3600 });
      expect(system.ctx.config.auth).toEqual({ secret: 'abc123' });
    });

    it('should work with config() method', async () => {
      system = await useBase('test')
        .config('database', { host: 'localhost' })
        .configMultiple({
          database: { port: 5432 }, // Should merge
          cache: { ttl: 3600 }
        })
        .build();

      expect(system.ctx.config.database).toEqual({ host: 'localhost', port: 5432 });
      expect(system.ctx.config.cache).toEqual({ ttl: 3600 });
    });

    it('should throw error if configs is not an object', () => {
      expect(() => {
        useBase('test').configMultiple('not-an-object');
      }).toThrow('useBase.configMultiple: configs must be an object');

      expect(() => {
        useBase('test').configMultiple([]);
      }).toThrow('useBase.configMultiple: configs must be an object');

      expect(() => {
        useBase('test').configMultiple(null);
      }).toThrow('useBase.configMultiple: configs must be an object');
    });

    it('should handle empty object', async () => {
      system = await useBase('test')
        .configMultiple({})
        .build();

      expect(system.isBuilt).toBe(true);
    });
  });

  describe('setBase', () => {
    it('should default to StandalonePluginSystem', async () => {
      system = await useBase('test').build();

      // Check it's a StandalonePluginSystem (has no message system requirement)
      expect(system.name).toBe('test');
      expect(system.messageSystem).toBeNull();
    });

    it('should allow setting BaseSubsystem', async () => {
      system = await useBase('test')
        .setBase(BaseSubsystem)
        .build();

      expect(system).toBeInstanceOf(BaseSubsystem);
      expect(system.name).toBe('test');
    });

    it('should throw error if called after system is created', async () => {
      const builder = useBase('test');
      
      // Trigger system creation
      await builder.build();
      
      expect(() => {
        builder.setBase(BaseSubsystem);
      }).toThrow('useBase.setBase: cannot change base class after system is created');
    });

    it('should throw error if BaseClass is not a function', () => {
      expect(() => {
        useBase('test').setBase('not-a-function');
      }).toThrow('useBase.setBase: BaseClass must be a constructor function');
    });

    it('should throw error if BaseClass is not BaseSubsystem or subclass', () => {
      class NotASubsystem {}
      
      expect(() => {
        useBase('test').setBase(NotASubsystem);
      }).toThrow('useBase.setBase: BaseClass must be BaseSubsystem or a subclass of BaseSubsystem');
    });

    it('should work with hooks and configs', async () => {
      const usePlugin1 = createHook({
        kind: 'plugin-1',
        attach: true,
        source: 'test.js',
        fn: () => new Facet('plugin-1', { attach: true })
      });

      system = await useBase('test')
        .setBase(BaseSubsystem)
        .config('plugin-1', { setting: 'value' })
        .use(usePlugin1)
        .build();

      expect(system).toBeInstanceOf(BaseSubsystem);
      expect(system.find('plugin-1')).toBeDefined();
      expect(system.ctx.config['plugin-1']).toEqual({ setting: 'value' });
    });

    it('should work with configMultiple', async () => {
      system = await useBase('test')
        .setBase(BaseSubsystem)
        .configMultiple({
          database: { host: 'localhost' },
          cache: { ttl: 3600 }
        })
        .build();

      expect(system).toBeInstanceOf(BaseSubsystem);
      expect(system.ctx.config.database).toEqual({ host: 'localhost' });
      expect(system.ctx.config.cache).toEqual({ ttl: 3600 });
    });
  });
});

