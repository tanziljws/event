const adminService = require('../services/adminService');
const logger = require('../config/logger');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;
    const stats = await adminService.getDashboardStats(adminId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
    });
  }
};

// Get monthly event statistics - ALL events
const getMonthlyEventStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    logger.info('Controller: Getting monthly event stats for year:', year);

    // Get real data from service
    const stats = await adminService.getMonthlyEventStats(year);

    logger.info('Controller: Monthly event stats generated:', stats);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    logger.error('Get monthly event stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly event statistics',
    });
  }
};

// Get monthly participant statistics - ALL participants who attended
const getMonthlyParticipantStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get real data from service
    const stats = await adminService.getMonthlyParticipantStats(year);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    logger.error('Get monthly participant stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly participant statistics',
    });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      search: req.query.q,
      role: req.query.role,
      emailVerified: req.query.emailVerified,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await adminService.getAllUsers(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

// Get event participants
const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      search: req.query.q,
      hasAttended: req.query.hasAttended,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await adminService.getEventParticipants(id, adminId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get event participants error:', error);
    if (error.message === 'Event not found' || error.message === 'You can only view participants of your own events') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event participants',
    });
  }
};

// Export event participants to CSV
const exportEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await adminService.exportEventParticipants(id, adminId);

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (error) {
    logger.error('Export event participants error:', error);
    if (error.message === 'Event not found' || error.message === 'You can only export participants of your own events') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to export event participants',
    });
  }
};

// Get activity logs
const getActivityLogs = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      userId: req.query.userId,
      action: req.query.action,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await adminService.getActivityLogs(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
    });
  }
};

// Event management methods
const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const events = await adminService.getAllEvents({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    logger.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await adminService.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Get event by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
    });
  }
};

const createEvent = async (req, res) => {
  try {
    const adminId = req.user.id;
    const eventData = { ...req.body, createdBy: adminId };
    const event = await adminService.createEvent(eventData);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    const event = await adminService.updateEvent(id, eventData);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteEvent(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
    });
  }
};

const toggleEventPublish = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await adminService.toggleEventPublish(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Toggle event publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle event publish status',
    });
  }
};

// Get monthly analytics data
const getMonthlyAnalytics = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const timeRange = req.query.timeRange || 'current-month';
    logger.info('Controller: Getting monthly analytics for year:', year, 'timeRange:', timeRange);

    const analytics = await adminService.getMonthlyAnalytics(year, timeRange);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Get monthly analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly analytics',
    });
  }
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
