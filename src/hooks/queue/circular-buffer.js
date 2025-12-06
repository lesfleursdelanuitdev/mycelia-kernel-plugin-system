/**
 * CircularBuffer Class
 * 
 * A high-performance circular buffer implementation for O(1) enqueue/dequeue operations.
 * Replaces array-based queue to eliminate O(n) Array.shift() overhead.
 * 
 * Performance improvements over array-based queue:
 * - Enqueue: O(1) vs O(1) (same)
 * - Dequeue: O(1) vs O(n) (10-100x faster for large queues)
 * - Memory: Predictable vs variable (better for GC)
 * - Cache: Better locality vs scattered
 * 
 * @example
 * // Create buffer with capacity 1000
 * const buffer = new CircularBuffer(1000);
 * 
 * @example
 * // Use buffer
 * buffer.enqueue({ msg: message, options: {} });
 * const item = buffer.dequeue();
 * 
 * @example
 * // Check status
 * console.log('Full:', buffer.isFull());
 * console.log('Size:', buffer.size());
 */
export class CircularBuffer {
  /**
   * Create a new CircularBuffer instance
   * 
   * @param {number} capacity - Maximum number of items the buffer can hold
   * 
   * @example
   * const buffer = new CircularBuffer(1000);
   */
  constructor(capacity) {
    if (!capacity || capacity <= 0) {
      throw new Error('CircularBuffer: capacity must be positive');
    }
    
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0;  // Read position
    this.tail = 0;  // Write position
    this._size = 0; // Current number of items
  }
  
  /**
   * Add an item to the buffer
   * 
   * Time complexity: O(1)
   * 
   * @param {any} item - Item to enqueue
   * @returns {boolean} True if successfully enqueued, false if buffer is full
   * 
   * @example
   * const success = buffer.enqueue({ msg: message, options: {} });
   * if (!success) {
   *   console.log('Buffer is full');
   * }
   */
  enqueue(item) {
    if (this.isFull()) {
      return false;
    }
    
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    this._size++;
    return true;
  }
  
  /**
   * Remove and return the oldest item from the buffer
   * 
   * Time complexity: O(1)
   * 
   * @returns {any|null} The oldest item, or null if buffer is empty
   * 
   * @example
   * const item = buffer.dequeue();
   * if (item) {
   *   console.log('Got item:', item);
   * }
   */
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    
    const item = this.buffer[this.head];
    this.buffer[this.head] = null; // Allow garbage collection
    this.head = (this.head + 1) % this.capacity;
    this._size--;
    return item;
  }
  
  /**
   * Remove the oldest item without returning it (for drop-oldest policy)
   * 
   * Time complexity: O(1)
   * 
   * @returns {boolean} True if item was dropped, false if buffer was empty
   * 
   * @example
   * if (buffer.isFull()) {
   *   buffer.dropOldest();
   *   buffer.enqueue(newItem);
   * }
   */
  dropOldest() {
    if (this.isEmpty()) {
      return false;
    }
    
    this.buffer[this.head] = null; // Allow garbage collection
    this.head = (this.head + 1) % this.capacity;
    this._size--;
    return true;
  }
  
  /**
   * Peek at the oldest item without removing it
   * 
   * Time complexity: O(1)
   * 
   * @returns {any|null} The oldest item, or null if buffer is empty
   * 
   * @example
   * const next = buffer.peek();
   * console.log('Next item:', next);
   */
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.buffer[this.head];
  }
  
  /**
   * Check if buffer is full
   * 
   * @returns {boolean} True if buffer is at capacity
   */
  isFull() {
    return this._size === this.capacity;
  }
  
  /**
   * Check if buffer is empty
   * 
   * @returns {boolean} True if buffer has no items
   */
  isEmpty() {
    return this._size === 0;
  }
  
  /**
   * Get current number of items in buffer
   * 
   * @returns {number} Number of items
   */
  size() {
    return this._size;
  }
  
  /**
   * Get buffer capacity
   * 
   * @returns {number} Maximum capacity
   */
  getCapacity() {
    return this.capacity;
  }
  
  /**
   * Clear all items from buffer
   * 
   * Time complexity: O(n) - must clear references for GC
   * 
   * @example
   * buffer.clear();
   * console.log('Size:', buffer.size()); // 0
   */
  clear() {
    // Clear references to allow garbage collection
    for (let i = 0; i < this.capacity; i++) {
      this.buffer[i] = null;
    }
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }
  
  /**
   * Convert buffer to array (for debugging/inspection)
   * 
   * Time complexity: O(n)
   * 
   * @returns {Array} Array of items in order (oldest to newest)
   * 
   * @example
   * console.log('Items:', buffer.toArray());
   */
  toArray() {
    const result = [];
    let count = this._size;
    let index = this.head;
    
    while (count > 0) {
      result.push(this.buffer[index]);
      index = (index + 1) % this.capacity;
      count--;
    }
    
    return result;
  }
  
  /**
   * Get utilization percentage
   * 
   * @returns {number} Percentage full (0-100)
   * 
   * @example
   * console.log('Buffer is', buffer.utilization(), '% full');
   */
  utilization() {
    return (this._size / this.capacity) * 100;
  }
}

