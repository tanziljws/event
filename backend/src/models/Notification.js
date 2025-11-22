const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Notification {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.title = data.title;
    this.body = data.message || data.body; // Support both field names
    this.message = data.message || data.body; // Support both field names
    this.type = data.type;
    this.data = data.data;
    this.isRead = data.isRead;
    this.createdAt = data.createdAt;
    this.readAt = data.readAt;
  }

  static async create(data) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message || data.body,
          type: data.type,
          data: data.data || {},
          isRead: false,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      return new Notification(notification);
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      return notification ? new Notification(notification) : null;
    } catch (error) {
      throw new Error(`Failed to find notification: ${error.message}`);
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        isRead,
        search,
      } = options;

      const skip = (page - 1) * limit;

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

      // Build where clause
      const where = { userId };

      // Only add type filter if it's a valid type
      if (type && validTypes.includes(type)) {
        where.type = type;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
        prisma.notification.count({ where }),
      ]);

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return {
        notifications: notifications.map(n => new Notification(n)),
        total,
        unreadCount,
        hasMore: skip + notifications.length < total,
        currentPage: page,
      };
    } catch (error) {
      throw new Error(`Failed to find notifications: ${error.message}`);
    }
  }

  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      return count;
    } catch (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  async markAsRead() {
    try {
      const updated = await prisma.notification.update({
        where: { id: this.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      this.isRead = updated.isRead;
      this.readAt = updated.readAt;

      return this;
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  static async markAllAsRead(userId) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async delete() {
    try {
      await prisma.notification.delete({
        where: { id: this.id },
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  static async deleteAll(userId) {
    try {
      await prisma.notification.deleteMany({
        where: { userId },
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete all notifications: ${error.message}`);
    }
  }

  static async createBulk(notifications) {
    try {
      const created = await prisma.notification.createMany({
        data: notifications,
      });

      return created;
    } catch (error) {
      throw new Error(`Failed to create bulk notifications: ${error.message}`);
    }
  }

  // Static methods for creating specific notification types
  static async createEventRegistrationNotification(userId, eventData) {
    return await Notification.create({
      userId,
      title: 'Event Registration Confirmed',
      body: `You have successfully registered for "${eventData.title}". Event date: ${eventData.eventDate}`,
      type: 'event_registration',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventLocation: eventData.location,
      },
    });
  }

  static async createEventReminderNotification(userId, eventData, hoursBefore = 24) {
    return await Notification.create({
      userId,
      title: 'Event Reminder',
      body: `Don't forget! "${eventData.title}" is starting in ${hoursBefore} hours.`,
      type: 'event_reminder',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventLocation: eventData.location,
        hoursBefore,
      },
    });
  }

  static async createPaymentConfirmationNotification(userId, paymentData) {
    return await Notification.create({
      userId,
      title: 'Payment Confirmed',
      body: `Your payment of ${paymentData.amount} for "${paymentData.eventTitle}" has been confirmed.`,
      type: 'payment_confirmation',
      data: {
        paymentId: paymentData.id,
        eventId: paymentData.eventId,
        eventTitle: paymentData.eventTitle,
        amount: paymentData.amount,
        status: paymentData.status,
      },
    });
  }

  static async createEventUpdateNotification(userId, eventData) {
    return await Notification.create({
      userId,
      title: 'Event Updated',
      body: `The event "${eventData.title}" has been updated. Please check the details.`,
      type: 'event_update',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventLocation: eventData.location,
      },
    });
  }

  static async createEventCancellationNotification(userId, eventData) {
    return await Notification.create({
      userId,
      title: 'Event Cancelled',
      body: `The event "${eventData.title}" has been cancelled. You will receive a refund if applicable.`,
      type: 'event_cancellation',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventLocation: eventData.location,
      },
    });
  }

  static async createOrganizerApprovalNotification(userId, organizerData) {
    return await Notification.create({
      userId,
      title: 'Organizer Account Approved',
      body: `Congratulations! Your organizer account has been approved. You can now create and manage events.`,
      type: 'organizer_approval',
      data: {
        organizerId: organizerData.id,
        organizerName: organizerData.fullName,
        approvalDate: new Date().toISOString(),
      },
    });
  }

  static async createOrganizerRejectionNotification(userId, organizerData, reason) {
    return await Notification.create({
      userId,
      title: 'Organizer Account Rejected',
      body: `Your organizer account application has been rejected. Reason: ${reason}`,
      type: 'organizer_rejection',
      data: {
        organizerId: organizerData.id,
        organizerName: organizerData.fullName,
        reason,
        rejectionDate: new Date().toISOString(),
      },
    });
  }

  static async createSystemAnnouncementNotification(userId, announcementData) {
    return await Notification.create({
      userId,
      title: announcementData.title,
      body: announcementData.body,
      type: 'system_announcement',
      data: {
        announcementId: announcementData.id,
        priority: announcementData.priority,
      },
    });
  }

  static async createRegistrationDeadlineNotification(userId, eventData) {
    return await Notification.create({
      userId,
      title: 'Registration Deadline Approaching',
      body: `Registration for "${eventData.title}" closes soon. Don't miss out!`,
      type: 'registration_deadline',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        registrationDeadline: eventData.registrationDeadline,
      },
    });
  }

  static async createEventStartingNotification(userId, eventData) {
    return await Notification.create({
      userId,
      title: 'Event Starting Soon',
      body: `"${eventData.title}" is starting in 1 hour. Get ready!`,
      type: 'event_starting',
      data: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventLocation: eventData.location,
      },
    });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      body: this.body || this.message,
      message: this.message || this.body,
      type: this.type,
      data: this.data,
      isRead: this.isRead,
      createdAt: this.createdAt,
      readAt: this.readAt,
    };
  }
}

module.exports = Notification;
