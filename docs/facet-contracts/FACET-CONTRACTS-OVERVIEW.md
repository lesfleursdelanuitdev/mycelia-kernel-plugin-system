# Facet Contracts Overview

## Introduction

Facet contracts are a validation system in the Mycelia Plugin System that ensure facets implement the expected interface. Contracts define required methods and properties, provide runtime validation, and enable the adapter pattern where different hooks can implement the same contract interface.

## What are Facet Contracts?

A **Facet Contract** is a specification that defines:

- **Required Methods**: Methods that must be implemented on the facet
- **Required Properties**: Properties that must exist on the facet
- **Custom Validation**: Optional validation function for additional checks

Contracts provide:
- **Interface Definition**: Clear specification of what a facet must implement
- **Runtime Validation**: Automatic validation during system build
- **Type Safety**: Ensures facets match expected interfaces
- **Adapter Support**: Enables multiple implementations of the same contract

## Why Contracts?

### Problem Solved

Without contracts, it's difficult to ensure that:
- Facets implement all required methods
- Different implementations are compatible
- Adapters can be swapped safely
- Integration errors are caught early

### Solution

Contracts provide:
- **Early Validation**: Errors caught during build, not runtime
- **Interface Guarantees**: Ensures facets match expected interface
- **Adapter Compatibility**: Multiple implementations can satisfy the same contract
- **Documentation**: Contracts document expected interfaces

## Contract Components

### Required Methods

Methods that must be implemented on the facet:

```javascript
import { createFacetContract } from 'mycelia-kernel-plugin-system';

const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: [
    'query',
    'execute',
    'close'
  ]
});
```

**Validation:**
- Checks method exists
- Checks method is a function
- Throws error if missing

### Required Properties

Properties that must exist on the facet:

```javascript
const cacheContract = createFacetContract({
  name: 'cache',
  requiredProperties: [
    '_store',
    'maxSize'
  ]
});
```

**Validation:**
- Checks property exists (using `in` operator)
- Checks property is not `undefined`
- Throws error if missing

### Custom Validation

Optional validation function for complex checks:

```javascript
const cacheContract = createFacetContract({
  name: 'cache',
  requiredMethods: ['get', 'set'],
  requiredProperties: ['_store'],
  validate: (ctx, api, subsystem, facet) => {
    // Validate internal structure
    if (typeof facet._store !== 'object') {
      throw new Error('Cache facet _store must be an object');
    }
    if (typeof facet._store.get !== 'function') {
      throw new Error('Cache facet _store must have get method');
    }
  }
});
```

## Contract Registry

The **FacetContractRegistry** manages contracts:

### Default Registry

The system provides a default registry with standard contracts:

```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

// Check if contract exists
if (defaultContractRegistry.has('database')) {
  // Contract is available
}

// Enforce a contract
defaultContractRegistry.enforce('database', ctx, api, subsystem, databaseFacet);
```

**Pre-registered Contracts:**
- `'hierarchy'` - Hierarchy facet contract
- `'listeners'` - Listeners facet contract
- `'processor'` - Processor facet contract
- `'queue'` - Queue facet contract
- `'router'` - Router facet contract
- `'scheduler'` - Scheduler facet contract
- `'server'` - Server facet contract
- `'storage'` - Storage facet contract
- `'websocket'` - WebSocket facet contract

### Registry Operations

```javascript
// Register a contract
registry.register(contract);

// Check if contract exists
registry.has('contract-name');

// Get contract
const contract = registry.get('contract-name');

// Enforce contract
registry.enforce('contract-name', ctx, api, subsystem, facet);

// List all contracts
const names = registry.list();
```

## Contract Declaration

### In Hooks

Hooks declare contracts using the `contract` parameter:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useDatabase = createHook({
  kind: 'database',
  contract: 'database',  // Declare contract
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      contract: 'database'  // Also declare on facet
    })
    .add({
      // Must implement all contract methods
      async query(sql) { /* ... */ },
      async execute(sql) { /* ... */ },
      async close() { /* ... */ }
    });
  }
});
```

### In Facets

Facets also declare contracts in their constructor:

```javascript
return new Facet('database', {
  contract: 'database'  // Contract name (string)
})
.add({
  // Contract methods and properties
});
```

**Important:**
- Contract name is a **string**, not a contract object
- Contract is looked up from registry during validation
- Both hook and facet should declare the same contract

## Contract Enforcement

Contracts are enforced during the **verification phase** of the build process:

### Enforcement Timing

```
Build Process:
  1. Execute hooks → Create facets
  2. Collect facets
  3. Enforce contracts ← HERE (verification phase)
  4. Build dependency graph
  5. Topological sort
  6. Create build plan
