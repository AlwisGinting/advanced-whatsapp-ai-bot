/**
 * Message Queue & Concurrency Manager
 * Handles parallel message processing with priority queue
 */
class MessageQueueManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.messageQueue = [];
    this.processingQueue = new Map();
    this.activeRequests = 0;
    this.maxConcurrentRequests = config.maxConcurrentRequests || 5;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.processing = false;
    this.stats = {
      queued: 0,
      processed: 0,
      failed: 0,
      retried: 0,
      averageWaitTime: 0,
      averageProcessTime: 0
    };
  }

  /**
   * Add message to priority queue
   */
  enqueue(message, priority = 5, metadata = {}) {
    const queueItem = {
      id: `msg_${Date.now()}_${Math.random()}`,
      message,
      priority: Math.max(1, Math.min(10, priority)), // 1-10, 10 is highest
      timestamp: Date.now(),
      attempt: 0,
      metadata,
      status: 'pending'
    };

    this.messageQueue.push(queueItem);
    this.messageQueue.sort((a, b) => b.priority - a.priority);
    
    this.stats.queued++;
    this.logger.debug('Message queued', { 
      id: queueItem.id, 
      priority: queueItem.priority,
      queueSize: this.messageQueue.length 
    });

    return queueItem.id;
  }

  /**
   * Get next message from queue
   */
  dequeue() {
    if (this.messageQueue.length === 0) return null;
    return this.messageQueue.shift();
  }

  /**
   * Process queue with concurrency control
   */
  async processQueue(handler) {
    if (this.processing) {
      return;
    }
    this.processing = true;

    try {
      while (this.messageQueue.length > 0 || this.activeRequests > 0) {
        // Process available slots
        while (this.activeRequests < this.maxConcurrentRequests && this.messageQueue.length > 0) {
          const item = this.dequeue();
          if (!item) break;

          this.activeRequests++;
          item.status = 'processing';
          this.processingQueue.set(item.id, item);

          this.processItem(item, handler);
        }

        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process individual queue item
   */
  async processItem(item, handler) {
    const startTime = Date.now();

    try {
      item.processingStartTime = startTime;
      const result = await handler(item.message, item.metadata);
      
      const processTime = Date.now() - startTime;
      this.updateAverageProcessTime(processTime);
      
      item.status = 'completed';
      item.result = result;
      this.stats.processed++;

      this.logger.debug('Message processed', {
        id: item.id,
        waitTime: item.processingStartTime - item.timestamp,
        processTime
      });

      this.activeRequests--;
      this.processingQueue.delete(item.id);
    } catch (error) {
      item.attempt++;
      item.error = error.message;

      if (item.attempt < this.maxRetries) {
        item.status = 'retrying';
        this.stats.retried++;
        
        this.logger.warn('Message retry', {
          id: item.id,
          attempt: item.attempt,
          error: error.message
        });

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, item.attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Re-queue with higher priority
        this.messageQueue.unshift(item);
        this.messageQueue.sort((a, b) => b.priority - a.priority);
      } else {
        item.status = 'failed';
        this.stats.failed++;
        
        this.logger.error('Message failed after retries', {
          id: item.id,
          attempts: item.attempt,
          error: error.message
        });

        this.activeRequests--;
        this.processingQueue.delete(item.id);
      }
    }
  }

  /**
   * Update average process time
   */
  updateAverageProcessTime(time) {
    const processed = this.stats.processed;
    const current = this.stats.averageProcessTime;
    this.stats.averageProcessTime = (current * processed + time) / (processed + 1);
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.messageQueue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrentRequests,
      stats: this.stats
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics() {
    const processedItems = Array.from(this.processingQueue.values());
    const completedItems = processedItems.filter(p => p.status === 'completed');
    
    return {
      ...this.stats,
      averageProcessTime: Math.round(this.stats.averageProcessTime),
      averageWaitTime: Math.round(this.stats.averageWaitTime),
      successRate: completedItems.length > 0 ? 
        Math.round((completedItems.length / (completedItems.length + this.stats.failed)) * 100) : 0,
      concurrencyUtilization: Math.round((this.activeRequests / this.maxConcurrentRequests) * 100)
    };
  }

  /**
   * Set concurrency level
   */
  setConcurrency(level) {
    this.maxConcurrentRequests = Math.max(1, Math.min(level, 20));
    this.logger.info('Concurrency level updated', { level: this.maxConcurrentRequests });
  }

  /**
   * Clear failed items
   */
  clearFailed() {
    const failed = Array.from(this.processingQueue.values()).filter(p => p.status === 'failed');
    failed.forEach(item => this.processingQueue.delete(item.id));
    return failed.length;
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.paused = true;
    this.logger.info('Message queue paused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.paused = false;
    this.logger.info('Message queue resumed');
  }

  /**
   * Get queue items by status
   */
  getQueueByStatus(status) {
    return this.messageQueue.filter(item => item.status === status);
  }
}

module.exports = MessageQueueManager;
