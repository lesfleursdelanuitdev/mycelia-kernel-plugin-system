/**
 * Mycelia Plugin System - Vue Queue Helpers
 * 
 * Vue composables for queue management.
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useFacet } from './index.js';

/**
 * useQueueStatus - Get queue status with reactive updates
 * 
 * @returns {import('vue').Ref<Object>} Reactive ref to queue status object
 * @returns {number} size - Current queue size
 * @returns {number} capacity - Maximum queue capacity
 * @returns {number} utilization - Utilization ratio (0-1)
 * @returns {boolean} isFull - Whether queue is full
 * 
 * @example
 * ```js
 * import { useQueueStatus } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     const status = useQueueStatus();
 *     return { status };
 *   }
 * }
 * ```
 */
export function useQueueStatus() {
  const queue = useFacet('queue');
  const status = ref({
    size: 0,
    capacity: 0,
    utilization: 0,
    isFull: false
  });

  let intervalId = null;

  const updateStatus = () => {
    if (queue.value?.getQueueStatus) {
      const newStatus = queue.value.getQueueStatus();
      status.value = {
        size: newStatus.size || 0,
        capacity: newStatus.maxSize || 0,
        utilization: newStatus.utilization || 0,
        isFull: newStatus.isFull || false
      };
    }
  };

  onMounted(() => {
    updateStatus();
    intervalId = setInterval(updateStatus, 100); // Poll every 100ms
  });

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
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
 * ```js
 * import { useQueueDrain } from 'mycelia-kernel-plugin/vue';
 * 
 * export default {
 *   setup() {
 *     useQueueDrain({
 *       interval: 50,
 *       onMessage: (msg) => console.log('Processed:', msg)
 *     });
 *   }
 * }
 * ```
 */
export function useQueueDrain(options = {}) {
  const { interval = 100, onMessage } = options;
  const queue = useFacet('queue');
  let processInterval = null;

  onMounted(() => {
    if (!queue.value || !queue.value.hasMessagesToProcess) return;

    processInterval = setInterval(() => {
      if (queue.value?.hasMessagesToProcess()) {
        const next = queue.value.selectNextMessage();
        if (next && onMessage) {
          onMessage(next.msg, next.options);
        }
      }
    }, interval);
  });

  onUnmounted(() => {
    if (processInterval) {
      clearInterval(processInterval);
    }
  });
}