```

### Enforcement Process

1. **Facet Collection**: All facets collected after hook execution
2. **Contract Extraction**: Contract name retrieved from each facet
3. **Registry Lookup**: Contract looked up in registry
4. **Validation**: Contract enforced on facet
5. **Error Handling**: Build fails if validation fails

### Validation Steps

For each facet with a contract:

1. **Method Validation**: Check all required methods exist and are functions
2. **Property Validation**: Check all required properties exist
3. **Custom Validation**: Run custom validation function if provided

**All validation happens before any facets are initialized.**

## Adapters and Contracts

### What are Adapters?

**Adapters** are hooks that implement a particular contract, providing alternative implementations:

```javascript
// Standard database implementation
export const usePostgreSQL = createHook({
  kind: 'database',
  contract: 'database',  // Implements database contract
  // ...
});

// Alternative database adapter
export const useMySQL = createHook({
  kind: 'mysql-database',
  contract: 'database',  // Also implements database contract
  // ...
});
```

### Adapter Benefits

- **Swappable Implementations**: Different hooks can implement the same contract
- **Compatibility**: All adapters work with contract-dependent code
- **Flexibility**: Choose the best implementation for your use case
- **Testing**: Easy to create mock adapters for testing

### Example: Database Adapters

Both `usePostgreSQL` and `useMySQL` implement the `database` contract:

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin-system';

// PostgreSQL implementation
const postgresSystem = new StandalonePluginSystem('app', {
  config: { database: { type: 'postgres' } }
});

postgresSystem
  .use(usePostgreSQL)
  .build();

// MySQL implementation
const mysqlSystem = new StandalonePluginSystem('app', {
  config: { database: { type: 'mysql' } }
});

mysqlSystem
  .use(useMySQL)
  .build();

// Both work the same way
await postgresSystem.database.query('SELECT * FROM users');
await mysqlSystem.database.query('SELECT * FROM users');
```

## Contract Lifecycle

### 1. Contract Creation

Contracts are created and registered:

```javascript
import { createFacetContract, defaultContractRegistry } from 'mycelia-kernel-plugin-system';

const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'execute', 'close'],
  requiredProperties: ['_connection']
});

// Register in registry
defaultContractRegistry.register(databaseContract);
```

### 2. Contract Declaration

Hooks and facets declare contracts:

```javascript
export const useDatabase = createHook({
  contract: 'database',  // Declare contract
  // ...
});
```

### 3. Contract Enforcement

Contracts are enforced during build:

```javascript
// During verifySubsystemBuild()
validateFacets(facetsByKind, resolvedCtx, subsystem, defaultContractRegistry);
```

### 4. Contract Validation

Validation checks methods, properties, and custom validation:

```javascript
contract.enforce(ctx, api, subsystem, facet);
// Validates: methods, properties, custom validation
```

## Error Handling

### Contract Not Registered

**Error:**
```
Facet 'custom-database' (from file:///path/to/hook.js) has contract 'database' 
which is not registered in the contract registry.
```

**Fix:** Register the contract in the registry

### Missing Required Methods

**Error:**
```
Facet 'database' (from file:///path/to/hook.js) failed contract validation 
for 'database': FacetContract 'database': facet is missing required methods: close
```

**Fix:** Implement all required methods

### Missing Required Properties

**Error:**
```
Facet 'cache' (from file:///path/to/hook.js) failed contract validation 
for 'cache': FacetContract 'cache': facet is missing required properties: _store
```

**Fix:** Add all required properties

### Custom Validation Failure

**Error:**
```
Facet 'cache' (from file:///path/to/hook.js) failed contract validation 
for 'cache': FacetContract 'cache': validation failed: Cache facet _store must be an object
```

**Fix:** Fix the issue identified by custom validation

## Benefits

### 1. Early Error Detection

Contracts are validated during build, not runtime:

- **Fail-Fast**: Errors caught before initialization
- **No Side Effects**: Validation happens in pure verification phase
- **Clear Errors**: Descriptive error messages identify issues

### 2. Interface Guarantees

Contracts ensure facets match expected interfaces:

