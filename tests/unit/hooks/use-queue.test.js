import { describe, it, expect, beforeEach } from 'vitest';
import { useQueue } from '../../../src/hooks/queue/use-queue.js';
import { StandalonePluginSystem } from '../../../src/system/standalone-plugin-system.js';

describe('useQueue', () => {
  let system;
  let ctx;
  let api;
  let subsystem;

  beforeEach(() => {
    system = new StandalonePluginSystem('test', {
      config: {
        queue: {
          capacity: 10,
          policy: 'drop-oldest',
          debug: false
        }
      }
    });
    ctx = system.ctx;
    api = system.api;
    subsystem = system;
  });

  describe('hook execution', () => {
    it('should create a queue facet', () => {
      const facet = useQueue(ctx, api, subsystem);
      expect(facet).toBeDefined();
      expect(facet.getKind()).toBe('queue');
    });

    it('should have getQueueStatus method', () => {
      const facet = useQueue(ctx, api, subsystem);
      expect(typeof facet.getQueueStatus).toBe('function');
    });

    it('should have queue property', () => {
      const facet = useQueue(ctx, api, subsystem);
      expect(facet.queue).toBeDefined();
      expect(typeof facet.queue.enqueue).toBe('function');
      expect(typeof facet.queue.dequeue).toBe('function');
    });

    it('should have clearQueue method', () => {
      const facet = useQueue(ctx, api, subsystem);
      expect(typeof facet.clearQueue).toBe('function');
    });

    it('should have hasMessagesToProcess method', () => {
      const facet = useQueue(ctx, api, subsystem);
      expect(typeof facet.hasMessagesToProcess).toBe('function');
    });

    it('should have selectNextMessage method', () => {
      const facet = useQueue(ctx, api, subsystem);
      expect(typeof facet.selectNextMessage).toBe('function');
    });
  });

  describe('queue operations', () => {
    it('should enqueue and dequeue messages', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      const message = { msg: 'test', options: {} };
      const success = facet.queue.enqueue(message);
      expect(success).toBe(true);
      
      const dequeued = facet.queue.dequeue();
      expect(dequeued).toEqual(message);
    });

    it('should report correct queue status', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      const status = facet.getQueueStatus();
      expect(status.size).toBe(0);
      expect(status.capacity).toBe(10);
      expect(status.isEmpty).toBe(true);
      expect(status.isFull).toBe(false);
    });

    it('should check if queue has messages', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      expect(facet.hasMessagesToProcess()).toBe(false);
      
      facet.queue.enqueue({ msg: 'test', options: {} });
      expect(facet.hasMessagesToProcess()).toBe(true);
    });

    it('should select next message', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      const message = { msg: 'test', options: {} };
      facet.queue.enqueue(message);
      
      const next = facet.selectNextMessage();
      expect(next).toEqual(message);
      expect(facet.hasMessagesToProcess()).toBe(false);
    });

    it('should clear queue', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      facet.queue.enqueue({ msg: 'test1', options: {} });
      facet.queue.enqueue({ msg: 'test2', options: {} });
      
      expect(facet.hasMessagesToProcess()).toBe(true);
      facet.clearQueue();
      expect(facet.hasMessagesToProcess()).toBe(false);
    });
  });

  describe('queue capacity and policy', () => {
    it('should respect capacity limit', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      // Fill queue to capacity
      for (let i = 0; i < 10; i++) {
        facet.queue.enqueue({ msg: `test${i}`, options: {} });
      }
      
      const status = facet.getQueueStatus();
      expect(status.isFull).toBe(true);
      expect(status.size).toBe(10);
    });

    it('should handle drop-oldest policy', () => {
      const facet = useQueue(ctx, api, subsystem);
      
      // Fill queue
      for (let i = 0; i < 10; i++) {
        facet.queue.enqueue({ msg: `test${i}`, options: {} });
      }
      
      // Try to enqueue one more (should drop oldest)
      const success = facet.queue.enqueue({ msg: 'new', options: {} });
      expect(success).toBe(true);
      
      // First message should be dropped
      const first = facet.queue.dequeue();
      expect(first.msg).not.toBe('test0');
    });
  });

  describe('integration with system', () => {
    it('should work when added to a system', async () => {
      await system.use(useQueue).build();
      
      expect(system.queue).toBeDefined();
      expect(typeof system.queue.getQueueStatus).toBe('function');
    });

    it('should allow queueing and processing messages', async () => {
      await system.use(useQueue).build();
      
      const message = { msg: 'test', options: {} };
      system.queue.queue.enqueue(message);
      
      expect(system.queue.hasMessagesToProcess()).toBe(true);
      
      const next = system.queue.selectNextMessage();
      expect(next).toEqual(message);
      expect(system.queue.hasMessagesToProcess()).toBe(false);
    });
  });
});

