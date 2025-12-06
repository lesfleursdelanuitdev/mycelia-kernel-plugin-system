# BaseSubsystem

## Overview

The **BaseSubsystem** class is the foundational building block of the Mycelia Plugin System. It provides a flexible, extensible architecture for creating plugin containers that can manage facets, handle lifecycle, and support hierarchical structures.

**Key Features:**
- **Hook-Based Architecture**: Extend functionality through hooks that create facets
- **Facet Management**: Automatic management of facets through FacetManager
- **Hierarchical Structure**: Support for parent-child subsystem relationships
- **Lifecycle Management**: Built-in build and dispose lifecycle
- **Extensibility**: Base class for creating custom subsystem types

## What is BaseSubsystem?

`BaseSubsystem` is a base class that provides the foundation for all plugin containers in the Mycelia Plugin System. It manages:

- **Hooks**: Functions that create facets to extend functionality
- **Facets**: Objects that provide specific capabilities (database, cache, logger, etc.)
- **Context**: Configuration and system services
- **Lifecycle**: Build and dispose operations
- **Hierarchy**: Parent-child relationships
- **State**: Built status and capabilities

**Architecture:**
```
BaseSubsystem
├─ Hooks (hooks array)
│  └─ Create Facets
├─ FacetManager (api.__facets)
│  └─ Manages Facets
├─ SubsystemBuilder (_builder)
│  └─ Orchestrates Build
└─ Context (ctx)
   └─ Configuration & Services
```

## When to Use BaseSubsystem

### Use BaseSubsystem When:

- **Extending the system**: Creating custom subsystem types
- **Building specialized containers**: Need more control than `StandalonePluginSystem` provides
- **Hierarchical systems**: Creating parent-child subsystem relationships
- **Custom lifecycle**: Need custom build or dispose logic

### Use StandalonePluginSystem When:

- **Simple plugin systems**: Just need a plugin container
- **No customization needed**: Standard plugin system behavior is sufficient
- **Quick setup**: Want the simplest possible API

## Constructor

### Signature

```javascript
new BaseSubsystem(name, options = {})
```

### Parameters

#### `name` (string, required)

The unique name for the subsystem. This name is used for:
- Identification and logging
- Hierarchy path construction
- API object (`api.name`)

**Validation:**
- Must be a non-empty string
- Throws `Error` if invalid

**Example:**
```javascript
const subsystem = new BaseSubsystem('my-subsystem', {
  config: { database: { host: 'localhost' } }
});
```

#### `options` (object, optional)

Configuration options for the subsystem.

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `ms` | Object \| null | `null` | Optional message system instance (for compatibility, not required for standalone) |
| `config` | Object | `{}` | Configuration object keyed by facet kind. Each key corresponds to a facet kind (e.g., 'database', 'cache'). Each value is the configuration object for that specific hook/facet. |
| `debug` | boolean | `false` | Enable debug logging |
| `defaultHooks` | Array | `undefined` | Array of default hooks to register automatically |

**Example:**
```javascript
const subsystem = new BaseSubsystem('my-app', {
  config: {
    database: {
      host: 'localhost',
      port: 5432
    },
    cache: {
      maxSize: 1000
    }
  },
  debug: true
});
```

## Core Methods

### Hook Registration

#### `use(hook)`

Register a hook to be executed during build.

**Parameters:**
- `hook` (Function, required) - Hook function created with `createHook()`

**Returns:** `BaseSubsystem` - Returns `this` for method chaining

**Throws:**
- `Error` if called after `build()`
- `Error` if hook is not a function

**Example:**
```javascript
import { BaseSubsystem, createHook } from 'mycelia-kernel-plugin-system';

const useDatabase = createHook({
  kind: 'database',
  // ...
});

const system = new BaseSubsystem('my-app');
system.use(useDatabase);
```

### Lifecycle Callbacks

#### `onInit(callback)`

Register a callback to be executed after the system is built.

**Parameters:**
- `callback` (Function, required) - Callback function with signature `(api, ctx) => Promise<void>`

**Returns:** `BaseSubsystem` - Returns `this` for method chaining

**Throws:**
- `Error` if callback is not a function

**Example:**
```javascript
system.onInit(async (api, ctx) => {
  console.log('System initialized:', api.name);
  // Access facets via api.__facets
  const db = api.__facets.database;
  await db.connect();
});
```

#### `onDispose(callback)`

Register a callback to be executed during disposal.

**Parameters:**
- `callback` (Function, required) - Callback function with signature `() => Promise<void>`

**Returns:** `BaseSubsystem` - Returns `this` for method chaining

**Throws:**
- `Error` if callback is not a function

**Example:**
```javascript
system.onDispose(async () => {
  console.log('System disposing...');
  // Cleanup code
});
```

### Facet Access

#### `find(kind, orderIndex?)`

Find a facet by kind and optional order index.

**Parameters:**
- `kind` (string, required) - Facet kind to find
- `orderIndex` (number, optional) - Optional order index. If provided, returns facet at that index. If not, returns the last facet (highest orderIndex).

