/**
 * useBase Example
 * 
 * Demonstrates how to use the useBase convenience wrapper for creating
 * plugin systems with a fluent API.
 * 
 * @example
 * node examples/use-base-example.js
 */
import { useBase } from '../src/utils/use-base.js';
import { useSpeak } from '../src/hooks/speak/use-speak.js';
import { useQueue } from '../src/hooks/queue/use-queue.js';
import { useListeners } from '../src/hooks/listeners/use-listeners.js';

async function main() {
  // Basic usage
  console.log('=== Basic Usage ===');
  const system1 = await useBase('basic-app')
    .use(useSpeak)
    .build();

  system1.speak.sayLine('Hello from useBase!');
  await system1.dispose();

  // With configuration
  console.log('\n=== With Configuration ===');
  const system2 = await useBase('configured-app')
    .config('speak', { prefix: '[App] ' })
    .config('queue', { capacity: 100 })
    .use(useSpeak)
    .use(useQueue)
    .build();

  system2.speak.sayLine('Configured system');
  console.log('Queue capacity:', system2.queue.getQueueStatus().maxSize);
  await system2.dispose();

  // With lifecycle callbacks
  console.log('\n=== With Lifecycle Callbacks ===');
  const system3 = await useBase('lifecycle-app')
    .use(useSpeak)
    .onInit(async (api, ctx) => {
      console.log(`System ${api.name} initialized`);
    })
    .onDispose(async () => {
      console.log('System disposed');
    })
    .build();

  system3.speak.sayLine('System with lifecycle');
  await system3.dispose();

  // Conditional hooks
  console.log('\n=== Conditional Hooks ===');
  const enableCache = false; // Simulate feature flag
  const system4 = await useBase('conditional-app')
    .use(useSpeak)
    .useIf(enableCache, useQueue) // Only add if condition is true
    .build();

  system4.speak.sayLine('Conditional system');
  console.log('Has queue:', system4.find('queue') !== undefined);
  await system4.dispose();

  // Merging configurations
  console.log('\n=== Merging Configurations ===');
  const system5 = await useBase('merged-config-app')
    .config('speak', { prefix: '[App] ' })
    .config('speak', { debug: true }) // Merges with existing config
    .use(useSpeak)
    .build();

  system5.speak.sayLine('Merged configuration');
  await system5.dispose();

  // Complex example with multiple hooks
  console.log('\n=== Complex Example ===');
  const system6 = await useBase('complex-app', {
    debug: true,
    config: {
      speak: { prefix: '[Complex] ' },
      queue: { capacity: 50 }
    }
  })
    .config('listeners', { registrationPolicy: 'multiple' })
    .use(useSpeak)
    .use(useQueue)
    .use(useListeners)
    .onInit(async (api, ctx) => {
      console.log(`Complex system ${api.name} ready`);
    })
    .build();

  system6.speak.sayLine('Complex system built');
  system6.listeners.enableListeners();
  system6.listeners.on('test', (msg) => {
    console.log('Event received:', msg);
  });
  system6.listeners.emit('test', 'Hello from listeners!');

  await system6.dispose();
}

main().catch(console.error);

