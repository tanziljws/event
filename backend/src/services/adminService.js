const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Get dashboard statistics
const getDashboardStats = async (adminId) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get ALL events (not just admin's events)
    const allEvents = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Get ALL users
    const allUsers = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
      },
    });

    // Get ALL registrations
    const allRegistrations = await prisma.eventRegistration.findMany({
      include: {
        event: true,
        participant: true,
      },
    });

    // Get ALL payments
    const allPayments = await prisma.payment.findMany({
      include: {
        registration: {
          include: {
            event: true,
          },
        },
      },
    });

    // Total events
    const totalEvents = allEvents.length;

    // Published events
    const publishedEvents = allEvents.filter(event => event.isPublished).length;

    // Total participants
    const totalParticipants = allUsers.length;

    // Total registrations
    const totalRegistrations = allRegistrations.length;

    // Total revenue
    const totalRevenue = allPayments
      .filter(payment => payment.paymentStatus === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Events this month
    const eventsThisMonth = allEvents.filter(event => 
      event.createdAt >= startOfMonth
    ).length;

    // Events this year
    const eventsThisYear = allEvents.filter(event => 
      event.createdAt >= startOfYear
    ).length;

    // Upcoming events (next 30 days)
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.eventDate);
      const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      return eventDate > now && eventDate <= thirtyDaysFromNow;
    }).length;

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const recentRegistrations = allRegistrations.filter(reg => 
      reg.registeredAt >= sevenDaysAgo
    ).length;

    // Top 10 events by participant count
    const topEvents = allEvents
      .sort((a, b) => b._count.registrations - a._count.registrations)
      .slice(0, 10)
      .map(event => ({
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        participantCount: event._count.registrations,
        isPublished: event.isPublished,
        creator: event.creator,
      }));

    return {
      totalEvents,
      publishedEvents,
      totalParticipants,
      totalRegistrations,
      totalRevenue,
      eventsThisMonth,
      eventsThisYear,
      upcomingEvents,
      recentRegistrations,
      topEvents,
    };
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    throw error;
  }
};

// Get monthly event statistics - ALL events
const getMonthlyEventStats = async (year = new Date().getFullYear()) => {
  try {
    logger.info('Getting monthly event stats for year:', year);
    
    // Get real data from database
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    
    const events = await prisma.event.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group events by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthName = new Date(year, i).toLocaleString('default', { month: 'long' });
      
      const eventCount = events.filter(event => {
        const eventMonth = event.createdAt.getMonth() + 1;
        return eventMonth === month;
      }).length;
      
      return {
        month,
        monthName,
        eventCount
      };
    });

    logger.info('Monthly event stats generated:', monthlyData);
    return monthlyData;
  } catch (error) {
    logger.error('Get monthly event stats error:', error);
    throw error;
  }
};

// Get monthly participant statistics - ALL participants who attended
const getMonthlyParticipantStats = async (year = new Date().getFullYear()) => {
  try {
    logger.info('Getting monthly participant stats for year:', year);
    
    // Get real data from database - participants who attended events
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    
    const attendances = await prisma.eventRegistration.findMany({
      where: {
        hasAttended: true,
        attendedAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      select: {
        attendedAt: true
      }
    });

    // Group attendances by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthName = new Date(year, i).toLocaleString('default', { month: 'long' });
      
      const participantCount = attendances.filter(attendance => {
        const attendanceMonth = attendance.attendedAt.getMonth() + 1;
        return attendanceMonth === month;
      }).length;
      
      return {
        month,
        monthName,
        participantCount
      };
    });

    logger.info('Monthly participant stats generated:', monthlyData);
    return monthlyData;
  } catch (error) {
    logger.error('Get monthly participant stats error:', error);
    throw error;
  }
};

// Get all users (Admin only)
const getAllUsers = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      role,
      emailVerified,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // emailVerified filter removed - all users are auto-verified after OTP registration

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          emailVerified: true,
          lastActivity: true,
          createdAt: true,
          _count: {
            select: {
              eventRegistrations: true,
              createdEvents: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get all users error:', error);
    throw error;
  }
};

