/**
 * Hello World Example
 * 
 * A simple example demonstrating the useSpeak hook with the speak contract.
 * This is a minimal "hello world" example for the plugin system.
 * 
 * @example
 * node examples/hello-world.js
 */
import { StandalonePluginSystem } from '../src/system/standalone-plugin-system.js';
import { useSpeak } from '../src/hooks/speak/use-speak.js';

async function main() {
  // Create a standalone plugin system
  const system = new StandalonePluginSystem('hello-world', {
    debug: true,
    config: {
      speak: {
        prefix: '[HelloWorld] '
      }
    }
  });

  // Add the speak hook
  system.use(useSpeak);

  // Build the system
  await system.build();

  // Use the speak facet
  system.speak.sayLine('Hello, World!');
  system.speak.say('This is a ');
  system.speak.sayLine('simple example.');

  // Cleanup
  await system.dispose();
}

main().catch(console.error);

