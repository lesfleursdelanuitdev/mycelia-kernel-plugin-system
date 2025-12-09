/**
 * Qwik Queue Helpers
 */

import { useTask$, useSignal } from '@builder.io/qwik';
import { useFacet } from './index.js';

/**
 * useQueueStatus - Get queue status with reactive updates
 * 
 * @returns {import('@builder.io/qwik').Signal} Signal containing queue status object
 * 
 * @example
 * ```tsx
 * export const QueueStatus = component$(() => {
 *   const status = useQueueStatus();
 *   return <div>Queue: {status.value.size}/{status.value.capacity}</div>;
 * });
 * ```
 */
export function useQueueStatus() {
  const queue = useFacet('queue');
  const status = useSignal({ size: 0, capacity: 0, utilization: 0, isFull: false });

  useTask$(({ track }) => {
    const queueInstance = track(() => queue.value);
    if (!queueInstance || !queueInstance.getQueueStatus) return;

    const updateStatus = () => {
      const newStatus = queueInstance.getQueueStatus();
      status.value = {
        size: newStatus.size || 0,
        capacity: newStatus.maxSize || 0,
        utilization: newStatus.utilization || 0,
        isFull: newStatus.isFull || false
      };
    };

    updateStatus();
    const interval = setInterval(updateStatus, 100); // Poll every 100ms

    return () => clearInterval(interval);
  });

  return status;
}

/**
 * useQueueDrain - Automatically drain queue on mount
 * 
 * @param {Object} [options={}] - Options
 * @param {number} [options.interval=100] - Polling interval in ms
 * @param {Function} [options.onMessage] - Callback for each message: (msg, options) => void
 * 
 * @example
 * ```tsx
 * export const QueueProcessor = component$(() => {
 *   useQueueDrain({
 *     interval: 50,
 *     onMessage: (msg) => console.log('Processed:', msg)
 *   });
 *   return null;
 * });
 * ```
 */
export function useQueueDrain(options = {}) {
  const { interval = 100, onMessage } = options;
  const queue = useFacet('queue');

  useTask$(({ track, cleanup }) => {
    const queueInstance = track(() => queue.value);
    if (!queueInstance || !queueInstance.hasMessagesToProcess) return;

    const processInterval = setInterval(() => {
      if (queueInstance.hasMessagesToProcess()) {
        const next = queueInstance.selectNextMessage();
        if (next && onMessage) {
          onMessage(next.msg, next.options);
        }
      }
    }, interval);

    cleanup(() => clearInterval(processInterval));
  });
}


