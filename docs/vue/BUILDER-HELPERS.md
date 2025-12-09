# Builder Helpers

Utilities for creating reusable system builders in Vue applications.

## Overview

Builder helpers make it easy to create and reuse system builders, keeping Vue code clean and avoiding direct `useBase` calls in components.

## createVueSystemBuilder

Create a reusable system builder function.

### API

```js
createVueSystemBuilder(
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
import { createVueSystemBuilder } from 'mycelia-kernel-plugin/vue';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

const buildTodoSystem = createVueSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', { host: 'localhost' })
      .config('queue', { capacity: 100 })
      .use(useDatabase)
      .use(useListeners)
      .use(useQueue)
);

// Use in plugin
app.use(MyceliaPlugin, { build: buildTodoSystem });
```

### With Environment Configuration

```js
const buildSystem = createVueSystemBuilder(
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
const buildSystem = createVueSystemBuilder(
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

### With Lifecycle Callbacks

```js
const buildSystem = createVueSystemBuilder(
  'my-app',
  (b) =>
    b
      .use(useDatabase)
      .onInit(async (api, ctx) => {
        console.log(`System ${api.name} initialized`);
        // Perform initialization tasks
      })
      .onDispose(async () => {
        console.log('System disposed');
        // Perform cleanup tasks
      })
);
```

### Best Practices

1. **Create in Module Scope** - Define builders outside components:
   ```js
   // ✅ Good - in module scope
   const buildSystem = createVueSystemBuilder('app', (b) => b.use(useDatabase));
   
   // ❌ Bad - in component
   export default {
     setup() {
       const buildSystem = createVueSystemBuilder('app', (b) => b.use(useDatabase));
     }
   }
   ```

2. **Separate by Domain** - Create different builders for different domains:
   ```js
   // systems/api-system.js
   export const buildApiSystem = createVueSystemBuilder('api', (b) =>
     b.use(useRouter).use(useAuth)
   );
   
   // systems/worker-system.js
   export const buildWorkerSystem = createVueSystemBuilder('worker', (b) =>
     b.use(useQueue).use(useListeners)
   );
   ```

3. **Use Environment Variables** - Configure based on environment:
   ```js
   const buildSystem = createVueSystemBuilder('app', (b) => {
     const isDev = import.meta.env.DEV;
     return b
       .config('database', { debug: isDev })
       .use(useDatabase);
   });
   ```

## Complete Example

```js
// systems/todo-system.js
import { createVueSystemBuilder } from 'mycelia-kernel-plugin/vue';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

export const buildTodoSystem = createVueSystemBuilder(
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
      .onInit(async (api, ctx) => {
        console.log(`Todo system ${api.name} initialized`);
      })
);

// main.js
import { createApp } from 'vue';
import { MyceliaPlugin } from 'mycelia-kernel-plugin/vue';
import { buildTodoSystem } from './systems/todo-system';
import App from './App.vue';

const app = createApp(App);
app.use(MyceliaPlugin, { build: buildTodoSystem });
app.mount('#app');
```

## Benefits

1. **Separation of Concerns** - System configuration separate from Vue components
2. **Reusability** - Same builder can be used in multiple places
3. **Testability** - Easy to test system builders independently
4. **Maintainability** - Centralized system configuration
5. **Type Safety** - Better TypeScript inference with explicit builders

## See Also

- [useBase](../standalone/STANDALONE-PLUGIN-SYSTEM.md#usebase) - Core builder API
- [Core Bindings](./CORE-BINDINGS.md) - Plugin and basic composables
- [Facet Composable Generator](./COMPOSABLE-GENERATOR.md) - Custom composable generation




