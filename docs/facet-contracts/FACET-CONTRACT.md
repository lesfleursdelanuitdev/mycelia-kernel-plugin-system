# Facet Contract

## Overview

A **FacetContract** defines the interface that facets must satisfy, including required methods, required properties, and optional custom validation logic. Contracts provide runtime validation to ensure facets implement the expected interface, improving system reliability and catching integration errors early.

## What is a Facet Contract?

A FacetContract is a specification that defines:
- **Required Methods**: Methods that must be implemented on the facet
- **Required Properties**: Properties that must exist on the facet
- **Custom Validation**: Optional validation function for additional checks

Contracts are enforced during facet validation to ensure compatibility and correctness.

## Creating a Facet Contract

### Using `createFacetContract` (Recommended)

The `createFacetContract` factory function is the recommended way to create contracts:

```javascript
import { createFacetContract } from 'mycelia-kernel-plugin-system';

const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'execute', 'close'],
  requiredProperties: ['_connection'],
  validate: (ctx, api, subsystem, facet) => {
    // Custom validation
    if (typeof facet._connection !== 'object') {
      throw new Error('Database facet _connection must be an object');
    }
  }
});
```

### Using `FacetContract` Constructor

You can also create contracts directly using the constructor:

```javascript
import { FacetContract } from 'mycelia-kernel-plugin-system';

const databaseContract = new FacetContract(
  'database',
  {
    requiredMethods: ['query', 'execute', 'close'],
    requiredProperties: ['_connection']
  },
  (ctx, api, subsystem, facet) => {
    // Custom validation
    if (typeof facet._connection !== 'object') {
      throw new Error('Database facet _connection must be an object');
    }
  }
);
```

## Contract Parameters

### `name` (string, required)

The unique identifier for the contract. Typically matches the facet kind (e.g., `'database'`, `'cache'`).

**Example:**
```javascript
createFacetContract({
  name: 'database',
  // ...
})
```

### `requiredMethods` (Array<string>, default: `[]`)

An array of method names that must be implemented on the facet. Each method must exist and be a function.

**Example:**
```javascript
createFacetContract({
  name: 'cache',
  requiredMethods: [
    'get',
    'set',
    'delete',
    'clear'
  ],
  // ...
})
```

**Validation:**
- Checks that each method exists on the facet
- Checks that each method is a function
- Throws error listing all missing methods if any are missing

### `requiredProperties` (Array<string>, default: `[]`)

An array of property names that must exist on the facet. Properties can be any value (not just functions).

**Example:**
```javascript
createFacetContract({
  name: 'cache',
  requiredProperties: [
    '_store',
    'maxSize'
  ],
  // ...
})
```

**Validation:**
- Checks that each property exists on the facet (using `in` operator)
- Checks that each property is not `undefined`
- Throws error listing all missing properties if any are missing

### `validate` (Function, default: `null`)

An optional custom validation function that performs additional checks beyond method and property validation.

**Signature:**
```javascript
validate: (ctx, api, subsystem, facet) => void
```

**Parameters:**
- `ctx` - Context object (same as passed to hooks). Note: `ctx.ms` is `null` for standalone systems.
- `api` - System API object
- `subsystem` - System instance (BaseSubsystem or StandalonePluginSystem)
- `facet` - Facet instance to validate

**Example:**
```javascript
createFacetContract({
  name: 'cache',
  requiredMethods: ['get', 'set'],
  requiredProperties: ['_store'],
  validate: (ctx, api, subsystem, facet) => {
    // Validate _store is an object with get method
    if (typeof facet._store !== 'object' || facet._store === null) {
      throw new Error('Cache facet _store must be an object');
    }
    if (typeof facet._store.get !== 'function') {
      throw new Error('Cache facet _store must have get method');
    }
  }
})
```

**Important:**
- Validation function should throw an `Error` if validation fails
- Errors thrown are wrapped with contract name for better error messages
- Validation runs after required methods and properties are checked
- Don't rely on `ctx.ms` in validation - it's `null` for standalone systems

## Enforcing Contracts

### Direct Enforcement

You can enforce a contract directly on a facet:

```javascript
import { databaseContract } from './contracts/database.contract.js';

// Enforce contract on a facet
databaseContract.enforce(ctx, api, subsystem, databaseFacet);
```

**Throws:**
- `Error` if required methods are missing
- `Error` if required properties are missing
- `Error` if custom validation fails

### Registry-Based Enforcement

Contracts are typically enforced through the registry:

```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

// Enforce contract by name
defaultContractRegistry.enforce('database', ctx, api, subsystem, databaseFacet);
```

See [Facet Contract Registry](./FACET-CONTRACT-REGISTRY.md) for more information.

