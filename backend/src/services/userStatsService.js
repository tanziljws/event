const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Get user dashboard stats
const getUserDashboardStats = async (userId) => {
  try {
    logger.info(`Getting dashboard stats for user: ${userId}`);

    // Get user's event registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: { participantId: userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            isPublished: true
          }
        }
      }
    });

    // Get user's certificates through registrations
    const certificates = await prisma.certificate.findMany({
      where: {
        registration: {
          participantId: userId
        }
      },
      select: {
        id: true,
        certificateNumber: true,
        issuedAt: true,
        registration: {
          select: {
            event: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    // Calculate stats
    const totalRegistrations = registrations.length;
    const totalCertificates = certificates.length;
    const attendedEvents = registrations.filter(reg => reg.hasAttended).length;

    // Get recent registrations (last 5)
    const recentRegistrations = registrations
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(reg => ({
        id: reg.id,
        eventTitle: reg.event.title,
        eventDate: reg.event.eventDate,
        status: reg.hasAttended ? 'Attended' : 'Registered',
        registeredAt: reg.createdAt
      }));

    // Get recent certificates (last 5)
    const recentCertificates = certificates
      .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
      .slice(0, 5)
      .map(cert => ({
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        eventTitle: cert.registration.event.title,
        issuedAt: cert.issuedAt
      }));

    const stats = {
      totalRegistrations,
      totalCertificates,
      attendedEvents,
      recentRegistrations,
      recentCertificates
    };

    logger.info(`User dashboard stats generated:`, stats);
    return stats;
  } catch (error) {
    logger.error('Get user dashboard stats error:', error);
    throw error;
  }
};

module.exports = {
  getUserDashboardStats
};
