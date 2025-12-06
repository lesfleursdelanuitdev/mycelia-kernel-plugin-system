# Hook Function API Parameter

## Overview

The `api` parameter is the second argument passed to hook functions and facet lifecycle callbacks. It provides access to the system's API, including the system name and the FacetManager for accessing other facets.

The API is passed to:
- **Hook functions** as the second parameter: `fn: (ctx, api, subsystem) => { ... }`
- **Facet lifecycle callbacks** as part of the parameters object: `onInit(({ ctx, api, subsystem, facet }) => { ... })`

## API Structure

The API object has the following structure:

```javascript
api = {
  name: string,              // System name
  __facets: FacetManager     // FacetManager instance for accessing facets
}
```

## API Properties

### `name` (string, required)

The unique name of the system. This is useful for logging, debugging, and creating system-specific resources.

**Usage in Hook Functions:**
```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useDatabase = createHook({
  kind: 'database',
  fn: (ctx, api, subsystem) => {
    // Access system name
    const systemName = api.name;
    console.log(`Initializing database for ${systemName}`);
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({ /* methods */ });
  }
});
```

**Usage in Lifecycle Callbacks:**
```javascript
.onInit(({ api, subsystem }) => {
  console.log(`Facet initialized for system: ${api.name}`);
})
```

### `__facets` (FacetManager, required)

A reference to the FacetManager instance that manages all facets for this system. This is the primary way to access other facets during hook execution.

**Important:** During hook execution, not all facets may be registered yet. Facets are registered in dependency order, so you can only access facets that:
1. Have already been registered (earlier in the build process)
2. Are declared as dependencies in your hook's `required` array

**Usage:**
```javascript
// Access a facet
const databaseFacet = api.__facets.database;

// With optional chaining (for optional dependencies)
const cacheFacet = api.__facets?.cache;
```

## Accessing Other Facets

The `api.__facets` property provides access to the FacetManager, which allows you to find and interact with other facets during hook execution.

### Direct Access Pattern

The simplest way to access a facet is through direct property access:

```javascript
fn: (ctx, api, subsystem) => {
  // Access a required facet
  const databaseFacet = api.__facets.database;
  
  // Use the facet
  const status = databaseFacet.getStatus();
  
  return new Facet('cache', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}
```

### Optional Access Pattern

For optional dependencies, use optional chaining to safely access facets that may not exist:

```javascript
fn: (ctx, api, subsystem) => {
  // Optional facet - may not be installed
  const loggerFacet = api.__facets?.logger;
  
  // Check if facet exists before using
  if (loggerFacet) {
    loggerFacet.log('hook-executed');
  }
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}
```

### Using FacetManager Methods

You can also use FacetManager methods for more control:

```javascript
fn: (ctx, api, subsystem) => {
  // Using find() method
  const databaseFacet = api.__facets.find('database');
  
  // Using has() method to check existence
  if (api.__facets.has('logger')) {
    const loggerFacet = api.__facets.find('logger');
    // Use logger facet
  }
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}
```

## Checking if Facets are Installed

### Pattern: Deferred Facet Access

