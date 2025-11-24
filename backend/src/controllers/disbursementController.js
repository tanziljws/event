const disbursementService = require('../services/disbursementService');
const xenditService = require('../services/xenditService');
const logger = require('../config/logger');

const requestPayout = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { payoutAccountId, amount } = req.body;

    logger.info(`💰 Request payout - Organizer: ${organizerId}, Account: ${payoutAccountId}, Amount: ${amount}`);

    if (!payoutAccountId || !amount) {
      logger.warn('Missing required fields:', { payoutAccountId, amount });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: payoutAccountId, amount',
      });
    }

    const disbursement = await disbursementService.requestPayout(
      organizerId,
      payoutAccountId,
      amount
    );

    logger.info(`✅ Payout request created successfully: ${disbursement.id}`);

    res.status(201).json({
      success: true,
      message: 'Payout request created successfully',
      data: {
        disbursement,
      },
    });
  } catch (error) {
    logger.error('❌ Request payout error:', {
      error: error.message,
      stack: error.stack,
      organizerId: req.user?.id,
      body: req.body,
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to request payout',
      error: error.message,
    });
  }
};

const getDisbursementHistory = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await disbursementService.getDisbursementHistory(organizerId, {
      limit: parseInt(limit),
      offset,
      status: status || null,
      startDate: startDate || null,
      endDate: endDate || null,
    });

    res.json({
      success: true,
      data: {
        disbursements: result.disbursements,
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
    logger.error('Get disbursement history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get disbursement history',
      error: error.message,
    });
  }
};

const getDisbursementById = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    const disbursement = await disbursementService.getDisbursementById(id, organizerId);

    res.json({
      success: true,
      data: {
        disbursement,
      },
    });
  } catch (error) {
    logger.error('Get disbursement error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Disbursement not found',
      error: error.message,
    });
  }
};

const cancelDisbursement = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    await disbursementService.cancelDisbursement(id, organizerId);

    res.json({
      success: true,
      message: 'Disbursement cancelled successfully',
    });
  } catch (error) {
    logger.error('Cancel disbursement error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel disbursement',
      error: error.message,
    });
  }
};

const retryDisbursement = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { id } = req.params;

    const disbursement = await disbursementService.retryDisbursement(id, organizerId);

    res.json({
      success: true,
      message: 'Disbursement retry initiated successfully',
      data: {
        disbursement,
      },
    });
  } catch (error) {
    logger.error('Retry disbursement error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to retry disbursement',
      error: error.message,
    });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-callback-token'] || req.headers['xendit-callback-token'];
    const webhookData = req.body;

    logger.info('Xendit webhook received:', webhookData);

    // Validate and parse webhook
    const webhookResult = await xenditService.handleWebhook(webhookData, signature);

    // Find disbursement by xenditId or externalId
    const { prisma } = require('../config/database');
    const disbursement = await prisma.disbursement.findFirst({
      where: {
        OR: [
          { xenditId: webhookResult.xenditId },
          { xenditReference: webhookData.external_id || webhookData.reference_id },
        ],
      },
    });

    if (disbursement) {
      // Update disbursement status
      await disbursementService.updateDisbursementStatus(
        disbursement.id,
        webhookResult.status,
        webhookResult.failureReason
      );
    } else {
      logger.warn(`Disbursement not found for Xendit ID: ${webhookResult.xenditId}`);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Xendit webhook error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process webhook',
      error: error.message,
    });
  }
};

const getAvailableBanks = async (req, res) => {
  try {
    const banks = xenditService.getAvailableBankCodes();
    res.json({
      success: true,
      data: {
        banks,
      },
    });
  } catch (error) {
    logger.error('Get available banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available banks',
      error: error.message,
    });
  }
};

const getAvailableEWallets = async (req, res) => {
  try {
    const eWallets = xenditService.getAvailableEWalletTypes();
    res.json({
      success: true,
      data: {
        eWallets,
      },
    });
  } catch (error) {
    logger.error('Get available e-wallets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available e-wallets',
      error: error.message,
    });
  }
};

const getFeeEstimate = async (req, res) => {
  try {
    const { amount } = req.query;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    const feeBreakdown = xenditService.calculateDisbursementFee(payoutAmount);

    res.json({
      success: true,
      data: {
        amount: payoutAmount,
        fee: feeBreakdown,
      },
    });
  } catch (error) {
    logger.error('Get fee estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate fee estimate',
      error: error.message,
    });
  }
};

module.exports = {
  requestPayout,
  getDisbursementHistory,
  getDisbursementById,
  cancelDisbursement,
  retryDisbursement,
  handleWebhook,
  getAvailableBanks,
  getAvailableEWallets,
  getFeeEstimate,
};

