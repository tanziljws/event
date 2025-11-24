const { prisma } = require('../config/database');
const logger = require('../config/logger');
const PDFDocument = require('pdfkit');

class BalanceService {
  /**
   * Get organizer balance
   */
  async getBalance(organizerId) {
    try {
      let balance = await prisma.organizerBalance.findUnique({
        where: { organizerId },
      });

      // Create balance if doesn't exist
      if (!balance) {
        balance = await prisma.organizerBalance.create({
          data: {
            organizerId,
            balance: 0,
            pendingBalance: 0,
            totalEarned: 0,
            totalWithdrawn: 0,
          },
        });
      }

      return balance;
    } catch (error) {
      logger.error('Error getting organizer balance:', error);
      throw error;
    }
  }

  /**
   * Update balance (atomic transaction)
   */
  async updateBalance(organizerId, amount, type, referenceType, referenceId, description, metadata = null) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get or create balance
        let balance = await tx.organizerBalance.findUnique({
          where: { organizerId },
        });

        if (!balance) {
          balance = await tx.organizerBalance.create({
            data: {
              organizerId,
              balance: 0,
              pendingBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
            },
          });
        }

        const balanceBefore = parseFloat(balance.balance.toString());
        let balanceAfter = balanceBefore;

        // Update balance based on type
        if (type === 'CREDIT') {
          balanceAfter = balanceBefore + parseFloat(amount.toString());
          await tx.organizerBalance.update({
            where: { organizerId },
            data: {
              balance: balanceAfter,
              totalEarned: {
                increment: parseFloat(amount.toString()),
              },
            },
          });
        } else if (type === 'DEBIT') {
          balanceAfter = balanceBefore - parseFloat(amount.toString());
          if (balanceAfter < 0) {
            throw new Error('Insufficient balance');
          }
          await tx.organizerBalance.update({
            where: { organizerId },
            data: {
              balance: balanceAfter,
              totalWithdrawn: {
                increment: parseFloat(amount.toString()),
              },
            },
          });
        } else if (type === 'ADJUSTMENT') {
          balanceAfter = parseFloat(amount.toString());
          await tx.organizerBalance.update({
            where: { organizerId },
            data: {
              balance: balanceAfter,
            },
          });
        }

        // Create transaction record (without organizerBalanceId since column doesn't exist yet)
        const transaction = await tx.balanceTransaction.create({
          data: {
            organizerId,
            type,
            amount: parseFloat(amount.toString()),
            balanceBefore,
            balanceAfter,
            referenceType,
            referenceId,
            description,
            metadata,
            // organizerBalanceId is optional and column may not exist in DB yet
          },
        });

