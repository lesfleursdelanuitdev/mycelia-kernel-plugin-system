# Contract Validation Example

This example demonstrates how to use facet contracts to validate plugin interfaces at build time.

## Complete Example

```javascript
import {
  StandalonePluginSystem,
  createHook,
  Facet,
  createFacetContract,
  FacetContractRegistry
} from 'mycelia-kernel-plugin-system';

// Define a contract for database plugins
const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'close'],
  requiredProperties: ['connection'],
  validate: (facet) => {
    // Custom validation
    if (typeof facet.query !== 'function') {
      throw new Error('Database facet must have a query method');
    }
    if (typeof facet.close !== 'function') {
      throw new Error('Database facet must have a close method');
    }
    return true;
  }
});

// Plugin that satisfies the contract
export const usePostgreSQL = createHook({
  kind: 'database',
  version: '1.0.0',
  contract: 'database',  // Declare contract
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      attach: true,
      contract: 'database',
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      connection: null,  // Required property
      
      async query(sql, params = []) {  // Required method
        console.log(`[PostgreSQL] ${sql}`, params);
        return { rows: [], count: 0 };
      },
      
      async close() {  // Required method
        console.log('[PostgreSQL] Connection closed');
        this.connection = null;
      }
    })
    .onInit(async ({ ctx }) => {
      this.connection = { type: 'postgresql', connected: true };
      console.log('[PostgreSQL] Connected');
    });
  }
});

// Plugin that violates the contract (will fail validation)
export const useBrokenDatabase = createHook({
  kind: 'database',
  version: '1.0.0',
  contract: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      attach: true,
      contract: 'database',
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      // Missing 'close' method - will fail validation
      async query(sql, params = []) {
        console.log(`[Broken] ${sql}`, params);
        return { rows: [], count: 0 };
      }
    });
  }
});

// Alternative implementation that also satisfies the contract
export const useMySQL = createHook({
  kind: 'mysql-database',
  version: '1.0.0',
  contract: 'database',  // Same contract, different implementation
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('mysql-database', {
      attach: true,
      contract: 'database',
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      connection: null,
      
      async query(sql, params = []) {
        console.log(`[MySQL] ${sql}`, params);
        return { rows: [], count: 0 };
      },
      
      async close() {
        console.log('[MySQL] Connection closed');
        this.connection = null;
      }
    })
    .onInit(async ({ ctx }) => {
      this.connection = { type: 'mysql', connected: true };
      console.log('[MySQL] Connected');
    });
  }
});

// Plugin that uses the database contract
export const useCache = createHook({
  kind: 'cache',
  version: '1.0.0',
  required: ['database'],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const database = api.__facets.database;
    
    // The database is guaranteed to satisfy the 'database' contract
    // So we can safely call query() and close()
    
    return new Facet('cache', {
      attach: true,
      required: ['database'],
      source: import.meta.url,
      version: '1.0.0'
    })
    .add({
      async get(key) {
        const result = await database.query(
          'SELECT * FROM cache WHERE key = ?',
          [key]
        );
        return result.rows[0] || null;
      }
    });
  }
});

// Create and use the system
async function main() {
  // Register the contract with the default registry
  const registry = new FacetContractRegistry();
  registry.register(databaseContract);
  
  console.log('=== Example 1: Valid Contract ===');
  
  const system1 = new StandalonePluginSystem('app1', {
    config: {}
  });
  
  // Use the default registry (contracts are registered automatically)
  // For custom registries, you'd pass it via context
  
  await system1
    .use(usePostgreSQL)
    .use(useCache)
    .build();
  
  const db = system1.find('database');
  await db.query('SELECT * FROM users');
  await system1.dispose();
  
  console.log('\n=== Example 2: Contract Violation ===');
  
  const system2 = new StandalonePluginSystem('app2', {
    config: {}
  });
  
  try {
    await system2
      .use(useBrokenDatabase)
      .build();
  } catch (error) {
    console.log('Build failed as expected:', error.message);
    // Error: Database facet must have a close method
  }
  
  console.log('\n=== Example 3: Adapter Pattern ===');
  
  const system3 = new StandalonePluginSystem('app3', {
    config: {}
  });
  
  // Can swap implementations - both satisfy the same contract
  await system3
    .use(useMySQL)  // Using MySQL instead of PostgreSQL
    .build();
  
  const mysqlDb = system3.find('mysql-database');
  await mysqlDb.query('SELECT * FROM users');
  await system3.dispose();
}

main().catch(console.error);
```

## Explanation

### 1. Creating Contracts

Contracts define the expected interface:

```javascript
const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'close'],
  requiredProperties: ['connection'],
  validate: (facet) => {
    // Custom validation logic
    return true;
  }
});
```

### 2. Declaring Contracts

Plugins declare which contract they implement:

```javascript
export const usePostgreSQL = createHook({
  kind: 'database',
  contract: 'database',  // ✅ Declare contract
  // ...
});
```

### 3. Contract Validation

Contracts are validated during the build process:
- **Required methods** must exist
- **Required properties** must exist
- **Custom validation** is executed
- **Validation failures** cause build to fail

### 4. Adapter Pattern

Multiple implementations can satisfy the same contract:

```javascript
// Both satisfy the 'database' contract
usePostgreSQL  // kind: 'database', contract: 'database'
useMySQL       // kind: 'mysql-database', contract: 'database'
```

This enables:
- Swappable implementations
- Interface consistency
- Testing with mocks

## Expected Output

```
=== Example 1: Valid Contract ===
[PostgreSQL] Connected
[PostgreSQL] SELECT * FROM users []
[PostgreSQL] Connection closed

=== Example 2: Contract Violation ===
Build failed as expected: Database facet must have a close method

=== Example 3: Adapter Pattern ===
[MySQL] Connected
[MySQL] SELECT * FROM users []
[MySQL] Connection closed
```

## Key Points

1. **Contracts ensure interface consistency** across implementations
2. **Validation happens at build time** - catch errors early
3. **Multiple implementations** can satisfy the same contract
4. **Custom validation** allows complex checks
5. **Contracts enable the adapter pattern** for swappable implementations

## Next Steps

- Create contracts for your own plugin interfaces
- Use contracts to validate third-party plugins
- Implement adapter pattern for different backends
- Add contract validation to your test suite

