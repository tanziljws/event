const certificateService = require('../services/certificateService');
const logger = require('../config/logger');

// Generate certificate for attended event
const generateCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const participantId = req.user.id;

    const result = await certificateService.generateCertificate(registrationId, participantId);

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        registration: result.registration,
        certificateUrl: result.certificateUrl,
      },
    });
  } catch (error) {
    logger.error('Generate certificate error:', error);
    if (error.message === 'Registration not found or attendance not marked' ||
        error.message === 'Certificate already generated') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
    });
  }
};

// Get user's certificates
const getUserCertificates = async (req, res) => {
  try {
    const participantId = req.user.id;
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      search: req.query.q,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const result = await certificateService.getUserCertificates(participantId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get user certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
    });
  }
};

// Search certificate by token (Public)
const searchCertificateByToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    const result = await certificateService.searchCertificateByToken(token);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Search certificate by token error:', error);
    if (error.message === 'Certificate not found or not available') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to search certificate',
    });
  }
};

// Get certificate download URL
const getCertificateDownloadUrl = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const participantId = req.user.id;

    const result = await certificateService.getCertificateDownloadUrl(certificateId, participantId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get certificate download URL error:', error);
    if (error.message === 'Certificate not found or not available') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to get certificate download URL',
    });
  }
};

// Download certificate file
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const participantId = req.user.id;

    const result = await certificateService.getCertificateDownloadUrl(certificateId, participantId);

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // In a real implementation, you would stream the actual file
    // For now, we'll just return the URL
    res.status(200).json({
      success: true,
      message: 'Certificate download initiated',
      data: {
        downloadUrl: result.downloadUrl,
        filename: result.filename,
      },
    });
  } catch (error) {
    logger.error('Download certificate error:', error);
    if (error.message === 'Certificate not found or not available') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate',
    });
  }
};

// Verify certificate by certificate number (Public)
const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const result = await certificateService.verifyCertificate(certificateNumber);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Verify certificate error:', error);
    if (error.message === 'Certificate not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate',
    });
  }
};

// Bulk generate certificates for an event (Admin only)
const bulkGenerateCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const adminId = req.user.id;

    const result = await certificateService.bulkGenerateCertificates(eventId, adminId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        generatedCount: result.generatedCount,
        totalAttended: result.totalAttended,
      },
    });
  } catch (error) {
    logger.error('Bulk generate certificates error:', error);
    if (error.message === 'Event not found' || error.message === 'You can only generate certificates for your own events') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificates',
    });
  }
};

module.exports = {
  generateCertificate,
  getUserCertificates,
  searchCertificateByToken,
  getCertificateDownloadUrl,
  downloadCertificate,
  verifyCertificate,
  bulkGenerateCertificates,
};
