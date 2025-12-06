# Getting Started with Mycelia Plugin System

Welcome to the Mycelia Plugin System! This guide will help you get started with creating and using plugins.

## What is Mycelia Plugin System?

Mycelia Plugin System is a sophisticated, dependency-aware plugin architecture that provides:

- **Hook-based composition** - Extend systems without modification
- **Dependency resolution** - Automatic topological sorting
- **Transaction safety** - Atomic installation with rollback
- **Lifecycle management** - Built-in initialization and disposal
- **Facet contracts** - Runtime validation of plugin interfaces
- **Standalone mode** - Works without message system or other dependencies

## Installation

```bash
npm install mycelia-kernel-plugin-system
```

## Quick Start

### 1. Create a Simple Plugin

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Create a plugin (hook)
const useGreeter = createHook({
  kind: 'greeter',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('greeter', { 
      attach: true,
      source: import.meta.url 
    })
    .add({
      greet(name) {
        return `Hello, ${name}!`;
      }
    });
  }
});

// Create and use the system
const system = new StandalonePluginSystem('my-app', {});

system.use(useGreeter);
await system.build();

// Use the plugin
const greeter = system.find('greeter');
console.log(greeter.greet('World')); // "Hello, World!"
```

### 2. Plugin with Configuration

```javascript
const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Extract configuration
    const config = ctx.config?.database || {};
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          // Use config.host, config.port, etc.
          return { rows: [] };
        }
      });
  }
});

const system = new StandalonePluginSystem('my-app', {
  config: {
    database: {
      host: 'localhost',
      port: 5432
    }
  }
});

system.use(useDatabase);
await system.build();
```

### 3. Plugin with Dependencies

```javascript
// Plugin A: Logger
const useLogger = createHook({
  kind: 'logger',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', { attach: true, source: import.meta.url })
      .add({
        log(message) {
          console.log(message);
        }
      });
  }
});

// Plugin B: Cache (depends on logger)
const useCache = createHook({
  kind: 'cache',
  required: ['logger'],  // Declare dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required dependency
    const logger = api.__facets.logger;
    
    return new Facet('cache', { 
      attach: true,
      required: ['logger'],
      source: import.meta.url 
    })
      .add({
        get(key) {
          logger.log(`Getting ${key}`);
          return this.store.get(key);
        },
        
        set(key, value) {
          logger.log(`Setting ${key}`);
          this.store.set(key, value);
        }
      })
      .onInit(async ({ ctx }) => {
        this.store = new Map();
      });
  }
});

const system = new StandalonePluginSystem('my-app', {});

// Register in any order - dependencies resolved automatically
system
  .use(useCache)   // Registered first
  .use(useLogger)  // Registered second, but initialized first
  .build();

// Use plugins
const logger = system.find('logger');
const cache = system.find('cache');
```

### 4. Plugin with Lifecycle

```javascript
const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    let connection = null;
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          return connection.query(sql);
        }
      })
      .onInit(async ({ ctx }) => {
        // Initialize during build
        const config = ctx.config?.database || {};
        connection = await createConnection(config);
        console.log('Database connected');
      })
      .onDispose(async () => {
        // Cleanup during disposal
        if (connection) {
          await connection.close();
          console.log('Database disconnected');
        }
      });
  }
});

const system = new StandalonePluginSystem('my-app', {
  config: {
    database: { host: 'localhost', port: 5432 }
  }
});

system.use(useDatabase);
await system.build();

// Use database
const db = system.find('database');
await db.query('SELECT * FROM users');

// Cleanup
await system.dispose(); // Calls onDispose for all plugins
```

## Key Concepts

### Hooks

Hooks are factory functions that create plugins (facets). They declare:
- **kind**: Unique identifier for the plugin
- **required**: Dependencies on other plugins
- **attach**: Whether to attach to the system
- **source**: Source file location
- **fn**: Function that creates and returns a Facet

### Facets

Facets are the actual plugin instances. They provide:
- **Methods**: The functionality of the plugin
- **Lifecycle**: `onInit` and `onDispose` callbacks
- **Dependencies**: Declared dependencies

### StandalonePluginSystem

The main class for creating standalone plugin systems. It:
- Manages plugin registration and lifecycle
- Resolves dependencies automatically
- Provides transaction safety
- Handles initialization and disposal

## Next Steps

- Read the [Hooks and Facets Overview](../core-concepts/HOOKS-AND-FACETS-OVERVIEW.md) for detailed concepts
- Learn about [Creating Plugins](../standalone/STANDALONE-PLUGIN-SYSTEM.md) in the standalone guide
- Explore [Facet Contracts](../facet-contracts/FACET-CONTRACT.md) for interface validation
- Check out the [API Reference](../api-reference/HOOK-FUNCTION-CONTEXT.md) for detailed parameter documentation

## Common Patterns

### Service Container

```javascript
const system = new StandalonePluginSystem('services', {});

system
  .use(useDatabase)
  .use(useCache)
  .use(useAuth)
  .build();

const db = system.find('database');
const cache = system.find('cache');
const auth = system.find('auth');
```

### Feature Modules

```javascript
// Each feature is a plugin
system
  .use(useAuth)      // Authentication feature
  .use(useAuthz)     // Authorization feature (depends on auth)
  .use(useDatabase)  // Database feature
  .build();
```

### Conditional Plugins

```javascript
const system = new StandalonePluginSystem('app', {});

// Always load
system.use(useDatabase);

// Conditionally load
if (process.env.ENABLE_CACHE === 'true') {
  system.use(useCache);
}

await system.build();
```

## Error Handling

The plugin system uses transactions to ensure atomic installation:

```javascript
try {
  system
    .use(useDatabase)
    .use(useCache)
    .build();
} catch (error) {
  // If any plugin fails, all are rolled back
  console.error('Plugin installation failed:', error);
  // System is in clean state
}
```

## Need Help?

- Check the [Documentation Index](../README.md)
- Read the [Architecture Overview](../architecture/PLUGIN-SYSTEM-ANALYSIS.md)
- Review [Best Practices](../guides/best-practices.md) (coming soon)

