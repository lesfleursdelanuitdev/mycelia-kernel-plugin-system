/**
 * TodoApp Component
 * 
 * Main component that orchestrates the todo application.
 * Demonstrates using Mycelia React bindings for state management.
 */

import React, { useEffect, useState } from 'react';
import { useListener, useMycelia } from '../../../../src/react/index.js';
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
  const [items, setItems] = useState(() => {
    // Initialize from facet if available
    return todosFacet?.getAll() || [];
  });

  // Enable listeners when system is ready
  useEffect(() => {
    if (system && system.listeners) {
      system.listeners.enableListeners();
    }
  }, [system]);

  // Keep local React state in sync with events from the plugin system
  useListener(
    'todos:changed',
    (msg) => {
      setItems(msg.body.items);
    },
    [] // Stable handler
  );

  // Update state when facet becomes available
  useEffect(() => {
    if (todosFacet) {
      setItems(todosFacet.getAll());
    }
  }, [todosFacet]);

  if (!todosFacet) {
    return <div>Loading todos...</div>;
  }

  const activeCount = items.filter((t) => !t.completed).length;

  return (
    <div className="todo-app">
      <h1>Mycelia React Todo</h1>
      <TodoInput onAdd={todosFacet.add} />
      <TodoList
        items={items}
        onToggle={todosFacet.toggle}
        onRemove={todosFacet.remove}
      />
      <footer>
        <button onClick={todosFacet.clearCompleted}>
          Clear completed
        </button>
        <span>{activeCount} items left</span>
      </footer>
    </div>
  );
}

