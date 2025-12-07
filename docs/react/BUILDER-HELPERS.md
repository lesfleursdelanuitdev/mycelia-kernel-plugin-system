# Builder Helpers

Utilities for creating reusable system builders in React applications.

## Overview

Builder helpers make it easy to create and reuse system builders, keeping React code clean and avoiding direct `useBase` calls in components.

## createReactSystemBuilder

Create a reusable system builder function.

### API

```tsx
createReactSystemBuilder(
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

```tsx
import { createReactSystemBuilder } from 'mycelia-kernel-plugin/react';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

const buildTodoSystem = createReactSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', { host: 'localhost' })
      .config('queue', { capacity: 100 })
      .use(useDatabase)
      .use(useListeners)
      .use(useQueue)
);

// Use in Provider
<MyceliaProvider build={buildTodoSystem}>
  <App />
</MyceliaProvider>
```

### With Environment Configuration

```tsx
const buildSystem = createReactSystemBuilder(
  'my-app',
  (b) => {
    const config = {
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432')
      },
      queue: {
        capacity: parseInt(process.env.QUEUE_CAPACITY || '1000')
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

```tsx
const buildSystem = createReactSystemBuilder(
  'my-app',
  (b) => {
    let builder = b.use(useDatabase);
    
    if (process.env.ENABLE_CACHE === 'true') {
      builder = builder.use(useCache);
    }
    
    if (process.env.ENABLE_QUEUE === 'true') {
      builder = builder.use(useQueue);
    }
    
    return builder;
  }
);
```

### With Lifecycle Callbacks

```tsx
const buildSystem = createReactSystemBuilder(
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
   ```tsx
   // ✅ Good - in module scope
   const buildSystem = createReactSystemBuilder('app', (b) => b.use(useDatabase));
   
   // ❌ Bad - in component
   function App() {
     const buildSystem = createReactSystemBuilder('app', (b) => b.use(useDatabase));
   }
   ```

2. **Separate by Domain** - Create different builders for different domains:
   ```tsx
   // systems/api-system.ts
   export const buildApiSystem = createReactSystemBuilder('api', (b) =>
     b.use(useRouter).use(useAuth)
   );
   
   // systems/worker-system.ts
   export const buildWorkerSystem = createReactSystemBuilder('worker', (b) =>
     b.use(useQueue).use(useListeners)
   );
   ```

3. **Use Environment Variables** - Configure based on environment:
   ```tsx
   const buildSystem = createReactSystemBuilder('app', (b) => {
     const isDev = process.env.NODE_ENV === 'development';
     return b
       .config('database', { debug: isDev })
       .use(useDatabase);
   });
   ```

## Complete Example

```tsx
// systems/todo-system.ts
import { createReactSystemBuilder } from 'mycelia-kernel-plugin/react';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

export const buildTodoSystem = createReactSystemBuilder(
  'todo-app',
  (b) =>
    b
      .config('database', {
        host: process.env.DB_HOST || 'localhost',
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

// App.tsx
import { MyceliaProvider } from 'mycelia-kernel-plugin/react';
import { buildTodoSystem } from './systems/todo-system';

function App() {
  return (
    <MyceliaProvider build={buildTodoSystem}>
      <TodoApp />
    </MyceliaProvider>
  );
}
```

## Benefits

1. **Separation of Concerns** - System configuration separate from React components
2. **Reusability** - Same builder can be used in multiple places
3. **Testability** - Easy to test system builders independently
4. **Maintainability** - Centralized system configuration
5. **Type Safety** - Better TypeScript inference with explicit builders

## See Also

- [useBase](../standalone/STANDALONE-PLUGIN-SYSTEM.md#usebase) - Core builder API
- [Core Bindings](./CORE-BINDINGS.md) - Provider and basic hooks
- [Facet Hook Generator](./FACET-HOOK-GENERATOR.md) - Custom hook generation

