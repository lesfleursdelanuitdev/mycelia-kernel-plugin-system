# Svelte Todo App Example

A complete Svelte Todo application built with the Mycelia Plugin System, demonstrating event-driven state management and Svelte integration.

## What This Example Shows

This example demonstrates:

- **Plugin-based Architecture**: Domain logic (todos) is implemented as a Mycelia hook, separate from Svelte components
- **Event-Driven State**: State changes are communicated via events, keeping Svelte components in sync
- **Svelte Bindings**: Uses `setMyceliaSystem`, `useFacet`, `useListener`, and `createFacetStore` from the Svelte bindings
- **Lifecycle Management**: Automatic system initialization and cleanup
- **Separation of Concerns**: Business logic in plugins, UI in Svelte components
- **Shared Domain Logic**: Uses the same Mycelia plugin code as the React and Vue examples, demonstrating framework independence

## Architecture

```
src/
├── App.svelte          # Root component with system setup
├── components/         # Svelte components
│   ├── TodoApp.svelte  # Main app component
│   ├── TodoInput.svelte
│   ├── TodoList.svelte
│   └── TodoItem.svelte
├── stores/            # Custom stores
│   └── todos.js       # Todos facet store
└── main.js            # Entry point

../todo-shared/        # Shared Mycelia code (used by React, Vue, and Svelte)
    └── src/
        ├── todos.hook.js      # Todo management plugin
        └── system.builder.js  # System configuration
```

## Key Components

### 1. Todos Hook (`../todo-shared/src/todos.hook.js`)

The `useTodos` hook manages todo state and emits events on changes:

- **State Management**: Maintains todo items in memory
- **Event Emission**: Emits `todos:changed` events when state changes
- **API Methods**: `add()`, `toggle()`, `remove()`, `clearCompleted()`, `getAll()`
- **Dependencies**: Requires `listeners` facet for event emission

**Note**: This is the same hook used by the React and Vue Todo examples, demonstrating that Mycelia plugins are framework-agnostic.

### 2. System Builder (`../todo-shared/src/system.builder.js`)

Configures the Mycelia system with all required hooks:

- **useListeners**: For event-driven communication
- **useQueue**: For message queuing (available but not used in this example)
- **useSpeak**: For logging/debugging
- **useTodos**: Our custom todo management hook

**Note**: This is the same builder used by the React and Vue Todo examples.

### 3. Svelte Components

- **App.svelte**: Root component that sets up the system and provides context
- **TodoApp.svelte**: Main component that uses `useTodos` store and `useListener`
- **TodoInput.svelte**: Input component for adding todos
- **TodoList.svelte**: List component for displaying todos
- **TodoItem.svelte**: Individual todo item component

## How It Works

1. **System Initialization**: `App.svelte` calls `buildTodoSystem()` which creates and builds the Mycelia system, then calls `setMyceliaSystem()` to provide it to the component tree
2. **Hook Registration**: The todos hook registers with the system and emits initial state
3. **Svelte Integration**: Components use `useTodos()` store to access the todos facet
4. **Event Synchronization**: `useListener('todos:changed')` keeps Svelte reactive state in sync with plugin state
5. **User Actions**: User interactions call facet methods, which update state and emit events
6. **Reactive Updates**: Svelte components automatically re-render when reactive variables change

## Running the Example

### Prerequisites

```bash
npm install svelte mycelia-kernel-plugin
```

### Setup

This example requires a Svelte bundler (Vite, Rollup, etc.). The structure is provided, but you'll need to:

1. Set up a Svelte project with a bundler
2. Install `mycelia-kernel-plugin`
3. Copy the example files
4. Configure the bundler to handle the imports

### Example with Vite

```bash
# Create Vite Svelte app
npm create vite@latest svelte-todo -- --template svelte

# Install dependencies
cd svelte-todo
npm install mycelia-kernel-plugin

# Copy example files
# Then run:
npm run dev
```

## Key Concepts Demonstrated

### Event-Driven State

Instead of direct state updates, the plugin emits events:

```javascript
// In todos.hook.js
const add = (text) => {
  state.items.push(todo);
  emitSnapshot(); // Emits 'todos:changed' event
};
```

Svelte components listen to these events:

```svelte
<!-- In TodoApp.svelte -->
<script>
  useListener('todos:changed', (msg) => {
    items = msg.body.items; // Update Svelte reactive state
  });
</script>
```

### Plugin Separation

The todo logic is completely separate from Svelte:

- **Plugin**: Manages state, business logic, events
- **Svelte**: Handles UI, user interactions, rendering

This separation allows:
- Reusing the plugin in non-Svelte environments (CLI tools, Node.js scripts, etc.)
- Testing business logic independently
- Swapping UI frameworks without changing domain logic

### Svelte Bindings Usage

The example uses several Svelte bindings:

- **`setMyceliaSystem`**: Provides system to component tree via context
- **`useMycelia` / `useFacet` / `createFacetStore`**: Access plugin facets via stores
- **`useListener`**: Subscribe to events
- **Store Subscription**: Use `$store` syntax for automatic subscription

### Shared Domain Logic

All three examples (React, Vue, and Svelte) use the exact same Mycelia plugin code from `../todo-shared/`. This demonstrates:

- **Framework Independence**: The same plugin works with different frameworks
- **Code Reuse**: Write domain logic once, use it everywhere
- **Separation of Concerns**: Business logic is completely separate from UI

## Comparison to "Just Svelte State"

### Traditional Svelte Approach

```svelte
<script>
  import { writable } from 'svelte/store';
  
  const todos = writable([]);
  
  const add = (text) => {
    todos.update(t => [...t, { id: uuid(), text, completed: false }]);
  };
</script>
```

**Limitations:**
- State tied to Svelte components
- Hard to share logic with non-Svelte code
- No lifecycle management
- No event system for cross-component communication

### Mycelia Plugin Approach

```svelte
<script>
  const todosStore = useTodos();
  $: todosFacet = $todosStore;
  
  // Svelte just displays and triggers actions
  useListener('todos:changed', (msg) => items = msg.body.items);
</script>
```

**Benefits:**
- State managed by plugin (reusable)
- Event-driven (easy cross-component communication)
- Lifecycle hooks (init/dispose)
- Can be used outside Svelte

## Extending the Example

### Add Persistence

```javascript
// In todos.hook.js onInit
.onInit(async () => {
  const saved = localStorage.getItem('todos');
  if (saved) {
    state.items = JSON.parse(saved);
  }
  emitSnapshot();
})

// In onDispose
.onDispose(async () => {
  localStorage.setItem('todos', JSON.stringify(state.items));
})
```

### Add Backend Sync

```javascript
// In todos.hook.js
.onInit(async () => {
  const todos = await fetch('/api/todos').then(r => r.json());
  state.items = todos;
  emitSnapshot();
})
```

### Add Undo/Redo

```javascript
// Add history to state
const state = { items: [], history: [] };

const add = (text) => {
  state.history.push([...state.items]);
  // ... add todo
  emitSnapshot();
};
```

## See Also

- [Svelte Bindings Documentation](../../docs/svelte/README.md) - Complete Svelte bindings guide
- [React Todo App](../react-todo/README.md) - React version using the same shared plugin
- [Vue Todo App](../vue-todo/README.md) - Vue version using the same shared plugin
- [useListeners Hook](../../docs/hooks/USE-LISTENERS.md) - Event system documentation
- [Creating Plugins](../../docs/guides/creating-plugins.md) - How to create plugins
- [Standalone Plugin System](../../docs/standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

