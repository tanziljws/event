const globalCertificateTemplateService = require('../services/globalCertificateTemplateService');
const logger = require('../config/logger');

// Get all global certificate templates
const getGlobalCertificateTemplates = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      isDefault,
    } = req.query;

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      isDefault: isDefault !== undefined ? isDefault === 'true' : undefined,
    };

    const result = await globalCertificateTemplateService.getGlobalCertificateTemplates(filters);

    res.status(200).json({
      success: true,
      message: 'Global certificate templates retrieved successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Get global certificate templates controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve global certificate templates',
    });
  }
};

// Get default global certificate template
const getDefaultGlobalCertificateTemplate = async (req, res) => {
  try {
    const template = await globalCertificateTemplateService.getDefaultGlobalCertificateTemplate();

    res.status(200).json({
      success: true,
      message: 'Default global certificate template retrieved successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Get default global certificate template controller error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Default certificate template not found',
    });
  }
};

// Get global certificate template by ID
const getGlobalCertificateTemplateById = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await globalCertificateTemplateService.getGlobalCertificateTemplateById(templateId);

    res.status(200).json({
      success: true,
      message: 'Global certificate template retrieved successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Get global certificate template by ID controller error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Certificate template not found',
    });
  }
};

// Create global certificate template
const createGlobalCertificateTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    const creatorId = req.user.id;


    // Validate required fields
    if (!templateData.name) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required',
      });
    }

    if (!templateData.elements || !Array.isArray(templateData.elements)) {
      return res.status(400).json({
        success: false,
        message: 'Template elements array is required',
      });
    }

    const template = await globalCertificateTemplateService.createGlobalCertificateTemplate(
      templateData,
      creatorId
    );

    res.status(201).json({
      success: true,
      message: 'Global certificate template created successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Create global certificate template controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create global certificate template',
    });
  }
};

// Update global certificate template
const updateGlobalCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const templateData = req.body;
    const updaterId = req.user.id;

    const template = await globalCertificateTemplateService.updateGlobalCertificateTemplate(
      templateId,
      templateData,
      updaterId
    );

    res.status(200).json({
      success: true,
      message: 'Global certificate template updated successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Update global certificate template controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update global certificate template',
      });
    }
  }
};

// Delete global certificate template
const deleteGlobalCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const deleterId = req.user.id;

    await globalCertificateTemplateService.deleteGlobalCertificateTemplate(templateId, deleterId);

    res.status(200).json({
      success: true,
      message: 'Global certificate template deleted successfully',
    });
  } catch (error) {
    logger.error('Delete global certificate template controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else if (error.message === 'Cannot delete default certificate template') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete global certificate template',
      });
    }
  }
};

// Set template as default
const setDefaultGlobalCertificateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const updaterId = req.user.id;

    const template = await globalCertificateTemplateService.setDefaultGlobalCertificateTemplate(
      templateId,
      updaterId
    );

    res.status(200).json({
      success: true,
      message: 'Global certificate template set as default successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Set default global certificate template controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else if (error.message === 'Cannot set inactive template as default') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set default global certificate template',
      });
    }
  }
};

// Get template usage statistics
const getTemplateUsageStats = async (req, res) => {
  try {
    const { templateId } = req.params;

    const stats = await globalCertificateTemplateService.getTemplateUsageStats(templateId);

    res.status(200).json({
      success: true,
      message: 'Template usage statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    logger.error('Get template usage stats controller error:', error);
    if (error.message === 'Certificate template not found') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve template usage statistics',
      });
    }
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
