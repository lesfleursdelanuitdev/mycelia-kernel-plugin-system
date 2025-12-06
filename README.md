# Mycelia Plugin System

A sophisticated, dependency-aware plugin system with transaction safety and lifecycle management.

## Overview

Mycelia Plugin System is a standalone plugin architecture extracted from [Mycelia Kernel](https://github.com/lesfleursdelanuitdev/mycelia-kernel). It provides:

- **Hook-based composition** - Extend systems without modification
- **Dependency resolution** - Automatic topological sorting
- **Transaction safety** - Atomic installation with rollback
- **Lifecycle management** - Built-in initialization and disposal
- **Facet contracts** - Runtime validation of plugin interfaces
- **Standalone mode** - Works without message system or other dependencies

## Quick Start

```javascript
import { StandalonePluginSystem, createHook, Facet } from '@mycelia/plugin-system';

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

## Installation

```bash
npm install @mycelia/plugin-system
```

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

### Facet Contracts
Validate plugin interfaces at build time:

```javascript
import { createFacetContract } from '@mycelia/plugin-system';

const databaseContract = createFacetContract({
  name: 'database',
  requiredMethods: ['query', 'close'],
  requiredProperties: ['connection']
});

// Contract is automatically enforced during build
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

### Utilities

- **`createLogger()`** - Create a logger
- **`getDebugFlag()`** - Extract debug flag from config

## Examples

See the `examples/` directory for:
- Basic plugin usage
- Plugins with dependencies
- Lifecycle management
- Contract validation

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

