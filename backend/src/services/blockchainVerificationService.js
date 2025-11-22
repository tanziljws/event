const axios = require('axios');
const logger = require('../config/logger');

class BlockchainVerificationService {
  constructor() {
    this.explorers = {
      BTC: {
        mainnet: 'https://blockstream.info/api',
        testnet: 'https://blockstream.info/testnet/api'
      },
      ETH: {
        mainnet: 'https://api.etherscan.io/api',
        testnet: 'https://api-sepolia.etherscan.io/api'
      },
      USDT: {
        mainnet: 'https://api.etherscan.io/api', // USDT on Ethereum
        testnet: 'https://api-sepolia.etherscan.io/api'
      }
    };
    
    this.apiKeys = {
      etherscan: process.env.ETHERSCAN_API_KEY || '4WUNQXWN657I7631JSFMD7BUWPYSEZCTRF',
      blockstream: process.env.BLOCKSTREAM_API_KEY || null
    };
    
    this.confirmationRequirements = {
      BTC: 3,    // Bitcoin: 3-6 confirmations
      ETH: 12,   // Ethereum: 12 confirmations  
      USDT: 12   // USDT on Ethereum: 12 confirmations
    };
  }

  // Verify Bitcoin transaction
  async verifyBitcoinTransaction(txHash, expectedAmount, expectedAddress) {
    try {
      const isTestnet = process.env.NODE_ENV !== 'production';
      const baseUrl = isTestnet ? this.explorers.BTC.testnet : this.explorers.BTC.mainnet;
      
      // Get transaction details
      const txResponse = await axios.get(`${baseUrl}/tx/${txHash}`);
      const tx = txResponse.data;
      
      // Get transaction status
      const statusResponse = await axios.get(`${baseUrl}/tx/${txHash}/status`);
      const status = statusResponse.data;
      
      // Check if transaction is confirmed
      const confirmations = status.confirmed ? status.block_height : 0;
      const requiredConfirmations = this.confirmationRequirements.BTC;
      
      if (confirmations < requiredConfirmations) {
        return {
          verified: false,
          status: 'pending',
          confirmations,
          requiredConfirmations,
          message: `Transaction needs ${requiredConfirmations - confirmations} more confirmations`
        };
      }
      
      // Verify amount and address
      const output = tx.vout.find(vout => 
        vout.scriptpubkey_address === expectedAddress
      );
      
      if (!output) {
        return {
          verified: false,
          status: 'invalid_address',
          message: 'Transaction does not contain expected address'
        };
      }
      
      const receivedAmount = output.value / 100000000; // Convert satoshis to BTC
      const expectedAmountBTC = expectedAmount / 100000000;
      
      if (receivedAmount < expectedAmountBTC) {
        return {
          verified: false,
          status: 'insufficient_amount',
          receivedAmount: receivedAmount,
          expectedAmount: expectedAmountBTC,
          message: 'Insufficient amount received'
        };
      }
      
      return {
        verified: true,
        status: 'confirmed',
        confirmations,
        receivedAmount: receivedAmount,
        expectedAmount: expectedAmountBTC,
        txHash,
        blockHeight: status.block_height,
        message: 'Transaction verified successfully'
      };
      
    } catch (error) {
      logger.error('Bitcoin verification error:', error);
      return {
        verified: false,
        status: 'error',
        message: 'Failed to verify Bitcoin transaction'
      };
    }
  }

