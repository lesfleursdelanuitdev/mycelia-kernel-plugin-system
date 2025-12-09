# useBase - Fluent API Builder

The `useBase` function provides a convenient, chainable API for creating and configuring plugin system instances. By default, it creates `StandalonePluginSystem` instances, but you can use `setBase()` to use `BaseSubsystem` or any custom class that extends `BaseSubsystem`.

## Overview

`useBase` is a fluent builder that simplifies system creation and configuration. It supports:

- **Method chaining** - Chain multiple operations together
- **Lazy initialization** - System is created when needed
- **Configuration management** - Easy configuration of multiple facets
- **Hook registration** - Register single or multiple hooks
- **Conditional registration** - Register hooks based on conditions
- **Base class selection** - Choose any class that extends `BaseSubsystem` (including `BaseSubsystem` itself or `StandalonePluginSystem`)

## Quick Start

```javascript
import { useBase, createHook, Facet } from 'mycelia-kernel-plugin';

const system = await useBase('my-app')
  .config('database', { host: 'localhost' })
  .use(useDatabase)
  .build();
```

## API Reference

### `useBase(name, options)`

Creates a new builder instance.

**Parameters:**
- `name` (string, required) - Unique name for the plugin system
- `options` (object, optional) - Initial configuration options
  - `config` (object) - Initial configuration object keyed by facet kind
  - `debug` (boolean) - Enable debug logging
  - `defaultHooks` (array) - Optional default hooks to install

**Returns:** `UseBaseBuilder` - Builder instance with fluent API

**Example:**
```javascript
const builder = useBase('my-app', {
  debug: true,
  config: {
    database: { host: 'localhost' }
  }
});
```

## Builder Methods

### Hook Registration

#### `use(hook)`

Register a single hook.

**Parameters:**
- `hook` (Function, required) - Hook function to register

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .use(useDatabase)
  .use(useCache)
  .build();
```

#### `useIf(condition, hook)`

Conditionally register a hook.

**Parameters:**
- `condition` (boolean, required) - Whether to register the hook
- `hook` (Function, required) - Hook function to register if condition is true

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .use(useDatabase)
  .useIf(process.env.ENABLE_CACHE === 'true', useCache)
  .build();
```

#### `useMultiple(hooks)`

Register multiple hooks at once.

**Parameters:**
- `hooks` (Array<Function>, required) - Array of hook functions to register

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .useMultiple([useDatabase, useCache, useAuth])
  .build();
```

**Example with other methods:**
```javascript
await useBase('my-app')
  .use(useLogger)
  .useMultiple([useDatabase, useCache])
  .use(useAuth)
  .build();
```

#### `useIfMultiple(condition, hooks)`

Conditionally register multiple hooks.

**Parameters:**
- `condition` (boolean, required) - Whether to register the hooks
- `hooks` (Array<Function>, required) - Array of hook functions to register if condition is true

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .use(useDatabase)
  .useIfMultiple(process.env.NODE_ENV === 'development', [
    useDebugTools,
    useDevLogger
  ])
  .build();
```

**Example with dynamic hooks:**
```javascript
const optionalHooks = [];
if (enableCache) optionalHooks.push(useCache);
if (enableAuth) optionalHooks.push(useAuth);

await useBase('my-app')
  .use(useDatabase)
  .useIfMultiple(optionalHooks.length > 0, optionalHooks)
  .build();
```

### Configuration

#### `config(kind, config)`

Add or update configuration for a specific facet kind. Configurations are merged when possible (deep merge for objects).

**Parameters:**
- `kind` (string, required) - Facet kind identifier (e.g., 'database', 'cache')
- `config` (*, required) - Configuration value for this facet kind

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .config('database', { host: 'localhost', port: 5432 })
  .config('cache', { ttl: 3600 })
  .build();
```

**Example with merging:**
```javascript
await useBase('my-app')
  .config('database', { host: 'localhost' })
  .config('database', { port: 5432 }) // Merges with existing
  .build();
