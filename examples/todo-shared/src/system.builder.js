/**
 * System Builder for Todo App
 * 
 * Configures and builds the Mycelia system with all required hooks
 * for the Todo application. This builder is framework-agnostic and
 * can be used with React, Vue, or any other framework.
 */

import { useBase } from '../../../src/utils/use-base.js';
import { useListeners, useQueue, useSpeak } from '../../../src/index.js';
import { useTodos } from './todos.hook.js';

/**
 * Build the todo system with all required hooks
 * @param {string} [appName='todo-app'] - Name for the system instance
 * @returns {Promise<StandalonePluginSystem>} Built system instance
 */
export const buildTodoSystem = (appName = 'todo-app') =>
  useBase(appName)
    .config('listeners', { registrationPolicy: 'multiple' })
    .config('speak', { prefix: '[TodoApp] ' })
    .use(useListeners)
    .use(useQueue)
    .use(useSpeak)
    .use(useTodos)
    .onInit(async (api, ctx) => {
      // System initialization can be handled in the framework-specific
      // components after the system is built. This keeps the builder simple
      // and framework-agnostic.
    })
    .build();




