const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('../config/logger');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        success: false,
        message,
      });
    },
  });
};

// General API rate limiting (disabled for development)
const generalRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  1000, // 1000 requests per minute for development
  'Too many requests from this IP, please try again later'
);

// Skip rate limiting in development
const generalRateLimitMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip rate limiting in development
  }
  return generalRateLimit(req, res, next);
};

// Authentication rate limiting (disabled for development)
const authRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  50, // 50 requests per minute for development
  'Too many authentication attempts, please try again later'
);

// Skip rate limiting in development
const authRateLimitMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip rate limiting in development
  }
  return authRateLimit(req, res, next);
};

// Password reset rate limiting (disabled for development)
const passwordResetRateLimitInstance = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 requests per hour
  'Too many password reset attempts, please try again later'
);

const passwordResetRateLimit = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip rate limiting in development
  }
  return passwordResetRateLimitInstance(req, res, next);
};

// Email verification rate limiting (disabled for development)
const emailVerificationRateLimitInstance = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  3, // 3 requests per 5 minutes
  'Too many email verification attempts, please try again later'
);

const emailVerificationRateLimit = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip rate limiting in development
  }
  return emailVerificationRateLimitInstance(req, res, next);
};

// Event registration rate limiting (disabled for development)
const eventRegistrationRateLimitInstance = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 registrations per minute
  'Too many event registrations, please slow down'
);

const eventRegistrationRateLimit = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip rate limiting in development
  }
  return eventRegistrationRateLimitInstance(req, res, next);
};

// Speed limiting for sensitive endpoints (disabled for development)
const speedLimiterInstance = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: () => 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // max delay of 20 seconds
});

const speedLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return next(); // Skip speed limiting in development
  }
  return speedLimiterInstance(req, res, next);
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
      // Production origins (if needed)
      ...(process.env.NODE_ENV === 'production' ? [
      'https://web-production-38c7.up.railway.app',
      'http://web-production-38c7.up.railway.app',
      ] : []),
    ];
    
    // Add production origins from environment variables
    if (process.env.NODE_ENV === 'production') {
      if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
      if (process.env.ADMIN_URL) {
        allowedOrigins.push(process.env.ADMIN_URL);
      }
    }
    
    // Always allow requests with no origin (mobile apps, Postman, etc.)
    // For development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins for easier testing
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      // In development, allow anyway but log warning
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
};

// Helmet configuration for security headers
const helmetConfig = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "http://127.0.0.1:5000"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false, // Disable CORP to allow cross-origin access
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && allowedIPs.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!allowedIPs.includes(clientIP)) {
        logger.warn(`Blocked request from unauthorized IP: ${clientIP}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address',
        });
      }
    }
    next();
  };
};

// Request size limiting
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
      });
    }
    next();
  };
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  // Sanitize input data
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

// Security middleware for 404 Not Found responses
// This prevents information disclosure by returning 404 instead of 403/401
const secureNotFound = (req, res, next) => {
  // Store original status and json methods
  const originalStatus = res.status;
  const originalJson = res.json;
  
  // Override status method to intercept 403 responses
  res.status = function(code) {
    if (code === 403) {
      // Return 404 instead of 403 for security
      return originalStatus.call(this, 404);
    }
    return originalStatus.call(this, code);
  };
  
  // Override json method to provide generic 404 response
  res.json = function(data) {
    if (res.statusCode === 404) {
      // Generic 404 response that doesn't reveal system information
      return originalJson.call(this, {
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }
    return originalJson.call(this, data);
  };
  
  next();
};

// Role-based access control with 404 security
const secureRoleCheck = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      // Not authenticated - return 404 for security
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }
    
    if (req.user.role !== requiredRole) {
      // Wrong role - return 404 for security instead of 403
      logger.warn(`Unauthorized access attempt: User ${req.user.id} (${req.user.role}) tried to access ${requiredRole} resource: ${req.path}`);
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }
    
    next();
  };
};

module.exports = {
  generalRateLimitMiddleware,
  authRateLimitMiddleware,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  eventRegistrationRateLimit,
  speedLimiter,
  corsOptions,
  helmetConfig,
  requestLogger,
  ipWhitelist,
  requestSizeLimit,
  xssProtection,
  secureNotFound,
  secureRoleCheck,
};