```

#### `configMultiple(configs)`

Add or update configurations for multiple facet kinds at once. Configurations are merged when possible (deep merge for objects).

**Parameters:**
- `configs` (object, required) - Object where keys are facet kinds and values are configurations

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .configMultiple({
    database: { host: 'localhost', port: 5432 },
    cache: { ttl: 3600 },
    auth: { secret: 'abc123' }
  })
  .build();
```

**Example with merging:**
```javascript
await useBase('my-app')
  .configMultiple({
    database: { host: 'localhost' },
    cache: { ttl: 3600 }
  })
  .configMultiple({
    database: { port: 5432 }, // Merges with existing
    auth: { secret: 'abc123' }
  })
  .build();
```

**Example with config() method:**
```javascript
await useBase('my-app')
  .config('database', { host: 'localhost' })
  .configMultiple({
    database: { port: 5432 }, // Merges
    cache: { ttl: 3600 }
  })
  .build();
```

### Base Class Selection

#### `setBase(BaseClass)`

Set the base class for the system. Must be called before any method that uses the system.

**Parameters:**
- `BaseClass` (Function, required) - The base class to use. Must be `BaseSubsystem` or any class that extends `BaseSubsystem` (e.g., `StandalonePluginSystem` or a custom subclass)

**Returns:** `UseBaseBuilder` - This builder for chaining

**Throws:**
- `Error` if called after system is created
- `Error` if BaseClass is not a constructor function
- `Error` if BaseClass is not BaseSubsystem or a subclass

**Example:**
```javascript
import { BaseSubsystem } from 'mycelia-kernel-plugin';

await useBase('my-app')
  .setBase(BaseSubsystem)
  .use(useDatabase)
  .build();
```

**Example with custom subclass:**
```javascript
import { BaseSubsystem } from 'mycelia-kernel-plugin';

class MyCustomSystem extends BaseSubsystem {
  // Custom implementation
}

await useBase('my-app')
  .setBase(MyCustomSystem)
  .use(useDatabase)
  .build();
```

**Note:** By default, `useBase` uses `StandalonePluginSystem`. Only call `setBase()` if you need `BaseSubsystem` or a custom subclass that extends `BaseSubsystem`.

### Lifecycle Callbacks

#### `onInit(callback)`

Add an initialization callback.

**Parameters:**
- `callback` (Function, required) - Callback function: `(api, ctx) => Promise<void> | void`

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .use(useDatabase)
  .onInit(async (api, ctx) => {
    console.log('System initialized:', api.name);
  })
  .build();
```

#### `onDispose(callback)`

Add a disposal callback.

**Parameters:**
- `callback` (Function, required) - Callback function: `() => Promise<void> | void`

**Returns:** `UseBaseBuilder` - This builder for chaining

**Example:**
```javascript
await useBase('my-app')
  .use(useDatabase)
  .onDispose(async () => {
    console.log('System disposed');
  })
  .build();
```

### Building

#### `build(ctx)`

Build the system. This method is required and must be called to build the system. It applies any pending configurations and builds the system.

**Parameters:**
- `ctx` (object, optional) - Additional context to pass to build

**Returns:** `Promise<StandalonePluginSystem | BaseSubsystem>` - The built system instance

**Example:**
```javascript
const system = await useBase('my-app')
  .use(useDatabase)
  .build();
```

## Complete Examples

### Basic Usage

```javascript
import { useBase, createHook, Facet } from 'mycelia-kernel-plugin';

const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: () => new Facet('database', { attach: true })
    .add({
      async query(sql) {
        return { rows: [] };
      }
    })
});

const system = await useBase('my-app')
  .config('database', { host: 'localhost' })
  .use(useDatabase)
  .build();

