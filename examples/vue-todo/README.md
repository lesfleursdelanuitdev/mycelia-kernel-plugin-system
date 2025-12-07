# Vue Todo App Example

A complete Vue 3 Todo application built with the Mycelia Plugin System, demonstrating event-driven state management and Vue integration.

## What This Example Shows

This example demonstrates:

- **Plugin-based Architecture**: Domain logic (todos) is implemented as a Mycelia hook, separate from Vue components
- **Event-Driven State**: State changes are communicated via events, keeping Vue components in sync
- **Vue Bindings**: Uses `MyceliaPlugin`, `useFacet`, `useListener`, and `createFacetComposable` from the Vue bindings
- **Lifecycle Management**: Automatic system initialization and cleanup
- **Separation of Concerns**: Business logic in plugins, UI in Vue components
- **Shared Domain Logic**: Uses the same Mycelia plugin code as the React example, demonstrating framework independence

## Architecture

```
src/
├── vue/              # Vue-specific code
│   ├── App.vue      # Root component
│   ├── composables/ # Custom composables
│   └── components/  # UI components
└── main.js          # Entry point with MyceliaPlugin

../todo-shared/      # Shared Mycelia code (used by both React and Vue)
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

**Note**: This is the same hook used by the React Todo example, demonstrating that Mycelia plugins are framework-agnostic.

### 2. System Builder (`../todo-shared/src/system.builder.js`)

Configures the Mycelia system with all required hooks:

- **useListeners**: For event-driven communication
- **useQueue**: For message queuing (available but not used in this example)
- **useSpeak**: For logging/debugging
- **useTodos**: Our custom todo management hook

**Note**: This is the same builder used by the React Todo example.

### 3. Vue Components

- **App.vue**: Root component
- **TodoApp.vue**: Main component that uses `useTodosFacet` and `useListener`
- **TodoInput.vue**: Input component for adding todos
- **TodoList.vue**: List component for displaying todos
- **TodoItem.vue**: Individual todo item component

## How It Works

1. **System Initialization**: `main.js` installs `MyceliaPlugin` with `buildTodoSystem()` which creates and builds the Mycelia system
2. **Hook Registration**: The todos hook registers with the system and emits initial state
3. **Vue Integration**: Components use `useTodosFacet()` to access the todos facet
4. **Event Synchronization**: `useListener('todos:changed')` keeps Vue reactive state in sync with plugin state
5. **User Actions**: User interactions call facet methods, which update state and emit events
6. **Reactive Updates**: Vue components automatically re-render when reactive state changes

## Running the Example

### Prerequisites

```bash
npm install vue mycelia-kernel-plugin
```

### Setup

This example requires a Vue bundler (Vite, Webpack, etc.). The structure is provided, but you'll need to:

1. Set up a Vue project with a bundler
2. Install `mycelia-kernel-plugin`
3. Copy the example files
4. Configure the bundler to handle the imports

### Example with Vite

```bash
# Create Vite Vue app
npm create vite@latest vue-todo -- --template vue

# Install dependencies
cd vue-todo
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

Vue components listen to these events:

```vue
<!-- In TodoApp.vue -->
<script setup>
useListener('todos:changed', (msg) => {
  items.value = msg.body.items; // Update Vue reactive state
});
</script>
```

### Plugin Separation

The todo logic is completely separate from Vue:

- **Plugin**: Manages state, business logic, events
- **Vue**: Handles UI, user interactions, rendering

This separation allows:
- Reusing the plugin in non-Vue environments (CLI tools, Node.js scripts, etc.)
- Testing business logic independently
- Swapping UI frameworks without changing domain logic

### Vue Bindings Usage

The example uses several Vue bindings:

- **`MyceliaPlugin`**: Provides system to Vue app
- **`useFacet` / `createFacetComposable`**: Access plugin facets
- **`useListener`**: Subscribe to events
- **`useMycelia`**: Access the system directly

### Shared Domain Logic

Both the React and Vue examples use the exact same Mycelia plugin code from `../todo-shared/`. This demonstrates:

- **Framework Independence**: The same plugin works with different frameworks
- **Code Reuse**: Write domain logic once, use it everywhere
- **Separation of Concerns**: Business logic is completely separate from UI

## Comparison to "Just Vue State"

### Traditional Vue Approach

```vue
<script setup>
import { ref } from 'vue';

const todos = ref([]);

const add = (text) => {
  todos.value.push({ id: uuid(), text, completed: false });
};
</script>
```

**Limitations:**
- State tied to Vue component
- Hard to share logic with non-Vue code
- No lifecycle management
- No event system for cross-component communication

### Mycelia Plugin Approach

```vue
<script setup>
const todosFacet = useTodosFacet();

// Vue just displays and triggers actions
useListener('todos:changed', (msg) => items.value = msg.body.items);
</script>
```

**Benefits:**
- State managed by plugin (reusable)
- Event-driven (easy cross-component communication)
- Lifecycle hooks (init/dispose)
- Can be used outside Vue

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

- [Vue Bindings Documentation](../../docs/vue/README.md) - Complete Vue bindings guide
- [React Todo App](../react-todo/README.md) - React version using the same shared plugin
- [useListeners Hook](../../docs/hooks/USE-LISTENERS.md) - Event system documentation
- [Creating Plugins](../../docs/guides/creating-plugins.md) - How to create plugins
- [Standalone Plugin System](../../docs/standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation

