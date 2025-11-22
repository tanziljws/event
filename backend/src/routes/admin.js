const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validateEventCreation, handleValidationErrors } = require('../middlewares/validation');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Helper function to get department-specific dashboard data
async function getDepartmentDashboardData(department, userRole) {
  const isHead = userRole.includes('_HEAD');
  const isAgent = userRole.includes('_AGENT');
  
  // Base department data
  const departmentInfo = {
    CUSTOMER_SERVICE: {
      name: 'Customer Service',
      description: 'Customer support and satisfaction management',
      color: 'blue'
    },
    OPERATIONS: {
      name: 'Operations',
      description: 'Event operations and logistics management',
      color: 'green'
    },
    FINANCE: {
      name: 'Finance',
      description: 'Financial management and payment processing',
      color: 'purple'
    }
  };

  // Get team members for this department
  const roleMapping = {
    'CUSTOMER_SERVICE': ['CS_HEAD', 'CS_AGENT'],
    'OPERATIONS': ['OPS_HEAD', 'OPS_AGENT'],
    'FINANCE': ['FINANCE_HEAD', 'FINANCE_AGENT']
  };
  
  const teamMembers = await prisma.user.findMany({
    where: {
      department: department,
      role: {
        in: roleMapping[department] || []
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      userPosition: true,
      employeeId: true,
      lastActivity: true
    },
    orderBy: [
      { userPosition: 'asc' },
      { fullName: 'asc' }
    ]
  });

  // Get department-specific metrics
  let metrics = {};
  
  if (department === 'CUSTOMER_SERVICE') {
    // CS specific metrics
    const totalUsers = await prisma.user.count({
      where: { role: 'PARTICIPANT' }
    });
    
    const totalOrganizers = await prisma.user.count({
      where: { role: 'ORGANIZER' }
    });

    metrics = {
      totalUsers,
      totalOrganizers,
      teamSize: teamMembers.length,
      department: 'Customer Service'
    };
  } else if (department === 'OPERATIONS') {
    // Operations specific metrics
    const totalEvents = await prisma.event.count();

    metrics = {
      totalEvents,
      teamSize: teamMembers.length,
      department: 'Operations'
    };
  } else if (department === 'FINANCE') {
    // Finance specific metrics
    const totalPayments = await prisma.payment.count();

    metrics = {
      totalPayments,
      teamSize: teamMembers.length,
      department: 'Finance'
    };
  }

  // Get recent activities based on role
  let recentActivities = [];
  
  if (isHead) {
    // Head sees team activities
    recentActivities = await prisma.activityLog.findMany({
      where: {
        user: {
          department: department
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  } else if (isAgent) {
    // Agent sees only their activities
    recentActivities = await prisma.activityLog.findMany({
      where: {
        user: {
          department: department,
          role: userRole
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
  }

  return {
    department: departmentInfo[department],
    userRole,
    isHead,
    isAgent,
    teamMembers,
    metrics,
    recentActivities: recentActivities.map(activity => ({
      id: activity.id,
      action: activity.action,
      user: activity.user.fullName,
      userRole: activity.user.role,
      createdAt: activity.createdAt
    }))
  };
}

// Get department-specific dashboard
router.get('/dashboard/:department', authenticate, requireAdmin, async (req, res) => {
  try {
    const { department } = req.params;
    const userRole = req.user.role;
    const userDepartment = req.user.department;

    // Check if user has access to this department
    if (userDepartment !== department && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this department'
      });
    }

    // Get department-specific data
    const departmentData = await getDepartmentDashboardData(department, userRole);
    
    res.json({
      success: true,
      data: departmentData
    });

  } catch (error) {
    logger.error('Department dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department dashboard',
      error: error.message
    });
  }
});


// Get admin events
router.get('/events', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      isPublished,
      search,
      location,
      eventDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    if (eventDate) {
      const date = new Date(eventDate);
      where.eventDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          eventDate: true,
          eventTime: true,
          location: true,
          thumbnailUrl: true,
          description: true,
          maxParticipants: true,
          registrationDeadline: true,
          isPublished: true,
          status: true,
          category: true,
          price: true,
          isFree: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          _count: {
            select: {
              registrations: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// Get admin dashboard stats
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalEvents = await prisma.event.count();
    const publishedEvents = await prisma.event.count({ where: { isPublished: true } });
    const totalParticipants = await prisma.user.count({ where: { role: 'PARTICIPANT' } });
    const totalRegistrations = await prisma.eventRegistration.count();
    
    // Get recent events
    const topEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        eventDate: true,
        isPublished: true,
        createdBy: true,
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          publishedEvents,
          totalParticipants,
          totalRegistrations,
          totalRevenue: 0,
          eventsThisMonth: 0,
          eventsThisYear: 0,
          upcomingEvents: 0,
          recentRegistrations: 0,
          topEvents: topEvents.map(event => ({
            id: event.id,
            title: event.title,
            eventDate: event.eventDate,
            participantCount: event._count.registrations,
            isPublished: event.isPublished,
            creator: event.creator
          }))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get all organizers for admin management
router.get('/organizers', authenticate, requireAdmin, async (req, res) => {
  try {
    const organizers = await prisma.user.findMany({
      where: {
        role: 'ORGANIZER'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        organizerType: true,
        verificationStatus: true,
        businessName: true,
        businessAddress: true,
        businessPhone: true,
        portfolio: true,
        socialMedia: true,
        createdAt: true,
        verifiedAt: true,
        rejectedReason: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`Admin ${req.user.email} fetched ${organizers.length} organizers`);

    res.json({
      success: true,
      data: {
        organizers,
        total: organizers.length
      }
    });

  } catch (error) {
    logger.error('Error fetching organizers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizers',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Approve organizer
router.patch('/organizers/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, verificationStatus: true }
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
        error: 'NOT_FOUND'
      });
    }

    if (organizer.verificationStatus === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Organizer already approved',
        error: 'ALREADY_APPROVED'
      });
    }

    // Update organizer status
    const updatedOrganizer = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        verifiedAt: new Date()
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        organizerType: true,
        verificationStatus: true,
        verifiedAt: true
      }
    });

    logger.info(`Admin ${req.user.email} approved organizer ${organizer.email}`);

    res.json({
      success: true,
      message: 'Organizer approved successfully',
      data: { organizer: updatedOrganizer }
    });

  } catch (error) {
    logger.error('Error approving organizer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve organizer',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Reject organizer
router.patch('/organizers/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
        error: 'VALIDATION_ERROR'
      });
    }

    // Check if organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, verificationStatus: true }
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
        error: 'NOT_FOUND'
      });
    }

    if (organizer.verificationStatus === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Organizer already rejected',
        error: 'ALREADY_REJECTED'
      });
    }

    // Update organizer status
    const updatedOrganizer = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        rejectedReason: reason.trim()
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        organizerType: true,
        verificationStatus: true,
        rejectedReason: true
      }
    });

    logger.info(`Admin ${req.user.email} rejected organizer ${organizer.email} with reason: ${reason}`);

    res.json({
      success: true,
      message: 'Organizer rejected successfully',
      data: { organizer: updatedOrganizer }
    });

  } catch (error) {
    logger.error('Error rejecting organizer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject organizer',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get organizer details
router.get('/organizers/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        lastEducation: true,
        organizerType: true,
        verificationStatus: true,
        businessName: true,
        businessAddress: true,
        businessPhone: true,
        portfolio: true,
        socialMedia: true,
        createdAt: true,
        verifiedAt: true,
        rejectedReason: true
      }
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { organizer }
    });

  } catch (error) {
    logger.error('Error fetching organizer details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer details',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get monthly analytics data
router.get('/dashboard/analytics/monthly', authenticate, requireAdmin, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), timeRange = 'year' } = req.query;

    // Get monthly event data (simplified without date filter)
    const monthlyEvents = await prisma.event.findMany({
      select: {
        createdAt: true,
        isPublished: true,
        price: true,
        isFree: true
      }
    });

    // Process monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthEvents = monthlyEvents.filter(event => 
        new Date(event.createdAt).getMonth() === i
      );
      
      const totalRevenue = monthEvents.reduce((sum, event) => {
        if (event.isFree) return sum;
        return sum + (parseFloat(event.price) || 0);
      }, 0);

      return {
        month,
        total: monthEvents.length,
        published: monthEvents.filter(e => e.isPublished).length,
        revenue: totalRevenue
      };
    });

    res.json({
      success: true,
      data: {
        monthlyData,
        year: parseInt(year)
      }
    });

  } catch (error) {
    logger.error('Error fetching monthly analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly analytics',
      error: error.message
    });
  }
});

