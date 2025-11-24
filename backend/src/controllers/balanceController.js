const balanceService = require('../services/balanceService');
const logger = require('../config/logger');

const getBalance = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const balance = await balanceService.getBalance(organizerId);
    const stats = await balanceService.getBalanceStats(organizerId);

    res.json({
      success: true,
      data: {
        balance,
        stats,
      },
    });
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance',
      error: error.message,
    });
  }
};

const getBalanceHistory = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const {
      page = 1,
      limit = 50,
      type,
      startDate,
      endDate,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await balanceService.getBalanceHistory(organizerId, {
      limit: parseInt(limit),
      offset,
      type: type || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    res.json({
      success: true,
      data: {
        transactions: result.transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit)),
        },
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    logger.error('Get balance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance history',
      error: error.message,
    });
  }
};

const getBalanceStats = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const stats = await balanceService.getBalanceStats(organizerId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Get balance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance stats',
      error: error.message,
    });
  }
};

const exportTransactionHistory = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { format = 'csv', type, startDate, endDate } = req.query;

    const result = await balanceService.exportTransactionHistory(organizerId, {
      format: format.toLowerCase(),
      type: type || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    if (format.toLowerCase() === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.content);
    } else if (format.toLowerCase() === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      result.stream.pipe(res);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use "csv" or "pdf"',
      });
    }
  } catch (error) {
    logger.error('Export transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export transaction history',
      error: error.message,
    });
  }
};

module.exports = {
  getBalance,
  getBalanceHistory,
  getBalanceStats,
  exportTransactionHistory,
};

