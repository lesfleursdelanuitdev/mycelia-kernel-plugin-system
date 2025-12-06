# Plugin with Dependencies Example

This example demonstrates how to create plugins that depend on other plugins and how the system automatically resolves dependencies.

## Complete Example

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Plugin 1: Database (no dependencies)
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
        // Simulated database query
        console.log(`Executing: ${sql}`, params);
        return { rows: [], count: 0 };
      },
      
      async close() {
        console.log('Database connection closed');
      }
    })
    .onInit(async ({ ctx }) => {
      console.log('Database plugin initialized');
    })
    .onDispose(async () => {
      await this.close();
    });
  }
});

// Plugin 2: Cache (depends on database)
export const useCache = createHook({
  kind: 'cache',
  version: '1.0.0',
  required: ['database'],  // Declare dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access the database dependency
    const database = api.__facets.database;
    
    return new Facet('cache', {
      attach: true,
      required: ['database'],
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      async get(key) {
        // Check cache first, then database
        const cached = this.store.get(key);
        if (cached) {
          console.log(`Cache hit: ${key}`);
          return cached;
        }
        
        console.log(`Cache miss: ${key}`);
        // Fallback to database
        const result = await database.query(
          'SELECT * FROM cache WHERE key = ?',
          [key]
        );
        
        if (result.rows.length > 0) {
          this.store.set(key, result.rows[0]);
        }
        
        return result.rows[0] || null;
      },
      
      async set(key, value) {
        this.store.set(key, value);
        // Persist to database
        await database.query(
          'INSERT INTO cache (key, value) VALUES (?, ?)',
          [key, JSON.stringify(value)]
        );
        console.log(`Cached: ${key}`);
      },
      
      clear() {
        this.store.clear();
        console.log('Cache cleared');
      }
    })
    .onInit(async ({ ctx }) => {
      this.store = new Map();
      console.log('Cache plugin initialized (depends on database)');
    });
  }
});

// Plugin 3: API (depends on both database and cache)
export const useAPI = createHook({
  kind: 'api',
  version: '1.0.0',
  required: ['database', 'cache'],  // Multiple dependencies
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const database = api.__facets.database;
    const cache = api.__facets.cache;
    
    return new Facet('api', {
      attach: true,
      required: ['database', 'cache'],
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      async getUser(userId) {
        // Try cache first
        const cached = await cache.get(`user:${userId}`);
        if (cached) return cached;
        
        // Fallback to database
        const result = await database.query(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          await cache.set(`user:${userId}`, user);
          return user;
        }
        
        return null;
      },
      
      async createUser(userData) {
        const result = await database.query(
          'INSERT INTO users (name, email) VALUES (?, ?)',
          [userData.name, userData.email]
        );
        
        // Invalidate cache
        cache.clear();
        
        return result;
      }
    })
    .onInit(async ({ ctx }) => {
      console.log('API plugin initialized (depends on database and cache)');
    });
  }
});

// Create and use the system
async function main() {
  const system = new StandalonePluginSystem('my-app', {
    config: {
      database: {
        host: 'localhost',
        port: 5432
      }
    },
    debug: true
  });

  // Register plugins - order doesn't matter!
  // The system will automatically resolve dependencies
  await system
    .use(useAPI)        // Depends on database and cache
    .use(useCache)      // Depends on database
    .use(useDatabase)   // No dependencies
    .build();

  // Use the plugins
  const api = system.find('api');
  const cache = system.find('cache');
  const database = system.find('database');
  
  // The API plugin uses both database and cache
  await api.getUser(123);
  await api.createUser({ name: 'John', email: 'john@example.com' });
  
  // Cleanup
  await system.dispose();
}

main().catch(console.error);
```

## Explanation

### 1. Dependency Declaration

Dependencies are declared in the hook metadata:

```javascript
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],  // ✅ Declare dependency
  // ...
});
```

### 2. Accessing Dependencies

Dependencies are available via `api.__facets` during hook execution:

```javascript
fn: (ctx, api, subsystem) => {
  const database = api.__facets.database;  // ✅ Access dependency
  // ...
}
```

### 3. Automatic Resolution

The system automatically:
- Resolves dependency order
- Initializes plugins in the correct sequence
- Ensures dependencies are available before dependent plugins

**Initialization Order:**
1. `database` (no dependencies)
2. `cache` (depends on database)
3. `api` (depends on database and cache)

### 4. Registration Order Doesn't Matter

You can register plugins in any order:

```javascript
// ✅ All of these work the same way:
system.use(useAPI).use(useCache).use(useDatabase).build();
system.use(useDatabase).use(useCache).use(useAPI).build();
system.use(useCache).use(useAPI).use(useDatabase).build();
```

## Expected Output

```
Database plugin initialized
Cache plugin initialized (depends on database)
API plugin initialized (depends on database and cache)
Cache miss: user:123
Executing: SELECT * FROM cache WHERE key = ? [ 'user:123' ]
Executing: SELECT * FROM users WHERE id = ? [ 123 ]
Executing: INSERT INTO users (name, email) VALUES (?, ?) [ 'John', 'john@example.com' ]
Cache cleared
Database connection closed
```

## Key Points

1. **Declare all dependencies** in the `required` array
2. **Access dependencies** via `api.__facets` during hook execution
3. **Order doesn't matter** - the system resolves dependencies automatically
4. **Dependencies are guaranteed** to be initialized before dependent plugins

## Next Steps

- Create circular dependencies (will fail with a clear error)
- Use optional dependencies (see [Lifecycle Management](./lifecycle-management.md))
- Add more complex dependency chains
- Handle dependency errors gracefully

