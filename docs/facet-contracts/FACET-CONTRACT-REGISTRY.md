# Facet Contract Registry

## Overview

The **FacetContractRegistry** manages a collection of facet contracts, allowing registration and enforcement of contracts on facets by name. The registry provides a centralized way to manage contracts and enforce them consistently throughout the system.

## What is a Facet Contract Registry?

A FacetContractRegistry is a container that:
- **Stores contracts**: Maintains a map of contract names to FacetContract instances
- **Enforces contracts**: Provides methods to enforce contracts on facets by name
- **Manages contract lifecycle**: Supports registration, lookup, and removal of contracts

## Default Registry

The system provides a default registry with all standard contracts pre-registered:

```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

// Check if a contract exists
if (defaultContractRegistry.has('database')) {
  // Contract is available
}

// Enforce a contract
defaultContractRegistry.enforce('database', ctx, api, subsystem, databaseFacet);
```

**Pre-registered contracts:**
- `'hierarchy'` - Hierarchy facet contract
- `'listeners'` - Listeners facet contract
- `'processor'` - Processor facet contract
- `'queue'` - Queue facet contract
- `'router'` - Router facet contract
- `'scheduler'` - Scheduler facet contract
- `'server'` - Server facet contract
- `'storage'` - Storage facet contract
- `'websocket'` - WebSocket facet contract

## Creating a Registry

### Using the Default Registry

For most use cases, use the default registry:

```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

// Use default registry
defaultContractRegistry.enforce('database', ctx, api, subsystem, databaseFacet);
```

### Creating a Custom Registry

You can create a custom registry for specialized use cases:

```javascript
import { FacetContractRegistry, createFacetContract } from 'mycelia-kernel-plugin-system';

const customRegistry = new FacetContractRegistry();

// Register a custom contract
const customContract = createFacetContract({
  name: 'custom',
  requiredMethods: ['process'],
  requiredProperties: []
});

customRegistry.register(customContract);

// Enforce the contract
customRegistry.enforce('custom', ctx, api, subsystem, customFacet);
```

## Registry Methods

### `register(contract)`

Registers a FacetContract instance in the registry.

**Signature:**
```javascript
register(contract: FacetContract): FacetContract
```

**Parameters:**
- `contract` - FacetContract instance to register

**Returns:**
- The registered contract (for chaining)

**Throws:**
- `Error` if contract is invalid
- `Error` if a contract with the same name already exists

**Example:**
```javascript
import { FacetContractRegistry, createFacetContract } from 'mycelia-kernel-plugin-system';

const registry = new FacetContractRegistry();

const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'execute']
});

registry.register(databaseContract);
```

### `has(name)`

Checks if a contract exists for the given name.

**Signature:**
```javascript
has(name: string): boolean
```

**Parameters:**
- `name` - Contract name to check

**Returns:**
- `true` if contract exists, `false` otherwise

**Example:**
```javascript
if (defaultContractRegistry.has('database')) {
  console.log('Database contract is registered');
}
```

### `get(name)`

Gets a contract by name.

**Signature:**
```javascript
get(name: string): FacetContract | undefined
```

**Parameters:**
- `name` - Contract name

**Returns:**
- Contract instance or `undefined` if not found

**Example:**
```javascript
const databaseContract = defaultContractRegistry.get('database');
if (databaseContract) {
  // Use contract directly
  databaseContract.enforce(ctx, api, subsystem, databaseFacet);
}
```

### `enforce(name, ctx, api, subsystem, facet)`

Enforces a contract on a facet by looking up the contract by name and delegating to its `enforce` method.

**Signature:**
```javascript
enforce(
  name: string,
  ctx: Object,
  api: Object,
  subsystem: BaseSubsystem | StandalonePluginSystem,
  facet: Facet
): void
```

**Parameters:**
- `name` - Name of the contract to enforce
- `ctx` - Context object (note: `ctx.ms` is `null` for standalone systems)
- `api` - System API object
- `subsystem` - System instance
- `facet` - Facet to validate

