const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists (non-blocking)
const logsDir = path.join(__dirname, '../../logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  // Ignore errors, will use console transport only
  console.warn('⚠️  Could not create logs directory, using console transport only:', error.message);
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which transports the logger must use
// Start with console transport only for faster startup
const transports = [
  // Console transport (always available)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
];

// Create the logger with console transport only initially (fast startup)
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  transports, // Only console transport at startup
  exitOnError: false,
  // Don't fail if transports fail
  handleExceptions: true,
  handleRejections: true,
});

// Add file transports asynchronously after startup to prevent blocking
// This will be done in the background
setImmediate(() => {
  try {
    // File transport for errors
    const errorLogPath = path.join(logsDir, 'error.log');
    logger.add(
      new winston.transports.File({
        filename: errorLogPath,
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        // Don't fail if file can't be created
        handleExceptions: true,
        handleRejections: true,
      })
    );

    // File transport for all logs
    const combinedLogPath = path.join(logsDir, 'combined.log');
    logger.add(
      new winston.transports.File({
        filename: combinedLogPath,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        // Don't fail if file can't be created
        handleExceptions: true,
        handleRejections: true,
      })
    );
  } catch (error) {
    // Ignore errors, continue with console transport only
    // Don't use logger here to avoid circular dependency
    console.warn('⚠️  Could not add file transports, using console transport only:', error.message);
  }
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
