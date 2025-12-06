# Error Handling Example

This example demonstrates how to handle errors and transaction rollback in the plugin system.

## Complete Example

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Plugin that may fail during initialization
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
      async query(sql) {
        if (!this.connected) {
          throw new Error('Database not connected');
        }
        return { rows: [] };
      }
    })
    .onInit(async ({ ctx }) => {
      // Simulate connection failure
      if (config.shouldFail) {
        throw new Error('Failed to connect to database');
      }
      
      this.connected = true;
      console.log('Database connected');
    })
    .onDispose(async () => {
      console.log('Database connection closed (cleanup)');
      this.connected = false;
    });
  }
});

// Plugin that depends on database
export const useCache = createHook({
  kind: 'cache',
  version: '1.0.0',
  required: ['database'],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('cache', {
      attach: true,
      required: ['database'],
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      get(key) {
        return this.store.get(key);
      }
    })
    .onInit(async ({ ctx }) => {
      this.store = new Map();
      console.log('Cache initialized');
    })
    .onDispose(async () => {
      console.log('Cache cleaned up (cleanup)');
      this.store = null;
    });
  }
});

// Create and use the system
async function main() {
  console.log('=== Example 1: Successful Build ===');
  
  const system1 = new StandalonePluginSystem('app1', {
    config: {
      database: {
        shouldFail: false
      }
    }
  });

  try {
    await system1
      .use(useDatabase)
      .use(useCache)
      .build();
    
    console.log('Build successful!');
    const db = system1.find('database');
    await db.query('SELECT * FROM users');
    
    await system1.dispose();
  } catch (error) {
    console.error('Unexpected error:', error);
  }
  
  console.log('\n=== Example 2: Failed Build (Automatic Rollback) ===');
  
  const system2 = new StandalonePluginSystem('app2', {
    config: {
      database: {
        shouldFail: true  // This will cause initialization to fail
      }
    }
  });

  try {
    await system2
      .use(useDatabase)
      .use(useCache)
      .build();
    
    console.log('Build successful (unexpected)');
  } catch (error) {
    console.log('Build failed as expected:', error.message);
    console.log('System state:', system2.api.__facets.getAll('database').length === 0 ? 'clean (rolled back)' : 'dirty');
    
    // No need to dispose - system was never built
    // But if you want to be safe:
    try {
      await system2.dispose();
    } catch (disposeError) {
      // Ignore - system is already clean
    }
  }
  
  console.log('\n=== Example 3: Error During Operation ===');
  
  const system3 = new StandalonePluginSystem('app3', {
    config: {
      database: {
        shouldFail: false
      }
    }
  });

  await system3
    .use(useDatabase)
    .build();
  
  const db = system3.find('database');
  
  // Normal operation
  try {
    await db.query('SELECT * FROM users');
    console.log('Query successful');
  } catch (error) {
    console.error('Query failed:', error.message);
  }
  
  // Simulate disconnection
  db.connected = false;
  
  try {
    await db.query('SELECT * FROM users');
  } catch (error) {
    console.log('Query failed as expected:', error.message);
    // Handle error appropriately
  }
  
  await system3.dispose();
  
  console.log('\n=== Example 4: Partial Failure Handling ===');
  
  const system4 = new StandalonePluginSystem('app4', {
    config: {
      database: {
        shouldFail: false
      }
    }
  });

  // Build with error handling
  try {
    await system4
      .use(useDatabase)
      .use(useCache)
      .build();
    
    console.log('System built successfully');
    
    // Use the system
    const cache = system4.find('cache');
    cache.set('key', 'value');
    console.log('Cache set:', cache.get('key'));
    
  } catch (error) {
    console.error('Build failed:', error.message);
    // System is automatically rolled back
    // No cleanup needed
  } finally {
    // Always cleanup if system was built
    if (system4.api.__facets.getAll('database').length > 0) {
      await system4.dispose();
    }
  }
}

main().catch(console.error);
```

## Explanation

### 1. Transaction Rollback

If any plugin fails during initialization:
- **All changes are rolled back**
- **All successfully initialized facets are disposed**
- **System remains in clean state**
- **No partial system state**

### 2. Error Handling Patterns

**During Build:**
```javascript
try {
  await system.use(plugin).build();
} catch (error) {
  // System is automatically rolled back
  // No cleanup needed
}
```

**During Operation:**
```javascript
try {
  await plugin.method();
} catch (error) {
  // Handle error appropriately
  // System state is still valid
}
```

**Safe Cleanup:**
```javascript
try {
  await system.dispose();
} catch (error) {
  // Ignore - system may already be clean
}
```

### 3. Error Types

**Build-Time Errors:**
- Initialization failures (`onInit` throws)
- Dependency resolution failures
- Contract validation failures
- Circular dependency errors

**Runtime Errors:**
- Method call failures
- Resource access failures
- Business logic errors

### 4. Best Practices

1. **Always wrap builds** in try-catch
2. **Check system state** before using plugins
3. **Handle runtime errors** gracefully
4. **Clean up resources** in `onDispose`
5. **Use transactions** for atomic operations

## Expected Output

```
=== Example 1: Successful Build ===
Database connected
Cache initialized
Build successful!
Database connection closed (cleanup)
Cache cleaned up (cleanup)

=== Example 2: Failed Build (Automatic Rollback) ===
Database connection closed (cleanup)
Build failed as expected: Failed to connect to database
System state: clean (rolled back)

=== Example 3: Error During Operation ===
Database connected
Query successful
Query failed as expected: Database not connected
Database connection closed (cleanup)

=== Example 4: Partial Failure Handling ===
Database connected
Cache initialized
System built successfully
Cache set: value
Database connection closed (cleanup)
Cache cleaned up (cleanup)
```

## Key Points

1. **Build failures** cause automatic rollback
2. **No cleanup needed** if build fails
3. **Runtime errors** don't affect system state
4. **Always handle errors** appropriately
5. **Use try-catch** for error handling

## Next Steps

- Implement retry logic for transient failures
- Add error recovery mechanisms
- Create health check utilities
- Build error monitoring and reporting

