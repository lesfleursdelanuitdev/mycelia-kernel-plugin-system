# Hook Function Context

## Overview

The context object (`ctx`) is a crucial part of hook and facet initialization. It provides access to system-level services and configuration data that hooks and facets need to function properly.

The context is passed to:
- **Hook functions** as the first parameter: `fn: (ctx, api, subsystem) => { ... }`
- **Facet lifecycle callbacks** as part of the parameters object: `onInit(({ ctx, api, subsystem, facet }) => { ... })`

## Context Structure

The context object has the following structure:

```javascript
ctx = {
  ms: null,              // Message system instance (optional, null for standalone systems)
  config: {               // Configuration object keyed by facet kind
    database: { /* database config */ },
    cache: { /* cache config */ },
    logger: { /* logger config */ },
    // ... other facet configs
  },
  debug: boolean          // Debug flag (true or false)
}
```

**Important:** For standalone plugin systems, `ctx.ms` is `null`. Your hooks and facets should not rely on it.

## Context Properties

### `ms` (null, optional)

A reference to the message system instance. For standalone plugin systems, this is always `null`.

**Important:** Do not use `ctx.ms` in your hooks or facets. It is provided for compatibility but should not be relied upon in standalone systems.

**Usage:**
```javascript
// ❌ Don't do this in standalone systems
fn: (ctx, api, subsystem) => {
  const messageSystem = ctx.ms;  // null for standalone systems
  // ...
}

// ✅ Do this instead
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  // Use config, not ctx.ms
}
```

### `config` (Object, required)

A configuration object where each key corresponds to a facet kind, and each value contains the configuration data for that specific facet.

**Structure:**
```javascript
config = {
  database: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'user',
    password: 'password'
  },
  cache: {
    maxSize: 1000,
    ttl: 3600,
    type: 'memory'
  },
  logger: {
    level: 'info',
    format: 'json'
  },
  // ... other facet configurations
}
```

**Important:** Configuration is keyed by facet kind. Each facet should extract its configuration using `ctx.config.<kind>`.

**Usage:**
```javascript
// In hook function
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  // Use config...
}

// In lifecycle callback
.onInit(({ ctx }) => {
  const config = ctx.config?.database || {};
  // Use config...
})
```

### `debug` (boolean, required)

A debug flag that indicates whether debug logging should be enabled. Can be `true` or `false`.

**Usage:**
```javascript
// In hook function
fn: (ctx, api, subsystem) => {
  if (ctx.debug) {
    console.log('Hook executing in debug mode');
  }
}

// In lifecycle callback
.onInit(({ ctx }) => {
  if (ctx.debug) {
    console.log('Facet initialized in debug mode');
  }
})
```

## Extracting Configuration

The proper way to extract configuration for a facet is using `ctx.config.<kind>`, where `<kind>` is the facet's kind identifier.

### Pattern

```javascript
const config = ctx.config?.<kind> || {};
```

### Examples

```javascript
// For a 'database' facet
const config = ctx.config?.database || {};
const host = config.host || 'localhost';
const port = config.port || 5432;

// For a 'cache' facet
const config = ctx.config?.cache || {};
const maxSize = config.maxSize || 1000;
const ttl = config.ttl || 3600;

// For a 'logger' facet
const config = ctx.config?.logger || {};
const level = config.level || 'info';

// For a facet with a hyphenated name
const config = ctx.config?.['file-logger'] || {};
const logPath = config.path || './logs/app.log';
```

### Complete Example: Hook Function

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useDatabase = createHook({
  kind: 'database',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Extract configuration using ctx.config.database
    const config = ctx.config?.database || {};
    
    // Use configuration with defaults
    const connection = createConnection({
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'mydb',
      user: config.user || 'user',
      password: config.password || 'password',
      debug: config.debug !== undefined ? config.debug : (ctx.debug || false)
    });
    
    return new Facet('database', { attach: true, source: import.meta.url })
      .add({
        async query(sql) {
          return connection.query(sql);
        },
        // ... other methods
      });
  }
});
```

### Complete Example: Lifecycle Callback

```javascript
import { Facet } from 'mycelia-kernel-plugin-system';

return new Facet('database', { attach: true, source: import.meta.url })
  .add({
    async query(sql) {
      return this.connection.query(sql);
    }
  })
  .onInit(async ({ ctx, subsystem }) => {
    // Extract configuration using ctx.config.database
    const config = ctx.config?.database || {};
    
    // Establish database connection during initialization
    this.connection = await createConnection({
      host: config.host || 'localhost',
      port: config.port || 5432,
      database: config.database || 'mydb',
      user: config.user,
      password: config.password
    });
    
    console.log(`Database facet initialized for ${subsystem.name}`);
  });
```

## Debug Flag Extraction

When extracting the debug flag, use a fallback chain that checks facet-specific config first, then the global context:

```javascript
const debug = config.debug !== undefined ? config.debug : (ctx.debug || false);
```

This pattern:
1. First checks if the facet has its own `debug` setting in `config.<kind>.debug`
2. Falls back to the global `ctx.debug` if not specified
3. Defaults to `false` if neither is set

### Example

```javascript
// Extract config
const config = ctx.config?.cache || {};

// Extract debug with fallback chain
const debug = config.debug !== undefined ? config.debug : (ctx.debug || false);

