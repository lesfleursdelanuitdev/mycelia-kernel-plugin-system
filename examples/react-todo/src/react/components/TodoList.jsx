/**
 * TodoList Component
 * 
 * Displays a list of todos.
 */

import React from 'react';
import { TodoItem } from './TodoItem.jsx';

/**
 * @typedef {Object} Todo
 * @property {string} id - Unique identifier
 * @property {string} text - Todo text
 * @property {boolean} completed - Completion status
 * @property {number} createdAt - Timestamp
 */

export function TodoList({ items, onToggle, onRemove }) {
  if (!items.length) {
    return <p className="empty">Nothing here yet.</p>;
  }

  return (
    <ul className="todo-list">
      {items.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => onToggle(todo.id)}
          onRemove={() => onRemove(todo.id)}
        />
      ))}
    </ul>
  );
}




