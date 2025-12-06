/**
 * SubsystemQueueManager Class
 * 
 * Manages the message queue for a subsystem. Handles queue initialization,
 * operations (enqueue, dequeue, clear), status queries, and statistics.
 * 
 * This class isolates queue management concerns from BaseSubsystem,
 * providing a clean interface for queue operations.
 * 
 * @example
 * // Created internally by BaseSubsystem
 * const queueManager = new SubsystemQueueManager({
 *   capacity: 1000,
 *   policy: 'drop-oldest',
 *   debug: true,
 *   subsystemName: 'canvas',
 *   onQueueFull: () => statistics.recordQueueFull()
 * });
 * 
 * // Enqueue a message
 * const success = queueManager.enqueue({ msg: message, options: {} });
 * 
 * // Get queue status
 * const status = queueManager.getStatus();
 * 
 * // Dequeue next message
 * const next = queueManager.dequeue();
 */
import { BoundedQueue } from './bounded-queue.js';

export class SubsystemQueueManager {
  /**
   * Create a new SubsystemQueueManager instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} [options.capacity=1000] - Queue capacity
   * @param {string} [options.policy='drop-oldest'] - Queue overflow policy
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} options.subsystemName - Subsystem name for logging
   * @param {Function} [options.onQueueFull] - Callback when queue becomes full: () => void
   * 
   * @example
   * const queueManager = new SubsystemQueueManager({
   *   capacity: 2000,
   *   policy: 'drop-oldest',
   *   debug: true,
   *   subsystemName: 'canvas',
   *   onQueueFull: () => console.log('Queue is full!')
   * });
   */
  constructor(options) {
    if (!options.subsystemName || typeof options.subsystemName !== 'string') {
      throw new Error('SubsystemQueueManager: subsystemName is required');
    }
    
    this.subsystemName = options.subsystemName;
    this.debug = options.debug || false;
    
    // Initialize bounded queue
    this.queue = new BoundedQueue(
      options.capacity || 1000,
      options.policy || 'drop-oldest'
    );
    
    // Set queue debug mode
    this.queue.setDebug(this.debug);
    
    // Listen to queue full events
    if (options.onQueueFull) {
      this.queue.on('full', options.onQueueFull);
    }
    
    if (this.debug) {
      console.log(`SubsystemQueueManager ${this.subsystemName}: Initialized with capacity ${this.queue.getCapacity()}`);
    }
  }

  /**
   * Enqueue a message-options pair
   * 
   * @param {{msg: Message, options: Object}} pair - Message-options pair to enqueue
   * @returns {boolean} True if successfully enqueued
   * 
   * @example
   * const success = queueManager.enqueue({ msg: message, options: {} });
   */
  enqueue(pair) {
    return this.queue.enqueue(pair);
  }

  /**
   * Dequeue the next message-options pair
   * 
   * @returns {{msg: Message, options: Object}|null} Next pair or null if empty
   * 
   * @example
   * const next = queueManager.dequeue();
   * if (next) {
   *   const { msg, options } = next;
   * }
   */
  dequeue() {
    return this.queue.dequeue();
  }

  /**
   * Get current queue size
   * 
   * @returns {number} Number of messages in queue
   */
  size() {
    return this.queue.size();
  }

  /**
   * Get queue capacity
   * 
   * @returns {number} Maximum queue capacity
   */
  getCapacity() {
    return this.queue.getCapacity();
  }

  /**
   * Check if queue is empty
   * 
   * @returns {boolean} True if queue is empty
   */
  isEmpty() {
    return this.queue.isEmpty();
  }

  /**
   * Check if queue is full
   * 
   * @returns {boolean} True if queue is full
   */
  isFull() {
    return this.queue.isFull();
  }

  /**
   * Clear all messages from the queue
   * 
   * @example
   * queueManager.clear();
   */
  clear() {
    this.queue.clear();
    if (this.debug) {
      console.log(`SubsystemQueueManager ${this.subsystemName}: Queue cleared`);
    }
  }

  /**
   * Get queue status information
   * 
   * @param {Object} [additionalState={}] - Additional state to include (e.g., isProcessing, isPaused)
   * @returns {Object} Queue status object
   * 
   * @example
   * const status = queueManager.getStatus({ isProcessing: true, isPaused: false });
   * // Returns: { size, capacity, utilization, isEmpty, isFull, isProcessing, isPaused }
   */
  getStatus(additionalState = {}) {
    const size = this.queue.size();
    const capacity = this.queue.getCapacity();
    
    return {
      size,
      capacity,
      utilization: size / capacity,
      isEmpty: this.queue.isEmpty(),
      isFull: this.queue.isFull(),
      ...additionalState
    };
  }

  /**
   * Get queue statistics
   * 
   * @returns {Object} Queue statistics from underlying BoundedQueue
   */
  getStatistics() {
    return this.queue.getStatistics();
  }

  /**
   * Get the underlying BoundedQueue instance
   * (for direct access when needed)
   * 
   * @returns {BoundedQueue} The underlying queue instance
   */
  getQueue() {
    return this.queue;
  }
}

