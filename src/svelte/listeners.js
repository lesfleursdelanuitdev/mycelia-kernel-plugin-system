/**
 * Mycelia Plugin System - Svelte Listener Helpers
 * 
 * Svelte utilities for event listener management.
 */

import { writable, get } from 'svelte/store';
import { onDestroy } from 'svelte';
import { getMyceliaSystem } from './index.js';

/**
 * useListener - Register an event listener with automatic cleanup
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Function} handler - Handler function: (message) => void
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useListener } from 'mycelia-kernel-plugin/svelte';
 *   
 *   useListener('user:created', (msg) => {
 *     console.log('User created:', msg.body);
 *   });
 * </script>
 * ```
 */
export function useListener(eventName, handler) {
  const systemStore = getMyceliaSystem();
  let listeners = null;
  let unsubscribe = null;
  
  const setup = () => {
    const system = get(systemStore);
    if (!system) return;
    
    listeners = system?.listeners;
    if (!listeners || !listeners.hasListeners?.()) return;
    
    listeners.on(eventName, handler);
  };
  
  // Subscribe to system store to set up listener when system is available
  unsubscribe = systemStore.subscribe(() => {
    setup();
  });
  
  // Initial setup
  setup();
  
  onDestroy(() => {
    if (listeners) {
      listeners.off?.(eventName, handler);
    }
    if (unsubscribe) {
      unsubscribe();
    }
  });
}

/**
 * useEventStream - Subscribe to events and keep them in a reactive store
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.accumulate=false] - If true, accumulate events in array
 * @returns {import('svelte/store').Writable} Writable store containing latest event value, array of events, or null
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useEventStream } from 'mycelia-kernel-plugin/svelte';
 *   
 *   const events = useEventStream('todo:created', { accumulate: true });
 * </script>
 * 
 * {#each $events as event}
 *   <div>{event.text}</div>
 * {/each}
 * ```
 */
export function useEventStream(eventName, options = {}) {
  const { accumulate = false } = options;
  const store = writable(accumulate ? [] : null);
  
  useListener(eventName, (msg) => {
    if (accumulate) {
      store.update(events => [...events, msg.body]);
    } else {
      store.set(msg.body);
    }
  });
  
  return store;
}

