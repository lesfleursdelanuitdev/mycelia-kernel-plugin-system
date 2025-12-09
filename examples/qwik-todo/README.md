# Qwik Todo App

A complete Qwik example demonstrating the Mycelia Plugin System with Qwik bindings.

## What This Example Shows

- **Framework-agnostic plugins** - Uses the same shared plugin code as React, Vue, Svelte, and Angular examples
- Event-driven state synchronization (`todos:changed` events)
- Qwik bindings (`MyceliaProvider`, `useFacet`, `useListener`)
- Qwik signals for reactive state management
- Context API for system propagation

## Architecture

### Shared Plugin Code

The core domain logic lives in `examples/todo-shared/`:
- `todos.hook.js` - The `useTodos` hook that manages todo state
- `system.builder.js` - System builder that configures all hooks

This code is **completely framework-agnostic** and is shared across all framework examples.

### Qwik-Specific Code

- `src/App.tsx` - Root component with MyceliaProvider
- `src/components/` - Qwik components using Mycelia bindings

## Key Components

### MyceliaProvider

Provides the Mycelia system to the component tree:
- Initializes the system asynchronously
- Provides context for child components
- Handles loading and error states

### TodoApp Component

Main component that:
- Uses `useFacet` to get the todos facet
- Uses `useListener` to subscribe to `todos:changed` events
- Manages local state synchronized with events
- Provides methods for todo operations

## Running the Example

```bash
cd examples/qwik-todo
npm install
npm run dev
```

Then open the URL shown in the terminal (typically http://localhost:5173).

## Key Concepts

### Event-Driven State

The todos plugin emits `todos:changed` events whenever state changes. The Qwik component subscribes to these events and updates local state:

```tsx
useListener('todos:changed', (msg: any) => {
  items.value = msg.body.items;
});
```

### Framework Independence

The `useTodos` hook in `todo-shared/` is completely framework-agnostic. It:
- Manages state internally
- Emits events on changes
- Provides a simple API (`add`, `toggle`, `remove`, etc.)

This same hook works with React, Vue, Svelte, Angular, and Qwik without modification.

## Comparison to "Just Qwik"

### Without Mycelia

- State management requires custom stores or context
- Business logic is tightly coupled to Qwik
- Testing requires Qwik testing utilities
- Sharing logic between frameworks is difficult

### With Mycelia

- Business logic is framework-agnostic
- Event-driven architecture for loose coupling
- Easy to test (plugins are pure functions)
- Same plugin code works with any framework
- Built-in lifecycle management and dependency resolution

## Extension Ideas

- Add persistence using a `storage` facet
- Add undo/redo using a `history` facet
- Add filtering using a `filter` facet
- Add collaboration using a `websocket` facet

All extensions can be added as plugins without modifying existing code!


