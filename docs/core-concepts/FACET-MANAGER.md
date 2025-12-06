# Facet Manager

## Overview

The **FacetManager** is responsible for managing the lifecycle of facets within a system. It provides a centralized registry for facets, handles their initialization and disposal, manages transactional operations, and enables transparent access to facets through a Proxy pattern.

FacetManager ensures:
- **Ordered initialization**: Facets are initialized in dependency order
- **Parallel initialization**: Facets at the same dependency level are initialized in parallel
- **Transactional safety**: Failed builds can be rolled back atomically
- **Automatic attachment**: Facets can be automatically attached to the system
- **Resource cleanup**: Proper disposal of all facets when the system is disposed
- **Efficient storage**: Uses a `Map` internally for O(1) lookups and efficient iteration
- **Multiple facets per kind**: Supports multiple facets of the same kind (with orderIndex)

## Creating a FacetManager

FacetManager is created automatically when a system is instantiated:

```javascript
import { FacetManager } from 'mycelia-kernel-plugin-system';

// Inside BaseSubsystem/StandalonePluginSystem constructor
this.api = { 
  name, 
  __facets: new FacetManager(this) 
};
```

The FacetManager is accessible via `system.api.__facets`.

## Proxy Pattern

FacetManager uses a JavaScript Proxy to enable transparent access to facets. This allows you to access facets as if they were direct properties:

```javascript
// Instead of: system.api.__facets.find('database')
// You can use: system.api.__facets.database

const databaseFacet = system.api.__facets.database;
const cacheFacet = system.api.__facets.cache;
```

**Important:** The Proxy only intercepts property access. Method calls are automatically bound:

```javascript
// ✅ Works - property access
const database = system.api.__facets.database;

// ✅ Works - method call
system.api.__facets.add('database', facet);

// ✅ Works - method is auto-bound by Proxy
const add = system.api.__facets.add;
add('database', facet); // Works because Proxy binds functions
```

**Note:** When multiple facets of the same kind exist, the Proxy returns the facet with the highest `orderIndex` (most recently added).

## Working with Facets

### Adding Facets

#### `add(kind, facet, opts)`

Adds a single facet to the manager. This is the primary method for registering facets.

**Signature:**
```javascript
async add(kind, facet, opts = { 
  init: false, 
  attach: false, 
  ctx: undefined, 
  api: undefined 
})
```

**Parameters:**
- `kind` (string, required) - The facet kind identifier (e.g., 'database', 'cache')
- `facet` (object, required) - The facet instance (must be a Facet instance)
- `opts` (object, optional) - Options object:
  - `init` (boolean, default: `false`) - Whether to initialize the facet immediately
  - `attach` (boolean, default: `false`) - Whether to attach the facet to the system
  - `ctx` (object, optional) - Context object to pass to `facet.init()`. See [Hook Function Context](../api-reference/HOOK-FUNCTION-CONTEXT.md)
  - `api` (object, optional) - API object to pass to `facet.init()`. See [Hook Function API Parameter](../api-reference/HOOK-FUNCTION-API-PARAM.md)

**Returns:** `Promise<boolean>` - Always resolves to `true` on success

**Process:**
1. Validates inputs (kind must be string, facet must be object)
2. Checks for duplicate facets (throws if facet with same kind exists, unless overwrite is allowed)
3. Registers the facet in the internal Map-based registry
4. Tracks the addition for transaction rollback (if in a transaction)
5. Initializes the facet (if `opts.init === true`)
6. Attaches the facet to system (if `opts.attach === true` and `facet.shouldAttach()`)

**Error Handling:**
- If initialization fails, the facet is automatically disposed and removed
- Throws an error if kind is invalid, facet is invalid, or duplicate exists

**Example:**
```javascript
const databaseFacet = new Facet('database', { attach: true, source: import.meta.url })
  .add({ /* methods */ });

await facetManager.add('database', databaseFacet, {
  init: true,
  attach: true,
  ctx: { ms: null, config: {}, debug: false },
  api: system.api
});
```

#### `addMany(orderedKinds, facetsByKind, opts)`

