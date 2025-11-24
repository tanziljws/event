const { prisma } = require('../config/database');
const logger = require('../config/logger');

class PayoutAccountService {
  /**
   * Create payout account
   */
  async createAccount(organizerId, accountData) {
    try {
      const {
        accountType,
        accountName,
        accountNumber,
        bankCode,
        eWalletType,
      } = accountData;

      // Validate required fields
      if (!accountType || !accountName || !accountNumber) {
        throw new Error('Missing required fields: accountType, accountName, accountNumber');
      }

      // Validate account type specific fields
      if (accountType === 'BANK_ACCOUNT' && !bankCode) {
        throw new Error('bankCode is required for BANK_ACCOUNT');
      }
      if (accountType === 'E_WALLET' && !eWalletType) {
        throw new Error('eWalletType is required for E_WALLET');
      }

      // Check if this is the first account, set as default
      const existingAccounts = await prisma.payoutAccount.findMany({
        where: { organizerId },
      });

      const isDefault = existingAccounts.length === 0;

      // If setting as default, unset other default accounts
      if (isDefault) {
        await prisma.payoutAccount.updateMany({
          where: {
            organizerId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const account = await prisma.payoutAccount.create({
        data: {
          organizerId,
          accountType,
          accountName,
          accountNumber,
          bankCode: accountType === 'BANK_ACCOUNT' ? bankCode : null,
          eWalletType: accountType === 'E_WALLET' ? eWalletType : null,
          isDefault,
          isVerified: false, // Default to unverified, can be verified later
        },
      });

      logger.info(`Payout account created for organizer ${organizerId}: ${account.id}`);
      return account;
    } catch (error) {
      logger.error('Error creating payout account:', error);
      throw error;
    }
  }

  /**
   * Get organizer accounts
   */
  async getAccounts(organizerId) {
    try {
      const accounts = await prisma.payoutAccount.findMany({
        where: { organizerId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      return accounts;
    } catch (error) {
      logger.error('Error getting payout accounts:', error);
      throw error;
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(accountId, organizerId) {
    try {
      const account = await prisma.payoutAccount.findFirst({
        where: {
          id: accountId,
          organizerId,
        },
      });

      if (!account) {
        throw new Error('Payout account not found');
      }

      return account;
    } catch (error) {
      logger.error('Error getting payout account:', error);
      throw error;
    }
  }

  /**
   * Update account
   */
  async updateAccount(accountId, organizerId, accountData) {
    try {
      // Verify account belongs to organizer
      await this.getAccountById(accountId, organizerId);

      const {
        accountName,
        accountNumber,
        bankCode,
        eWalletType,
      } = accountData;

      const updateData = {};
      if (accountName) updateData.accountName = accountName;
      if (accountNumber) updateData.accountNumber = accountNumber;
      if (bankCode) updateData.bankCode = bankCode;
      if (eWalletType) updateData.eWalletType = eWalletType;

      const account = await prisma.payoutAccount.update({
        where: { id: accountId },
        data: updateData,
      });

      logger.info(`Payout account updated: ${accountId}`);
      return account;
    } catch (error) {
      logger.error('Error updating payout account:', error);
      throw error;
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(accountId, organizerId) {
    try {
      const account = await this.getAccountById(accountId, organizerId);

      // Check if account is used in any disbursements
      const disbursements = await prisma.disbursement.findMany({
        where: {
          payoutAccountId: accountId,
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
        },
      });

      if (disbursements.length > 0) {
        throw new Error('Cannot delete account with pending or processing disbursements');
      }

      await prisma.payoutAccount.delete({
        where: { id: accountId },
      });

      // If deleted account was default, set another account as default
      if (account.isDefault) {
        const otherAccount = await prisma.payoutAccount.findFirst({
          where: { organizerId },
        });

        if (otherAccount) {
          await prisma.payoutAccount.update({
            where: { id: otherAccount.id },
            data: { isDefault: true },
          });
        }
      }

      logger.info(`Payout account deleted: ${accountId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting payout account:', error);
      throw error;
    }
  }

  /**
   * Set default account
   */
  async setDefaultAccount(accountId, organizerId) {
    try {
      // Verify account belongs to organizer
      await this.getAccountById(accountId, organizerId);

      // Unset all other default accounts
      await prisma.payoutAccount.updateMany({
        where: {
          organizerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set this account as default
      const account = await prisma.payoutAccount.update({
        where: { id: accountId },
        data: { isDefault: true },
      });

      logger.info(`Default payout account set: ${accountId}`);
      return account;
    } catch (error) {
      logger.error('Error setting default account:', error);
      throw error;
    }
  }

  /**
   * Verify account (optional - for future use)
   */
  async verifyAccount(accountId, organizerId) {
    try {
      const account = await this.getAccountById(accountId, organizerId);

      const updatedAccount = await prisma.payoutAccount.update({
        where: { id: accountId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      logger.info(`Payout account verified: ${accountId}`);
      return updatedAccount;
    } catch (error) {
      logger.error('Error verifying account:', error);
      throw error;
    }
  }

  /**
   * Get default account
   */
  async getDefaultAccount(organizerId) {
    try {
      const account = await prisma.payoutAccount.findFirst({
        where: {
          organizerId,
          isDefault: true,
        },
      });

      return account;
    } catch (error) {
      logger.error('Error getting default account:', error);
      throw error;
    }
  }
}

module.exports = new PayoutAccountService();