// Get analytics data
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), timeRange = 'year' } = req.query;

    // Get basic stats
    const totalEvents = await prisma.event.count();
    const publishedEvents = await prisma.event.count({ where: { isPublished: true } });
    const totalParticipants = await prisma.user.count({ where: { role: 'PARTICIPANT' } });
    const totalRegistrations = await prisma.eventRegistration.count();

    // Get monthly event data
    const monthlyEvents = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      },
      select: {
        createdAt: true,
        isPublished: true
      }
    });

    // Process monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthEvents = monthlyEvents.filter(event => 
        new Date(event.createdAt).getMonth() === i
      );
      return {
        month,
        total: monthEvents.length,
        published: monthEvents.filter(e => e.isPublished).length
      };
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          publishedEvents,
          totalParticipants,
          totalRegistrations
        },
        monthlyData
      }
    });

  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Create admin event
router.post('/events', authenticate, requireAdmin, validateEventCreation, handleValidationErrors, async (req, res) => {
  try {
    const {
      title,
      eventDate,
      eventTime,
      location,
      description,
      maxParticipants,
      registrationDeadline,
      category,
      price,
      isFree,
      thumbnailUrl,
      galleryUrls,
      flyerUrl
    } = req.body;

    // Validation is now handled by middleware

    // Create event with minimal required fields first
    const eventData = {
      title,
      eventDate: new Date(eventDate),
      eventTime,
      location,
      description,
      maxParticipants: parseInt(maxParticipants) || 100,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      category: category || 'ENTERTAINMENT',
      price: isFree ? '0' : (price ? price.toString() : '0'),
      isFree: isFree || false,
      thumbnailUrl: thumbnailUrl || null,
      galleryUrls: Array.isArray(galleryUrls) ? galleryUrls : (galleryUrls ? Object.values(galleryUrls) : []),
      flyerUrl: flyerUrl || null,
      isPublished: true,
      status: 'APPROVED',
      createdBy: req.user.id,
      approvedBy: req.user.id,
      approvedAt: new Date()
    };

    console.log('Creating event with data:', JSON.stringify(eventData, null, 2));

    try {
      const event = await prisma.event.create({
        data: eventData
      });
      console.log('Event created successfully:', event.id);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: { 
          id: event.id,
          title: event.title,
          eventDate: event.eventDate,
          location: event.location,
          status: event.status
        }
      });
    } catch (error) {
      console.error('Database error details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create event',
        error: error.message
      });
    }

  } catch (error) {
    logger.error('Error creating admin event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
});

