# Standalone Plugin System

## Overview

The Mycelia Plugin System can be used as a **standalone plugin system** without requiring a message system. This makes it ideal for:

- **Plugin architectures**: Extensible systems where plugins add functionality
- **Modular applications**: Applications that need dependency injection and lifecycle management
- **Component systems**: Systems where components can be dynamically added/removed
- **Service containers**: Lightweight service containers with plugin support

**Key Benefits:**
- **No Message System Required**: Message system is optional (can be `null`)
- **Ready-to-Use**: `StandalonePluginSystem` class handles all setup automatically
- **Full Plugin Architecture**: Hooks, facets, transactions, and builder all work standalone
- **Lifecycle Management**: Built-in build/dispose lifecycle
- **Dependency Injection**: Automatic dependency resolution and initialization

**Quick Start:**
```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) { return { rows: [] }; }
      });
  }
});

const system = new StandalonePluginSystem('my-app', {
  config: { database: { host: 'localhost' } }
});

system.use(useDatabase);
await system.build();

const db = system.find('database');
await db.query('SELECT * FROM users');
```

## What is a Standalone Plugin System?

A standalone plugin system uses the hook and facet architecture without message processing capabilities. It provides:

- **Plugin Registration**: Hooks act as plugins that extend functionality
- **Feature Modules**: Facets provide modular features
- **Dependency Management**: Automatic dependency resolution
- **Lifecycle Control**: Build and dispose lifecycle
- **Transaction Safety**: Atomic plugin installation

**Architecture:**
```
Standalone Plugin System
├─ StandalonePluginSystem (extends BaseSubsystem)
│  ├─ Hooks (plugins)
│  ├─ Facets (features)
│  ├─ FacetManager (plugin registry)
│  └─ SubsystemBuilder (plugin installer)
└─ No Message System required (ms: null)
```

## Minimal Setup

### Recommended: StandalonePluginSystem

The easiest way to create a standalone plugin system is to use the `StandalonePluginSystem` class. It automatically:
- Sets message system to `null`
- Overrides message-specific methods as no-ops
- Handles all the setup for you

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          // Database query logic
          return { rows: [] };
        },
        
        async close() {
          // Close connection
        }
      });
  }
});

const useCache = createHook({
  kind: 'cache',
  required: ['database'],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const database = api.__facets.database;
    
    return new Facet('cache', { attach: true, source: import.meta.url })
      .add({
        async get(key) { /* ... */ },
        async set(key, value) { /* ... */ }
      });
  }
});

// Create standalone plugin system
const system = new StandalonePluginSystem('my-plugin-system', {
  config: {
    database: {
      host: 'localhost',
      port: 5432
    },
    cache: {
      maxSize: 1000
    }
  },
  debug: true
});

// Register plugins
system
  .use(useDatabase)
  .use(useCache)
  .build();