**Throws:**
- `Error` if contract not found
- `Error` if validation fails (delegated to contract's `enforce` method)

**Example:**
```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

// Enforce database contract
defaultContractRegistry.enforce('database', ctx, api, subsystem, databaseFacet);
```

### `remove(name)`

Removes a contract from the registry.

**Signature:**
```javascript
remove(name: string): boolean
```

**Parameters:**
- `name` - Contract name to remove

**Returns:**
- `true` if contract was removed, `false` if not found

**Example:**
```javascript
const removed = defaultContractRegistry.remove('custom');
if (removed) {
  console.log('Custom contract removed');
}
```

### `list()`

Lists all registered contract names.

**Signature:**
```javascript
list(): Array<string>
```

**Returns:**
- Array of contract names

**Example:**
```javascript
const contractNames = defaultContractRegistry.list();
console.log('Registered contracts:', contractNames);
// ['hierarchy', 'listeners', 'processor', 'queue', 'router', 'scheduler', 'server', 'storage', 'websocket']
```

### `size()`

Gets the number of registered contracts.

**Signature:**
```javascript
size(): number
```

**Returns:**
- Number of contracts

**Example:**
```javascript
const count = defaultContractRegistry.size();
console.log(`Registry has ${count} contracts`);
```

### `clear()`

Clears all contracts from the registry.

**Signature:**
```javascript
clear(): void
```

**Example:**
```javascript
defaultContractRegistry.clear();
console.log('Registry cleared');
```

## Usage Patterns

### Pattern: Enforcing Contracts During Build

Contracts can be enforced during system build to validate facets:

```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

// During facet initialization
async function initializeFacet(facet, ctx, api, subsystem) {
  const contractName = facet.getContract();
  
  if (contractName && defaultContractRegistry.has(contractName)) {
    // Enforce contract before initialization
    defaultContractRegistry.enforce(contractName, ctx, api, subsystem, facet);
  }
  
  // Continue with initialization
  await facet.init(ctx, api, subsystem);
}
```

### Pattern: Custom Registry for Testing

Create a custom registry for testing with mock contracts:

```javascript
import { FacetContractRegistry, createFacetContract } from 'mycelia-kernel-plugin-system';

function createTestRegistry() {
  const registry = new FacetContractRegistry();
  
  // Register minimal test contracts
  registry.register(createFacetContract({
    name: 'test',
    requiredMethods: ['testMethod'],
    requiredProperties: []
  }));
  
  return registry;
}
```

### Pattern: Extending Default Registry

You can extend the default registry with custom contracts:

```javascript
import { defaultContractRegistry, createFacetContract } from 'mycelia-kernel-plugin-system';

// Register a custom contract in the default registry
const customContract = createFacetContract({
  name: 'custom',
  requiredMethods: ['process'],
  requiredProperties: []
});

defaultContractRegistry.register(customContract);

// Now can enforce custom contract
defaultContractRegistry.enforce('custom', ctx, api, subsystem, customFacet);
```

### Pattern: Conditional Contract Enforcement

Check for contract existence before enforcing:

```javascript
import { defaultContractRegistry } from 'mycelia-kernel-plugin-system';

function enforceContractIfExists(contractName, ctx, api, subsystem, facet) {
  if (defaultContractRegistry.has(contractName)) {
    defaultContractRegistry.enforce(contractName, ctx, api, subsystem, facet);
  } else {
    console.warn(`Contract '${contractName}' not found, skipping validation`);
  }
}
```

## Error Handling

### Contract Not Found

If you try to enforce a contract that doesn't exist:

```javascript
try {
  defaultContractRegistry.enforce('nonexistent', ctx, api, subsystem, facet);
} catch (error) {
  console.error(error.message);
  // "FacetContractRegistry.enforce: no contract found for name 'nonexistent'"
}
```

### Validation Failure

If contract validation fails, the error is wrapped with context:

```javascript
try {
  defaultContractRegistry.enforce('database', ctx, api, subsystem, invalidFacet);
} catch (error) {
  console.error(error.message);
  // "FacetContract 'database': facet is missing required methods: close, execute"
}
```

### Duplicate Registration

If you try to register a contract with a name that already exists:

```javascript
try {
  defaultContractRegistry.register(existingContract);
} catch (error) {
  console.error(error.message);
  // "FacetContractRegistry.register: contract with name 'database' already exists"
}
```

## Best Practices

1. **Use the default registry**: For standard contracts, use `defaultContractRegistry`

2. **Register contracts early**: Register contracts before they're needed

3. **Check before enforcing**: Use `has()` to check if a contract exists before enforcing

4. **Handle errors gracefully**: Wrap contract enforcement in try-catch blocks

5. **Use descriptive names**: Contract names should clearly identify the facet type

6. **Don't modify default registry in production**: Avoid modifying the default registry in production code; create custom registries instead

7. **Document custom contracts**: Document any custom contracts you create

8. **Don't rely on ctx.ms**: For standalone systems, `ctx.ms` is `null` - don't use it in validation functions

## Integration with System Build

The registry is used during the build process to validate facets:

```javascript
// In facet-validator.js
export function validateFacets(facetsByKind, resolvedCtx, subsystem, contractRegistry) {
  for (const [kind, facet] of Object.entries(facetsByKind)) {
    const contractName = facet.getContract();
    
    if (contractName) {
      if (!contractRegistry.has(contractName)) {
        throw new Error(
          `Facet '${kind}' (from ${facet.getSource()}) has contract '${contractName}' ` +
          `which is not registered in the contract registry.`
        );
      }
      
      try {
        contractRegistry.enforce(contractName, resolvedCtx, subsystem.api, subsystem, facet);
      } catch (error) {
        throw new Error(
          `Facet '${kind}' (from ${facet.getSource()}) failed contract validation ` +
          `for '${contractName}': ${error.message}`
        );
      }
    }
  }
}
```

## See Also

- [Facet Contract](./FACET-CONTRACT.md) - Learn about creating and using facet contracts
- [Facet Contracts Overview](./FACET-CONTRACTS-OVERVIEW.md) - Complete overview of the contract system
- [Facets Documentation](../core-concepts/FACETS.md) - Learn about facets and how contracts are used
- [Hooks Documentation](../core-concepts/HOOKS.md) - Learn about hooks and how to specify contracts
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how contracts are used in standalone systems

