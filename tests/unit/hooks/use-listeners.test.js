import { describe, it, expect, beforeEach } from 'vitest';
import { useListeners } from '../../../src/hooks/listeners/use-listeners.js';
import { StandalonePluginSystem } from '../../../src/system/standalone-plugin-system.js';

describe('useListeners', () => {
  let system;
  let ctx;
  let api;
  let subsystem;

  beforeEach(() => {
    system = new StandalonePluginSystem('test', {
      config: {
        listeners: {
          registrationPolicy: 'multiple',
          debug: false
        }
      }
    });
    ctx = system.ctx;
    api = system.api;
    subsystem = system;
  });

  describe('hook execution', () => {
    it('should create a listeners facet', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(facet).toBeDefined();
      expect(facet.getKind()).toBe('listeners');
    });

    it('should have hasListeners method', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(typeof facet.hasListeners).toBe('function');
      expect(facet.hasListeners()).toBe(false);
    });

    it('should have enableListeners method', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(typeof facet.enableListeners).toBe('function');
    });

    it('should have disableListeners method', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(typeof facet.disableListeners).toBe('function');
    });

    it('should have on method', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(typeof facet.on).toBe('function');
    });

    it('should have off method', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(typeof facet.off).toBe('function');
    });

    it('should have emit method', () => {
      const facet = useListeners(ctx, api, subsystem);
      expect(typeof facet.emit).toBe('function');
    });
  });

  describe('listener management', () => {
    it('should enable and disable listeners', () => {
      const facet = useListeners(ctx, api, subsystem);
      
      expect(facet.hasListeners()).toBe(false);
      facet.enableListeners();
      expect(facet.hasListeners()).toBe(true);
      facet.disableListeners();
      expect(facet.hasListeners()).toBe(false);
    });

    it('should register listeners when enabled', () => {
      const facet = useListeners(ctx, api, subsystem);
      facet.enableListeners();
      
      const handler = () => {};
      const result = facet.on('test/path', handler);
      expect(result).toBe(true);
    });

    it('should not register listeners when disabled', () => {
      const facet = useListeners(ctx, api, subsystem);
      // Don't enable listeners
      
      const handler = () => {};
      const result = facet.on('test/path', handler);
      expect(result).toBe(false);
    });

    it('should emit events to registered listeners', () => {
      const facet = useListeners(ctx, api, subsystem);
      facet.enableListeners();
      
      let called = false;
      const handler = (message) => {
        called = true;
        expect(message).toBe('test message');
      };
      
      facet.on('test/path', handler);
      const notified = facet.emit('test/path', 'test message');
      
      expect(called).toBe(true);
      expect(notified).toBe(1);
    });

    it('should return 0 when emitting to disabled listeners', () => {
      const facet = useListeners(ctx, api, subsystem);
      // Don't enable listeners
      
      const notified = facet.emit('test/path', 'test message');
      expect(notified).toBe(0);
    });

    it('should unregister listeners', () => {
      const facet = useListeners(ctx, api, subsystem);
      facet.enableListeners();
      
      let callCount = 0;
      const handler = () => { callCount++; };
      
      facet.on('test/path', handler);
      facet.emit('test/path', 'msg');
      expect(callCount).toBe(1);
      
      facet.off('test/path', handler);
      facet.emit('test/path', 'msg');
      expect(callCount).toBe(1); // Should not increment
    });
  });

  describe('integration with system', () => {
    it('should work when added to a system', async () => {
      await system.use(useListeners).build();
      
      expect(system.listeners).toBeDefined();
      expect(typeof system.listeners.enableListeners).toBe('function');
    });

    it('should allow registering and emitting events', async () => {
      await system.use(useListeners).build();
      
      system.listeners.enableListeners();
      
      let called = false;
      system.listeners.on('greet', (msg) => {
        called = true;
        expect(msg).toBe('Hello');
      });
      
      system.listeners.emit('greet', 'Hello');
      expect(called).toBe(true);
    });
  });
});

