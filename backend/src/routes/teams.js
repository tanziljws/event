const express = require('express');
const { authenticate, requireSuperAdmin } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Get team configurations from database
const getTeamConfigurations = async () => {
  try {
    const configs = await prisma.$queryRaw`
      SELECT team_id, team_name, description, categories, is_active
      FROM team_configurations 
      WHERE is_active = true
      ORDER BY created_at ASC
    `;
    
    const teamConfigs = {};
    configs.forEach(config => {
      teamConfigs[config.team_id] = {
        name: config.team_name,
        description: config.description,
        categories: config.categories || [],
        isActive: config.is_active
      };
    });
    
    return teamConfigs;
  } catch (error) {
    logger.error('Error fetching team configurations:', error);
    return {};
  }
};

// Get all teams
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const teamConfigs = await getTeamConfigurations();
    const teams = Object.entries(teamConfigs).map(([key, team]) => ({
      id: key,
      name: team.name,
      description: team.description,
      categories: team.categories,
      memberCount: 0, // Will be calculated
      activeTickets: 0 // Will be calculated
    }));

    // Get member counts for each team
    for (let team of teams) {
      const members = await prisma.user.findMany({
        where: {
          department: 'CUSTOMER_SERVICE',
          role: {
            in: ['CS_HEAD', 'CS_AGENT']
          }
        }
      });

      // Simple assignment based on user name patterns (for demo)
      team.memberCount = members.length;
      
      // Get active tickets for this team's categories (simplified for now)
      team.activeTickets = 0; // Will implement later
    }

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    logger.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
});

// Get team members
router.get('/:teamId/members', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const teamConfigs = await getTeamConfigurations();
    if (!teamConfigs[teamId]) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const members = await prisma.user.findMany({
      where: {
        department: 'CUSTOMER_SERVICE',
        role: {
          in: ['CS_HEAD', 'CS_AGENT']
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userPosition: true,
        lastActivity: true
      }
    });

    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    logger.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team members',
      error: error.message
    });
  }
});

// Smart auto-assignment for new tickets
router.post('/auto-assign', authenticate, async (req, res) => {
  try {
    const { ticketId, category } = req.body;

    if (!ticketId || !category) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and category are required'
      });
    }

    // Get team configurations from database
    const teamConfigs = await getTeamConfigurations();
    
    // Find the appropriate team for this category
    let assignedTeam = null;
    for (const [teamId, team] of Object.entries(teamConfigs)) {
      if (team.categories.includes(category)) {
        assignedTeam = { id: teamId, ...team };
        break;
      }
    }

    if (!assignedTeam) {
      // Default to general support if no specific team found
      assignedTeam = { id: 'GENERAL_SUPPORT', ...teamConfigs['GENERAL_SUPPORT'] };
    }

    // Get available members for this team
    const availableMembers = await prisma.user.findMany({
      where: {
        department: 'CUSTOMER_SERVICE',
        role: {
          in: ['CS_HEAD', 'CS_AGENT']
        }
      },
      select: {
        id: true,
        fullName: true,
        role: true
      }
    });

    // Simple round-robin assignment (in real implementation, use workload balancing)
    const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];

    // Update ticket assignment
    const updatedTicket = await prisma.departmentTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: randomMember.id,
        updatedAt: new Date()
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

    logger.info(`Ticket ${ticketId} auto-assigned to team ${assignedTeam.name} and member ${randomMember.fullName}`);

    res.json({
      success: true,
      data: {
        ticket: updatedTicket,
        assignedTeam: assignedTeam,
        assignedMember: randomMember,
        isAutoAssigned: true
      }
    });
  } catch (error) {
    logger.error('Auto-assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign ticket',
      error: error.message
    });
  }
});

// Get team performance analytics
router.get('/:teamId/analytics', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { timeRange = '30d' } = req.query;

    const teamConfigs = await getTeamConfigurations();
    if (!teamConfigs[teamId]) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const team = teamConfigs[teamId];
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get team tickets (simplified for now)
    const tickets = await prisma.departmentTicket.findMany({
      where: {
        department: 'CUSTOMER_SERVICE',
        createdAt: {
          gte: startDate
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

    // Calculate metrics
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
    const openTickets = tickets.filter(t => t.status === 'OPEN').length;
    const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length;
    
    const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets * 100) : 0;

    // Priority breakdown
    const priorityBreakdown = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    // Member performance
    const memberPerformance = tickets.reduce((acc, ticket) => {
      if (ticket.assignee) {
        const memberId = ticket.assignee.id;
        if (!acc[memberId]) {
          acc[memberId] = {
            id: ticket.assignee.id,
            name: ticket.assignee.fullName,
            role: ticket.assignee.role,
            totalTickets: 0,
            resolvedTickets: 0
          };
        }
        acc[memberId].totalTickets++;
        if (ticket.status === 'RESOLVED') {
          acc[memberId].resolvedTickets++;
        }
      }
      return acc;
    }, {});

    const memberPerformanceArray = Object.values(memberPerformance).map(member => ({
      ...member,
      resolutionRate: member.totalTickets > 0 ? (member.resolvedTickets / member.totalTickets * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        team: {
          id: teamId,
          name: team.name,
          description: team.description,
          categories: team.categories
        },
        metrics: {
          totalTickets,
          resolvedTickets,
          openTickets,
          inProgressTickets,
          resolutionRate: Math.round(resolutionRate * 100) / 100
        },
        priorityBreakdown,
        memberPerformance: memberPerformanceArray
      }
    });
  } catch (error) {
    logger.error('Team analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team analytics',
      error: error.message
    });
  }
});

// Add member to team
router.post('/:teamId/members', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId, role = 'MEMBER' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if team exists
    const teamConfigs = await getTeamConfigurations();
    if (!teamConfigs[teamId]) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a member of this team
    const existingMembership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }

    // Add user to team
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: teamId,
        userId: userId,
        role: role,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            userPosition: true,
            lastActivity: true
          }
        }
      }
    });

    logger.info(`User ${user.fullName} added to team ${teamId}`);

    res.json({
      success: true,
      message: 'Member added successfully',
      data: {
        id: teamMember.id,
        teamId: teamMember.teamId,
        userId: teamMember.userId,
        role: teamMember.role,
        isActive: teamMember.isActive,
        joinedAt: teamMember.joinedAt,
        user: teamMember.user
      }
    });
  } catch (error) {
    logger.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add team member',
      error: error.message
    });
  }
});

