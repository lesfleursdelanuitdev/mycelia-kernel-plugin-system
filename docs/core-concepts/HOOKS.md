# Hooks

## Overview

A **Hook** is a function that creates and returns a **Facet**. Hooks are the primary mechanism for extending system functionality in the Mycelia Plugin System. They provide a standardized way to add features like database connections, caching, authentication, and more to systems.

Hooks encapsulate:
- **Metadata**: Information about the hook's kind, dependencies, and behavior
- **Factory Logic**: Code that creates and configures a facet
- **Integration**: How the hook integrates with other facets and the system

## What is a Hook?

A hook is a function with attached metadata that, when called, returns a Facet instance. Hooks are executed during system build to create facets that extend the system's capabilities.

### Hook Structure

A hook has the following structure:

```javascript
function hook(ctx, api, subsystem) {
  // Hook logic that creates and returns a Facet
  return new Facet('kind', { /* options */ })
    .add({ /* methods */ });
}

// Hook metadata (attached to the function)
hook.kind = 'kind';              // Facet kind identifier
hook.version = '1.0.0';          // Semantic version
hook.overwrite = false;          // Whether hook can overwrite existing hooks
hook.required = [];               // Array of required facet dependencies
hook.attach = false;              // Whether facet should be attached to system
hook.source = 'file://...';      // Source file location
hook.contract = null;             // Optional contract name
```

### Hook Function Signature

```javascript
function hook(ctx, api, subsystem) => Facet
```

**Parameters:**
- `ctx` - Context object containing system services and configuration. See [Hook Function Context](../api-reference/HOOK-FUNCTION-CONTEXT.md)
- `api` - System API object with `name` and `__facets`. See [Hook Function API Parameter](../api-reference/HOOK-FUNCTION-API-PARAM.md)
- `subsystem` - System instance with `find()` method. See [Hook Function Subsystem Parameter](../api-reference/HOOK-FUNCTION-SUBSYSTEM-PARAM.md)

**Returns:**
- `Facet` - A Facet instance that extends the system's capabilities

## Creating Hooks with `createHook`

The `createHook` factory function is the recommended way to create hooks. It ensures consistent metadata structure and validation.

### `createHook` Function

**Signature:**
```javascript
createHook({ kind, version, overwrite, required, attach, source, contract, fn }) => Hook
```

**Parameters:**
- `kind` (string, required) - The facet kind identifier (e.g., 'database', 'cache', 'auth')
- `version` (string, default: `'0.0.0'`) - Semantic version (e.g., '1.0.0', '2.1.3-alpha')
- `overwrite` (boolean, default: `false`) - Whether this hook can overwrite an existing hook of the same kind
- `required` (Array<string>, default: `[]`) - Array of facet kinds this hook depends on
- `attach` (boolean, default: `false`) - Whether the resulting facet should be attached to the system
- `source` (string, required) - File location/URL where the hook is defined (typically `import.meta.url`)
- `contract` (string, default: `null`) - Contract name (string) for the facet this hook creates
- `fn` (Function, required) - Hook function: `(ctx, api, subsystem) => Facet`

**Returns:**
- A hook function with attached metadata properties

