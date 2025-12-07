/**
 * Test suite for React Todo App - Mycelia System
 * 
 * Tests the core Mycelia functionality without requiring React.
 * Verifies that the todos hook, system builder, and event system work correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildTodoSystem } from '../todo-shared/src/system.builder.js';

describe('React Todo App - Mycelia System', () => {
  let system;

  beforeEach(async () => {
    // Build the system before each test
    system = await buildTodoSystem('react-todo-app');
    
    // Enable listeners for event testing
    if (system.listeners) {
      system.listeners.enableListeners();
    }
  });

  afterEach(async () => {
    // Clean up after each test
    if (system) {
      await system.dispose();
    }
  });

  describe('System Building', () => {
    it('should build the system successfully', () => {
      expect(system).toBeDefined();
      expect(system.name).toBe('react-todo-app');
      expect(system.isBuilt).toBe(true);
    });

    it('should have all required facets', () => {
      expect(system.find('listeners')).toBeDefined();
      expect(system.find('queue')).toBeDefined();
      expect(system.find('speak')).toBeDefined();
      expect(system.find('todos')).toBeDefined();
    });

    it('should enable listeners', () => {
      const listeners = system.find('listeners');
      expect(listeners).toBeDefined();
      expect(listeners.hasListeners()).toBe(true);
    });
  });

  describe('Todos Facet', () => {
    it('should have todos facet with all methods', () => {
      const todos = system.find('todos');
      expect(todos).toBeDefined();
      expect(typeof todos.add).toBe('function');
      expect(typeof todos.toggle).toBe('function');
      expect(typeof todos.remove).toBe('function');
      expect(typeof todos.clearCompleted).toBe('function');
      expect(typeof todos.getAll).toBe('function');
    });

    it('should start with empty todos', () => {
      const todos = system.find('todos');
      const all = todos.getAll();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(0);
    });

    it('should add todos', () => {
      const todos = system.find('todos');
      todos.add('Test todo');
      const all = todos.getAll();
      expect(all.length).toBe(1);
      expect(all[0].text).toBe('Test todo');
      expect(all[0].completed).toBe(false);
      expect(all[0].id).toBeDefined();
    });

    it('should toggle todo completion', () => {
      const todos = system.find('todos');
      todos.add('Test todo');
      const all = todos.getAll();
      const todoId = all[0].id;
      
      expect(all[0].completed).toBe(false);
      todos.toggle(todoId);
      
      const updated = todos.getAll();
      expect(updated[0].completed).toBe(true);
      
      todos.toggle(todoId);
      const updated2 = todos.getAll();
      expect(updated2[0].completed).toBe(false);
    });

    it('should remove todos', () => {
      const todos = system.find('todos');
      todos.add('Todo 1');
      todos.add('Todo 2');
      const all = todos.getAll();
      expect(all.length).toBe(2);
      
      todos.remove(all[0].id);
      const remaining = todos.getAll();
      expect(remaining.length).toBe(1);
      expect(remaining[0].text).toBe('Todo 2');
    });

    it('should clear completed todos', () => {
      const todos = system.find('todos');
      todos.add('Todo 1');
      todos.add('Todo 2');
      todos.add('Todo 3');
      
      const all = todos.getAll();
      todos.toggle(all[0].id); // Complete first todo
      todos.toggle(all[2].id); // Complete third todo
      
      todos.clearCompleted();
      const remaining = todos.getAll();
      expect(remaining.length).toBe(1);
      expect(remaining[0].text).toBe('Todo 2');
      expect(remaining[0].completed).toBe(false);
    });

    it('should trim whitespace from todo text', () => {
      const todos = system.find('todos');
      todos.add('  Test todo  ');
      const all = todos.getAll();
      expect(all[0].text).toBe('Test todo');
    });
  });

  describe('Event System', () => {
    it('should emit todos:changed event when adding todo', (done) => {
      const todos = system.find('todos');
      const listeners = system.find('listeners');
      
      let eventReceived = false;
      
      listeners.on('todos:changed', (msg) => {
        expect(msg.type).toBe('todos:changed');
        expect(msg.body).toBeDefined();
        expect(Array.isArray(msg.body.items)).toBe(true);
        expect(msg.body.items.length).toBe(1);
        eventReceived = true;
        done();
      });
      
      todos.add('Test todo');
      
      // Fallback timeout
      setTimeout(() => {
        if (!eventReceived) {
          done(new Error('Event not received'));
        }
      }, 100);
    });

    it('should emit todos:changed event when toggling todo', (done) => {
      const todos = system.find('todos');
      const listeners = system.find('listeners');
      
      todos.add('Test todo');
      const all = todos.getAll();
      
      let eventCount = 0;
      
      listeners.on('todos:changed', (msg) => {
        eventCount++;
        if (eventCount === 2) { // Initial + toggle
          expect(msg.body.items[0].completed).toBe(true);
          done();
        }
      });
      
      todos.toggle(all[0].id);
      
      setTimeout(() => {
        if (eventCount < 2) {
          done(new Error('Event not received'));
        }
      }, 100);
    });

    it('should emit todos:changed event when removing todo', (done) => {
      const todos = system.find('todos');
      const listeners = system.find('listeners');
      
      todos.add('Todo 1');
      todos.add('Todo 2');
      const all = todos.getAll();
      
      let eventCount = 0;
      
      listeners.on('todos:changed', (msg) => {
        eventCount++;
        if (eventCount === 3) { // Initial + 2 adds + remove
          expect(msg.body.items.length).toBe(1);
          done();
        }
      });
      
      todos.remove(all[0].id);
      
      setTimeout(() => {
        if (eventCount < 3) {
          done(new Error('Event not received'));
        }
      }, 100);
    });

    it('should emit todos:changed event when clearing completed', (done) => {
      const todos = system.find('todos');
      const listeners = system.find('listeners');
      
      todos.add('Todo 1');
      todos.add('Todo 2');
      const all = todos.getAll();
      todos.toggle(all[0].id);
      
      let eventCount = 0;
      
      listeners.on('todos:changed', (msg) => {
        eventCount++;
        if (eventCount === 4) { // Initial + 2 adds + toggle + clear
          expect(msg.body.items.length).toBe(1);
          done();
        }
      });
      
      todos.clearCompleted();
      
      setTimeout(() => {
        if (eventCount < 4) {
          done(new Error('Event not received'));
        }
      }, 100);
    });
  });

  describe('Integration', () => {
    it('should handle multiple operations and maintain state', () => {
      const todos = system.find('todos');
      
      // Add multiple todos
      todos.add('Todo 1');
      todos.add('Todo 2');
      todos.add('Todo 3');
      
      let all = todos.getAll();
      expect(all.length).toBe(3);
      
      // Toggle some
      todos.toggle(all[0].id);
      todos.toggle(all[2].id);
      
      all = todos.getAll();
      expect(all[0].completed).toBe(true);
      expect(all[1].completed).toBe(false);
      expect(all[2].completed).toBe(true);
      
      // Remove one
      todos.remove(all[1].id);
      
      all = todos.getAll();
      expect(all.length).toBe(2);
      
      // Clear completed
      todos.clearCompleted();
      
      all = todos.getAll();
      expect(all.length).toBe(0);
    });

    it('should return a copy of todos from getAll()', () => {
      const todos = system.find('todos');
      todos.add('Test todo');
      
      const all1 = todos.getAll();
      const all2 = todos.getAll();
      
      // Should be different array instances
      expect(all1).not.toBe(all2);
      // But should have same content
      expect(all1[0].id).toBe(all2[0].id);
      
      // Modifying the returned array shouldn't affect internal state
      all1.push({ id: 'fake', text: 'fake', completed: false, createdAt: Date.now() });
      const all3 = todos.getAll();
      expect(all3.length).toBe(1); // Still only 1 todo
    });
  });
});

