# Builder Helpers

Utilities for creating reusable system builders in Qwik applications.

## Overview

Builder helpers make it easy to create and reuse system builders, keeping Qwik code clean and avoiding direct `useBase` calls in components.

## createQwikSystemBuilder

Create a reusable system builder function.

### API

```tsx
createQwikSystemBuilder(
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
import { createQwikSystemBuilder } from 'mycelia-kernel-plugin/qwik';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

const buildTodoSystem = createQwikSystemBuilder(
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
export default component$(() => {
  return (
    <MyceliaProvider build={buildTodoSystem}>
      <App />
    </MyceliaProvider>
  );
});
```

## Complete Example

```tsx
// systems/todo-system.ts
import { createQwikSystemBuilder } from 'mycelia-kernel-plugin/qwik';
import { useDatabase, useListeners, useQueue } from 'mycelia-kernel-plugin';

export const buildTodoSystem = createQwikSystemBuilder(
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

// App.tsx
import { MyceliaProvider } from 'mycelia-kernel-plugin/qwik';
import { buildTodoSystem } from './systems/todo-system';

export default component$(() => {
  return (
    <MyceliaProvider build={buildTodoSystem}>
      <TodoApp />
    </MyceliaProvider>
  );
});
```

## See Also

- [useBase](../standalone/STANDALONE-PLUGIN-SYSTEM.md#usebase) - Core builder API
- [Core Bindings](./CORE-BINDINGS.md) - Provider and basic hooks
- [Signal Generator](./SIGNAL-GENERATOR.md) - Custom signal generation


