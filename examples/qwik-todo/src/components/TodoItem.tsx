/**
 * TodoItem Component
 * 
 * Individual todo item component.
 */

import { component$ } from '@builder.io/qwik';
import type { Todo } from './TodoApp';

interface TodoItemProps {
  todo: Todo;
  onToggle$: () => void;
  onRemove$: () => void;
}

export const TodoItem = component$<TodoItemProps>(({ todo, onToggle$, onRemove$ }) => {
  return (
    <li class={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange$={onToggle$}
        />
        <span>{todo.text}</span>
      </label>
      <button
        onClick$={onRemove$}
        aria-label="Remove todo"
        class="remove-button"
      >
        ×
      </button>
    </li>
  );
});


