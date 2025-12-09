/**
 * Qwik Listener Helpers
 */

import { useTask$, useSignal } from '@builder.io/qwik';
import { useMycelia } from './index.js';

// Note: Qwik's useTask$ requires proper serialization
// Event handlers should be QRL-wrapped for proper serialization

/**
 * useListener - Register an event listener with automatic cleanup
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Function} handler - Handler function: (message) => void
 * 
 * @example
 * ```tsx
 * export const AuditLog = component$(() => {
 *   useListener('user:created', (msg) => {
 *     console.log('User created:', msg.body);
 *   });
 *   // ...
 * });
 * ```
 */
export function useListener(eventName, handler) {
  const system = useMycelia();
  const listeners = system.listeners; // useListeners facet

  useTask$(({ cleanup }) => {
    if (!listeners || !listeners.hasListeners?.()) {
      return;
    }

    const wrappedHandler = (msg) => {
      handler(msg);
    };

    listeners.on(eventName, wrappedHandler);

    cleanup(() => {
      listeners.off?.(eventName, wrappedHandler);
    });
  });
}

/**
 * useEventStream - Subscribe to events and keep them in Qwik signal
 * 
 * @param {string} eventName - Event name/path to listen for
 * @param {Object} [options={}] - Options
 * @param {boolean} [options.accumulate=false] - If true, accumulate events in array
 * @returns {import('@builder.io/qwik').Signal} Signal containing latest event value, array of events, or null
 * 
 * @example
 * ```tsx
 * export const EventList = component$(() => {
 *   const events = useEventStream('todo:created', { accumulate: true });
 *   return (
 *     <ul>
 *       {events.value?.map(e => <li key={e.id}>{e.text}</li>)}
 *     </ul>
 *   );
 * });
 * ```
 */
export function useEventStream(eventName, options = {}) {
  const { accumulate = false } = options;
  const value = useSignal(accumulate ? [] : null);
  const system = useMycelia();
  const listeners = system.listeners;

  useTask$(({ cleanup }) => {
    if (!listeners || !listeners.hasListeners?.()) {
      return;
    }

    const handler = (msg) => {
      if (accumulate) {
        value.value = [...value.value, msg.body];
      } else {
        value.value = msg.body;
      }
    };

    listeners.on(eventName, handler);

    cleanup(() => {
      listeners.off?.(eventName, handler);
    });
  });

  return value;
}

