const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Advanced assignment service with load balancing and quota management
class AssignmentService {
  constructor() {
    this.MAX_QUOTA_PER_AGENT = 20; // Max cases per agent
    this.ASSIGNMENT_TYPES = {
      EVENT: 'EVENT',
      ORGANIZER: 'ORGANIZER'
    };
  }

  // Get agent with lowest workload
  async getAgentWithLowestWorkload(assignmentType = 'EVENT') {
    try {
      const agents = await prisma.user.findMany({
        where: { role: 'OPS_AGENT' },
        select: { id: true, fullName: true, email: true },
        orderBy: { createdAt: 'asc' }
      });

      if (agents.length === 0) {
        logger.warn('⚠️ No agents available for assignment');
        return null;
      }

      // Get current workload for each agent
      const agentWorkloads = await Promise.all(
        agents.map(async (agent) => {
          const workload = await this.getAgentWorkload(agent.id, assignmentType);
          return {
            ...agent,
            workload: workload.total,
            events: workload.events,
            organizers: workload.organizers
          };
        })
      );

      // Sort by workload (ascending) - agent with lowest workload first
      agentWorkloads.sort((a, b) => a.workload - b.workload);

      // Find first agent under quota
      const availableAgent = agentWorkloads.find(agent => agent.workload < this.MAX_QUOTA_PER_AGENT);

      if (availableAgent) {
        logger.info(`✅ Assigned to ${availableAgent.fullName} (workload: ${availableAgent.workload}/${this.MAX_QUOTA_PER_AGENT})`);
        return availableAgent;
      } else {
        logger.warn('⚠️ All agents at capacity - case will be queued');
        return null;
      }
    } catch (error) {
      logger.error('❌ Error getting agent with lowest workload:', error);
      return null;
    }
  }

  // Get agent's current workload
  async getAgentWorkload(agentId, assignmentType = 'EVENT') {
    try {
      const workload = await Promise.all([
        // Count assigned events
        prisma.event.count({
          where: {
            status: 'DRAFT',
            // Simulate assignment by checking if agent should handle this event
            id: {
              in: await this.getAssignedEventIds(agentId)
            }
          }
        }),
        // Count assigned organizers
        prisma.user.count({
          where: {
            role: 'ORGANIZER',
            verificationStatus: 'PENDING',
            // Simulate assignment by checking if agent should handle this organizer
            id: {
              in: await this.getAssignedOrganizerIds(agentId)
            }
          }
        })
      ]);

      return {
        events: workload[0],
        organizers: workload[1],
        total: workload[0] + workload[1]
      };
    } catch (error) {
      logger.error('❌ Error getting agent workload:', error);
      return { events: 0, organizers: 0, total: 0 };
    }
  }