For optional facets that might be installed later (after the system is built), you can defer checking for them until they're actually needed. Instead of accessing facets during hook execution, check for them in your facet's methods using `subsystem.find(kind)`:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useCustom = createHook({
  kind: 'custom',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Don't access optional facets here - they might not be installed yet
    
    return new Facet('custom', { attach: true, source: import.meta.url })
      .add({
        // Check for optional facet when method is called
        recordEvent(event) {
          // Check if logger facet is available now
          const loggerFacet = subsystem.find('logger');
          if (loggerFacet) {
            loggerFacet.log(event);
          }
        },
        
        notifyListeners(message) {
          // Check if listeners facet is available now
          const listenersFacet = subsystem.find('listeners');
          if (listenersFacet) {
            listenersFacet.notify(message);
          }
        }
      });
  }
});
```

**Benefits:**
- Works even if the facet is installed after the system is built
- Lazy evaluation - only checks when the method is called
- No need to store facet references in closure
- More flexible for dynamic facet installation

**When to use:**
- Optional facets that might be added later
- Features that should gracefully degrade if facet is missing
- Methods that are called infrequently (lazy checking is acceptable)

### Pattern: Conditional Feature Based on Facet Availability

This pattern allows your hook to provide different functionality based on which facets are available during hook execution:

```javascript
export const useCustom = createHook({
  kind: 'custom',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Check if optional facets are available
    const hasLogger = api.__facets?.has('logger');
    const hasCache = api.__facets?.has('cache');
    
    // Build feature set based on available facets
    const features = {
      logging: hasLogger,
      caching: hasCache
    };
    
    return new Facet('custom', { attach: true, source: import.meta.url })
      .add({
        // Conditionally expose methods based on available facets
        recordEvent(event) {
          if (features.logging) {
            const loggerFacet = api.__facets.find('logger');
            loggerFacet.log(event);
          }
        },
        
        cacheData(key, value) {
          if (features.caching) {
            const cacheFacet = api.__facets.find('cache');
            cacheFacet.set(key, value);
          }
        }
      });
  }
});
```

### Pattern: Graceful Degradation with Deferred Checking

This pattern provides fallback behavior when optional facets are not available, checking at method call time:

```javascript
export const useEnhancedCache = createHook({
  kind: 'enhanced-cache',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const cacheStore = new Map();
    
    return new Facet('enhanced-cache', { attach: true, source: import.meta.url })
      .add({
        get(key) {
          return cacheStore.get(key);
        },
        
        set(key, value) {
          cacheStore.set(key, value);
          
          // Check for logger facet at call time (might be installed later)
          const loggerFacet = subsystem.find('logger');
          if (loggerFacet) {
            loggerFacet.log(`Cache set: ${key}`);
          } else {
            // Fallback: just log to console
            console.log(`Cache set: ${key}`);
          }
        }
      });
  }
});
```

## Deferred vs Immediate Facet Access

### When to Access Facets During Hook Execution

Access facets through `api.__facets` during hook execution when:
- The facet is a **required dependency** (declared in `required` array)
- You need the facet reference **immediately** to configure your facet
- The facet is used in **initialization logic** (onInit callbacks)
- You want to **fail fast** if the facet is missing

**Example:**
```javascript
export const useCache = createHook({
  kind: 'cache',
  required: ['database', 'logger'],  // Required - safe to access immediately
  fn: (ctx, api, subsystem) => {
    // Safe to access - guaranteed to exist
    const databaseFacet = api.__facets.database;
    const loggerFacet = api.__facets.logger;
    
    const cache = new Cache({
      database: databaseFacet,
      logger: loggerFacet
    });
    
    return new Facet('cache', { attach: true, source: import.meta.url })
      .add({ /* methods */ });
  }
});
```

### When to Defer Facet Access

Use `subsystem.find(kind)` in your facet's methods when:
- The facet is **optional** and might not be installed yet
- The facet might be **installed later** (after system build)
- You want **graceful degradation** if the facet is missing
- The facet is only needed **occasionally** (lazy checking is acceptable)

**Example:**
```javascript
export const useCustom = createHook({
  kind: 'custom',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Don't access optional facets here
    
    return new Facet('custom', { attach: true, source: import.meta.url })
      .add({
        // Check for optional facet when method is called
        logEvent(event) {
          const loggerFacet = subsystem.find('logger');
          if (loggerFacet) {
            loggerFacet.log(event);
          }
          // Continue even if logger facet is missing
        }
      });
  }
});
```

### Hybrid Approach

You can combine both approaches - access required facets immediately, and check for optional facets later:

```javascript
export const useHybrid = createHook({
  kind: 'hybrid',
  required: ['database'],  // Required dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required facet immediately
    const databaseFacet = api.__facets.database;
    
    return new Facet('hybrid', { attach: true, source: import.meta.url })
      .add({
        processData(data) {
          // Use required facet (already available)
          await databaseFacet.save(data);
          
          // Check for optional facet when needed
          const loggerFacet = subsystem.find('logger');
          if (loggerFacet) {
            loggerFacet.log('Data processed');
          }
          
          return data;
        }
      });
  }
});
```

## Common Use Cases

### Use Case: Accessing Required Dependencies

When your hook declares dependencies in the `required` array, those facets are guaranteed to be available:

```javascript
export const useCache = createHook({
  kind: 'cache',
  required: ['database', 'logger'],  // Declared dependencies
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // These facets are guaranteed to exist
    const databaseFacet = api.__facets.database;
    const loggerFacet = api.__facets.logger;
    
    // Use the facets
    const cache = new Cache({
      database: databaseFacet,
      logger: loggerFacet
    });
    
    return new Facet('cache', { attach: true, source: import.meta.url })
      .add({ /* methods */ });
  }
});
```

### Use Case: Accessing Optional Dependencies (During Hook Execution)

For optional dependencies that are available during hook execution, use optional chaining and existence checks:

```javascript
export const useDatabase = createHook({
  kind: 'database',
  required: ['logger'],  // Required
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Required facet (guaranteed to exist)
    const loggerFacet = api.__facets.logger;
    
    // Optional facet (may not exist)
    const cacheFacet = api.__facets?.cache;
    
    const connection = new DatabaseConnection({
      onQuery: (query) => {
        // Use required facet
        loggerFacet.log(`Query: ${query}`);
        
        // Use optional facet if available
        if (cacheFacet) {
          cacheFacet.invalidate('database');
        }
      }
    });
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({ /* methods */ });
  }
});
```

### Use Case: Optional Dependencies Installed Later

For optional dependencies that might be installed after the system is built, check for them in your facet's methods using `subsystem.find(kind)`:

```javascript
export const useDatabase = createHook({
  kind: 'database',
  required: ['logger'],  // Required
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required facet
    const loggerFacet = api.__facets.logger;
    
    const connection = new DatabaseConnection({
      onQuery: (query) => {
        loggerFacet.log(`Query: ${query}`);
      }
    });
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          return connection.query(sql);
        },
        
        // Optional feature - check at call time
        enableCaching() {
          // Check if cache facet is available now (might be installed later)
          const cacheFacet = subsystem.find('cache');
          if (cacheFacet) {
            cacheFacet.enableForDatabase(this);
            return true;
          }
          return false;  // Cache not available
        },
        
        // Another optional feature
        recordEvent(event) {
          // Check for optional monitoring facet at call time
          const monitoringFacet = subsystem.find('monitoring');
          if (monitoringFacet) {
            monitoringFacet.recordEvent('database', event);
          }
        }
      });
  }
});
```

### Use Case: Cross-Facet Communication

Facets can communicate with each other through the API:

```javascript
export const useProcessor = createHook({
  kind: 'processor',
  required: ['database', 'cache', 'logger'],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access multiple facets
    const databaseFacet = api.__facets.database;
    const cacheFacet = api.__facets.cache;
    const loggerFacet = api.__facets.logger;
    
    return new Facet('processor', { attach: true, source: import.meta.url })
      .add({
        async processData(data) {
          // Use cache to check if data exists
          const cached = cacheFacet.get(data.id);
          if (cached) {
            return cached;
          }
          
          // Use database to fetch data
          const result = await databaseFacet.query(`SELECT * FROM data WHERE id = ${data.id}`);
          
          // Use logger to log
          loggerFacet.log(`Processed: ${data.id}`);
          
          // Store in cache
          cacheFacet.set(data.id, result);
          
          return result;
        }
      });
  }
});
```

## Best Practices

1. **Use `required` array for dependencies**: Always declare required facets in the hook's `required` array. This ensures they're available and initialized before your hook runs.

2. **Access required facets immediately**: For required dependencies, access them during hook execution through `api.__facets['facet-name']`.

3. **Defer optional facet access**: For optional facets that might be installed later, use `subsystem.find(kind)` in your facet's methods instead of accessing them during hook execution.

4. **Use optional chaining for optional facets during hook execution**: When accessing optional facets during hook execution, use `api.__facets?.['facet-name']` to safely handle cases where the facet doesn't exist.

5. **Check existence before use**: Always verify optional facets exist before calling their methods:
   ```javascript
   // During hook execution
   const loggerFacet = api.__facets?.logger;
   if (loggerFacet) {
     loggerFacet.log('something');
   }
   
   // Or in facet methods (for facets installed later)
   logEvent(event) {
     const loggerFacet = subsystem.find('logger');
     if (loggerFacet) {
       loggerFacet.log(event);
     }
   }
   ```

6. **Use FacetManager methods for complex logic**: For more complex facet discovery, use `api.__facets.has()` and `api.__facets.find()` methods.

7. **Don't access facets during hook execution that aren't dependencies**: Only access facets during hook execution that are:
   - Declared in your `required` array
   - Already registered (earlier in the build order)
   - Truly optional (with proper existence checks)

8. **Store facet references in closure for required facets**: If you need to use required facets in methods added to your facet, store references in the hook's closure:
   ```javascript
   fn: (ctx, api, subsystem) => {
     const databaseFacet = api.__facets.database;  // Required
     
     return new Facet('cache', { attach: true, source: import.meta.url })
       .add({
         get(key) {
           // Use databaseFacet from closure
           const value = databaseFacet.query(`SELECT * FROM cache WHERE key = '${key}'`);
           // ...
         }
       });
   }
   ```

9. **Use `subsystem.find()` for optional facets in methods**: For optional facets that might be installed later, check for them in your facet's methods:
   ```javascript
   fn: (ctx, api, subsystem) => {
     return new Facet('custom', { attach: true, source: import.meta.url })
       .add({
         logEvent(event) {
           // Check for optional facet at call time
           const loggerFacet = subsystem.find('logger');
           if (loggerFacet) {
             loggerFacet.log(event);
           }
         }
       });
   }
   ```

## Common Patterns

### Pattern: Facet Discovery and Integration

```javascript
export const useIntegrator = createHook({
  kind: 'integrator',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Discover available facets
    const availableFacets = {
      database: api.__facets?.database,
      cache: api.__facets?.cache,
      logger: api.__facets?.logger
    };
    
    // Build integration based on what's available
    const integrations = [];
    
    if (availableFacets.database && availableFacets.cache) {
      integrations.push({
        type: 'database-cache',
        setup: () => {
          // Integrate database with cache
        }
      });
    }
    
    return new Facet('integrator', { attach: true, source: import.meta.url })
      .add({
        getIntegrations() {
          return integrations;
        },
        
        setupAll() {
          integrations.forEach(integration => integration.setup());
        }
      });
  }
});
```

## See Also

- [Hooks Documentation](../core-concepts/HOOKS.md) - Complete guide to creating hooks and how they use the API parameter
- [Hook Function Context](./HOOK-FUNCTION-CONTEXT.md) - Learn about the `ctx` parameter
- [Hook Function Subsystem Parameter](./HOOK-FUNCTION-SUBSYSTEM-PARAM.md) - Learn about the `subsystem` parameter and using `find()` in facet methods
- [Facets Documentation](../core-concepts/FACETS.md) - Understand how facets work and use the API
- [Facet Manager](../core-concepts/FACET-MANAGER.md) - Learn about FacetManager and how to access facets
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how the API is used in standalone systems