Adds multiple facets in a single transactional operation. This is the preferred method during system build. Facets at the same dependency level are initialized in parallel for better performance.

**Signature:**
```javascript
async addMany(orderedKinds, facetsByKind, opts = { 
  init: true, 
  attach: true, 
  ctx: undefined, 
  api: undefined 
})
```

**Parameters:**
- `orderedKinds` (Array<string>, required) - Array of facet kinds in initialization order (topologically sorted)
- `facetsByKind` (Object, required) - Map of kind → facet instance
- `opts` (object, optional) - Same options as `add()`

**Returns:** `Promise<void>`

**Process:**
1. Begins a transaction
2. Groups facets by dependency level
3. For each level:
   - Registers all facets at that level
   - Initializes all facets in parallel
   - Attaches facets (if `attach: true`)
4. Commits the transaction on success
5. Rolls back all facets on any failure

**Performance:** Facets at the same dependency level are initialized in parallel, significantly improving build performance for systems with many independent facets.

**Example:**
```javascript
const orderedKinds = ['logger', 'database', 'cache', 'auth'];
const facetsByKind = {
  logger: loggerFacet,
  database: databaseFacet,
  cache: cacheFacet,
  auth: authFacet
};

await facetManager.addMany(orderedKinds, facetsByKind, {
  init: true,
  attach: true,
  ctx: resolvedCtx,
  api: system.api
});
```

### Facet Initialization

When a facet is initialized via `add()` or `addMany()`, the FacetManager calls `facet.init()` with specific parameters.

#### Expected Inputs to `facet.init()`

The `init()` method on a facet receives three parameters:

```javascript
async facet.init(ctx, api, subsystem)
```

**Parameters:**

1. **`ctx` (object)** - The resolved context object containing:
   - `ms` - Message system instance (optional, `null` for standalone systems)
   - `config` - Configuration object keyed by facet kind
   - `debug` - Debug flag
   
   **Example:**
   ```javascript
   ctx = {
     ms: null,  // null for standalone systems
     config: {
       database: { host: 'localhost', port: 5432 },
       cache: { maxSize: 1000 }
     },
     debug: false
   }
   ```

2. **`api` (object)** - The system API object containing:
   - `name` - System name
   - `__facets` - Reference to the FacetManager itself
   
   **Example:**
   ```javascript
   api = {
     name: 'my-app',
     __facets: facetManagerInstance
   }
   ```

3. **`subsystem` (BaseSubsystem/StandalonePluginSystem)** - The system instance itself

**Important:** These parameters are passed automatically by FacetManager. You don't need to call `init()` manually - it's handled during the `add()` or `addMany()` process.

**Example: Facet with onInit callback**

```javascript
return new Facet('database', { attach: true, source: import.meta.url })
  .add({
    async query(sql) {
      return this.connection.query(sql);
    }
  })
  .onInit(async ({ ctx, api, subsystem, facet }) => {
    // ctx contains ms (null for standalone), config, debug
    const dbConfig = ctx.config?.database || {};
    
    // api contains name and __facets
    console.log(`Initializing database for ${api.name}`);
    
    // subsystem is the full system instance
    this.connection = await createConnection(dbConfig);
    
    // facet is the facet instance itself
    facet._initialized = true;
  });
```

### Finding Facets

#### `find(kind, orderIndex)`

Finds a facet by its kind identifier. If multiple facets of the same kind exist, returns the one with the highest `orderIndex` by default, or a specific one if `orderIndex` is provided.

**Signature:**
```javascript
find(kind, orderIndex = undefined)
```

**Parameters:**
- `kind` (string, required) - The facet kind to find
- `orderIndex` (number, optional) - Optional order index. If provided, returns the facet with that exact `orderIndex` value (set during build based on topological sort order). If not, returns the facet with the highest orderIndex.

**Returns:** `Facet | undefined` - The facet instance or `undefined` if not found

**Important:** The `orderIndex` parameter searches by the facet's `orderIndex` property (topological sort order), not by array position. To access facets by their insertion order in the array, use `getByIndex()` instead.

