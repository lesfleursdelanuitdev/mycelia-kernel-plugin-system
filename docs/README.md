# Mycelia Plugin System Documentation

Welcome to the Mycelia Plugin System documentation! This documentation covers all aspects of the plugin system, from basic concepts to advanced usage patterns.

## Documentation Structure

### Getting Started
- **[Getting Started Guide](./getting-started/README.md)** - Quick start guide with examples

### Core Concepts
- **[Hooks and Facets Overview](./core-concepts/HOOKS-AND-FACETS-OVERVIEW.md)** - Introduction to the core concepts
- **[BaseSubsystem](./core-concepts/BASE-SUBSYSTEM.md)** - Base class for plugin containers
- **[Hooks](./core-concepts/HOOKS.md)** - Detailed hook documentation
- **[Facets](./core-concepts/FACETS.md)** - Detailed facet documentation
- **[Facet Manager](./core-concepts/FACET-MANAGER.md)** - Facet management system
- **[Facet Manager Transaction](./core-concepts/FACET-MANAGER-TRANSACTION.md)** - Transactional operations
- **[Facet Init Callback](./core-concepts/FACET-INIT-CALLBACK.md)** - Initialization interface

### Standalone Plugin System
- **[Standalone Plugin System](./standalone/STANDALONE-PLUGIN-SYSTEM.md)** - Complete guide to using the system standalone

### Built-in Hooks
- **[Built-in Hooks Overview](./hooks/README.md)** - Overview of available hooks
- **[useListeners](./hooks/USE-LISTENERS.md)** - Event-driven listener management
- **[useQueue](./hooks/USE-QUEUE.md)** - Message queue management
- **[useSpeak](./hooks/USE-SPEAK.md)** - Simple output/printing functionality

### Facet Contracts
- **[Facet Contracts Overview](./facet-contracts/FACET-CONTRACTS-OVERVIEW.md)** - Contract system overview
- **[Facet Contract](./facet-contracts/FACET-CONTRACT.md)** - Creating and using contracts
- **[Facet Contract Registry](./facet-contracts/FACET-CONTRACT-REGISTRY.md)** - Contract registry

### API Reference
- **[Hook Function Context](./api-reference/HOOK-FUNCTION-CONTEXT.md)** - Context parameter documentation
- **[Hook Function API Parameter](./api-reference/HOOK-FUNCTION-API-PARAM.md)** - API parameter documentation
- **[Hook Function Subsystem Parameter](./api-reference/HOOK-FUNCTION-SUBSYSTEM-PARAM.md)** - Subsystem parameter documentation

### Architecture
- **[Build Process](./architecture/BUILD-PROCESS.md)** - How the system builds and installs plugins
- **[Builder Components](./architecture/BUILDER-COMPONENTS.md)** - Internal builder implementation details
- **[Data Structures](./architecture/DATA-STRUCTURES.md)** - Internal data structures and formats
- **[Performance](./architecture/PERFORMANCE.md)** - Performance considerations and optimization
- **[Troubleshooting](./architecture/TROUBLESHOOTING.md)** - Common issues and debugging guide
- **[Plugin System Analysis](./architecture/PLUGIN-SYSTEM-ANALYSIS.md)** - Architecture overview and comparisons

### Examples
- **[Examples Overview](./examples/README.md)** - Complete, runnable examples
- **[Basic Plugin](./examples/basic-plugin.md)** - Create a simple plugin
- **[Plugin with Dependencies](./examples/plugin-with-dependencies.md)** - Dependencies example
- **[Lifecycle Management](./examples/lifecycle-management.md)** - Resource management
- **[Contract Validation](./examples/contract-validation.md)** - Using contracts
- **[Multiple Facets](./examples/multiple-facets.md)** - Multiple facets of same kind
- **[Error Handling](./examples/error-handling.md)** - Error handling patterns
- **[Hot Reloading](./examples/hot-reloading.md)** - Hot reloading and incremental extension

### Guides
- **[Guides Overview](./guides/README.md)** - Step-by-step guides
- **[Creating Plugins](./guides/creating-plugins.md)** - How to create plugins
- **[Dependency Management](./guides/dependency-management.md)** - Managing dependencies
- **[Best Practices](./guides/best-practices.md)** - Recommended patterns
- **[CLI Tool](./guides/cli-tool.md)** - Using the CLI for scaffolding

## Quick Navigation

### I want to...

- **Get started quickly** → [Getting Started Guide](./getting-started/README.md)
- **Understand the core concepts** → [Hooks and Facets Overview](./core-concepts/HOOKS-AND-FACETS-OVERVIEW.md)
- **Learn about BaseSubsystem** → [BaseSubsystem](./core-concepts/BASE-SUBSYSTEM.md)
- **Create a standalone plugin system** → [Standalone Plugin System](./standalone/STANDALONE-PLUGIN-SYSTEM.md)
- **Use built-in hooks** → [Built-in Hooks Overview](./hooks/README.md)
- **Learn about contracts** → [Facet Contracts Overview](./facet-contracts/FACET-CONTRACTS-OVERVIEW.md)
- **See examples** → [Examples](./examples/README.md)
- **Follow a guide** → [Creating Plugins](./guides/creating-plugins.md)
- **Understand the architecture** → [Build Process](./architecture/BUILD-PROCESS.md)
- **Compare with other systems** → [Plugin System Analysis](./architecture/PLUGIN-SYSTEM-ANALYSIS.md)
- **Debug issues** → [Troubleshooting](./architecture/TROUBLESHOOTING.md)
- **Optimize performance** → [Performance](./architecture/PERFORMANCE.md)

## Key Features

- **Hook-based Architecture** - Extend systems with composable plugins
- **Dependency Resolution** - Automatic topological sorting of dependencies
- **Transaction Safety** - Atomic plugin installation with rollback
- **Lifecycle Management** - Built-in initialization and disposal
- **Hot Reloading** - Reload and extend plugins without full teardown
- **Facet Contracts** - Runtime validation of plugin interfaces
- **Standalone Mode** - Works without message system dependencies

## Documentation Status

✅ **Completed:**
- Getting Started Guide
- Hooks and Facets Overview
- BaseSubsystem Documentation
- Standalone Plugin System Guide
- Hooks Documentation
- Built-in Hooks Documentation (useListeners, useQueue, useSpeak)
- Facets Documentation
- Facet Manager Documentation
- Facet Manager Transaction Documentation
- Facet Init Callback Documentation
- Facet Contracts Overview
- Facet Contract Documentation
- Facet Contract Registry Documentation
- Hook Function Context Documentation
- Hook Function API Parameter Documentation
- Hook Function Subsystem Parameter Documentation
- Build Process Documentation
- Builder Components Documentation
- Data Structures Documentation
- Performance Documentation
- Troubleshooting Documentation
- Plugin System Analysis

🎉 **Documentation Complete!**

✅ **Completed:**
- Examples and use cases
- Best practices guide
- Creating plugins guide
- Dependency management guide

🎉 **Documentation Complete!**

## Contributing

Documentation improvements are welcome! If you find errors or have suggestions, please open an issue or submit a pull request.

