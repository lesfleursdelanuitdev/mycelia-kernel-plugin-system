# Solid.js Todo Example

This example demonstrates how to use the Mycelia Plugin System with Solid.js.

## Overview

This todo application shows:
- How to set up Mycelia with Solid.js using `MyceliaProvider`
- How to use `useFacet` to access plugin facets
- How to use `useListener` to react to events
- How to manage state with Solid.js signals

## Structure

```
solid-todo/
├── src/
│   ├── index.jsx              # App entry point
│   ├── solid/
│   │   ├── components/
│   │   │   ├── TodoApp.jsx    # Main app component
│   │   │   ├── TodoInput.jsx  # Input component
│   │   │   ├── TodoList.jsx   # List component
│   │   │   └── TodoItem.jsx   # Item component
│   │   └── hooks/
│   │       └── useTodosFacet.js # Custom hook
│   └── ...
└── README.md
```

## Key Features

- **Framework-agnostic plugin** - The `useTodos` hook is shared with React, Vue, and Svelte examples
- **Reactive state** - Uses Solid.js signals for reactive updates
- **Event-driven** - Uses Mycelia's event system for state synchronization
- **Type-safe** - Full TypeScript support (when using TypeScript)

## Usage

```bash
# Install dependencies
npm install solid-js mycelia-kernel-plugin

# Run with your bundler (Vite, Webpack, etc.)
npm run dev
```

## Code Example

```jsx
import { MyceliaProvider, useFacet, useListener } from 'mycelia-kernel-plugin/solid';
import { buildTodoSystem } from '../todo-shared/system.builder.js';
import { TodoApp } from './solid/components/TodoApp.jsx';

function App() {
  return (
    <MyceliaProvider build={buildTodoSystem}>
      <TodoApp />
    </MyceliaProvider>
  );
}
```

## See Also

- [Solid.js Bindings Documentation](../../docs/solid/README.md)
- [React Todo Example](../react-todo/README.md) - Compare implementations
- [Vue Todo Example](../vue-todo/README.md) - Compare implementations
- [Svelte Todo Example](../svelte-todo/README.md) - Compare implementations

