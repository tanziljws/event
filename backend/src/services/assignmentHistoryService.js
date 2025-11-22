const { prisma } = require('../config/database');
const logger = require('../config/logger');

class AssignmentHistoryService {
  constructor() {
    this.HISTORY_TYPES = {
      ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
      ASSIGNMENT_REASSIGNED: 'ASSIGNMENT_REASSIGNED',
      ASSIGNMENT_COMPLETED: 'ASSIGNMENT_COMPLETED',
      ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
      STATUS_CHANGED: 'STATUS_CHANGED',
      PRIORITY_CHANGED: 'PRIORITY_CHANGED',
      QUEUE_ADDED: 'QUEUE_ADDED',
      QUEUE_PROCESSED: 'QUEUE_PROCESSED'
    };
  }

  // Log assignment activity
  async logActivity(activityData) {
    try {
      const {
        type,
        itemType, // EVENT or ORGANIZER
        itemId,
        agentId,
        userId, // User who performed the action
        action,
        details = {},
        metadata = {}
      } = activityData;

      // Create history entry
      const historyEntry = await prisma.assignmentHistory.create({
        data: {
          type,
          itemType,
          itemId,
          agentId,
          userId,
          action,
          details: JSON.stringify(details),
          metadata: JSON.stringify(metadata),
          timestamp: new Date()
        }
      });

      logger.info(`Assignment history logged: ${type} for ${itemType} ${itemId}`, details);
      return historyEntry;

    } catch (error) {
      logger.error('Error logging assignment activity:', error);
      throw error;
    }
  }

  // Log assignment creation
  async logAssignmentCreated(itemType, itemId, agentId, userId, details = {}) {
    return await this.logActivity({
      type: this.HISTORY_TYPES.ASSIGNMENT_CREATED,
      itemType,
      itemId,
      agentId,
      userId,
      action: 'Assignment created',
      details: {
        ...details,
        assignedAt: new Date()
      }
    });
  }

  // Log reassignment
  async logReassignment(itemType, itemId, oldAgentId, newAgentId, userId, reason, details = {}) {
    return await this.logActivity({
      type: this.HISTORY_TYPES.ASSIGNMENT_REASSIGNED,
      itemType,
      itemId,
      agentId: newAgentId,
      userId,
      action: 'Assignment reassigned',
      details: {
        oldAgentId,
        newAgentId,
        reason,
        reassignedAt: new Date(),
        ...details
      }
    });
  }

  // Log assignment completion
  async logAssignmentCompleted(itemType, itemId, agentId, userId, details = {}) {
    return await this.logActivity({
      type: this.HISTORY_TYPES.ASSIGNMENT_COMPLETED,
      itemType,
      itemId,
      agentId,
      userId,
      action: 'Assignment completed',
      details: {
        completedAt: new Date(),
        ...details
      }
    });
  }

  // Log status change
  async logStatusChange(itemType, itemId, agentId, userId, oldStatus, newStatus, reason, details = {}) {
    return await this.logActivity({
      type: this.HISTORY_TYPES.STATUS_CHANGED,
      itemType,
      itemId,
      agentId,
      userId,
      action: 'Status changed',
      details: {
        oldStatus,
        newStatus,
        reason,
        changedAt: new Date(),
        ...details
      }
    });
  }

  // Log queue activity
  async logQueueActivity(itemType, itemId, action, userId, details = {}) {
    return await this.logActivity({
      type: action === 'QUEUE_ADDED' ? this.HISTORY_TYPES.QUEUE_ADDED : this.HISTORY_TYPES.QUEUE_PROCESSED,
      itemType,
      itemId,
      agentId: null,
      userId,
      action: action === 'QUEUE_ADDED' ? 'Added to queue' : 'Processed from queue',
      details: {
        queuedAt: new Date(),
        ...details
      }
    });
  }

  // Get assignment history for an item
  async getItemHistory(itemType, itemId, limit = 50, offset = 0) {
    try {
      const history = await prisma.assignmentHistory.findMany({
        where: {
          itemType,
          itemId
        },
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        skip: offset
      });

      return {
        itemType,
        itemId,
        total: history.length,
        history: history.map(entry => ({
          id: entry.id,
          type: entry.type,
          action: entry.action,
          agent: entry.agent,
          user: entry.user,
          details: JSON.parse(entry.details || '{}'),
          metadata: JSON.parse(entry.metadata || '{}'),
          timestamp: entry.timestamp
        }))
      };

    } catch (error) {
      logger.error('Error getting item history:', error);
      throw error;
    }
  }

