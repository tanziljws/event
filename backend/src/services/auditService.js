const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class AuditService {
  constructor() {
    this.ACTIONS = {
      APPROVE: 'APPROVE',
      DECLINE: 'DECLINE',
      ASSIGN: 'ASSIGN',
      REASSIGN: 'REASSIGN',
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      DELETE: 'DELETE',
      LOGIN: 'LOGIN',
      LOGOUT: 'LOGOUT',
      VIEW: 'VIEW',
      EXPORT: 'EXPORT'
    };

    this.ENTITY_TYPES = {
      EVENT: 'EVENT',
      ORGANIZER: 'ORGANIZER',
      USER: 'USER',
      TICKET: 'TICKET',
      ASSIGNMENT: 'ASSIGNMENT'
    };
  }

  // Log an audit action
  async logAction({
    action,
    entityType,
    entityId,
    performedBy,
    reason = null,
    previousStatus = null,
    newStatus = null,
    notes = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    metadata = null
  }) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          performedBy,
          reason,
          previousStatus,
          newStatus,
          notes,
          ipAddress,
          userAgent,
          sessionId,
          metadata: metadata ? JSON.stringify(metadata) : null,
          performedAt: new Date()
        },
        include: {
          performer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      });

      logger.info(`Audit log created: ${action} on ${entityType} ${entityId} by ${auditLog.performer.fullName}`);
      return auditLog;

    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  // Log approval action
  async logApproval({
    entityType,
    entityId,
    performedBy,
    reason = null,
    previousStatus = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    metadata = null
  }) {
    return await this.logAction({
      action: this.ACTIONS.APPROVE,
      entityType,
      entityId,
      performedBy,
      reason,
      previousStatus,
      newStatus: 'APPROVED',
      ipAddress,
      userAgent,
      sessionId,
      metadata
    });
  }

  // Log decline action
  async logDecline({
    entityType,
    entityId,
    performedBy,
    reason = null,
    previousStatus = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    metadata = null
  }) {
    return await this.logAction({
      action: this.ACTIONS.DECLINE,
      entityType,
      entityId,
      performedBy,
      reason,
      previousStatus,
      newStatus: 'DECLINED',
      ipAddress,
      userAgent,
      sessionId,
      metadata
    });
  }

  // Log assignment action
  async logAssignment({
    entityType,
    entityId,
    performedBy,
    assignedTo = null,
    reason = null,
    previousStatus = null,
    ipAddress = null,
    userAgent = null,
    sessionId = null,
    metadata = null
  }) {
    return await this.logAction({
      action: this.ACTIONS.ASSIGN,
      entityType,
      entityId,
      performedBy,
      reason,
      previousStatus,
      newStatus: 'ASSIGNED',
      ipAddress,
      userAgent,
      sessionId,
      metadata: {
        ...metadata,
        assignedTo
      }
    });
  }

  // Get audit logs with filtering
  async getAuditLogs({
    performedBy = null,
    entityType = null,
    entityId = null,
    action = null,
    startDate = null,
    endDate = null,
    limit = 50,
    offset = 0,
    orderBy = 'performedAt',
    orderDirection = 'desc'
  }) {
    try {
      const where = {};

      if (performedBy) {
        where.performedBy = performedBy;
      }

      if (entityType) {
        where.entityType = entityType;
      }

      if (entityId) {
        where.entityId = entityId;
      }

      if (action) {
        where.action = action;
      }

      if (startDate || endDate) {
        where.performedAt = {};
        if (startDate) {
          where.performedAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.performedAt.lte = new Date(endDate);
        }
      }

      const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          [orderBy]: orderDirection
        },
        take: limit,
        skip: offset
      });

      const total = await prisma.auditLog.count({ where });

      return {
        logs: auditLogs,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };

    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // Get audit logs for specific entity
  async getEntityAuditLogs(entityType, entityId, limit = 20) {
    try {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId
        },
        include: {
          performer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          performedAt: 'desc'
        },
        take: limit
      });

      return auditLogs;

    } catch (error) {
      logger.error('Error getting entity audit logs:', error);
      throw error;
    }
  }

  // Get audit statistics
  async getAuditStats({
    performedBy = null,
    startDate = null,
    endDate = null
  }) {
    try {
      const where = {};

      if (performedBy) {
        where.performedBy = performedBy;
      }

      if (startDate || endDate) {
        where.performedAt = {};
        if (startDate) {
          where.performedAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.performedAt.lte = new Date(endDate);
        }
      }

      // Get action counts
      const actionCounts = await prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true
        }
      });

      // Get entity type counts
      const entityTypeCounts = await prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: {
          entityType: true
        }
      });

      // Get daily activity
      const dailyActivity = await prisma.auditLog.groupBy({
        by: ['performedAt'],
        where,
        _count: {
          performedAt: true
        },
        orderBy: {
          performedAt: 'desc'
        },
        take: 30
      });

      return {
        actionCounts: actionCounts.reduce((acc, item) => {
          acc[item.action] = item._count.action;
          return acc;
        }, {}),
        entityTypeCounts: entityTypeCounts.reduce((acc, item) => {
          acc[item.entityType] = item._count.entityType;
          return acc;
        }, {}),
        dailyActivity: dailyActivity.map(item => ({
          date: item.performedAt.toISOString().split('T')[0],
          count: item._count.performedAt
        }))
      };

    } catch (error) {
      logger.error('Error getting audit stats:', error);
      throw error;
    }
  }

  // Get agent performance from audit logs
  async getAgentPerformance({
    agentId = null,
    startDate = null,
    endDate = null
  }) {
    try {
      const where = {
        performedBy: agentId,
        action: {
          in: [this.ACTIONS.APPROVE, this.ACTIONS.DECLINE]
        }
      };

      if (startDate || endDate) {
        where.performedAt = {};
        if (startDate) {
          where.performedAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.performedAt.lte = new Date(endDate);
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          performer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          performedAt: 'desc'
        }
      });

      // Calculate performance metrics
      const totalActions = logs.length;
      const approvals = logs.filter(log => log.action === this.ACTIONS.APPROVE).length;
      const declines = logs.filter(log => log.action === this.ACTIONS.DECLINE).length;
      const approvalRate = totalActions > 0 ? (approvals / totalActions) * 100 : 0;

      // Group by entity type
      const byEntityType = logs.reduce((acc, log) => {
        if (!acc[log.entityType]) {
          acc[log.entityType] = { approvals: 0, declines: 0, total: 0 };
        }
        acc[log.entityType].total++;
        if (log.action === this.ACTIONS.APPROVE) {
          acc[log.entityType].approvals++;
        } else if (log.action === this.ACTIONS.DECLINE) {
          acc[log.entityType].declines++;
        }
        return acc;
      }, {});

      return {
        agent: logs[0]?.performer || null,
        totalActions,
        approvals,
        declines,
        approvalRate: Math.round(approvalRate * 100) / 100,
        byEntityType,
        logs: logs.slice(0, 10) // Recent 10 actions
      };

    } catch (error) {
      logger.error('Error getting agent performance:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