**Example:**
```javascript
// Get the facet with highest orderIndex (default)
const databaseFacet = facetManager.find('database');

// Get a specific facet by orderIndex (topological sort order)
// Note: This searches for a facet with orderIndex === 0, not the first facet in the array
const databaseFacetV1 = facetManager.find('database', 0);

if (databaseFacet) {
  await databaseFacet.query('SELECT * FROM users');
}
```

**Note:** You can also use Proxy access: `facetManager.database` (returns the facet with highest orderIndex)

#### `getByIndex(kind, index)`

Gets a facet by its zero-based index in the array of facets of that kind (insertion order).

**Signature:**
```javascript
getByIndex(kind, index)
```

**Parameters:**
- `kind` (string, required) - The facet kind
- `index` (number, required) - Zero-based index in the array (insertion order)

**Returns:** `Facet | undefined` - The facet instance or `undefined` if not found

**Important:** This method accesses facets by their position in the internal array (insertion order), not by `orderIndex`. Use this when you need to access facets in the order they were added. Use `find(kind, orderIndex)` if you need to find a facet by its topological sort order.

**Example:**
```javascript
// Get the first facet of this kind (by insertion order)
const firstDatabase = facetManager.getByIndex('database', 0);

// Get the second facet of this kind (by insertion order)
const secondDatabase = facetManager.getByIndex('database', 1);
```

#### `has(kind)`

Checks if a facet with the given kind exists.

**Signature:**
```javascript
has(kind)
```

**Parameters:**
- `kind` (string, required) - The facet kind to check

**Returns:** `boolean` - `true` if facet exists, `false` otherwise

**Example:**
```javascript
if (facetManager.has('database')) {
  console.log('Database facet is available');
}
```

#### `getCount(kind)`

Gets the count of facets of the given kind.

**Signature:**
```javascript
getCount(kind)
```

**Parameters:**
- `kind` (string, required) - The facet kind to check

**Returns:** `number` - Number of facets of this kind (0 if none, 1 if single, >1 if multiple)

**Example:**
```javascript
const count = facetManager.getCount('database');
if (count > 1) {
  console.log(`Multiple database facets found: ${count}`);
}
```

#### `hasMultiple(kind)`

Checks if there are multiple facets of the given kind.

**Signature:**
```javascript
hasMultiple(kind)
```

**Parameters:**
- `kind` (string, required) - The facet kind to check

**Returns:** `boolean` - `true` if there are multiple facets of this kind

**Example:**
```javascript
if (facetManager.hasMultiple('database')) {
  console.log('Multiple database facets detected');
}
```

### Attaching Facets

#### `attach(facetKind)`

Manually attaches a facet to the system instance. This makes the facet accessible as a property on the system.

**Signature:**
```javascript
attach(facetKind)
```

**Parameters:**
- `facetKind` (string, required) - The facet kind to attach

**Returns:** `Facet` - The attached facet instance

**Process:**
1. Finds the facet (returns the one with highest orderIndex if multiple exist)
2. Checks if property already exists on system (throws if it does, unless overwrite is allowed)
3. Attaches facet as `system[facetKind]`
4. Logs attachment if debug is enabled

**Example:**
```javascript
// Facet is registered but not attached
await facetManager.add('database', databaseFacet, { init: true, attach: false });

// Later, manually attach it
facetManager.attach('database');

// Now accessible as: system.database
```

**Note:** If `add()` is called with `attach: true` and `facet.shouldAttach()` returns `true`, attachment happens automatically.

### Removing Facets

#### `remove(kind)`

Removes all facets of the given kind from the manager and detaches them from the system. Automatically disposes all facets before removal.

**Signature:**
```javascript
remove(kind)
```

**Parameters:**
- `kind` (string, required) - The facet kind to remove

**Returns:** `boolean` - `true` if facets were removed, `false` if not found

**Process:**
1. Disposes all facets of this kind (best-effort)
2. Removes facets from internal Map-based registry
3. Removes property from system (if attached)

**Example:**
```javascript
const removed = facetManager.remove('database');
if (removed) {
  console.log('Database facet removed');
}
```

**Important:** This automatically disposes all facets of the given kind before removal.

### Querying Facets