const db = system.find('database');
await db.query('SELECT * FROM users');
```

### Multiple Hooks and Configurations

```javascript
const system = await useBase('my-app')
  .configMultiple({
    database: { host: 'localhost', port: 5432 },
    cache: { ttl: 3600 },
    auth: { secret: 'abc123' }
  })
  .useMultiple([useDatabase, useCache, useAuth])
  .build();
```

### Conditional Registration

```javascript
const system = await useBase('my-app')
  .use(useDatabase)
  .useIf(process.env.ENABLE_CACHE === 'true', useCache)
  .useIfMultiple(process.env.NODE_ENV === 'development', [
    useDebugTools,
    useDevLogger
  ])
  .build();
```

### Using BaseSubsystem

```javascript
import { useBase, BaseSubsystem } from 'mycelia-kernel-plugin';

const system = await useBase('my-app')
  .setBase(BaseSubsystem)
  .configMultiple({
    database: { host: 'localhost' },
    cache: { ttl: 3600 }
  })
  .useMultiple([useDatabase, useCache])
  .build();
```

### Using Custom Subclass

```javascript
import { useBase, BaseSubsystem } from 'mycelia-kernel-plugin';

class MyCustomSystem extends BaseSubsystem {
  // Add custom methods or override behavior
  customMethod() {
    return 'custom';
  }
}

const system = await useBase('my-app')
  .setBase(MyCustomSystem)
  .configMultiple({
    database: { host: 'localhost' }
  })
  .use(useDatabase)
  .build();

// Now system is an instance of MyCustomSystem
system.customMethod(); // 'custom'
```

### Complex Example

```javascript
const system = await useBase('my-app', { debug: true })
  .setBase(BaseSubsystem)
  .config('database', { host: 'localhost' })
  .configMultiple({
    cache: { ttl: 3600 },
    auth: { secret: 'abc123' }
  })
  .use(useLogger)
  .useMultiple([useDatabase, useCache])
  .useIf(enableAuth, useAuth)
  .useIfMultiple(devMode, [useDebugTools, useDevLogger])
  .onInit(async (api, ctx) => {
    console.log('System initialized:', api.name);
  })
  .onDispose(async () => {
    console.log('System disposed');
  })
  .build();
```

## Best Practices

1. **Use `useMultiple` for related hooks** - Group related hooks together for better readability
2. **Use `configMultiple` for initial setup** - Configure all facets at once for cleaner code
3. **Use conditional methods for environment-specific setup** - `useIf` and `useIfMultiple` are perfect for dev/prod differences
4. **Call `setBase()` early** - If you need a custom base class, call `setBase()` before any other methods that use the system
5. **Chain methods logically** - Group related operations together (config, then hooks, then callbacks, then build)
6. **Extend BaseSubsystem for custom behavior** - Create custom subclasses when you need additional functionality beyond what `StandalonePluginSystem` provides

## Error Handling

All methods validate their inputs and throw descriptive errors:

```javascript
// Invalid hook
useBase('my-app').use('not-a-function');
// Error: useBase.use: hook must be a function

// Invalid config
useBase('my-app').configMultiple('not-an-object');
// Error: useBase.configMultiple: configs must be an object

// setBase after system creation
const builder = useBase('my-app');
await builder.build();
builder.setBase(BaseSubsystem);
// Error: useBase.setBase: cannot change base class after system is created
```

## Performance Considerations

- **Lazy initialization** - System is only created when needed, so you can configure everything before creating the system
- **Config merging** - Configurations are merged efficiently using deep merge
- **No overhead** - The builder adds minimal overhead, all operations are direct

## See Also

- [Standalone Plugin System](./standalone/STANDALONE-PLUGIN-SYSTEM.md) - Complete guide to using the system standalone
- [BaseSubsystem](./core-concepts/BASE-SUBSYSTEM.md) - Base class documentation
- [Hooks and Facets](./core-concepts/HOOKS-AND-FACETS-OVERVIEW.md) - Core concepts

