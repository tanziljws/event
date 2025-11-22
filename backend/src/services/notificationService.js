const { prisma } = require('../config/database');
const logger = require('../config/logger');

class NotificationService {
  async createNotification(userId, type, title, message, data = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
          sentAt: new Date()
        }
      });

      logger.info(`Notification created: ${type} for user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        unreadOnly = false,
        type = null
      } = options;

      // Valid notification types from Prisma schema
      const validTypes = [
        'EVENT_REMINDER_H1',
        'EVENT_REMINDER_H0',
        'REGISTRATION_CONFIRMED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'CERTIFICATE_READY',
        'EVENT_CANCELLED',
        'EVENT_UPDATED',
        'UPGRADE_APPROVED',
        'UPGRADE_REJECTED',
        'NEW_REGISTRATION',
        'GENERAL'
      ];

      // Only include type filter if it's a valid type
      const validatedType = type && validTypes.includes(type) ? type : null;

      const where = {
        userId,
        ...(unreadOnly && { isRead: false }),
        ...(validatedType && { type: validatedType })
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications,
        total,
        hasMore: offset + notifications.length < total
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      logger.info(`Marked ${result.count} notifications as read for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Create notification for organizer when new user registers for their event
  async createNewRegistrationNotification(registrationId, eventId, participantId) {
    try {
      // Get event details and organizer info
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Get participant details
      const participant = await prisma.user.findUnique({
        where: { id: participantId },
        select: {
          id: true,
          fullName: true,
          email: true
        }
      });

      if (!participant) {
        throw new Error('Participant not found');
      }

      // Create notification for organizer
      const notification = await prisma.notification.create({
        data: {
          userId: event.createdBy,
          type: 'NEW_REGISTRATION',
          title: 'Pendaftaran Baru',
          message: `${participant.fullName} baru saja mendaftar untuk event "${event.title}"`,
          data: {
            eventId: event.id,
            eventTitle: event.title,
            registrationId: registrationId,
            participantId: participant.id,
            participantName: participant.fullName,
            participantEmail: participant.email,
            registeredAt: new Date().toISOString()
          },
          sentAt: new Date()
        }
      });

      logger.info(`New registration notification created for organizer ${event.createdBy}: ${participant.fullName} registered for ${event.title}`);
      
      return notification;
    } catch (error) {
      logger.error('Error creating new registration notification:', error);
      throw error;
    }
  }

  // Create payment success notification (existing function reference)
  async createPaymentSuccessNotification(paymentId) {
    try {
      // Get payment details with registration info
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          registration: {
            include: {
              event: {
                include: {
                  creator: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true
                    }
                  }
                }
              },
              participant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Create notification for participant
      const participantNotification = await prisma.notification.create({
        data: {
          userId: payment.registration.participantId,
          type: 'PAYMENT_SUCCESS',
          title: 'Pembayaran Berhasil',
          message: `Pembayaran untuk event "${payment.registration.event.title}" berhasil diproses`,
          data: {
            paymentId: payment.id,
            eventId: payment.registration.event.id,
            eventTitle: payment.registration.event.title,
            amount: payment.amount,
            paidAt: new Date().toISOString()
          },
          sentAt: new Date()
        }
      });

      // Create notification for organizer
      const organizerNotification = await prisma.notification.create({
        data: {
          userId: payment.registration.event.createdBy,
          type: 'PAYMENT_SUCCESS',
          title: 'Pembayaran Diterima',
          message: `${payment.registration.participant.fullName} telah membayar untuk event "${payment.registration.event.title}"`,
          data: {
            paymentId: payment.id,
            eventId: payment.registration.event.id,
            eventTitle: payment.registration.event.title,
            participantId: payment.registration.participantId,
            participantName: payment.registration.participant.fullName,
            amount: payment.amount,
            paidAt: new Date().toISOString()
          },
          sentAt: new Date()
        }
      });

      logger.info(`Payment success notifications created for participant ${payment.registration.participantId} and organizer ${payment.registration.event.createdBy}`);
      
      return {
        participantNotification,
        organizerNotification
      };
    } catch (error) {
      logger.error('Error creating payment success notification:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalNotifications,
        unreadNotifications,
        todayNotifications,
        weekNotifications,
        monthNotifications,
        notificationsByType
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { isRead: false } }),
        prisma.notification.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.notification.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.notification.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.notification.groupBy({
          by: ['type'],
          _count: { type: true }
        })
      ]);

      return {
        total: totalNotifications,
        unread: unreadNotifications,
        today: todayNotifications,
        thisWeek: weekNotifications,
        thisMonth: monthNotifications,
        byType: notificationsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();