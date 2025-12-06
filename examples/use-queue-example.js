/**
 * useQueue Example
 * 
 * Demonstrates how to use the useQueue hook for message queuing.
 * 
 * @example
 * node examples/use-queue-example.js
 */
import { StandalonePluginSystem } from '../src/system/standalone-plugin-system.js';
import { useQueue } from '../src/hooks/queue/use-queue.js';

async function main() {
  // Create a standalone plugin system
  const system = new StandalonePluginSystem('queue-example', {
    debug: true,
    config: {
      queue: {
        capacity: 10,
        policy: 'drop-oldest'
      }
    }
  });

  // Add the queue hook
  system.use(useQueue);

  // Build the system
  await system.build();

  // Enqueue some messages
  const messages = [
    { msg: 'Message 1', options: {} },
    { msg: 'Message 2', options: {} },
    { msg: 'Message 3', options: {} }
  ];

  for (const message of messages) {
    const success = system.queue.queue.enqueue(message);
    console.log(`Enqueued: ${message.msg} (success: ${success})`);
  }

  // Get queue status
  const status = system.queue.getQueueStatus();
  console.log('Queue status:', status);

  // Process messages
  while (system.queue.hasMessagesToProcess()) {
    const next = system.queue.selectNextMessage();
    if (next) {
      console.log('Processed:', next.msg);
    }
  }

  // Get final status
  const finalStatus = system.queue.getQueueStatus();
  console.log('Final queue status:', finalStatus);

  // Cleanup
  await system.dispose();
}

main().catch(console.error);

