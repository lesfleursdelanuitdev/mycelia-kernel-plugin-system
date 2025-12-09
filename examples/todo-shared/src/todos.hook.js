/**
 * useTodos Hook
 * 
 * A Mycelia plugin hook that manages todo state and emits events on changes.
 * This demonstrates how to create a domain-specific plugin that uses the
 * event system for state synchronization.
 * 
 * This hook is framework-agnostic and can be used with React, Vue, or any
 * other framework that integrates with the Mycelia Plugin System.
 */

import { createHook, Facet } from '../../../src/index.js';

/**
 * @typedef {Object} Todo
 * @property {string} id - Unique identifier
 * @property {string} text - Todo text
 * @property {boolean} completed - Completion status
 * @property {number} createdAt - Timestamp
 */

export const useTodos = createHook({
  kind: 'todos',
  required: ['listeners'], // We depend on useListeners
  attach: true,
  source: import.meta.url,

  fn: (ctx, api, subsystem) => {
    const state = { items: [] };

    const listeners = subsystem.find('listeners');

    /**
     * Emit a snapshot of current todos state
     */
    const emitSnapshot = () => {
      if (listeners && listeners.hasListeners()) {
        listeners.emit('todos:changed', {
          type: 'todos:changed',
          body: { items: [...state.items] }
        });
      }
    };

    /**
     * Generate a unique ID for todos
     * Uses crypto.randomUUID() if available (Node 19+, modern browsers),
     * falls back to timestamp-based ID for compatibility
     */
    const makeId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    };

    /**
     * Add a new todo
     * @param {string} text - Todo text
     */
    const add = (text) => {
      const todo = {
        id: makeId(),
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
      };
      state.items.push(todo);
      emitSnapshot();
    };

    /**
     * Toggle completion status of a todo
     * @param {string} id - Todo ID
     */
    const toggle = (id) => {
      const todo = state.items.find((t) => t.id === id);
      if (!todo) return;
      todo.completed = !todo.completed;
      emitSnapshot();
    };

    /**
     * Remove a todo
     * @param {string} id - Todo ID
     */
    const remove = (id) => {
      const idx = state.items.findIndex((t) => t.id === id);
      if (idx === -1) return;
      state.items.splice(idx, 1);
      emitSnapshot();
    };

    /**
     * Clear all completed todos
     */
    const clearCompleted = () => {
      state.items = state.items.filter((t) => !t.completed);
      emitSnapshot();
    };

    /**
     * Get all todos (returns a copy)
     * @returns {Todo[]} Array of todos
     */
    const getAll = () => [...state.items];

    return new Facet('todos', { attach: true, source: import.meta.url })
      .add({
        add,
        toggle,
        remove,
        clearCompleted,
        getAll
      })
      .onInit(async () => {
        // Optional: compose with storage facet if available
        // const storage = subsystem.find('storage');
        // if (storage) {
        //   const saved = await storage.load('todos');
        //   if (saved) state.items = saved;
        // }
        
        // For now, just emit initial state
        emitSnapshot();
      })
      .onDispose(async () => {
        // Optional: persist via storage facet
        // const storage = subsystem.find('storage');
        // if (storage) {
        //   await storage.save('todos', state.items);
        // }
      });
  }
});