**Returns:** `Object | undefined` - Facet instance or `undefined` if not found

**Example:**
```javascript
// Get the latest facet of a kind
const database = system.find('database');

// Get a specific facet by order index
const firstDatabase = system.find('database', 0);
```

#### `getByIndex(kind, index)`

Get a facet by its index in the array of facets of that kind.

**Parameters:**
- `kind` (string, required) - Facet kind to find
- `index` (number, required) - Zero-based index in the array of facets of this kind

**Returns:** `Object | undefined` - Facet instance or `undefined` if not found

**Example:**
```javascript
// Get the first facet added (by insertion order)
const firstLogger = system.getByIndex('logger', 0);

// Get the second facet added
const secondLogger = system.getByIndex('logger', 1);
```

### Lifecycle

#### `build(ctx?)`

Build the subsystem by executing all registered hooks and initializing facets.

**Parameters:**
- `ctx` (Object, optional) - Additional context to merge with existing context

**Returns:** `Promise<BaseSubsystem>` - Promise that resolves to the built subsystem

**Behavior:**
- Idempotent: Returns immediately if already built
- Creates dependency graph cache if not provided
- Executes hooks in dependency order
- Initializes facets via `onInit` callbacks
- Calls registered `onInit` callbacks

**Example:**
```javascript
await system
  .use(useDatabase)
  .use(useCache)
  .build();

// System is now built and ready to use
const db = system.find('database');
```

#### `dispose()`

Dispose of the subsystem, cleaning up all resources.

**Returns:** `Promise<void>` - Promise that resolves when disposal is complete

**Behavior:**
- Waits for build to complete if still building
- Disposes child subsystems first
- Disposes all facets via `FacetManager.disposeAll()`
- Calls registered `onDispose` callbacks
- Resets built state

**Example:**
```javascript
await system.dispose();
// All resources are cleaned up
```

#### `reload()`

Reload the subsystem: dispose all facets and reset built state, while preserving hooks and configuration. Allows adding more hooks and rebuilding.

**Returns:** `Promise<BaseSubsystem>` - Promise that resolves to the subsystem (for chaining)

**Behavior:**
- Waits for any in-progress build or dispose operations
- Disposes all facets and child subsystems (clean slate)
- Resets built state to `false` (allows `use()` to work again)
- Invalidates builder cache (forces recalculation on next build)
- **Preserves:** hooks, defaultHooks, context, and lifecycle callbacks
- Perfect for hot reloading and incremental plugin extension

**Example:**
```javascript
// Initial build
await system.use(useDatabase).build();

// Hot reload - add more plugins
await system.reload();
await system.use(useCache).use(useAuth).build();

// All plugins (old + new) are now active
const db = system.find('database');  // From initial build
const cache = system.find('cache');  // Added after reload
const auth = system.find('auth');    // Added after reload
```

**Use Cases:**
- **Hot Reloading**: Reload plugins during development
- **Incremental Extension**: Add plugins to an already-built system
- **Configuration Updates**: Rebuild with new configuration
- **Plugin Updates**: Replace or extend existing plugins

## Hierarchy Management

`BaseSubsystem` supports hierarchical subsystem relationships through parent-child links.

### Methods

#### `setParent(parent)`

Assign a parent subsystem.

**Parameters:**
- `parent` (BaseSubsystem | null, required) - Parent subsystem or `null` to remove parent

**Returns:** `BaseSubsystem` - Returns `this` for method chaining

**Example:**
```javascript
const parent = new BaseSubsystem('parent');
const child = new BaseSubsystem('child');
child.setParent(parent);
```

#### `getParent()`

Retrieve the parent subsystem.

**Returns:** `BaseSubsystem | null` - Parent subsystem or `null` if no parent

**Example:**
```javascript
const parent = child.getParent();
```

#### `isRoot()`

Check if this subsystem has no parent (i.e., is top-level).

**Returns:** `boolean` - `true` if root, `false` otherwise

**Example:**
```javascript
if (system.isRoot()) {
  console.log('This is the root subsystem');
}
```

#### `getRoot()`

Get the root subsystem by traversing up the parent chain.

**Returns:** `BaseSubsystem` - Root subsystem

**Example:**
```javascript
const root = child.getRoot();
// root is the top-level subsystem in the hierarchy
```

#### `getNameString()`

Get a fully-qualified subsystem name string.

**Returns:** `string` - Fully-qualified name

**Examples:**
```javascript
// Root subsystem "kernel" → "kernel://"
const root = new BaseSubsystem('kernel');
root.getNameString(); // "kernel://"

// Child subsystem "cache" under "kernel" → "kernel://cache"
const cache = new BaseSubsystem('cache');
cache.setParent(root);
cache.getNameString(); // "kernel://cache"

// Grandchild "manager" → "kernel://cache/manager"
const manager = new BaseSubsystem('manager');
manager.setParent(cache);
manager.getNameString(); // "kernel://cache/manager"
```

## State Properties

### `isBuilt` (getter)

Check if the subsystem has been built.