// Remove member from team
router.delete('/:teamId/members/:userId', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    // Check if membership exists
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId
        }
      }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Team membership not found'
      });
    }

    // Remove membership
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId
        }
      }
    });

    logger.info(`User ${userId} removed from team ${teamId}`);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    logger.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove team member',
      error: error.message
    });
  }
});

// Get available users for team assignment
router.get('/available-users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['CS_HEAD', 'CS_AGENT', 'OPS_HEAD', 'OPS_AGENT', 'FINANCE_HEAD', 'FINANCE_AGENT']
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userPosition: true,
        department: true
      },
      orderBy: [
        { department: 'asc' },
        { userPosition: 'asc' },
        { fullName: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available users',
      error: error.message
    });
  }
});

// Get team configurations
router.get('/configurations', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const configs = await prisma.$queryRaw`
      SELECT id, team_id, team_name, description, categories, is_active, created_at, updated_at
      FROM team_configurations 
      WHERE is_active = true
      ORDER BY created_at ASC
    `;

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    logger.error('Get team configurations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team configurations',
      error: error.message
    });
  }
});

// Create team configuration
router.post('/configurations', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    console.log('🔍 Body Parser Check:');
    console.log('  Content-Type:', req.get('Content-Type'));
    console.log('  Body exists:', !!req.body);
    console.log('  Body keys:', Object.keys(req.body || {}));
    console.log('  Body content:', req.body);
    
    const { teamId, teamName, description, categories } = req.body;

    // Handle categories array - convert object to array if needed
    let categoriesArray = categories;
    
    if (categories && typeof categories === 'object' && !Array.isArray(categories)) {
      categoriesArray = Object.values(categories);
    } else if (categories && typeof categories === 'string') {
      categoriesArray = categories.split(',').map(cat => cat.trim());
    }

    if (!teamId || !teamName || !categoriesArray || !Array.isArray(categoriesArray)) {
      return res.status(400).json({
        success: false,
        message: 'Team ID, name, and categories array are required',
        debug: {
          teamId: !!teamId,
          teamName: !!teamName,
          categories: categoriesArray,
          isArray: Array.isArray(categoriesArray),
          originalCategories: categories
        }
      });
    }

    // Check if team configuration already exists
    const existing = await prisma.$queryRaw`
      SELECT id FROM team_configurations WHERE team_id = ${teamId}
    `;

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Team configuration already exists'
      });
    }

    const config = await prisma.$queryRaw`
      INSERT INTO team_configurations (team_id, team_name, description, categories, is_active, created_at, updated_at)
      VALUES (${teamId}, ${teamName}, ${description || null}, ${categoriesArray}, true, NOW(), NOW())
      RETURNING id, team_id, team_name, description, categories, is_active, created_at, updated_at
    `;

    logger.info(`Team configuration created: ${teamId}`);

    res.status(201).json({
      success: true,
      message: 'Team configuration created successfully',
      data: config[0]
    });
  } catch (error) {
    logger.error('Create team configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team configuration',
      error: error.message
    });
  }
});

// Update team configuration
router.put('/configurations/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, description, categories, isActive } = req.body;

    const updatedConfig = await prisma.$queryRaw`
      UPDATE team_configurations 
      SET team_name = ${teamName}, 
          description = ${description || null}, 
          categories = ${categories}, 
          is_active = ${isActive !== undefined ? isActive : true},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, team_id, team_name, description, categories, is_active, created_at, updated_at
    `;

    if (updatedConfig.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team configuration not found'
      });
    }

    logger.info(`Team configuration updated: ${id}`);

    res.json({
      success: true,
      message: 'Team configuration updated successfully',
      data: updatedConfig[0]
    });
  } catch (error) {
    logger.error('Update team configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team configuration',
      error: error.message
    });
  }
});

// Delete team configuration
router.delete('/configurations/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedConfig = await prisma.$queryRaw`
      UPDATE team_configurations 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, team_id, team_name
    `;

    if (deletedConfig.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team configuration not found'
      });
    }

    logger.info(`Team configuration deleted: ${id}`);

    res.json({
      success: true,
      message: 'Team configuration deleted successfully'
    });
  } catch (error) {
    logger.error('Delete team configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team configuration',
      error: error.message
    });
  }
});

module.exports = router;
