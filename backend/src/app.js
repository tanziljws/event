// Load dotenv first (fast)
require('dotenv').config();

const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

// Minimal logging for faster startup
if (!isProduction) {
  console.log('🚀 Starting server...');
}

// Load express-async-errors early
require('express-async-errors');

// Initialize Sentry ONLY in production (deferred)
if (isProduction) {
  setImmediate(() => {
    try {
      const { initSentry } = require('./config/sentry');
      initSentry();
    } catch (error) {
      console.warn('⚠️  Sentry initialization failed:', error.message);
    }
  });
}

// Core dependencies
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const cron = require('node-cron');
const client = require('prom-client');

// Lazy load heavy configs
let databaseConfig = null;
const getDatabaseConfig = () => {
  if (!databaseConfig) databaseConfig = require('./config/database');
  return databaseConfig;
};

const logger = require('./config/logger');

// Import middlewares
const {
  generalRateLimitMiddleware,
  corsOptions,
  helmetConfig,
  requestLogger,
  requestSizeLimit,
  xssProtection,
} = require('./middlewares/security');

// Create Express app
const app = express();
app.set('trust proxy', 1);

// ===== Lazy Load Router Helper =====
const lazyRoute = (routePath) => {
  let router = null;
  return (req, res, next) => {
    if (!router) {
      try {
        router = require(routePath);
        // Only log in development if DEBUG_ROUTES is enabled
        if (isDevelopment && process.env.DEBUG_ROUTES === 'true') {
          console.log(`✅ Lazy loaded: ${routePath}`);
        }
      } catch (error) {
        logger.error(`Error loading route ${routePath}:`, error);
        return res.status(500).json({ success: false, message: 'Route loading error' });
      }
    }
    return router(req, res, next);
  };
};

// ===== Metrics (Prometheus) =====
const metricsRegistry = new client.Registry();
setImmediate(() => {
  try {
    client.collectDefaultMetrics({ register: metricsRegistry });
  } catch (error) {
    console.warn('⚠️  Failed to collect metrics:', error.message);
  }
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
metricsRegistry.registerMetric(httpRequestDuration);

app.use((req, res, next) => {
  if (req.path === '/metrics') return next();
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.route?.path || req.path });
  res.on('finish', () => end({ status_code: String(res.statusCode) }));
  next();
});

// ===== Sentry Middleware (Production Only) =====
if (isProduction) {
  let sentryErrorHandler = null;
  let sentryErrorCapture = null;
  app.use((req, res, next) => {
    if (!sentryErrorHandler) {
      try {
        const sentry = require('./config/sentry');
        sentryErrorHandler = sentry.sentryErrorHandler;
        sentryErrorCapture = sentry.sentryErrorCapture;
      } catch (error) {
        logger.warn('⚠️  Sentry middleware failed to load:', error.message);
      }
    }
    if (sentryErrorHandler) return sentryErrorHandler(req, res, next);
    next();
  });
}

// ===== Security Middlewares =====
app.use(helmetConfig);
app.use(cors(corsOptions));

// Optimized compression
app.use(compression({
  level: 4, // Balance between speed and compression
  threshold: 2048, // Only compress > 2KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    const type = res.getHeader('Content-Type');
    if (type && /image|video|audio/.test(type)) return false;
    return compression.filter(req, res);
  }
}));

app.use(requestSizeLimit('10mb'));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Body parser debugging (DISABLED for faster performance)
// Uncomment only when debugging body parsing issues
// if (isDevelopment && process.env.DEBUG_BODY === 'true') {
//   app.use((req, res, next) => {
//     if (req.method === 'POST') {
//       console.log('🔍 Body:', req.headers['content-type'], Object.keys(req.body || {}));
//     }
//     next();
//   });
// }

// XSS protection
app.use(xssProtection);

// Static file serving for uploads
app.use('/uploads', (req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Logging - optimized for production
if (isProduction) {
  app.use(morgan('tiny', { stream: logger.stream }));
} else {
  app.use(morgan('dev'));
}

app.use(requestLogger);
app.use(generalRateLimitMiddleware);

// ===== Health & Metrics Endpoints =====
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (e) {
    res.status(500).send('metrics_error');
  }
});

// ===== API Routes (ALL LAZY LOADED) =====

