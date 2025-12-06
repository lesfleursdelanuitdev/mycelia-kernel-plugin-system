# Best Practices Guide

This guide covers recommended patterns and practices for using the Mycelia Plugin System effectively.

## Plugin Design

### 1. Choose Descriptive Names

```javascript
// ✅ Good: Clear and descriptive
export const useDatabase = createHook({
  kind: 'database',
  // ...
});

export const usePostgreSQLDatabase = createHook({
  kind: 'postgresql-database',
  // ...
});

// ❌ Avoid: Vague names
export const useDB = createHook({
  kind: 'db',
  // ...
});
```

### 2. Use Semantic Versioning

```javascript
// ✅ Good: Semantic versioning
export const useDatabase = createHook({
  kind: 'database',
  version: '1.0.0',  // Major.Minor.Patch
  // ...
});

// Update version when making changes:
// - 1.0.0 → 1.0.1 (patch: bug fixes)
// - 1.0.0 → 1.1.0 (minor: new features, backward compatible)
// - 1.0.0 → 2.0.0 (major: breaking changes)
```

### 3. Always Include Source

```javascript
// ✅ Good: Include source for debugging
export const useDatabase = createHook({
  kind: 'database',
  source: import.meta.url,  // Helps with debugging
  // ...
});
```

### 4. Declare All Dependencies

```javascript
// ✅ Good: Explicit dependencies
export const useCache = createHook({
  kind: 'cache',
  required: ['database', 'logger'],
  // ...
});

// ❌ Avoid: Implicit dependencies
export const useCache = createHook({
  kind: 'cache',
  // Missing required - will fail if dependencies aren't registered
  // ...
});
```

## Resource Management

### 1. Always Clean Up Resources

```javascript
// ✅ Good: Proper cleanup
export const useDatabase = createHook({
  kind: 'database',
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      attach: true
    })
    .add({
      async query(sql) { /* ... */ }
    })
    .onInit(async ({ ctx }) => {
      this.connection = await createConnection();
    })
    .onDispose(async () => {
      // ✅ Always clean up
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    });
  }
});
```

### 2. Handle Errors in onInit

```javascript
// ✅ Good: Error handling
.onInit(async ({ ctx }) => {
  try {
    this.connection = await createConnection();
  } catch (error) {
    // Errors in onInit cause build to fail
    throw new Error(`Failed to initialize database: ${error.message}`);
  }
})
```

### 3. Clean Up Even on Failure

```javascript
// ✅ Good: Cleanup is called even if onInit fails
.onDispose(async () => {
  // This is called even if onInit threw an error
  if (this.connection) {
    await this.connection.close();
  }
})
```

## Configuration

### 1. Provide Sensible Defaults

```javascript
// ✅ Good: Default values
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  const host = config.host || 'localhost';
  const port = config.port || 5432;
  const timeout = config.timeout || 5000;
  
  // ...
}
```

### 2. Validate Configuration

```javascript
// ✅ Good: Validate config
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  
  if (!config.host) {
    throw new Error('Database host is required');
  }
  
  if (config.port && (config.port < 1 || config.port > 65535)) {
    throw new Error('Database port must be between 1 and 65535');
  }
  
  // ...
}
```

### 3. Use Nested Configuration

```javascript
// ✅ Good: Namespaced config
const system = new StandalonePluginSystem('app', {
  config: {
    database: {
      host: 'localhost',
      port: 5432
    },
    cache: {
      maxSize: 1000
    }
  }
});
```

## Error Handling

### 1. Fail Fast

```javascript
// ✅ Good: Fail early
.onInit(async ({ ctx }) => {
  if (!ctx.config?.database?.host) {
    throw new Error('Database host is required');
  }
  
  // Continue initialization...
})
```

### 2. Provide Clear Error Messages

```javascript
// ✅ Good: Clear error messages
.onInit(async ({ ctx }) => {
  try {
    this.connection = await createConnection();
  } catch (error) {
    throw new Error(
      `Failed to connect to database at ${ctx.config.database.host}:${error.message}`
    );
  }
})
```

### 3. Handle Runtime Errors Gracefully

```javascript
// ✅ Good: Graceful error handling
.add({
  async query(sql, params = []) {
    try {
      return await this.connection.query(sql, params);
    } catch (error) {
      // Log error but don't crash
      if (this.logger) {
        this.logger.error('Database query failed', error);
      }
      throw error;  // Re-throw for caller to handle
    }
  }
})
```

## Dependency Management

### 1. Keep Dependencies Minimal

```javascript
// ✅ Good: Minimal dependencies
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],  // Only what's needed
  // ...
});

// ❌ Avoid: Unnecessary dependencies
export const useCache = createHook({
  kind: 'cache',
  required: ['database', 'logger', 'metrics', 'events'],  // Too many!
  // ...
});
```

