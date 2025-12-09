/**
 * TodoApp Component
 * 
 * Main component that orchestrates the todo application.
 * Demonstrates using Mycelia Solid.js bindings for state management.
 */

import { createSignal, createEffect, onMount } from 'solid-js';
import { useListener, useMycelia } from '../../../../src/solid/index.js';
import { useTodosFacet } from '../hooks/useTodosFacet.js';
import { TodoInput } from './TodoInput.jsx';
import { TodoList } from './TodoList.jsx';

/**
 * @typedef {Object} Todo
 * @property {string} id - Unique identifier
 * @property {string} text - Todo text
 * @property {boolean} completed - Completion status
 * @property {number} createdAt - Timestamp
 */

export function TodoApp() {
  const system = useMycelia();
  const todosFacet = useTodosFacet();
  const [items, setItems] = createSignal(() => {
    // Initialize from facet if available
    const facet = todosFacet();
    return facet?.getAll() || [];
  });

  // Enable listeners when system is ready
  onMount(() => {
    const sys = system();
    if (sys && sys.listeners) {
      sys.listeners.enableListeners();
    }
  });

  // Keep local Solid state in sync with events from the plugin system
  useListener(
    'todos:changed',
    (msg) => {
      setItems(msg.body.items);
    }
  );

  // Update state when facet becomes available
  createEffect(() => {
    const facet = todosFacet();
    if (facet) {
      setItems(facet.getAll());
    }
  });

  const facet = todosFacet();
  if (!facet) {
    return <div>Loading todos...</div>;
  }

  return (
    <div className="todo-app">
      <h1>Mycelia Solid Todo</h1>
      <TodoInput onAdd={facet.add} />
      <TodoList
        items={items}
        onToggle={facet.toggle}
        onRemove={facet.remove}
      />
      <footer>
        <button onClick={facet.clearCompleted}>
          Clear completed
        </button>
        <span>{items().filter((t) => !t.completed).length} items left</span>
      </footer>
    </div>
  );
}

