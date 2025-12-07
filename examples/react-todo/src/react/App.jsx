/**
 * App Component
 * 
 * Root component that sets up the MyceliaProvider.
 */

import React from 'react';
import { MyceliaProvider } from '../../../../src/react/index.js';
import { buildTodoSystem } from '../mycelia/system.builder.js';
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

