const cron = require('node-cron');
const smartAssignmentService = require('./smartAssignmentService');
const logger = require('../config/logger');

class QueueProcessor {
  constructor() {
    this.isRunning = false;
    this.processInterval = 30000; // 30 seconds
    this.maxRetries = 3;
  }

  // Start the queue processor
  start() {
    if (this.isRunning) {
      logger.warn('Queue processor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting assignment queue processor...');

    // Process queue every 30 seconds
    this.processTask = cron.schedule('*/30 * * * * *', async () => {
      await this.processQueue();
    }, {
      scheduled: false
    });

    // Start the cron job
    this.processTask.start();
    logger.info('✅ Assignment queue processor started (every 30 seconds)');
  }

  // Stop the queue processor
  stop() {
    if (!this.isRunning) {
      logger.warn('Queue processor is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.processTask) {
      this.processTask.stop();
      this.processTask.destroy();
    }

    logger.info('🛑 Assignment queue processor stopped');
  }

  // Process the assignment queue
  async processQueue() {
    try {
      const result = await smartAssignmentService.processQueue();
      
      if (result.processed > 0) {
        logger.info(`📋 Queue processed: ${result.processed} items assigned, ${result.remaining} remaining`);
      }
      
      return result;
    } catch (error) {
      logger.error('❌ Error processing assignment queue:', error);
      return {
        processed: 0,
        error: error.message
      };
    }
  }

  // Get processor status
  getStatus() {
    return {
      isRunning: this.isRunning,
      processInterval: this.processInterval,
      maxRetries: this.maxRetries
    };
  }

  // Manual queue processing (for testing)
  async processQueueManually() {
    logger.info('🔄 Manual queue processing triggered');
    return await this.processQueue();
  }
}

// Create singleton instance
const queueProcessor = new QueueProcessor();

module.exports = queueProcessor;
