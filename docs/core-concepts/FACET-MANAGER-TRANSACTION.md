# Facet Manager Transaction

## Overview

The **FacetManagerTransaction** class provides transactional support for facet operations in the FacetManager. It enables atomic operations where multiple facets can be added together, with automatic rollback if any operation fails.

FacetManagerTransaction ensures:
- **Atomicity**: All facets in a transaction are added together or none are added
- **Rollback Safety**: Failed operations can be cleanly rolled back
- **Nested Transactions**: Support for nested transaction frames
- **Automatic Cleanup**: Disposes and removes facets in reverse order on rollback

## What is FacetManagerTransaction?

FacetManagerTransaction is a helper class that manages transaction state for FacetManager. It tracks which facets are added within a transaction frame and provides rollback capabilities.

**Key Concepts:**
- **Transaction Frame**: A single level of transaction nesting
- **Transaction Stack**: Stack of nested transaction frames
- **Tracked Additions**: List of facet kinds added in the current transaction frame
- **Rollback**: Automatic cleanup of all facets added in a transaction frame

## Creating a FacetManagerTransaction

FacetManagerTransaction is created automatically by FacetManager and is not typically instantiated directly:

```javascript
// Inside FacetManager constructor
this.#txn = new FacetManagerTransaction(this, subsystem);
```

**Constructor Parameters:**
- `facetManager` (FacetManager, required) - The FacetManager instance this transaction manages
- `subsystem` (BaseSubsystem/StandalonePluginSystem, required) - The system instance for disposal operations

## Transaction Frames

A transaction frame represents a single level of transaction nesting. Each frame tracks the facets added within that transaction.

### Transaction Frame Structure

```javascript
frame = {
  added: ['database', 'cache', 'auth']  // Array of facet kinds added in this frame
}
```

### Transaction Stack

The transaction stack (`#txnStack`) is an array of transaction frames, supporting nested transactions:

```javascript
#txnStack = [
  { added: ['database', 'cache'] },      // Outer transaction frame
  { added: ['auth'] }                     // Inner transaction frame
]
```

**Stack Behavior:**
- New frames are pushed onto the stack
- Commits and rollbacks operate on the topmost frame
- Nested transactions are independent

## Transaction Methods

### `beginTransaction()`

Begins a new transaction frame by pushing a new frame onto the transaction stack.

**Signature:**
```javascript
beginTransaction() => void
```

**Behavior:**
- Creates a new transaction frame with an empty `added` array
- Pushes the frame onto `#txnStack`
- Does not throw errors

**Example:**
```javascript
// In FacetManager
this.#txn.beginTransaction();  // Start new transaction frame
```

**Usage:**
Called automatically by `FacetManager.addMany()` or manually when starting a transaction.

### `commit()`

Commits the current transaction frame by removing it from the stack.

**Signature:**
```javascript
commit() => void
```

**Behavior:**
- Removes the topmost transaction frame from the stack
- Does not perform any cleanup (facets remain added)
- Throws an error if no active transaction exists

**Throws:**
- `Error` - If no active transaction exists

**Example:**
```javascript
// In FacetManager
this.#txn.commit();  // Commit current transaction frame
```

**Usage:**
Called automatically by `FacetManager.addMany()` on success, or manually when committing a transaction.

### `rollback()`

Rolls back the current transaction frame by disposing and removing all facets added in that frame.

**Signature:**
```javascript
async rollback() => Promise<void>
```

**Behavior:**
1. Removes the topmost transaction frame from the stack
2. Iterates through `frame.added` in reverse order
3. For each facet kind:
   - Finds the facet using `facetManager.find(kind)`
   - Attempts to dispose the facet (best-effort, errors are ignored)
   - Removes the facet using `facetManager.remove(kind)`

**Throws:**
- `Error` - If no active transaction exists

**Returns:**
- `Promise<void>` - Resolves when rollback is complete

**Example:**
```javascript
// In FacetManager
await this.#txn.rollback();  // Rollback current transaction frame
```

**Usage:**
Called automatically by `FacetManager.addMany()` on failure, or manually when rolling back a transaction.

**Rollback Order:**
Facets are rolled back in reverse order of addition (LIFO - Last In, First Out):

```javascript
// Transaction adds: database, cache, auth
// Rollback removes: auth, cache, database
```

### `trackAddition(kind)`

Tracks that a facet of the given kind was added in the current transaction frame.

