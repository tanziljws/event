const payoutAccountService = require('../services/payoutAccountService');
const logger = require('../config/logger');

const getAccounts = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const accounts = await payoutAccountService.getAccounts(organizerId);

    res.json({
      success: true,
      data: {
        accounts,
      },
    });
  } catch (error) {
    logger.error('Get payout accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payout accounts',
      error: error.message,
    });
  }
};

const createAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const {
      accountType,
      accountName,
      accountNumber,
      bankCode,
      eWalletType,
    } = req.body;

    // Validate required fields
    if (!accountType || !accountName || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: accountType, accountName, accountNumber',
      });
    }

    const account = await payoutAccountService.createAccount(organizerId, {
      accountType,
      accountName,
      accountNumber,
      bankCode,
      eWalletType,
    });

    res.status(201).json({
      success: true,
      message: 'Payout account created successfully',
      data: {
        account,
      },
    });
  } catch (error) {
    logger.error('Create payout account error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create payout account',
      error: error.message,
    });
  }
};

const updateAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;
    const {
      accountName,
      accountNumber,
      bankCode,
      eWalletType,
    } = req.body;

    const account = await payoutAccountService.updateAccount(id, organizerId, {
      accountName,
      accountNumber,
      bankCode,
      eWalletType,
    });

    res.json({
      success: true,
      message: 'Payout account updated successfully',
      data: {
        account,
      },
    });
  } catch (error) {
    logger.error('Update payout account error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payout account',
      error: error.message,
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    await payoutAccountService.deleteAccount(id, organizerId);

    res.json({
      success: true,
      message: 'Payout account deleted successfully',
    });
  } catch (error) {
    logger.error('Delete payout account error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete payout account',
      error: error.message,
    });
  }
};

const setDefaultAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    const account = await payoutAccountService.setDefaultAccount(id, organizerId);

    res.json({
      success: true,
      message: 'Default account set successfully',
      data: {
        account,
      },
    });
  } catch (error) {
    logger.error('Set default account error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set default account',
      error: error.message,
    });
  }
};

const verifyAccount = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    const account = await payoutAccountService.verifyAccount(id, organizerId);

    res.json({
      success: true,
      message: 'Account verified successfully',
      data: {
        account,
      },
    });
  } catch (error) {
    logger.error('Verify account error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify account',
      error: error.message,
    });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  setDefaultAccount,
  verifyAccount,
};

