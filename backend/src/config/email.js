// DEPRECATED: This file is no longer used
// All email functionality has been migrated to Brevo API
// See: backend/src/config/brevoEmail.js

// This file is kept for backward compatibility only
// All imports should be updated to use brevoEmail.js

const logger = require('./logger');

logger.warn('⚠️  email.js is deprecated. Please use brevoEmail.js instead.');

module.exports = {
  emailTemplates: require('./brevoEmail').emailTemplates
};
