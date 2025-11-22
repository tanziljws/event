const { prisma } = require('../config/database');
const logger = require('../config/logger');

class DepartmentService {
  // Create new department member
  async createMember(memberData) {
    try {
      const {
        fullName,
        email,
        phoneNumber,
        role,
        department,
        position,
        managerId,
        employeeId,
        password
      } = memberData;

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      // Check if employee ID already exists
      if (employeeId) {
        const existingEmployee = await prisma.user.findUnique({
          where: { employeeId }
        });

        if (existingEmployee) {
          throw new Error('Employee ID already exists');
        }
      }

      const member = await prisma.user.create({
        data: {
          fullName,
          email,
          phoneNumber,
          password,
          role,
          department,
          position,
          managerId,
          employeeId,
          emailVerified: true // Auto-verify department members
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          department: true,
          position: true,
          managerId: true,
          employeeId: true,
          createdAt: true
        }
      });

      logger.info(`Department member created: ${email} in ${department}`);
      return member;

    } catch (error) {
      logger.error('Create department member error:', error);
      throw error;
    }
  }

  // Get department hierarchy
  async getDepartmentHierarchy(department) {
    try {
      const members = await prisma.user.findMany({
        where: { department },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          position: true,
          managerId: true,
          employeeId: true,
          createdAt: true,
          lastActivity: true,
          manager: {
            select: {
              id: true,
              fullName: true,
              role: true
            }
          },
          subordinates: {
            select: {
              id: true,
              fullName: true,
              role: true,
              position: true
            }
          }
        },
        orderBy: [
          { position: 'asc' },
          { fullName: 'asc' }
        ]
      });

      return members;

    } catch (error) {
      logger.error('Get department hierarchy error:', error);
      throw error;
    }
  }

  // Get department statistics
  async getDepartmentStats(department) {
    try {
      const [
        totalMembers,
        activeMembers,
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        overdueTickets
      ] = await Promise.all([
        prisma.user.count({
          where: { department }
        }),
        prisma.user.count({
          where: { 
            department,
            lastActivity: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        }),
        prisma.departmentTicket.count({
          where: { department }
        }),
        prisma.departmentTicket.count({
          where: { 
            department,
            status: 'OPEN'
          }
        }),
        prisma.departmentTicket.count({
          where: { 
            department,
            status: 'IN_PROGRESS'
          }
        }),
        prisma.departmentTicket.count({
          where: { 
            department,
            status: 'RESOLVED'
          }
        }),
        prisma.departmentTicket.count({
          where: { 
            department,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            dueDate: { lt: new Date() }
          }
        })
      ]);

      return {
        totalMembers,
        activeMembers,
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        overdueTickets,
        completionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
        overdueRate: totalTickets > 0 ? Math.round((overdueTickets / totalTickets) * 100) : 0
      };

    } catch (error) {
      logger.error('Get department stats error:', error);
      throw error;
    }
  }

  // Get department performance metrics
  async getDepartmentPerformance(department, startDate, endDate) {
    try {
      const tickets = await prisma.departmentTicket.findMany({
        where: {
          department,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          assignee: {
            select: {
              id: true,
              fullName: true,
              role: true
            }
          }
        }
      });

      // Calculate performance metrics
      const performance = {
        totalTickets: tickets.length,
        resolvedTickets: tickets.filter(t => t.status === 'RESOLVED').length,
        averageResolutionTime: 0,
        agentPerformance: {},
        priorityDistribution: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          URGENT: 0
        },
        statusDistribution: {
          OPEN: 0,
          IN_PROGRESS: 0,
          PENDING_REVIEW: 0,
          RESOLVED: 0,
          CLOSED: 0,
          CANCELLED: 0
        }
      };

      // Calculate average resolution time
      const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' && t.completedAt);
      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
          const resolutionTime = new Date(ticket.completedAt) - new Date(ticket.createdAt);
          return sum + resolutionTime;
        }, 0);
        performance.averageResolutionTime = Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60)); // Hours
      }

      // Calculate agent performance
      const agentStats = {};
      tickets.forEach(ticket => {
        if (ticket.assignee) {
          const agentId = ticket.assignee.id;
          if (!agentStats[agentId]) {
            agentStats[agentId] = {
              name: ticket.assignee.fullName,
              role: ticket.assignee.role,
              totalTickets: 0,
              resolvedTickets: 0
            };
          }
          agentStats[agentId].totalTickets++;
          if (ticket.status === 'RESOLVED') {
            agentStats[agentId].resolvedTickets++;
          }
        }
      });

      // Calculate resolution rates for each agent
      Object.keys(agentStats).forEach(agentId => {
        const agent = agentStats[agentId];
        agent.resolutionRate = agent.totalTickets > 0 ? 
          Math.round((agent.resolvedTickets / agent.totalTickets) * 100) : 0;
      });

      performance.agentPerformance = agentStats;

      // Calculate priority and status distribution
      tickets.forEach(ticket => {
        performance.priorityDistribution[ticket.priority]++;
        performance.statusDistribution[ticket.status]++;
      });

      return performance;

    } catch (error) {
      logger.error('Get department performance error:', error);
      throw error;
    }
  }

  // Assign ticket to agent
  async assignTicket(ticketId, assigneeId, assignedBy) {
    try {
      const ticket = await prisma.departmentTicket.update({
        where: { id: ticketId },
        data: {
          assignedTo: assigneeId,
          status: 'IN_PROGRESS'
        },
        include: {
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      });

      // Add comment about assignment
      await prisma.ticketComment.create({
        data: {
          ticketId,
          userId: assignedBy,
          content: `Ticket assigned to ${ticket.assignee.fullName}`,
          isInternal: true
        }
      });

      logger.info(`Ticket ${ticketId} assigned to ${assigneeId} by ${assignedBy}`);
      return ticket;

    } catch (error) {
      logger.error('Assign ticket error:', error);
      throw error;
    }
  }

  // Get team workload
  async getTeamWorkload(department) {
    try {
      const agents = await prisma.user.findMany({
        where: {
          department,
          role: { in: ['CS_AGENT', 'OPS_AGENT', 'FINANCE_AGENT', 'CS_SENIOR_AGENT', 'OPS_SENIOR_AGENT', 'FINANCE_SENIOR_AGENT'] }
        },
        select: {
          id: true,
          fullName: true,
          role: true,
          position: true
        }
      });

      const workload = await Promise.all(
        agents.map(async (agent) => {
          const [
            openTickets,
            inProgressTickets,
            overdueTickets,
            completedThisWeek
          ] = await Promise.all([
            prisma.departmentTicket.count({
              where: {
                assignedTo: agent.id,
                status: 'OPEN'
              }
            }),
            prisma.departmentTicket.count({
              where: {
                assignedTo: agent.id,
                status: 'IN_PROGRESS'
              }
            }),
            prisma.departmentTicket.count({
              where: {
                assignedTo: agent.id,
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                dueDate: { lt: new Date() }
              }
            }),
            prisma.departmentTicket.count({
              where: {
                assignedTo: agent.id,
                status: 'RESOLVED',
                completedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            })
          ]);

          return {
            ...agent,
            openTickets,
            inProgressTickets,
            overdueTickets,
            completedThisWeek,
            totalActiveTickets: openTickets + inProgressTickets
          };
        })
      );

      return workload;

    } catch (error) {
      logger.error('Get team workload error:', error);
      throw error;
    }
  }
}

module.exports = new DepartmentService();
