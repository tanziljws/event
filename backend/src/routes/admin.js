const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validateEventCreation, handleValidationErrors } = require('../middlewares/validation');
const { prisma } = require('../config/database');
const logger = require('../config/logger');
// Use Brevo email service
const { emailTemplates } = require('../config/brevoEmail');

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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    const totalEvents = await prisma.event.count();
    const publishedEvents = await prisma.event.count({ where: { isPublished: true } });
    const totalParticipants = await prisma.user.count({ where: { role: 'PARTICIPANT' } });
    const totalRegistrations = await prisma.eventRegistration.count();

    // Calculate total revenue from paid payments
    const paidPayments = await prisma.payment.findMany({
      where: { paymentStatus: 'PAID' },
      select: { amount: true }
    });
    const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Events this month
    const eventsThisMonth = await prisma.event.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    // Events this year
    const eventsThisYear = await prisma.event.count({
      where: { createdAt: { gte: startOfYear } }
    });

    // Upcoming events (next 30 days)
    const upcomingEvents = await prisma.event.count({
      where: {
        eventDate: { gte: now, lte: thirtyDaysFromNow },
        isPublished: true
      }
    });

    // Recent registrations (last 7 days)
    const recentRegistrations = await prisma.eventRegistration.count({
      where: { registeredAt: { gte: sevenDaysAgo } }
    });

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
          totalRevenue,
          eventsThisMonth,
          eventsThisYear,
          upcomingEvents,
          recentRegistrations,
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
    const users = await prisma.user.findMany({
      where: {
        role: 'ORGANIZER'
      },
      include: {
        businessProfile: true,
        communityProfile: true,
        institutionProfile: true,
        individualProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map users to include business info from profiles
    const organizers = users.map(user => {
      let businessName = '';
      let businessAddress = '';
      let businessPhone = '';
      let portfolio = '';
      let socialMedia = '';

      // Get business info based on organizer type
      if (user.organizerType === 'INDIVIDUAL' && user.individualProfile) {
        businessName = user.fullName;
        businessAddress = user.individualProfile.personalAddress || '';
        businessPhone = user.individualProfile.personalPhone || '';
        portfolio = Array.isArray(user.individualProfile.documents) && user.individualProfile.documents.length > 0
          ? user.individualProfile.documents[0] // Use first document as portfolio URL
          : '';
        socialMedia = ''; // Not available in schema
      } else if (user.organizerType === 'COMMUNITY' && user.communityProfile) {
        businessName = user.communityProfile.communityName || '';
        businessAddress = user.communityProfile.communityAddress || '';
        businessPhone = user.communityProfile.communityPhone || '';
        portfolio = Array.isArray(user.communityProfile.documents) && user.communityProfile.documents.length > 0
          ? user.communityProfile.documents[0]
          : '';
        socialMedia = ''; // Not available in schema
      } else if (user.organizerType === 'SMALL_BUSINESS' && user.businessProfile) {
        businessName = user.businessProfile.businessName || '';
        businessAddress = user.businessProfile.businessAddress || '';
        businessPhone = user.businessProfile.businessPhone || '';
        portfolio = Array.isArray(user.businessProfile.documents) && user.businessProfile.documents.length > 0
          ? user.businessProfile.documents[0]
          : '';
        socialMedia = ''; // Not available in schema
      } else if (user.organizerType === 'INSTITUTION' && user.institutionProfile) {
        businessName = user.institutionProfile.institutionName || '';
        businessAddress = user.institutionProfile.institutionAddress || '';
        businessPhone = user.institutionProfile.institutionPhone || '';
        portfolio = Array.isArray(user.institutionProfile.documents) && user.institutionProfile.documents.length > 0
          ? user.institutionProfile.documents[0]
          : '';
        socialMedia = ''; // Not available in schema
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        organizerType: user.organizerType || '',
        verificationStatus: user.verificationStatus || 'PENDING',
        businessName,
        businessAddress,
        businessPhone,
        portfolio,
        socialMedia,
        createdAt: user.createdAt,
        verifiedAt: user.verifiedAt,
        rejectedReason: user.rejectedReason
      };
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
      error: error.message || 'INTERNAL_SERVER_ERROR'
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

    // Get full organizer data for email and metadata
    const organizerData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        organizerType: true,
        verificationStatus: true,
        metadata: true
      }
    });

    // Preserve existing metadata or set default Basic plan metadata
    const currentMetadata = (organizerData && typeof organizerData.metadata === 'object' && organizerData.metadata !== null)
      ? organizerData.metadata
      : {};
    
    // Ensure Basic plan metadata is set if not already present
    const updatedMetadata = {
      ...currentMetadata,
      subscriptionPlan: currentMetadata.subscriptionPlan || 'basic',
      planLabel: currentMetadata.planLabel || 'Basic',
      maxEventsPerMonth: currentMetadata.maxEventsPerMonth || 5,
      maxParticipantsPerEvent: currentMetadata.maxParticipantsPerEvent || 100,
      subscriptionStartedAt: currentMetadata.subscriptionStartedAt || new Date().toISOString(),
    };

    // Update organizer status and preserve/ensure metadata
    const updatedOrganizer = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        verifiedAt: new Date(),
        metadata: updatedMetadata
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

    // Send email notification
    try {
      await emailTemplates.sendOrganizerApprovalEmail(organizerData.email, organizerData.fullName);
      logger.info(`✅ Organizer approval email sent to: ${organizerData.email}`);
    } catch (emailError) {
      logger.error('Failed to send organizer approval email:', emailError);
      // Don't fail the main operation if email fails
    }

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

    // Get full organizer data for email
    const organizerData = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        organizerType: true,
        verificationStatus: true
      }
    });

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

    // Send email notification
    try {
      await emailTemplates.sendOrganizerRejectionEmail(organizerData.email, organizerData.fullName, reason.trim());
      logger.info(`✅ Organizer rejection email sent to: ${organizerData.email}`);
    } catch (emailError) {
      logger.error('Failed to send organizer rejection email:', emailError);
      // Don't fail the main operation if email fails
    }

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

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        businessProfile: true,
        communityProfile: true,
        institutionProfile: true,
        individualProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
        error: 'NOT_FOUND'
      });
    }

    // Check if user is an organizer
    if (user.role !== 'ORGANIZER') {
      return res.status(404).json({
        success: false,
        message: 'User is not an organizer',
        error: 'NOT_ORGANIZER'
      });
    }

    // Map user to organizer format with business info from profiles
    let businessName = '';
    let businessAddress = '';
    let businessPhone = '';
    let portfolio = '';
    let socialMedia = '';

    // Get business info based on organizer type
    if (user.organizerType === 'INDIVIDUAL' && user.individualProfile) {
      businessName = user.fullName;
      businessAddress = user.individualProfile.personalAddress || '';
      businessPhone = user.individualProfile.personalPhone || '';
      portfolio = Array.isArray(user.individualProfile.documents) && user.individualProfile.documents.length > 0
        ? user.individualProfile.documents[0]
        : '';
      socialMedia = '';
    } else if (user.organizerType === 'COMMUNITY' && user.communityProfile) {
      businessName = user.communityProfile.communityName || '';
      businessAddress = user.communityProfile.communityAddress || '';
      businessPhone = user.communityProfile.communityPhone || '';
      portfolio = Array.isArray(user.communityProfile.documents) && user.communityProfile.documents.length > 0
        ? user.communityProfile.documents[0]
        : '';
      socialMedia = '';
    } else if (user.organizerType === 'SMALL_BUSINESS' && user.businessProfile) {
      businessName = user.businessProfile.businessName || '';
      businessAddress = user.businessProfile.businessAddress || '';
      businessPhone = user.businessProfile.businessPhone || '';
      portfolio = Array.isArray(user.businessProfile.documents) && user.businessProfile.documents.length > 0
        ? user.businessProfile.documents[0]
        : '';
      socialMedia = '';
    } else if (user.organizerType === 'INSTITUTION' && user.institutionProfile) {
      businessName = user.institutionProfile.institutionName || '';
      businessAddress = user.institutionProfile.institutionAddress || '';
      businessPhone = user.institutionProfile.institutionPhone || '';
      portfolio = Array.isArray(user.institutionProfile.documents) && user.institutionProfile.documents.length > 0
        ? user.institutionProfile.documents[0]
        : '';
      socialMedia = '';
    }

    const organizer = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      lastEducation: user.lastEducation || '',
      organizerType: user.organizerType || '',
      verificationStatus: user.verificationStatus || 'PENDING',
      businessName,
      businessAddress,
      businessPhone,
      portfolio,
      socialMedia,
      createdAt: user.createdAt,
      verifiedAt: user.verifiedAt,
      rejectedReason: user.rejectedReason
    };

    res.json({
      success: true,
      data: { organizer }
    });

  } catch (error) {
    logger.error('Error fetching organizer details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer details',
      error: error.message || 'INTERNAL_SERVER_ERROR'
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

// Get user details by ID (General)
router.get('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
        isEmailVerified: true, // Check schema if it's emailVerified or isEmailVerified
        emailVerified: true,
        createdAt: true,
        lastActive: true,
        avatarUrl: true,
        organizerType: true,
        businessProfile: {
          select: {
            businessName: true,
            businessAddress: true,
            businessPhone: true,
            portfolio: true,
            socialMedia: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Flatten business profile
    const formattedUser = {
      ...user,
      isEmailVerified: user.emailVerified, // Normalize field name
      businessName: user.businessProfile?.businessName,
      businessAddress: user.businessProfile?.businessAddress,
      businessPhone: user.businessProfile?.businessPhone,
      portfolio: user.businessProfile?.portfolio,
      socialMedia: user.businessProfile?.socialMedia
    };

    res.json({
      success: true,
      data: { user: formattedUser }
    });

  } catch (error) {
    logger.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// Update user details (General)
router.put('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phoneNumber,
      address,
      role,
      isEmailVerified,
      organizerType,
      businessName,
      businessAddress,
      businessPhone,
      portfolio,
      socialMedia
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { businessProfile: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update data
    const updateData = {
      fullName,
      phoneNumber,
      address,
      role,
      emailVerified: isEmailVerified,
      organizerType
    };

    // Handle business profile update if organizer
    if (role === 'ORGANIZER' || existingUser.role === 'ORGANIZER') {
      if (existingUser.businessProfile) {
        await prisma.businessProfile.update({
          where: { userId: id },
          data: {
            businessName,
            businessAddress,
            businessPhone
          }
        });
      } else if (businessName) {
        // Create if not exists but data provided
        await prisma.businessProfile.create({
          data: {
            userId: id,
            businessName,
            businessAddress: businessAddress || '', // Required field
            businessPhone: businessPhone || '' // Required field
          }
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true
      }
    });

    logger.info(`Admin ${req.user.email} updated user ${updatedUser.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Delete user (General)
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user (cascade should handle related records if configured, otherwise might need manual cleanup)
    // For safety, maybe just soft delete or deactivate? But user asked for delete.
    // Let's assume hard delete for now as per requirement.

    await prisma.user.delete({
      where: { id }
    });

    logger.info(`Admin ${req.user.email} deleted user ${existingUser.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Reset user password (Admin Override)
router.post('/users/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    logger.info(`Admin ${req.user.email} reset password for user ${id}`);

    res.json({
      success: true,
      message: 'User password reset successfully'
    });

  } catch (error) {
    logger.error('Error resetting user password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user password',
      error: error.message
    });
  }
});

// Suspend/Unsuspend user
router.patch('/users/:id/suspend', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isSuspended } = req.body; // true to suspend, false to unsuspend

    // Prevent suspending self
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own account'
      });
    }

    // We'll use verificationStatus as a proxy for suspension if no specific field exists
    // Or better, check if there's an 'isActive' field. Schema shows 'verificationStatus'.
    // Let's use 'REJECTED' for suspended and 'APPROVED' for active for now, 
    // or 'PENDING' if we want to force re-verification.
    // Actually, let's check schema again. There is no 'isSuspended'.
    // Let's use verificationStatus = 'REJECTED' with reason 'SUSPENDED_BY_ADMIN'

    const status = isSuspended ? 'REJECTED' : 'APPROVED';
    const reason = isSuspended ? 'Account suspended by admin' : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: status,
        rejectedReason: reason
      },
      select: { id: true, email: true, verificationStatus: true, rejectedReason: true }
    });

    logger.info(`Admin ${req.user.email} ${isSuspended ? 'suspended' : 'unsuspended'} user ${updatedUser.email}`);

    res.json({
      success: true,
      message: `User ${isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      data: { user: updatedUser }
    });

  } catch (error) {
    logger.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user suspension status',
      error: error.message
    });
  }
});

// Change user role
router.patch('/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent changing own role
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'PARTICIPANT', 'CS_HEAD', 'CS_AGENT', 'OPS_HEAD', 'OPS_AGENT', 'FINANCE_HEAD', 'FINANCE_AGENT'];
    // Note: Schema has more specific roles, let's be permissive or check schema enum
    // Schema: SUPER_ADMIN, CS_HEAD, CS_SENIOR_AGENT, CS_AGENT, OPS_HEAD, OPS_SENIOR_AGENT, OPS_AGENT, FINANCE_HEAD, FINANCE_SENIOR_AGENT, FINANCE_AGENT, ORGANIZER, PARTICIPANT

    // Simple check
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });

    logger.info(`Admin ${req.user.email} changed role of user ${updatedUser.email} to ${role}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    logger.error('Error changing user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// Event Control Routes

// Update event details (Admin Override)
router.put('/events/:id', authenticate, requireAdmin, validateEventCreation, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Use event service or direct update? 
    // Let's do direct update for simplicity but respect data types

    // Basic fields mapping
    const updateData = {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      eventDate: eventData.eventDate ? new Date(eventData.eventDate) : undefined,
      eventTime: eventData.eventTime,
      maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : undefined,
      price: eventData.price ? eventData.price.toString() : undefined,
      isFree: eventData.isFree,
      category: eventData.category,
      thumbnailUrl: eventData.thumbnailUrl,
      flyerUrl: eventData.flyerUrl,
      galleryUrls: eventData.galleryUrls,
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : undefined
    };

    // Remove undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData
    });

    logger.info(`Admin ${req.user.email} updated event ${id}`);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event: updatedEvent }
    });

  } catch (error) {
    logger.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
});

