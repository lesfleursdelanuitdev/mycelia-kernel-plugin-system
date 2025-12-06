/**
 * useListeners Example
 * 
 * Demonstrates how to use the useListeners hook for event-driven communication.
 * 
 * @example
 * node examples/use-listeners-example.js
 */
import { StandalonePluginSystem } from '../src/system/standalone-plugin-system.js';
import { useListeners } from '../src/hooks/listeners/use-listeners.js';

async function main() {
  // Create a standalone plugin system
  const system = new StandalonePluginSystem('listeners-example', {
    debug: true,
    config: {
      listeners: {
        registrationPolicy: 'multiple'
      }
    }
  });

  // Add the listeners hook
  system.use(useListeners);

  // Build the system
  await system.build();

  // Enable listeners
  system.listeners.enableListeners();

  // Register listeners
  system.listeners.on('greet', (message) => {
    console.log('Listener 1:', message);
  });

  system.listeners.on('greet', (message) => {
    console.log('Listener 2:', message);
  });

  // Emit events
  system.listeners.emit('greet', 'Hello from listeners!');

  // Register a pattern listener
  system.listeners.onPattern('user/{id}/action', (message, params) => {
    console.log(`User ${params.id} performed action:`, message);
  });

  // Emit to pattern
  system.listeners.emit('user/123/action', 'clicked button');

  // Cleanup
  await system.dispose();
}

main().catch(console.error);