// Get event participants
const getEventParticipants = async (eventId, adminId, filters = {}) => {
  try {
    // Verify admin owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.createdBy !== adminId) {
      throw new Error('You can only view participants of your own events');
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'registeredAt',
      sortOrder = 'desc',
      search,
      hasAttended,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = { eventId };

    if (search) {
      where.participant = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (hasAttended !== undefined) {
      where.hasAttended = hasAttended;
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [participants, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          participant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              address: true,
              lastEducation: true,
            },
          },
        },
      }),
      prisma.eventRegistration.count({ where }),
    ]);

    return {
      participants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get event participants error:', error);
    throw error;
  }
};

// Export event participants to CSV
const exportEventParticipants = async (eventId, adminId) => {
  try {
    // Verify admin owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.createdBy !== adminId) {
      throw new Error('You can only export participants of your own events');
    }

    const participants = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            address: true,
            lastEducation: true,
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    // Convert to CSV format
    const csvHeaders = [
      'No',
      'Full Name',
      'Email',
      'Phone Number',
      'Address',
      'Last Education',
      'Registration Token',
      'Has Attended',
      'Attendance Time',
      'Registered At',
    ];

    const csvRows = participants.map((participant, index) => [
      index + 1,
      participant.participant.fullName,
      participant.participant.email,
      participant.participant.phoneNumber || '',
      participant.participant.address || '',
      participant.participant.lastEducation || '',
      participant.registrationToken,
      participant.hasAttended ? 'Yes' : 'No',
      participant.attendanceTime ? participant.attendanceTime.toISOString() : '',
      participant.registeredAt.toISOString(),
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      filename: `event_${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_participants_${new Date().toISOString().split('T')[0]}.csv`,
      content: csvContent,
      mimeType: 'text/csv',
    };
  } catch (error) {
    logger.error('Export event participants error:', error);
    throw error;
  }
};

// Get activity logs
const getActivityLogs = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      action,
      dateFrom,
      dateTo,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get activity logs error:', error);
    throw error;
  }
};

// Event management methods
const getAllEvents = async ({ page, limit, search, sortBy, sortOrder }) => {
  try {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const orderBy = {};
    if (sortBy === 'eventDate') {
      orderBy.eventDate = sortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'maxParticipants') {
      orderBy.maxParticipants = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get all events error:', error);
    throw error;
  }
};

const getEventById = async (id) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return event;
  } catch (error) {
    logger.error('Get event by id error:', error);
    throw error;
  }
};

