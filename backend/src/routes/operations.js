const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const smartAssignmentService = require('../services/smartAssignmentService');

const router = express.Router();

// Get Operations dashboard - accessible by all Operations roles
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Check if user is Operations role
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Operations role required'
      });
    }

    // Get Operations-specific metrics based on user role
    let metricsQuery, teamMembersQuery, assignmentDataQuery;
    
    if (userRole === 'OPS_AGENT') {
      // Agent can only see their own assignments and stats
      const userId = req.user.id;
      
      [metricsQuery, teamMembersQuery, assignmentDataQuery] = await Promise.all([
        // Agent's own organizer stats
        Promise.all([
          prisma.user.count({ where: { role: 'ORGANIZER', assignedTo: userId } }),
          prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'PENDING', assignedTo: userId } }),
          prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'APPROVED', assignedTo: userId } }),
          prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'REJECTED', assignedTo: userId } })
        ]),
        // Only other agents
        prisma.user.findMany({
          where: { role: 'OPS_AGENT' },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            userPosition: true,
            lastActivity: true
          },
          orderBy: { createdAt: 'asc' }
        }),
        // Agent's own assignment data
        smartAssignmentService.getAgentAssignmentDashboard(userId)
      ]);
      
      // Map agent-specific metrics
      const [totalOrganizers, pendingOrganizers, approvedOrganizers, rejectedOrganizers] = metricsQuery;
      
      const dashboardData = {
        metrics: {
          totalUsers: 0, // Agents don't need total users
          totalOrganizers,
          pendingOrganizers,
          approvedOrganizers,
          rejectedOrganizers,
          teamSize: teamMembersQuery.length,
          activeMembers: teamMembersQuery.length
        },
        teamMembers: teamMembersQuery.map(member => ({
          id: member.id,
          fullName: member.fullName,
          email: member.email,
          role: member.role,
          position: member.userPosition || member.role,
          lastActivity: member.lastActivity || new Date().toISOString(),
          openTickets: 0,
          inProgressTickets: 0,
          completedThisWeek: 0
        })),
        assignmentData: assignmentDataQuery,
        recentActivity: [],
        departmentInfo: {
          name: 'Operations',
          description: 'Event Operations Management',
          totalMembers: teamMembersQuery.length
        }
      };
      
      return res.json({
        success: true,
        data: dashboardData
      });
    } else {
      // Head and Senior Agents see global data
      const [
        totalUsers,
        totalOrganizers,
        pendingOrganizers,
        approvedOrganizers,
        rejectedOrganizers,
        teamMembers,
        assignmentData
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'ORGANIZER' } }),
        prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'PENDING' } }),
        prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'APPROVED' } }),
        prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'REJECTED' } }),
        prisma.user.findMany({
          where: { 
            role: { in: ['OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'] }
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            userPosition: true,
            lastActivity: true
          },
          orderBy: { createdAt: 'asc' }
        }),
        smartAssignmentService.getAssignmentDashboard()
      ]);

      // Filter team members based on user role for security
      let visibleTeamMembers = teamMembers;
      if (userRole === 'OPS_AGENT') {
        // Agents can only see other agents, not Head/Senior
        visibleTeamMembers = teamMembers.filter(member => member.role === 'OPS_AGENT');
      } else if (userRole === 'OPS_SENIOR_AGENT') {
        // Senior Agents can see Agents and Senior Agents, but not Head
        visibleTeamMembers = teamMembers.filter(member => 
          member.role === 'OPS_AGENT' || member.role === 'OPS_SENIOR_AGENT'
        );
      }
      // OPS_HEAD and SUPER_ADMIN can see all team members

      // Map team members data
      const mappedTeamMembers = visibleTeamMembers.map(member => ({
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        role: member.role,
        position: member.userPosition || member.role,
        lastActivity: member.lastActivity || new Date().toISOString(),
        openTickets: 0, // Placeholder
        inProgressTickets: 0, // Placeholder
        completedThisWeek: 0 // Placeholder
      }));

      const dashboardData = {
        metrics: {
          totalUsers,
          totalOrganizers,
          pendingOrganizers,
          approvedOrganizers,
          rejectedOrganizers,
          teamSize: teamMembers.length,
          activeMembers: teamMembers.length
        },
        teamMembers: mappedTeamMembers,
        assignmentData: {
          agents: assignmentData.agents,
          queueStatus: assignmentData.queueStatus,
          totalCapacity: assignmentData.totalCapacity,
          totalWorkload: assignmentData.totalWorkload,
          utilizationRate: assignmentData.utilizationRate,
          recentAssignments: assignmentData.recentAssignments
        },
        recentActivity: [], // Placeholder
        departmentInfo: {
          name: 'Operations',
          description: 'Event and organizer management operations',
          color: 'purple'
        }
      };
      
      res.json({
        success: true,
        data: dashboardData
      });
    }

  } catch (error) {
    logger.error('Operations dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Operations dashboard',
      error: error.message
    });
  }
});

