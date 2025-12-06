# Hook Function Subsystem Parameter

## Overview

The `subsystem` parameter is the third argument passed to hook functions and facet lifecycle callbacks. It provides access to the system instance itself, including its `find()` method for accessing facets.

The subsystem is passed to:
- **Hook functions** as the third parameter: `fn: (ctx, api, subsystem) => { ... }`
- **Facet lifecycle callbacks** as part of the parameters object: `onInit(({ ctx, api, subsystem, facet }) => { ... })`

## Subsystem Parameter

The `subsystem` parameter is an instance of `BaseSubsystem` or `StandalonePluginSystem`. For hooks and facets, the most important method is `find()`, which allows you to access other facets.

### `find(kind)` Method

The `find()` method is the primary way to access facets from within facet methods. It provides a convenient way to look up facets by their kind identifier.

**Signature:**
```javascript
subsystem.find(kind) => Facet | undefined
```

**Parameters:**
- `kind` (string, required) - The facet kind identifier (e.g., 'database', 'cache', 'logger')

**Returns:**
- `Facet | undefined` - The facet instance if found, or `undefined` if not found

**Usage:**
```javascript
// In hook function
fn: (ctx, api, subsystem) => {
  // Access a facet using subsystem.find()
  const databaseFacet = subsystem.find('database');
  
  if (databaseFacet) {
    // Use the facet
    const status = databaseFacet.getStatus();
  }
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}

// In facet methods
.add({
  processData(data) {
    // Check for optional facet
    const loggerFacet = subsystem.find('logger');
    if (loggerFacet) {
      loggerFacet.log('Processing data');
    }
    
    // Process data...
  }
})
```

## Using `subsystem.find()` in Facet Methods

The `subsystem.find()` method is particularly useful when writing facet methods that need to access other facets. This is especially important for optional facets that might be installed later.

### Pattern: Accessing Facets in Facet Methods