// Get admin users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          department: true,
          userPosition: true,
          emailVerified: true,
          verificationStatus: true,
          createdAt: true,
          updatedAt: true,
          organizerType: true,
          businessProfile: {
            select: {
              businessName: true
            }
          },
          _count: {
            select: {
              eventRegistrations: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Format users to include businessName from businessProfile
    const formattedUsers = users.map(user => {
      const { businessProfile, ...userData } = user;
      return {
        ...userData,
        businessName: businessProfile?.businessName || null
      };
    });

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Create new staff directly (Super Admin only)
router.post('/create-staff', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      address, 
      lastEducation, 
      role, 
      department,
      userPosition, 
      managerId 
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !role || !department || !userPosition) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, role, department, and position are required'
      });
    }

    // Validate department
    const validDepartments = ['CUSTOMER_SERVICE', 'OPERATIONS', 'FINANCE'];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    // Validate role matches department
    const roleDepartmentMap = {
      'CS_HEAD': 'CUSTOMER_SERVICE',
      'CS_AGENT': 'CUSTOMER_SERVICE',
      'OPS_HEAD': 'OPERATIONS',
      'OPS_AGENT': 'OPERATIONS',
      'FINANCE_HEAD': 'FINANCE',
      'FINANCE_AGENT': 'FINANCE'
    };

    if (roleDepartmentMap[role] !== department) {
      return res.status(400).json({
        success: false,
        message: 'Role does not match selected department'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate employee ID
    const departmentPrefix = {
      'CUSTOMER_SERVICE': 'CS',
      'OPERATIONS': 'OPS',
      'FINANCE': 'FIN'
    };
    
    const lastEmployee = await prisma.user.findFirst({
      where: {
        department: department,
        employeeId: {
          startsWith: departmentPrefix[department]
        }
      },
      orderBy: { employeeId: 'desc' }
    });

    let employeeNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNumber = parseInt(lastEmployee.employeeId.replace(departmentPrefix[department], ''));
      if (!isNaN(lastNumber)) {
        employeeNumber = lastNumber + 1;
      }
    }

    const employeeId = `${departmentPrefix[department]}${employeeNumber.toString().padStart(3, '0')}`;

    // Convert userPosition to valid enum value (only HEAD and AGENT, no SENIOR_AGENT)
    const positionMap = {
      'Head': 'HEAD',
      'Agent': 'AGENT'
    };
    const validPosition = positionMap[userPosition] || userPosition;

    // Hash password
    const hashedPassword = await bcrypt.hash('temp_password_123', 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        address: address || null,
        lastEducation: lastEducation || null,
        role,
        department,
        userPosition: validPosition,
        managerId: managerId || null,
        employeeId,
        emailVerified: true, // Admin created, so auto-verify
        password: hashedPassword, // Hashed temporary password
        verificationToken: null,
        verificationTokenExpires: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        employeeId: true,
        createdAt: true
      }
    });

    logger.info(`New staff created: ${newUser.fullName} (${newUser.email}) in ${department}`);

    res.json({
      success: true,
      message: 'New staff created successfully',
      data: newUser
    });

  } catch (error) {
    logger.error('Create new staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create new staff',
      error: error.message
    });
  }
});

