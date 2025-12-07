# Vue Bindings

Vue utilities that make the Mycelia Plugin System feel natural inside Vue 3 applications using the Composition API.

## Overview

The Vue bindings provide a set of composables and a plugin that integrate the Mycelia Plugin System seamlessly with Vue 3. They handle lifecycle management, dependency injection via provide/inject, and automatic cleanup, making the plugin system feel like a native Vue data layer.

## Installation

```bash
npm install mycelia-kernel-plugin vue
```

**Requirements:**
- Vue >= 3.0.0 (for Composition API support)
- Mycelia Plugin System (included in package)

## Quick Start

```js
import { createApp } from 'vue';
import { MyceliaPlugin, useFacet, useListener } from 'mycelia-kernel-plugin/vue';
import { useBase, useListeners, useDatabase } from 'mycelia-kernel-plugin';

// Create system builder
const buildSystem = () =>
  useBase('my-app')
    .config('database', { host: 'localhost' })
    .use(useDatabase)
    .use(useListeners)
    .build();

// Bootstrap your app
const app = createApp(App);
app.use(MyceliaPlugin, { build: buildSystem });
app.mount('#app');

// Use in components
export default {
  setup() {
    const db = useFacet('database');
    const system = useMycelia();
    
    useListener('user:created', (msg) => {
      console.log('User created:', msg.body);
    });
    
    // Use db, system, etc.
    return { db, system };
  }
}
```

## Documentation

- **[Core Bindings](./CORE-BINDINGS.md)** - Plugin and basic composables
- **[Listener Helpers](./LISTENER-HELPERS.md)** - Event listener utilities
- **[Queue Helpers](./QUEUE-HELPERS.md)** - Queue management utilities
- **[Builder Helpers](./BUILDER-HELPERS.md)** - System builder utilities
- **[Facet Composable Generator](./COMPOSABLE-GENERATOR.md)** - Custom composable generation

## Features

- **Automatic Lifecycle Management** - System is built on plugin install and disposed on app unmount
- **Provide/Inject Access** - System available throughout component tree via Vue's dependency injection
- **Automatic Cleanup** - Listeners and effects cleaned up automatically on component unmount
- **Error Handling** - Errors thrown during build are propagated to Vue error handlers
- **TypeScript-Friendly** - Full JSDoc comments for type inference
- **No Circular Dependencies** - Clean module boundaries
- **Reactive** - All composables return Vue refs for reactive updates

## Examples

See the [Examples](../examples/README.md) directory for complete Vue examples.

## API Reference

### Core Bindings

- **[MyceliaPlugin](./CORE-BINDINGS.md#myceliaplugin)** - Vue plugin that provides system to app
- **[useMycelia()](./CORE-BINDINGS.md#usemycelia)** - Get system from inject
- **[useMyceliaContext()](./CORE-BINDINGS.md#usemyceliacontext)** - Get full context (system, loading, error)
- **[useFacet(kind)](./CORE-BINDINGS.md#usefacet)** - Get facet by kind
- **[useMyceliaCleanup(options)](./CORE-BINDINGS.md#usemyceliacleanup)** - Automatic or manual system cleanup

### Listener Helpers

- **[useListener(eventName, handler)](./LISTENER-HELPERS.md#uselistener)** - Register event listener
- **[useEventStream(eventName, options)](./LISTENER-HELPERS.md#useeventstream)** - Subscribe to events in reactive state

### Queue Helpers

- **[useQueueStatus()](./QUEUE-HELPERS.md#usequeuestatus)** - Get queue status
- **[useQueueDrain(options)](./QUEUE-HELPERS.md#usequeuedrain)** - Automatically drain queue

### Builder Helpers

- **[createVueSystemBuilder(name, configure)](./BUILDER-HELPERS.md#createvuesystembuilder)** - Create reusable builder

### Facet Composable Generator

- **[createFacetComposable(kind)](./COMPOSABLE-GENERATOR.md#createfacetcomposable)** - Generate custom composables

## Best Practices

1. **System Builder** - Create system builders outside components to avoid recreating on every render
2. **Error Handling** - Use Vue error handlers to catch build errors
3. **Loading States** - Use `useMyceliaContext()` to access loading and error states
4. **Facet Composables** - Use `createFacetComposable` to create domain-specific composables
5. **Reactive Refs** - Remember to use `.value` when accessing refs in templates and scripts
6. **Cleanup** - Use `useMyceliaCleanup()` in root components for automatic cleanup on unmount

## Troubleshooting

### "useMycelia must be used within MyceliaPlugin"

**Problem:** Composable used before plugin is installed.

**Solution:** Ensure `app.use(MyceliaPlugin, { build: buildSystem })` is called before mounting the app.

### System not building

**Problem:** Build function errors or never resolves.

**Solution:** Check error handlers, verify build function is async and returns a system.

### Listeners not firing

**Problem:** Events not being received.

**Solution:** Ensure listeners are enabled (`system.listeners.enableListeners()`) and system is built.

### Template not reactive

**Problem:** Changes to facets not updating template.

**Solution:** Remember that `useFacet` returns a ref - use `.value` in script, but Vue automatically unwraps refs in templates.

## See Also

- [Standalone Plugin System](../standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation
- [useListeners Hook](../hooks/USE-LISTENERS.md) - Event system documentation
- [useQueue Hook](../hooks/USE-QUEUE.md) - Queue system documentation
- [Examples](../examples/README.md) - Complete examples