**Signature:**
```javascript
trackAddition(kind) => void
```

**Parameters:**
- `kind` (string, required) - The facet kind that was added

**Behavior:**
- Adds the `kind` to the `added` array of the current transaction frame
- Does nothing if no active transaction exists
- Called automatically by `FacetManager.add()` when a facet is added

**Example:**
```javascript
// In FacetManager.add()
this.#txn.trackAddition(kind);  // Track that this facet was added
```

**Usage:**
Called automatically by `FacetManager.add()` - you typically don't call this directly.

### `hasActiveTransaction()`

Checks if there's an active transaction (non-empty transaction stack).

**Signature:**
```javascript
hasActiveTransaction() => boolean
```

**Returns:**
- `boolean` - `true` if there's an active transaction, `false` otherwise

**Example:**
```javascript
if (this.#txn.hasActiveTransaction()) {
  // Transaction is active
}
```

## Interaction with FacetManager

FacetManagerTransaction is tightly integrated with FacetManager. Understanding this relationship is crucial.

### FacetManager Integration

FacetManager creates and uses a FacetManagerTransaction instance:

```javascript
export class FacetManager {
  #txn;  // FacetManagerTransaction instance
  
  constructor(subsystem) {
    this.#txn = new FacetManagerTransaction(this, subsystem);
  }
  
  beginTransaction() {
    this.#txn.beginTransaction();  // Delegate to transaction
  }
  
  commit() {
    this.#txn.commit();  // Delegate to transaction
  }
  
  async rollback() {
    await this.#txn.rollback();  // Delegate to transaction
  }
  
  async add(kind, facet, opts) {
    // ... add facet ...
    this.#txn.trackAddition(kind);  // Track addition
  }
}
```

### Transaction Flow in FacetManager

**Normal Flow (Success):**
```javascript
// 1. Begin transaction
facetManager.beginTransaction();

// 2. Add facets (each call tracks the addition)
await facetManager.add('database', databaseFacet, { init: true });
await facetManager.add('cache', cacheFacet, { init: true });
await facetManager.add('auth', authFacet, { init: true });

// 3. Commit transaction
facetManager.commit();  // All facets remain added
```

**Error Flow (Rollback):**
```javascript
// 1. Begin transaction
facetManager.beginTransaction();

try {
  // 2. Add facets
  await facetManager.add('database', databaseFacet, { init: true });
  await facetManager.add('cache', cacheFacet, { init: true });
  await facetManager.add('auth', authFacet, { init: true });  // Fails!
} catch (error) {
  // 3. Rollback transaction
  await facetManager.rollback();  // All added facets are disposed and removed
  throw error;
}
```

### Automatic Transaction Management

FacetManager's `addMany()` method automatically manages transactions:

```javascript
async addMany(orderedKinds, facetsByKind, opts) {
  this.beginTransaction();  // Start transaction
  try {
    for (const kind of orderedKinds) {
      await this.add(kind, facetsByKind[kind], opts);  // Each add() tracks the addition
    }
    this.commit();  // Commit on success
  } catch (err) {
    await this.rollback();  // Rollback on failure
    throw err;
  }
}
```

**Benefits:**
- Automatic transaction management
- All-or-nothing semantics
- Clean error handling

## Nested Transactions

FacetManagerTransaction supports nested transactions through the transaction stack.

### How Nested Transactions Work

```javascript
// Outer transaction
facetManager.beginTransaction();  // Frame 1: []
try {
  await facetManager.add('database', databaseFacet);  // Frame 1: ['database']
  
  // Inner transaction
  facetManager.beginTransaction();  // Frame 2: []
  try {
    await facetManager.add('cache', cacheFacet);  // Frame 2: ['cache']
    await facetManager.add('auth', authFacet);  // Frame 2: ['cache', 'auth']
    
    facetManager.commit();  // Commit Frame 2
  } catch (error) {
    await facetManager.rollback();  // Rollback Frame 2 only (removes cache, auth)
    throw error;
  }
  
  facetManager.commit();  // Commit Frame 1
} catch (error) {
  await facetManager.rollback();  // Rollback Frame 1 (removes database, cache, auth)
  throw error;
}
```

### Nested Transaction Example