#### `getAllKinds()`

Returns an array of all registered facet kinds.

**Signature:**
```javascript
getAllKinds()
```

**Returns:** `Array<string>` - Array of facet kind identifiers

**Example:**
```javascript
const kinds = facetManager.getAllKinds();
console.log('Registered facets:', kinds);
// ['logger', 'database', 'cache', 'auth']
```

#### `getAll()`

Returns a copy of all facets as an object. For each kind, returns the facet with the highest orderIndex (most recently added).

**Signature:**
```javascript
getAll()
```

**Returns:** `Object` - Object mapping kind → facet instance (highest orderIndex)

**Note:** FacetManager uses a `Map` internally for efficient storage. This method converts the Map to a plain object for compatibility with code expecting an object.

**Example:**
```javascript
const allFacets = facetManager.getAll();
for (const [kind, facet] of Object.entries(allFacets)) {
  console.log(`${kind}:`, facet.getKind());
}
```

#### `size()`

Returns the number of unique facet kinds (not the total number of facets).

**Signature:**
```javascript
size()
```

**Returns:** `number` - Count of unique facet kinds

**Example:**
```javascript
const count = facetManager.size();
console.log(`Managing ${count} facet kinds`);
```

#### `clear()`

Removes all facets from the manager. Automatically disposes all facets before clearing.

**Signature:**
```javascript
clear()
```

**Returns:** `void`

**Warning:** This disposes and removes all facets. Use with caution.

**Example:**
```javascript
facetManager.clear();
console.log(facetManager.size()); // 0
```

## Transaction Management

FacetManager supports transactional operations to ensure atomicity when adding multiple facets. Transaction management is handled by the `FacetManagerTransaction` class. For complete details on transactions, see [Facet Manager Transaction](./FACET-MANAGER-TRANSACTION.md).

### Transaction Methods

#### `beginTransaction()`

Begins a new transaction frame. All facets added after this call are tracked and can be rolled back. Delegates to `FacetManagerTransaction.beginTransaction()`.

**Signature:**
```javascript
beginTransaction()
```

**Returns:** `void`

**Example:**
```javascript
facetManager.beginTransaction();
try {
  await facetManager.add('database', databaseFacet, { init: true });
  await facetManager.add('cache', cacheFacet, { init: true });
  facetManager.commit();
} catch (error) {
  await facetManager.rollback();
  throw error;
}
```

#### `commit()`

Commits the current transaction frame. Facets added in this transaction are now permanent. Delegates to `FacetManagerTransaction.commit()`.

**Signature:**
```javascript
commit()
```

**Returns:** `void`

**Throws:** Error if no active transaction

#### `rollback()`

Rolls back the current transaction frame. All facets added in this transaction are disposed and removed in reverse order. Delegates to `FacetManagerTransaction.rollback()`.

**Signature:**
```javascript
async rollback()
```

**Returns:** `Promise<void>`

**Process:**
1. Gets the current transaction frame
2. Iterates through added facets in reverse order
3. Calls `facet.dispose()` for each facet (best-effort)
4. Removes each facet from the registry
5. Removes transaction frame

**Throws:** Error if no active transaction

**See Also:** [Facet Manager Transaction](./FACET-MANAGER-TRANSACTION.md) for detailed information on the rollback process.

**Example:**
```javascript
facetManager.beginTransaction();
try {
  await facetManager.add('database', databaseFacet, { init: true });
  await facetManager.add('cache', cacheFacet, { init: true });
  
  // If anything fails, rollback everything
  if (someCondition) {
    throw new Error('Build failed');
  }
  
  facetManager.commit();
} catch (error) {
  // All facets added in this transaction are automatically disposed and removed
  await facetManager.rollback();
  throw error;
}
```

### Nested Transactions

