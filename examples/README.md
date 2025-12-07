# Examples

Complete, runnable examples demonstrating the Mycelia Plugin System.

## Available Examples

### Basic Examples

- **[hello-world.js](./hello-world.js)** - Simple "Hello World" example using `useSpeak`
- **[use-base-example.js](./use-base-example.js)** - Demonstrates the `useBase` fluent API
- **[use-listeners-example.js](./use-listeners-example.js)** - Event-driven listener management
- **[use-queue-example.js](./use-queue-example.js)** - Message queue management

### React Examples

- **[react-todo/](./react-todo/)** - Complete React Todo application
  - Demonstrates React bindings integration
  - Event-driven state management
  - Plugin-based architecture
  - See [react-todo/README.md](./react-todo/README.md) for details

## Running Examples

### Node.js Examples

All Node.js examples can be run directly:

```bash
node examples/hello-world.js
node examples/use-base-example.js
node examples/use-listeners-example.js
node examples/use-queue-example.js
```

### React Todo Example

The React Todo example requires React and a bundler. See [react-todo/README.md](./react-todo/README.md) for setup instructions.

## Example Highlights

### hello-world.js

Simple example showing:
- Basic system setup
- Using `useSpeak` hook
- System lifecycle

### use-base-example.js

Demonstrates:
- Fluent API with `useBase`
- Configuration management
- Conditional hooks
- Lifecycle callbacks

### use-listeners-example.js

Shows:
- Event listener registration
- Event emission
- Multiple listeners per event

### use-queue-example.js

Demonstrates:
- Queue configuration
- Message enqueueing
- Queue status monitoring
- Message processing

### react-todo/

Complete application showing:
- React bindings (`MyceliaProvider`, `useFacet`, `useListener`)
- Custom plugin creation (`useTodos` hook)
- Event-driven state synchronization
- Separation of concerns (plugin logic vs UI)

## Learning Path

1. **Start with hello-world.js** - Understand basic concepts
2. **Try use-base-example.js** - Learn the fluent API
3. **Explore use-listeners-example.js** - Understand events
4. **Check use-queue-example.js** - Learn queue management
5. **Study react-todo/** - See full React integration

## See Also

- [Getting Started Guide](../docs/getting-started/README.md) - Quick start tutorial
- [React Bindings Documentation](../docs/react/README.md) - React integration guide
- [Built-in Hooks Documentation](../docs/hooks/README.md) - Hook documentation
- [Standalone Plugin System](../docs/standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system guide

