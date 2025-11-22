const { prisma } = require('../config/database');
const logger = require('../config/logger');

class AnalyticsService {
  constructor() {
    this.METRICS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.cache = new Map();
  }

  // Get agent performance metrics
  async getAgentPerformanceMetrics(agentId, timeRange = '7d') {
    try {
      const cacheKey = `agent_performance_${agentId}_${timeRange}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const { startDate, endDate } = this.getDateRange(timeRange);
      
      // Get assignment statistics
      const assignments = await this.getAgentAssignments(agentId, startDate, endDate);
      
      // Calculate metrics
      const metrics = {
        agentId,
        timeRange,
        period: { startDate, endDate },
        assignments: {
          total: assignments.length,
          completed: assignments.filter(a => a.status === 'COMPLETED').length,
          pending: assignments.filter(a => a.status === 'PENDING').length,
          failed: assignments.filter(a => a.status === 'FAILED').length
        },
        performance: {
          completionRate: this.calculateCompletionRate(assignments),
          averageProcessingTime: this.calculateAverageProcessingTime(assignments),
          qualityScore: this.calculateQualityScore(assignments),
          efficiency: this.calculateEfficiency(assignments)
        },
        workload: {
          totalHours: this.calculateTotalHours(assignments),
          peakHours: this.calculatePeakHours(assignments),
          capacityUtilization: this.calculateCapacityUtilization(assignments)
        },
        trends: await this.getPerformanceTrends(agentId, timeRange)
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;

    } catch (error) {
      logger.error('Error getting agent performance metrics:', error);
      throw error;
    }
  }

  // Get all agents performance comparison
  async getAllAgentsPerformance(timeRange = '7d') {
    try {
      const cacheKey = `all_agents_performance_${timeRange}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;

      const agents = await prisma.user.findMany({
        where: { 
          role: { in: ['OPS_AGENT', 'OPS_SENIOR_AGENT'] }
        },
        select: {
          id: true,
          fullName: true,
          role: true,
          lastActivity: true
        }
      });

      const agentsPerformance = await Promise.all(
        agents.map(async (agent) => {
          const metrics = await this.getAgentPerformanceMetrics(agent.id, timeRange);
          return {
            ...agent,
            metrics: metrics.performance,
            assignments: metrics.assignments,
            workload: metrics.workload
          };
        })
      );

      // Sort by performance score
      agentsPerformance.sort((a, b) => {
        const scoreA = this.calculateOverallScore(a.metrics);
        const scoreB = this.calculateOverallScore(b.metrics);
        return scoreB - scoreA;
      });

      const result = {
        timeRange,
        totalAgents: agentsPerformance.length,
        agents: agentsPerformance,
        summary: this.calculateSummaryStats(agentsPerformance)
      };

      this.setCachedData(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Error getting all agents performance:', error);
      throw error;
    }
  }

  // Get agent assignments within date range
  async getAgentAssignments(agentId, startDate, endDate) {
    try {
      // Get event assignments
      const eventAssignments = await prisma.event.findMany({
        where: {
          assignedTo: agentId,
          assignedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          title: true,
          status: true,
          assignedAt: true,
          updatedAt: true
        }
      });

      // Get organizer assignments
      const organizerAssignments = await prisma.user.findMany({
        where: {
          assignedTo: agentId,
          assignedAt: {
            gte: startDate,
            lte: endDate
          },
          role: 'ORGANIZER'
        },
        select: {
          id: true,
          fullName: true,
          verificationStatus: true,
          assignedAt: true,
          updatedAt: true
        }
      });

      // Combine and normalize assignments
      const assignments = [
        ...eventAssignments.map(a => ({
          id: a.id,
          title: a.title,
          status: this.mapEventStatus(a.status),
          assignedAt: a.assignedAt,
          updatedAt: a.updatedAt,
          type: 'EVENT',
          processingTime: this.calculateProcessingTime(a.assignedAt, a.updatedAt)
        })),
        ...organizerAssignments.map(a => ({
          id: a.id,
          title: a.fullName,
          status: this.mapVerificationStatus(a.verificationStatus),
          assignedAt: a.assignedAt,
          updatedAt: a.updatedAt,
          type: 'ORGANIZER',
          processingTime: this.calculateProcessingTime(a.assignedAt, a.updatedAt)
        }))
      ];

      return assignments;

    } catch (error) {
      logger.error('Error getting agent assignments:', error);
      return [];
    }
  }

  // Calculate completion rate
  calculateCompletionRate(assignments) {
    if (assignments.length === 0) return 0;
    const completed = assignments.filter(a => a.status === 'COMPLETED').length;
    return Math.round((completed / assignments.length) * 100);
  }

  // Calculate average processing time
  calculateAverageProcessingTime(assignments) {
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED' && a.processingTime);
    if (completedAssignments.length === 0) return 0;
    
    const totalTime = completedAssignments.reduce((sum, a) => sum + a.processingTime, 0);
    return Math.round(totalTime / completedAssignments.length);
  }

  // Calculate quality score (based on completion rate and processing time)
  calculateQualityScore(assignments) {
    const completionRate = this.calculateCompletionRate(assignments);
    const avgProcessingTime = this.calculateAverageProcessingTime(assignments);
    
    // Quality score: completion rate weighted more than speed
    const speedScore = avgProcessingTime > 0 ? Math.max(0, 100 - (avgProcessingTime / 1000)) : 50;
    return Math.round((completionRate * 0.7) + (speedScore * 0.3));
  }

  // Calculate efficiency (assignments per hour)
  calculateEfficiency(assignments) {
    const totalHours = this.calculateTotalHours(assignments);
    if (totalHours === 0) return 0;
    return Math.round((assignments.length / totalHours) * 100) / 100;
  }

  // Calculate total working hours
  calculateTotalHours(assignments) {
    if (assignments.length === 0) return 0;
    
    const startTime = Math.min(...assignments.map(a => a.assignedAt.getTime()));
    const endTime = Math.max(...assignments.map(a => a.updatedAt.getTime()));
    
    return Math.max(1, (endTime - startTime) / (1000 * 60 * 60)); // Convert to hours
  }

  // Calculate peak hours
  calculatePeakHours(assignments) {
    const hourCounts = new Array(24).fill(0);
    
    assignments.forEach(assignment => {
      const hour = assignment.assignedAt.getHours();
      hourCounts[hour]++;
    });
    
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count === maxCount)
      .map(item => item.hour);
    
    return peakHours;
  }

