const { prisma } = require('../config/database');
const logger = require('../config/logger');
const notificationService = require('./notificationService');

class AdvancedQueueService {
  constructor() {
    this.QUEUE_PROCESSING_INTERVAL = 30 * 1000; // 30 seconds
    this.isProcessing = false;
  }

  // Get queue analytics
  async getQueueAnalytics(timeRange = '24h') {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      
      // Get queue statistics
      const queueStats = await this.getQueueStatistics(startDate, endDate);
      
      
      // Get queue trends
      const queueTrends = await this.getQueueTrends(startDate, endDate);
      
      // Get processing efficiency
      const processingEfficiency = await this.getProcessingEfficiency(startDate, endDate);

      return {
        timeRange,
        period: { startDate, endDate },
        queueStats,
        queueTrends,
        processingEfficiency,
      };

    } catch (error) {
      logger.error('Error getting queue analytics:', error);
      throw error;
    }
  }

  // Get queue statistics
  async getQueueStatistics(startDate, endDate) {
    try {
      const totalQueued = await prisma.assignmentQueue.count({
        where: {
          queuedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalProcessed = await prisma.assignmentQueue.count({
        where: {
          status: 'ASSIGNED',
          assignedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalFailed = await prisma.assignmentQueue.count({
        where: {
          status: 'FAILED',
          assignedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const currentlyQueued = await prisma.assignmentQueue.count({
        where: { status: 'QUEUED' }
      });

      // Priority breakdown
      const priorityBreakdown = await prisma.assignmentQueue.groupBy({
        by: ['priority'],
        where: {
          queuedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        }
      });

      // Average wait time
      const avgWaitTime = await this.calculateAverageWaitTime(startDate, endDate);

      return {
        totalQueued,
        totalProcessed,
        totalFailed,
        currentlyQueued,
        processingRate: totalQueued > 0 ? Math.round((totalProcessed / totalQueued) * 100) : 0,
        failureRate: totalQueued > 0 ? Math.round((totalFailed / totalQueued) * 100) : 0,
        averageWaitTime: avgWaitTime,
        priorityBreakdown: priorityBreakdown.map(p => ({
          priority: p.priority,
          count: p._count.id
        }))
      };

    } catch (error) {
      logger.error('Error getting queue statistics:', error);
      return null;
    }
  }


  // Get queue trends
  async getQueueTrends(startDate, endDate) {
    try {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const trends = [];
      
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
        
        const dayStats = await this.getQueueStatistics(dayStart, dayEnd);
        
        trends.push({
          date: dayStart.toISOString().split('T')[0],
          queued: dayStats?.totalQueued || 0,
          processed: dayStats?.totalProcessed || 0,
          failed: dayStats?.totalFailed || 0,
          avgWaitTime: dayStats?.averageWaitTime || 0
        });
      }
      
      return trends;
    } catch (error) {
      logger.error('Error getting queue trends:', error);
      return [];
    }
  }

  // Get processing efficiency
  async getProcessingEfficiency(startDate, endDate) {
    try {
      const processedItems = await prisma.assignmentQueue.findMany({
        where: {
          status: 'ASSIGNED',
          assignedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          queuedAt: true,
          assignedAt: true,
          priority: true
        }
      });

      if (processedItems.length === 0) {
        return {
          averageProcessingTime: 0,
          efficiencyByPriority: {},
          totalProcessed: 0
        };
      }

      // Calculate average processing time
      const totalProcessingTime = processedItems.reduce((sum, item) => {
        return sum + (item.assignedAt.getTime() - item.queuedAt.getTime());
      }, 0);

      const averageProcessingTime = Math.round(totalProcessingTime / processedItems.length / (1000 * 60)); // in minutes

      // Efficiency by priority
      const efficiencyByPriority = {};
      for (const priority of Object.keys(this.SLA_RULES)) {
        const priorityItems = processedItems.filter(item => item.priority === priority);
        if (priorityItems.length > 0) {
          const priorityTime = priorityItems.reduce((sum, item) => {
            return sum + (item.assignedAt.getTime() - item.queuedAt.getTime());
          }, 0);
          
          efficiencyByPriority[priority] = Math.round(priorityTime / priorityItems.length / (1000 * 60));
        }
      }

      return {
        averageProcessingTime,
        efficiencyByPriority,
        totalProcessed: processedItems.length
      };

    } catch (error) {
      logger.error('Error getting processing efficiency:', error);
      return null;
    }
  }

  // Calculate average wait time
  async calculateAverageWaitTime(startDate, endDate) {
    try {
      const processedItems = await prisma.assignmentQueue.findMany({
        where: {
          status: 'ASSIGNED',
          assignedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          queuedAt: true,
          assignedAt: true
        }
      });

      if (processedItems.length === 0) return 0;

      const totalWaitTime = processedItems.reduce((sum, item) => {
        return sum + (item.assignedAt.getTime() - item.queuedAt.getTime());
      }, 0);

      return Math.round(totalWaitTime / processedItems.length / (1000 * 60)); // in minutes

    } catch (error) {
      logger.error('Error calculating average wait time:', error);
      return 0;
    }
  }

  // Generate recommendations




  // Get date range based on time range
  getDateRange(timeRange) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1h':
        startDate.setHours(endDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        startDate.setDate(endDate.getDate() - 1);
    }
    
    return { startDate, endDate };
  }

  // Get queue health status
  async getQueueHealthStatus() {
    try {
      const currentQueue = await prisma.assignmentQueue.count({
        where: { status: 'QUEUED' }
      });

      const slaViolations = await this.getSLAViolations(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());
      
      let healthStatus = 'HEALTHY';
      let healthScore = 100;

      // Reduce score based on violations
      if (slaViolations.length > 0) {
        healthScore -= slaViolations.length * 20;
        healthStatus = 'WARNING';
      }

      // Reduce score based on queue size
      if (currentQueue > 50) {
        healthScore -= 30;
        healthStatus = 'CRITICAL';
      } else if (currentQueue > 20) {
        healthScore -= 15;
        if (healthStatus === 'HEALTHY') healthStatus = 'WARNING';
      }

      return {
        status: healthStatus,
        score: Math.max(0, healthScore),
        currentQueue,
        slaViolations: slaViolations.length,
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error getting queue health status:', error);
      return {
        status: 'UNKNOWN',
        score: 0,
        currentQueue: 0,
        slaViolations: 0,
        timestamp: new Date()
      };
    }
  }
}

module.exports = new AdvancedQueueService();