// Use debug flag
if (debug) {
  console.log('Cache initialized in debug mode');
}
```

### Complete Example with Debug Extraction

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useCache = createHook({
  kind: 'cache',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    // Extract configuration
    const config = ctx.config?.cache || {};
    
    // Extract debug with proper fallback
    const debug = config.debug !== undefined ? config.debug : (ctx.debug || false);
    
    // Create cache with configuration
    const store = new Map();
    const maxSize = config.maxSize || 1000;
    const ttl = config.ttl || 3600;
    
    return new Facet('cache', { attach: true, source: import.meta.url })
      .add({
        get(key) {
          return store.get(key);
        },
        set(key, value) {
          if (store.size >= maxSize) {
            // Evict oldest entry
            const firstKey = store.keys().next().value;
            store.delete(firstKey);
          }
          store.set(key, value);
        }
      });
  }
});
```

## Context in Hook Functions

Hooks receive the context as their first parameter:

```javascript
import { createHook, Facet } from 'mycelia-kernel-plugin-system';

export const useDatabase = createHook({
  kind: 'database',
  fn: (ctx, api, subsystem) => {
    // ctx is available here
    const config = ctx.config?.database || {};
    
    // Check debug flag
    if (ctx.debug) {
      console.log('Database hook executing');
    }
    
    // ... rest of hook implementation
  }
});
```

**Hook Function Signature:**
```javascript
fn: (ctx, api, subsystem) => Facet
```

**Parameters:**
- `ctx` - The context object (this document)
- `api` - The system API object (`{ name, __facets }`)
- `subsystem` - The system instance

## Context in Lifecycle Callbacks

Lifecycle callbacks receive context as part of their parameters object:

```javascript
.onInit(async ({ ctx, api, subsystem, facet }) => {
  // ctx is available here
  const config = ctx.config?.database || {};
  this.connection = await createConnection(config);
})
```

**Lifecycle Callback Signature:**
```javascript
onInit(({ ctx, api, subsystem, facet }) => { ... })
onDispose((facet) => { ... })
```

**Parameters:**
- `ctx` - The context object (this document)
- `api` - The system API object
- `subsystem` - The system instance
- `facet` - The facet instance itself (only in `onInit`)

## Best Practices

1. **Always use optional chaining**: Use `ctx.config?.<kind>` to safely access configuration that may not exist.

2. **Provide sensible defaults**: Always provide default values when extracting configuration:
   ```javascript
   const config = ctx.config?.database || {};
   const host = config.host || 'localhost';
   ```

3. **Use the debug fallback pattern**: Always use the fallback chain for debug flags:
   ```javascript
   const debug = config.debug !== undefined ? config.debug : (ctx.debug || false);
   ```

4. **Extract config once**: Extract the configuration object once at the beginning of your hook or callback, then use it throughout.

5. **Document expected config**: Document what configuration options your facet expects in its configuration object.

6. **Don't rely on ctx.ms**: For standalone systems, `ctx.ms` is `null` - don't use it in your code.

## Common Patterns

### Pattern: Configuration with Validation

```javascript
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.custom || {};
  
  // Validate required configuration
  if (!config.apiKey) {
    throw new Error('custom facet requires apiKey in config');
  }
  
  // Use configuration
  const client = new CustomClient({
    apiKey: config.apiKey,
    timeout: config.timeout || 5000,
    debug: config.debug !== undefined ? config.debug : (ctx.debug || false)
  });
  
  return new Facet('custom', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}
```

### Pattern: Nested Configuration

```javascript
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.database || {};
  
  // Extract nested configuration
  const connectionConfig = config.connection || {};
  const poolConfig = config.pool || {};
  
  const connection = new DatabaseConnection({
    host: connectionConfig.host || 'localhost',
    port: connectionConfig.port || 5432,
    maxConnections: poolConfig.max || 10
  });
  
  return new Facet('database', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}
```

### Pattern: Configuration with Environment Overrides

```javascript
fn: (ctx, api, subsystem) => {
  const config = ctx.config?.cache || {};
  
  // Allow environment variables to override config
  const cacheSize = process.env.CACHE_SIZE 
    ? parseInt(process.env.CACHE_SIZE, 10)
    : (config.size || 1000);
  
  const cache = new Cache({ size: cacheSize });
  
  return new Facet('cache', { attach: true, source: import.meta.url })
    .add({ /* methods */ });
}
```

## Related Parameters

The context object (`ctx`) is one of three parameters passed to hooks and lifecycle callbacks:

- **`ctx`** - Context object (this document) - System services and configuration
- **`api`** - API object - See [Hook Function API Parameter](./HOOK-FUNCTION-API-PARAM.md) for details
- **`subsystem`** - System instance - See [Hook Function Subsystem Parameter](./HOOK-FUNCTION-SUBSYSTEM-PARAM.md) for details

## See Also

- [Hooks Documentation](../core-concepts/HOOKS.md) - Complete guide to creating hooks and how they use context
- [Hook Function API Parameter](./HOOK-FUNCTION-API-PARAM.md) - Learn about the `api` parameter for accessing facets
- [Hook Function Subsystem Parameter](./HOOK-FUNCTION-SUBSYSTEM-PARAM.md) - Learn about the `subsystem` parameter and its `find()` method
- [Facets Documentation](../core-concepts/FACETS.md) - Learn about facets and how they use context
- [Facet Manager](../core-concepts/FACET-MANAGER.md) - See how context is passed during initialization
- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - See how context is used in standalone systems

