const express = require('express');
const certificateController = require('../controllers/certificateController');
const { authenticate, requireAdmin, requireParticipant } = require('../middlewares/auth');
const { secureNotFound } = require('../middlewares/security');
const {
  validateUUID,
  validatePagination,
} = require('../middlewares/validation');

const router = express.Router();

// Public routes
router.get('/search/:token', certificateController.searchCertificateByToken);
router.get('/verify/:certificateNumber', (req, res) => {
  console.log('Verify route hit:', req.params);
  certificateController.verifyCertificate(req, res);
});

// Protected routes - Participant only (with 404 security)
router.post('/generate/:registrationId', authenticate, requireParticipant, certificateController.generateCertificate);
router.get('/my', authenticate, requireParticipant, validatePagination, certificateController.getUserCertificates);
router.get('/download-url/:certificateId', authenticate, requireParticipant, validateUUID('certificateId'), certificateController.getCertificateDownloadUrl);
router.get('/download/:certificateId', authenticate, requireParticipant, validateUUID('certificateId'), certificateController.downloadCertificate);

// Protected routes - Admin only (with 404 security)
router.post('/bulk-generate/:eventId', secureNotFound, authenticate, requireAdmin, validateUUID('eventId'), certificateController.bulkGenerateCertificates);

module.exports = router;
