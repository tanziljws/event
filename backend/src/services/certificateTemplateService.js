const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Get certificate templates for events
const getCertificateTemplates = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      eventId,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {};
    if (eventId) {
      where.eventId = eventId;
    }

    const [templates, total] = await Promise.all([
      prisma.certificateTemplate.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true,
              isPublished: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.certificateTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Get certificate templates error:', error);
    throw error;
  }
};

// Get certificate template for specific event
const getCertificateTemplate = async (eventId) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Certificate template not found');
    }

    return template;
  } catch (error) {
    logger.error('Get certificate template error:', error);
    throw error;
  }
};

// Save certificate template for event
const saveCertificateTemplate = async (eventId, templateData) => {
  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Check if template already exists
    const existingTemplate = await prisma.certificateTemplate.findUnique({
      where: { eventId },
    });

    if (existingTemplate) {
      // Update existing template
      const updatedTemplate = await prisma.certificateTemplate.update({
        where: { eventId },
        data: {
          backgroundImage: templateData.backgroundImage,
          backgroundSize: templateData.backgroundSize || 'cover',
          elements: templateData.elements,
          updatedAt: new Date(),
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true,
              isPublished: true,
            },
          },
        },
      });

      logger.info(`Certificate template updated for event: ${eventId}`);
      return updatedTemplate;
    } else {
      // Create new template
      const newTemplate = await prisma.certificateTemplate.create({
        data: {
          eventId,
          backgroundImage: templateData.backgroundImage,
          backgroundSize: templateData.backgroundSize || 'cover',
          elements: templateData.elements,
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true,
              isPublished: true,
            },
          },
        },
      });

      logger.info(`Certificate template created for event: ${eventId}`);
      return newTemplate;
    }
  } catch (error) {
    logger.error('Save certificate template error:', error);
    throw error;
  }
};

// Update certificate template for event
const updateCertificateTemplate = async (eventId, templateData) => {
  try {
    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { eventId },
      data: {
        backgroundImage: templateData.backgroundImage,
        backgroundSize: templateData.backgroundSize || 'cover',
        elements: templateData.elements,
        updatedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
          },
        },
      },
    });

    logger.info(`Certificate template updated for event: ${eventId}`);
    return updatedTemplate;
  } catch (error) {
    logger.error('Update certificate template error:', error);
    throw error;
  }
};

// Delete certificate template for event
const deleteCertificateTemplate = async (eventId) => {
  try {
    const deletedTemplate = await prisma.certificateTemplate.delete({
      where: { eventId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Certificate template deleted for event: ${eventId}`);
    return deletedTemplate;
  } catch (error) {
    logger.error('Delete certificate template error:', error);
    throw error;
  }
};

// Get events with certificate template status
const getEventsWithTemplateStatus = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'eventDate',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          certificateTemplate: {
            select: {
              id: true,
              backgroundImage: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      prisma.event.count(),
    ]);

    // Add template status to events
    const eventsWithStatus = events.map(event => ({
      ...event,
      hasCertificateTemplate: !!event.certificateTemplate,
      participantCount: event._count.registrations,
    }));

    return {
      events: eventsWithStatus,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Get events with template status error:', error);
    throw error;
  }
};

module.exports = {
  getCertificateTemplates,
  getCertificateTemplate,
  saveCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate,
  getEventsWithTemplateStatus,
};
