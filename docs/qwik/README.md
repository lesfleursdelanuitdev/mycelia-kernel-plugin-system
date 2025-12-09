# Qwik Bindings

Qwik utilities that make the Mycelia Plugin System feel natural inside Qwik applications using signals and context.

## Overview

The Qwik bindings provide a set of components and hooks that integrate the Mycelia Plugin System seamlessly with Qwik. They handle lifecycle management, context provisioning, and automatic cleanup, making the plugin system feel like a native Qwik data layer.

## Installation

```bash
npm install mycelia-kernel-plugin @builder.io/qwik
```

**Requirements:**
- Qwik >= 1.0.0
- Mycelia Plugin System (included in package)

## Quick Start

```tsx
import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/qwik';
import { useBase, useListeners, useDatabase } from 'mycelia-kernel-plugin';

// Create system builder
const buildSystem = () =>
  useBase('my-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// Bootstrap your app
export default component$(() => {
  return (
    <MyceliaProvider build={buildSystem}>
      <MyComponent />
    </MyceliaProvider>
  );
});

// Use in components
export const MyComponent = component$(() => {
  const db = useFacet('database');
  const system = useMycelia();
  
  useListener('user:created', (msg) => {
    console.log('User created:', msg.body);
  });
  
  // Use db, system, etc.
});
```

## Documentation

- **[Core Bindings](./CORE-BINDINGS.md)** - Provider and basic hooks
- **[Listener Helpers](./LISTENER-HELPERS.md)** - Event listener utilities
- **[Queue Helpers](./QUEUE-HELPERS.md)** - Queue management utilities
- **[Builder Helpers](./BUILDER-HELPERS.md)** - System builder utilities
- **[Signal Generator](./SIGNAL-GENERATOR.md)** - Custom signal generation

## Features

- **Automatic Lifecycle Management** - System is built on mount and disposed on unmount
- **Context-Based Access** - System available throughout component tree
- **Automatic Cleanup** - Listeners and effects cleaned up automatically
- **Qwik Signals** - Reactive state with Qwik signals
- **TypeScript-Friendly** - Full type support
- **No Circular Dependencies** - Clean module boundaries

## Examples

See the [Examples](../examples/README.md) directory for complete Qwik examples, including the [Qwik Todo App](../../examples/qwik-todo/README.md).

## API Reference

### Core Bindings

- **[MyceliaProvider](./CORE-BINDINGS.md#myceliaprovider)** - Provides system to Qwik tree
- **[useMycelia()](./CORE-BINDINGS.md#usemycelia)** - Get system from context
- **[useFacet(kind)](./CORE-BINDINGS.md#usefacet)** - Get facet by kind

### Listener Helpers

- **[useListener(eventName, handler)](./LISTENER-HELPERS.md#uselistener)** - Register event listener
- **[useEventStream(eventName, options)](./LISTENER-HELPERS.md#useeventstream)** - Subscribe to events in signal

### Queue Helpers

- **[useQueueStatus()](./QUEUE-HELPERS.md#usequeuestatus)** - Get queue status
- **[useQueueDrain(options)](./QUEUE-HELPERS.md#usequeuedrain)** - Automatically drain queue

### Builder Helpers

- **[createQwikSystemBuilder(name, configure)](./BUILDER-HELPERS.md#createqwiksystembuilder)** - Create reusable builder

### Signal Generator

- **[createFacetSignal(kind)](./SIGNAL-GENERATOR.md#createfacetsignal)** - Generate custom signals

## Best Practices

1. **System Builder** - Create system builders outside components to avoid recreating on every render
2. **Error Handling** - Wrap `MyceliaProvider` in error boundaries to handle build errors
3. **Loading States** - Use the `fallback` prop to show loading states
4. **Facet Signals** - Use `createFacetSignal` to create domain-specific signals
5. **Listener Cleanup** - Cleanup is automatic with Qwik's lifecycle management

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