// Use plugins
const db = system.find('database');
const cache = system.find('cache');
```

**Benefits:**
- No need to manually override methods
- Clean, simple API
- All message-specific methods are already no-ops
- Message system is automatically set to `null`

### Alternative: BaseSubsystem with Manual Setup

If you prefer to use `BaseSubsystem` directly, you can create a minimal system:

```javascript
import { BaseSubsystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Create standalone system with null message system
const pluginSystem = new BaseSubsystem('my-plugin-system', {
  ms: null,  // Optional - can be null for standalone
  config: {
    // Plugin-specific configuration
  },
  debug: true
});

// Register plugins
pluginSystem.use(useDatabase);

// Build the system
await pluginSystem.build();
```

**Note:** The `ms` option is optional and can be `null` for standalone systems. The system will work fine as long as your hooks and facets don't try to use message system features.

## Creating Plugins (Hooks)

Plugins are created using hooks. Each hook creates a facet that provides functionality.

### Simple Plugin Example

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

// Plugin: Database connection
export const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          // Database query logic
          return { rows: [] };
        },
        
        async close() {
          // Close connection
        }
      })
      .onInit(async ({ ctx }) => {
        // Initialize database connection
        const config = ctx.config?.database || {};
        this.connection = await createConnection(config);
      })
      .onDispose(async () => {
        // Close database connection
        if (this.connection) {
          await this.connection.close();
        }
      });
  }
});
```

### Plugin with Dependencies

```javascript
// Plugin: Cache (depends on database)
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],  // Declare dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required dependency
    const databaseFacet = api.__facets.database;
    
    return new Facet('cache', { 
      attach: true, 
      required: ['database'],
      source: import.meta.url 
    })
      .add({
        async get(key) {
          // Check cache, fallback to database
          const cached = this.store.get(key);
          if (cached) return cached;
          
          const data = await databaseFacet.query(`SELECT * FROM cache WHERE key = ?`, [key]);
          this.store.set(key, data);
          return data;
        },
        
        async set(key, value) {
          this.store.set(key, value);
          await databaseFacet.query(`INSERT INTO cache (key, value) VALUES (?, ?)`, [key, value]);
        }
      })
      .onInit(async ({ ctx }) => {
        const config = ctx.config?.cache || {};
        this.store = new Map();
        this.maxSize = config.maxSize || 1000;
      });
  }
});
```

## Using the Plugin System

### Registering Plugins

**Using StandalonePluginSystem (Recommended):**

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

const system = new StandalonePluginSystem('my-app', {
  config: {
    database: {
      host: 'localhost',
      port: 5432,
      database: 'myapp'
    },
    cache: {
      maxSize: 2000
    }
  },
  debug: true
});

// Register plugins
system
  .use(useDatabase)
  .use(useCache)
  .onInit((api, ctx) => {
    console.log('Plugin system initialized');
  })
  .build();
```

**Using BaseSubsystem directly:**

```javascript
import { BaseSubsystem } from 'mycelia-kernel-plugin-system';

const system = new BaseSubsystem('my-app', { 
  ms: null,  // Optional - null for standalone
  config: { /* ... */ }
});

// Register plugins
system
  .use(useDatabase)
  .use(useCache)
  .build();
```

### Accessing Plugins (Facets)

```javascript
// After build, access plugins via find()
const database = system.find('database');
const cache = system.find('cache');

// Use plugin functionality
const result = await database.query('SELECT * FROM users');
await cache.set('users', result);
const cached = await cache.get('users');
```

### Plugin Lifecycle

```javascript
// Build system (installs all plugins)
await system.build();

// Use plugins
const db = system.find('database');
await db.query('...');

// Dispose system (cleans up all plugins)
await system.dispose();
```

## Hot Reloading

The plugin system supports hot reloading through the `reload()` method. This allows you to:
- Dispose all facets and reset built state
- Preserve hooks and configuration
- Add more hooks and rebuild
- Perfect for development and incremental plugin extension

### Basic Hot Reload

```javascript
// Initial build
const system = new StandalonePluginSystem('my-app');
await system.use(useDatabase).build();

// Hot reload - add more plugins
await system.reload();
await system.use(useCache).use(useAuth).build();

// All plugins (old + new) are now active
const db = system.find('database');  // From initial build
const cache = system.find('cache');   // Added after reload
const auth = system.find('auth');     // Added after reload
```

### What Gets Preserved

When you call `reload()`, the following are preserved:
- **Hooks**: All hooks in `system.hooks` array
- **Default Hooks**: All hooks in `system.defaultHooks`
- **Context**: Configuration and context object
- **Lifecycle Callbacks**: `onInit` and `onDispose` callbacks

### What Gets Cleaned

The following are disposed/reset:
- **All Facets**: All facets are disposed via their `onDispose` callbacks
- **Child Subsystems**: All child subsystems are disposed
- **Built State**: `_isBuilt` is reset to `false` (allows `use()` to work again)
- **Builder Cache**: Plan cache is invalidated (forces recalculation)

### Development Workflow

```javascript
const system = new StandalonePluginSystem('dev-app');

// Initial setup
await system.use(useDatabase).use(useLogger).build();

// During development, reload and add features
async function addFeature(hook) {
  await system.reload();
  await system.use(hook).build();
}

// Add new features incrementally
await addFeature(useCache);
await addFeature(useAuth);
await addFeature(useAPI);
```

### Hot Reload with Configuration Updates

```javascript
// Initial build with config
await system.use(useDatabase).build({ 
  config: { database: { host: 'localhost' } } 
});

// Reload and rebuild with new config
await system.reload();
await system.build({ 
  config: { database: { host: 'production.example.com' } } 
});
```

### Important Notes

- **Async Operation**: `reload()` is async and waits for any in-progress operations
- **No-op if Not Built**: If the system isn't built, `reload()` does nothing
- **Hook Preservation**: Existing hooks are preserved, allowing incremental extension
- **Full Rebuild**: After `reload()`, you must call `build()` again to activate plugins

## Configuration

### Plugin Configuration

Configure plugins via `config`:

```javascript
const system = new StandalonePluginSystem('app', {
  config: {
    database: {
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      user: 'user',
      password: 'pass'
    },
    cache: {
      maxSize: 1000,
      ttl: 3600
    },
    auth: {
      secret: 'my-secret-key',
      sessionTimeout: 3600
    }
  }
});
```

### Environment-Based Configuration

```javascript
const system = new StandalonePluginSystem('app', {
  config: {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'myapp'
    }
  },
  debug: process.env.DEBUG === 'true'
});
```

## Dependency Management

The plugin system automatically handles dependencies:

### Automatic Dependency Resolution

```javascript
// Plugin A (no dependencies)
export const useA = createHook({
  kind: 'a',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('a', { attach: true, source: import.meta.url })
      .add({ /* methods */ });
  }
});