const createEvent = async (eventData) => {
  try {
    const event = await prisma.event.create({
      data: eventData,
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return event;
  } catch (error) {
    logger.error('Create event error:', error);
    throw error;
  }
};

const updateEvent = async (id, eventData) => {
  try {
    const event = await prisma.event.update({
      where: { id },
      data: eventData,
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return event;
  } catch (error) {
    logger.error('Update event error:', error);
    throw error;
  }
};

const deleteEvent = async (id) => {
  try {
    await prisma.event.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    logger.error('Delete event error:', error);
    throw error;
  }
};

const toggleEventPublish = async (id) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return null;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        isPublished: !event.isPublished,
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return updatedEvent;
  } catch (error) {
    logger.error('Toggle event publish error:', error);
    throw error;
  }
};

// Get monthly analytics data with smart time range
const getMonthlyAnalytics = async (year = new Date().getFullYear(), timeRange = 'current-month') => {
  try {
    logger.info('Getting monthly analytics for year:', year, 'timeRange:', timeRange);
    
    // Get real data from database (same as getDashboardStats)
    const allEvents = await prisma.event.findMany({
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    const allUsers = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
      },
    });

    const allRegistrations = await prisma.eventRegistration.findMany({
      include: {
        event: true,
        participant: true,
      },
    });

    const allPayments = await prisma.payment.findMany({
      include: {
        registration: {
          include: {
            event: true,
          },
        },
      },
    });

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate, endDate, targetYear;
    
    switch (timeRange) {
      case 'current-month':
        targetYear = now.getFullYear();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        targetYear = lastMonth.getFullYear();
        startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last-year':
        targetYear = now.getFullYear() - 1;
        startDate = new Date(targetYear, 0, 1);
        endDate = new Date(targetYear, 11, 31, 23, 59, 59);
        break;
      case 'custom':
      default:
        targetYear = year;
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        break;
    }

    // Filter data by calculated date range
    const yearEvents = allEvents.filter(event => 
      event.createdAt >= startDate && event.createdAt <= endDate
    );

    const yearRegistrations = allRegistrations.filter(reg => 
      reg.registeredAt >= startDate && reg.registeredAt <= endDate
    );

    const yearPayments = allPayments.filter(payment => 
      payment.createdAt >= startDate && payment.createdAt <= endDate &&
      payment.paymentStatus === 'PAID'
    );

    const yearUsers = allUsers.filter(user => 
      user.createdAt >= startDate && user.createdAt <= endDate
    );

    // Process monthly data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
      monthlyData[i + 1] = {
        registrations: 0,
        events: 0,
        revenue: 0
      };
    }

    // Count registrations by month
    yearRegistrations.forEach(reg => {
      const month = reg.registeredAt.getMonth() + 1;
      monthlyData[month].registrations++;
    });

    // Count events by month
    yearEvents.forEach(event => {
      const month = event.createdAt.getMonth() + 1;
      monthlyData[month].events++;
    });

    // Sum revenue by month
    yearPayments.forEach(payment => {
      const month = payment.createdAt.getMonth() + 1;
      monthlyData[month].revenue += Number(payment.amount);
    });

    const registrationTrends = monthNames.map((month, index) => ({
      month,
      registrations: monthlyData[index + 1].registrations,
      events: monthlyData[index + 1].events
    }));

    const revenueData = monthNames.map((month, index) => ({
      month,
      revenue: monthlyData[index + 1].revenue
    }));

    // Event categories (from year events)
    const categoryCount = {};
    yearEvents.forEach(event => {
      categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
    });

    const eventCategories = Object.entries(categoryCount).map(([category, count]) => ({
      name: category,
      value: count,
      color: getCategoryColor(category)
    }));

    // Process demographics (from year users)
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46+': 0
    };

    yearUsers.forEach(user => {
      const age = new Date().getFullYear() - user.createdAt.getFullYear();
      if (age >= 18 && age <= 25) ageGroups['18-25']++;
      else if (age >= 26 && age <= 35) ageGroups['26-35']++;
      else if (age >= 36 && age <= 45) ageGroups['36-45']++;
      else ageGroups['46+']++;
    });

    const totalParticipants = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);
    const participantDemographics = Object.entries(ageGroups).map(([age, count]) => ({
      age,
      count,
      percentage: totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0
    }));

    logger.info('Returning REAL analytics data for year', year, ':', { 
      totalRegistrations: yearRegistrations.length,
      totalEvents: yearEvents.length,
      totalPayments: yearPayments.length,
      totalUsers: yearUsers.length
    });

    return {
      registrationTrends,
      revenueData,
      eventCategories,
      participantDemographics
    };
  } catch (error) {
    logger.error('Get monthly analytics error:', error);
    throw error;
  }
};

// Helper function to get category color
const getCategoryColor = (category) => {
  const colorMap = {
    'TECHNOLOGY': 'bg-blue-500',
    'BUSINESS': 'bg-green-500',
    'EDUCATION': 'bg-purple-500',
    'ENTERTAINMENT': 'bg-orange-500',
    'HEALTH': 'bg-pink-500',
    'ACADEMIC': 'bg-cyan-500',
    'SPORTS': 'bg-yellow-500',
    'ARTS': 'bg-indigo-500',
    'CULTURE': 'bg-red-500',
    'OTHER': 'bg-gray-500'
  };
  return colorMap[category] || 'bg-gray-500';
};

module.exports = {
  getDashboardStats,
  getMonthlyEventStats,
  getMonthlyParticipantStats,
  getAllUsers,
  getEventParticipants,
  exportEventParticipants,
  getActivityLogs,
  // Event management
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventPublish,
  // Analytics
  getMonthlyAnalytics,
};