  // Get assigned event IDs for an agent (simulated assignment)
  async getAssignedEventIds(agentId) {
    try {
      const allEvents = await prisma.event.findMany({
        where: { status: 'DRAFT' },
        select: { id: true },
        orderBy: { createdAt: 'desc' }
      });

      const agents = await prisma.user.findMany({
        where: { role: 'OPS_AGENT' },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      const agentIndex = agents.findIndex(agent => agent.id === agentId);
      if (agentIndex === -1) return [];

      return allEvents
        .filter((_, index) => index % agents.length === agentIndex)
        .map(event => event.id);
    } catch (error) {
      logger.error('❌ Error getting assigned event IDs:', error);
      return [];
    }
  }

  // Get assigned organizer IDs for an agent (simulated assignment)
  async getAssignedOrganizerIds(agentId) {
    try {
      const allOrganizers = await prisma.user.findMany({
        where: { 
          role: 'ORGANIZER',
          verificationStatus: 'PENDING'
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' }
      });

      const agents = await prisma.user.findMany({
        where: { role: 'OPS_AGENT' },
        select: { id: true },
        orderBy: { createdAt: 'asc' }
      });

      const agentIndex = agents.findIndex(agent => agent.id === agentId);
      if (agentIndex === -1) return [];

      return allOrganizers
        .filter((_, index) => index % agents.length === agentIndex)
        .map(organizer => organizer.id);
    } catch (error) {
      logger.error('❌ Error getting assigned organizer IDs:', error);
      return [];
    }
  }

  // Assign case to agent with load balancing
  async assignCase(entityType, entityId, assignedBy = 'SYSTEM', reason = 'Load balancing assignment') {
    try {
      const assignmentType = entityType === 'EVENT' ? 'EVENT' : 'ORGANIZER';
      const agent = await this.getAgentWithLowestWorkload(assignmentType);

      if (!agent) {
        // All agents at capacity - log for queue management
        await this.logQueuedCase(entityType, entityId, reason);
        return { success: false, message: 'All agents at capacity - case queued' };
      }

      // Log assignment
      await prisma.activityLog.create({
        data: {
          userId: assignedBy,
          action: `ASSIGN_${entityType.toUpperCase()}`,
          ipAddress: null,
          userAgent: 'Assignment Service',
          metadata: {
            entityId: entityId,
            assignedTo: agent.id,
            assignedToName: agent.fullName,
            reason: reason,
            assignmentType: assignmentType
          }
        }
      });

      logger.info(`✅ ${entityType} ${entityId} assigned to ${agent.fullName} (${agent.email})`);
      return { 
        success: true, 
        assignedTo: agent,
        message: `Assigned to ${agent.fullName}` 
      };
    } catch (error) {
      logger.error(`❌ Failed to assign ${entityType} ${entityId}:`, error);
      return { success: false, message: 'Assignment failed' };
    }
  }

  // Log queued case
  async logQueuedCase(entityType, entityId, reason) {
    try {
      await prisma.activityLog.create({
        data: {
          userId: 'SYSTEM',
          action: `QUEUE_${entityType.toUpperCase()}`,
          ipAddress: null,
          userAgent: 'Assignment Service',
          metadata: {
            entityId: entityId,
            reason: reason,
            status: 'QUEUED'
          }
        }
      });

      logger.info(`📋 ${entityType} ${entityId} queued - all agents at capacity`);
    } catch (error) {
      logger.error(`❌ Failed to log queued case:`, error);
    }
  }

  // Get team workload summary
  async getTeamWorkloadSummary() {
    try {
      const agents = await prisma.user.findMany({
        where: { role: 'OPS_AGENT' },
        select: { id: true, fullName: true, email: true },
        orderBy: { createdAt: 'asc' }
      });

      const teamWorkload = await Promise.all(
        agents.map(async (agent) => {
          const workload = await this.getAgentWorkload(agent.id);
          return {
            ...agent,
            workload,
            capacity: this.MAX_QUOTA_PER_AGENT,
            utilization: Math.round((workload.total / this.MAX_QUOTA_PER_AGENT) * 100),
            status: workload.total >= this.MAX_QUOTA_PER_AGENT ? 'FULL' : 'AVAILABLE'
          };
        })
      );

      // Calculate team statistics
      const totalWorkload = teamWorkload.reduce((sum, agent) => sum + agent.workload.total, 0);
      const totalCapacity = agents.length * this.MAX_QUOTA_PER_AGENT;
      const teamUtilization = Math.round((totalWorkload / totalCapacity) * 100);
      const availableAgents = teamWorkload.filter(agent => agent.status === 'AVAILABLE').length;

      return {
        agents: teamWorkload,
        statistics: {
          totalWorkload,
          totalCapacity,
          teamUtilization,
          availableAgents,
          totalAgents: agents.length
        }
      };
    } catch (error) {
      logger.error('❌ Failed to get team workload summary:', error);
      return { agents: [], statistics: {} };
    }
  }

  // Process queued cases when agent becomes available
  async processQueuedCases() {
    try {
      logger.info('🔄 Processing queued cases...');
      
      // Get queued cases
      const queuedCases = await prisma.activityLog.findMany({
        where: {
          action: { in: ['QUEUE_EVENT', 'QUEUE_ORGANIZER'] },
          metadata: {
            path: ['status'],
            equals: 'QUEUED'
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      let processedCount = 0;

      for (const queuedCase of queuedCases) {
        const entityType = queuedCase.action.replace('QUEUE_', '');
        const entityId = queuedCase.metadata?.entityId;

        if (entityId) {
          const assignment = await this.assignCase(entityType, entityId, 'SYSTEM', 'Processing queued case');
          if (assignment.success) {
            // Update queued case status
            await prisma.activityLog.update({
              where: { id: queuedCase.id },
              data: {
                metadata: {
                  ...queuedCase.metadata,
                  status: 'PROCESSED',
                  processedAt: new Date().toISOString()
                }
              }
            });
            processedCount++;
          }
        }
      }

      logger.info(`✅ Processed ${processedCount} queued cases`);
      return processedCount;
    } catch (error) {
      logger.error('❌ Failed to process queued cases:', error);
      return 0;
    }
  }
}

// Create singleton instance
const assignmentService = new AssignmentService();

module.exports = assignmentService;