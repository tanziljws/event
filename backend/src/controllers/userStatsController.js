const userStatsService = require('../services/userStatsService');
const logger = require('../config/logger');

// Get user dashboard stats
const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await userStatsService.getUserDashboardStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get user dashboard stats controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};

module.exports = {
  getUserDashboardStats
};