// Auth routes
app.use('/api/auth', lazyRoute('./routes/auth'));

// Events routes
app.use('/api/events', lazyRoute('./routes/events'));

// Certificate template routes with array fix
app.use('/api/admin/certificate-templates', (req, res, next) => {
  if (req.body?.elements && !Array.isArray(req.body.elements)) {
    req.body.elements = Object.values(req.body.elements);
  }
  next();
}, lazyRoute('./routes/certificateTemplates'));

// Global certificate template routes
app.use('/api/global-certificate-templates', (req, res, next) => {
  if (req.body?.elements && !Array.isArray(req.body.elements)) {
    req.body.elements = Object.values(req.body.elements);
  }
  next();
}, lazyRoute('./routes/globalCertificateTemplates'));

// Upload routes (before /api/admin)
app.use('/api/upload', lazyRoute('./routes/upload'));

// Admin routes
app.use('/api/admin/users', lazyRoute('./routes/admin-users'));
app.use('/api/admin/events-control', lazyRoute('./routes/admin-events'));
app.use('/api/admin/settings', lazyRoute('./routes/settings'));
app.use('/api/admin', lazyRoute('./routes/admin'));

// Other routes (all lazy loaded)
app.use('/api/operations', lazyRoute('./routes/operations'));
app.use('/api/reports', lazyRoute('./routes/reports'));
app.use('/api/certificates', lazyRoute('./routes/certificates'));
app.use('/api/organizers', lazyRoute('./routes/organizers'));
app.use('/api/event-approval', lazyRoute('./routes/eventApproval'));
app.use('/api/departments', lazyRoute('./routes/departments'));
app.use('/api/department-tickets', lazyRoute('./routes/department-tickets'));
app.use('/api/comments', lazyRoute('./routes/comments'));
app.use('/api/analytics', lazyRoute('./routes/analytics'));
app.use('/api/teams', lazyRoute('./routes/teams'));
app.use('/api/escalation', lazyRoute('./routes/escalation'));
app.use('/api/assignment', lazyRoute('./routes/assignment'));
app.use('/api/audit', lazyRoute('./routes/audit'));
app.use('/api/upgrade', lazyRoute('./routes/upgrade'));
app.use('/api/user-stats', lazyRoute('./routes/userStats'));

// Payment and Ticket routes (before ticketTypes)
app.use('/api/payments', lazyRoute('./routes/payments'));
app.use('/api/tickets', lazyRoute('./routes/tickets'));

// Balance and Payout routes
app.use('/api/balance', lazyRoute('./routes/balance'));
app.use('/api/payout-accounts', lazyRoute('./routes/payout-accounts'));
app.use('/api/disbursements', lazyRoute('./routes/disbursements'));

// Contact routes
app.use('/api/contact', lazyRoute('./routes/contact'));

// Notification routes
app.use('/api/notifications', lazyRoute('./routes/notifications'));

// Ticket Types routes (catch-all, must be after specific routes)
app.use('/api', lazyRoute('./routes/ticketTypes'));

// Geocoding routes
app.use('/api/geocoding', lazyRoute('./routes/geocoding'));

// Development routes (dev only)
if (isDevelopment) {
  app.use('/api/dev', lazyRoute('./routes/dev'));
}

// Debug routes (only if ENABLE_DEBUG_ROUTES=true)
if (isDevelopment && process.env.ENABLE_DEBUG_ROUTES === 'true') {
  app.use('/api/debug', lazyRoute('./routes/debug'));
}

