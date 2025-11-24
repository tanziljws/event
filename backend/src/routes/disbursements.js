const express = require('express');
const router = express.Router();
const disbursementController = require('../controllers/disbursementController');
const { authenticate } = require('../middlewares/auth');
const { requireOrganizer } = require('../middlewares/auth');
const { validateUUID } = require('../middlewares/validation');

// Request payout
router.post('/request', authenticate, requireOrganizer, disbursementController.requestPayout);

// Get disbursement history
router.get('/', authenticate, requireOrganizer, disbursementController.getDisbursementHistory);

// Get disbursement by ID
router.get('/:id', authenticate, requireOrganizer, validateUUID, disbursementController.getDisbursementById);

// Cancel disbursement
router.post('/:id/cancel', authenticate, requireOrganizer, validateUUID, disbursementController.cancelDisbursement);

// Retry failed disbursement
router.post('/:id/retry', authenticate, requireOrganizer, validateUUID, disbursementController.retryDisbursement);

// Xendit webhook handler (no auth required - uses signature validation)
router.post('/webhook', disbursementController.handleWebhook);

// Get available banks
router.get('/banks/available', authenticate, requireOrganizer, disbursementController.getAvailableBanks);

// Get available e-wallets
router.get('/ewallets/available', authenticate, requireOrganizer, disbursementController.getAvailableEWallets);

// Calculate fee estimate
router.get('/fee/estimate', authenticate, requireOrganizer, disbursementController.getFeeEstimate);

module.exports = router;