### Basic Hook Example

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useCustom = createHook({
  kind: 'custom',
  version: '1.0.0',
  overwrite: false,
  required: [],
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Extract configuration
    const config = ctx.config?.custom || {};
    
    // Create custom functionality
    const customService = new CustomService(config);
    
    // Return a Facet
    return new Facet('custom', { 
      attach: true, 
      source: import.meta.url 
    })
    .add({
      doSomething() {
        return customService.doSomething();
      },
      
      getStatus() {
        return customService.getStatus();
      }
    });
  }
});
```

## Hook Metadata

Hooks have metadata attached to them that describes their behavior and requirements:

### `kind` (string, required)

The unique identifier for the facet kind this hook creates. Must match the `kind` of the Facet it returns.

**Example:**
```javascript
createHook({
  kind: 'database',  // Facet kind
  // ...
})
```

**Important:** The `kind` must be unique within a system (unless `overwrite: true`). It must also match the `kind` passed to the `Facet` constructor.

### `version` (string, default: `'0.0.0'`)

The semantic version of the hook. Used for version tracking and compatibility checking.

**Example:**
```javascript
createHook({
  kind: 'database',
  version: '1.2.3',  // Semantic version
  // ...
})
```

**Format:** Must follow semantic versioning (e.g., `'1.0.0'`, `'2.1.3-alpha'`, `'3.0.0-beta.1'`)

### `overwrite` (boolean, default: `false`)

Whether this hook is allowed to overwrite an existing hook of the same kind. When `false`, duplicate hooks will cause a build error.

**Example:**
```javascript
createHook({
  kind: 'custom',
  overwrite: true,  // Allows overwriting existing 'custom' hook
  // ...
})
```

**Use cases:**
- Custom implementations that replace existing hooks
- Plugin systems where hooks can be replaced
- Testing scenarios where you need to mock hooks

### `required` (Array<string>, default: `[]`)

An array of facet kinds that this hook depends on. The build system ensures these dependencies are initialized before this hook runs.

**Example:**
```javascript
createHook({
  kind: 'cache',
  required: ['database', 'logger'],  // Dependencies
  // ...
})
```

**Benefits:**
- Ensures dependencies are available when hook executes
- Enables dependency resolution and topological sorting
- Provides clear documentation of hook dependencies

**Important:** Dependencies listed in `required` are guaranteed to exist when your hook function executes. You can safely access them via `api.__facets['dependency-name']` or `api.__facets.dependencyName`.

### `attach` (boolean, default: `false`)

Whether the resulting facet should be automatically attached to the system. When `true`, the facet becomes accessible via `system.find(kind)` or `system.kind`.

**Example:**
```javascript
createHook({
  kind: 'database',
  attach: true,  // Facet will be attached to system
  // ...
})
```

**Note:** This should match the `attach` option passed to the `Facet` constructor for consistency.

### `source` (string, required)

The file location/URL where the hook is defined. Typically set to `import.meta.url` for debugging and error reporting.

**Example:**
```javascript
createHook({
  kind: 'database',
  source: import.meta.url,  // Current file URL
  // ...
})
```

**Benefits:**
- Improves error messages with source file information
- Helps with debugging hook conflicts
- Enables better tooling and analysis

### `contract` (string, default: `null`)

The contract name (string) that the facet created by this hook should satisfy. Contracts define required methods and properties that facets must implement. The contract name is used to look up the contract from the registry during validation.

**Example:**
```javascript
createHook({
  kind: 'database',
  contract: 'database',  // Contract name as string
  // ...
})
```

**Note:** The contract name is a string identifier (e.g., `'database'`, `'cache'`), not a contract object. The actual contract is looked up from the registry when needed. The contract name should match the facet's `kind` in most cases. See [Facet Contracts](../facet-contracts/FACET-CONTRACT.md) for more information.

## Hook Execution Process

Hooks are executed during the system build process. Understanding this process helps you write effective hooks.

### Build Process Overview

1. **Verification Phase** (`verifySubsystemBuild`):
   - Collects all hooks (defaults + user hooks)
   - Extracts hook metadata (`kind`, `version`, `overwrite`, `required`, `source`)
   - Validates hook metadata
   - Executes hooks to create facets
   - Validates facets
   - Builds dependency graph
   - Performs topological sort

2. **Execution Phase** (`buildSubsystem`):
   - Initializes facets in dependency order
   - Attaches facets to system
   - Builds child systems (if any)

### Hook Execution Order

Hooks are executed in two phases:

**Phase 1: Metadata Extraction**
- All hooks are examined to extract metadata
- Duplicate hooks are detected (unless `overwrite: true`)
- Hook dependencies are validated

**Phase 2: Facet Creation**
- Hooks are executed to create facets
- Facets are validated
- Dependency graph is built
- Topological sort determines initialization order

**Important:** During hook execution, only facets declared in your `required` array are guaranteed to exist. Other facets may not be registered yet.

### Example: Hook Execution Flow

```javascript
// Hook 1: useLogger (no dependencies)
export const useLogger = createHook({
  kind: 'logger',
  required: [],
  // ...
});

// Hook 2: useCache (depends on logger)
export const useCache = createHook({
  kind: 'cache',
  required: ['logger'],  // Logger is guaranteed to exist
  fn: (ctx, api, subsystem) => {
    // Safe to access logger facet
    const loggerFacet = api.__facets.logger;
    
    return new Facet('cache', { /* ... */ });
  }
});