// Get staff details by ID
router.get('/staff/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        lastEducation: true,
        role: true,
        department: true,
        userPosition: true,
        managerId: true,
        employeeId: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });

  } catch (error) {
    logger.error('Get staff details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff details',
      error: error.message
    });
  }
});

// Update staff details
router.put('/staff/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fullName, 
      email, 
      phoneNumber, 
      address, 
      lastEducation, 
      role, 
      department,
      userPosition, 
      managerId 
    } = req.body;

    // Check if staff exists
    const existingStaff = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Validate required fields
    if (!fullName || !email || !role || !department || !userPosition) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, role, department, and position are required'
      });
    }

    // Validate department
    const validDepartments = ['CUSTOMER_SERVICE', 'OPERATIONS', 'FINANCE'];
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department'
      });
    }

    // Validate role matches department
    const roleDepartmentMap = {
      'CS_HEAD': 'CUSTOMER_SERVICE',
      'CS_AGENT': 'CUSTOMER_SERVICE',
      'OPS_HEAD': 'OPERATIONS',
      'OPS_AGENT': 'OPERATIONS',
      'FINANCE_HEAD': 'FINANCE',
      'FINANCE_AGENT': 'FINANCE'
    };

    if (roleDepartmentMap[role] !== department) {
      return res.status(400).json({
        success: false,
        message: 'Role does not match selected department'
      });
    }

    // Check if email already exists (excluding current user)
    if (email !== existingStaff.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
    }

    // Convert userPosition to valid enum value (only HEAD and AGENT, no SENIOR_AGENT)
    const positionMap = {
      'Head': 'HEAD',
      'Agent': 'AGENT'
    };
    const validPosition = positionMap[userPosition] || userPosition;

    // Update staff
    const updatedStaff = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        address: address || null,
        lastEducation: lastEducation || null,
        role,
        department,
        userPosition: validPosition,
        managerId: managerId || null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        lastEducation: true,
        role: true,
        department: true,
        userPosition: true,
        managerId: true,
        employeeId: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info(`Staff updated: ${updatedStaff.fullName} (${updatedStaff.email})`);

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
    });

  } catch (error) {
    logger.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff',
      error: error.message
    });
  }
});

// Delete staff (reset to PARTICIPANT)
router.delete('/staff/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const existingStaff = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Reset staff to PARTICIPANT
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: 'PARTICIPANT',
        department: null,
        userPosition: null,
        managerId: null,
        employeeId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        employeeId: true
      }
    });

    logger.info(`Staff removed from department: ${updatedUser.fullName} (${updatedUser.email})`);

    res.json({
      success: true,
      message: 'Staff removed from department successfully',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Remove staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove staff',
      error: error.message
    });
  }
});

module.exports = router;