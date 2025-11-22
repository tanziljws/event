const axios = require('axios');
const crypto = require('crypto-js');
const logger = require('../config/logger');

class BitgetService {
  constructor() {
    this.apiKey = process.env.BITGET_API_KEY;
    this.secretKey = process.env.BITGET_SECRET_KEY;
    this.baseURL = process.env.BITGET_BASE_URL || 'https://api.bitget.com';
    this.depositAddress = process.env.BITGET_DEPOSIT_ADDRESS;
    this.passphrase = process.env.BITGET_PASSPHRASE || 'your_passphrase';
  }

  // Generate signature for API requests
  generateSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method + requestPath + body;
    return crypto.HmacSHA256(message, this.secretKey).toString();
  }

  // Get account balance
  async getAccountBalance(coin = 'USDT') {
    try {
      const timestamp = Date.now().toString();
      const method = 'GET';
      const requestPath = '/api/v2/spot/account/assets';
      
      const signature = this.generateSignature(timestamp, method, requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, {
        headers: {
          'ACCESS-KEY': this.apiKey,
          'ACCESS-SIGN': signature,
          'ACCESS-TIMESTAMP': timestamp,
          'ACCESS-PASSPHRASE': this.passphrase,
          'Content-Type': 'application/json'
        }
      });

      const balance = response.data.data.find(asset => asset.coin === coin);
      return balance ? parseFloat(balance.available) : 0;
    } catch (error) {
      logger.error('Error getting Bitget balance:', error);
      throw error;
    }
  }

  // Get deposit history
  async getDepositHistory(coin = 'USDT', limit = 100) {
    try {
      const timestamp = Date.now().toString();
      const method = 'GET';
      const requestPath = '/api/v2/spot/wallet/deposit-records';
      
      const signature = this.generateSignature(timestamp, method, requestPath);
      
      const response = await axios.get(`${this.baseURL}${requestPath}`, {
        headers: {
          'ACCESS-KEY': this.apiKey,
          'ACCESS-SIGN': signature,
          'ACCESS-TIMESTAMP': timestamp,
          'ACCESS-PASSPHRASE': this.passphrase,
          'Content-Type': 'application/json'
        },
        params: {
          coin,
          limit
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Error getting deposit history:', error);
      throw error;
    }
  }

  // Verify transaction
  async verifyTransaction(txHash, expectedAmount, expectedAddress) {
    try {
      const deposits = await this.getDepositHistory();
      
      // Find transaction by hash
      const transaction = deposits.find(deposit => 
        deposit.txId === txHash && 
        deposit.toAddress === expectedAddress
      );

      if (!transaction) {
        return { valid: false, reason: 'Transaction not found' };
      }

      // Check if transaction is confirmed
      if (transaction.status !== 'success') {
        return { valid: false, reason: 'Transaction not confirmed' };
      }

      // Check amount
      const receivedAmount = parseFloat(transaction.amount);
      if (receivedAmount < expectedAmount) {
        return { valid: false, reason: 'Insufficient amount' };
      }

      // Check if transaction is recent (max 24 hours)
      const txTime = new Date(transaction.timestamp);
      const now = new Date();
      const hoursDiff = (now - txTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        return { valid: false, reason: 'Transaction too old' };
      }

      return { 
        valid: true, 
        transaction,
        overpayment: receivedAmount - expectedAmount
      };
    } catch (error) {
      logger.error('Error verifying transaction:', error);
      throw error;
    }
  }

  // Monitor for new deposits
  async monitorDeposits(coin = 'USDT') {
    try {
      const deposits = await this.getDepositHistory(coin, 50);
      const recentDeposits = deposits.filter(deposit => {
        const txTime = new Date(deposit.timestamp);
        const now = new Date();
        const minutesDiff = (now - txTime) / (1000 * 60);
        return minutesDiff <= 30; // Last 30 minutes
      });

      return recentDeposits;
    } catch (error) {
      logger.error('Error monitoring deposits:', error);
      throw error;
    }
  }

  // Simulate transaction verification for testing
  async simulateTransactionVerification(txHash, expectedAmount, expectedAddress) {
    // For testing purposes, simulate a successful verification
    // In production, this would call the real Bitget API
    logger.info(`Simulating transaction verification: ${txHash}`);
    
    return {
      valid: true,
      transaction: {
        txId: txHash,
        amount: expectedAmount.toString(),
        toAddress: expectedAddress,
        status: 'success',
        timestamp: new Date().toISOString()
      },
      overpayment: 0
    };
  }
}

module.exports = new BitgetService();