// Hook 3: useApp (depends on cache and database)
export const useApp = createHook({
  kind: 'app',
  required: ['cache', 'database'],  // All guaranteed to exist
  fn: (ctx, api, subsystem) => {
    // Safe to access all dependencies
    const cacheFacet = api.__facets.cache;
    const databaseFacet = api.__facets.database;
    
    return new Facet('app', { /* ... */ });
  }
});
```

**Execution order:**
1. `useLogger` executes first (no dependencies)
2. `useDatabase` executes (no dependencies)
3. `useCache` executes (logger exists)
4. `useApp` executes (cache and database exist)

## How Hooks Work with Facets

Hooks create facets, and facets extend system functionality. Understanding this relationship is crucial.

### Hook → Facet Relationship

```javascript
// Hook creates and returns a Facet
export const useDatabase = createHook({
  kind: 'database',
  fn: (ctx, api, subsystem) => {
    // Hook logic creates a Facet
    return new Facet('database', { 
      attach: true,
      source: import.meta.url 
    })
    .add({
      // Facet methods
      async query(sql) { /* ... */ }
    });
  }
});
```

**Key points:**
- Hook's `kind` must match Facet's `kind`
- Hook's `attach` should match Facet's `attach` option
- Hook's `required` should match Facet's `required` option (for consistency)
- Hook's `overwrite` should match Facet's `overwrite` option (for consistency)
- Hook's `version` should match Facet's `version` option (for consistency)

### Facet Creation in Hooks

When creating a facet in your hook, follow these patterns:

**Pattern 1: Simple Facet**
```javascript
fn: (ctx, api, subsystem) => {
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({
      method1() { /* ... */ },
      method2() { /* ... */ }
    });
}
```

**Pattern 2: Facet with Configuration**
```javascript
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.custom || {};
  const service = new CustomService(config);
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({
      process(data) {
        return service.process(data);
      }
    });
}
```

**Pattern 3: Facet with Dependencies**
```javascript
fn: (ctx, api, subsystem) => {
  // Access required dependencies
  const databaseFacet = api.__facets.database;
  const loggerFacet = api.__facets.logger;
  
  return new Facet('cache', { attach: true, source: import.meta.url })
    .add({
      async get(key) {
        // Use dependencies
        loggerFacet.log(`Getting ${key}`);
        const cached = this.store.get(key);
        if (cached) return cached;
        
        const data = await databaseFacet.query(`SELECT * FROM cache WHERE key = ?`, [key]);
        this.store.set(key, data);
        return data;
      }
    });
}
```

**Pattern 4: Facet with Optional Dependencies**
```javascript
fn: (ctx, api, subsystem) => {
  // Required dependency
  const databaseFacet = api.__facets.database;
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({
      async process() {
        const data = await databaseFacet.query('...');
        
        // Optional dependency - check in method
        const cacheFacet = subsystem.find('cache');
        if (cacheFacet) {
          cacheFacet.set(data.id, data);
        }
        
        return data;
      }
    });
}
```

## How Hooks Work with FacetManager

The FacetManager is responsible for managing facets created by hooks. Understanding this relationship helps you write hooks that integrate well with the system.

### Hook Execution → FacetManager

During system build:

1. **Hooks are executed** → Create facets
2. **Facets are collected** → Stored by kind
3. **FacetManager receives facets** → Via `addMany()`
4. **Facets are initialized** → In dependency order
5. **Facets are attached** → To system (if `attach: true`)

### Accessing Facets During Hook Execution

During hook execution, you can access facets through `api.__facets`:

```javascript
fn: (ctx, api, subsystem) => {
  // Access required dependencies
  const databaseFacet = api.__facets.database;
  const loggerFacet = api.__facets.logger;
  
  // Access optional facets (may not exist)
  const cacheFacet = api.__facets?.cache;
  
  // Use FacetManager methods
  if (api.__facets.has('monitoring')) {
    const monitoringFacet = api.__facets.find('monitoring');
    // ...
  }
  
  return new Facet('custom', { /* ... */ });
}
```

**Important:** Only facets declared in your `required` array are guaranteed to exist. Other facets may not be registered yet.

### Accessing Facets in Facet Methods

After the system is built, facets can access other facets using `subsystem.find()`:

```javascript
fn: (ctx, api, subsystem) => {
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({
      process() {
        // Check for optional facet at call time
        const loggerFacet = subsystem.find('logger');
        if (loggerFacet) {
          loggerFacet.log('processing');
        }
        
        // Process...
      }
    });
}
```

## Complete Hook Example

Here's a complete example showing all aspects of hook creation:

```javascript
import { createHook, Facet, StandalonePluginSystem } from 'mycelia-kernel-plugin-system';