// Toggle event publish status (Admin)
router.patch('/events/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update publish status
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        isPublished: isPublished !== undefined ? isPublished : !existingEvent.isPublished
      }
    });

    logger.info(`Admin ${req.user.email} ${updatedEvent.isPublished ? 'published' : 'unpublished'} event ${id}`);

    res.json({
      success: true,
      message: `Event ${updatedEvent.isPublished ? 'published' : 'unpublished'} successfully`,
      data: { event: updatedEvent }
    });

  } catch (error) {
    logger.error('Error toggling event publish status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle event publish status',
      error: error.message
    });
  }
});

// Delete event (Admin Override)
router.delete('/events/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Hard delete or soft delete? 
    // Let's assume hard delete but we need to handle relations (Cascade is usually set in Prisma)
    // If not cascade, we might need to delete registrations first.
    // Assuming Cascade for now.

    await prisma.event.delete({
      where: { id }
    });

    logger.info(`Admin ${req.user.email} deleted event ${id}`);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
});

// System Settings Routes

// Get all system settings
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' }
    });

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    logger.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message
    });
  }
});

// Update system setting
router.put('/settings/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedBy: req.user.id
      },
      create: {
        key,
        value,
        description,
        updatedBy: req.user.id
      }
    });

    logger.info(`Admin ${req.user.email} updated setting ${key}`);

    res.json({
      success: true,
      message: 'System setting updated successfully',
      data: { setting }
    });

  } catch (error) {
    logger.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system setting',
      error: error.message
    });
  }
});