```javascript
async function buildSystem(system) {
  // Outer transaction: core facets
  system.api.__facets.beginTransaction();
  try {
    await system.api.__facets.add('logger', loggerFacet);
    await system.api.__facets.add('database', databaseFacet);
    
    // Inner transaction: optional features
    system.api.__facets.beginTransaction();
    try {
      await system.api.__facets.add('cache', cacheFacet);
      await system.api.__facets.add('monitoring', monitoringFacet);
      
      system.api.__facets.commit();  // Commit inner transaction
    } catch (error) {
      // Rollback only inner transaction (cache, monitoring)
      await system.api.__facets.rollback();
      throw error;
    }
    
    system.api.__facets.commit();  // Commit outer transaction
  } catch (error) {
    // Rollback outer transaction (all facets)
    await system.api.__facets.rollback();
    throw error;
  }
}
```

**Important:** When an outer transaction is rolled back, it only affects facets added in that frame. Inner transactions that were already committed are not affected.

## Rollback Process

Understanding the rollback process is crucial for writing robust code.

### Rollback Steps

When `rollback()` is called:

1. **Get current frame**: Pop the topmost transaction frame from the stack
2. **Iterate in reverse**: Process `frame.added` from last to first
3. **For each facet kind**:
   - Find the facet: `facetManager.find(kind)`
   - Dispose the facet: `facet?.dispose?.(subsystem)` (best-effort, errors ignored)
   - Remove the facet: `facetManager.remove(kind)`

### Rollback Example

```javascript
// Transaction adds facets in this order:
await facetManager.add('database', databaseFacet);      // Tracked: ['database']
await facetManager.add('cache', cacheFacet);            // Tracked: ['database', 'cache']
await facetManager.add('auth', authFacet);               // Tracked: ['database', 'cache', 'auth']

// Rollback processes in reverse order:
// 1. authFacet.dispose() → facetManager.remove('auth')
// 2. cacheFacet.dispose() → facetManager.remove('cache')
// 3. databaseFacet.dispose() → facetManager.remove('database')
```

### Best-Effort Disposal

Rollback uses best-effort disposal - errors during disposal are caught and ignored:

```javascript
try { 
  facet?.dispose?.(this.#subsystem); 
} catch { 
  /* best-effort disposal */ 
}
```

**Rationale:**
- Prevents one failing disposal from blocking others
- Ensures all facets are removed even if disposal fails
- Allows partial cleanup to proceed

## Use Cases

### Use Case: Atomic Facet Addition

The primary use case is ensuring atomic addition of multiple facets:

```javascript
async addMany(orderedKinds, facetsByKind, opts) {
  this.beginTransaction();
  try {
    for (const kind of orderedKinds) {
      await this.add(kind, facetsByKind[kind], opts);
    }
    this.commit();
  } catch (err) {
    await this.rollback();  // All facets added in this transaction are removed
    throw err;
  }
}
```

**Benefits:**
- If any facet fails to initialize, all facets in the transaction are rolled back
- Prevents partial system state
- Ensures system is either fully built or not built at all

### Use Case: Conditional Feature Installation

Use transactions to conditionally install features:

```javascript
async installOptionalFeatures(system) {
  system.api.__facets.beginTransaction();
  try {
    // Try to install optional features
    await system.api.__facets.add('cache', cacheFacet, { init: true });
    await system.api.__facets.add('monitoring', monitoringFacet, { init: true });
    
    system.api.__facets.commit();
    return true;  // Features installed successfully
  } catch (error) {
    // Rollback if any feature fails
    await system.api.__facets.rollback();
    return false;  // Features not installed
  }
}
```

### Use Case: Testing and Mocking

Use transactions for testing scenarios where you need to clean up:

```javascript
async testWithFacets(system) {
  system.api.__facets.beginTransaction();
  try {
    // Add test facets
    await system.api.__facets.add('test-database', testDatabaseFacet);
    await system.api.__facets.add('test-cache', testCacheFacet);
    
    // Run tests
    await runTests(system);
    
    system.api.__facets.commit();
  } catch (error) {
    // Clean up on failure
    await system.api.__facets.rollback();
    throw error;
  } finally {
    // Always clean up test facets
    if (system.api.__facets.hasActiveTransaction()) {
      await system.api.__facets.rollback();
    }
  }
}
```

## Best Practices

1. **Always use transactions for multiple adds**: When adding multiple facets, use `addMany()` which automatically manages transactions.

