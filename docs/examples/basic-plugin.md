# Basic Plugin Example

This example demonstrates how to create and use a simple plugin with no dependencies.

## Complete Example

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Create a simple logger plugin
export const useLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.logger || {};
    const level = config.level || 'info';
    
    return new Facet('logger', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      log(message, data = {}) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data);
      },
      
      error(message, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] ${message}`, error);
      },
      
      warn(message, data = {}) {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] ${message}`, data);
      }
    })
    .onInit(async ({ ctx }) => {
      // Logger is ready to use
      if (ctx.debug) {
        console.log('Logger plugin initialized');
      }
    });
  }
});

// Create and use the system
async function main() {
  const system = new StandalonePluginSystem('my-app', {
    config: {
      logger: {
        level: 'info'
      }
    },
    debug: true
  });

  // Register and build
  await system
    .use(useLogger)
    .build();

  // Use the plugin
  const logger = system.find('logger');
  
  logger.log('Application started');
  logger.warn('This is a warning');
  logger.error('This is an error', new Error('Something went wrong'));
  
  // Cleanup
  await system.dispose();
}

main().catch(console.error);
```

## Explanation

### 1. Creating the Hook

The `useLogger` hook is created using `createHook()`:
- **`kind`**: Unique identifier for the plugin (`'logger'`)
- **`version`**: Plugin version (`'1.0.0'`)
- **`attach`**: Makes the plugin available via `system.find('logger')`
- **`source`**: Source file location for debugging
- **`fn`**: Factory function that creates the facet

### 2. Creating the Facet

The facet is created with:
- **`kind`**: Must match the hook's kind
- **`attach: true`**: Makes it accessible via `system.find()`
- **`.add()`**: Adds methods to the facet
- **`.onInit()`**: Optional initialization callback

### 3. Using the System

1. Create a `StandalonePluginSystem` instance
2. Register hooks with `.use()`
3. Build the system with `.build()`
4. Access plugins with `system.find('kind')`
5. Clean up with `.dispose()`

## Expected Output

```
Logger plugin initialized
[2024-01-15T10:30:00.000Z] [INFO] Application started
[2024-01-15T10:30:00.001Z] [WARN] This is a warning
[2024-01-15T10:30:00.002Z] [ERROR] This is an error Error: Something went wrong
```

## Next Steps

- Add more methods to the logger (e.g., `debug()`, `trace()`)
- Add file logging capability
- Create a plugin that depends on the logger (see [Plugin with Dependencies](./plugin-with-dependencies.md))
- Add configuration validation (see [Context Configuration](./context-configuration.md))

