# React Bindings

React utilities that make the Mycelia Plugin System feel natural inside React applications.

## Overview

The React bindings provide a set of hooks and components that integrate the Mycelia Plugin System seamlessly with React. They handle lifecycle management, context provisioning, and automatic cleanup, making the plugin system feel like a native React data layer.

## Installation

```bash
npm install mycelia-kernel-plugin react
```

**Requirements:**
- React >= 16.8.0 (for hooks support)
- Mycelia Plugin System (included in package)

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

## Documentation

- **[Core Bindings](./CORE-BINDINGS.md)** - Provider and basic hooks
- **[Listener Helpers](./LISTENER-HELPERS.md)** - Event listener utilities
- **[Queue Helpers](./QUEUE-HELPERS.md)** - Queue management utilities
- **[Builder Helpers](./BUILDER-HELPERS.md)** - System builder utilities
- **[Facet Hook Generator](./FACET-HOOK-GENERATOR.md)** - Custom hook generation

## Features

- **Automatic Lifecycle Management** - System is built on mount and disposed on unmount
- **Context-Based Access** - System available throughout component tree
- **Automatic Cleanup** - Listeners and effects cleaned up automatically
- **Error Handling** - Errors thrown to React error boundaries
- **TypeScript-Friendly** - Full JSDoc comments for type inference
- **No Circular Dependencies** - Clean module boundaries

## Examples

See the [Examples](../examples/README.md) directory for complete React examples.

## API Reference

### Core Bindings

- **[MyceliaProvider](./CORE-BINDINGS.md#myceliaprovider)** - Provides system to React tree
- **[useMycelia()](./CORE-BINDINGS.md#usemycelia)** - Get system from context
- **[useFacet(kind)](./CORE-BINDINGS.md#usefacet)** - Get facet by kind

### Listener Helpers

- **[useListener(eventName, handler, deps)](./LISTENER-HELPERS.md#uselistener)** - Register event listener
- **[useEventStream(eventName, options)](./LISTENER-HELPERS.md#useeventstream)** - Subscribe to events in state

### Queue Helpers

- **[useQueueStatus()](./QUEUE-HELPERS.md#usequeuestatus)** - Get queue status
- **[useQueueDrain(options)](./QUEUE-HELPERS.md#usequeuedrain)** - Automatically drain queue

### Builder Helpers

- **[createReactSystemBuilder(name, configure)](./BUILDER-HELPERS.md#createreactsystembuilder)** - Create reusable builder

### Facet Hook Generator

- **[createFacetHook(kind)](./FACET-HOOK-GENERATOR.md#createfacetHook)** - Generate custom hooks

## Best Practices

1. **System Builder** - Create system builders outside components to avoid recreating on every render
2. **Error Boundaries** - Wrap `MyceliaProvider` in an error boundary to handle build errors
3. **Loading States** - Use the `fallback` prop to show loading states
4. **Facet Hooks** - Use `createFacetHook` to create domain-specific hooks
5. **Listener Cleanup** - Dependencies array in `useListener` should include all values used in handler

## Troubleshooting

### "useMycelia must be used within a MyceliaProvider"

**Problem:** Hook used outside provider.

**Solution:** Wrap your component tree with `MyceliaProvider`.

### System not building

**Problem:** Build function errors or never resolves.

**Solution:** Check error boundaries, verify build function is async and returns a system.

### Listeners not firing

**Problem:** Events not being received.

**Solution:** Ensure listeners are enabled (`system.listeners.enableListeners()`) and system is built.

## See Also

- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [useQueue Hook](../hooks/USE-QUEUE.md) - Queue system documentation
- [Examples](../examples/README.md) - Complete examples