Transactions can be nested. Each `beginTransaction()` creates a new frame on the stack. For detailed information on nested transactions, see [Facet Manager Transaction](./FACET-MANAGER-TRANSACTION.md#nested-transactions).

```javascript
facetManager.beginTransaction(); // Frame 1
try {
  await facetManager.add('database', databaseFacet);
  
  facetManager.beginTransaction(); // Frame 2
  try {
    await facetManager.add('cache', cacheFacet);
    facetManager.commit(); // Commit Frame 2
  } catch (error) {
    await facetManager.rollback(); // Rollback Frame 2 only
  }
  
  facetManager.commit(); // Commit Frame 1
} catch (error) {
  await facetManager.rollback(); // Rollback Frame 1 (includes Frame 2's work)
}
```

## Legacy Helpers

### `initAll(subsystem)`

Legacy helper that initializes all facets. This is typically not needed as `addMany()` handles initialization automatically.

**Signature:**
```javascript
async initAll(subsystem)
```

**Parameters:**
- `subsystem` (BaseSubsystem/StandalonePluginSystem) - The system instance

**Returns:** `Promise<void>`

**Note:** This method does NOT pass `ctx` or `api` to `facet.init()`. It only passes the subsystem. This is a legacy method and should not be used in new code.

### `disposeAll(subsystem)`

Disposes all facets and clears the registry. This is called automatically during system disposal.

**Signature:**
```javascript
async disposeAll(subsystem)
```

**Parameters:**
- `subsystem` (BaseSubsystem/StandalonePluginSystem) - The system instance

**Returns:** `Promise<void>`

**Process:**
1. Iterates through all facets
2. Calls `facet.dispose()` for each (best-effort, errors are collected)
3. Logs errors if debug is enabled
4. Clears the registry

**Example:**
```javascript
// Called automatically during system.dispose()
await facetManager.disposeAll(system);
```

## Integration with System Build

FacetManager is tightly integrated with the system build process:

### Build Process Flow

1. **Verification Phase** (`verifySubsystemBuild`):
   - Hooks are executed to create facets
   - Dependencies are resolved
   - Topological sort determines initialization order

2. **Execution Phase** (`buildSubsystem`):
   - FacetManager receives ordered facets
   - `addMany()` is called with `init: true, attach: true`
   - Facets are grouped by dependency level
   - Facets at the same level are initialized in parallel
   - Transaction ensures atomicity
   - All facets are initialized and attached

**Example from build process:**

```javascript
// In subsystem-builder.js
export async function buildSubsystem(subsystem, plan) {
  const { resolvedCtx, orderedKinds, facetsByKind } = plan;
  
  subsystem.ctx = resolvedCtx;
  
  // FacetManager handles initialization and attachment
  // Facets at the same dependency level are initialized in parallel
  await subsystem.api.__facets.addMany(orderedKinds, facetsByKind, {
    init: true,
    attach: true,
    ctx: resolvedCtx,      // Passed to facet.init(ctx, api, subsystem)
    api: subsystem.api     // Passed to facet.init(ctx, api, subsystem)
  });
  
  await buildChildren(subsystem);
}
```

## Best Practices

1. **Use `addMany()` for builds**: Always use `addMany()` during system build to ensure transactional safety and parallel initialization.

2. **Don't call `init()` manually**: Let FacetManager handle initialization through `add()` or `addMany()`.

3. **Use transactions for multiple adds**: When adding multiple facets manually, use transactions:
   ```javascript
   facetManager.beginTransaction();
   try {
     await facetManager.add('database', databaseFacet);
     await facetManager.add('cache', cacheFacet);
     facetManager.commit();
   } catch (error) {
     await facetManager.rollback();
   }
   ```

4. **Access facets via Proxy**: Use the Proxy pattern for cleaner code:
   ```javascript
   // ✅ Preferred
   const database = system.api.__facets.database;
   
   // ✅ Also works
   const database = system.api.__facets.find('database');
   ```

5. **Check existence before use**: Always check if a facet exists before using it:
   ```javascript
   const databaseFacet = system.find('database');
   if (databaseFacet) {
     await databaseFacet.query('SELECT * FROM users');
   }
   ```

6. **Use iteration for bulk operations**: FacetManager is iterable, making it efficient to process all facets:
   ```javascript
   // Iterate over all facets
   for (const [kind, facets] of facetManager) {
     // facets is an array if multiple exist, or a single facet
     const facet = Array.isArray(facets) ? facets[facets.length - 1] : facets;
     // Process facet
   }
   ```

7. **Handle multiple facets**: If you need to support multiple facets of the same kind, use `getByIndex()` or `find(kind, orderIndex)`:
   ```javascript
   // Get all database facets
   const count = facetManager.getCount('database');
   for (let i = 0; i < count; i++) {
     const dbFacet = facetManager.getByIndex('database', i);
     // Process each facet
   }
   ```

## Common Patterns

### Pattern: Conditional Facet Access

```javascript
const databaseFacet = system.api.__facets.database;
if (databaseFacet) {
  await databaseFacet.query('SELECT * FROM users');
} else {
  throw new Error('Database facet not available');
}
```

### Pattern: Iterating Over All Facets

FacetManager is iterable and supports direct iteration over facets:

```javascript
// Direct iteration (FacetManager implements Symbol.iterator)
for (const [kind, facets] of system.api.__facets) {
  // Handle both single facet and array of facets
  const facet = Array.isArray(facets) ? facets[facets.length - 1] : facets;
  console.log(`Facet ${kind}:`, facet.getKind());
}

// Convert to array
const facetEntries = [...system.api.__facets];
// [[kind1, facet1], [kind2, facet2], ...]
```

**Note:** FacetManager uses a `Map` internally, so iteration order is insertion order (the order facets were added).

### Pattern: Manual Facet Management

```javascript
// Add facet without auto-init/attach
await facetManager.add('custom', customFacet, { 
  init: false, 
  attach: false 
});

// Later, initialize manually
await customFacet.init(ctx, api, system);

// Then attach
facetManager.attach('custom');
```

### Pattern: Multiple Facets of Same Kind

```javascript
// Add first database facet
await facetManager.add('database', databaseFacetV1, { init: true });

// Add second database facet (with overwrite allowed)
const databaseFacetV2 = new Facet('database', { 
  overwrite: true,
  source: import.meta.url 
})
.add({ /* methods */ });

await facetManager.add('database', databaseFacetV2, { init: true });

// Access specific facets by array index (insertion order)
const v1 = facetManager.getByIndex('database', 0); // First facet (by insertion order)
const v2 = facetManager.getByIndex('database', 1); // Second facet (by insertion order)
const latest = facetManager.find('database'); // Latest (highest orderIndex)

// Note: find(kind, orderIndex) searches by orderIndex property (topological sort order),
// not by array position. Use getByIndex() to access by insertion order.
```

## Error Handling

FacetManager provides robust error handling:

1. **Validation errors**: Thrown immediately for invalid inputs
2. **Duplicate errors**: Thrown when adding a facet with an existing kind (unless overwrite is allowed)
3. **Init errors**: Caught and trigger automatic rollback
4. **Dispose errors**: Collected and logged (best-effort cleanup)

**Example error handling:**

```javascript
try {
  await facetManager.add('database', databaseFacet, { init: true });
} catch (error) {
  if (error.message.includes('already exists')) {
    console.error('Facet already registered');
  } else if (error.message.includes('init')) {
    console.error('Facet initialization failed:', error);
    // Facet was automatically disposed and removed
  } else {
    throw error;
  }
}
```

## See Also

- [Facet Manager Transaction](./FACET-MANAGER-TRANSACTION.md) - Complete guide to transaction management in FacetManager
- [Facet Init Callback](./FACET-INIT-CALLBACK.md) - Complete guide to the init callback that FacetManager calls during initialization
- [Hooks Documentation](./HOOKS.md) - Complete guide to hooks and how they create facets managed by FacetManager
- [Hook Function API Parameter](../api-reference/HOOK-FUNCTION-API-PARAM.md) - Learn how to access facets through `api.__facets`
- [Hook Function Subsystem Parameter](../api-reference/HOOK-FUNCTION-SUBSYSTEM-PARAM.md) - Learn how to use `system.find()` to access facets in facet methods
- [Hook Function Context](../api-reference/HOOK-FUNCTION-CONTEXT.md) - Understand the context object passed during initialization
- [Facets Documentation](./FACETS.md) - Learn about the Facet class
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how FacetManager is used in standalone systems

