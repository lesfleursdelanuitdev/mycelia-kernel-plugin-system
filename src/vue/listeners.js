/**
 * Mycelia Plugin System - Vue Listener Helpers
 * 
 * Vue composables for event listener management.
 */

import { ref, onUnmounted } from 'vue';
import { useMycelia } from './index.js';

/**
 * useListener - Register an event listener with automatic cleanup
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Function} handler - Handler function: (message) => void
 * 
 * @example
 * ```js
 * import { useListener } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     useListener('user:created', (msg) => {
 *       console.log('User created:', msg.body);
 *     });
 *   }
 * }
 * ```
 */
export function useListener(eventName, handler) {
  const system = useMycelia();
  const listeners = system?.listeners; // useListeners facet

  if (!listeners || !listeners.hasListeners?.()) {
    return;
  }

  listeners.on(eventName, handler);

  onUnmounted(() => {
    listeners.off?.(eventName, handler);
  });
}

/**
 * useEventStream - Subscribe to events and keep them in reactive state
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.accumulate=false] - If true, accumulate events in array
 * @returns {import('vue').Ref<any|any[]|null>} Reactive ref to latest event value, array of events, or null
 * 
 * @example
 * ```js
 * import { useEventStream } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     const events = useEventStream('todo:created', { accumulate: true });
 *     return { events };
 *   }
 * }
 * ```
 */
export function useEventStream(eventName, options = {}) {
  const { accumulate = false } = options;
  const value = ref(accumulate ? [] : null);

  useListener(eventName, (msg) => {
    if (accumulate) {
      value.value = [...value.value, msg.body];
    } else {
      value.value = msg.body;
    }
  });

  return value;
}

