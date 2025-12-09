/**
 * Solid Todo App Entry Point
 * 
 * This is a demonstration of using Mycelia Plugin System with Solid.js.
 * In a real application, you would use a bundler like Vite or Webpack.
 */

// Note: This example requires Solid.js to be available
// In a real setup, you would:
// 1. Install Solid.js: npm install solid-js
// 2. Use a bundler (Vite, Webpack, etc.)
// 3. Import Solid.js properly

// For demonstration purposes, we show the structure
// Actual execution requires Solid.js to be installed

/*
import { render } from 'solid-js/web';
import { MyceliaProvider } from '../../src/solid/index.js';
import { buildTodoSystem } from '../todo-shared/src/system.builder.js';
import { TodoApp } from './solid/components/TodoApp.jsx';

render(
  () => (
    <MyceliaProvider build={buildTodoSystem}>
      <TodoApp />
    </MyceliaProvider>
  ),
  document.getElementById('root')
);
*/

// Export for documentation purposes
export { TodoApp } from './solid/components/TodoApp.jsx';