// Export agent assignments as Excel with direct styling
router.get('/export/assignments', authenticate, async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const userRole = req.user.role;
    
    // Check if user is Operations role
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Operations role required'
      });
    }

    let assignments = [];
    
    if (userRole === 'OPS_AGENT') {
      // Export only agent's own assignments
      const agentId = req.user.id;
      
      const organizers = await prisma.user.findMany({
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
          assignedAt: true,
          createdAt: true,
          businessName: true,
          organizerType: true
        },
        orderBy: { assignedAt: 'desc' }
      });

      assignments = organizers.map(org => ({
        'Type': 'Organizer',
        'Name': org.fullName,
        'Email': org.email,
        'Business Name': org.businessName || 'N/A',
        'Organizer Type': org.organizerType || 'N/A',
        'Status': org.verificationStatus,
        'Rejection Reason': org.rejectedReason || 'N/A',
        'Assigned At': org.assignedAt ? new Date(org.assignedAt).toISOString() : 'N/A',
        'Created At': new Date(org.createdAt).toISOString()
      }));
    } else {
      // Export all assignments for Head/Senior
      const [organizers, events] = await Promise.all([
        prisma.user.findMany({
          where: { role: 'ORGANIZER' },
          select: {
            id: true,
            fullName: true,
            email: true,
            verificationStatus: true,
            rejectedReason: true,
            assignedTo: true,
            assignedAt: true,
            createdAt: true,
            businessName: true,
            organizerType: true
          },
          orderBy: { assignedAt: 'desc' }
        })
      ]);

      const organizerAssignments = organizers.map(org => ({
        'Type': 'Organizer',
        'Name': org.fullName,
        'Email': org.email,
        'Business Name': org.businessName || 'N/A',
        'Organizer Type': org.organizerType || 'N/A',
        'Status': org.verificationStatus,
        'Rejection Reason': org.rejectedReason || 'N/A',
        'Assigned At': org.assignedAt ? new Date(org.assignedAt).toISOString() : 'N/A',
        'Created At': new Date(org.createdAt).toISOString()
      }));

      // Events are now free and don't need operations approval
      assignments = organizerAssignments;
    }

    // Create workbook and worksheet with ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assignments');

    // Define columns
    worksheet.columns = [
      { header: 'Type', key: 'Type', width: 10 },
      { header: 'Name', key: 'Name', width: 20 },
      { header: 'Email', key: 'Email', width: 25 },
      { header: 'Business Name', key: 'Business Name', width: 20 },
      { header: 'Organizer Type', key: 'Organizer Type', width: 15 },
      { header: 'Status', key: 'Status', width: 12 },
      { header: 'Rejection Reason', key: 'Rejection Reason', width: 30 },
      { header: 'Assigned At', key: 'Assigned At', width: 20 },
      { header: 'Created At', key: 'Created At', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' } // Blue background
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' }, // White text
        bold: true
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add data rows with styling
    assignments.forEach((assignment, index) => {
      const row = worksheet.addRow(assignment);
      const rowNumber = index + 2; // +2 because header is row 1

      // Style entire row based on status
      if (assignment.Status === 'REJECTED') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFE6E6' } // Light red background
          };
          cell.font = {
            color: { argb: 'FFCC0000' }, // Dark red text
            bold: true
          };
        });
      } else if (assignment.Status === 'APPROVED') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F7E6' } // Light green background
          };
          cell.font = {
            color: { argb: 'FF006600' }, // Dark green text
            bold: true
          };
        });
      } else if (assignment.Status === 'PENDING') {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' } // Light yellow background
          };
          cell.font = {
            color: { argb: 'FFB8860B' }, // Dark yellow text
            bold: true
          };
        });
      }
    });

    // Generate Excel file buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="assignments-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    logger.error('Export assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export assignments'
    });
  }
});

