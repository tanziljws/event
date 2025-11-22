const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Get all global certificate templates
const getGlobalCertificateTemplates = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      isDefault,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    const [templates, total] = await Promise.all([
      prisma.globalCertificateTemplate.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.globalCertificateTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Get global certificate templates error:', error);
    throw error;
  }
};

// Get default global certificate template
const getDefaultGlobalCertificateTemplate = async () => {
  try {
    const template = await prisma.globalCertificateTemplate.findFirst({
      where: {
        isDefault: true,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('No default certificate template found');
    }

    return template;
  } catch (error) {
    logger.error('Get default global certificate template error:', error);
    throw error;
  }
};

// Get global certificate template by ID
const getGlobalCertificateTemplateById = async (templateId) => {
  try {
    const template = await prisma.globalCertificateTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('Certificate template not found');
    }

    return template;
  } catch (error) {
    logger.error('Get global certificate template by ID error:', error);
    throw error;
  }
};

// Create global certificate template
const createGlobalCertificateTemplate = async (templateData, creatorId) => {
  try {
    const {
      name,
      description,
      backgroundImage,
      backgroundSize = 'cover',
      elements,
    } = templateData;

    // Validate required fields
    if (!name || !elements || !Array.isArray(elements)) {
      throw new Error('Name and elements array are required');
    }

    // If this is being set as default, unset other defaults
    if (templateData.isDefault) {
      await prisma.globalCertificateTemplate.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const template = await prisma.globalCertificateTemplate.create({
      data: {
        name,
        description,
        backgroundImage,
        backgroundSize,
        elements,
        isDefault: templateData.isDefault || false,
        isActive: templateData.isActive !== undefined ? templateData.isActive : true,
        createdBy: creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Global certificate template created: ${template.id} by user: ${creatorId}`);

    return template;
  } catch (error) {
    logger.error('Create global certificate template error:', error);
    throw error;
  }
};

// Update global certificate template
const updateGlobalCertificateTemplate = async (templateId, templateData, updaterId) => {
  try {
    const existingTemplate = await prisma.globalCertificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      throw new Error('Certificate template not found');
    }

    // If this is being set as default, unset other defaults
    if (templateData.isDefault) {
      await prisma.globalCertificateTemplate.updateMany({
        where: {
          isDefault: true,
          id: { not: templateId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedTemplate = await prisma.globalCertificateTemplate.update({
      where: { id: templateId },
      data: {
        ...templateData,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Global certificate template updated: ${templateId} by user: ${updaterId}`);

    return updatedTemplate;
  } catch (error) {
    logger.error('Update global certificate template error:', error);
    throw error;
  }
};

// Delete global certificate template
const deleteGlobalCertificateTemplate = async (templateId, deleterId) => {
  try {
    const existingTemplate = await prisma.globalCertificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      throw new Error('Certificate template not found');
    }

    // Don't allow deletion of default template
    if (existingTemplate.isDefault) {
      throw new Error('Cannot delete default certificate template');
    }

    const deletedTemplate = await prisma.globalCertificateTemplate.delete({
      where: { id: templateId },
    });

    logger.info(`Global certificate template deleted: ${templateId} by user: ${deleterId}`);

    return deletedTemplate;
  } catch (error) {
    logger.error('Delete global certificate template error:', error);
    throw error;
  }
};

// Set template as default
const setDefaultGlobalCertificateTemplate = async (templateId, updaterId) => {
  try {
    const existingTemplate = await prisma.globalCertificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      throw new Error('Certificate template not found');
    }

    if (!existingTemplate.isActive) {
      throw new Error('Cannot set inactive template as default');
    }

    // Unset other defaults
    await prisma.globalCertificateTemplate.updateMany({
      where: {
        isDefault: true,
        id: { not: templateId },
      },
      data: {
        isDefault: false,
      },
    });

    // Set this template as default
    const updatedTemplate = await prisma.globalCertificateTemplate.update({
      where: { id: templateId },
      data: {
        isDefault: true,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Global certificate template set as default: ${templateId} by user: ${updaterId}`);

    return updatedTemplate;
  } catch (error) {
    logger.error('Set default global certificate template error:', error);
    throw error;
  }
};

// Get template usage statistics
const getTemplateUsageStats = async (templateId) => {
  try {
    const template = await prisma.globalCertificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Certificate template not found');
    }

    // Count events using this template (events with generateCertificate = true)
    const eventsUsingTemplate = await prisma.event.count({
      where: {
        generateCertificate: true,
      },
    });

    // Count total certificates generated (this would need to be calculated based on actual usage)
    const totalCertificates = await prisma.certificate.count();

    return {
      templateId,
      templateName: template.name,
      eventsUsingTemplate,
      totalCertificates,
      isDefault: template.isDefault,
      isActive: template.isActive,
    };
  } catch (error) {
    logger.error('Get template usage stats error:', error);
    throw error;
  }
};

module.exports = {
  getGlobalCertificateTemplates,
  getDefaultGlobalCertificateTemplate,
  getGlobalCertificateTemplateById,
  createGlobalCertificateTemplate,
  updateGlobalCertificateTemplate,
  deleteGlobalCertificateTemplate,
  setDefaultGlobalCertificateTemplate,
  getTemplateUsageStats,
};