2. **Handle rollback errors**: Rollback itself can throw errors (e.g., if no active transaction). Handle these appropriately:

   ```javascript
   try {
     await facetManager.rollback();
   } catch (error) {
     if (error.message.includes('no active transaction')) {
       // Transaction already committed or rolled back
     } else {
       throw error;
     }
   }
   ```

3. **Don't mix manual and automatic transactions**: If using `addMany()`, don't manually call `beginTransaction()`/`commit()` around it - `addMany()` handles this.

4. **Use nested transactions carefully**: Nested transactions can be complex. Only use them when you need independent rollback scopes.

5. **Check for active transactions**: Use `hasActiveTransaction()` if you need to check transaction state:

   ```javascript
   if (facetManager.hasActiveTransaction()) {
     // Transaction is active
   }
   ```

6. **Understand rollback order**: Remember that rollback processes facets in reverse order (LIFO).

## Common Patterns

### Pattern: Transaction with Error Handling

```javascript
async function addFacetsSafely(facetManager, facets) {
  facetManager.beginTransaction();
  try {
    for (const [kind, facet] of Object.entries(facets)) {
      await facetManager.add(kind, facet, { init: true, attach: true });
    }
    facetManager.commit();
    return true;
  } catch (error) {
    await facetManager.rollback();
    console.error('Failed to add facets:', error);
    return false;
  }
}
```

### Pattern: Conditional Transaction

```javascript
async function addIfNotExists(facetManager, kind, facet) {
  if (facetManager.has(kind)) {
    return false;  // Already exists
  }
  
  facetManager.beginTransaction();
  try {
    await facetManager.add(kind, facet, { init: true });
    facetManager.commit();
    return true;
  } catch (error) {
    await facetManager.rollback();
    throw error;
  }
}
```

### Pattern: Transaction with Validation

```javascript
async function addFacetsWithValidation(facetManager, facets) {
  // Validate all facets before starting transaction
  for (const [kind, facet] of Object.entries(facets)) {
    if (!facet || typeof facet.getKind !== 'function') {
      throw new Error(`Invalid facet for kind '${kind}'`);
    }
  }
  
  // Now add in transaction
  facetManager.beginTransaction();
  try {
    for (const [kind, facet] of Object.entries(facets)) {
      await facetManager.add(kind, facet, { init: true });
    }
    facetManager.commit();
  } catch (error) {
    await facetManager.rollback();
    throw error;
  }
}
```

## Integration with System Build

FacetManagerTransaction is used during system build to ensure atomic facet installation:

```javascript
// In subsystem-builder.js
export async function buildSubsystem(subsystem, plan) {
  const { resolvedCtx, orderedKinds, facetsByKind } = plan;
  
  subsystem.ctx = resolvedCtx;
  
  // addMany() automatically uses transactions
  await subsystem.api.__facets.addMany(orderedKinds, facetsByKind, {
    init: true,
    attach: true,
    ctx: resolvedCtx,
    api: subsystem.api
  });
  
  // If addMany() fails, all facets are automatically rolled back
}
```

**Benefits:**
- If any facet fails to initialize, the entire build is rolled back
- System is never left in a partially-built state
- Clean error handling and recovery

## Error Handling

### Transaction Errors

**No Active Transaction:**
```javascript
facetManager.commit();  // Error: "FacetManagerTransaction.commit: no active transaction"
facetManager.rollback();  // Error: "FacetManagerTransaction.rollback: no active transaction"
```

**Handling:**
```javascript
try {
  facetManager.commit();
} catch (error) {
  if (error.message.includes('no active transaction')) {
    // Transaction already committed or never started
  } else {
    throw error;
  }
}
```

### Rollback Errors

Rollback uses best-effort disposal, so disposal errors are ignored. However, `remove()` errors could still occur:

```javascript
async rollback() {
  const frame = this.#txnStack.pop();
  for (let i = frame.added.length - 1; i >= 0; i--) {
    const k = frame.added[i];
    const facet = this.#facetManager.find(k);
    try { 
      facet?.dispose?.(this.#subsystem); 
    } catch { 
      /* best-effort disposal - errors ignored */ 
    }
    this.#facetManager.remove(k);  // Could throw, but typically doesn't
  }
}
```

## See Also

- [Facet Manager](./FACET-MANAGER.md) - Learn about FacetManager and how it uses transactions
- [Facets Documentation](./FACETS.md) - Understand facets that are managed in transactions
- [Hooks Documentation](./HOOKS.md) - Learn how hooks create facets that are added in transactions
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how transactions are used in standalone systems

