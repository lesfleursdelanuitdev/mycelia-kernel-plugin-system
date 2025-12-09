# Builder Helpers

Utilities for creating reusable system builders in Svelte applications.

## Overview

Builder helpers make it easy to create and reuse system builders, keeping Svelte code clean and avoiding direct `useBase` calls in components.

## createSvelteSystemBuilder

Create a reusable system builder function.

### API

```js
createSvelteSystemBuilder(
  name: string,
  configure: (builder: UseBaseBuilder) => UseBaseBuilder
): () => Promise<StandalonePluginSystem>
```

### Parameters

- **`name`** (string, required): System name
- **`configure`** (Function, required): Configuration function that receives builder and returns configured builder

### Returns

- **`build`** (Function): Async function that builds and returns the system

### Example

```js
import { createSvelteSystemBuilder } from 'mycelia-kernel-plugin/svelte';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

const buildTodoSystem = createSvelteSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', { host: 'localhost' })
      .config('queue', { capacity: 100 })
      .use(useDatabase)
      .use(useListeners)
      .use(useQueue)
);

// Use in component
onMount(async () => {
  const system = await buildTodoSystem();
  setMyceliaSystem(system);
});
```

### With Environment Configuration

```js
const buildSystem = createSvelteSystemBuilder(
  'my-app',
  (b) => {
    const config = {
      database: {
        host: import.meta.env.VITE_DB_HOST || 'localhost',
        port: parseInt(import.meta.env.VITE_DB_PORT || '5432')
      },
      queue: {
        capacity: parseInt(import.meta.env.VITE_QUEUE_CAPACITY || '1000')
      }
    };
    
    return b
      .config('database', config.database)
      .config('queue', config.queue)
      .use(useDatabase)
      .use(useQueue);
  }
);
```

### With Conditional Hooks

```js
const buildSystem = createSvelteSystemBuilder(
  'my-app',
  (b) => {
    let builder = b.use(useDatabase);
    
    if (import.meta.env.VITE_ENABLE_CACHE === 'true') {
      builder = builder.use(useCache);
    }
    
    if (import.meta.env.VITE_ENABLE_QUEUE === 'true') {
      builder = builder.use(useQueue);
    }
    
    return builder;
  }
);
```

### Best Practices

1. **Create in Module Scope** - Define builders outside components:
   ```js
   // ✅ Good - in module scope
   const buildSystem = createSvelteSystemBuilder('app', (b) => b.use(useDatabase));
   
   // ❌ Bad - in component
   <script>
     const buildSystem = createSvelteSystemBuilder('app', (b) => b.use(useDatabase));
   </script>
   ```

2. **Separate by Domain** - Create different builders for different domains:
   ```js
   // systems/api-system.js
   export const buildApiSystem = createSvelteSystemBuilder('api', (b) =>
     b.use(useRouter).use(useAuth)
   );
   
   // systems/worker-system.js
   export const buildWorkerSystem = createSvelteSystemBuilder('worker', (b) =>
     b.use(useQueue).use(useListeners)
   );
   ```

## Complete Example

```js
// systems/todo-system.js
import { createSvelteSystemBuilder } from 'mycelia-kernel-plugin/svelte';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

export const buildTodoSystem = createSvelteSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', {
        host: import.meta.env.VITE_DB_HOST || 'localhost',
        port: 5432
      })
      .config('listeners', {
        registrationPolicy: 'multiple'
      })
      .config('queue', {
        capacity: 1000,
        policy: 'drop-oldest'
      })
      .use(useDatabase)
      .use(useListeners)
      .use(useQueue)
);

// App.svelte
<script>
  import { onMount } from 'svelte';
  import { setMyceliaSystem } from 'mycelia-kernel-plugin/svelte';
  import { buildTodoSystem } from './systems/todo-system.js';
  import App from './App.svelte';

  let system;
  
  onMount(async () => {
    system = await buildTodoSystem();
    setMyceliaSystem(system);
  });
</script>
```

## See Also

- [useBase](../standalone/STANDALONE-PLUGIN-SYSTEM.md#usebase) - Core builder API
- [Core Bindings](./CORE-BINDINGS.md) - Context and basic stores
- [Store Generator](./STORE-GENERATOR.md) - Custom store generation




