# Examples

Complete, runnable examples demonstrating the Mycelia Plugin System.

## Available Examples

### Basic Examples

- **[hello-world.js](./hello-world.js)** - Simple "Hello World" example using `useSpeak`
- **[use-base-example.js](./use-base-example.js)** - Demonstrates the `useBase` fluent API
- **[use-listeners-example.js](./use-listeners-example.js)** - Event-driven listener management
- **[use-queue-example.js](./use-queue-example.js)** - Message queue management

### Framework Integration Examples

- **[todo-shared/](./todo-shared/)** - Shared Mycelia plugin code
  - Framework-agnostic domain logic (`useTodos` hook)
  - System builder configuration
  - Used by React, Vue, Svelte, Angular, and Qwik examples
  - Demonstrates plugin reusability across frameworks

- **[react-todo/](./react-todo/)** - Complete React Todo application
  - Demonstrates React bindings integration
  - Event-driven state management
  - Plugin-based architecture
  - Uses shared plugin code from `todo-shared/`
  - See [react-todo/README.md](./react-todo/README.md) for details

- **[vue-todo/](./vue-todo/)** - Complete Vue 3 Todo application
  - Demonstrates Vue bindings integration
  - Event-driven state management
  - Plugin-based architecture
  - Uses shared plugin code from `todo-shared/`
  - See [vue-todo/README.md](./vue-todo/README.md) for details

- **[svelte-todo/](./svelte-todo/)** - Complete Svelte Todo application
  - Demonstrates Svelte bindings integration
  - Event-driven state management
  - Plugin-based architecture
  - Uses shared plugin code from `todo-shared/`
  - See [svelte-todo/README.md](./svelte-todo/README.md) for details

- **[angular-todo/](./angular-todo/)** - Complete Angular Todo application
  - Demonstrates Angular bindings integration
  - Event-driven state management with RxJS
  - Plugin-based architecture
  - Uses shared plugin code from `todo-shared/`
  - See [angular-todo/README.md](./angular-todo/README.md) for details

- **[qwik-todo/](./qwik-todo/)** - Complete Qwik Todo application
  - Demonstrates Qwik bindings integration
  - Event-driven state management with signals
  - Plugin-based architecture
  - Uses shared plugin code from `todo-shared/`
  - See [qwik-todo/README.md](./qwik-todo/README.md) for details

## Running Examples

### Node.js Examples

All Node.js examples can be run directly:

```bash
node examples/hello-world.js
node examples/use-base-example.js
node examples/use-listeners-example.js
node examples/use-queue-example.js
```

### Framework Integration Examples

All framework Todo examples require their respective frameworks and a bundler:

- **React Todo**: Requires React and a bundler. See [react-todo/README.md](./react-todo/README.md) for setup instructions.
- **Vue Todo**: Requires Vue 3 and a bundler. See [vue-todo/README.md](./vue-todo/README.md) for setup instructions.
- **Svelte Todo**: Requires Svelte and a bundler. See [svelte-todo/README.md](./svelte-todo/README.md) for setup instructions.
- **Angular Todo**: Requires Angular and Angular CLI. See [angular-todo/README.md](./angular-todo/README.md) for setup instructions.
- **Qwik Todo**: Requires Qwik and Vite. See [qwik-todo/README.md](./qwik-todo/README.md) for setup instructions.

**Note**: All five examples use the same shared Mycelia plugin code from `todo-shared/`, demonstrating that plugins are framework-agnostic and can be reused across different UI frameworks.

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

### todo-shared/

Shared plugin code demonstrating:
- Framework-agnostic domain logic
- Custom plugin creation (`useTodos` hook)
- System builder configuration
- Reusable across React, Vue, and other frameworks

### react-todo/

Complete React application showing:
- React bindings (`MyceliaProvider`, `useFacet`, `useListener`)
- Event-driven state synchronization
- Separation of concerns (plugin logic vs UI)
- Uses shared plugin code from `todo-shared/`

### vue-todo/

Complete Vue 3 application showing:
- Vue bindings (`MyceliaPlugin`, `useFacet`, `useListener`)
- Event-driven state synchronization
- Separation of concerns (plugin logic vs UI)
- Uses shared plugin code from `todo-shared/`

### svelte-todo/

Complete Svelte application showing:
- Svelte bindings (`setMyceliaSystem`, `useFacet`, `useListener`)
- Event-driven state synchronization
- Separation of concerns (plugin logic vs UI)
- Uses shared plugin code from `todo-shared/`

### angular-todo/

Complete Angular application showing:
- Angular bindings (`MyceliaService`, `useFacet`, `useListener`)
- Event-driven state synchronization with RxJS observables
- Separation of concerns (plugin logic vs UI)
- Uses shared plugin code from `todo-shared/`

### qwik-todo/

Complete Qwik application showing:
- Qwik bindings (`MyceliaProvider`, `useFacet`, `useListener`)
- Event-driven state synchronization with Qwik signals
- Separation of concerns (plugin logic vs UI)
- Uses shared plugin code from `todo-shared/`

## Learning Path

1. **Start with hello-world.js** - Understand basic concepts
2. **Try use-base-example.js** - Learn the fluent API
3. **Explore use-listeners-example.js** - Understand events
4. **Check use-queue-example.js** - Learn queue management
5. **Study todo-shared/** - See framework-agnostic plugin code
6. **Study react-todo/** - See full React integration
7. **Study vue-todo/** - See full Vue integration (uses same plugin as React)
8. **Study svelte-todo/** - See full Svelte integration (uses same plugin as React and Vue)
9. **Study angular-todo/** - See full Angular integration (uses same plugin as React, Vue, and Svelte)
10. **Study qwik-todo/** - See full Qwik integration (uses same plugin as all other frameworks)

## See Also

- [Getting Started Guide](../docs/getting-started/README.md) - Quick start tutorial
- [React Bindings Documentation](../docs/react/README.md) - React integration guide
- [Vue Bindings Documentation](../docs/vue/README.md) - Vue integration guide
- [Svelte Bindings Documentation](../docs/svelte/README.md) - Svelte integration guide
- [Angular Bindings Documentation](../docs/angular/README.md) - Angular integration guide
- [Qwik Bindings Documentation](../docs/qwik/README.md) - Qwik integration guide
- [Built-in Hooks Documentation](../docs/hooks/README.md) - Hook documentation
- [Standalone Plugin System](../docs/standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system guide

