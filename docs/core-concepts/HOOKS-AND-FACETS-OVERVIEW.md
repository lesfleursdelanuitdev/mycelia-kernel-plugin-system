# Hooks and Facets Overview

## Introduction

The Mycelia Plugin System uses a **hook-based architecture** where **hooks** create **facets** that extend system functionality. This pattern provides a composable, extensible way to add features to systems without modifying their core implementation.

## What are Hooks and Facets?

### Hooks

A **Hook** is a function that creates and returns a **Facet**. Hooks are executed during system build to extend functionality.

**Key Characteristics:**
- **Factory Functions**: Create facets when called
- **Metadata**: Include information about dependencies and behavior
- **Composable**: Can depend on other hooks/facets
- **Standardized**: Use `createHook` for consistent structure

### Facets

A **Facet** is a composable unit of functionality that extends a system's capabilities. Facets are created by hooks and provide methods and properties.

**Key Characteristics:**
- **Functional Units**: Provide specific capabilities (database, cache, etc.)
- **Composable**: Can depend on other facets
- **Lifecycle Aware**: Support initialization and disposal
- **Attachable**: Can be attached to system for easy access

## The Hook → Facet Relationship

```
┌─────────────────────────────────────────────────────────────┐
│              Hook → Facet Relationship                     │
└─────────────────────────────────────────────────────────────┘

Hook (Factory Function)
  │
  │ Executed during build
  │
  ▼
Facet (Functional Unit)
  │
  │ Added to FacetManager
  │
  ▼
System (Extended Capabilities)
```

### Example

```javascript
import { createHook, Facet, StandalonePluginSystem } from 'mycelia-kernel-plugin-system';

// Hook creates a Facet
export const useDatabase = createHook({
  kind: 'database',
  required: [],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Hook logic creates a Facet
    return new Facet('database', { 
      attach: true,
      source: import.meta.url 
    })
    .add({
      // Facet methods
      async query(sql) {
        // Database query implementation
        return { rows: [] };
      },
      
      async close() {
        // Close connection
      }
    });
  }
});

// Usage
const system = new StandalonePluginSystem('my-app', {
  config: {
    database: { host: 'localhost' }
  }
});

system.use(useDatabase);
await system.build();

// Facet is now available
const db = system.find('database');
await db.query('SELECT * FROM users');
```

## How They Work Together

### Build Process

1. **Hook Registration**: Hooks are registered via `system.use(hook)`
2. **Build Phase**: During `system.build()`, hooks are executed
3. **Facet Creation**: Each hook creates a facet
4. **Dependency Resolution**: Build system resolves dependencies
5. **Initialization**: Facets are initialized in dependency order
6. **Attachment**: Facets are attached to system (if configured)

### Dependency Management

Hooks declare dependencies, and the build system ensures correct initialization order:

```javascript
// Hook 1: No dependencies
export const useLogger = createHook({
  kind: 'logger',
  required: []  // No dependencies
});

// Hook 2: Depends on logger
export const useCache = createHook({
  kind: 'cache',
  required: ['logger']  // Logger must exist first
});

// Hook 3: Depends on cache and database
export const useApp = createHook({
  kind: 'app',
  required: ['cache', 'database']  // Both must exist first
});
```

**Build System:**
- Validates all dependencies exist
- Topologically sorts facets by dependencies
- Initializes facets in correct order

### Facet Access

Facets can be accessed in several ways, depending on how they're configured:

**Universal Access (Always Available):**

All facets can be accessed using `system.find(kind)`, regardless of their `attach` setting:

```javascript
// This always works for any facet
const cacheFacet = system.find('cache');
const databaseFacet = system.find('database');
```

**Direct Property Access (Attached Facets Only):**

If a facet has `attach: true`, you can also access it directly as a property on the system:

```javascript
// Only works if the facet was created with attach: true
const cacheFacet = system.cache;      // ✅ Works if attach: true
const databaseFacet = system.database; // ✅ Works if attach: true

// If attach: false, this returns undefined
const internalFacet = system.internal; // ❌ undefined if attach: false
// Use system.find('internal') instead
```

**Via FacetManager (Advanced):**

For advanced use cases, you can access facets directly through the FacetManager:

```javascript
// Via FacetManager methods
const cacheFacet = system.api.__facets.find('cache');
const cacheFacet = system.api.__facets.cache;  // Proxy access

// Check if a facet exists
if (system.api.__facets.has('cache')) {
  // Facet exists
}
```

**In Facet Methods:**

When writing facet methods, use `subsystem.find()` to access other facets:

```javascript
fn: (ctx, api, subsystem) => {
  return new Facet('custom', { attach: true })
    .add({
      process() {
        // Access other facets using find() - always works
        const cache = subsystem.find('cache');
        const logger = subsystem.find('logger');
        // ...
      }
    });
}
```

**Summary:**
- ✅ `system.find(kind)` - Always works for all facets
- ✅ `system.kind` - Only works if the facet has `attach: true`
- 💡 **Tip:** Use `system.find()` when you're not sure if a facet is attached, or when you want consistent access patterns

## Core Concepts

### Hook Metadata

Hooks include metadata that describes their behavior:

- **`kind`**: Facet kind identifier (must match facet kind)
- **`version`**: Semantic version (e.g., '1.0.0')
- **`overwrite`**: Whether hook can overwrite existing hooks
- **`required`**: Array of required facet dependencies
- **`attach`**: Whether facet should be attached to system
- **`source`**: Source file location for debugging
- **`contract`**: Contract name for validation

### Facet Options

Facets include options that control their behavior:

