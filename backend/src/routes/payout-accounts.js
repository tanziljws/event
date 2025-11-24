const express = require('express');
const router = express.Router();
const payoutAccountController = require('../controllers/payoutAccountController');
const { authenticate } = require('../middlewares/auth');
const { requireOrganizer } = require('../middlewares/auth');
const { validateUUID } = require('../middlewares/validation');

// Get organizer payout accounts
router.get('/', authenticate, requireOrganizer, payoutAccountController.getAccounts);

// Create payout account
router.post('/', authenticate, requireOrganizer, payoutAccountController.createAccount);

// Update payout account
router.put('/:id', authenticate, requireOrganizer, validateUUID, payoutAccountController.updateAccount);

// Delete payout account
router.delete('/:id', authenticate, requireOrganizer, validateUUID, payoutAccountController.deleteAccount);

// Set default account
router.patch('/:id/set-default', authenticate, requireOrganizer, validateUUID, payoutAccountController.setDefaultAccount);

// Verify account (optional)
router.patch('/:id/verify', authenticate, requireOrganizer, validateUUID, payoutAccountController.verifyAccount);

module.exports = router;

