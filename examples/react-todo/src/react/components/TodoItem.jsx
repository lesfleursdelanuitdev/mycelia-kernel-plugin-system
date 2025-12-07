/**
 * TodoItem Component
 * 
 * Individual todo item component.
 */

import React from 'react';

/**
 * @typedef {Object} Todo
 * @property {string} id - Unique identifier
 * @property {string} text - Todo text
 * @property {boolean} completed - Completion status
 * @property {number} createdAt - Timestamp
 */

export function TodoItem({ todo, onToggle, onRemove }) {
  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={onToggle}
        />
        <span>{todo.text}</span>
      </label>
      <button
        onClick={onRemove}
        aria-label="Remove todo"
        className="remove-button"
      >
        ×
      </button>
    </li>
  );
}