When writing methods for your facet, you can use `subsystem.find()` to access other facets:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useCustom = createHook({
  kind: 'custom',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('custom', { attach: true, source: import.meta.url })
      .add({
        // Method that uses subsystem.find() to access other facets
        processWithLogging(data) {
          // Find logger facet
          const loggerFacet = subsystem.find('logger');
          
          if (loggerFacet) {
            // Log before processing
            loggerFacet.log('processing-started');
          }
          
          // Process data
          const result = this.processData(data);
          
          if (loggerFacet) {
            // Log after processing
            loggerFacet.log('processing-completed');
          }
          
          return result;
        },
        
        processData(data) {
          // Core processing logic
          return { processed: data };
        }
      });
  }
});
```

### Pattern: Optional Facet Integration

Use `subsystem.find()` to integrate with optional facets that might not be installed:

```javascript
export const useDatabase = createHook({
  kind: 'database',
  required: ['logger'],  // Required dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required facet during hook execution
    const loggerFacet = api.__facets.logger;
    
    const connection = new DatabaseConnection({
      onQuery: () => {
        loggerFacet.log('Query executed');
      }
    });
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          return connection.query(sql);
        },
        
        // Optional feature - check at call time
        enableCaching() {
          // Use subsystem.find() to check for optional cache facet
          const cacheFacet = subsystem.find('cache');
          
          if (cacheFacet) {
            cacheFacet.enableForDatabase(this);
            return true;
          }
          
          return false;  // Cache facet not available
        },
        
        // Another optional integration
        recordEvent(event) {
          // Check for optional monitoring facet
          const monitoringFacet = subsystem.find('monitoring');
          if (monitoringFacet) {
            monitoringFacet.recordEvent('database', event);
          }
        }
      });
  }
});
```

### Pattern: Cross-Facet Communication

Facets can communicate with each other using `subsystem.find()`:

```javascript
export const useProcessor = createHook({
  kind: 'processor',
  required: ['database', 'cache'],  // Required dependencies
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required facets during hook execution
    const databaseFacet = api.__facets.database;
    const cacheFacet = api.__facets.cache;
    
    return new Facet('processor', { attach: true, source: import.meta.url })
      .add({
        async processData(data) {
          // Use required facets (already available)
          const cached = cacheFacet.get(data.id);
          if (cached) {
            return cached;
          }
          
          // Use subsystem.find() for optional facets in methods
          const loggerFacet = subsystem.find('logger');
          if (loggerFacet) {
            loggerFacet.log('Processing data');
          }
          
          // Process data
          const result = await databaseFacet.query(`SELECT * FROM data WHERE id = ${data.id}`);
          
          // Store in cache
          cacheFacet.set(data.id, result);
          
          return result;
        },
        
        async processBatch(items) {
          // Access multiple facets using subsystem.find()
          const loggerFacet = subsystem.find('logger');
          const monitoringFacet = subsystem.find('monitoring');
          
          const results = [];
          for (const item of items) {
            const result = await this.processData(item);
            results.push(result);
            
            // Notify monitoring if available
            if (monitoringFacet) {
              monitoringFacet.recordEvent('item-processed', { item, result });
            }
          }
          
          // Log batch completion if logger available
          if (loggerFacet) {
            loggerFacet.log(`Processed ${items.length} items`);
          }
          
          return results;
        }
      });
  }
});
```

### Pattern: Conditional Feature Based on Available Facets

Use `subsystem.find()` to conditionally enable features based on available facets:

```javascript
export const useAdaptiveFeature = createHook({
  kind: 'adaptive-feature',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('adaptive-feature', { attach: true, source: import.meta.url })
      .add({
        // Core method - always available
        getStatus() {
          return { enabled: true };
        },
        
        // Method that adapts based on available facets
        processWithEnhancements(data) {
          // Check for optional enhancement facets
          const cacheFacet = subsystem.find('cache');
          const loggerFacet = subsystem.find('logger');
          const monitoringFacet = subsystem.find('monitoring');
          
          // Use cache if available
          if (cacheFacet) {
            const cached = cacheFacet.get(data.id);
            if (cached) {
              return cached;
            }
          }
          
          // Log start if logger available
          if (loggerFacet) {
            loggerFacet.log('processing-started');
          }
          
          // Process data
          const result = this.process(data);
          
          // Store in cache if available
          if (cacheFacet) {
            cacheFacet.set(data.id, result);
          }
          
          // Log completion if logger available
          if (loggerFacet) {
            loggerFacet.log('processing-completed');
          }
          
          // Notify monitoring if available
          if (monitoringFacet) {
            monitoringFacet.recordMetric('processing-time', result.duration);
          }
          
          return result;
        },
        
        process(data) {
          // Core processing logic
          return { processed: data };
        }
      });
  }
});
```

### Pattern: Facet Discovery and Integration

Use `subsystem.find()` to discover and integrate with facets dynamically:

```javascript
export const useIntegrator = createHook({
  kind: 'integrator',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('integrator', { attach: true, source: import.meta.url })
      .add({
        // Discover and integrate facets when method is called
        integrate() {
          const integrations = [];
          
          // Check for various facets using subsystem.find()
          const databaseFacet = subsystem.find('database');
          const loggerFacet = subsystem.find('logger');
          const cacheFacet = subsystem.find('cache');
          const monitoringFacet = subsystem.find('monitoring');
          
          // Integrate database with cache if both available
          if (databaseFacet && cacheFacet) {
            integrations.push({
              type: 'database-cache',
              setup: () => {
                // Set up integration
                databaseFacet.onQuery((query) => {
                  cacheFacet.invalidate('database');
                });
              }
            });
          }
          
          // Integrate with monitoring if available
          if (monitoringFacet && loggerFacet) {
            integrations.push({
              type: 'monitoring-logger',
              setup: () => {
                monitoringFacet.onEvent((event) => {
                  loggerFacet.log(`Monitoring: ${event}`);
                });
              }
            });
          }
          
          // Setup all discovered integrations
          integrations.forEach(integration => integration.setup());
          
          return integrations;
        },
        
        // Check if specific integration is possible
        canIntegrateDatabaseCache() {
          return subsystem.find('database') && subsystem.find('cache');
        }
      });
  }
});
```

## When to Use `subsystem.find()`

### Use `subsystem.find()` When:

1. **Accessing facets in facet methods**: When writing methods for your facet that need to access other facets
2. **Optional facets**: For facets that might not be installed or might be installed later
3. **Runtime facet discovery**: When you need to check for facets at method call time rather than during hook execution
4. **Graceful degradation**: When you want your facet to work even if optional dependencies are missing
5. **Dynamic integration**: When integrating with facets that may be added dynamically

### Don't Use `subsystem.find()` When:

1. **Required dependencies during hook execution**: Use `api.__facets['facet-name']` for required dependencies (declared in `required` array)
2. **Initialization logic**: Use `api.__facets` during hook execution for setup that needs to happen immediately
3. **Performance-critical paths**: If you're calling a method frequently, consider storing the facet reference in closure instead of calling `find()` repeatedly

## Best Practices

1. **Check for existence**: Always check if `subsystem.find()` returns a facet before using it:
   ```javascript
   const loggerFacet = subsystem.find('logger');
   if (loggerFacet) {
     loggerFacet.log('something');
   }
   ```

2. **Use for optional facets**: Prefer `subsystem.find()` for optional facets that might not be installed:
   ```javascript
   // In facet method
   enableFeature() {
     const cacheFacet = subsystem.find('cache');
     if (cacheFacet) {
       cacheFacet.enable();
       return true;
     }
     return false;
   }
   ```

3. **Cache frequently-used facets**: If you use a facet frequently in a method, cache the result:
   ```javascript
   processMany(items) {
     const loggerFacet = subsystem.find('logger');
     
     // Cache the reference for reuse in the loop
     if (loggerFacet) {
       for (const item of items) {
         this.process(item);
         loggerFacet.log(`Processed: ${item.id}`);
       }
     } else {
       // Process without logging
       for (const item of items) {
         this.process(item);
       }
     }
   }
   ```

4. **Combine with required facets**: You can combine `api.__facets` for required facets with `subsystem.find()` for optional ones:
   ```javascript
   fn: (ctx, api, subsystem) => {
     // Required facet - access during hook execution
     const databaseFacet = api.__facets.database;
     
     return new Facet('custom', { attach: true, source: import.meta.url })
       .add({
         process() {
           // Use required facet
           const data = databaseFacet.query('SELECT * FROM data');
           
           // Check for optional facet
           const loggerFacet = subsystem.find('logger');
           if (loggerFacet) {
             loggerFacet.log('Data processed');
           }
           
           return data;
         }
       });
   }
   ```

5. **Document optional dependencies**: If your facet methods use `subsystem.find()` for optional facets, document which facets are optional:
   ```javascript
   /**
    * Process data with optional logging
    * 
    * Optional dependencies:
    * - logger: If available, logs processing events
    * - monitoring: If available, records processing metrics
    */
   async processData(data) {
     const loggerFacet = subsystem.find('logger');
     const monitoringFacet = subsystem.find('monitoring');
     
     // Process data...
   }
   ```

## Common Patterns

### Pattern: Optional Enhancement

```javascript
.add({
  process(data) {
    // Core processing
    const result = this.coreProcess(data);
    
    // Optional enhancement - check if available
    const cacheFacet = subsystem.find('cache');
    if (cacheFacet) {
      cacheFacet.set(data.id, result);
    }
    
    return result;
  },
  
  coreProcess(data) {
    // Core logic
    return { processed: data };
  }
})
```

### Pattern: Feature Flag Based on Facet Availability

```javascript
.add({
  hasFeature(featureName) {
    const featureMap = {
      caching: () => subsystem.find('cache') !== undefined,
      logging: () => subsystem.find('logger') !== undefined,
      monitoring: () => subsystem.find('monitoring') !== undefined
    };
    
    const checker = featureMap[featureName];
    return checker ? checker() : false;
  },
  
  processWithFeatures(data) {
    if (this.hasFeature('caching')) {
      const cacheFacet = subsystem.find('cache');
      const cached = cacheFacet.get(data.id);
      if (cached) return cached;
    }
    
    const result = this.process(data);
    
    if (this.hasFeature('caching')) {
      subsystem.find('cache').set(data.id, result);
    }
    
    return result;
  }
})
```

### Pattern: Facet Proxy

```javascript
.add({
  // Proxy method that delegates to another facet if available
  getMetrics() {
    const monitoringFacet = subsystem.find('monitoring');
    
    if (monitoringFacet) {
      // Delegate to monitoring facet
      return monitoringFacet.getMetrics();
    }
    
    // Fallback: return basic metrics
    return {
      processed: 0,
      errors: 0
    };
  }
})
```

## Comparison: `api.__facets` vs `subsystem.find()`

| Aspect | `api.__facets['kind']` | `subsystem.find('kind')` |
|--------|------------------------|--------------------------|
| **When to use** | During hook execution | In facet methods |
| **Best for** | Required dependencies | Optional dependencies |
| **Timing** | At build time | At runtime (method call time) |
| **Performance** | Faster (direct access) | Slightly slower (method call) |
| **Flexibility** | Fixed at build time | Dynamic (works for facets installed later) |
| **Error handling** | Throws if not found (unless optional chaining) | Returns `undefined` if not found |

**Example combining both:**
```javascript
fn: (ctx, api, subsystem) => {
  // Required facet - use api.__facets during hook execution
  const databaseFacet = api.__facets.database;
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({
      process() {
        // Use required facet (from closure)
        const data = databaseFacet.query('SELECT * FROM data');
        
        // Optional facet - use subsystem.find() in method
        const loggerFacet = subsystem.find('logger');
        if (loggerFacet) {
          loggerFacet.log('Data processed');
        }
        
        return data;
      }
    });
}
```

## See Also

- [Hooks Documentation](../core-concepts/HOOKS.md) - Complete guide to creating hooks and how they use the subsystem parameter
- [Hook Function Context](./HOOK-FUNCTION-CONTEXT.md) - Learn about the `ctx` parameter
- [Hook Function API Parameter](./HOOK-FUNCTION-API-PARAM.md) - Learn about the `api` parameter and `api.__facets`
- [Facets Documentation](../core-concepts/FACETS.md) - Understand how facets work and use the subsystem parameter
- [Facet Manager](../core-concepts/FACET-MANAGER.md) - Learn about FacetManager and facet access
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how the subsystem parameter is used in standalone systems

