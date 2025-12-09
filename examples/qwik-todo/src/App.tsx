/**
 * App Component
 * 
 * Root component that sets up the MyceliaProvider.
 */

import { component$ } from '@builder.io/qwik';
import { MyceliaProvider } from '../../../../src/qwik/index.js';
import { buildTodoSystem } from '../../todo-shared/src/system.builder.js';
import { TodoApp } from './components/TodoApp';

export default component$(() => {
  return (
    <MyceliaProvider
      build={buildTodoSystem}
      fallback={<div>Loading Todo system…</div>}
    >
      <TodoApp />
    </MyceliaProvider>
  );
});

