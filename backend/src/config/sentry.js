// Lazy load Sentry to prevent blocking startup
let Sentry = null;
const getSentry = () => {
  if (!Sentry) {
    try {
      Sentry = require('@sentry/node');
    } catch (error) {
      console.log('⚠️  Sentry package not available:', error.message);
      return null;
    }
  }
  return Sentry;
};

// Initialize Sentry with timeout protection (non-blocking)
const initSentry = () => {
  // Skip Sentry if no DSN provided (faster startup)
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DSN === '') {
    console.log('⚠️  Sentry DSN not provided, skipping initialization');
    return;
  }

  // Run in next tick to prevent blocking startup
  setImmediate(() => {
    try {
      const SentryLib = getSentry();
      if (!SentryLib) {
        console.log('⚠️  Sentry not available, skipping initialization');
        return;
      }
      
        // Initialize Sentry synchronously but quickly
      SentryLib.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          
        // Performance monitoring - disabled in development for faster startup
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
          
        // Profiling - disabled in development for faster startup
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
          
          // Disable automatic instrumentation that might cause delays
          autoSessionTracking: false,
          autoInstrumentServerFunctions: false,
          
          // Disable transport that might block
          transportOptions: {
          timeout: 1000, // 1 second timeout for transport (reduced from 2s)
          },
          
          integrations: [
          // Minimal integrations for faster startup
          ],
          
          // Release tracking
          release: process.env.SENTRY_RELEASE || '1.0.0',
          
          // Error filtering
          beforeSend(event, hint) {
            // Filter out certain errors
            if (event.exception) {
              const error = hint.originalException;
              
              // Don't report validation errors
              if (error && error.name === 'ValidationError') {
                return null;
              }
              
              // Don't report 404 errors
              if (error && error.status === 404) {
                return null;
              }
            }
            
            return event;
          },
          
          // Additional context
          beforeBreadcrumb(breadcrumb) {
            // Filter out sensitive data
            if (breadcrumb.category === 'http' && breadcrumb.data) {
              // Remove sensitive headers
              delete breadcrumb.data['authorization'];
              delete breadcrumb.data['cookie'];
            }
            
            return breadcrumb;
          }
        });
        
        console.log('✅ Sentry initialized successfully');
    } catch (error) {
      console.log('⚠️  Sentry initialization failed, continuing without Sentry:', error.message);
    }
  });
  
  // Return immediately to not block
  return;
};

// Error handler middleware (Sentry v10+)
const sentryErrorHandler = (req, res, next) => {
  // Simple middleware wrapper
  const SentryLib = getSentry();
  if (SentryLib && typeof SentryLib.requestHandler === 'function') {
    return SentryLib.requestHandler(req, res, next);
  }
  next();
};

// Error capture middleware (Sentry v10+)
const sentryErrorCapture = (err, req, res, next) => {
  // Simple error handler wrapper
  const SentryLib = getSentry();
  if (SentryLib && typeof SentryLib.errorHandler === 'function') {
    return SentryLib.errorHandler(err, req, res, next);
  }
  next(err);
};

// Custom error reporting function
const reportError = (error, context = {}) => {
  const SentryLib = getSentry();
  if (!SentryLib) return;
  
  SentryLib.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Capture the error
    SentryLib.captureException(error);
  });
};

// Performance monitoring
const startTransaction = (name, op = 'custom') => {
  const SentryLib = getSentry();
  if (!SentryLib) return null;
  return SentryLib.startTransaction({ name, op });
};

// User context
const setUserContext = (user) => {
  const SentryLib = getSentry();
  if (!SentryLib) return;
  SentryLib.setUser({
    id: user.id,
    email: user.email,
    username: user.fullName,
    role: user.role,
  });
};

// Clear user context
const clearUserContext = () => {
  const SentryLib = getSentry();
  if (!SentryLib) return;
  SentryLib.setUser(null);
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  sentryErrorCapture,
  reportError,
  startTransaction,
  setUserContext,
  clearUserContext,
  get Sentry() { return getSentry(); }
};
