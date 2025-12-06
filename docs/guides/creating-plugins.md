# Creating Plugins Guide

This guide walks you through creating your first plugin step by step.

## Step 1: Understand the Basics

A plugin in Mycelia Plugin System consists of:
- **Hook**: Factory function that creates the plugin
- **Facet**: The actual plugin instance with methods and lifecycle

## Step 2: Create a Simple Plugin

Let's create a basic logger plugin:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', {
      attach: true,
      source: import.meta.url
    })
    .add({
      log(message) {
        console.log(message);
      }
    });
  }
});
```

### What Each Part Does

1. **`kind: 'logger'`** - Unique identifier for your plugin
2. **`version: '1.0.0'`** - Plugin version
3. **`attach: true`** - Makes plugin accessible via `system.find('logger')`
4. **`source: import.meta.url`** - Source file location (for debugging)
5. **`fn`** - Factory function that creates the facet
6. **`.add()`** - Adds methods to the facet

## Step 3: Add Configuration

Use the context to access configuration:

```javascript
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
      source: import.meta.url
    })
    .add({
      log(message) {
        if (level === 'debug' || level === 'info') {
          console.log(`[${level.toUpperCase()}] ${message}`);
        }
      },
      
      error(message) {
        console.error(`[ERROR] ${message}`);
      }
    });
  }
});
```

## Step 4: Add Lifecycle Management

Use `onInit` and `onDispose` for resource management:

```javascript
export const useLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.logger || {};
    
    return new Facet('logger', {
      attach: true,
      source: import.meta.url
    })
    .add({
      log(message) {
        if (this.enabled) {
          console.log(message);
        }
      }
    })
    .onInit(async ({ ctx }) => {
      // Initialize resources
      this.enabled = config.enabled !== false;
      this.level = config.level || 'info';
      console.log('Logger initialized');
    })
    .onDispose(async () => {
      // Cleanup resources
      this.enabled = false;
      console.log('Logger disposed');
    });
  }
});
```

## Step 5: Add Dependencies

Declare dependencies in the hook metadata:

```javascript
export const useCache = createHook({
  kind: 'cache',
  version: '1.0.0',
  required: ['logger'],  // Declare dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access dependency
    const logger = api.__facets.logger;
    
    return new Facet('cache', {
      attach: true,
      required: ['logger'],
      source: import.meta.url
    })
    .add({
      get(key) {
        logger.log(`Cache get: ${key}`);
        return this.store.get(key);
      },
      
      set(key, value) {
        logger.log(`Cache set: ${key}`);
        this.store.set(key, value);
      }
    })
    .onInit(async ({ ctx }) => {
      this.store = new Map();
      logger.log('Cache initialized');
    });
  }
});
```

## Step 6: Use Your Plugin

Create a system and use your plugin:

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin-system';
import { useLogger } from './plugins/use-logger.js';
import { useCache } from './plugins/use-cache.js';

async function main() {
  const system = new StandalonePluginSystem('my-app', {
    config: {
      logger: {
        level: 'info',
        enabled: true
      }
    }
  });

  await system
    .use(useLogger)
    .use(useCache)
    .build();

  // Use the plugins
  const logger = system.find('logger');
  const cache = system.find('cache');
  
  logger.log('Application started');
  cache.set('key', 'value');
  console.log(cache.get('key'));
  
  // Cleanup
  await system.dispose();
}

main().catch(console.error);
```

## Step 7: Add Error Handling

Handle errors appropriately:

```javascript
export const useDatabase = createHook({
  kind: 'database',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      attach: true,
      source: import.meta.url
    })
    .add({
      async query(sql) {
        if (!this.connected) {
          throw new Error('Database not connected');
        }
        // Execute query...
      }
    })
    .onInit(async ({ ctx }) => {
      try {
        // Initialize connection
        this.connected = true;
      } catch (error) {
        // Errors in onInit cause build to fail
        throw new Error(`Failed to initialize database: ${error.message}`);
      }
    })
    .onDispose(async () => {
      // Cleanup is called even if onInit fails
      this.connected = false;
    });
  }
});
```

## Step 8: Add Contract Validation (Optional)

Use contracts to validate plugin interfaces:

```javascript
import { createFacetContract } from 'mycelia-kernel-plugin-system';

const loggerContract = createFacetContract({
  name: 'logger',
  requiredMethods: ['log', 'error'],
  validate: (facet) => {
    if (typeof facet.log !== 'function') {
      throw new Error('Logger must have a log method');
    }
    return true;
  }
});

export const useLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  contract: 'logger',  // Declare contract
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', {
      attach: true,
      contract: 'logger',
      source: import.meta.url
    })
    .add({
      log(message) { /* ... */ },
      error(message) { /* ... */ }
    });
  }
});
```

## Common Patterns

### Pattern 1: Configuration-Based Plugin

```javascript
export const useDatabase = createHook({
  kind: 'database',
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    const type = config.type || 'postgresql';
    
    // Choose implementation based on config
    if (type === 'postgresql') {
      return createPostgreSQLFacet(config);
    } else if (type === 'mysql') {
      return createMySQLFacet(config);
    }
  }
});
```

### Pattern 2: Optional Dependencies

```javascript
export const useCache = createHook({
  kind: 'cache',
  // No 'required' - logger is optional
  fn: (ctx, api, subsystem) => {
    // Try to get logger, but don't require it
    const logger = subsystem.find('logger');
    
    return new Facet('cache', {
      attach: true
    })
    .add({
      get(key) {
        if (logger) {
          logger.log(`Cache get: ${key}`);
        }
        return this.store.get(key);
      }
    });
  }
});
```

### Pattern 3: Multiple Methods

```javascript
export const useAPI = createHook({
  kind: 'api',
  fn: (ctx, api, subsystem) => {
    return new Facet('api', {
      attach: true
    })
    .add({
      async get(url) { /* ... */ },
      async post(url, data) { /* ... */ },
      async put(url, data) { /* ... */ },
      async delete(url) { /* ... */ }
    });
  }
});
```

## Checklist

When creating a plugin, make sure to:

- [ ] Choose a unique `kind` name
- [ ] Set `version` appropriately
- [ ] Set `attach: true` if you want `system.find()` access
- [ ] Include `source: import.meta.url` for debugging
- [ ] Declare all dependencies in `required`
- [ ] Add `onInit` for initialization
- [ ] Add `onDispose` for cleanup
- [ ] Handle errors appropriately
- [ ] Test your plugin
- [ ] Document your plugin's API

## Next Steps

- Learn about [Dependency Management](./dependency-management.md)
- Read [Best Practices](./best-practices.md)
- See [Examples](../examples/README.md) for complete examples