// Plugin B (depends on A)
export const useB = createHook({
  kind: 'b',
  required: ['a'],  // Declare dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const aFacet = api.__facets.a;  // Available because of dependency
    
    return new Facet('b', { attach: true, source: import.meta.url })
      .add({
        doSomething() {
          // Use plugin A
          aFacet.someMethod();
        }
      });
  }
});

// Plugin C (depends on B, which depends on A)
export const useC = createHook({
  kind: 'c',
  required: ['b'],  // Only need to declare direct dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const bFacet = api.__facets.b;
    // Plugin A is also available (transitive dependency)
    
    return new Facet('c', { attach: true, source: import.meta.url })
      .add({ /* methods */ });
  }
});

// Register in any order - dependencies resolved automatically
const system = new StandalonePluginSystem('app', {});
system
  .use(useC)  // Registered first, but initialized last
  .use(useB)  // Registered second, initialized second
  .use(useA)  // Registered last, but initialized first
  .build();

// Initialization order: A → B → C
```

## Transaction Safety

The plugin system uses transactions to ensure atomic installation:

### Atomic Plugin Installation

```javascript
const system = new StandalonePluginSystem('app', {});

try {
  system
    .use(useDatabase)
    .use(useCache)  // Depends on database
    .use(useAuth)   // Depends on database
    .build();
  
  // All plugins installed successfully
} catch (error) {
  // If any plugin fails, all are rolled back
  console.error('Plugin installation failed:', error);
  // System is in clean state
}
```

### Transaction Benefits

- **All or Nothing**: Either all plugins install or none do
- **Automatic Rollback**: Failed installations are automatically cleaned up
- **Clean State**: System remains in a consistent state

## Lifecycle Management

### Build Lifecycle

```javascript
const system = new StandalonePluginSystem('app', {});

// 1. Register plugins
system
  .use(useDatabase)
  .use(useCache);

// 2. Register lifecycle callbacks
system
  .onInit((api, ctx) => {
    console.log('System initialized');
    // Post-build setup
  })
  .onDispose(() => {
    console.log('System disposing');
    // Cleanup
  });

// 3. Build (installs all plugins)
await system.build();

// 4. Use plugins
const db = system.find('database');

