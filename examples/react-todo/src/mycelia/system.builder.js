/**
 * System Builder for React Todo App
 * 
 * Configures and builds the Mycelia system with all required hooks
 * for the React Todo application.
 */

import { useBase } from '../../../../src/utils/use-base.js';
import { useListeners, useQueue, useSpeak } from '../../../../src/index.js';
import { useTodos } from './todos.hook.js';

/**
 * Build the todo system with all required hooks
 * @returns {Promise<StandalonePluginSystem>} Built system instance
 */
export const buildTodoSystem = () =>
  useBase('react-todo-app')
    .config('listeners', { registrationPolicy: 'multiple' })
    .config('speak', { prefix: '[TodoApp] ' })
    .use(useListeners)
    .use(useQueue)
    .use(useSpeak)
    .use(useTodos)
    .onInit(async (api, ctx) => {
      // System initialization is handled in the React component
      // after the system is built. This keeps the builder simple
      // and avoids accessing internal properties.
    })
    .build();

