const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const { authenticate } = require('../middlewares/auth');
const { requireOrganizer } = require('../middlewares/auth');

// Get organizer balance
router.get('/', authenticate, requireOrganizer, balanceController.getBalance);

// Get balance history
router.get('/history', authenticate, requireOrganizer, balanceController.getBalanceHistory);

// Get balance statistics
router.get('/stats', authenticate, requireOrganizer, balanceController.getBalanceStats);

// Export transaction history
router.get('/history/export', authenticate, requireOrganizer, balanceController.exportTransactionHistory);

module.exports = router;

