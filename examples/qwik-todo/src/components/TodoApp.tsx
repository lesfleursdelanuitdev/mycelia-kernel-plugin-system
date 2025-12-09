/**
 * TodoApp Component
 * 
 * Main component that orchestrates the todo application.
 * Demonstrates using Mycelia Qwik bindings for state management.
 */

import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import { useListener, useMycelia } from '../../../../src/qwik/index.js';
import { useFacet } from '../../../../src/qwik/index.js';
import { TodoInput } from './TodoInput';
import { TodoList } from './TodoList';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export const TodoApp = component$(() => {
  const system = useMycelia();
  const todosFacet = useFacet('todos');
  const items = useSignal<Todo[]>([]);

  // Enable listeners when system is ready
  useTask$(({ track }) => {
    const systemValue = track(() => system);
    if (systemValue && systemValue.listeners) {
      systemValue.listeners.enableListeners();
    }
  });

  // Initialize items from facet
  useTask$(({ track }) => {
    const facet = track(() => todosFacet.value);
    if (facet) {
      items.value = facet.getAll();
    }
  });

  // Subscribe to todos:changed events
  useListener('todos:changed', (msg: any) => {
    items.value = msg.body.items;
  });

  const activeCount = items.value.filter(t => !t.completed).length;

  if (!todosFacet.value) {
    return <div>Loading todos...</div>;
  }

  return (
    <div class="todo-app">
      <h1>Mycelia Qwik Todo</h1>
      <TodoInput onAdd$={(text: string) => todosFacet.value?.add(text)} />
      <TodoList
        items={items.value}
        onToggle$={(id: string) => todosFacet.value?.toggle(id)}
        onRemove$={(id: string) => todosFacet.value?.remove(id)}
      />
      <footer>
        <button onClick$={() => todosFacet.value?.clearCompleted()}>
          Clear completed
        </button>
        <span>{activeCount} items left</span>
      </footer>
    </div>
  );
});


