/**
 * Data Queue Manager
 * Handles offline buffering with retry logic
 */

const logger = require('./logger');

class DataQueue {
  constructor(maxSize = 1000) {
    this.queue = [];
    this.maxSize = maxSize;
    this.isProcessing = false;
  }

  /**
   * Add data to queue
   * @param {object} data - Data to queue
   * @returns {boolean} - Success status
   */
  enqueue(data) {
    if (this.queue.length >= this.maxSize) {
      logger.warn('Data queue is full, dropping oldest item');
      this.queue.shift();
    }
    
    this.queue.push({
      ...data,
      queuedAt: new Date(),
    });
    
    logger.debug(`Data queued. Queue size: ${this.queue.length}`);
    return true;
  }

  /**
   * Get next item from queue without removing
   * @returns {object|null} - Next data item or null
   */
  peek() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Remove and return next item from queue
   * @returns {object|null} - Next data item or null
   */
  dequeue() {
    const item = this.queue.shift();
    if (item) {
      logger.debug(`Data dequeued. Queue size: ${this.queue.length}`);
    }
    return item;
  }

  /**
   * Get queue size
   * @returns {number} - Current queue size
   */
  size() {
    return this.queue.length;
  }

  /**
   * Clear entire queue
   */
  clear() {
    const size = this.queue.length;
    this.queue = [];
    logger.info(`Queue cleared. Removed ${size} items`);
  }

  /**
   * Get all items in queue
   * @returns {array} - Array of queued items
   */
  getAll() {
    return [...this.queue];
  }
}

module.exports = DataQueue;