        return {
          balance: await tx.organizerBalance.findUnique({
            where: { organizerId },
          }),
          transaction,
        };
      });

      logger.info(`Balance updated for organizer ${organizerId}: ${type} ${amount}, balance: ${result.balance.balance}`);
      return result;
    } catch (error) {
      logger.error('Error updating balance:', error);
      throw error;
    }
  }

  /**
   * Add credit from revenue
   */
  async addRevenueCredit(organizerId, organizerRevenueId, amount, description, metadata = null) {
    try {
      return await this.updateBalance(
        organizerId,
        amount,
        'CREDIT',
        'ORGANIZER_REVENUE',
        organizerRevenueId,
        description,
        metadata
      );
    } catch (error) {
      logger.error('Error adding revenue credit:', error);
      throw error;
    }
  }

  /**
   * Add debit from disbursement
   */
  async addDisbursementDebit(organizerId, disbursementId, amount, description, metadata = null) {
    try {
      return await this.updateBalance(
        organizerId,
        amount,
        'DEBIT',
        'DISBURSEMENT',
        disbursementId,
        description,
        metadata
      );
    } catch (error) {
      logger.error('Error adding disbursement debit:', error);
      throw error;
    }
  }

  /**
   * Lock balance for pending disbursement
   */
  async lockBalance(organizerId, amount) {
    try {
      logger.info(`🔒 LOCK BALANCE: Starting for organizer ${organizerId}, amount: ${amount}`);
      
      const balance = await this.getBalance(organizerId);
      const balanceBefore = parseFloat(balance.balance.toString());
      const pendingBefore = parseFloat(balance.pendingBalance.toString());
      const availableBalance = balanceBefore - pendingBefore;
      
      logger.info(`🔒 LOCK BALANCE: Current balance: ${balanceBefore}, pending: ${pendingBefore}, available: ${availableBalance}`);
      
      if (availableBalance < parseFloat(amount.toString())) {
        logger.error(`❌ LOCK BALANCE: Insufficient balance. Available: ${availableBalance}, Requested: ${amount}`);
        throw new Error('Insufficient balance');
      }

      const updatedBalance = await prisma.organizerBalance.update({
        where: { organizerId },
        data: {
          pendingBalance: {
            increment: parseFloat(amount.toString()),
          },
        },
      });

      const pendingAfter = parseFloat(updatedBalance.pendingBalance.toString());
      const availableAfter = balanceBefore - pendingAfter;
      
      logger.info(`✅ LOCK BALANCE: Success! Balance: ${balanceBefore}, Pending before: ${pendingBefore}, Pending after: ${pendingAfter}, Available after: ${availableAfter}`);
      
      return true;
    } catch (error) {
      logger.error('❌ LOCK BALANCE: Error locking balance:', error);
      throw error;
    }
  }

  /**
   * Unlock balance (when disbursement cancelled or failed)
   */
  async unlockBalance(organizerId, amount) {
    try {
      await prisma.organizerBalance.update({
        where: { organizerId },
        data: {
          pendingBalance: {
            decrement: parseFloat(amount.toString()),
          },
        },
      });

      logger.info(`Balance unlocked for organizer ${organizerId}: ${amount}`);
      return true;
    } catch (error) {
      logger.error('Error unlocking balance:', error);
      throw error;
    }
  }

  /**
   * Get balance history
   */
  async getBalanceHistory(organizerId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type = null,
        startDate = null,
        endDate = null,
      } = options;

      const where = {
        organizerId,
        ...(type && { type }),
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        } : {}),
      };

      const [transactions, total] = await Promise.all([
        prisma.balanceTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit),
          skip: parseInt(offset),
        }),
        prisma.balanceTransaction.count({ where }),
      ]);

      return {
        transactions,
        total,
        hasMore: offset + transactions.length < total,
      };
    } catch (error) {
      logger.error('Error getting balance history:', error);
      throw error;
    }
  }

  /**
   * Check if balance is sufficient
   */
  async hasSufficientBalance(organizerId, amount) {
    try {
      const balance = await this.getBalance(organizerId);
      const availableBalance = parseFloat(balance.balance.toString()) - parseFloat(balance.pendingBalance.toString());
      return availableBalance >= parseFloat(amount.toString());
    } catch (error) {
      logger.error('Error checking balance:', error);
      throw error;
    }
  }

  /**
   * Get balance statistics
   */
  async getBalanceStats(organizerId) {
    try {
      const balance = await this.getBalance(organizerId);
      const availableBalance = parseFloat(balance.balance.toString()) - parseFloat(balance.pendingBalance.toString());

      // Get recent transactions count
      const recentTransactionsCount = await prisma.balanceTransaction.count({
        where: {
          organizerId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      return {
        balance: parseFloat(balance.balance.toString()),
        pendingBalance: parseFloat(balance.pendingBalance.toString()),
        availableBalance,
        totalEarned: parseFloat(balance.totalEarned.toString()),
        totalWithdrawn: parseFloat(balance.totalWithdrawn.toString()),
        recentTransactionsCount,
      };
    } catch (error) {
      logger.error('Error getting balance stats:', error);
      throw error;
    }
  }

  /**
   * Export transaction history
   */
  async exportTransactionHistory(organizerId, options = {}) {
    try {
      const {
        format = 'csv',
        type = null,
        startDate = null,
        endDate = null,
      } = options;

      // Get all transactions (no pagination for export)
      const where = {
        organizerId,
        ...(type && { type }),
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        } : {}),
      };

      const transactions = await prisma.balanceTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      // Get organizer info for filename
      const organizer = await prisma.user.findUnique({
        where: { id: organizerId },
        select: { fullName: true, email: true },
      });

      const dateStr = new Date().toISOString().split('T')[0];
      const organizerName = organizer?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'organizer';

      if (format === 'csv') {
        return this.generateCSV(transactions, organizerName, dateStr);
      } else if (format === 'pdf') {
        return this.generatePDF(transactions, organizer, dateStr);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error('Error exporting transaction history:', error);
      throw error;
    }
  }

  /**
   * Generate CSV export
   */
  generateCSV(transactions, organizerName, dateStr) {
    const csvHeaders = [
      'No',
      'Date',
      'Type',
      'Amount (IDR)',
      'Balance Before (IDR)',
      'Balance After (IDR)',
      'Description',
      'Reference Type',
      'Reference ID',
    ];

    const csvRows = transactions.map((transaction, index) => [
      index + 1,
      new Date(transaction.createdAt).toLocaleString('id-ID'),
      transaction.type,
      transaction.amount.toLocaleString('id-ID'),
      transaction.balanceBefore.toLocaleString('id-ID'),
      transaction.balanceAfter.toLocaleString('id-ID'),
      transaction.description || '',
      transaction.referenceType || '',
      transaction.referenceId || '',
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return {
      filename: `transaction_history_${organizerName}_${dateStr}.csv`,
      content: csvContent,
    };
  }

  /**
   * Generate PDF export
   */
  generatePDF(transactions, organizer, dateStr) {
    const doc = new PDFDocument({ margin: 50 });
    
    // Title
    doc.fontSize(20).text('Transaction History', { align: 'center' });
    doc.moveDown(0.5);
    
    // Organizer info
    if (organizer) {
      doc.fontSize(12).text(`Organizer: ${organizer.fullName || organizer.email}`, { align: 'center' });
    }
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
    doc.moveDown(1);

    // Summary
    const totalCredit = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const totalDebit = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    doc.fontSize(12).text('Summary', { underline: true });
    doc.fontSize(10)
      .text(`Total Transactions: ${transactions.length}`)
      .text(`Total Credit: Rp ${totalCredit.toLocaleString('id-ID')}`)
      .text(`Total Debit: Rp ${totalDebit.toLocaleString('id-ID')}`);
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [50, 100, 60, 80, 80, 80, 200];
    const headers = ['No', 'Date', 'Type', 'Amount', 'Before', 'After', 'Description'];

    doc.fontSize(9).font('Helvetica-Bold');
    let x = tableLeft;
    headers.forEach((header, i) => {
      doc.text(header, x, tableTop, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
      x += colWidths[i];
    });

    // Table rows
    let y = tableTop + 20;
    doc.font('Helvetica').fontSize(8);
    
    transactions.forEach((transaction, index) => {
      if (y > 750) { // New page if needed
        doc.addPage();
        y = 50;
      }

      const row = [
        index + 1,
        new Date(transaction.createdAt).toLocaleDateString('id-ID'),
        transaction.type,
        `Rp ${transaction.amount.toLocaleString('id-ID')}`,
        `Rp ${transaction.balanceBefore.toLocaleString('id-ID')}`,
        `Rp ${transaction.balanceAfter.toLocaleString('id-ID')}`,
        (transaction.description || '').substring(0, 40),
      ];

      x = tableLeft;
      row.forEach((cell, i) => {
        doc.text(String(cell), x, y, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
        x += colWidths[i];
      });

      y += 15;
    });

    return {
      filename: `transaction_history_${organizer?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'organizer'}_${dateStr}.pdf`,
      stream: doc,
    };
  }
}

module.exports = new BalanceService();

