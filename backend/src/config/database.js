const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

// Lazy load logger to prevent blocking
let logger = null;
const getLogger = () => {
  if (!logger) {
    logger = require('./logger');
  }
  return logger;
};

// Prisma Client Configuration with connection pool settings
// Optimized: Only log errors and warnings in production, disable query logging for faster startup
// Add connection timeout to DATABASE_URL if not present (for faster connection failures)
let databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl && !databaseUrl.includes('connect_timeout')) {
  const separator = databaseUrl.includes('?') ? '&' : '?';
  databaseUrl = `${databaseUrl}${separator}connect_timeout=2&pool_timeout=2`;
}

// Lazy initialize PrismaClient to prevent blocking on require
let prisma = null;
const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? [
            {
              emit: 'event',
              level: 'error',
            },
            {
              emit: 'event',
              level: 'warn',
            },
          ]
        : [
            {
              emit: 'event',
              level: 'error',
            },
          ],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    // Prisma Event Listeners (optimized - only log errors and warnings)
    prisma.$on('error', (e) => {
      getLogger().error('Prisma Error:', e);
    });

    prisma.$on('warn', (e) => {
      getLogger().warn('Prisma Warning:', e.message);
    });
  }
  return prisma;
};

// Redis Client Configuration
let redisClient;

const connectRedis = async (timeoutMs = 3000) => {
  // Skip Redis connection if REDIS_URL is not provided
  if (!process.env.REDIS_URL) {
    getLogger().info('Redis URL not provided, skipping Redis connection');
      return null;
    }

  // Check if Redis URL points to localhost (might not be available)
  const isLocalhost = process.env.REDIS_URL.includes('localhost') || 
                     process.env.REDIS_URL.includes('127.0.0.1');
  
  return new Promise((resolve) => {
    getLogger().info('Attempting to connect to Redis...');

    try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
        socket: {
          connectTimeout: timeoutMs,
          reconnectStrategy: false, // Don't auto-reconnect, fail fast
      },
    });

      // Set up error handler BEFORE connecting
    redisClient.on('error', (err) => {
        getLogger().warn(`Redis connection error (optional): ${err.message}`);
        redisClient = null;
        resolve(null); // Resolve with null instead of rejecting
      });

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (redisClient && redisClient.isOpen === false) {
          getLogger().warn(`Redis connection timeout after ${timeoutMs}ms (optional)`);
          try {
            redisClient.quit().catch(() => {});
          } catch (e) {
            // Ignore cleanup errors
          }
          redisClient = null;
          resolve(null);
        }
      }, timeoutMs);

      // Handle successful connection
    redisClient.on('ready', () => {
        clearTimeout(connectionTimeout);
        getLogger().info('✅ Redis connected successfully');
        resolve(redisClient);
    });

      // Try to connect
      redisClient.connect().catch((err) => {
        clearTimeout(connectionTimeout);
        if (err.code === 'ECONNREFUSED' || err.message.includes('connect ECONNREFUSED')) {
          getLogger().warn('Redis server not available (optional - application will continue)');
        } else {
          getLogger().warn(`Redis connection failed (optional): ${err.message}`);
        }
        redisClient = null;
        resolve(null); // Don't reject, just return null
      });

  } catch (error) {
      getLogger().warn(`Redis setup error (optional): ${error.message}`);
      redisClient = null;
      resolve(null);
    }
  });
};

