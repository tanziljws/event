const cron = require('node-cron');
const { prisma } = require('../config/database');
const notificationService = require('../services/notificationService');
const logger = require('../config/logger');

// H-1 Reminder (1 hari sebelum event) - Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('Running H-1 event reminder job...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find events happening tomorrow
    const events = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: tomorrow,
          lt: nextDay
        },
        isPublished: true,
        status: 'APPROVED'
      },
      include: {
        registrations: {
          where: {
            status: 'ACTIVE'
          },
          include: {
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

    logger.info(`Found ${events.length} events for H-1 reminders`);

    for (const event of events) {
      for (const registration of event.registrations) {
        try {
          await notificationService.createNotification(
            registration.participant.id,
            'EVENT_REMINDER_H1',
            'Event Reminder - Tomorrow',
            `Don't forget! "${event.title}" starts tomorrow at ${event.eventTime} in ${event.location}`,
            {
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.eventDate,
              eventTime: event.eventTime,
              location: event.location,
              registrationId: registration.id
            }
          );
        } catch (error) {
          logger.error(`Error creating H-1 reminder for user ${registration.participant.id}:`, error);
        }
      }
    }

    logger.info(`H-1 reminder job completed. Processed ${events.length} events`);
  } catch (error) {
    logger.error('H-1 reminder job error:', error);
  }
});

// H-0 Reminder (1 jam sebelum event) - Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running H-0 event reminder job...');

    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Find events happening in the next hour
    const events = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: oneHourFromNow,
          lt: twoHoursFromNow
        },
        isPublished: true,
        status: 'APPROVED'
      },
      include: {
        registrations: {
          where: {
            status: 'ACTIVE'
          },
          include: {
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

    logger.info(`Found ${events.length} events for H-0 reminders`);

    for (const event of events) {
      for (const registration of event.registrations) {
        try {
          await notificationService.createNotification(
            registration.participant.id,
            'EVENT_REMINDER_H0',
            'Event Starting Soon',
            `"${event.title}" starts in 1 hour at ${event.eventTime} in ${event.location}`,
            {
              eventId: event.id,
              eventTitle: event.title,
              eventDate: event.eventDate,
              eventTime: event.eventTime,
              location: event.location,
              registrationId: registration.id
            }
          );
        } catch (error) {
          logger.error(`Error creating H-0 reminder for user ${registration.participant.id}:`, error);
        }
      }
    }

    logger.info(`H-0 reminder job completed. Processed ${events.length} events`);
  } catch (error) {
    logger.error('H-0 reminder job error:', error);
  }
});

// Cleanup old notifications - Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('Running notification cleanup job...');

    const result = await notificationService.deleteOldNotifications(30);

    logger.info(`Notification cleanup completed. Deleted ${result.count} old notifications`);
  } catch (error) {
    logger.error('Notification cleanup job error:', error);
  }
});

// Only log if jobs are scheduled (they run automatically when module is loaded)
if (process.env.NODE_ENV !== 'test') {
  logger.info('✅ Event reminder jobs scheduled:');
  logger.info('  - H-1 reminders: Daily at 9:00 AM');
  logger.info('  - H-0 reminders: Every hour');
  logger.info('  - Cleanup: Daily at 2:00 AM');
}
