/**
 * TodoList Component
 * 
 * Displays a list of todos.
 */

import { component$ } from '@builder.io/qwik';
import { TodoItem } from './TodoItem';
import type { Todo } from './TodoApp';

interface TodoListProps {
  items: Todo[];
  onToggle$: (id: string) => void;
  onRemove$: (id: string) => void;
}

export const TodoList = component$<TodoListProps>(({ items, onToggle$, onRemove$ }) => {
  if (!items.length) {
    return <p class="empty">Nothing here yet.</p>;
  }

  return (
    <ul class="todo-list">
      {items.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle$={() => onToggle$(todo.id)}
          onRemove$={() => onRemove$(todo.id)}
        />
      ))}
    </ul>
  );
});


