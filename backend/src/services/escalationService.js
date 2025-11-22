const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Auto escalation service based on SLA
class EscalationService {
  constructor() {
    this.SLA_RULES = {
      AGENT_TO_HEAD: 24 * 60 * 60 * 1000, // 24 hours in milliseconds (simplified workflow)
    };
  }

  // Check for cases that need auto escalation
  async checkAutoEscalation() {
    try {
      logger.info('🔍 Checking for auto escalation cases...');
      
      const now = new Date();
      
      // Check events that need escalation
      await this.checkEventEscalation(now);
      
      // Check organizers that need escalation
      await this.checkOrganizerEscalation(now);
      
      logger.info('✅ Auto escalation check completed');
    } catch (error) {
      logger.error('❌ Auto escalation check failed:', error);
    }
  }

  // Check events for auto escalation
  async checkEventEscalation(now) {
    // Find events that have been in DRAFT status for too long
    const staleEvents = await prisma.event.findMany({
      where: {
        status: 'DRAFT',
        createdAt: {
          lt: new Date(now.getTime() - this.SLA_RULES.AGENT_TO_HEAD)
        }
      },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    for (const event of staleEvents) {
      await this.escalateEvent(event.id, 'HEAD', 'Auto escalation: Event pending for more than 24 hours');
      logger.info(`🚨 Auto escalated event: ${event.title}`);
    }
  }

  // Check organizers for auto escalation
  async checkOrganizerEscalation(now) {
    // Find organizers that have been PENDING for too long
    const staleOrganizers = await prisma.user.findMany({
      where: {
        role: 'ORGANIZER',
        verificationStatus: 'PENDING',
        createdAt: {
          lt: new Date(now.getTime() - this.SLA_RULES.AGENT_TO_HEAD)
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true
      }
    });

    for (const organizer of staleOrganizers) {
      await this.escalateOrganizer(organizer.id, 'HEAD', 'Auto escalation: Organizer verification pending for more than 24 hours');
      logger.info(`🚨 Auto escalated organizer: ${organizer.fullName}`);
    }
  }

  // Escalate event to higher level
  async escalateEvent(eventId, targetRole, reason) {
    try {
      // Create escalation record
      await prisma.escalation.create({
        data: {
          entityType: 'EVENT',
          entityId: eventId,
          escalatedBy: 'SYSTEM', // System auto escalation
          escalatedTo: targetRole,
          reason: reason,
          status: 'PENDING'
        }
      });

      // Log escalation in activity logs
      await prisma.activityLog.create({
        data: {
          userId: 'SYSTEM',
          action: `AUTO_ESCALATE_EVENT_${targetRole}`,
          ipAddress: null,
          userAgent: 'System Auto Escalation'
        }
      });

      logger.info(`✅ Event ${eventId} escalated to ${targetRole}: ${reason}`);
    } catch (error) {
      logger.error(`❌ Failed to escalate event ${eventId}:`, error);
    }
  }

  // Escalate organizer to higher level
  async escalateOrganizer(organizerId, targetRole, reason) {
    try {
      // Create escalation record
      await prisma.escalation.create({
        data: {
          entityType: 'ORGANIZER',
          entityId: organizerId,
          escalatedBy: 'SYSTEM', // System auto escalation
          escalatedTo: targetRole,
          reason: reason,
          status: 'PENDING'
        }
      });

      // Log escalation in activity logs
      await prisma.activityLog.create({
        data: {
          userId: 'SYSTEM',
          action: `AUTO_ESCALATE_ORGANIZER_${targetRole}`,
          ipAddress: null,
          userAgent: 'System Auto Escalation'
        }
      });

      logger.info(`✅ Organizer ${organizerId} escalated to ${targetRole}: ${reason}`);
    } catch (error) {
      logger.error(`❌ Failed to escalate organizer ${organizerId}:`, error);
    }
  }

  // Get escalation history for an entity
  async getEscalationHistory(entityType, entityId) {
    try {
      const escalations = await prisma.escalation.findMany({
        where: {
          entityType: entityType,
          entityId: entityId
        },
        include: {
          escalator: {
            select: { fullName: true, email: true }
          },
          resolver: {
            select: { fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return escalations;
    } catch (error) {
      logger.error('❌ Failed to get escalation history:', error);
      return [];
    }
  }

  // Resolve escalation
  async resolveEscalation(escalationId, resolvedBy, resolution) {
    try {
      await prisma.escalation.update({
        where: { id: escalationId },
        data: {
          status: 'RESOLVED',
          resolvedBy: resolvedBy,
          resolvedAt: new Date(),
          resolution: resolution
        }
      });

      logger.info(`✅ Escalation ${escalationId} resolved by ${resolvedBy}`);
    } catch (error) {
      logger.error(`❌ Failed to resolve escalation ${escalationId}:`, error);
    }
  }
}

// Create singleton instance
const escalationService = new EscalationService();

module.exports = escalationService;