- **Method Guarantees**: All required methods are present
- **Property Guarantees**: All required properties exist
- **Type Safety**: Methods are functions, properties exist

### 3. Adapter Support

Contracts enable the adapter pattern:

- **Multiple Implementations**: Different hooks can implement the same contract
- **Swappable**: Adapters can be swapped without breaking code
- **Compatible**: All adapters work with contract-dependent code

### 4. Documentation

Contracts document expected interfaces:

- **Clear Specification**: Contracts define what facets must implement
- **Self-Documenting**: Contract names and requirements are explicit
- **Reference**: Contracts serve as interface documentation

## Usage Patterns

### Pattern 1: Standard Contract Implementation

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useDatabase = createHook({
  kind: 'database',
  contract: 'database',
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      contract: 'database'
    })
    .add({
      // Implement all contract methods
      async query(sql) { /* ... */ },
      async execute(sql) { /* ... */ },
      async close() { /* ... */ }
    });
  }
});
```

### Pattern 2: Adapter Implementation

```javascript
export const useMySQL = createHook({
  kind: 'mysql-database',
  contract: 'database',  // Implements database contract
  fn: (ctx, api, subsystem) => {
    return new Facet('mysql-database', {
      contract: 'database'  // Also implements database contract
    })
    .add({
      // Implement all contract methods
      async query(sql) {
        // MySQL-specific implementation
      },
      async execute(sql) {
        // MySQL-specific implementation
      },
      async close() {
        // MySQL-specific implementation
      }
    });
  }
});
```

### Pattern 3: Custom Contract

```javascript
import { createFacetContract, defaultContractRegistry, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Create custom contract
const customContract = createFacetContract({
  name: 'custom',
  requiredMethods: ['process', 'getStatus'],
  requiredProperties: ['_service']
});

// Register contract
defaultContractRegistry.register(customContract);

// Use in hook
export const useCustom = createHook({
  kind: 'custom',
  contract: 'custom',
  fn: (ctx, api, subsystem) => {
    return new Facet('custom', {
      contract: 'custom'
    })
    .add({
      process() { /* ... */ },
      getStatus() { /* ... */ },
      _service: service
    });
  }
});
```

## Best Practices

### 1. Name Contracts After Facet Kinds

Use the same name as the facet kind:

```javascript
// ✅ Good
contract: 'database'  // Matches kind: 'database'

// ❌ Bad
contract: 'db'  // Doesn't match kind
```

### 2. Declare Contracts Consistently

Declare contracts on both hook and facet:

```javascript
export const useDatabase = createHook({
  contract: 'database',  // Declare on hook
  fn: (ctx, api, subsystem) => {
    return new Facet('database', {
      contract: 'database'  // Also declare on facet
    });
  }
});
```

### 3. Implement All Requirements

Ensure all required methods and properties are implemented:

```javascript
// ✅ Good: All methods implemented
.add({
  query() { /* ... */ },
  execute() { /* ... */ },
  close() { /* ... */ }
});

// ❌ Bad: Missing methods
.add({
  query() { /* ... */ },
  execute() { /* ... */ }
  // Missing: close
});
```

### 4. Use Custom Validation for Complex Checks

Use custom validation for checks beyond simple existence:

```javascript
validate: (ctx, api, subsystem, facet) => {
  // Validate internal structure
  if (typeof facet._store !== 'object') {
    throw new Error('Cache facet _store must be an object');
  }
  if (typeof facet._store.get !== 'function') {
    throw new Error('Cache facet _store must have get method');
  }
}
```

### 5. Register Custom Contracts Early

Register custom contracts before they're needed:

```javascript
// Register before building systems
const customContract = createFacetContract({
  name: 'custom',
  requiredMethods: ['process']
});

defaultContractRegistry.register(customContract);

// Now can use in hooks
system.use(useCustom).build();
```

## Related Documentation

- [Facet Contract](./FACET-CONTRACT.md) - Creating and using facet contracts for validation
- [Facet Contract Registry](./FACET-CONTRACT-REGISTRY.md) - Managing contracts through the registry
- [Hooks and Facets Overview](../core-concepts/HOOKS-AND-FACETS-OVERVIEW.md) - Understanding hooks and facets
- [Hooks Documentation](../core-concepts/HOOKS.md) - Learn how hooks create facets with contracts
- [Facets Documentation](../core-concepts/FACETS.md) - Learn about facets and contract declaration

