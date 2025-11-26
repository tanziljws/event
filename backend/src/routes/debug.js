/**
 * Debug Routes - Only available in development mode
 * Access: /api/debug/*
 */

const express = require('express');
const router = express.Router();
const { isDebugRoutesEnabled, debugLog } = require('../utils/debug');
const prisma = require('../config/database').getPrisma();

// Middleware to check if debug routes are enabled
const requireDebugMode = (req, res, next) => {
  if (!isDebugRoutesEnabled()) {
    return res.status(403).json({
      success: false,
      message: 'Debug routes are only available in development mode',
    });
  }
  next();
};

// Apply debug mode check to all routes
router.use(requireDebugMode);

/**
 * GET /api/debug/info
 * Get debug information (no sensitive data)
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      environment: process.env.NODE_ENV,
      debug: process.env.DEBUG === 'true',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    },
  });
});

/**
 * GET /api/debug/db/status
 * Check database connection status
 */
router.get('/db/status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Database connection OK',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

/**
 * GET /api/debug/db/tables
 * List all database tables
 */
router.get('/db/tables', async (req, res) => {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    res.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message,
    });
  }
});

/**
 * GET /api/debug/users/count
 * Get user count (for testing)
 */
router.get('/users/count', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to count users',
      error: error.message,
    });
  }
});

/**
 * POST /api/debug/test/email
 * Test email sending (development only)
 */
router.post('/test/email', async (req, res) => {
  try {
    const { to, subject } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'to and subject are required',
      });
    }

    const emailService = require('../services/emailService');
    await emailService.sendTestEmail(to, subject);
    
    res.json({
      success: true,
      message: 'Test email sent',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
});

module.exports = router;