// Get Operations team members only - accessible by OPS_HEAD and SUPER_ADMIN
router.get('/team', authenticate, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Check if user has permission to view team
    if (!['SUPER_ADMIN', 'OPS_HEAD'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - OPS_HEAD or SUPER_ADMIN role required'
      });
    }

    // Get Operations team members only
    let whereClause = { 
      role: { in: ['OPS_SENIOR_AGENT', 'OPS_AGENT'] }, // Only agents, not other heads
      department: 'OPERATIONS' // Only users from Operations department
    };

    // If user is OPS_HEAD (not SUPER_ADMIN), only show agents under their management
    if (userRole === 'OPS_HEAD') {
      // Get current user's manager_id to find agents under them
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { managerId: true }
      });

      if (currentUser?.managerId) {
        // Show agents under this specific OPS_HEAD
        whereClause.managerId = currentUser.managerId;
      } else {
        // If no manager_id, show agents that are not assigned to any other head
        whereClause.managerId = null;
      }
    }

    const operationsTeam = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        department: true,
        userPosition: true,
        employeeId: true,
        emailVerified: true,
        lastActivity: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'asc' }, // OPS_HEAD first, then OPS_SENIOR_AGENT, then OPS_AGENT
        { createdAt: 'asc' }
      ]
    });

    // Map team members data
    const mappedTeamMembers = operationsTeam.map(member => ({
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phoneNumber: member.phoneNumber,
      role: member.role,
      department: member.department,
      userPosition: member.userPosition,
      employeeId: member.employeeId,
      emailVerified: member.emailVerified,
      lastActivity: member.lastActivity,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      isActive: true // All operations team members are considered active
    }));

    res.json({
      success: true,
      data: {
        users: mappedTeamMembers,
        totalCount: mappedTeamMembers.length,
        department: 'OPERATIONS',
        departmentName: 'Operations Department'
      }
    });

  } catch (error) {
    logger.error('Operations team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Operations team',
      error: error.message
    });
  }
});