/**
 * useCache Hook
 * 
 * Provides caching functionality to systems.
 * 
 * Dependencies:
 * - database: Required for persistence
 * - logger: Optional for logging (checked at runtime)
 */
export const useCache = createHook({
  kind: 'cache',
  version: '1.0.0',
  overwrite: false,
  required: ['database'],  // Required dependency
  attach: true,
  source: import.meta.url,
  contract: 'cache',
  fn: (ctx, api, subsystem) => {
    const { name } = api;
    
    // Extract configuration
    const config = ctx.config?.cache || {};
    const debug = config.debug !== undefined ? config.debug : (ctx.debug || false);
    
    // Access required dependency
    const databaseFacet = api.__facets.database;
    
    // Create cache service
    const cache = new Map();
    
    // Return facet
    return new Facet('cache', { 
      attach: true,
      required: ['database'],  // Match hook's required
      source: import.meta.url,
      version: '1.0.0',
      contract: 'cache'
    })
    .add({
      /**
       * Get value from cache, fallback to database
       */
      async get(key) {
        // Check cache first
        if (cache.has(key)) {
          return cache.get(key);
        }
        
        // Fallback to database
        const data = await databaseFacet.query(
          `SELECT value FROM cache WHERE key = ?`, 
          [key]
        );
        
        if (data) {
          cache.set(key, data);
          return data;
        }
        
        return null;
      },
      
      /**
       * Set value in cache and database
       */
      async set(key, value) {
        cache.set(key, value);
        
        // Persist to database
        await databaseFacet.query(
          `INSERT OR REPLACE INTO cache (key, value) VALUES (?, ?)`, 
          [key, value]
        );
      },
      
      /**
       * Clear cache
       */
      clear() {
        cache.clear();
      },
      
      /**
       * Get cache statistics
       */
      getStats() {
        return {
          size: cache.size,
          keys: Array.from(cache.keys())
        };
      }
    })
    .onInit(async ({ ctx }) => {
      // Initialize cache from database if needed
      const config = ctx.config?.cache || {};
      if (config.preload) {
        // Preload logic
      }
    })
    .onDispose(async () => {
      // Cleanup
      cache.clear();
    });
  }
});

// Usage
const system = new StandalonePluginSystem('my-app', {
  config: {
    cache: {
      debug: true,
      preload: true
    }
  }
});

system
  .use(useDatabase)  // Must be registered first (cache depends on it)
  .use(useCache)
  .build();

const cache = system.find('cache');
await cache.set('key', 'value');
const value = await cache.get('key');
```

## Hook Registration

Hooks are registered via the `use()` method:

```javascript
import { StandalonePluginSystem } from 'mycelia-kernel-plugin-system';
import { useDatabase } from './hooks/use-database.js';
import { useCache } from './hooks/use-cache.js';

const system = new StandalonePluginSystem('my-app', {
  config: { /* ... */ }
});

// Method 1: Using use() method (recommended)
system.use(useDatabase);
system.use(useCache);

// Method 2: Chaining
system
  .use(useDatabase)
  .use(useCache)
  .build();

