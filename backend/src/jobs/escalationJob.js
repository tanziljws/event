const cron = require('node-cron');
const escalationService = require('../services/escalationService');
const logger = require('../config/logger');

let escalationJob = null;

// Initialize escalation job
const startEscalationJob = () => {
  if (escalationJob) {
    logger.warn('Escalation job is already started');
    return escalationJob;
  }

// Auto escalation job - runs every hour
  escalationJob = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('🔄 Starting auto escalation job...');
    await escalationService.checkAutoEscalation();
    logger.info('✅ Auto escalation job completed');
  } catch (error) {
    logger.error('❌ Auto escalation job failed:', error);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: 'Asia/Jakarta'
});

// Start the job
escalationJob.start();
  logger.info('✅ Auto escalation job started (runs every hour)');

  return escalationJob;
};

module.exports = {
  start: startEscalationJob,
  job: escalationJob
};