  // Calculate capacity utilization
  calculateCapacityUtilization(assignments) {
    const totalHours = this.calculateTotalHours(assignments);
    const maxCapacity = 20; // Max assignments per agent
    const utilization = (assignments.length / maxCapacity) * 100;
    return Math.min(100, Math.round(utilization));
  }

  // Get performance trends
  async getPerformanceTrends(agentId, timeRange) {
    try {
      const { startDate, endDate } = this.getDateRange(timeRange);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      const trends = [];
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
        
        const dayAssignments = await this.getAgentAssignments(agentId, dayStart, dayEnd);
        
        trends.push({
          date: dayStart.toISOString().split('T')[0],
          assignments: dayAssignments.length,
          completionRate: this.calculateCompletionRate(dayAssignments),
          avgProcessingTime: this.calculateAverageProcessingTime(dayAssignments)
        });
      }
      
      return trends;
    } catch (error) {
      logger.error('Error getting performance trends:', error);
      return [];
    }
  }

  // Calculate overall performance score
  calculateOverallScore(metrics) {
    const weights = {
      completionRate: 0.4,
      qualityScore: 0.3,
      efficiency: 0.2,
      capacityUtilization: 0.1
    };
    
    return Math.round(
      (metrics.completionRate * weights.completionRate) +
      (metrics.qualityScore * weights.qualityScore) +
      (metrics.efficiency * weights.efficiency) +
      (metrics.capacityUtilization * weights.capacityUtilization)
    );
  }

  // Calculate summary statistics
  calculateSummaryStats(agentsPerformance) {
    if (agentsPerformance.length === 0) return null;
    
    const completionRates = agentsPerformance.map(a => a.metrics.completionRate);
    const qualityScores = agentsPerformance.map(a => a.metrics.qualityScore);
    const efficiencies = agentsPerformance.map(a => a.metrics.efficiency);
    
    return {
      averageCompletionRate: Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length),
      averageQualityScore: Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length),
      averageEfficiency: Math.round((efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length) * 100) / 100,
      topPerformer: agentsPerformance[0]?.fullName || 'N/A',
      totalAssignments: agentsPerformance.reduce((sum, a) => sum + a.assignments.total, 0)
    };
  }

  // Map event status to standard status
  mapEventStatus(eventStatus) {
    const statusMap = {
      'DRAFT': 'PENDING',
      'PUBLISHED': 'COMPLETED',
      'CANCELLED': 'FAILED'
    };
    return statusMap[eventStatus] || 'PENDING';
  }

  // Map verification status to standard status
  mapVerificationStatus(verificationStatus) {
    const statusMap = {
      'PENDING': 'PENDING',
      'VERIFIED': 'COMPLETED',
      'REJECTED': 'FAILED'
    };
    return statusMap[verificationStatus] || 'PENDING';
  }

  // Calculate processing time in minutes
  calculateProcessingTime(assignedAt, updatedAt) {
    if (!assignedAt || !updatedAt) return 0;
    return Math.round((updatedAt.getTime() - assignedAt.getTime()) / (1000 * 60));
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

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.METRICS_CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    logger.info('Analytics cache cleared');
  }
}

module.exports = new AnalyticsService();
