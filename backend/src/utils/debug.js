/**
 * Debug Utilities for Development
 * Only active when DEBUG=true or NODE_ENV=development
 */

const isDebugMode = () => {
  return process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
};

const isDebugRoutesEnabled = () => {
  return process.env.ENABLE_DEBUG_ROUTES === 'true' && isDebugMode();
};

/**
 * Debug logger - only logs in debug mode
 */
const debugLog = (message, data = null) => {
  if (isDebugMode()) {
    if (data) {
      console.log(`🔍 [DEBUG] ${message}`, data);
    } else {
      console.log(`🔍 [DEBUG] ${message}`);
    }
  }
};

/**
 * Debug error - only logs in debug mode
 */
const debugError = (message, error = null) => {
  if (isDebugMode()) {
    if (error) {
      console.error(`❌ [DEBUG ERROR] ${message}`, error);
    } else {
      console.error(`❌ [DEBUG ERROR] ${message}`);
    }
  }
};

/**
 * Debug API request/response
 */
const debugApiCall = (req, res, next) => {
  if (isDebugMode()) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      debugLog(`API ${req.method} ${req.path}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
      });
    });
  }
  next();
};

/**
 * Debug database query
 */
const debugDbQuery = (query, params = []) => {
  if (isDebugMode() && process.env.DEBUG_DB === 'true') {
    debugLog('Database Query', {
      query: query.replace(/\s+/g, ' ').trim(),
      params: params.length > 0 ? params : undefined,
    });
  }
};

/**
 * Debug environment info (safe - no secrets)
 */
const debugEnvInfo = () => {
  if (isDebugMode()) {
    debugLog('Environment Info', {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DEBUG: process.env.DEBUG,
      DATABASE_URL: process.env.DATABASE_URL ? '***configured***' : 'not set',
      REDIS_URL: process.env.REDIS_URL ? '***configured***' : 'not set',
    });
  }
};

module.exports = {
  isDebugMode,
  isDebugRoutesEnabled,
  debugLog,
  debugError,
  debugApiCall,
  debugDbQuery,
  debugEnvInfo,
};