## Contract Structure

### Complete Example

```javascript
import { createFacetContract } from 'mycelia-kernel-plugin-system';

export const customContract = createFacetContract({
  name: 'custom',
  requiredMethods: [
    'process',
    'getStatus',
    'configure'
  ],
  requiredProperties: [
    '_service',
    'config'
  ],
  validate: (ctx, api, subsystem, facet) => {
    // Validate _service is an object
    if (typeof facet._service !== 'object' || facet._service === null) {
      throw new Error('Custom facet _service must be an object');
    }
    
    // Validate config is an object
    if (typeof facet.config !== 'object' || facet.config === null) {
      throw new Error('Custom facet config must be an object');
    }
    
    // Validate _service has required method
    if (typeof facet._service.execute !== 'function') {
      throw new Error('Custom facet _service must have execute method');
    }
  }
});
```

## Error Messages

Contracts provide clear error messages when validation fails:

### Missing Methods

```
FacetContract 'database': facet is missing required methods: close, execute
```

### Missing Properties

```
FacetContract 'cache': facet is missing required properties: _store, maxSize
```

### Custom Validation Failure

```
FacetContract 'cache': validation failed: Cache facet _store must be an object
```

## Using Contracts with Hooks

Contracts are specified in hooks using the `contract` parameter:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useDatabase = createHook({
  kind: 'database',
  contract: 'database',  // Contract name (string)
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // ...
    return new Facet('database', {
      attach: true,
      source: import.meta.url,
      contract: 'database'  // Contract name (string)
    })
    .add({
      // Methods and properties that satisfy the contract
      async query(sql) { /* ... */ },
      async execute(sql) { /* ... */ },
      async close() { /* ... */ },
      _connection: connection
    });
  }
});
```

**Important:**
- The `contract` parameter is a **string** (contract name), not a contract object
- The contract is looked up from the registry when needed
- The contract name typically matches the facet `kind`

## Best Practices

1. **Name contracts after facet kinds**: Use the same name as the facet kind (e.g., `'database'` for database facets)

2. **Be specific with requirements**: List all methods and properties that are part of the public interface

3. **Use custom validation for complex checks**: Use the `validate` function for checks that go beyond simple existence

4. **Document contract requirements**: Include JSDoc comments explaining what each method/property should do

5. **Validate internal structure**: Use custom validation to check internal properties (like `_store`) that other hooks depend on

6. **Throw descriptive errors**: Custom validation should throw clear error messages explaining what's wrong

7. **Register contracts**: Register contracts in the registry so they can be enforced by name

8. **Don't rely on ctx.ms**: For standalone systems, `ctx.ms` is `null` - don't use it in validation

## Common Patterns

### Pattern: Simple Method Contract

```javascript
export const simpleContract = createFacetContract({
  name: 'simple',
  requiredMethods: ['doSomething', 'getStatus'],
  requiredProperties: []
});
```

### Pattern: Contract with Internal Properties

```javascript
export const internalContract = createFacetContract({
  name: 'internal',
  requiredMethods: ['process'],
  requiredProperties: ['_manager'],
  validate: (ctx, api, subsystem, facet) => {
    if (typeof facet._manager !== 'object' || facet._manager === null) {
      throw new Error('Internal facet _manager must be an object');
    }
    if (typeof facet._manager.execute !== 'function') {
      throw new Error('Internal facet _manager must have execute method');
    }
  }
});
```

### Pattern: Contract with Getters

```javascript
export const getterContract = createFacetContract({
  name: 'getter',
  requiredMethods: ['process'],
  requiredProperties: ['value'],  // Getter property
  validate: (ctx, api, subsystem, facet) => {
    // Validate getter returns expected type
    const value = facet.value;
    if (typeof value !== 'number') {
      throw new Error('Getter facet value must return a number');
    }
  }
});
```

### Pattern: Async Validation

```javascript
export const asyncContract = createFacetContract({
  name: 'async',
  requiredMethods: ['process'],
  validate: async (ctx, api, subsystem, facet) => {
    // Note: validate is synchronous, but you can check async properties
    // by accessing them synchronously
    if (facet._initialized === false) {
      throw new Error('Async facet must be initialized');
    }
  }
});
```

## See Also

- [Facet Contract Registry](./FACET-CONTRACT-REGISTRY.md) - Learn about the contract registry system
- [Facet Contracts Overview](./FACET-CONTRACTS-OVERVIEW.md) - Complete overview of the contract system
- [Facets Documentation](../core-concepts/FACETS.md) - Learn about facets and how contracts are used
- [Hooks Documentation](../core-concepts/HOOKS.md) - Learn about hooks and how to specify contracts
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how contracts are used in standalone systems

