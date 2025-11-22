const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middlewares/auth');
const { validateUUID } = require('../middlewares/validation');
const logger = require('../config/logger');

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      isRead,
      search,
    } = req.query;

    const result = await Notification.findByUserId(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      search,
    });

    res.json({
      success: true,
      data: {
        notifications: result.notifications.map(n => n.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit)),
        },
        unreadCount: result.unreadCount,
        hasMore: result.hasMore,
        currentPage: result.currentPage,
      },
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, validateUUID, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      data: {
        notification: notification.toJSON(),
      },
    });
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, validateUUID, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.delete();

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
});

// Delete all notifications
router.delete('/', authenticate, async (req, res) => {
  try {
    await Notification.deleteAll(req.user.id);

    res.json({
      success: true,
      message: 'All notifications deleted successfully',
    });
  } catch (error) {
    logger.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications',
      error: error.message,
    });
  }
});

// Get notification types for organizer
router.get('/types', authenticate, async (req, res) => {
  try {
    const types = [
      {
        id: 'EVENT_APPROVED',
        name: 'Event Approved',
        description: 'Your event has been approved',
        icon: 'check_circle',
        color: 'green',
      },
      {
        id: 'EVENT_REJECTED',
        name: 'Event Rejected',
        description: 'Your event has been rejected',
        icon: 'cancel',
        color: 'red',
      },
      {
        id: 'REGISTRATION_RECEIVED',
        name: 'New Registration',
        description: 'Someone registered for your event',
        icon: 'person_add',
        color: 'blue',
      },
      {
        id: 'PAYMENT_RECEIVED',
        name: 'Payment Received',
        description: 'Payment received for your event',
        icon: 'payment',
        color: 'green',
      },
      {
        id: 'EVENT_REMINDER',
        name: 'Event Reminder',
        description: 'Your event is starting soon',
        icon: 'schedule',
        color: 'orange',
      },
      {
        id: 'SYSTEM_UPDATE',
        name: 'System Update',
        description: 'Important system updates',
        icon: 'info',
        color: 'blue',
      },
    ];

    res.json({
      success: true,
      data: {
        types,
      },
    });
  } catch (error) {
    logger.error('Get notification types error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification types',
      error: error.message,
    });
  }
});

// Get notification settings
router.get('/settings', authenticate, async (req, res) => {
  try {
    // In a real app, these would come from the database
    const settings = {
      email: {
        eventApproved: true,
        eventRejected: true,
        newRegistration: true,
        paymentReceived: true,
        eventReminder: true,
        systemUpdate: false,
      },
      push: {
        eventApproved: true,
        eventRejected: true,
        newRegistration: true,
        paymentReceived: true,
        eventReminder: true,
        systemUpdate: true,
      },
      inApp: {
        eventApproved: true,
        eventRejected: true,
        newRegistration: true,
        paymentReceived: true,
        eventReminder: true,
        systemUpdate: true,
      },
    };

    res.json({
      success: true,
      data: {
        settings,
      },
    });
  } catch (error) {
    logger.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings',
      error: error.message,
    });
  }
});

// Update notification settings
router.patch('/settings', authenticate, async (req, res) => {
  try {
    const settings = req.body;

    // Validate settings structure
    if (!settings.email || !settings.push || !settings.inApp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings structure',
      });
    }

    // In a real app, store these settings in the database
    logger.info(`Notification settings updated for user ${req.user.id}:`, settings);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: {
        settings,
      },
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message,
    });
  }
});

module.exports = router;