### 2. Use Optional Dependencies When Appropriate

```javascript
// ✅ Good: Optional dependency
export const useCache = createHook({
  kind: 'cache',
  // No required - logger is optional
  fn: (ctx, api, subsystem) => {
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

### 3. Avoid Circular Dependencies

```javascript
// ❌ Avoid: Circular dependencies
// A → B → A (circular!)

// ✅ Good: Break the cycle
// Extract shared functionality:
// Shared → A
// Shared → B
```

## Performance

### 1. Lazy Initialization

```javascript
// ✅ Good: Lazy initialization
.add({
  async expensiveOperation() {
    if (!this.initialized) {
      await this.initialize();
      this.initialized = true;
    }
    // Perform operation...
  }
})
```

### 2. Cache Expensive Operations

```javascript
// ✅ Good: Cache results
.add({
  async getConfig() {
    if (!this._configCache) {
      this._configCache = await this.loadConfig();
    }
    return this._configCache;
  }
})
```

### 3. Use Plan Caching

```javascript
// ✅ Good: Reuse graph cache
const graphCache = new DependencyGraphCache(100);

await system1.use(useDatabase).build(graphCache);
await system2.use(useDatabase).build(graphCache);  // Reuses cache
```

## Testing

### 1. Test Plugins in Isolation

```javascript
// ✅ Good: Test plugin independently
import { test } from 'vitest';
import { StandalonePluginSystem } from 'mycelia-kernel-plugin-system';
import { useLogger } from './use-logger.js';

test('logger plugin', async () => {
  const system = new StandalonePluginSystem('test', {
    config: { logger: { level: 'debug' } }
  });
  
  await system.use(useLogger).build();
  
  const logger = system.find('logger');
  logger.log('Test message');
  
  await system.dispose();
});
```

### 2. Test Error Cases

```javascript
// ✅ Good: Test error handling
test('database plugin fails on invalid config', async () => {
  const system = new StandalonePluginSystem('test', {
    config: { database: {} }  // Missing required host
  });
  
  await expect(
    system.use(useDatabase).build()
  ).rejects.toThrow('Database host is required');
});
```

### 3. Mock Dependencies

```javascript
// ✅ Good: Mock dependencies for testing
test('cache plugin uses database', async () => {
  const system = new StandalonePluginSystem('test', {
    config: {}
  });
  
  // Use mock database plugin
  await system
    .use(useMockDatabase)
    .use(useCache)
    .build();
  
  const cache = system.find('cache');
  // Test cache...
});
```

## Documentation

### 1. Document Plugin API

```javascript
/**
 * Database plugin
 * 
 * Provides database query functionality.
 * 
 * @example
 * const db = system.find('database');
 * await db.query('SELECT * FROM users');
 */
export const useDatabase = createHook({
  // ...
});
```

### 2. Document Dependencies

```javascript
/**
 * Cache plugin
 * 
 * Dependencies:
 * - database (required): For persistence
 * - logger (optional): For logging operations
 */
export const useCache = createHook({
  // ...
});
```

### 3. Document Configuration

```javascript
/**
 * Database plugin
 * 
 * Configuration:
 * - host (required): Database host
 * - port (optional, default: 5432): Database port
 * - timeout (optional, default: 5000): Connection timeout
 */
export const useDatabase = createHook({
  // ...
});
```

## Security

### 1. Validate Input

```javascript
// ✅ Good: Validate input
.add({
  async query(sql, params = []) {
    // Validate SQL (basic check)
    if (typeof sql !== 'string' || sql.trim().length === 0) {
      throw new Error('SQL query must be a non-empty string');
    }
    
    // Validate params
    if (!Array.isArray(params)) {
      throw new Error('Params must be an array');
    }
    
    // Execute query...
  }
})
```

### 2. Don't Expose Sensitive Data

```javascript
// ❌ Avoid: Exposing sensitive data
.add({
  getConfig() {
    return this.config;  // May contain passwords!
  }
})

// ✅ Good: Filter sensitive data
.add({
  getConfig() {
    const safe = { ...this.config };
    delete safe.password;
    delete safe.secret;
    return safe;
  }
})
```

## Summary

### Do's ✅

- Use descriptive names
- Include source for debugging
- Declare all dependencies
- Clean up resources
- Handle errors appropriately
- Provide sensible defaults
- Document your plugins
- Test thoroughly

### Don'ts ❌

- Use vague names
- Skip dependency declarations
- Forget to clean up resources
- Ignore errors
- Create circular dependencies
- Expose sensitive data
- Skip documentation
- Skip testing

## Next Steps

- Learn about [Creating Plugins](./creating-plugins.md)
- Read about [Dependency Management](./dependency-management.md)
- See [Examples](../examples/README.md) for complete examples

