# Lifecycle Management Example

This example demonstrates how to properly manage plugin lifecycle using `onInit` and `onDispose` callbacks.

## Complete Example

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Plugin with resource management
export const useDatabase = createHook({
  kind: 'database',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    
    return new Facet('database', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      async query(sql, params = []) {
        if (!this.connection) {
          throw new Error('Database not connected');
        }
        console.log(`Query: ${sql}`, params);
        return { rows: [], count: 0 };
      },
      
      isConnected() {
        return !!this.connection;
      }
    })
    .onInit(async ({ ctx, api, subsystem }) => {
      // Initialize resources
      console.log('Initializing database connection...');
      
      // Simulate connection setup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.connection = {
        host: config.host || 'localhost',
        port: config.port || 5432,
        connected: true
      };
      
      console.log(`Connected to database at ${this.connection.host}:${this.connection.port}`);
    })
    .onDispose(async () => {
      // Cleanup resources
      if (this.connection) {
        console.log('Closing database connection...');
        this.connection.connected = false;
        this.connection = null;
        console.log('Database connection closed');
      }
    });
  }
});

// Plugin with async initialization
export const useCache = createHook({
  kind: 'cache',
  version: '1.0.0',
  required: ['database'],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const database = api.__facets.database;
    
    return new Facet('cache', {
      attach: true,
      required: ['database'],
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      get(key) {
        return this.store.get(key);
      },
      
      set(key, value) {
        this.store.set(key, value);
      },
      
      size() {
        return this.store.size;
      }
    })
    .onInit(async ({ ctx, api, subsystem }) => {
      // Access dependencies - they're guaranteed to be initialized
      const db = api.__facets.database;
      
      if (!db.isConnected()) {
        throw new Error('Database must be connected before cache initialization');
      }
      
      // Initialize cache
      console.log('Initializing cache...');
      this.store = new Map();
      
      // Pre-populate cache from database
      const result = await db.query('SELECT * FROM cache');
      for (const row of result.rows) {
        this.store.set(row.key, row.value);
      }
      
      console.log(`Cache initialized with ${this.store.size} entries`);
    })
    .onDispose(async () => {
      // Cleanup
      if (this.store) {
        console.log(`Cleaning up cache (${this.store.size} entries)...`);
        this.store.clear();
        this.store = null;
        console.log('Cache cleaned up');
      }
    });
  }
});

// Plugin with error handling in onInit
export const useLogger = createHook({
  kind: 'logger',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('logger', {
      attach: true,
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      log(message) {
        if (this.enabled) {
          console.log(`[LOG] ${message}`);
        }
      }
    })
    .onInit(async ({ ctx }) => {
      // Initialize with error handling
      try {
        const config = ctx.config?.logger || {};
        this.enabled = config.enabled !== false;
        this.level = config.level || 'info';
        
        // Simulate potential failure
        if (config.failInit) {
          throw new Error('Logger initialization failed');
        }
        
        console.log('Logger initialized');
      } catch (error) {
        // Errors in onInit cause the entire build to rollback
        console.error('Logger initialization error:', error);
        throw error;
      }
    })
    .onDispose(async () => {
      // Cleanup is called even if onInit fails (during rollback)
      console.log('Logger disposed');
      this.enabled = false;
    });
  }
});

// Create and use the system
async function main() {
  console.log('=== Example 1: Normal Lifecycle ===');
  
  const system1 = new StandalonePluginSystem('app1', {
    config: {
      database: {
        host: 'localhost',
        port: 5432
      },
      logger: {
        enabled: true,
        level: 'info'
      }
    }
  });

  await system1
    .use(useDatabase)
    .use(useCache)
    .use(useLogger)
    .build();

  const logger = system1.find('logger');
  logger.log('System is running');

  // Cleanup
  await system1.dispose();
  
  console.log('\n=== Example 2: Error Handling ===');
  
  const system2 = new StandalonePluginSystem('app2', {
    config: {
      logger: {
        failInit: true  // This will cause initialization to fail
      }
    }
  });

  try {
    await system2
      .use(useLogger)
      .build();
  } catch (error) {
    console.log('Build failed as expected:', error.message);
    // System is in clean state due to rollback
  }
  
  // No need to dispose - system was never built
}

main().catch(console.error);
```

## Explanation

### 1. onInit Callback

The `onInit` callback is called:
- **After** all dependencies are initialized
- **Before** the facet is available via `system.find()`
- **In dependency order** (dependencies first)

**Use `onInit` for:**
- Opening connections (database, network, files)
- Loading configuration
- Pre-populating data
- Validating setup

### 2. onDispose Callback

The `onDispose` callback is called:
- **When** `system.dispose()` is called
- **In reverse dependency order** (dependents first)
- **Even if** `onInit` failed (during rollback)

**Use `onDispose` for:**
- Closing connections
- Cleaning up resources
- Saving state
- Releasing memory

### 3. Error Handling

If `onInit` throws an error:
- The entire build is rolled back
- All successfully initialized facets are disposed
- The system remains in a clean state
- No partial system state

### 4. Accessing Dependencies in onInit

Dependencies are guaranteed to be initialized before `onInit` is called:

```javascript
.onInit(async ({ ctx, api, subsystem }) => {
  const db = api.__facets.database;  // ✅ Always available
  // ...
})
```

## Expected Output

```
=== Example 1: Normal Lifecycle ===
Initializing database connection...
Connected to database at localhost:5432
Initializing cache...
Query: SELECT * FROM cache
Cache initialized with 0 entries
Logger initialized
[LOG] System is running
Cleaning up cache (0 entries)...
Cache cleaned up
Logger disposed
Closing database connection...
Database connection closed

=== Example 2: Error Handling ===
Logger initialization error: Error: Logger initialization failed
Build failed as expected: Logger initialization failed
Logger disposed
```

## Key Points

1. **Always clean up resources** in `onDispose`
2. **Handle errors** in `onInit` - they cause rollback
3. **Dependencies are available** in `onInit`
4. **Disposal order** is reverse of initialization order
5. **Rollback is automatic** if any `onInit` fails

## Next Steps

- Add timeout handling for long-running initialization
- Implement health checks using lifecycle callbacks
- Create plugins with complex resource dependencies
- Handle partial failures gracefully

