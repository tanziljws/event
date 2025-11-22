const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

class NotificationController {
  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false, 
        type = null 
      } = req.query;

      const offset = (page - 1) * limit;
      
      const result = await notificationService.getUserNotifications(userId, {
        limit: parseInt(limit),
        offset,
        unreadOnly: unreadOnly === 'true',
        type
      });

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / limit),
            hasMore: result.hasMore
          }
        }
      });
    } catch (error) {
      logger.error('Get user notifications error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get notifications'
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;

      await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark notification as read'
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `Marked ${result.count} notifications as read`,
        data: { count: result.count }
      });
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark all notifications as read'
      });
    }
  }

  // Get unread notification count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get unread count'
      });
    }
  }
}

module.exports = new NotificationController();
