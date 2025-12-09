/**
 * TodoInput Component
 * 
 * Input component for adding new todos.
 */

import { createSignal } from 'solid-js';

export function TodoInput({ onAdd }) {
  const [value, setValue] = createSignal('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = value().trim();
    if (!text) return;
    onAdd(text);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="What needs to be done?"
        value={value()}
        onInput={(e) => setValue(e.target.value)}
        className="todo-input"
      />
    </form>
  );
}

