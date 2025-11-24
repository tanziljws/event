const { prisma } = require('../config/database');
const balanceService = require('./balanceService');
const xenditService = require('./xenditService');
const payoutAccountService = require('./payoutAccountService');
const emailService = require('./emailService');
const logger = require('../config/logger');

class DisbursementService {
  /**
   * Request payout
   */
  async requestPayout(organizerId, payoutAccountId, amount) {
    try {
      logger.info(`💰 DISBURSEMENT SERVICE: Request payout started - Organizer: ${organizerId}, Account: ${payoutAccountId}, Amount: ${amount}`);
      
      // Validate amount
      const payoutAmount = parseFloat(amount.toString());
      if (isNaN(payoutAmount) || payoutAmount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Minimum payout amount (50.000)
      const MIN_PAYOUT = 50000;
      if (payoutAmount < MIN_PAYOUT) {
        throw new Error(`Minimum payout amount is Rp ${MIN_PAYOUT.toLocaleString('id-ID')}`);
      }

      logger.info(`💰 DISBURSEMENT SERVICE: Amount validated: ${payoutAmount}`);

      // Check if balance is sufficient
      const hasBalance = await balanceService.hasSufficientBalance(organizerId, payoutAmount);
      if (!hasBalance) {
        logger.warn(`❌ DISBURSEMENT SERVICE: Insufficient balance for organizer ${organizerId}`);
        throw new Error('Insufficient balance');
      }

      logger.info(`✅ DISBURSEMENT SERVICE: Balance check passed`);

      // Get payout account
      const payoutAccount = await payoutAccountService.getAccountById(payoutAccountId, organizerId);
      if (!payoutAccount) {
        throw new Error('Payout account not found');
      }

      logger.info(`✅ DISBURSEMENT SERVICE: Payout account found: ${payoutAccount.accountType} - ${payoutAccount.accountName}`);

      // Lock balance
      await balanceService.lockBalance(organizerId, payoutAmount);
      logger.info(`✅ DISBURSEMENT SERVICE: Balance locked: ${payoutAmount}`);

      // Create disbursement record
      const disbursement = await prisma.disbursement.create({
        data: {
          organizerId,
          payoutAccountId,
          amount: payoutAmount,
          status: 'PENDING',
          requestedAt: new Date(),
        },
        include: {
          payoutAccount: true,
        },
      });

      logger.info(`Disbursement requested: ${disbursement.id} for organizer ${organizerId}, amount: ${payoutAmount}`);

      // Send email notification for payout request
      try {
        const organizer = await prisma.user.findUnique({
          where: { id: organizerId },
          select: { fullName: true, email: true },
        });

        if (organizer) {
          await emailService.sendPayoutRequestedNotification(
            organizer.email,
            organizer.fullName,
            payoutAmount,
            payoutAccount.accountName,
            payoutAccount.accountNumber,
            payoutAccount.accountType,
            disbursement.requestedAt
          );
          logger.info(`✅ Payout requested email sent to ${organizer.email}`);
        }
      } catch (emailError) {
        logger.error('Error sending payout requested email:', emailError);
        // Don't fail the request if email fails
      }

      // Process disbursement asynchronously
      // Don't await - let it process in background
      this.processDisbursement(disbursement.id).catch((error) => {
        logger.error(`Error processing disbursement ${disbursement.id}:`, error);
      });

      return disbursement;
    } catch (error) {
      logger.error('Error requesting payout:', error);
      throw error;
    }
  }

  /**
   * Process disbursement (call Xendit)
   */
  async processDisbursement(disbursementId) {
    try {
      const disbursement = await prisma.disbursement.findUnique({
        where: { id: disbursementId },
        include: {
          payoutAccount: true,
          organizer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (!disbursement) {
        throw new Error('Disbursement not found');
      }

      if (disbursement.status !== 'PENDING') {
        logger.warn(`Disbursement ${disbursementId} is not in PENDING status: ${disbursement.status}`);
        return disbursement;
      }

      // Update status to PROCESSING
      await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });

      logger.info(`Processing disbursement ${disbursementId} via Xendit...`);

      let xenditDisbursement;
      const externalId = `DISB-${disbursementId.substring(0, 8).toUpperCase()}-${Date.now()}`;

      // Create disbursement via Xendit
      if (disbursement.payoutAccount.accountType === 'BANK_ACCOUNT') {
        if (!disbursement.payoutAccount.bankCode) {
          throw new Error('bankCode is required for BANK_ACCOUNT');
        }
        xenditDisbursement = await xenditService.createDisbursement({
          amount: disbursement.amount,
          bankCode: disbursement.payoutAccount.bankCode,
          accountHolderName: disbursement.payoutAccount.accountName,
          accountNumber: disbursement.payoutAccount.accountNumber,
          description: `Payout untuk organizer: ${disbursement.organizer.fullName}`,
          externalId,
          emailTo: disbursement.organizer.email,
        });
      } else if (disbursement.payoutAccount.accountType === 'E_WALLET') {
        if (!disbursement.payoutAccount.eWalletType) {
          throw new Error('eWalletType is required for E_WALLET');
        }
        xenditDisbursement = await xenditService.createEWalletDisbursement({
          amount: disbursement.amount,
          eWalletType: disbursement.payoutAccount.eWalletType,
          phoneNumber: disbursement.payoutAccount.accountNumber, // For e-wallet, accountNumber is phone number
          accountHolderName: disbursement.payoutAccount.accountName, // Account holder name
          description: `Payout untuk organizer: ${disbursement.organizer.fullName}`,
          externalId,
        });
      } else {
        throw new Error(`Unsupported account type: ${disbursement.payoutAccount.accountType}`);
      }

      // Update disbursement with Xendit ID
      const updatedDisbursement = await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          xenditId: xenditDisbursement.id || xenditDisbursement.reference_id,
          xenditReference: xenditDisbursement.reference_id || externalId,
          metadata: {
            xenditResponse: xenditDisbursement,
          },
        },
      });

      logger.info(`Disbursement ${disbursementId} processed via Xendit: ${xenditDisbursement.id}`);

      // Note: Status will be updated via webhook from Xendit
      // For now, keep as PROCESSING

      return updatedDisbursement;
    } catch (error) {
      logger.error('Error processing disbursement:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        code: error.code,
      });

