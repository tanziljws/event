const express = require('express');
const router = express.Router();
const certificateTemplateController = require('../controllers/certificateTemplateController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validatePagination } = require('../middlewares/validation');

console.log('📁 CERTIFICATE TEMPLATE ROUTES LOADED! 🔥');

// Health check route
router.get('/health', (req, res) => {
  console.log('🏥 HEALTH CHECK HIT!');
  res.json({ message: 'Certificate routes working!' });
});

// All routes require authentication and admin role
// router.use(authenticate);
// router.use(requireAdmin);

// Get certificate templates for events
router.get('/', validatePagination, certificateTemplateController.getCertificateTemplates);

// Get events with certificate template status
router.get('/events', validatePagination, certificateTemplateController.getEventsWithTemplateStatus);

// Get certificate template for specific event
router.get('/:eventId', certificateTemplateController.getCertificateTemplate);

// Save certificate template for event
router.post('/:eventId', 
  (req, res, next) => {
    console.log('🎯 ROUTE HIT! Method:', req.method);
    console.log('🎯 EventId param:', req.params.eventId);
    console.log('🎯 Body exists:', !!req.body);
    console.log('🎯 Content-Type:', req.headers['content-type']);
    console.log('🎯 Body keys:', Object.keys(req.body || {}));
    next();
  },
  certificateTemplateController.saveCertificateTemplate
);

// Update certificate template for event
router.put('/:eventId', certificateTemplateController.updateCertificateTemplate);

// Delete certificate template for event
router.delete('/:eventId', certificateTemplateController.deleteCertificateTemplate);

module.exports = router;