- **`attach`**: Whether to attach to system
- **`required`**: Array of dependency facet kinds
- **`source`**: Source file location
- **`overwrite`**: Whether facet can overwrite existing ones
- **`contract`**: Contract name for validation
- **`version`**: Semantic version

### Facet Lifecycle

Facets support lifecycle methods:

- **`onInit(callback)`**: Called during initialization
- **`onDispose(callback)`**: Called during disposal

## Common Patterns

### Basic Hook Pattern

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useCustom = createHook({
  kind: 'custom',
  required: [],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.custom || {};
    
    return new Facet('custom', { 
      attach: true,
      source: import.meta.url 
    })
    .add({
      doSomething() {
        // Implementation
      }
    });
  }
});
```

### Dependency Pattern

```javascript
export const useCache = createHook({
  kind: 'cache',
  required: ['database'],  // Dependencies
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Dependencies are guaranteed to exist
    const database = api.__facets.database;
    
    return new Facet('cache', { 
      attach: true,
      required: ['database'],  // Also declare on facet
      source: import.meta.url 
    })
    .add({
      async get(key) {
        // Use dependencies
        const cached = this.store.get(key);
        if (cached) return cached;
        
        const data = await database.query(`SELECT * FROM cache WHERE key = ?`, [key]);
        this.store.set(key, data);
        return data;
      }
    });
  }
});
```

### Configuration Pattern

```javascript
export const useDatabase = createHook({
  kind: 'database',
  required: [],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Extract configuration
    const config = ctx.config?.database || {};
    const host = config.host || 'localhost';
    const port = config.port || 5432;
    
    // Create service with configuration
    const connection = new DatabaseConnection(host, port);
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          return connection.query(sql);
        },
        
        async close() {
          return connection.close();
        }
      });
  }
});
```

### Lifecycle Pattern

```javascript
export const useDatabase = createHook({
  kind: 'database',
  required: [],
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
      })
      .onDispose(async () => {
        // Cleanup during disposal
        if (connection) {
          await connection.close();
          connection = null;
        }
      });
  }
});
```

## FacetManager

The `FacetManager` manages all facets for a system:

### Responsibilities

- **Storage**: Stores facets in a Map by kind
- **Access**: Provides methods to find, get, and iterate facets
- **Transactions**: Supports transactional operations with rollback
- **Lifecycle**: Manages initialization and disposal

### Key Methods

```javascript
// Find facet by kind
const facet = system.api.__facets.find('cache');

// Check if facet exists
if (system.api.__facets.has('cache')) {
  // ...
}

// Get all facet kinds
const kinds = system.api.__facets.getAllKinds();

// Iterate over facets
for (const [kind, facet] of system.api.__facets) {
  // ...
}
```

## Contracts

Facets can declare contracts that define required methods and properties:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

// Hook declares contract
export const useRouter = createHook({
  kind: 'router',
  contract: 'router',  // Declares router contract
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('router', { 
      contract: 'router',  // Facet also declares contract
      source: import.meta.url
    })
    .add({
      // Must implement all contract methods
      registerRoute(pattern, handler) { /* ... */ },
      matchRoute(path) { /* ... */ }
    });
  }
});
```

**Benefits:**
- **Validation**: Ensures facets implement required methods
- **Type Safety**: Provides contract-based type checking
- **Documentation**: Documents expected interface

## Best Practices

### Hook Design

1. **Single Responsibility**: Each hook should provide one capability
2. **Clear Dependencies**: Declare all required dependencies
3. **Configuration**: Support configuration via `ctx.config`
4. **Error Handling**: Validate inputs and handle errors gracefully
5. **Documentation**: Document hook behavior and dependencies

### Facet Design

1. **Consistent Interface**: Use consistent method names and signatures
2. **Lifecycle Management**: Implement onInit/onDispose for resource management
3. **Dependency Declaration**: Declare dependencies on both hook and facet
4. **Contract Compliance**: Implement contracts when declared
5. **Error Handling**: Handle errors and provide useful error messages

### Dependency Management

1. **Minimal Dependencies**: Only declare truly required dependencies
2. **Explicit Dependencies**: Use `required` array, not implicit assumptions
3. **Dependency Order**: Consider initialization order when designing
4. **Optional Dependencies**: Check for optional facets at call time

## Common Use Cases

### Adding a Database Plugin

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

const useDatabase = createHook({
  kind: 'database',
  required: [],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) { /* ... */ }
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

### Adding a Cache Plugin with Dependencies

```javascript
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

system.use(useDatabase);
system.use(useCache);
await system.build();

const cache = system.find('cache');
await cache.set('key', 'value');
```

## Related Documentation

- [Hooks](./HOOKS.md) - Detailed hook documentation
- [Facets](./FACETS.md) - Detailed facet documentation
- [Facet Manager](./FACET-MANAGER.md) - Facet management system
- [Facet Manager Transaction](./FACET-MANAGER-TRANSACTION.md) - Transactional operations
- [Facet Init Callback](./FACET-INIT-CALLBACK.md) - Initialization interface
- [Facet Contract](../facet-contracts/FACET-CONTRACT.md) - Contract system
- [Facet Contract Registry](../facet-contracts/FACET-CONTRACT-REGISTRY.md) - Contract management
- [Hook Function Context](../api-reference/HOOK-FUNCTION-CONTEXT.md) - Context parameter
- [Hook Function API Parameter](../api-reference/HOOK-FUNCTION-API-PARAM.md) - API parameter
- [Hook Function Subsystem Parameter](../api-reference/HOOK-FUNCTION-SUBSYSTEM-PARAM.md) - Subsystem parameter
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Using the system standalone

