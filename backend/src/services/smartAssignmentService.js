const { prisma } = require('../config/database');
const logger = require('../config/logger');
const notificationService = require('./notificationService');
const analyticsService = require('./analyticsService');
const assignmentHistoryService = require('./assignmentHistoryService');

// Advanced assignment rules
const ASSIGNMENT_RULES = {
  PRIORITY_WEIGHTS: {
    URGENT: 100,
    HIGH: 75,
    NORMAL: 50,
    LOW: 25
  },
  SKILL_WEIGHTS: {
    EVENT_MANAGEMENT: 30,
    ORGANIZER_VERIFICATION: 25,
    DOCUMENT_REVIEW: 20,
    CUSTOMER_SERVICE: 15,
    TECHNICAL_SUPPORT: 10
  },
  GEOGRAPHIC_WEIGHTS: {
    SAME_REGION: 20,
    SAME_COUNTRY: 15,
    SAME_CONTINENT: 10,
    DIFFERENT_CONTINENT: 5
  },
  TIME_WEIGHTS: {
    BUSINESS_HOURS: 15,
    AFTER_HOURS: 10,
    WEEKEND: 5
  }
};

class SmartAssignmentService {
  constructor() {
    this.MAX_CAPACITY_PER_AGENT = 20;
    this.ASSIGNMENT_STRATEGY = 'WORKLOAD_BASED'; // WORKLOAD_BASED, ROUND_ROBIN, SKILL_BASED, ADVANCED
    this.BUSINESS_HOURS = { start: 9, end: 17 }; // 9 AM to 5 PM
  }

