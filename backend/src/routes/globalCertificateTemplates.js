const express = require('express');
const router = express.Router();
const globalCertificateTemplateController = require('../controllers/globalCertificateTemplateController');
const { authenticate, requireRole } = require('../middlewares/auth');

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN']));

// GET /api/global-certificate-templates - Get all global certificate templates
router.get('/', globalCertificateTemplateController.getGlobalCertificateTemplates);

// GET /api/global-certificate-templates/default - Get default global certificate template
router.get('/default', globalCertificateTemplateController.getDefaultGlobalCertificateTemplate);

// GET /api/global-certificate-templates/:templateId - Get global certificate template by ID
router.get('/:templateId', globalCertificateTemplateController.getGlobalCertificateTemplateById);

// POST /api/global-certificate-templates - Create global certificate template
router.post('/', globalCertificateTemplateController.createGlobalCertificateTemplate);

// PUT /api/global-certificate-templates/:templateId - Update global certificate template
router.put('/:templateId', globalCertificateTemplateController.updateGlobalCertificateTemplate);

// DELETE /api/global-certificate-templates/:templateId - Delete global certificate template
router.delete('/:templateId', globalCertificateTemplateController.deleteGlobalCertificateTemplate);

// PATCH /api/global-certificate-templates/:templateId/set-default - Set template as default
router.patch('/:templateId/set-default', globalCertificateTemplateController.setDefaultGlobalCertificateTemplate);

// GET /api/global-certificate-templates/:templateId/stats - Get template usage statistics
router.get('/:templateId/stats', globalCertificateTemplateController.getTemplateUsageStats);

module.exports = router;