// Get individual agent dashboard - accessible by OPS_HEAD, OPS_SENIOR_AGENT, and the agent themselves
router.get('/agent/:agentId/dashboard', authenticate, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const agentId = req.params.agentId;
    
    // Check if user has permission to view this agent's dashboard
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT'].includes(userRole) && userId !== agentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - You can only view your own dashboard or need higher permissions'
      });
    }

    // If user is OPS_HEAD, check if the agent is under their management
    if (userRole === 'OPS_HEAD') {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { managerId: true }
      });

      const targetAgent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { managerId: true, role: true }
      });

      // OPS_HEAD can only view agents under their management
      if (targetAgent?.role !== 'OPS_HEAD' && targetAgent?.managerId !== currentUser?.managerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - You can only view agents under your management'
        });
      }
    }

    // Get agent information
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        lastActivity: true
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get agent-specific stats
    const [
      totalOrganizers,
      pendingOrganizers,
      approvedOrganizers,
      rejectedOrganizers,
      totalEvents,
      pendingEvents,
      approvedEvents,
      rejectedEvents,
      assignments,
      recentActivity
    ] = await Promise.all([
      // Organizer stats
      prisma.user.count({ where: { role: 'ORGANIZER', assignedTo: agentId } }),
      prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'PENDING', assignedTo: agentId } }),
      prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'APPROVED', assignedTo: agentId } }),
      prisma.user.count({ where: { role: 'ORGANIZER', verificationStatus: 'REJECTED', assignedTo: agentId } }),
      
      // Event stats
      prisma.event.count({ where: { assignedTo: agentId } }),
      prisma.event.count({ where: { status: 'DRAFT', assignedTo: agentId } }),
      prisma.event.count({ where: { status: 'APPROVED', assignedTo: agentId } }),
      prisma.event.count({ where: { status: 'REJECTED', assignedTo: agentId } }),
      
      // Current assignments
      prisma.assignmentQueue.findMany({
        where: { assignedTo: agentId },
        select: {
          id: true,
          type: true,
          itemId: true,
          priority: true,
          status: true,
          assignedAt: true,
          createdAt: true
        },
        orderBy: { assignedAt: 'desc' },
        take: 10
      }),
      
      // Recent activity (mock data for now)
      Promise.resolve([
        {
          id: '1',
          type: 'organizer',
          description: `Approved organizer application`,
          timestamp: new Date().toISOString(),
          status: 'APPROVED'
        },
        {
          id: '2',
          type: 'event',
          description: `Reviewed event submission`,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'PENDING'
        }
      ])
    ]);

    // Get assignment details
    const assignmentDetails = await Promise.all(
      assignments.map(async (assignment) => {
        let title = '';
        let assigner = null;
        
        if (assignment.type === 'ORGANIZER') {
          const organizer = await prisma.user.findUnique({
            where: { id: assignment.itemId },
            select: { fullName: true, assignedTo: true }
          });
          title = organizer?.fullName || 'Unknown Organizer';
          
          if (organizer?.assignedTo) {
            const assignerUser = await prisma.user.findUnique({
              where: { id: organizer.assignedTo },
              select: { fullName: true, email: true }
            });
            assigner = assignerUser;
          }
        } else if (assignment.type === 'EVENT') {
          const event = await prisma.event.findUnique({
            where: { id: assignment.itemId },
            select: { title: true, assignedTo: true }
          });
          title = event?.title || 'Unknown Event';
          
          if (event?.assignedTo) {
            const assignerUser = await prisma.user.findUnique({
              where: { id: event.assignedTo },
              select: { fullName: true, email: true }
            });
            assigner = assignerUser;
          }
        }
        
        return {
          id: assignment.id,
          type: assignment.type,
          title,
          status: assignment.status,
          priority: assignment.priority,
          assignedAt: assignment.assignedAt,
          createdAt: assignment.createdAt,
          assigner
        };
      })
    );

    // Calculate performance metrics (mock data for now)
    const performanceMetrics = {
      completionRate: Math.min(95, Math.max(70, (approvedOrganizers / Math.max(1, totalOrganizers)) * 100)),
      averageProcessingTime: Math.random() * 30 + 10, // 10-40 minutes
      qualityScore: Math.random() * 2 + 8, // 8-10
      totalAssignments: totalOrganizers + totalEvents,
      completedAssignments: approvedOrganizers + approvedEvents,
      reassignments: Math.floor(Math.random() * 5)
    };

    // Calculate workload
    const workload = {
      currentWorkload: pendingOrganizers + pendingEvents,
      capacity: 20, // Default capacity
      utilization: Math.min(100, ((pendingOrganizers + pendingEvents) / 20) * 100)
    };

    const dashboardData = {
      agent,
      stats: {
        totalOrganizers,
        pendingOrganizers,
        approvedOrganizers,
        rejectedOrganizers,
        totalEvents,
        pendingEvents,
        approvedEvents,
        rejectedEvents
      },
      assignments: assignmentDetails,
      recentActivity,
      performanceMetrics,
      workload
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Agent dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent dashboard',
      error: error.message
    });
  }
});