// Method 3: Using hooks array (advanced)
system.hooks.push(useDatabase);
system.hooks.push(useCache);
```

**Important:** Hooks must be registered before calling `system.build()`.

## Best Practices

1. **Always use `createHook`**: Use the factory function to ensure consistent metadata structure.

2. **Match hook and facet metadata**: Keep `kind`, `attach`, `required`, `overwrite`, and `version` consistent between hook and facet.

3. **Set `source` to `import.meta.url`**: This improves error messages and debugging.

4. **Declare dependencies explicitly**: Use the `required` array to make dependencies clear and ensure correct initialization order.

5. **Extract configuration properly**: Use `ctx.config?.<kind>` to extract configuration for your hook.

6. **Access required dependencies safely**: Use `api.__facets['dependency']` or `api.__facets.dependency` for required dependencies (they're guaranteed to exist).

7. **Use `subsystem.find()` for optional facets**: Check for optional facets in facet methods using `subsystem.find()`.

8. **Handle missing optional facets gracefully**: Always check if optional facets exist before using them.

9. **Document your hook**: Include JSDoc comments explaining what the hook does, its dependencies, and configuration options.

10. **Test hook isolation**: Ensure your hook works correctly when dependencies are missing (for optional dependencies).

11. **Use semantic versions**: Set appropriate version numbers for your hooks to track changes.

## Common Patterns

### Pattern: Simple Feature Hook

```javascript
export const useSimple = createHook({
  kind: 'simple',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const service = new SimpleService();
    
    return new Facet('simple', { attach: true, source: import.meta.url })
      .add({
        doSomething() {
          return service.doSomething();
        }
      });
  }
});
```

### Pattern: Hook with Required Dependencies

```javascript
export const useDependent = createHook({
  kind: 'dependent',
  required: ['base'],  // Required dependency
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Access required dependency
    const baseFacet = api.__facets.base;
    
    return new Facet('dependent', { attach: true, source: import.meta.url })
      .add({
        process() {
          // Use base facet
          return baseFacet.process();
        }
      });
  }
});
```

### Pattern: Hook with Optional Dependencies

```javascript
export const useOptional = createHook({
  kind: 'optional',
  required: [],  // No required dependencies
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    return new Facet('optional', { attach: true, source: import.meta.url })
      .add({
        process() {
          // Check for optional facet in method
          const enhancementFacet = subsystem.find('enhancement');
          if (enhancementFacet) {
            return enhancementFacet.enhance(this.coreProcess());
          }
          return this.coreProcess();
        },
        
        coreProcess() {
          // Core logic
          return { processed: true };
        }
      });
  }
});
```

### Pattern: Hook with Configuration

```javascript
export const useConfigurable = createHook({
  kind: 'configurable',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Extract configuration
    const config = ctx.config?.configurable || {};
    const debug = config.debug !== undefined ? config.debug : (ctx.debug || false);
    
    const service = new ConfigurableService({
      option1: config.option1 || 'default1',
      option2: config.option2 || 'default2',
      debug
    });
    
    return new Facet('configurable', { attach: true, source: import.meta.url })
      .add({
        getConfig() {
          return service.getConfig();
        },
        
        updateConfig(options) {
          service.updateConfig(options);
        }
      });
  }
});
```

## Hook Validation

The build system validates hooks to ensure correctness:

### Validation Checks

1. **Hook must be a function**: Non-function hooks are skipped
2. **Hook must have `kind`**: Missing or invalid `kind` causes error
3. **Hook `kind` must match facet `kind`**: Mismatch causes error
4. **Duplicate hooks**: Duplicate `kind` causes error (unless `overwrite: true`)
5. **Hook must return Facet**: Non-Facet return value causes error
6. **Dependencies must exist**: Missing required dependencies cause error
7. **Facet metadata validation**: Facet must have valid `kind` and match hook's `kind`
8. **Version validation**: Version must be valid semantic version

### Error Messages

The build system provides clear error messages:

```javascript
// Example error messages
"Hook missing valid kind property (source: file:///path/to/hook.js)."
"Duplicate hook kind 'cache' from [file:///path1.js] and [file:///path2.js]. Hook does not allow overwrite."
"Hook 'cache' (from file:///path.js) requires missing facet 'database'."
"Hook 'database' (from file:///path.js) did not return a Facet instance (got undefined)."
"Invalid semver version 'invalid' for hook 'database'."
```

## Hook Lifecycle

Hooks have a simple lifecycle:

1. **Definition**: Hook is created with `createHook()`
2. **Registration**: Hook is added to system via `use()` method
3. **Verification**: Hook metadata is extracted and validated
4. **Execution**: Hook function is called to create facet
5. **Initialization**: Facet is initialized (via `onInit` callback)
6. **Attachment**: Facet is attached to system (if `attach: true`)

**Note:** Hooks themselves are not stored or managed - only the facets they create are managed by FacetManager.

## See Also

- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Learn how to use hooks as plugins in a standalone system
- [Facets Documentation](./FACETS.md) - Learn about facets that hooks create
- [Facet Contracts](../facet-contracts/FACET-CONTRACT.md) - Learn about facet contracts and validation
- [Facet Contract Registry](../facet-contracts/FACET-CONTRACT-REGISTRY.md) - Learn about the contract registry system
- [Facet Manager](./FACET-MANAGER.md) - Understand how facets are managed and how hooks integrate with FacetManager
- [Hook Function Context](../api-reference/HOOK-FUNCTION-CONTEXT.md) - Learn about the `ctx` parameter passed to hooks
- [Hook Function API Parameter](../api-reference/HOOK-FUNCTION-API-PARAM.md) - Learn about the `api` parameter passed to hooks
- [Hook Function Subsystem Parameter](../api-reference/HOOK-FUNCTION-SUBSYSTEM-PARAM.md) - Learn about the `subsystem` parameter passed to hooks

