/**
 * App Component
 * 
 * Root component that sets up the MyceliaProvider.
 */

import React from 'react';
import { MyceliaProvider } from '../../../../src/react/index.js';
import { buildTodoSystem } from '../../todo-shared/src/system.builder.js';
import { TodoApp } from './components/TodoApp.jsx';

export function App() {
  return (
    <MyceliaProvider
      build={buildTodoSystem}
      fallback={<div>Loading Todo system…</div>}
    >
      <TodoApp />
    </MyceliaProvider>
  );
}

