# Angular Todo App

A complete Angular example demonstrating the Mycelia Plugin System with Angular bindings.

## What This Example Shows

- **Framework-agnostic plugins** - Uses the same shared plugin code as React, Vue, and Svelte examples
- Event-driven state synchronization (`todos:changed` events)
- Angular bindings (`MyceliaService`, `useFacet`, `useListener`)
- RxJS observables for reactive state management
- Dependency injection with Angular services

## Architecture

### Shared Plugin Code

The core domain logic lives in `examples/todo-shared/`:
- `todos.hook.js` - The `useTodos` hook that manages todo state
- `system.builder.js` - System builder that configures all hooks

This code is **completely framework-agnostic** and is shared across all framework examples.

### Angular-Specific Code

- `src/app/services/mycelia.service.ts` - Angular service wrapping Mycelia system
- `src/app/services/todos.service.ts` - Service for accessing todos facet
- `src/app/components/` - Angular components using Mycelia bindings

## Key Components

### MyceliaService

Wraps the Mycelia Plugin System and provides:
- `system$` - Observable of the system instance
- `error$` - Observable of errors
- `loading$` - Observable of loading state
- `useFacet(kind)` - Get a facet by kind
- `useListener(eventName, handler)` - Register event listener

### TodoAppComponent

Main component that:
- Initializes the Mycelia system
- Subscribes to `todos:changed` events
- Manages local state synchronized with events
- Provides methods for todo operations

## Running the Example

```bash
cd examples/angular-todo
npm install
ng serve
```

Then open http://localhost:4200 in your browser.

## Key Concepts

### Event-Driven State

The todos plugin emits `todos:changed` events whenever state changes. The Angular component subscribes to these events and updates local state:

```typescript
useListener(
  this.mycelia,
  'todos:changed',
  (msg: any) => {
    this.items$.next(msg.body.items);
  }
);
```

### Framework Independence

The `useTodos` hook in `todo-shared/` is completely framework-agnostic. It:
- Manages state internally
- Emits events on changes
- Provides a simple API (`add`, `toggle`, `remove`, etc.)

This same hook works with React, Vue, Svelte, Angular, and Qwik without modification.

## Comparison to "Just Angular"

### Without Mycelia

- State management requires NgRx, services, or other state libraries
- Business logic is tightly coupled to Angular
- Testing requires Angular testing utilities
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


