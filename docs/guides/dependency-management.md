# Dependency Management Guide

This guide explains how to manage plugin dependencies effectively.

## Understanding Dependencies

Dependencies in Mycelia Plugin System are:
- **Explicit**: Declared in hook metadata
- **Automatic**: Resolved and initialized in correct order
- **Type-safe**: Validated at build time

## Declaring Dependencies

### Required Dependencies

Declare dependencies that your plugin **must have**:

```javascript
export const useCache = createHook({
  kind: 'cache',
  required: ['database', 'logger'],  // Required dependencies
  fn: (ctx, api, subsystem) => {
    // Dependencies are guaranteed to be available
    const database = api.__facets.database;
    const logger = api.__facets.logger;
    
    // ...
  }
});
```

### Optional Dependencies

For optional dependencies, don't declare them in `required`:

```javascript
export const useCache = createHook({
  kind: 'cache',
  // No 'required' - logger is optional
  fn: (ctx, api, subsystem) => {
    // Try to get logger, but handle if it doesn't exist
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

## Dependency Resolution

The system automatically:
1. **Builds a dependency graph** from all hooks
2. **Detects cycles** and reports errors
3. **Topologically sorts** dependencies
4. **Initializes in order** (dependencies first)

### Example: Dependency Chain

```javascript
// Plugin A: No dependencies
export const useDatabase = createHook({
  kind: 'database',
  // No required dependencies
  // ...
});

// Plugin B: Depends on A
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],  // Depends on database
  // ...
});

// Plugin C: Depends on A and B
export const useAPI = createHook({
  kind: 'api',
  required: ['database', 'cache'],  // Depends on both
  // ...
});
```

**Initialization Order:**
1. `database` (no dependencies)
2. `cache` (depends on database)
3. `api` (depends on database and cache)

## Accessing Dependencies

### During Hook Execution

Use `api.__facets` to access required dependencies:

```javascript
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],
  fn: (ctx, api, subsystem) => {
    // ✅ Required dependencies are available
    const database = api.__facets.database;
    
    // ...
  }
});
```

### During Facet Methods

Use `subsystem.find()` for optional or dynamically installed dependencies:

```javascript
export const useCache = createHook({
  kind: 'cache',
  fn: (ctx, api, subsystem) => {
    return new Facet('cache', {
      attach: true
    })
    .add({
      async get(key) {
        // Optional dependency
        const logger = subsystem.find('logger');
        if (logger) {
          logger.log(`Cache get: ${key}`);
        }
        
        return this.store.get(key);
      }
    });
  }
});
```

### In Lifecycle Callbacks

Both `api.__facets` and `subsystem.find()` work in lifecycle callbacks:

```javascript
.onInit(async ({ ctx, api, subsystem }) => {
  // Required dependency
  const database = api.__facets.database;
  
  // Optional dependency
  const logger = subsystem.find('logger');
  
  // Use dependencies...
})
```

## Common Patterns

### Pattern 1: Dependency Chain

```javascript
// A → B → C
useA  // No dependencies
useB  // Depends on A
useC  // Depends on B (and transitively on A)
```

### Pattern 2: Multiple Dependencies

```javascript
// C depends on both A and B
useA  // No dependencies
useB  // No dependencies
useC  // Depends on A and B
```

### Pattern 3: Shared Dependencies

```javascript
// Both B and C depend on A
useA  // No dependencies
useB  // Depends on A
useC  // Depends on A
```

### Pattern 4: Optional Dependencies

```javascript
// B optionally uses A
useA  // No dependencies
useB  // No required dependencies, but uses A if available
```

## Avoiding Common Pitfalls

### ❌ Don't: Circular Dependencies

```javascript
// This will fail!
export const useA = createHook({
  kind: 'a',
  required: ['b'],  // A depends on B
  // ...
});

export const useB = createHook({
  kind: 'b',
  required: ['a'],  // B depends on A - CIRCULAR!
  // ...
});
```

**Solution:** Refactor to break the cycle:

```javascript
// Extract shared functionality
export const useShared = createHook({
  kind: 'shared',
  // No dependencies
  // ...
});

export const useA = createHook({
  kind: 'a',
  required: ['shared'],
  // ...
});

export const useB = createHook({
  kind: 'b',
  required: ['shared'],
  // ...
});
```

### ❌ Don't: Missing Dependencies

```javascript
// This will fail if 'database' is not registered!
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],
  // ...
});

// Make sure database is registered:
system.use(useDatabase).use(useCache).build();
```

**Solution:** Always register all required dependencies:

```javascript
system
  .use(useDatabase)  // ✅ Register dependency first
  .use(useCache)
  .build();
```

### ❌ Don't: Accessing Dependencies Incorrectly

```javascript
// ❌ Wrong: Don't access in hook function before checking
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],
  fn: (ctx, api, subsystem) => {
    // ❌ Don't do this - database might not be initialized yet
    const db = subsystem.find('database');
    db.query('SELECT 1');
  }
});

// ✅ Correct: Access via api.__facets
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],
  fn: (ctx, api, subsystem) => {
    // ✅ Correct: Required dependencies are available
    const db = api.__facets.database;
    // Use db in facet methods, not here
  }
});
```

## Best Practices

### 1. Declare All Required Dependencies

```javascript
// ✅ Good: Explicit dependencies
export const useCache = createHook({
  kind: 'cache',
  required: ['database', 'logger'],
  // ...
});
```

### 2. Use Optional Dependencies Sparingly

```javascript
// ✅ Good: Only when truly optional
export const useCache = createHook({
  kind: 'cache',
  // No required - logger is optional
  fn: (ctx, api, subsystem) => {
    const logger = subsystem.find('logger');
    // Handle logger being undefined
  }
});
```

### 3. Keep Dependency Chains Short

```javascript
// ✅ Good: Short chain
A → B → C

// ❌ Avoid: Long chain
A → B → C → D → E → F
```

### 4. Document Dependencies

```javascript
/**
 * Cache plugin
 * 
 * Dependencies:
 * - database (required): For persistence
 * - logger (optional): For logging cache operations
 */
export const useCache = createHook({
  // ...
});
```

## Debugging Dependencies

### Check Dependency Graph

The system automatically validates dependencies. If there's an issue, you'll get a clear error:

```
Error: Circular dependency detected: a → b → a
```

### Verify Dependencies Are Available

```javascript
// In your plugin
fn: (ctx, api, subsystem) => {
  // Check if required dependencies exist
  if (!api.__facets.database) {
    throw new Error('Database dependency not found');
  }
  
  // ...
}
```

## Next Steps

- Learn about [Creating Plugins](./creating-plugins.md)
- Read [Best Practices](./best-practices.md)
- See [Examples](../examples/README.md) for complete examples

