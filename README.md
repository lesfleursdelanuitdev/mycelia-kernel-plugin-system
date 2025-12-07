# Mycelia Plugin System

A sophisticated, **framework-agnostic** plugin system with transaction safety, lifecycle management, and official bindings for React and Vue 3.

## Overview

Mycelia Plugin System is a **framework-agnostic**, standalone plugin architecture extracted from [Mycelia Kernel](https://github.com/lesfleursdelanuitdev/mycelia-kernel). It provides:

- **Framework-agnostic** - Write domain logic once, use it with React, Vue, or any framework. Plugins are completely independent of UI frameworks
- **Hook-based composition** - Extend systems without modification
- **Dependency resolution** - Automatic topological sorting
- **Transaction safety** - Atomic installation with rollback
- **Lifecycle management** - Built-in initialization and disposal
- **Hot reloading** - Reload and extend plugins without full teardown
- **Facet contracts** - Runtime validation of plugin interfaces
- **Standalone mode** - Works without message system or other dependencies
- **Built-in hooks** - Ships with `useListeners` for event-driven architectures (see [Simple Event System Example](#simple-event-system-example)), plus `useQueue` and `useSpeak`
- **Framework bindings** - Official bindings for [React](#react-bindings), [Vue 3](#vue-bindings), and [Svelte](#svelte-bindings) with more coming soon

**Facets** are the concrete runtime capabilities produced by hooks and attached to the system.

### Framework Integration

The system is designed to be framework-agnostic. Your domain logic lives in Mycelia plugins, which can be used with any framework:

- **React** - Use `MyceliaProvider` and React hooks (`useFacet`, `useListener`)
- **Vue 3** - Use `MyceliaPlugin` and Vue composables (`useFacet`, `useListener`)
- **Svelte** - Use `setMyceliaSystem` and Svelte stores (`useFacet`, `useListener`)
- **Vanilla JS/Node.js** - Use the system directly without any framework bindings

See the [React Todo App](./examples/react-todo/README.md), [Vue Todo App](./examples/vue-todo/README.md), and [Svelte Todo App](./examples/svelte-todo/README.md) examples - they all use the **exact same plugin code**, demonstrating true framework independence.

## Quick Start

### Using useBase (Recommended)

```javascript
import { useBase, createHook, Facet } from 'mycelia-kernel-plugin';

// Create a hook
const useDatabase = createHook({
  kind: 'database',
  version: '1.0.0',
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const config = ctx.config?.database || {};
    
    return new Facet('database', { 
      attach: true, 
      source: import.meta.url 
    })
    .add({
      async query(sql) {
        // Database query implementation
        return { rows: [] };
      },
      
      async close() {
        // Cleanup
      }
    })
    .onInit(async ({ ctx }) => {
      // Initialize database connection
    })
    .onDispose(async () => {
      // Close database connection
    });
  }
});

// Create and use the system with fluent API
const system = await useBase('my-app')
  .config('database', { host: 'localhost' })
  .use(useDatabase)
  .build();

// Use the plugin
const db = system.find('database');
await db.query('SELECT * FROM users');
```

### Using StandalonePluginSystem Directly

```javascript
import { StandalonePluginSystem, createHook, Facet } from 'mycelia-kernel-plugin';

// Create a hook (same as above)
const useDatabase = createHook({ /* ... */ });

// Create and use the system
const system = new StandalonePluginSystem('my-app', {
  config: {
    database: { host: 'localhost' }
  }
});

system
  .use(useDatabase)
  .build();

// Use the plugin
const db = system.find('database');
await db.query('SELECT * FROM users');
```

### Simple Event System Example

Create an event-driven system with `useBase` and `useListeners`:

```javascript
import { useBase, useListeners } from 'mycelia-kernel-plugin';

// Create an event system
const eventSystem = await useBase('event-system')
  .config('listeners', { registrationPolicy: 'multiple' })
  .use(useListeners)
  .build();

// Enable listeners
eventSystem.listeners.enableListeners();

// Register event handlers
eventSystem.listeners.on('user:created', (message) => {
  console.log('User created:', message.body);
});

eventSystem.listeners.on('user:updated', (message) => {
  console.log('User updated:', message.body);
});

// Emit events
eventSystem.listeners.emit('user:created', {
  type: 'user:created',
  body: { id: 1, name: 'John Doe' }
});

eventSystem.listeners.emit('user:updated', {
  type: 'user:updated',
  body: { id: 1, name: 'Jane Doe' }
});

// Multiple handlers for the same event
eventSystem.listeners.on('order:placed', (message) => {
  console.log('Order notification:', message.body);
});

eventSystem.listeners.on('order:placed', (message) => {
  console.log('Order logging:', message.body);
});

// Both handlers will be called
eventSystem.listeners.emit('order:placed', {
  type: 'order:placed',
  body: { orderId: 123, total: 99.99 }
});

// Cleanup
await eventSystem.dispose();
```

## Installation

```bash
npm install mycelia-kernel-plugin
```

## What This System Is Not

This system intentionally does not provide dependency injection containers, service locators, or global mutable state. It focuses on explicit lifecycle management and composable plugin architecture rather than implicit dependency resolution or shared global state.

## Features

### Hook System
Create composable plugins using the `createHook` factory:

```javascript
const useCache = createHook({
  kind: 'cache',
  required: ['database'], // Dependencies
  attach: true,
  source: import.meta.url,
  fn: (ctx, api, subsystem) => {
    const db = subsystem.find('database');
    
    return new Facet('cache', { attach: true })
      .add({
        async get(key) {
          // Cache implementation
        }
      });
  }
});
```

### Dependency Resolution
Dependencies are automatically resolved and initialized in the correct order:

```javascript
system
  .use(useDatabase)  // Will be initialized first
  .use(useCache)      // Will be initialized after database
  .build();
```

### Transaction Safety
If any plugin fails during initialization, all changes are rolled back:

```javascript
try {
  await system
    .use(useDatabase)
    .use(useCache)
    .build();
} catch (error) {
  // System is in clean state - all plugins rolled back
}
```

### Hot Reloading
Reload the system and add more plugins without full teardown:

```javascript
// Initial build
await system.use(useDatabase).build();

// Hot reload - add more plugins
await system.reload();
await system.use(useCache).use(useAuth).build();

// All plugins (old + new) are now active
```

The `reload()` method:
- Disposes all facets and resets built state
- Preserves hooks and configuration
- Allows adding more hooks and rebuilding
- Perfect for development and hot-reload scenarios

**Note:** Persistent external state (e.g., database contents, file system state) is not automatically reverted. The `reload()` method only manages the plugin system's internal state.

### Facet Contracts
Validate plugin interfaces at build time:

```javascript
import { createFacetContract } from 'mycelia-kernel-plugin';

const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'close'],
  requiredProperties: ['connection']
});

// Contract is automatically enforced during build
```

If a facet doesn't satisfy its contract, build fails with a clear error:
```
Error: FacetContract 'database': facet is missing required methods: close
```

## Architecture

```
StandalonePluginSystem
  ├── BaseSubsystem (base class)
  ├── SubsystemBuilder (build orchestrator)
  ├── FacetManager (plugin registry)
  ├── FacetContractRegistry (contract validation)
  └── DependencyGraphCache (performance optimization)
```

## API Reference

### Core Classes

- **`StandalonePluginSystem`** - Main plugin system class
- **`BaseSubsystem`** - Base class for plugin containers
- **`SubsystemBuilder`** - Build orchestrator
- **`FacetManager`** - Plugin registry
- **`FacetContractRegistry`** - Contract validation

### Factory Functions

- **`createHook()`** - Create a plugin hook
- **`createFacetContract()`** - Create a facet contract
- **`useBase()`** - Fluent API builder for StandalonePluginSystem

### Utilities

- **`createLogger()`** - Create a logger
- **`getDebugFlag()`** - Extract debug flag from config

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- **[Getting Started Guide](./docs/getting-started/README.md)** - Quick start with examples
- **[Hooks and Facets Overview](./docs/core-concepts/HOOKS-AND-FACETS-OVERVIEW.md)** - Core concepts
- **[Built-in Hooks](./docs/hooks/README.md)** - Documentation for `useListeners`, `useQueue`, and `useSpeak`
- **[React Bindings](./docs/react/README.md)** - React integration utilities (`MyceliaProvider`, `useFacet`, `useListener`)
- **[Vue Bindings](./docs/vue/README.md)** - Vue 3 integration utilities (`MyceliaPlugin`, `useFacet`, `useListener`) ⭐
- **[Svelte Bindings](./docs/svelte/README.md)** - Svelte integration utilities (`setMyceliaSystem`, `useFacet`, `useListener`) ⭐
- **[Standalone Plugin System](./docs/standalone/STANDALONE-PLUGIN-SYSTEM.md)** - Complete usage guide
- **[Documentation Index](./docs/README.md)** - Full documentation index

## Examples

See the `examples/` directory for:
- Basic plugin usage
- Plugins with dependencies
- Lifecycle management
- Contract validation
- Hot reloading
- useBase fluent API

### Framework Integration Examples

- **[React Todo App](./examples/react-todo/README.md)** – A real-world example showing:
  - Domain logic as a Mycelia facet (`useTodos` hook)
  - Event-driven state synchronization (`todos:changed` events)
  - React bindings (`MyceliaProvider`, `useFacet`, `useListener`)

- **[Vue Todo App](./examples/vue-todo/README.md)** ⭐ – A complete Vue 3 example demonstrating:
  - **Framework-agnostic plugins** - Uses the same shared plugin code as the React example
  - Event-driven state synchronization (`todos:changed` events)
  - Vue 3 bindings (`MyceliaPlugin`, `useFacet`, `useListener`)
  - Composition API integration with reactive state management

- **[Svelte Todo App](./examples/svelte-todo/README.md)** ⭐ – A complete Svelte example demonstrating:
  - **Framework-agnostic plugins** - Uses the same shared plugin code as React and Vue examples
  - Event-driven state synchronization (`todos:changed` events)
  - Svelte bindings (`setMyceliaSystem`, `useFacet`, `useListener`)
  - Store-based reactivity with automatic subscription

All three examples use the **exact same Mycelia plugin code** from `examples/todo-shared/`, proving that plugins are truly framework-independent. Write your domain logic once, use it everywhere!

## CLI Tool

The package includes a CLI tool for scaffolding hooks, contracts, and projects:

```bash
# Create a new hook
npx mycelia-kernel-plugin create hook database

# Create a new contract
npx mycelia-kernel-plugin create contract database

# Initialize a new project
npx mycelia-kernel-plugin init my-app
```

Or install globally:
```bash
npm install -g mycelia-kernel-plugin
mycelia-kernel-plugin create hook database
```

## Testing

```bash
npm test
npm run test:watch
```

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- **GitHub:** https://github.com/lesfleursdelanuitdev/mycelia-kernel-plugin-system
- **Main Project:** https://github.com/lesfleursdelanuitdev/mycelia-kernel

---

Made with ❤️ by [@lesfleursdelanuitdev](https://github.com/lesfleursdelanuitdev)