// 5. Dispose (cleans up all plugins)
await system.dispose();
```

### Plugin Lifecycle

Each plugin (facet) has its own lifecycle:

```javascript
export const usePlugin = createHook({
  kind: 'plugin',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('plugin', { attach: true, source: import.meta.url })
      .add({
        // Plugin methods
      })
      .onInit(async ({ ctx, api, subsystem, facet }) => {
        // Called during build
        // Initialize plugin resources
        this.initialized = true;
      })
      .onDispose(async () => {
        // Called during dispose
        // Clean up plugin resources
        this.initialized = false;
      });
  }
});
```

## Context Object

The context object (`ctx`) is passed to hooks and facets. For standalone systems:

```javascript
ctx = {
  ms: null,           // Message system (null for standalone)
  config: {           // Configuration object keyed by facet kind
    database: { /* ... */ },
    cache: { /* ... */ }
  },
  debug: false        // Debug flag
}
```

**Important:** The `ctx.ms` property is `null` for standalone systems. Your hooks and facets should not rely on it.

## Complete Example

### Full Standalone Plugin System

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Plugin: Logger
const useLogger = createHook({
  kind: 'logger',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.logger || {};
    
    return new Facet('logger', { attach: true, source: import.meta.url })
      .add({
        log(level, message) {
          console.log(`[${level}] ${message}`);
        },
        
        error(message) {
          this.log('ERROR', message);
        },
        
        info(message) {
          this.log('INFO', message);
        }
      })
      .onInit(async ({ ctx }) => {
        const config = ctx.config?.logger || {};
        this.level = config.level || 'INFO';
      });
  }
});

// Plugin: Storage (depends on logger)
const useStorage = createHook({
  kind: 'storage',
  required: ['logger'],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const loggerFacet = api.__facets.logger;
    
    return new Facet('storage', { attach: true, source: import.meta.url })
      .add({
        async save(key, value) {
          loggerFacet.info(`Saving ${key}`);
          // Save logic
        },
        
        async load(key) {
          loggerFacet.info(`Loading ${key}`);
          // Load logic
          return null;
        }
      });
  }
});

// Create and use plugin system
const system = new StandalonePluginSystem('my-app', {
  config: {
    logger: {
      level: 'DEBUG'
    }
  },
  debug: true
});

system
  .use(useLogger)
  .use(useStorage)
  .onInit((api, ctx) => {
    console.log('Plugin system ready');
  })
  .build();

// Use plugins
const logger = system.find('logger');
const storage = system.find('storage');

logger.info('Application started');
await storage.save('config', { setting: 'value' });

// Cleanup
await system.dispose();
```

## Best Practices

1. **Use StandalonePluginSystem**: Use `StandalonePluginSystem` for standalone systems - it handles all setup automatically.

2. **Message System is Optional**: The `ms` option is optional and can be `null` for standalone systems.

3. **Declare Dependencies**: Always declare dependencies in `required` array for proper initialization order.

4. **Use Configuration**: Pass plugin configuration via `config` object.

5. **Handle Errors**: Wrap `build()` in try-catch to handle plugin installation failures.

6. **Clean Up Resources**: Use `onDispose` callbacks to clean up plugin resources.

7. **Use Transactions**: The system automatically uses transactions - trust the atomicity.

8. **Test Plugins Independently**: Test plugins in isolation before integrating.

9. **Don't Rely on ctx.ms**: For standalone systems, `ctx.ms` is `null` - don't use it in your plugins.

## See Also

- [Hooks and Facets Overview](../core-concepts/HOOKS-AND-FACETS-OVERVIEW.md) - Core concepts
- [Hooks Documentation](../core-concepts/HOOKS.md) - Learn about creating plugins (hooks)
- [Facets Documentation](../core-concepts/FACETS.md) - Learn about plugin features (facets)
- [Facet Manager](../core-concepts/FACET-MANAGER.md) - Learn about plugin registry
- [Facet Manager Transaction](../core-concepts/FACET-MANAGER-TRANSACTION.md) - Learn about atomic plugin installation

