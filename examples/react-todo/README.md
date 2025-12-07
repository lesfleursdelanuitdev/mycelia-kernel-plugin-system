# React Todo App with Mycelia Plugin System

This example is a small but realistic React application that uses the Mycelia Plugin System as its domain layer.

## What It Shows

This example demonstrates:

- **Domain logic as a plugin** (`useTodos` hook) - Todo management is implemented as a Mycelia facet, completely separate from React
- **Event-driven state synchronization** - Uses `useListeners` + `todos:changed` events to keep React state in sync with plugin state
- **React bindings in action**:
  - `MyceliaProvider` to build and provide the system
  - `createFacetHook('todos')` → `useTodosFacet()` for clean component code
  - `useListener()` to update React state from Mycelia events

## Architecture

```
src/
├── mycelia/                    # Plugin system pieces
│   ├── todos.hook.js          # Todo domain logic and events
│   └── system.builder.js      # System builder (useBase + built-in hooks)
└── react/                      # React components
    ├── App.jsx                # Root component with MyceliaProvider
    ├── hooks/
    │   └── useTodosFacet.js   # Small wrapper around createFacetHook
    └── components/
        ├── TodoApp.jsx        # Main app component
        ├── TodoInput.jsx      # Input component
        ├── TodoList.jsx       # List + item controls
        └── TodoItem.jsx       # Individual todo item
```

## How It Works

React never stores the source of truth for todos. Instead:

1. **Components call facet methods**: `todosFacet.add()`, `todosFacet.toggle()`, etc.
2. **The facet updates its internal state** and emits `todos:changed` events
3. **`useListener('todos:changed', ...)` updates React state** for rendering

This creates a clear separation:
- **Plugin layer** (`mycelia/`): Domain logic, state management, events
- **React layer** (`react/`): UI components that consume events and trigger actions

## Key Files

### `todos.hook.js` - Domain Logic

The `useTodos` hook encapsulates all todo logic:

```javascript
export const useTodos = createHook({
  kind: 'todos',
  required: ['listeners'], // Depends on useListeners for events
  // ...
  fn: (ctx, api, subsystem) => {
    const state = { items: [] };
    
    const add = (text) => {
      // Add todo to state
      emitSnapshot(); // Emit 'todos:changed' event
    };
    
    // ... other methods
    
    return new Facet('todos', { attach: true })
      .add({ add, toggle, remove, clearCompleted, getAll });
  }
});
```

**Key points:**
- State lives in the facet, not React
- All mutations emit events
- Clean API surface: `add`, `toggle`, `remove`, `clearCompleted`, `getAll`

### `system.builder.js` - System Composition

```javascript
export const buildTodoSystem = () =>
  useBase('react-todo-app')
    .config('listeners', { registrationPolicy: 'multiple' })
    .use(useListeners)
    .use(useTodos)
    .build();
```

Reads like a composition script: "Give me listeners, then todos."

### `TodoApp.jsx` - React Integration

```jsx
function TodoApp() {
  const todosFacet = useTodosFacet(); // Custom hook from createFacetHook
  const [items, setItems] = useState(() => todosFacet?.getAll() || []);
  
  // Sync React state with plugin events
  useListener('todos:changed', (msg) => {
    setItems(msg.body.items);
  }, []);
  
  // User actions call facet methods
  return (
    <TodoInput onAdd={todosFacet.add} />
    <TodoList items={items} onToggle={todosFacet.toggle} />
  );
}
```

**The flow:**
- React state is a cached projection for rendering
- Source of truth is the facet
- Events drive synchronization

## Comparison: Mycelia vs "Just React State"

### Traditional React Approach

```jsx
function TodoApp() {
  const [todos, setTodos] = useState([]);
  
  const add = (text) => {
    setTodos([...todos, { id: uuid(), text, completed: false }]);
  };
  
  // State, logic, and UI all in one component
}
```

**Limitations:**
- State tied to React component
- Hard to share logic with non-React code (CLI tools, Node services, etc.)
- No lifecycle management
- No event system for cross-component communication

### Mycelia Plugin Approach

```jsx
// Plugin manages state (reusable anywhere)
const todosFacet = useTodosFacet();

// React just displays and triggers actions
useListener('todos:changed', (msg) => setItems(msg.body.items));
```

**Benefits:**
- **Reusable**: Same plugin works in React, CLI, Node.js, etc.
- **Event-driven**: Easy cross-component communication
- **Lifecycle hooks**: `onInit`/`onDispose` for setup/cleanup
- **Separation of concerns**: Domain logic separate from UI

## Why This Matters

For a tiny todo app, this is arguably more setup than `useState`. But consider what happens when you add:

- **Persistence** → Add `useStorage` hook, todos hook composes with it
- **Remote sync** → Add `useSync` hook, same composition pattern
- **User auth** → Add `useAuth` hook, todos can depend on it
- **Analytics** → Add `useAnalytics` hook, listen to `todos:changed` events

The todo code barely changes. You're still just:
- Composing hooks
- Asking for facets by kind
- Listening to events

This is the "grows into a real app" pattern, not "smallest possible demo."

## Running the Example

### Prerequisites

```bash
npm install react react-dom mycelia-kernel-plugin
```

### Setup with Vite

```bash
# Create Vite React app
npm create vite@latest react-todo -- --template react

# Install dependencies
cd react-todo
npm install mycelia-kernel-plugin

# Copy example files from examples/react-todo/src/
# Then run:
npm run dev
```

## Extending the Example

### Add Persistence

```javascript
// In todos.hook.js
.onInit(async () => {
  const saved = localStorage.getItem('todos');
  if (saved) {
    state.items = JSON.parse(saved);
  }
  emitSnapshot();
})

.onDispose(async () => {
  localStorage.setItem('todos', JSON.stringify(state.items));
})
```

### Compose with Storage Facet

```javascript
// Optional: compose with a storage facet if available
const storage = subsystem.find('storage');
if (storage) {
  // Use storage facet for persistence
}
```

This shows how domain facets compose with other facets.

## See Also

- [React Bindings Documentation](../../docs/react/README.md) - Complete React bindings guide
- [useListeners Hook](../../docs/hooks/USE-LISTENERS.md) - Event system documentation
- [Creating Plugins](../../docs/guides/creating-plugins.md) - How to create plugins
- [Standalone Plugin System](../../docs/standalone/STANDALONE-PLUGIN-SYSTEM.md) - Core system documentation