// Database connection test with timeout (optimized for faster startup)
const testDatabaseConnection = async (timeoutMs = 5000) => {
  return new Promise((resolve) => {
    console.log('🔌 Attempting to connect to database...');
    getLogger().info('🔌 Attempting to connect to database...');
    const startTime = Date.now();
    
    let isResolved = false;
    let timeoutId;
    let connectPromise;

    // Set timeout - more aggressive
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        const elapsed = Date.now() - startTime;
        console.error(`❌ Database connection timeout after ${elapsed}ms (max ${timeoutMs}ms)`);
        const logger = getLogger();
        logger.error(`❌ Database connection timeout after ${elapsed}ms (max ${timeoutMs}ms)`);
        logger.error('Cannot connect to database. Please check:');
        logger.error('1. Is PostgreSQL running?');
        logger.error('2. Is DATABASE_URL correct in .env?');
        logger.error('3. Is the database accessible?');
        console.error(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
        logger.error(`   Current DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`);
        
        // Try to disconnect if connection is pending
        if (connectPromise) {
          const prisma = getPrisma();
          prisma.$disconnect().catch(() => {
            // Ignore disconnect errors
          });
        }
        
        resolve(false);
      }
    }, timeoutMs);

    // Try to connect with Promise.race for better timeout control
    (async () => {
      try {
        const prisma = getPrisma();
        console.log('🔌 Calling prisma.$connect()...');
        getLogger().info('🔌 Calling prisma.$connect()...');
        
        // Create connection promise with aggressive timeout
        connectPromise = prisma.$connect();
        const connectTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), Math.min(timeoutMs - 200, 1500)); // Max 1.5s, min 200ms buffer
        });
        
        // Race connection with timeout
        await Promise.race([connectPromise, connectTimeout]);
        
        if (isResolved) return; // Timeout already resolved
        
        console.log('🔌 prisma.$connect() completed, testing with query...');
        getLogger().info('🔌 prisma.$connect() completed, testing with query...');
        
        // Test connection with a simple query (with shorter timeout)
        const queryPromise = prisma.$queryRaw`SELECT 1`;
        const queryTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), Math.min(timeoutMs - 1000, 3000)); // Max 3s, min 1s buffer
        });
        
        await Promise.race([queryPromise, queryTimeout]);
        
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          const elapsed = Date.now() - startTime;
          console.log(`✅ Database connected successfully (${elapsed}ms)`);
          getLogger().info(`✅ Database connected successfully (${elapsed}ms)`);
          resolve(true);
        }
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          const elapsed = Date.now() - startTime;
          const logger = getLogger();
          
          console.error(`❌ Database connection failed after ${elapsed}ms:`, error.message);
          logger.error(`❌ Database connection failed after ${elapsed}ms:`, error.message);
          if (error.stack) {
            logger.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
          }
          
          // Check if it's a connection error
          if (error.message.includes('timeout') || 
              error.message.includes('ECONNREFUSED') || 
              error.message.includes('ENOTFOUND') ||
              error.message.includes('P1001') ||
              error.code === 'ECONNREFUSED') {
            console.error('Cannot connect to database. Please check:');
            logger.error('Cannot connect to database. Please check:');
            logger.error('1. Is PostgreSQL running?');
            logger.error('2. Is DATABASE_URL correct in .env?');
            logger.error('3. Is the database accessible?');
            console.error(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
            logger.error(`   Current DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`);
            
            // Try to provide helpful suggestions
            if (error.message.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
              console.error('');
              console.error('💡 Suggestion: Start PostgreSQL with:');
              console.error('   macOS: brew services start postgresql');
              console.error('   Linux: sudo systemctl start postgresql');
              console.error('   Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres');
              logger.error('');
              logger.error('💡 Suggestion: Start PostgreSQL with:');
              logger.error('   macOS: brew services start postgresql');
              logger.error('   Linux: sudo systemctl start postgresql');
              logger.error('   Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres');
            }
          }
          
          resolve(false);
        }
      }
    })();
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (redisClient && redisClient.isOpen) {
      try {
      await redisClient.quit();
      } catch (error) {
        getLogger().warn('Error closing Redis connection:', error.message);
      }
    }
    getLogger().info('Database connections closed gracefully');
  } catch (error) {
    getLogger().error('Error during graceful shutdown:', error);
  }
};

// Process handlers for graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  get prisma() { return getPrisma(); }, // Lazy getter
  getPrisma,
  connectRedis,
  testDatabaseConnection,
  gracefulShutdown,
  getRedisClient: () => redisClient,
};
