const express = require('express');
const { authenticate } = require('../middlewares/auth');
const userStatsController = require('../controllers/userStatsController');

const router = express.Router();

// Get user dashboard stats
router.get('/dashboard', authenticate, userStatsController.getUserDashboardStats);

module.exports = router;
