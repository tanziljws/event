const express = require('express');
const { body, query, validationResult } = require('express-validator');
const auditService = require('../services/auditService');
const { authenticate, requireRole } = require('../middlewares/auth');
const logger = require('../config/logger');

const router = express.Router();

// Get audit logs with filtering
router.get('/logs', authenticate, requireRole(['OPS_HEAD', 'SUPER_ADMIN']), [
  query('performedBy').optional().isString(),
  query('entityType').optional().isIn(['EVENT', 'ORGANIZER', 'USER', 'TICKET', 'ASSIGNMENT']),
  query('entityId').optional().isString(),
  query('action').optional().isIn(['APPROVE', 'DECLINE', 'ASSIGN', 'REASSIGN', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('orderBy').optional().isIn(['performedAt', 'action', 'entityType']),
  query('orderDirection').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      performedBy,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      orderBy = 'performedAt',
      orderDirection = 'desc'
    } = req.query;

    const result = await auditService.getAuditLogs({
      performedBy,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
      orderBy,
      orderDirection
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit logs'
    });
  }
});

// Get audit logs for specific entity
router.get('/entity/:entityType/:entityId', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT', 'SUPER_ADMIN']), [
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { entityType, entityId } = req.params;
    const { limit = 20 } = req.query;

    const auditLogs = await auditService.getEntityAuditLogs(
      entityType.toUpperCase(),
      entityId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    logger.error('Error getting entity audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get entity audit logs'
    });
  }
});

// Get audit statistics
router.get('/stats', authenticate, requireRole(['OPS_HEAD', 'SUPER_ADMIN']), [
  query('performedBy').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { performedBy, startDate, endDate } = req.query;

    const stats = await auditService.getAuditStats({
      performedBy,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get audit stats'
    });
  }
});

// Get agent performance from audit logs
router.get('/agent-performance', authenticate, requireRole(['OPS_HEAD', 'SUPER_ADMIN']), [
  query('agentId').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { agentId, startDate, endDate } = req.query;

    const performance = await auditService.getAgentPerformance({
      agentId,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: performance
    });

  } catch (error) {
    logger.error('Error getting agent performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agent performance'
    });
  }
});

// Get all agents performance summary
router.get('/agents-performance', authenticate, requireRole(['OPS_HEAD', 'SUPER_ADMIN']), [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { startDate, endDate } = req.query;

    // Get all OPS agents
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const agents = await prisma.user.findMany({
      where: {
        role: {
          in: ['OPS_AGENT', 'OPS_SENIOR_AGENT']
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    });

    // Get performance for each agent
    const agentsPerformance = await Promise.all(
      agents.map(async (agent) => {
        const performance = await auditService.getAgentPerformance({
          agentId: agent.id,
          startDate,
          endDate
        });
        return {
          ...agent,
          ...performance
        };
      })
    );

    res.json({
      success: true,
      data: agentsPerformance
    });

  } catch (error) {
    logger.error('Error getting agents performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agents performance'
    });
  }
});

module.exports = router;
