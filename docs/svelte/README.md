# Svelte Bindings

Svelte utilities that make the Mycelia Plugin System feel natural inside Svelte applications using stores and context.

## Overview

The Svelte bindings provide a set of stores and context utilities that integrate the Mycelia Plugin System seamlessly with Svelte. They handle context provisioning, reactive state management via stores, and automatic cleanup, making the plugin system feel like a native Svelte data layer.

## Installation

```bash
npm install mycelia-kernel-plugin svelte
```

**Requirements:**
- Svelte >= 3.0.0 (for stores and context support)
- Mycelia Plugin System (included in package)

## Quick Start

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { setMyceliaSystem, useFacet, useListener } from 'mycelia-kernel-plugin/svelte';
  import { useBase, useListeners, useDatabase } from 'mycelia-kernel-plugin';

  let system;
  
  onMount(async () => {
    system = await useBase('my-app')
      .config('database', { host: 'localhost' })
      .use(useDatabase)
      .use(useListeners)
      .build();
    
    setMyceliaSystem(system);
  });
</script>

<!-- MyComponent.svelte -->
<script>
  import { useFacet, useListener } from 'mycelia-kernel-plugin/svelte';
  
  const dbStore = useFacet('database');
  $: db = $dbStore;
  
  useListener('user:created', (msg) => {
    console.log('User created:', msg.body);
  });
</script>
```

## Documentation

- **[Core Bindings](./CORE-BINDINGS.md)** - Context and basic stores
- **[Listener Helpers](./LISTENER-HELPERS.md)** - Event listener utilities
- **[Queue Helpers](./QUEUE-HELPERS.md)** - Queue management utilities
- **[Builder Helpers](./BUILDER-HELPERS.md)** - System builder utilities
- **[Store Generator](./STORE-GENERATOR.md)** - Custom store generation

## Features

- **Context-Based Access** - System available throughout component tree via Svelte context
- **Reactive Stores** - All utilities return Svelte stores for automatic reactivity
- **Automatic Cleanup** - Listeners and effects cleaned up automatically on component destroy
- **Error Handling** - Errors can be handled via error stores
- **TypeScript-Friendly** - Full JSDoc comments for type inference
- **No Circular Dependencies** - Clean module boundaries
- **Store Subscription** - Use `$store` syntax for automatic subscription

## Examples

See the [Examples](../examples/README.md) directory for complete Svelte examples.

## API Reference

### Core Bindings

- **[setMyceliaSystem(system)](./CORE-BINDINGS.md#setmyceliasystem)** - Provide system to component tree
- **[getMyceliaSystem()](./CORE-BINDINGS.md#getmyceliasystem)** - Get system store from context
- **[getMyceliaContext()](./CORE-BINDINGS.md#getmyceliacontext)** - Get full context (system, loading, error stores)
- **[useMycelia()](./CORE-BINDINGS.md#usemycelia)** - Get system store
- **[useFacet(kind)](./CORE-BINDINGS.md#usefacet)** - Get facet by kind

### Listener Helpers

- **[useListener(eventName, handler)](./LISTENER-HELPERS.md#uselistener)** - Register event listener
- **[useEventStream(eventName, options)](./LISTENER-HELPERS.md#useeventstream)** - Subscribe to events in store

### Queue Helpers

- **[useQueueStatus()](./QUEUE-HELPERS.md#usequeuestatus)** - Get queue status
- **[useQueueDrain(options)](./QUEUE-HELPERS.md#usequeuedrain)** - Automatically drain queue

### Builder Helpers

- **[createSvelteSystemBuilder(name, configure)](./BUILDER-HELPERS.md#createsveltesystembuilder)** - Create reusable builder

### Store Generator

- **[createFacetStore(kind)](./STORE-GENERATOR.md#createfacetstore)** - Generate custom stores

## Best Practices

1. **System Builder** - Create system builders outside components to avoid recreating on every render
2. **Error Handling** - Use error stores to handle build errors
3. **Loading States** - Use `getMyceliaContext()` to access loading and error stores
4. **Facet Stores** - Use `createFacetStore` to create domain-specific stores
5. **Store Subscription** - Use `$store` syntax for automatic subscription in templates
6. **Reactive Statements** - Use `$:` for derived state from stores

## Troubleshooting

### "getMyceliaSystem must be used within setMyceliaSystem context"

**Problem:** Store accessed before context is set.

**Solution:** Ensure `setMyceliaSystem(system)` is called in a parent component before using stores.

### System not building

**Problem:** Build function errors or never resolves.

**Solution:** Check error handling, verify build function is async and returns a system.

### Listeners not firing

**Problem:** Events not being received.

**Solution:** Ensure listeners are enabled (`system.listeners.enableListeners()`) and system is built.

### Store not reactive

**Problem:** Changes to facets not updating template.

**Solution:** Remember to use `$store` syntax in templates for automatic subscription, or manually subscribe in script.

## See Also

- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [useQueue Hook](../hooks/USE-QUEUE.md) - Queue system documentation
- [Examples](../examples/README.md) - Complete examples