  // Get all available agents with their current workload
  async getAvailableAgents() {
    try {
      const agents = await prisma.user.findMany({
        where: { 
          role: { in: ['OPS_AGENT', 'OPS_SENIOR_AGENT'] }
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          lastActivity: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate workload for each agent
      const agentsWithWorkload = await Promise.all(
        agents.map(async (agent) => {
          const workload = await this.getAgentWorkload(agent.id);
          return {
            ...agent,
            workload: workload.total,
            capacity: this.MAX_CAPACITY_PER_AGENT,
            utilization: (workload.total / this.MAX_CAPACITY_PER_AGENT) * 100,
            isAvailable: workload.total < this.MAX_CAPACITY_PER_AGENT
          };
        })
      );

      return agentsWithWorkload;
    } catch (error) {
      logger.error('Error getting available agents:', error);
      return [];
    }
  }

  // Get workload for a specific agent
  async getAgentWorkload(agentId) {
    try {
      const [eventsCount, organizersCount] = await Promise.all([
        prisma.event.count({
          where: {
            status: 'DRAFT',
            assignedTo: agentId
          }
        }),
        prisma.user.count({
          where: {
            organizerType: { not: null },
            verificationStatus: 'PENDING',
            assignedTo: agentId
          }
        })
      ]);

      return {
        events: eventsCount,
        organizers: organizersCount,
        total: eventsCount + organizersCount
      };
    } catch (error) {
      logger.error('Error getting agent workload:', error);
      return { events: 0, organizers: 0, total: 0 };
    }
  }

  // Get detailed workload for a specific agent
  async getAgentWorkloadDetails(agentId) {
    try {
      const [events, organizers, agent] = await Promise.all([
        prisma.event.findMany({
          where: {
            status: 'DRAFT',
            assignedTo: agentId
          },
          select: {
            id: true,
            title: true,
            status: true,
            assignedAt: true,
            createdAt: true,
            eventDate: true,
            location: true,
            creator: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }),
        prisma.user.findMany({
          where: { 
            organizerType: { not: null },
            verificationStatus: 'PENDING',
            assignedTo: agentId
          },
          select: {
            id: true,
            fullName: true,
            role: true,
            verificationStatus: true,
            assignedAt: true,
            createdAt: true,
            email: true,
            phoneNumber: true,
            organizerType: true,
            businessProfile: {
              select: {
                businessName: true,
                documents: true
              }
            },
            individualProfile: {
              select: {
                documents: true
              }
            },
            communityProfile: {
              select: {
                communityName: true,
                documents: true
              }
            },
            institutionProfile: {
              select: {
                institutionName: true,
                documents: true
              }
            }
          },
          orderBy: { assignedAt: 'desc' }
        }),
        prisma.user.findUnique({
          where: { id: agentId },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            lastActivity: true
          }
        })
      ]);

      const workload = await this.getAgentWorkload(agentId);

      return {
        agent,
        workload,
        capacity: this.MAX_CAPACITY_PER_AGENT,
        utilization: (workload.total / this.MAX_CAPACITY_PER_AGENT) * 100,
        isAvailable: workload.total < this.MAX_CAPACITY_PER_AGENT,
        details: {
          events,
          organizers
        }
      };
    } catch (error) {
      logger.error('Error getting agent workload details:', error);
      throw error;
    }
  }

  // Calculate advanced assignment score for an agent
  async calculateAssignmentScore(agentId, type, itemId, priority = 'NORMAL') {
    try {
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          fullName: true,
          role: true,
          lastActivity: true,
          address: true
        }
      });

      if (!agent) return 0;

      const workload = await this.getAgentWorkload(agentId);
      const baseScore = 100 - (workload.total / this.MAX_CAPACITY_PER_AGENT) * 100;

      // Priority scoring
      const priorityScore = ASSIGNMENT_RULES.PRIORITY_WEIGHTS[priority] || 50;

      // Skill-based scoring (based on role)
      let skillScore = 0;
      if (agent.role === 'OPS_SENIOR_AGENT') {
        skillScore = ASSIGNMENT_RULES.SKILL_WEIGHTS.EVENT_MANAGEMENT + 
                    ASSIGNMENT_RULES.SKILL_WEIGHTS.ORGANIZER_VERIFICATION;
      } else if (agent.role === 'OPS_AGENT') {
        skillScore = ASSIGNMENT_RULES.SKILL_WEIGHTS.DOCUMENT_REVIEW + 
                    ASSIGNMENT_RULES.SKILL_WEIGHTS.CUSTOMER_SERVICE;
      }

      // Time-based scoring
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      
      let timeScore = 0;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
        if (hour >= this.BUSINESS_HOURS.start && hour < this.BUSINESS_HOURS.end) {
          timeScore = ASSIGNMENT_RULES.TIME_WEIGHTS.BUSINESS_HOURS;
        } else {
          timeScore = ASSIGNMENT_RULES.TIME_WEIGHTS.AFTER_HOURS;
        }
      } else { // Weekend
        timeScore = ASSIGNMENT_RULES.TIME_WEIGHTS.WEEKEND;
      }

      // Geographic scoring (simplified - can be enhanced with actual location data)
      const geographicScore = ASSIGNMENT_RULES.GEOGRAPHIC_WEIGHTS.SAME_COUNTRY;

      // Calculate final score
      const finalScore = (baseScore * 0.4) + (priorityScore * 0.3) + (skillScore * 0.2) + (timeScore * 0.05) + (geographicScore * 0.05);

      return {
        agentId: agent.id,
        agentName: agent.fullName,
        score: Math.round(finalScore),
        breakdown: {
          baseScore: Math.round(baseScore),
          priorityScore,
          skillScore,
          timeScore,
          geographicScore,
          workload: workload.total,
          capacity: this.MAX_CAPACITY_PER_AGENT
        }
      };

    } catch (error) {
      logger.error('Error calculating assignment score:', error);
      return { agentId, agentName: 'Unknown', score: 0, breakdown: {} };
    }
  }

  // Smart assignment algorithm
  async assignToBestAgent(type, itemId, priority = 'NORMAL') {
    try {
      const availableAgents = await this.getAvailableAgents();
      
      if (availableAgents.length === 0) {
        logger.warn('No available agents for assignment');
        return await this.addToQueue(type, itemId, priority);
      }

      let selectedAgent = null;

      switch (this.ASSIGNMENT_STRATEGY) {
        case 'WORKLOAD_BASED':
          selectedAgent = this.selectByWorkload(availableAgents);
          break;
        case 'ROUND_ROBIN':
          selectedAgent = this.selectByRoundRobin(availableAgents);
          break;
        case 'SKILL_BASED':
          selectedAgent = this.selectBySkill(availableAgents, type);
          break;
        case 'ADVANCED':
          selectedAgent = await this.selectByAdvancedScoring(availableAgents, type, itemId, priority);
          break;
        default:
          selectedAgent = this.selectByWorkload(availableAgents);
      }

      if (!selectedAgent) {
        logger.warn('No suitable agent found, adding to queue');
        return await this.addToQueue(type, itemId, priority);
      }

      // Perform assignment
      await this.performAssignment(type, itemId, selectedAgent.id);
      
      logger.info(`Assigned ${type} ${itemId} to agent ${selectedAgent.fullName} (${selectedAgent.id})`);
      
      return {
        success: true,
        assignedTo: selectedAgent.id,
        agentName: selectedAgent.fullName,
        workload: selectedAgent.workload + 1
      };

    } catch (error) {
      logger.error('Error in smart assignment:', error);
      return await this.addToQueue(type, itemId, priority);
    }
  }

  // Select agent by workload (lowest workload first)
  selectByWorkload(agents) {
    const availableAgents = agents.filter(agent => agent.isAvailable);
    if (availableAgents.length === 0) return null;
    
    return availableAgents.reduce((min, agent) => 
      agent.workload < min.workload ? agent : min
    );
  }

  // Select agent by round robin
  selectByRoundRobin(agents) {
    const availableAgents = agents.filter(agent => agent.isAvailable);
    if (availableAgents.length === 0) return null;
    
    // Simple round robin based on current time
    const index = Math.floor(Date.now() / 1000) % availableAgents.length;
    return availableAgents[index];
  }

  // Select agent by skill (placeholder for future implementation)
  selectBySkill(agents, type) {
    // For now, fallback to workload-based selection
    return this.selectByWorkload(agents);
  }

  // Select agent by advanced scoring algorithm
  async selectByAdvancedScoring(agents, type, itemId, priority) {
    try {
      // Calculate scores for all available agents
      const agentScores = await Promise.all(
        agents
          .filter(agent => agent.isAvailable)
          .map(agent => this.calculateAssignmentScore(agent.id, type, itemId, priority))
      );

      if (agentScores.length === 0) return null;

      // Sort by score (highest first)
      agentScores.sort((a, b) => b.score - a.score);

      // Return the best scoring agent
      const bestAgent = agentScores[0];
      const agent = agents.find(a => a.id === bestAgent.agentId);
      
      if (agent) {
        logger.info(`Advanced scoring selected agent ${bestAgent.agentName} with score ${bestAgent.score}`, bestAgent.breakdown);
        return agent;
      }

      return null;
    } catch (error) {
      logger.error('Error in selectByAdvancedScoring:', error);
      return this.selectByWorkload(agents); // Fallback to workload-based
    }
  }

  // Perform the actual assignment
  async performAssignment(type, itemId, agentId) {
    try {
      if (type === 'EVENT') {
        // Check if event exists
        const event = await prisma.event.findUnique({
          where: { id: itemId },
          select: { id: true }
        });
        
        if (!event) {
          throw new Error(`Event with ID ${itemId} not found`);
        }
        
        await prisma.event.update({
          where: { id: itemId },
          data: { 
            assignedTo: agentId,
            assignedAt: new Date()
          }
        });
      } else if (type === 'ORGANIZER') {
        // Check if user exists and has organizerType (can be PARTICIPANT with organizerType)
        const user = await prisma.user.findUnique({
          where: { id: itemId },
          select: { id: true, role: true, organizerType: true, verificationStatus: true }
        });
        
        if (!user) {
          throw new Error(`User with ID ${itemId} not found`);
        }
        
        // Allow assignment if user has organizerType and is PENDING (can be PARTICIPANT or ORGANIZER)
        if (!user.organizerType || user.verificationStatus !== 'PENDING') {
          throw new Error(`User ${itemId} is not a pending organizer request`);
        }
        
        await prisma.user.update({
          where: { id: itemId },
          data: { 
            assignedTo: agentId,
            assignedAt: new Date()
          }
        });
      }

      // Send notification
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { fullName: true }
      });

      notificationService.notifyAssignmentCreated({
        type,
        itemId,
        assignedTo: agentId,
        agentName: agent?.fullName || 'Unknown Agent',
        assignedAt: new Date()
      });

      // Log assignment creation
      await assignmentHistoryService.logAssignmentCreated(
        type,
        itemId,
        agentId,
        agentId, // Using agentId as userId for now
        {
          assignedAt: new Date(),
          strategy: this.ASSIGNMENT_STRATEGY
        }
      );

    } catch (error) {
      logger.error('Error performing assignment:', error);
      throw error;
    }
  }

  // Add item to assignment queue
  async addToQueue(type, itemId, priority = 'NORMAL') {
    try {
      const queueItem = await prisma.assignmentQueue.create({
        data: {
          type,
          itemId,
          priority,
          status: 'QUEUED',
          queuedAt: new Date()
        }
      });

      logger.info(`Added ${type} ${itemId} to assignment queue with priority ${priority}`);
      
      // Send queue notification
      notificationService.notifyQueueUpdate({
        totalQueued: 1, // This will be updated by queue status
        priority,
        type,
        itemId
      });
      
      return {
        success: true,
        queued: true,
        queueId: queueItem.id,
        message: 'Item added to queue - will be assigned when agent becomes available'
      };
    } catch (error) {
      logger.error('Error adding to queue:', error);
      return {
        success: false,
        error: 'Failed to add to queue'
      };
    }
  }

  // Process assignment queue
  async processQueue() {
    try {
      const queuedItems = await prisma.assignmentQueue.findMany({
        where: { status: 'QUEUED' },
        orderBy: [
          { priority: 'desc' },
          { queuedAt: 'asc' }
        ],
        take: 10 // Process up to 10 items at a time
      });

      if (queuedItems.length === 0) {
        return { processed: 0, message: 'No items in queue' };
      }

      let processedCount = 0;
      const availableAgents = await this.getAvailableAgents();

      for (const item of queuedItems) {
        const availableAgent = availableAgents.find(agent => agent.isAvailable);
        
        if (availableAgent) {
          try {
            await this.performAssignment(item.type, item.itemId, availableAgent.id);
            
            await prisma.assignmentQueue.update({
              where: { id: item.id },
              data: { 
                status: 'ASSIGNED',
                assignedTo: availableAgent.id,
                assignedAt: new Date()
              }
            });

            processedCount++;
            logger.info(`Processed queue item ${item.id}: ${item.type} ${item.itemId} assigned to ${availableAgent.fullName}`);
          } catch (assignmentError) {
            logger.error(`Failed to process queue item ${item.id}: ${assignmentError.message}`);
            
            // Mark item as failed
            await prisma.assignmentQueue.update({
              where: { id: item.id },
              data: { 
                status: 'FAILED',
                assignedAt: new Date()
              }
            });
            
            // Continue processing other items
            continue;
          }
        } else {
          // No available agents, stop processing
          break;
        }
      }

      return {
        processed: processedCount,
        remaining: queuedItems.length - processedCount,
        message: `Processed ${processedCount} items from queue`
      };

    } catch (error) {
      logger.error('Error processing queue:', error);
      return {
        processed: 0,
        error: 'Failed to process queue'
      };
    }
  }

  // Get queue status
  async getQueueStatus() {
    try {
      const queueStats = await prisma.assignmentQueue.groupBy({
        by: ['status', 'priority'],
        _count: true
      });

      const totalQueued = await prisma.assignmentQueue.count({
        where: { status: 'QUEUED' }
      });

      return {
        totalQueued,
        stats: queueStats,
        lastProcessed: new Date()
      };
    } catch (error) {
      logger.error('Error getting queue status:', error);
      return {
        totalQueued: 0,
        stats: [],
        error: 'Failed to get queue status'
      };
    }
  }

  // Reassign item to different agent
  async reassign(type, itemId, newAgentId, reason = 'Manual reassignment') {
    try {
      const currentAssignment = await this.getCurrentAssignment(type, itemId);
      
      if (currentAssignment) {
        // Update assignment
        await this.performAssignment(type, itemId, newAgentId);
        
        logger.info(`Reassigned ${type} ${itemId} from ${currentAssignment.assignedTo} to ${newAgentId}. Reason: ${reason}`);
        
        return {
          success: true,
          reassigned: true,
          from: currentAssignment.assignedTo,
          to: newAgentId,
          reason
        };
      } else {
        // No current assignment, just assign
        await this.performAssignment(type, itemId, newAgentId);
        
        return {
          success: true,
          assigned: true,
          to: newAgentId,
          reason
        };
      }
    } catch (error) {
      logger.error('Error reassigning:', error);
      return {
        success: false,
        error: 'Failed to reassign'
      };
    }
  }

  // Get current assignment for an item
  async getCurrentAssignment(type, itemId) {
    try {
      if (type === 'EVENT') {
        const event = await prisma.event.findUnique({
          where: { id: itemId },
          select: { assignedTo: true, assignedAt: true }
        });
        return event;
      } else if (type === 'ORGANIZER') {
        const organizer = await prisma.user.findUnique({
          where: { id: itemId },
          select: { assignedTo: true, assignedAt: true }
        });
        return organizer;
      }
      return null;
    } catch (error) {
      logger.error('Error getting current assignment:', error);
      return null;
    }
  }

  // Get assignment dashboard data
  async getAssignmentDashboard() {
    try {
      const [agents, queueStatus, recentAssignments] = await Promise.all([
        this.getAvailableAgents(),
        this.getQueueStatus(),
        this.getRecentAssignments()
      ]);

      return {
        agents,
        queueStatus,
        recentAssignments,
        totalCapacity: agents.length * this.MAX_CAPACITY_PER_AGENT,
        totalWorkload: agents.reduce((sum, agent) => sum + agent.workload, 0),
        utilizationRate: agents.length > 0 ? 
          (agents.reduce((sum, agent) => sum + agent.workload, 0) / (agents.length * this.MAX_CAPACITY_PER_AGENT)) * 100 : 0
      };
    } catch (error) {
      logger.error('Error getting assignment dashboard:', error);
      return {
        agents: [],
        queueStatus: { totalQueued: 0 },
        recentAssignments: [],
        totalCapacity: 0,
        totalWorkload: 0,
        utilizationRate: 0
      };
    }
  }

  // Get agent-specific assignment dashboard data
  async getAgentAssignmentDashboard(agentId) {
    try {
      // Get agent's own workload and assignments
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get agent's assigned organizer requests (can be PARTICIPANT or ORGANIZER)
      const assignedOrganizers = await prisma.user.findMany({
        where: { 
          organizerType: { not: null },
          assignedTo: agentId
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          organizerType: true,
          verificationStatus: true,
          assignedAt: true,
          createdAt: true
        },
        orderBy: { assignedAt: 'desc' }
      });

      // Get agent's recent assignments (events and organizers)
      const recentEvents = await prisma.event.findMany({
        where: { assignedTo: agentId },
        select: {
          id: true,
          title: true,
          assignedTo: true,
          assignedAt: true,
          status: true,
          createdBy: true,
          creator: {
            select: { fullName: true }
          }
        },
        orderBy: { assignedAt: 'desc' },
        take: 5
      });

      const recentOrganizers = await prisma.user.findMany({
        where: { 
          role: 'ORGANIZER',
          assignedTo: agentId
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          verificationStatus: true,
          rejectedReason: true,
          assignedTo: true,
          assignedAt: true,
          createdAt: true
        },
        orderBy: { assignedAt: 'desc' },
        take: 5
      });

      // Calculate agent's workload
      const currentWorkload = assignedOrganizers.filter(org => org.verificationStatus === 'PENDING').length;
      const capacity = this.MAX_CAPACITY_PER_AGENT;
      const utilization = capacity > 0 ? (currentWorkload / capacity) * 100 : 0;

      return {
        agents: [{
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          role: agent.role,
          workload: currentWorkload,
          capacity: capacity,
          utilization: utilization,
          isAvailable: currentWorkload < capacity
        }],
        queueStatus: {
          totalQueued: assignedOrganizers.filter(org => org.verificationStatus === 'PENDING').length,
          stats: [
            {
              status: 'PENDING',
              priority: 'NORMAL',
              _count: assignedOrganizers.filter(org => org.verificationStatus === 'PENDING').length
            }
          ]
        },
        recentAssignments: {
          events: recentEvents.map(event => ({
            id: event.id,
            title: event.title,
            assignedTo: event.assignedTo,
            assignedBy: event.createdBy,
            assignedAt: event.assignedAt,
            status: event.status,
            assignerName: event.creator?.fullName || 'System'
          })),
          organizers: recentOrganizers.map(org => ({
            id: org.id,
            fullName: org.fullName,
            email: org.email,
            assignedTo: org.assignedTo,
            assignedBy: 'System', // We don't track who assigned organizers
            assignedAt: org.assignedAt,
            status: org.verificationStatus,
            rejectedReason: org.rejectedReason,
            assignerName: 'System'
          }))
        },
        totalCapacity: capacity,
        totalWorkload: currentWorkload,
        utilizationRate: utilization
      };
    } catch (error) {
      logger.error('Error getting agent assignment dashboard:', error);
      return {
        agents: [],
        queueStatus: { totalQueued: 0, stats: [] },
        recentAssignments: { events: [], organizers: [] },
        totalCapacity: 0,
        totalWorkload: 0,
        utilizationRate: 0
      };
    }
  }

  // Get recent assignments
  async getRecentAssignments(limit = 10) {
    try {
      // Events are now free and don't need operations approval
      // Only fetch organizers that need verification
      const recentOrganizers = await prisma.user.findMany({
        where: { 
          role: 'ORGANIZER',
          assignedTo: { not: null }
        },
        select: {
          id: true,
          fullName: true,
          businessName: true,
          assignedTo: true,
          assignedBy: true,
          assignedAt: true,
          verificationStatus: true,
          assigner: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' },
        take: limit
      });

      return {
        events: [], // Events are now free, no operations assignment needed
        organizers: recentOrganizers
      };
    } catch (error) {
      logger.error('Error getting recent assignments:', error);
      return { events: [], organizers: [] };
    }
  }

  // Get current assignment strategy
  async getAssignmentStrategy() {
    return {
      currentStrategy: this.ASSIGNMENT_STRATEGY,
      availableStrategies: ['WORKLOAD_BASED', 'ROUND_ROBIN', 'SKILL_BASED', 'ADVANCED'],
      maxCapacity: this.MAX_CAPACITY_PER_AGENT,
      businessHours: this.BUSINESS_HOURS,
      rules: ASSIGNMENT_RULES
    };
  }

  // Set assignment strategy
  async setAssignmentStrategy(strategy) {
    const validStrategies = ['WORKLOAD_BASED', 'ROUND_ROBIN', 'SKILL_BASED', 'ADVANCED'];
    
    if (!validStrategies.includes(strategy)) {
      throw new Error(`Invalid strategy. Must be one of: ${validStrategies.join(', ')}`);
    }

    this.ASSIGNMENT_STRATEGY = strategy;
    
    logger.info(`Assignment strategy changed to: ${strategy}`);
    
    return {
      success: true,
      message: `Assignment strategy updated to ${strategy}`,
      strategy: this.ASSIGNMENT_STRATEGY
    };
  }

  // Test assignment scoring for all agents
  async testAssignmentScoring(type, itemId, priority = 'NORMAL') {
    try {
      const agents = await this.getAvailableAgents();
      
      const scores = await Promise.all(
        agents.map(agent => this.calculateAssignmentScore(agent.id, type, itemId, priority))
      );

      // Sort by score (highest first)
      scores.sort((a, b) => b.score - a.score);

      return {
        type,
        itemId,
        priority,
        strategy: this.ASSIGNMENT_STRATEGY,
        agentScores: scores,
        recommendedAgent: scores[0] || null
      };
    } catch (error) {
      logger.error('Error testing assignment scoring:', error);
      throw error;
    }
  }

  // Smart reassignment system
  async reassign(type, itemId, newAgentId, reason = 'Manual reassignment') {
    try {
      // Get current assignment
      const currentAssignment = await this.getCurrentAssignment(type, itemId);
      if (!currentAssignment) {
        throw new Error(`${type} ${itemId} is not currently assigned`);
      }

      const oldAgentId = currentAssignment.assignedTo;
      
      // Check if new agent has capacity
      const newAgentWorkload = await this.getAgentWorkload(newAgentId);
      if (newAgentWorkload.total >= this.MAX_CAPACITY_PER_AGENT) {
        throw new Error(`Agent ${newAgentId} is at capacity`);
      }

      // Perform reassignment
      await this.performAssignment(type, itemId, newAgentId);

      // Log reassignment
      await assignmentHistoryService.logReassignment(
        type,
        itemId,
        oldAgentId,
        newAgentId,
        newAgentId, // Using newAgentId as userId for now
        reason,
        {
          reassignedAt: new Date(),
          strategy: this.ASSIGNMENT_STRATEGY
        }
      );

      // Send notification
      const newAgent = await prisma.user.findUnique({
        where: { id: newAgentId },
        select: { fullName: true }
      });

      notificationService.notifyAssignmentUpdated({
        type,
        itemId,
        assignedTo: newAgentId,
        agentName: newAgent?.fullName || 'Unknown Agent',
        reassignedAt: new Date(),
        reason
      });

      logger.info(`Reassigned ${type} ${itemId} from ${oldAgentId} to ${newAgentId}: ${reason}`);

      return {
        success: true,
        reassigned: true,
        oldAgentId,
        newAgentId,
        reason,
        reassignedAt: new Date()
      };

    } catch (error) {
      logger.error('Error in reassignment:', error);
      throw error;
    }
  }

  // Auto-reassignment based on load balancing
  async autoReassignForLoadBalancing() {
    try {
      const agents = await this.getAvailableAgents();
      const overloadedAgents = agents.filter(agent => agent.workload >= this.MAX_CAPACITY_PER_AGENT);
      
      if (overloadedAgents.length === 0) {
        return { reassigned: 0, message: 'No overloaded agents found' };
      }

      let reassignedCount = 0;
      
      for (const overloadedAgent of overloadedAgents) {
        // Get assignments that can be reassigned
        const reassignableAssignments = await this.getReassignableAssignments(overloadedAgent.id);
        
        for (const assignment of reassignableAssignments) {
          // Find best alternative agent
          const alternativeAgent = await this.findBestAlternativeAgent(
            assignment.type, 
            assignment.itemId, 
            overloadedAgent.id
          );
          
          if (alternativeAgent) {
            await this.reassign(
              assignment.type, 
              assignment.itemId, 
              alternativeAgent.id, 
              'Auto-reassignment for load balancing'
            );
            reassignedCount++;
          }
        }
      }

      return {
        reassigned: reassignedCount,
        message: `Auto-reassigned ${reassignedCount} items for load balancing`
      };

    } catch (error) {
      logger.error('Error in auto-reassignment:', error);
      throw error;
    }
  }

  // Performance-based reassignment
  async reassignForPerformance() {
    try {
      const agents = await this.getAvailableAgents();
      
      // Get performance metrics for all agents
      const performanceData = await Promise.all(
        agents.map(async (agent) => {
          const metrics = await analyticsService.getAgentPerformanceMetrics(agent.id, '7d');
          return {
            ...agent,
            performance: metrics.performance
          };
        })
      );

      // Sort by performance (lowest first)
      performanceData.sort((a, b) => a.performance.qualityScore - b.performance.qualityScore);

      const underperformingAgents = performanceData.filter(
        agent => agent.performance.qualityScore < 50 && agent.workload > 0
      );

      let reassignedCount = 0;

      for (const underperformingAgent of underperformingAgents) {
        const reassignableAssignments = await this.getReassignableAssignments(underperformingAgent.id);
        
        for (const assignment of reassignableAssignments.slice(0, 2)) { // Limit to 2 reassignments per agent
          const bestAgent = performanceData.find(
            agent => agent.id !== underperformingAgent.id && 
            agent.performance.qualityScore > underperformingAgent.performance.qualityScore &&
            agent.workload < this.MAX_CAPACITY_PER_AGENT
          );
          
          if (bestAgent) {
            await this.reassign(
              assignment.type,
              assignment.itemId,
              bestAgent.id,
              'Performance-based reassignment'
            );
            reassignedCount++;
          }
        }
      }

      return {
        reassigned: reassignedCount,
        message: `Performance-based reassignment completed: ${reassignedCount} items reassigned`
      };

    } catch (error) {
      logger.error('Error in performance-based reassignment:', error);
      throw error;
    }
  }

  // Get current assignment
  async getCurrentAssignment(type, itemId) {
    try {
      if (type === 'EVENT') {
        const event = await prisma.event.findUnique({
          where: { id: itemId },
          select: { assignedTo: true, assignedAt: true }
        });
        return event?.assignedTo ? { assignedTo: event.assignedTo, assignedAt: event.assignedAt } : null;
      } else if (type === 'ORGANIZER') {
        const organizer = await prisma.user.findUnique({
          where: { id: itemId },
          select: { assignedTo: true, assignedAt: true }
        });
        return organizer?.assignedTo ? { assignedTo: organizer.assignedTo, assignedAt: organizer.assignedAt } : null;
      }
      return null;
    } catch (error) {
      logger.error('Error getting current assignment:', error);
      return null;
    }
  }

  // Get reassignable assignments for an agent
  async getReassignableAssignments(agentId) {
    try {
      const eventAssignments = await prisma.event.findMany({
        where: {
          assignedTo: agentId,
          status: 'DRAFT' // Only reassign draft events
        },
        select: {
          id: true,
          title: true,
          assignedAt: true
        }
      });

      const organizerAssignments = await prisma.user.findMany({
        where: {
          assignedTo: agentId,
          organizerType: { not: null },
          verificationStatus: 'PENDING' // Only reassign pending organizer requests
        },
        select: {
          id: true,
          fullName: true,
          assignedAt: true
        }
      });

      return [
        ...eventAssignments.map(a => ({ type: 'EVENT', itemId: a.id, title: a.title, assignedAt: a.assignedAt })),
        ...organizerAssignments.map(a => ({ type: 'ORGANIZER', itemId: a.id, title: a.fullName, assignedAt: a.assignedAt }))
      ];
    } catch (error) {
      logger.error('Error getting reassignable assignments:', error);
      return [];
    }
  }

  // Find best alternative agent
  async findBestAlternativeAgent(type, itemId, excludeAgentId) {
    try {
      const agents = await this.getAvailableAgents();
      const availableAgents = agents.filter(agent => 
        agent.id !== excludeAgentId && agent.workload < this.MAX_CAPACITY_PER_AGENT
      );

      if (availableAgents.length === 0) return null;

      // Calculate scores for available agents
      const agentScores = await Promise.all(
        availableAgents.map(agent => this.calculateAssignmentScore(agent.id, type, itemId, 'NORMAL'))
      );

      // Sort by score and return best agent
      agentScores.sort((a, b) => b.score - a.score);
      return agentScores[0]?.agentId || null;

    } catch (error) {
      logger.error('Error finding best alternative agent:', error);
      return null;
    }
  }


  // Log reassignment activity
  async logReassignment(reassignmentData) {
    try {
      // Store in assignment history (we'll implement this in Phase 2.5)
      logger.info('Reassignment logged:', reassignmentData);
      return true;
    } catch (error) {
      logger.error('Error logging reassignment:', error);
      return false;
    }
  }

  // Get reassignment history
  async getReassignmentHistory(agentId = null, limit = 50) {
    try {
      // This will be implemented in Phase 2.5 with proper audit trail
      return {
        reassignments: [],
        total: 0,
        message: 'Reassignment history will be available in Phase 2.5'
      };
    } catch (error) {
      logger.error('Error getting reassignment history:', error);
      return { reassignments: [], total: 0, error: error.message };
    }
  }
}

module.exports = new SmartAssignmentService();