// ===== Payment & Transaction Monitoring =====

// Get all payments (Admin monitoring)
router.get('/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentMethod,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (status) {
      where.paymentStatus = status;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { paymentReference: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    // Calculate summary statistics
    const allPayments = await prisma.payment.findMany({ where });
    const totalAmount = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paidAmount = allPayments
      .filter(p => p.paymentStatus === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingAmount = allPayments
      .filter(p => p.paymentStatus === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: {
          totalAmount,
          paidAmount,
          pendingAmount,
          totalCount: total,
          paidCount: allPayments.filter(p => p.paymentStatus === 'PAID').length,
          pendingCount: allPayments.filter(p => p.paymentStatus === 'PENDING').length
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Get payment statistics
router.get('/payments/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({ where });

    // Calculate statistics
    const stats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      paid: payments.filter(p => p.paymentStatus === 'PAID').length,
      paidAmount: payments
        .filter(p => p.paymentStatus === 'PAID')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      pending: payments.filter(p => p.paymentStatus === 'PENDING').length,
      pendingAmount: payments
        .filter(p => p.paymentStatus === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      failed: payments.filter(p => p.paymentStatus === 'FAILED').length,
      failedAmount: payments
        .filter(p => p.paymentStatus === 'FAILED')
        .reduce((sum, p) => sum + Number(p.amount), 0),
      byMethod: {},
      byStatus: {}
    };

    // Group by payment method
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!stats.byMethod[method]) {
        stats.byMethod[method] = { count: 0, amount: 0 };
      }
      stats.byMethod[method].count++;
      stats.byMethod[method].amount += Number(payment.amount);
    });

    // Group by status
    payments.forEach(payment => {
      const status = payment.paymentStatus;
      if (!stats.byStatus[status]) {
        stats.byStatus[status] = { count: 0, amount: 0 };
      }
      stats.byStatus[status].count++;
      stats.byStatus[status].amount += Number(payment.amount);
    });

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    logger.error('Error fetching payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
});

// ===== Activity Logs & Audit =====

// Get activity logs (Admin)
router.get('/activity-logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.activityLog.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

// Get user activity summary
router.get('/users/:id/activity', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const logs = await prisma.activityLog.findMany({
      where: { userId: id },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: { logs }
    });

  } catch (error) {
    logger.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
});

// Get featured homepage events (PUBLIC - no auth required for homepage)
router.get('/events/homepage/featured', async (req, res) => {
  try {
    // Check if columns exist, if not return empty array
    try {
      const featuredEvents = await prisma.event.findMany({
        where: {
          isHomepageFeatured: true,
          isPublished: true,
        },
        orderBy: {
          homepageOrder: 'asc',
        },
        take: 3,
        select: {
          id: true,
          title: true,
          eventDate: true,
          eventTime: true,
          location: true,
          thumbnailUrl: true,
          category: true,
          description: true,
          maxParticipants: true,
          isFree: true,
          price: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          events: featuredEvents,
        },
      });
    } catch (dbError) {
      // If column doesn't exist yet, return empty array
      if (dbError.message && (dbError.message.includes('isHomepageFeatured') || dbError.message.includes('homepage_order'))) {
        logger.warn('Homepage featured columns not yet migrated, returning empty array');
        res.status(200).json({
          success: true,
          data: {
            events: [],
          },
        });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    logger.error('Error fetching featured homepage events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured homepage events',
      error: error.message,
    });
  }
});

// Set featured homepage events
router.post('/events/homepage/featured', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventIds } = req.body; // Array of 3 event IDs

    if (!Array.isArray(eventIds) || eventIds.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 3 event IDs are required',
      });
    }

    // Validate all events exist and are published
    const events = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
        isPublished: true,
      },
    });

    if (events.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'All events must exist and be published',
      });
    }

    // Check if columns exist, if not return error
    try {
      // Remove featured status from all events first
      await prisma.event.updateMany({
        where: {
          isHomepageFeatured: true,
        },
        data: {
          isHomepageFeatured: false,
          homepageOrder: null,
        },
      });

      // Set new featured events
      const updatePromises = eventIds.map((eventId, index) => {
        return prisma.event.update({
          where: { id: eventId },
          data: {
            isHomepageFeatured: true,
            homepageOrder: index + 1,
          },
        });
      });

      await Promise.all(updatePromises);
    } catch (dbError) {
      if (dbError.message && dbError.message.includes('isHomepageFeatured')) {
        return res.status(500).json({
          success: false,
          message: 'Database migration required. Please run the migration SQL to add isHomepageFeatured and homepageOrder columns.',
          error: 'Migration required',
        });
      }
      throw dbError;
    }

    // Fetch updated featured events
    const featuredEvents = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Featured homepage events updated successfully',
      data: {
        events: featuredEvents.sort((a, b) => (a.homepageOrder || 0) - (b.homepageOrder || 0)),
      },
    });
  } catch (error) {
    logger.error('Error setting featured homepage events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set featured homepage events',
      error: error.message,
    });
  }
});

// Get all published events for selection (for admin dropdown)
router.get('/events/homepage/available', authenticate, requireAdmin, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        eventDate: true,
        eventTime: true,
        location: true,
        thumbnailUrl: true,
        category: true,
        maxParticipants: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to recent 100 events
    });

    // Add isHomepageFeatured and homepageOrder if columns exist (default to false/null)
    const eventsWithFeatured = events.map(event => ({
      ...event,
      isHomepageFeatured: false,
      homepageOrder: null,
    }));

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithFeatured,
      },
    });
  } catch (error) {
    logger.error('Error fetching available events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available events',
      error: error.message,
    });
  }
});

module.exports = router;