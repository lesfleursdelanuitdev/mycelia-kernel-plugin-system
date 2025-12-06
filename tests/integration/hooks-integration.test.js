import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StandalonePluginSystem } from '../../src/system/standalone-plugin-system.js';
import { useListeners } from '../../src/hooks/listeners/use-listeners.js';
import { useQueue } from '../../src/hooks/queue/use-queue.js';
import { useSpeak } from '../../src/hooks/speak/use-speak.js';

describe('Hooks Integration Tests', () => {
  let system;

  beforeEach(() => {
    system = new StandalonePluginSystem('test-app', {
      debug: false,
      config: {
        listeners: {
          registrationPolicy: 'multiple'
        },
        queue: {
          capacity: 100,
          policy: 'drop-oldest'
        },
        speak: {
          prefix: '[App] '
        }
      }
    });
  });

  afterEach(async () => {
    if (system && system.isBuilt) {
      await system.dispose();
    }
  });

  describe('useListeners integration', () => {
    it('should integrate with system and handle events', async () => {
      await system.use(useListeners).build();

      system.listeners.enableListeners();

      const events = [];
      system.listeners.on('user/action', (message) => {
        events.push(message);
      });

      system.listeners.emit('user/action', 'click');
      system.listeners.emit('user/action', 'scroll');

      expect(events).toEqual(['click', 'scroll']);
    });

    it('should support pattern listeners', async () => {
      await system.use(useListeners).build();

      system.listeners.enableListeners();

      const events = [];
      // Access ListenerManager through listeners property
      system.listeners.listeners.onPattern('user/{id}/action', (message, params) => {
        events.push({ message, params });
      });

      system.listeners.emit('user/123/action', 'click');
      system.listeners.emit('user/456/action', 'scroll');

      expect(events).toHaveLength(2);
      expect(events[0].params.id).toBe('123');
      expect(events[1].params.id).toBe('456');
    });
  });

  describe('useQueue integration', () => {
    it('should integrate with system and process messages', async () => {
      await system.use(useQueue).build();

      const messages = [
        { msg: 'Message 1', options: {} },
        { msg: 'Message 2', options: {} },
        { msg: 'Message 3', options: {} }
      ];

      for (const msg of messages) {
        system.queue.queue.enqueue(msg);
      }

      expect(system.queue.hasMessagesToProcess()).toBe(true);

      const processed = [];
      while (system.queue.hasMessagesToProcess()) {
        const next = system.queue.selectNextMessage();
        if (next) {
          processed.push(next.msg);
        }
      }

      expect(processed).toEqual(['Message 1', 'Message 2', 'Message 3']);
      expect(system.queue.hasMessagesToProcess()).toBe(false);
    });

    it('should report correct queue status', async () => {
      await system.use(useQueue).build();

      const status1 = system.queue.getQueueStatus();
      expect(status1.isEmpty).toBe(true);
      expect(status1.size).toBe(0);

      system.queue.queue.enqueue({ msg: 'test', options: {} });

      const status2 = system.queue.getQueueStatus();
      expect(status2.isEmpty).toBe(false);
      expect(status2.size).toBe(1);
    });
  });

  describe('useSpeak integration', () => {
    it('should integrate with system and output messages', async () => {
      const output = vi.fn();
      const customSystem = new StandalonePluginSystem('test-app', {
        config: {
          speak: {
            output,
            prefix: '[App] '
          }
        }
      });

      await customSystem.use(useSpeak).build();

      customSystem.speak.say('Hello');
      customSystem.speak.sayLine('World!');

      expect(output).toHaveBeenCalledWith('[App] Hello');
      expect(output).toHaveBeenCalledWith('[App] World!');

      await customSystem.dispose();
    });
  });

  describe('multiple hooks integration', () => {
    it('should work with all hooks together', async () => {
      await system.use(useListeners).use(useQueue).use(useSpeak).build();

      // Enable listeners
      system.listeners.enableListeners();

      // Register listener that processes queue messages
      const processed = [];
      system.listeners.on('queue/process', (message) => {
        processed.push(message);
        system.queue.queue.enqueue({ msg: message, options: {} });
      });

      // Emit event
      system.listeners.emit('queue/process', 'Task 1');
      system.listeners.emit('queue/process', 'Task 2');

      // Process queue
      const queueMessages = [];
      while (system.queue.hasMessagesToProcess()) {
        const next = system.queue.selectNextMessage();
        if (next) {
          queueMessages.push(next.msg);
        }
      }

      expect(processed).toEqual(['Task 1', 'Task 2']);
      expect(queueMessages).toEqual(['Task 1', 'Task 2']);
    });

    it('should allow speak to announce queue operations', async () => {
      const output = vi.fn();
      const customSystem = new StandalonePluginSystem('test-app', {
        config: {
          queue: {
            capacity: 100,
            policy: 'drop-oldest'
          },
          speak: {
            output,
            prefix: '[App] '
          }
        }
      });

      await customSystem.use(useQueue).use(useSpeak).build();

      customSystem.queue.queue.enqueue({ msg: 'Important task', options: {} });
      customSystem.speak.sayLine('Queue has messages');

      const status = customSystem.queue.getQueueStatus();
      customSystem.speak.sayLine(`Queue status: ${status.size} messages`);

      expect(output).toHaveBeenCalledWith('[App] Queue has messages');
      expect(output).toHaveBeenCalledWith('[App] Queue status: 1 messages');

      await customSystem.dispose();
    });
  });
});

