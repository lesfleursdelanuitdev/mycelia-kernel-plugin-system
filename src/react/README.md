# Mycelia Plugin System - React Bindings

React utilities that make the Mycelia Plugin System feel natural inside React applications.

## Installation

```bash
npm install mycelia-kernel-plugin react
```

## Quick Start

```tsx
import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/react';
import { useBase, useListeners, useDatabase } from 'mycelia-kernel-plugin';

// Create system builder
const buildSystem = () =>
  useBase('my-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// Bootstrap your app
function App() {
  return (
    <MyceliaProvider build={buildSystem}>
      <MyComponent />
    </MyceliaProvider>
  );
}

// Use in components
function MyComponent() {
  const db = useFacet('database');
  const system = useMycelia();
  
  useListener('user:created', (msg) => {
    console.log('User created:', msg.body);
  });
  
  // Use db, system, etc.
}
```

## API Reference

### Core Bindings

#### `MyceliaProvider`

Provides Mycelia system to React tree.

```tsx
<MyceliaProvider 
  build={() => useBase('app').use(useDatabase).build()}
  fallback={<Loading />} // Optional
>
  <App />
</MyceliaProvider>
```

#### `useMycelia()`

Get the Mycelia system from context.

```tsx
const system = useMycelia();
const db = system.find('database');
```

#### `useFacet(kind)`

Get a facet by kind.

```tsx
const db = useFacet('database');
```

### Listener Helpers

#### `useListener(eventName, handler, deps?)`

Register an event listener with automatic cleanup.

```tsx
useListener('todo:created', (msg) => {
  console.log('Todo created:', msg.body);
}, []); // deps array
```

#### `useEventStream(eventName, options?)`

Subscribe to events and keep them in React state.

```tsx
// Latest event
const latestEvent = useEventStream('todo:created');

// Accumulated events
const allEvents = useEventStream('todo:created', { accumulate: true });
```

### Queue Helpers

#### `useQueueStatus()`

Get queue status with reactive updates.

```tsx
const status = useQueueStatus();
// { size, capacity, utilization, isFull }
```

#### `useQueueDrain(options?)`

Automatically drain queue on mount.

```tsx
useQueueDrain({
  interval: 100,
  onMessage: (msg, options) => {
    console.log('Processed:', msg);
  }
});
```

### Builder Helpers

#### `createReactSystemBuilder(name, configure)`

Create a reusable system builder function.

```tsx
const buildTodoSystem = createReactSystemBuilder('todo-app', (b) =>
  b
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
);

<MyceliaProvider build={buildTodoSystem}>
  <App />
</MyceliaProvider>
```

### Facet Hook Generator

#### `createFacetHook(kind)`

Generate a custom hook for a specific facet kind.

```tsx
// In bindings/todo-hooks.ts
export const useTodoStore = createFacetHook('todoStore');
export const useAuth = createFacetHook('auth');

// In component
function TodoList() {
  const todoStore = useTodoStore();
  // Use todoStore...
}
```

## Examples

See the main [README.md](../../README.md) and [examples](../../examples/) directory for more examples.

## Requirements

- React >= 16.8.0 (for hooks support)
- Mycelia Plugin System (included)