      // Update disbursement status to FAILED
      try {
        const failureReason = error.message || error.toString() || 'Unknown error';
        await prisma.disbursement.update({
          where: { id: disbursementId },
          data: {
            status: 'FAILED',
            failureReason: failureReason,
          },
        });

        // Unlock balance
        const disbursement = await prisma.disbursement.findUnique({
          where: { id: disbursementId },
        });
        if (disbursement) {
          await balanceService.unlockBalance(disbursement.organizerId, disbursement.amount);
        }
      } catch (updateError) {
        logger.error('Error updating failed disbursement:', updateError);
      }

      throw error;
    }
  }

  /**
   * Update disbursement status (from Xendit webhook)
   */
  async updateDisbursementStatus(disbursementId, status, failureReason = null) {
    try {
      // Get disbursement with relations for email
      const disbursement = await prisma.disbursement.findUnique({
        where: { id: disbursementId },
        include: {
          organizer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          payoutAccount: {
            select: {
              accountName: true,
              accountNumber: true,
              accountType: true,
              bankCode: true,
              eWalletType: true,
            },
          },
        },
      });

      if (!disbursement) {
        throw new Error('Disbursement not found');
      }

      const updateData = {
        status: status.toUpperCase(),
      };

      if (status.toUpperCase() === 'COMPLETED') {
        updateData.completedAt = new Date();
        // Unlock balance and debit
        await balanceService.unlockBalance(disbursement.organizerId, disbursement.amount);
        await balanceService.addDisbursementDebit(
          disbursement.organizerId,
          disbursementId,
          disbursement.amount,
          `Payout ke ${disbursement.payoutAccount.accountName}`,
          { xenditId: disbursement.xenditId }
        );

        // Send email notification
        try {
          await emailService.sendPayoutCompletedNotification(
            disbursement.organizer.email,
            disbursement.organizer.fullName,
            disbursement.amount,
            disbursement.payoutAccount.accountName,
            disbursement.payoutAccount.accountNumber,
            disbursement.payoutAccount.accountType,
            updateData.completedAt
          );
          logger.info(`✅ Payout completed email sent to ${disbursement.organizer.email}`);
        } catch (emailError) {
          logger.error('Error sending payout completed email:', emailError);
          // Don't fail the update if email fails
        }
      } else if (status.toUpperCase() === 'FAILED') {
        updateData.failureReason = failureReason;
        // Unlock balance
        await balanceService.unlockBalance(disbursement.organizerId, disbursement.amount);

        // Send email notification
        try {
          await emailService.sendPayoutFailedNotification(
            disbursement.organizer.email,
            disbursement.organizer.fullName,
            disbursement.amount,
            disbursement.payoutAccount.accountName,
            failureReason || 'Unknown error',
            disbursement.requestedAt
          );
          logger.info(`✅ Payout failed email sent to ${disbursement.organizer.email}`);
        } catch (emailError) {
          logger.error('Error sending payout failed email:', emailError);
          // Don't fail the update if email fails
        }
      }

      const updatedDisbursement = await prisma.disbursement.update({
        where: { id: disbursementId },
        data: updateData,
      });

      logger.info(`Disbursement ${disbursementId} status updated to ${status}`);
      return updatedDisbursement;
    } catch (error) {
      logger.error('Error updating disbursement status:', error);
      throw error;
    }
  }

  /**
   * Get disbursement history
   */
  async getDisbursementHistory(organizerId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        status = null,
        startDate = null,
        endDate = null,
      } = options;

      const where = {
        organizerId,
        ...(status && { status: status.toUpperCase() }),
        ...(startDate || endDate ? {
          requestedAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        } : {}),
      };

      const [disbursements, total] = await Promise.all([
        prisma.disbursement.findMany({
          where,
          include: {
            payoutAccount: {
              select: {
                id: true,
                accountType: true,
                accountName: true,
                accountNumber: true,
                bankCode: true,
                eWalletType: true,
              },
            },
          },
          orderBy: { requestedAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        }),
        prisma.disbursement.count({ where }),
      ]);

      return {
        disbursements,
        total,
        hasMore: offset + disbursements.length < total,
      };
    } catch (error) {
      logger.error('Error getting disbursement history:', error);
      throw error;
    }
  }

  /**
   * Get disbursement by ID
   */
  async getDisbursementById(disbursementId, organizerId) {
    try {
      const disbursement = await prisma.disbursement.findFirst({
        where: {
          id: disbursementId,
          organizerId,
        },
        include: {
          payoutAccount: true,
        },
      });

      if (!disbursement) {
        throw new Error('Disbursement not found');
      }

      return disbursement;
    } catch (error) {
      logger.error('Error getting disbursement:', error);
      throw error;
    }
  }

  /**
   * Cancel disbursement
   */
  async cancelDisbursement(disbursementId, organizerId) {
    try {
      const disbursement = await this.getDisbursementById(disbursementId, organizerId);

      if (disbursement.status !== 'PENDING') {
        throw new Error(`Cannot cancel disbursement with status: ${disbursement.status}`);
      }

      // Update status to CANCELLED
      await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Unlock balance
      await balanceService.unlockBalance(organizerId, disbursement.amount);

      logger.info(`Disbursement ${disbursementId} cancelled`);
      return true;
    } catch (error) {
      logger.error('Error cancelling disbursement:', error);
      throw error;
    }
  }

  /**
   * Retry failed disbursement
   */
  async retryDisbursement(disbursementId, organizerId) {
    try {
      const disbursement = await this.getDisbursementById(disbursementId, organizerId);

      if (disbursement.status !== 'FAILED') {
        throw new Error(`Can only retry disbursement with status FAILED. Current status: ${disbursement.status}`);
      }

      logger.info(`🔄 Retrying disbursement ${disbursementId} for organizer ${organizerId}`);

      // Check if balance is still sufficient
      const hasBalance = await balanceService.hasSufficientBalance(organizerId, disbursement.amount);
      if (!hasBalance) {
        throw new Error('Insufficient balance. Please check your available balance.');
      }

      // Lock balance again (it was unlocked when failed)
      await balanceService.lockBalance(organizerId, disbursement.amount);
      logger.info(`✅ Balance locked again for retry: ${disbursement.amount}`);

      // Update status to PENDING and clear failure reason
      await prisma.disbursement.update({
        where: { id: disbursementId },
        data: {
          status: 'PENDING',
          failureReason: null,
          requestedAt: new Date(), // Update requested time
        },
      });

      logger.info(`✅ Disbursement ${disbursementId} status updated to PENDING for retry`);

      // Process disbursement asynchronously
      this.processDisbursement(disbursementId).catch((error) => {
        logger.error(`Error processing retry disbursement ${disbursementId}:`, error);
      });

      // Return updated disbursement
      return await this.getDisbursementById(disbursementId, organizerId);
    } catch (error) {
      logger.error('Error retrying disbursement:', error);
      throw error;
    }
  }
}

module.exports = new DisbursementService();