  // Verify Ethereum/USDT transaction
  async verifyEthereumTransaction(txHash, expectedAmount, expectedAddress, tokenContract = null) {
    try {
      const isTestnet = process.env.NODE_ENV !== 'production';
      const baseUrl = isTestnet ? this.explorers.ETH.testnet : this.explorers.ETH.mainnet;
      
      // Get transaction details
      const txResponse = await axios.get(`${baseUrl}`, {
        params: {
          module: 'proxy',
          action: 'eth_getTransactionByHash',
          txhash: txHash,
          apikey: this.apiKeys.etherscan
        }
      });
      
      if (txResponse.data.error) {
        return {
          verified: false,
          status: 'error',
          message: 'Transaction not found or invalid'
        };
      }
      
      const tx = txResponse.data.result;
      
      // Get transaction receipt for confirmations
      const receiptResponse = await axios.get(`${baseUrl}`, {
        params: {
          module: 'proxy',
          action: 'eth_getTransactionReceipt',
          txhash: txHash,
          apikey: this.apiKeys.etherscan
        }
      });
      
      const receipt = receiptResponse.data.result;
      
      if (!receipt) {
        return {
          verified: false,
          status: 'pending',
          message: 'Transaction is pending'
        };
      }
      
      // Get current block number for confirmation count
      const blockResponse = await axios.get(`${baseUrl}`, {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: this.apiKeys.etherscan
        }
      });
      
      const currentBlock = parseInt(blockResponse.data.result, 16);
      const txBlock = parseInt(receipt.blockNumber, 16);
      const confirmations = currentBlock - txBlock;
      
      const requiredConfirmations = this.confirmationRequirements.ETH;
      
      if (confirmations < requiredConfirmations) {
        return {
          verified: false,
          status: 'pending',
          confirmations,
          requiredConfirmations,
          message: `Transaction needs ${requiredConfirmations - confirmations} more confirmations`
        };
      }
      
      // Verify address
      if (tx.to.toLowerCase() !== expectedAddress.toLowerCase()) {
        return {
          verified: false,
          status: 'invalid_address',
          message: 'Transaction does not contain expected address'
        };
      }
      
      // For USDT, we need to check token transfer
      if (tokenContract) {
        // Get token transfer logs
        const logsResponse = await axios.get(`${baseUrl}`, {
          params: {
            module: 'logs',
            action: 'getLogs',
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
            address: tokenContract,
            topic0: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
            apikey: this.apiKeys.etherscan
          }
        });
        
        const logs = logsResponse.data.result;
        const transferLog = logs.find(log => 
          log.topics[2].toLowerCase() === expectedAddress.toLowerCase().replace('0x', '').padStart(64, '0')
        );
        
        if (!transferLog) {
          return {
            verified: false,
            status: 'no_token_transfer',
            message: 'No token transfer found to expected address'
          };
        }
        
        // Decode amount (USDT has 6 decimals)
        const amountHex = transferLog.data;
        const amount = parseInt(amountHex, 16) / 1000000; // Convert to USDT
        
        if (amount < expectedAmount) {
          return {
            verified: false,
            status: 'insufficient_amount',
            receivedAmount: amount,
            expectedAmount: expectedAmount,
            message: 'Insufficient USDT amount received'
          };
        }
        
        return {
          verified: true,
          status: 'confirmed',
          confirmations,
          receivedAmount: amount,
          expectedAmount: expectedAmount,
          txHash,
          blockNumber: receipt.blockNumber,
          message: 'USDT transaction verified successfully'
        };
      } else {
        // ETH transaction
        const amount = parseInt(tx.value, 16) / 1000000000000000000; // Convert wei to ETH
        
        if (amount < expectedAmount) {
          return {
            verified: false,
            status: 'insufficient_amount',
            receivedAmount: amount,
            expectedAmount: expectedAmount,
            message: 'Insufficient ETH amount received'
          };
        }
        
        return {
          verified: true,
          status: 'confirmed',
          confirmations,
          receivedAmount: amount,
          expectedAmount: expectedAmount,
          txHash,
          blockNumber: receipt.blockNumber,
          message: 'ETH transaction verified successfully'
        };
      }
      
    } catch (error) {
      logger.error('Ethereum verification error:', error);
      return {
        verified: false,
        status: 'error',
        message: 'Failed to verify Ethereum transaction'
      };
    }
  }

  // Main verification method
  async verifyTransaction(txHash, coin, expectedAmount, expectedAddress) {
    try {
      logger.info(`Verifying ${coin} transaction: ${txHash}`);
      
      switch (coin.toUpperCase()) {
        case 'BTC':
          return await this.verifyBitcoinTransaction(txHash, expectedAmount, expectedAddress);
          
        case 'ETH':
          return await this.verifyEthereumTransaction(txHash, expectedAmount, expectedAddress);
          
        case 'USDT':
          // USDT on Ethereum
          const usdtContract = process.env.NODE_ENV === 'production' 
            ? '0xdAC17F958D2ee523a2206206994597C13D831ec7' // Mainnet USDT
            : '0x509Ee0d083DdF8AC028f2a56731412edD63223B9'; // Testnet USDT
          return await this.verifyEthereumTransaction(txHash, expectedAmount, expectedAddress, usdtContract);
          
        default:
          return {
            verified: false,
            status: 'unsupported_coin',
            message: `Unsupported coin: ${coin}`
          };
      }
    } catch (error) {
      logger.error('Transaction verification error:', error);
      return {
        verified: false,
        status: 'error',
        message: 'Failed to verify transaction'
      };
    }
  }

  // Get transaction status without full verification
  async getTransactionStatus(txHash, coin) {
    try {
      const result = await this.verifyTransaction(txHash, coin, 0, '0x0000000000000000000000000000000000000000');
      return {
        status: result.status,
        confirmations: result.confirmations,
        requiredConfirmations: result.requiredConfirmations,
        message: result.message
      };
    } catch (error) {
      logger.error('Get transaction status error:', error);
      return {
        status: 'error',
        message: 'Failed to get transaction status'
      };
    }
  }
}

module.exports = new BlockchainVerificationService();
