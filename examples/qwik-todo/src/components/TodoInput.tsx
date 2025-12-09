/**
 * TodoInput Component
 * 
 * Input component for adding new todos.
 */

import { component$, useSignal } from '@builder.io/qwik';

interface TodoInputProps {
  onAdd$: (text: string) => void;
}

export const TodoInput = component$<TodoInputProps>(({ onAdd$ }) => {
  const value = useSignal('');

  return (
    <form
      preventdefault:submit
      onSubmit$={() => {
        const text = value.value.trim();
        if (!text) return;
        onAdd$(text);
        value.value = '';
      }}
    >
      <input
        type="text"
        placeholder="What needs to be done?"
        value={value.value}
        onInput$={(e: any) => {
          value.value = e.target.value;
        }}
        class="todo-input"
      />
    </form>
  );
});


