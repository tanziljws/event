const certificateTemplateService = require('../services/certificateTemplateService');
const logger = require('../config/logger');

// Get certificate templates for events
const getCertificateTemplates = async (req, res) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      eventId: req.query.eventId,
    };

    const result = await certificateTemplateService.getCertificateTemplates(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get certificate templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate templates',
    });
  }
};

// Get certificate template for specific event
const getCertificateTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;

    const template = await certificateTemplateService.getCertificateTemplate(eventId);

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    logger.error('Get certificate template error:', error);
    if (error.message === 'Certificate template not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate template',
    });
  }
};

// Save certificate template for event
const saveCertificateTemplate = async (req, res) => {
  try {
    console.log('🔥 CONTROLLER DIPANGGIL! 🔥');
    console.log('🔥 req.method:', req.method);
    console.log('🔥 req.url:', req.url);
    console.log('🔥 req.body:', req.body);
    
    const { eventId } = req.params;
    const templateData = req.body;

    logger.info('Save certificate template request:', {
      eventId,
      templateData,
      elementsLength: templateData.elements?.length,
      elements: templateData.elements,
      elementsType: typeof templateData.elements,
      elementsIsArray: Array.isArray(templateData.elements),
      elementsStringified: JSON.stringify(templateData.elements),
      bodyKeys: Object.keys(templateData)
    });

    // Validate required fields
    if (!templateData.elements || !Array.isArray(templateData.elements)) {
      logger.error('Invalid elements data:', { 
        elements: templateData.elements,
        elementsType: typeof templateData.elements,
        elementsIsArray: Array.isArray(templateData.elements),
        elementsStringified: JSON.stringify(templateData.elements),
        bodyKeys: Object.keys(templateData),
        fullBody: JSON.stringify(templateData)
      });
      return res.status(400).json({
        success: false,
        message: 'Elements array is required',
      });
    }

    const template = await certificateTemplateService.saveCertificateTemplate(eventId, templateData);

    res.status(201).json({
      success: true,
      message: 'Certificate template saved successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Save certificate template error:', error);
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to save certificate template',
    });
  }
};

// Update certificate template for event
const updateCertificateTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const templateData = req.body;

    // Validate required fields
    if (!templateData.elements || !Array.isArray(templateData.elements)) {
      return res.status(400).json({
        success: false,
        message: 'Elements array is required',
      });
    }

    const template = await certificateTemplateService.updateCertificateTemplate(eventId, templateData);

    res.status(200).json({
      success: true,
      message: 'Certificate template updated successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Update certificate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update certificate template',
    });
  }
};

// Delete certificate template for event
const deleteCertificateTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;

    const template = await certificateTemplateService.deleteCertificateTemplate(eventId);

    res.status(200).json({
      success: true,
      message: 'Certificate template deleted successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Delete certificate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete certificate template',
    });
  }
};

// Get events with certificate template status
const getEventsWithTemplateStatus = async (req, res) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sortBy: req.query.sortBy || 'eventDate',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await certificateTemplateService.getEventsWithTemplateStatus(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get events with template status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events with template status',
    });
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
