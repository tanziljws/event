const { Xendit } = require('xendit-node');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../config/logger');

class XenditService {
  constructor() {
    const secretKey = process.env.XENDIT_SECRET_KEY;
    const isProduction = process.env.XENDIT_IS_PRODUCTION === 'true';

    this.isProduction = isProduction;
    this.xenditClient = null;
    this.Disbursement = null;

    if (!secretKey) {
      logger.warn('⚠️ Xendit secret key not found. Disbursement features will not work.');
      logger.warn('⚠️ Set XENDIT_SECRET_KEY in environment variables to enable disbursement.');
      return;
    }

    try {
    this.xenditClient = new Xendit({
      secretKey: secretKey,
    });

      // Check available services in xendit-node v7
      const availableServices = Object.keys(this.xenditClient);
      logger.info('✅ Xendit client created. Available services:', availableServices);
      
      // For xendit-node v7, try different ways to access Disbursement
      // Method 1: Direct destructuring from Xendit
      try {
        const { Disbursement: DisbursementClass } = Xendit;
        if (DisbursementClass) {
          this.Disbursement = new DisbursementClass({
            secretKey: secretKey,
          });
          logger.info('✅ Disbursement instance created via destructuring');
        }
      } catch (destructureError) {
        logger.warn('⚠️ Destructuring method failed:', destructureError.message);
      }
      
      // Method 2: Try from xenditClient
      if (!this.Disbursement && this.xenditClient.Disbursement) {
        try {
          this.Disbursement = new this.xenditClient.Disbursement({
            secretKey: secretKey,
          });
          logger.info('✅ Disbursement instance created from xenditClient');
        } catch (clientError) {
          logger.warn('⚠️ xenditClient.Disbursement method failed:', clientError.message);
        }
      }
      
      // Method 3: Try using fetchApi directly (fallback)
      if (!this.Disbursement && this.xenditClient.fetchApi) {
        logger.info('⚠️ Using fetchApi fallback for Disbursement');
        this.Disbursement = {
          create: async (payload) => {
            return this.xenditClient.fetchApi({
              method: 'POST',
              path: '/disbursements',
              data: payload,
            });
          },
          getById: async ({ id }) => {
            return this.xenditClient.fetchApi({
              method: 'GET',
              path: `/disbursements/${id}`,
            });
          },
        };
        logger.info('✅ Disbursement wrapper created using fetchApi');
      }
      
      // Method 4: Direct HTTP API call (final fallback)
      if (!this.Disbursement) {
        logger.info('⚠️ Using direct HTTP API fallback for Disbursement');
        const baseUrl = 'https://api.xendit.co'; // Xendit uses same URL for both dev and prod
        
        this.Disbursement = {
          create: async (payload) => {
            try {
              logger.info('Making direct API call to Xendit:', { 
                url: `${baseUrl}/disbursements`,
                payload: { ...payload, accountNumber: payload.accountNumber ? '***' : undefined, phoneNumber: payload.channelProperties?.mobileNumber ? '***' : undefined }
              });
              
              const response = await axios.post(
                `${baseUrl}/disbursements`,
                payload,
                {
                  headers: {
                    'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
                    'Content-Type': 'application/json',
                  },
                  timeout: 30000, // 30 seconds timeout
                }
              );
              
              logger.info('Direct API call successful:', response.data?.id || response.data?.reference_id);
              return response.data;
            } catch (error) {
              const errorDetails = {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                requestPayload: {
                  ...payload,
                  accountNumber: payload.accountNumber ? '***' : undefined,
                  channelProperties: payload.channelProperties ? { mobileNumber: '***' } : undefined,
                },
              };

              logger.error('Direct API call error:', errorDetails);
              
              // Log full error response for debugging
              if (error.response?.data) {
                logger.error('Xendit error response:', JSON.stringify(error.response.data, null, 2));
              }
              
              // Throw more descriptive error with Xendit error details
              if (error.response?.data) {
                const xenditError = error.response.data;
                let errorMessage = xenditError.message || 'Unknown error';
                
                // If there are validation errors, include them
                if (Array.isArray(xenditError.errors)) {
                  const validationErrors = xenditError.errors.map(e => {
                    if (typeof e === 'string') return e;
                    return e.message || e.path || JSON.stringify(e);
                  }).join(', ');
                  errorMessage += ` | Validation errors: ${validationErrors}`;
                }
                
                // Include full error if available
                if (xenditError.error_code) {
                  errorMessage += ` | Error code: ${xenditError.error_code}`;
                }
                
                throw new Error(`Xendit API error (${error.response.status}): ${errorMessage}`);
              }
              throw error;
            }
          },
          getById: async ({ id }) => {
            try {
              const response = await axios.get(
                `${baseUrl}/disbursements/${id}`,
                {
                  headers: {
                    'Authorization': `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
                  },
                  timeout: 30000,
                }
              );
              return response.data;
            } catch (error) {
              logger.error('Direct API call error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
              });
              throw error;
            }
          },
        };
        logger.info('✅ Disbursement wrapper created using direct HTTP API');
      }
      
      // Log final status
      if (this.Disbursement) {
        logger.info('Disbursement instance methods:', Object.keys(this.Disbursement));
        logger.info('Has create method:', typeof this.Disbursement.create === 'function');
      } else {
        logger.error('❌ Disbursement service not available in Xendit client');
        logger.error('Available services:', availableServices);
        logger.error('xenditClient type:', typeof this.xenditClient);
        logger.error('xenditClient keys:', Object.keys(this.xenditClient));
      }
      
      logger.info(`✅ Xendit service initialized (${isProduction ? 'Production' : 'Development'})`);
      logger.info(`Xendit Disbursement available: ${!!this.Disbursement}`);
    } catch (error) {
      logger.error('❌ Error initializing Xendit client:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      this.xenditClient = null;
      this.Disbursement = null;
    }
  }

  /**
   * Create disbursement
   */
  async createDisbursement(disbursementData) {
    try {
      if (!this.Disbursement) {
        const errorMsg = !process.env.XENDIT_SECRET_KEY
          ? 'Xendit secret key not configured. Please set XENDIT_SECRET_KEY environment variable.'
          : 'Xendit Disbursement service not initialized. Check backend logs for initialization errors.';
        logger.error('❌ Xendit client not initialized:', errorMsg);
        throw new Error(errorMsg);
      }

      const {
        amount,
        bankCode,
        accountHolderName,
        accountNumber,
        description,
        externalId,
        emailTo,
        emailCC,
        emailBcc,
      } = disbursementData;

      // Validate required fields
      if (!amount || !bankCode || !accountHolderName || !accountNumber) {
        throw new Error('Missing required fields: amount, bankCode, accountHolderName, accountNumber');
      }

      // Prepare disbursement payload
      // Xendit API uses snake_case for field names
      const payload = {
        amount: parseInt(amount.toString()), // Ensure integer
        bank_code: bankCode,
        account_holder_name: accountHolderName,
        account_number: accountNumber,
        description: description || 'Payout from Event Management Platform',
        external_id: externalId || `DISB-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        ...(emailTo && { email_to: [emailTo] }),
        ...(emailCC && { email_cc: emailCC }),
        ...(emailBcc && { email_bcc: emailBcc }),
      };
      
      logger.info('Bank account payload (formatted):', {
        ...payload,
        account_number: '***',
      });

      logger.info('Creating Xendit disbursement:', { ...payload, accountNumber: '***' });

      // For xendit-node v7, use Disbursement.create() with payload directly
      if (typeof this.Disbursement.create !== 'function') {
        throw new Error(`Disbursement.create is not a function. Available methods: ${Object.keys(this.Disbursement).join(', ')}`);
      }

      const disbursement = await this.Disbursement.create(payload);

      logger.info(`Xendit disbursement created: ${disbursement.id || disbursement.reference_id}`);
      return disbursement;
    } catch (error) {
      logger.error('Error creating Xendit disbursement:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Create e-wallet disbursement (OVO, DANA, GOPAY, LINK_AJA)
   */
  async createEWalletDisbursement(disbursementData) {
    try {
      if (!this.Disbursement) {
        const errorMsg = !process.env.XENDIT_SECRET_KEY
          ? 'Xendit secret key not configured. Please set XENDIT_SECRET_KEY environment variable.'
          : 'Xendit Disbursement service not initialized. Check backend logs for initialization errors.';
        logger.error('❌ Xendit client not initialized:', errorMsg);
        throw new Error(errorMsg);
      }

      const {
        amount,
        eWalletType, // OVO, DANA, GOPAY, LINK_AJA
        phoneNumber,
        accountHolderName, // Optional: name of account holder
        description,
        externalId,
      } = disbursementData;

      // Validate required fields
      if (!amount || !eWalletType || !phoneNumber) {
        throw new Error('Missing required fields: amount, eWalletType, phoneNumber');
      }

      // Map e-wallet type to Xendit format
      // For e-wallet, Xendit uses different format
      const xenditEWalletType = eWalletType.toUpperCase();

      // Xendit e-wallet disbursement format
      // According to Xendit docs, e-wallet uses channelCode and channelProperties
      // Format phone number: remove leading 0, add country code if needed
      let formattedPhone = phoneNumber.toString().replace(/^0+/, ''); // Remove leading zeros
      if (!formattedPhone.startsWith('62')) {
        formattedPhone = `62${formattedPhone}`; // Add Indonesia country code
      }
      
      // Xendit e-wallet disbursement payload format
      // For e-wallet, Xendit requires bank_code, account_holder_name, and account_number
      // bank_code: e-wallet type (DANA, OVO, GOPAY, LINK_AJA)
      // account_holder_name: name of the account holder (required)
      // account_number: phone number for e-wallet (required)
      const payload = {
        external_id: externalId || `DISB-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        amount: parseInt(amount.toString()), // Ensure integer
        bank_code: xenditEWalletType, // DANA, OVO, GOPAY, LINK_AJA
        account_holder_name: accountHolderName || formattedPhone, // Use provided name or phone as fallback
        account_number: formattedPhone, // Phone number for e-wallet
        description: description || 'Payout from Event Management Platform',
      };

      logger.info('E-wallet payload (formatted):', {
        external_id: payload.external_id,
        amount: payload.amount,
        bank_code: payload.bank_code,
        account_holder_name: '***',
        account_number: '***',
        description: payload.description,
      });
      
      logger.info('Creating Xendit e-wallet disbursement:', {
        external_id: payload.external_id,
        amount: payload.amount,
        bank_code: payload.bank_code,
        account_holder_name: '***',
        account_number: '***',
        description: payload.description,
      });

      // For xendit-node v7, use Disbursement.create() with payload directly
      if (typeof this.Disbursement.create !== 'function') {
        throw new Error(`Disbursement.create is not a function. Available methods: ${Object.keys(this.Disbursement).join(', ')}`);
      }

      const disbursement = await this.Disbursement.create(payload);

      logger.info(`Xendit e-wallet disbursement created: ${disbursement.id || disbursement.reference_id}`);
      return disbursement;
    } catch (error) {
      logger.error('Error creating Xendit e-wallet disbursement:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Calculate disbursement fee
   * Based on Xendit pricing: Rp 2.500 base fee + 11% PPN = Rp 2.775 total
   */
  calculateDisbursementFee(amount) {
    // Xendit base fee per transaction
    const BASE_FEE = 2500;
    // PPN 11%
    const PPN_RATE = 0.11;
    const ppn = BASE_FEE * PPN_RATE;
    const totalFee = BASE_FEE + ppn;

    return {
      baseFee: BASE_FEE,
      ppn: Math.round(ppn),
      totalFee: Math.round(totalFee),
      netAmount: amount - Math.round(totalFee), // Amount after fee deduction
    };
  }

  /**
   * Get disbursement status
   */
  async getDisbursementStatus(xenditId) {
    try {
      if (!this.Disbursement) {
        const errorMsg = !process.env.XENDIT_SECRET_KEY
          ? 'Xendit secret key not configured. Please set XENDIT_SECRET_KEY environment variable.'
          : 'Xendit Disbursement service not initialized. Check backend logs for initialization errors.';
        logger.error('❌ Xendit client not initialized:', errorMsg);
        throw new Error(errorMsg);
      }

      // For xendit-node v7, use Disbursement.getById() directly with id
      if (typeof this.Disbursement.getById !== 'function') {
        throw new Error(`Disbursement.getById is not a function. Available methods: ${Object.keys(this.Disbursement).join(', ')}`);
      }

      const disbursement = await this.Disbursement.getById({
        id: xenditId,
      });

      return disbursement;
    } catch (error) {
      logger.error('Error getting Xendit disbursement status:', error);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(webhookData, signature) {
    try {
      const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN || '';
      if (!webhookToken) {
        logger.warn('Xendit webhook token not configured. Skipping signature validation.');
        return true; // Allow if token not configured
      }

      // Xendit webhook signature validation
      // Format: HMAC SHA256 of payload with webhook token
      const payload = JSON.stringify(webhookData);
      const expectedSignature = crypto
        .createHmac('sha256', webhookToken)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      logger.error('Error validating Xendit webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle webhook from Xendit
   */
  async handleWebhook(webhookData, signature) {
    try {
      // Validate signature
      if (!this.validateWebhookSignature(webhookData, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { id, status, failure_reason } = webhookData;

      logger.info(`Xendit webhook received: ${id}, status: ${status}`);

      return {
        xenditId: id,
        status: status.toUpperCase(), // PENDING, COMPLETED, FAILED
        failureReason: failure_reason || null,
      };
    } catch (error) {
      logger.error('Error handling Xendit webhook:', error);
      throw error;
    }
  }

  /**
   * Get available bank codes
   */
  getAvailableBankCodes() {
    return [
      { code: 'BCA', name: 'Bank Central Asia' },
      { code: 'BNI', name: 'Bank Negara Indonesia' },
      { code: 'BRI', name: 'Bank Rakyat Indonesia' },
      { code: 'MANDIRI', name: 'Bank Mandiri' },
      { code: 'PERMATA', name: 'Bank Permata' },
      { code: 'BSI', name: 'Bank Syariah Indonesia' },
      { code: 'CIMB', name: 'CIMB Niaga' },
      { code: 'DANAMON', name: 'Bank Danamon' },
      { code: 'OCBC', name: 'OCBC NISP' },
      { code: 'MAYBANK', name: 'Maybank Indonesia' },
    ];
  }

  /**
   * Get available e-wallet types
   */
  getAvailableEWalletTypes() {
    return [
      { code: 'OVO', name: 'OVO' },
      { code: 'DANA', name: 'DANA' },
      { code: 'GOPAY', name: 'GoPay' },
      { code: 'LINK_AJA', name: 'LinkAja' },
    ];
  }
}

module.exports = new XenditService();

