const cron = require('node-cron');
const paymentService = require('../services/paymentService');
const logger = require('../config/logger');

// Monitor crypto payments every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  try {
    logger.info('Running crypto payment monitoring...');
    await paymentService.monitorCryptoPayments();
  } catch (error) {
    logger.error('Crypto monitoring error:', error);
  }
});

logger.info('Crypto payment monitoring job started (every 2 minutes)');

module.exports = {
  start: () => {
    logger.info('Crypto monitoring jobs initialized');
  }
};
