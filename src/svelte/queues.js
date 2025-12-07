/**
 * Mycelia Plugin System - Svelte Queue Helpers
 * 
 * Svelte utilities for queue management.
 */

import { writable, get } from 'svelte/store';
import { onMount, onDestroy } from 'svelte';
import { useFacet } from './index.js';

/**
 * useQueueStatus - Get queue status with reactive updates
 * 
 * @returns {import('svelte/store').Writable} Writable store containing queue status object
 * @returns {number} size - Current queue size
 * @returns {number} capacity - Maximum queue capacity
 * @returns {number} utilization - Utilization ratio (0-1)
 * @returns {boolean} isFull - Whether queue is full
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useQueueStatus } from 'mycelia-kernel-plugin/svelte';
 *   
 *   const status = useQueueStatus();
 * </script>
 * 
 * <div>Queue: {$status.size}/{$status.capacity}</div>
 * ```
 */
export function useQueueStatus() {
  const queueStore = useFacet('queue');
  const statusStore = writable({
    size: 0,
    capacity: 0,
    utilization: 0,
    isFull: false
  });
  
  let intervalId = null;
  
  const updateStatus = () => {
    const queue = get(queueStore);
    if (!queue?.getQueueStatus) return;
    
    const newStatus = queue.getQueueStatus();
    statusStore.set({
      size: newStatus.size || 0,
      capacity: newStatus.maxSize || 0,
      utilization: newStatus.utilization || 0,
      isFull: newStatus.isFull || false
    });
  };
  
  onMount(() => {
    updateStatus();
    intervalId = setInterval(updateStatus, 100); // Poll every 100ms
  });
  
  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
  
  return statusStore;
}

/**
 * useQueueDrain - Automatically drain queue on mount
 * 
 * @param {Object} [options={}] - Options
 * @param {number} [options.interval=100] - Polling interval in ms
 * @param {Function} [options.onMessage] - Callback for each message: (msg, options) => void
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useQueueDrain } from 'mycelia-kernel-plugin/svelte';
 *   
 *   useQueueDrain({
 *     interval: 50,
 *     onMessage: (msg) => console.log('Processed:', msg)
 *   });
 * </script>
 * ```
 */
export function useQueueDrain(options = {}) {
  const { interval = 100, onMessage } = options;
  const queueStore = useFacet('queue');
  let processInterval = null;
  
  onMount(() => {
    const queue = get(queueStore);
    if (!queue || !queue.hasMessagesToProcess) return;
    
    processInterval = setInterval(() => {
      const currentQueue = get(queueStore);
      if (currentQueue?.hasMessagesToProcess()) {
        const next = currentQueue.selectNextMessage();
        if (next && onMessage) {
          onMessage(next.msg, next.options);
        }
      }
    }, interval);
  });
  
  onDestroy(() => {
    if (processInterval) {
      clearInterval(processInterval);
    }
  });
}