  // Get agent assignment history
  async getAgentHistory(agentId, limit = 50, offset = 0) {
    try {
      const history = await prisma.assignmentHistory.findMany({
        where: {
          agentId
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        skip: offset
      });

      return {
        agentId,
        total: history.length,
        history: history.map(entry => ({
          id: entry.id,
          type: entry.type,
          itemType: entry.itemType,
          itemId: entry.itemId,
          action: entry.action,
          user: entry.user,
          details: JSON.parse(entry.details || '{}'),
          metadata: JSON.parse(entry.metadata || '{}'),
          timestamp: entry.timestamp
        }))
      };

    } catch (error) {
      logger.error('Error getting agent history:', error);
      throw error;
    }
  }

  // Get reassignment history
  async getReassignmentHistory(agentId = null, limit = 50, offset = 0) {
    try {
      const whereClause = {
        type: this.HISTORY_TYPES.ASSIGNMENT_REASSIGNED
      };

      if (agentId) {
        whereClause.OR = [
          { agentId },
          { details: { contains: `"oldAgentId":"${agentId}"` } }
        ];
      }

      const history = await prisma.assignmentHistory.findMany({
        where: whereClause,
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        skip: offset
      });

      return {
        agentId,
        total: history.length,
        reassignments: history.map(entry => ({
          id: entry.id,
          itemType: entry.itemType,
          itemId: entry.itemId,
          newAgent: entry.agent,
          user: entry.user,
          details: JSON.parse(entry.details || '{}'),
          timestamp: entry.timestamp
        }))
      };

    } catch (error) {
      logger.error('Error getting reassignment history:', error);
      throw error;
    }
  }

  // Get assignment statistics
  async getAssignmentStatistics(timeRange = '7d', agentId = null) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      const whereClause = {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };

      if (agentId) {
        whereClause.agentId = agentId;
      }

      const stats = await prisma.assignmentHistory.groupBy({
        by: ['type'],
        where: whereClause,
        _count: {
          id: true
        }
      });

      const totalAssignments = await prisma.assignmentHistory.count({
        where: {
          ...whereClause,
          type: this.HISTORY_TYPES.ASSIGNMENT_CREATED
        }
      });

      const totalReassignments = await prisma.assignmentHistory.count({
        where: {
          ...whereClause,
          type: this.HISTORY_TYPES.ASSIGNMENT_REASSIGNED
        }
      });

      const totalCompletions = await prisma.assignmentHistory.count({
        where: {
          ...whereClause,
          type: this.HISTORY_TYPES.ASSIGNMENT_COMPLETED
        }
      });

      return {
        timeRange,
        agentId,
        period: { startDate, endDate },
        statistics: {
          totalAssignments,
          totalReassignments,
          totalCompletions,
          reassignmentRate: totalAssignments > 0 ? Math.round((totalReassignments / totalAssignments) * 100) : 0,
          completionRate: totalAssignments > 0 ? Math.round((totalCompletions / totalAssignments) * 100) : 0
        },
        breakdown: stats.map(stat => ({
          type: stat.type,
          count: stat._count.id
        }))
      };

    } catch (error) {
      logger.error('Error getting assignment statistics:', error);
      throw error;
    }
  }

  // Search assignment history
  async searchHistory(searchParams) {
    try {
      const {
        itemType,
        agentId,
        userId,
        type,
        action,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = searchParams;

      const whereClause = {};

      if (itemType) whereClause.itemType = itemType;
      if (agentId) whereClause.agentId = agentId;
      if (userId) whereClause.userId = userId;
      if (type) whereClause.type = type;
      if (action) whereClause.action = { contains: action, mode: 'insensitive' };
      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) whereClause.timestamp.gte = new Date(startDate);
        if (endDate) whereClause.timestamp.lte = new Date(endDate);
      }

      const history = await prisma.assignmentHistory.findMany({
        where: whereClause,
        include: {
          agent: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        skip: offset
      });

      return {
        searchParams,
        total: history.length,
        history: history.map(entry => ({
          id: entry.id,
          type: entry.type,
          itemType: entry.itemType,
          itemId: entry.itemId,
          action: entry.action,
          agent: entry.agent,
          user: entry.user,
          details: JSON.parse(entry.details || '{}'),
          metadata: JSON.parse(entry.metadata || '{}'),
          timestamp: entry.timestamp
        }))
      };

    } catch (error) {
      logger.error('Error searching assignment history:', error);
      throw error;
    }
  }

  // Clean up old history entries
  async cleanupHistory(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await prisma.assignmentHistory.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Cleaned up ${deletedCount.count} old assignment history entries`);
      return deletedCount.count;

    } catch (error) {
      logger.error('Error cleaning up assignment history:', error);
      throw error;
    }
  }

  // Get date range based on time range
  getDateRange(timeRange) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  }
}

module.exports = new AssignmentHistoryService();