**Returns:** `boolean` - `true` if built, `false` otherwise

**Example:**
```javascript
if (system.isBuilt) {
  console.log('System is ready');
}
```

### `capabilities` (getter)

Get an array of all facet kinds (capabilities) available on this subsystem.

**Returns:** `Array<string>` - Array of facet kind names

**Example:**
```javascript
const capabilities = system.capabilities;
console.log('Available capabilities:', capabilities);
// ['database', 'cache', 'logger']
```

## Context Object

The `ctx` (context) object is available throughout the subsystem lifecycle.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `ms` | Object \| null | Optional message system instance |
| `config` | Object | Configuration object keyed by facet kind |
| `debug` | boolean | Debug flag |
| `graphCache` | DependencyGraphCache | Dependency graph cache (set after build) |

### Accessing Context

```javascript
// In hook functions
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  const debug = ctx.debug;
  // ...
}

// In lifecycle callbacks
.onInit(async ({ ctx }) => {
  const config = ctx.config?.database || {};
  // ...
})
```

## API Object

The `api` object is passed to hooks and lifecycle callbacks.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Subsystem name |
| `__facets` | FacetManager | Facet manager instance |

### Accessing API

```javascript
// In hook functions
fn: (ctx, api, subsystem) => {
  console.log('Subsystem name:', api.name);
  const facets = api.__facets;
  // ...
}

// In lifecycle callbacks
.onInit(async ({ api }) => {
  console.log('Initializing:', api.name);
  // ...
})
```

## Extending BaseSubsystem

You can extend `BaseSubsystem` to create custom subsystem types:

```javascript
import { BaseSubsystem } from 'mycelia-kernel-plugin-system';

export class CustomSubsystem extends BaseSubsystem {
  constructor(name, options = {}) {
    super(name, options);
    // Custom initialization
  }

  // Override methods as needed
  async build(ctx = {}) {
    // Custom build logic
    await super.build(ctx);
    // Additional setup
  }

  async dispose() {
    // Custom cleanup
    await super.dispose();
  }
}
```

## Comparison: BaseSubsystem vs StandalonePluginSystem

| Feature | BaseSubsystem | StandalonePluginSystem |
|---------|---------------|------------------------|
| **Purpose** | Base class for extension | Ready-to-use plugin system |
| **Message Methods** | No-ops (can be overridden) | No-ops (fixed) |
| **Extensibility** | Fully extensible | Limited (use BaseSubsystem for extension) |
| **Use Case** | Custom subsystem types | Simple plugin systems |
| **Complexity** | More complex | Simpler |

## Complete Example

```javascript
import { BaseSubsystem, createHook, Facet } from 'mycelia-kernel-plugin-system';

// Create a hook
const useDatabase = createHook({
  kind: 'database',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    
    return new Facet('database', {
      attach: true,
      source: import.meta.url
    })
    .add({
      async query(sql) {
        console.log('Query:', sql);
        return { rows: [] };
      }
    })
    .onInit(async ({ ctx }) => {
      console.log('Database initialized');
    });
  }
});

// Create and use the system
async function main() {
  const system = new BaseSubsystem('my-app', {
    config: {
      database: {
        host: 'localhost',
        port: 5432
      }
    },
    debug: true
  });

  // Register hooks
  system.use(useDatabase);

  // Add lifecycle callbacks
  system.onInit(async (api, ctx) => {
    console.log('System initialized:', api.name);
  });

  system.onDispose(async () => {
    console.log('System disposing...');
  });

  // Build the system
  await system.build();

  // Use the system
  const db = system.find('database');
  await db.query('SELECT * FROM users');

  // Check state
  console.log('Is built:', system.isBuilt);
  console.log('Capabilities:', system.capabilities);

  // Cleanup
  await system.dispose();
}

main().catch(console.error);
```

## Best Practices

### 1. Always Clean Up

```javascript
try {
  await system.build();
  // Use system...
} finally {
  await system.dispose();
}
```

### 2. Use StandalonePluginSystem for Simple Cases

```javascript
// ✅ For simple plugin systems
const system = new StandalonePluginSystem('my-app', { config });

// ✅ For custom subsystem types
class MySubsystem extends BaseSubsystem {
  // Custom logic
}
```

### 3. Register Hooks Before Building

```javascript
// ✅ Good: Register before build
system.use(useDatabase).use(useCache);
await system.build();

// ❌ Avoid: Registering after build
await system.build();
system.use(useDatabase); // Error!
```

### 4. Use Context for Configuration

```javascript
// ✅ Good: Use context
const system = new BaseSubsystem('app', {
  config: {
    database: { host: 'localhost' }
  }
});

// In hooks
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  // ...
}
```

## See Also

- [StandalonePluginSystem](./STANDALONE-PLUGIN-SYSTEM.md) - Ready-to-use plugin system
- [Hooks](./HOOKS.md) - Creating hooks
- [Facets](./FACETS.md) - Creating facets
- [Facet Manager](./FACET-MANAGER.md) - Managing facets
- [Build Process](../architecture/BUILD-PROCESS.md) - How building works