// Get operations analytics data
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const userRole = req.user.role;
    const timeRange = req.query.timeRange || '7d';
    
    // Check if user has permission to view analytics
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Analytics access requires higher permissions'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
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
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get agent performance data
    const agents = await prisma.user.findMany({
      where: {
        role: { in: ['OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT'] },
        department: 'OPERATIONS'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        lastActivity: true
      }
    });

    // Mock agent performance metrics (replace with real calculations)
    const agentPerformance = agents.map(agent => ({
      id: agent.id,
      fullName: agent.fullName,
      email: agent.email,
      role: agent.role,
      metrics: {
        totalProcessed: Math.floor(Math.random() * 50) + 10,
        approved: Math.floor(Math.random() * 40) + 8,
        rejected: Math.floor(Math.random() * 10) + 2,
        averageResponseTime: Math.floor(Math.random() * 60) + 15,
        qualityScore: Math.random() * 2 + 8,
        efficiency: Math.random() * 20 + 80,
        workload: Math.random() * 40 + 30,
        capacity: 100
      },
      trends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          processed: Math.floor(Math.random() * 10) + 1,
          approved: Math.floor(Math.random() * 8) + 1,
          rejected: Math.floor(Math.random() * 3)
        })),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          processed: Math.floor(Math.random() * 30) + 10,
          efficiency: Math.random() * 20 + 80
        }))
      }
    }));

    // Get organizer insights
    const organizerInsights = {
      totalRegistrations: Math.floor(Math.random() * 100) + 50,
      approvalRate: Math.random() * 20 + 80,
      rejectionRate: Math.random() * 10 + 5,
      averageProcessingTime: Math.floor(Math.random() * 60) + 20,
      trends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          registrations: Math.floor(Math.random() * 15) + 5,
          approvals: Math.floor(Math.random() * 12) + 4,
          rejections: Math.floor(Math.random() * 3) + 1
        })),
        monthly: Array.from({ length: 3 }, (_, i) => ({
          month: new Date(now.getTime() - (2 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          registrations: Math.floor(Math.random() * 50) + 20,
          approvalRate: Math.random() * 20 + 80
        }))
      },
      demographics: {
        organizerTypes: [
          { type: 'Individual', count: 45, percentage: 60 },
          { type: 'Company', count: 25, percentage: 33 },
          { type: 'Organization', count: 5, percentage: 7 }
        ],
        businessTypes: [
          { type: 'Technology', count: 20, percentage: 27 },
          { type: 'Education', count: 18, percentage: 24 },
          { type: 'Healthcare', count: 15, percentage: 20 },
          { type: 'Finance', count: 12, percentage: 16 },
          { type: 'Other', count: 10, percentage: 13 }
        ],
        geographicDistribution: [
          { location: 'Jakarta', count: 25 },
          { location: 'Surabaya', count: 15 },
          { location: 'Bandung', count: 12 },
          { location: 'Medan', count: 8 },
          { location: 'Other', count: 15 }
        ]
      }
    };

    // Calculate team metrics
    const teamMetrics = {
      totalAgents: agents.length,
      activeAgents: agents.filter(agent => {
        const lastActivity = new Date(agent.lastActivity);
        return (now.getTime() - lastActivity.getTime()) < 24 * 60 * 60 * 1000; // Active in last 24h
      }).length,
      averageTeamEfficiency: agentPerformance.reduce((sum, agent) => sum + agent.metrics.efficiency, 0) / agentPerformance.length,
      teamQualityScore: agentPerformance.reduce((sum, agent) => sum + agent.metrics.qualityScore, 0) / agentPerformance.length,
      totalWorkload: agentPerformance.reduce((sum, agent) => sum + agent.metrics.workload, 0),
      totalCapacity: agentPerformance.reduce((sum, agent) => sum + agent.metrics.capacity, 0)
    };

    const analyticsData = {
      agentPerformance,
      organizerInsights,
      teamMetrics,
      timeRange,
      lastUpdated: now.toISOString()
    };

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    logger.error('Operations analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error.message
    });
  }
});

module.exports = router;