// ===== 404 Handler =====
app.use('*', (req, res) => {
  if (isDevelopment) {
    console.log('❌ 404:', req.method, req.originalUrl);
  }
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// ===== Error Handlers =====
if (isProduction) {
  app.use((error, req, res, next) => {
    let sentryErrorCapture = null;
    try {
      const sentry = require('./config/sentry');
      sentryErrorCapture = sentry.sentryErrorCapture;
    } catch (e) {
      // Sentry not available, continue
    }
    if (sentryErrorCapture) sentryErrorCapture(error, req, res, next);
    else next(error);
  });
}

app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// ===== Graceful Shutdown =====
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    const { gracefulShutdown: dbShutdown } = require('./config/database');
    await dbShutdown();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ===== Initialize Application (DEFERRED - After Server Starts) =====
const initializeApp = async () => {
  try {
    logger.info('Initializing application services...');

    const { testDatabaseConnection } = getDatabaseConfig();

    // Database connection - non-blocking, runs in background
    setImmediate(async () => {
      try {
        if (isProduction) {
          const dbConnected = await testDatabaseConnection(3000);
          if (dbConnected) {
            logger.info('✅ Database connected');

            // Run database fix in background (non-blocking)
            setImmediate(async () => {
              try {
                const { fixMultipleTicketsProduction } = require('../../scripts/fix-multiple-tickets-production');
                await fixMultipleTicketsProduction();
                logger.info('✅ Database fix completed');
              } catch (error) {
                logger.warn('⚠️  Database fix warning:', error.message);
              }
            });
          } else {
            logger.warn('⚠️  Database connection failed - will retry');
          }
        } else {
          // Development: test DB in background
          testDatabaseConnection(5000).then((connected) => {
            if (connected) logger.info('✅ Database connected');
            else logger.warn('⚠️  Database connection failed');
          }).catch((err) => logger.warn('⚠️  Database error:', err.message));
        }
      } catch (error) {
        logger.warn('⚠️  Database initialization error:', error.message);
      }
    });

    // Redis connection (optional) - deferred
    setImmediate(async () => {
      try {
        const { connectRedis } = getDatabaseConfig();
        const connected = await Promise.race([
          connectRedis(1500),
          new Promise((resolve) => setTimeout(() => resolve(null), 1500))
        ]);
        if (connected) logger.info('✅ Redis connected');
        else logger.info('⚠️  Redis not available, continuing without cache');
      } catch (error) {
        logger.warn('⚠️  Redis error:', error.message);
      }
    });

    logger.info('✅ Application services initialization started');
  } catch (error) {
    logger.error('❌ Initialization failed:', error);
  }
};

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
let server;

const startServer = async () => {
  try {
    // Start server FIRST (fast) - no blocking operations
    return new Promise((resolve, reject) => {
      server = app.listen(PORT, '0.0.0.0', () => {
        // Server is ready - resolve immediately
        console.log(`✅ Server ready on port ${PORT}`);

        // Resolve immediately - server is ready to accept requests
        resolve(server);

        // ALL services loaded AFTER server is ready (completely non-blocking)
        // Use setTimeout instead of setImmediate for better async behavior
        setTimeout(() => {
          // Initialize app services (database, redis) - completely async
          initializeApp();
        }, 100);

        // Load heavy services with delay to ensure server is fully ready
        setTimeout(() => {
          try {
            // Queue processor - lazy load
            const queueProcessor = require('./services/queueProcessor');
            queueProcessor.start();
            logger.info('✅ Queue processor started');
          } catch (error) {
            logger.warn('⚠️  Queue processor warning:', error.message);
          }
        }, 200);

        // WebSocket - load separately
        setTimeout(() => {
          try {
            const websocketService = require('./services/websocketService');
            websocketService.initialize(server);
            logger.info('✅ WebSocket initialized');
          } catch (error) {
            logger.warn('⚠️  WebSocket warning:', error.message);
          }
        }, 300);

        // Background jobs - load last with longer delay
        setTimeout(() => {
          try {
            const cryptoMonitoring = require('./jobs/cryptoMonitoring');
            cryptoMonitoring.start();
            logger.info('✅ Crypto monitoring started');
          } catch (error) {
            logger.warn('⚠️  Crypto monitoring warning:', error.message);
          }
        }, 500);

        setTimeout(() => {
          try {
            const escalationJob = require('./jobs/escalationJob');
            escalationJob.start();
            logger.info('✅ Escalation job started');
          } catch (error) {
            logger.warn('⚠️  Escalation job warning:', error.message);
          }
        }, 600);

        setTimeout(() => {
          try {
            require('./jobs/eventReminderJob');
            logger.info('✅ Event reminder jobs started');
          } catch (error) {
            logger.warn('⚠️  Event reminder jobs warning:', error.message);
          }
        }, 700);
      });

      server.on('error', (error) => {
        logger.error('❌ Server error:', error);
        reject(error);
      });
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Failed to start server:', error.message);
    logger.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = app;
