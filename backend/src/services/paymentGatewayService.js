const midtransClient = require('midtrans-client');
const logger = require('../config/logger');

// Duitku - conditional import to handle missing config
let Duitku;
try {
  Duitku = require('duitku-nodejs');
} catch (error) {
  logger.warn('Duitku module not available:', error.message);
  Duitku = null;
}

class PaymentGatewayService {
  constructor() {
    // Midtrans configuration
    this.midtrans = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    // Duitku configuration - only if module is available
    if (Duitku) {
      this.duitku = {
        merchantCode: process.env.DUITKU_MERCHANT_CODE || 'DS12345',
        apiKey: process.env.DUITKU_API_KEY || 'cfe9361fbc148f4a4d071397023e197e',
        callbackUrl: process.env.DUITKU_CALLBACK_URL || 'http://localhost:5000/api/payments/gateway/duitku/notification',
        returnUrl: process.env.DUITKU_RETURN_URL || 'http://localhost:3001/payment/success',
        isProduction: process.env.NODE_ENV === 'production',
        // Duitku methods
        createInvoice: Duitku.createInvoice,
        checkTransaction: Duitku.checkTransaction,
        requestTransaction: Duitku.requestTransaction,
        getPaymentMethod: Duitku.getPaymentMethod
      };
    } else {
      this.duitku = null;
    }
  }

  // Create Midtrans payment
  async createMidtransPayment(paymentData) {
    try {
      const {
        orderId,
        amount,
        customerDetails,
        itemDetails,
        paymentMethod = 'all'
      } = paymentData;

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: customerDetails,
        item_details: itemDetails,
        payment_type: 'snap',
        enabled_payments: this.getEnabledPayments(paymentMethod),
        callbacks: {
          finish: `${process.env.FRONTEND_URL}/payment/success`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
          error: `${process.env.FRONTEND_URL}/payment/error`
        }
      };

      const response = await this.midtrans.createTransaction(parameter);
      
      logger.info(`Midtrans payment created: ${orderId}`);
      return {
        success: true,
        paymentUrl: response.redirect_url,
        token: response.token,
        gateway: 'midtrans'
      };
    } catch (error) {
      logger.error('Midtrans payment creation error:', error);
      throw new Error(`Midtrans payment failed: ${error.message}`);
    }
  }

  // Create Duitku payment
  async createDuitkuPayment(paymentData) {
    try {
      if (!this.duitku) {
        throw new Error('Duitku service not available');
      }

      const {
        orderId,
        amount,
        customerDetails,
        itemDetails,
        paymentMethod = 'all'
      } = paymentData;

      const parameter = {
        merchantOrderId: orderId,
        paymentAmount: amount,
        merchantUserInfo: customerDetails.first_name,
        productDetails: itemDetails[0].name,
        customerVaName: customerDetails.first_name,
        email: customerDetails.email,
        phoneNumber: customerDetails.phone,
        paymentMethod: this.getDuitkuPaymentMethod(paymentMethod),
        additionalParam: {
          paymentMethod: paymentMethod
        }
      };

      const response = await this.duitku.createInvoice(parameter, {
        merchantCode: this.duitku.merchantCode,
        apiKey: this.duitku.apiKey,
        callbackUrl: this.duitku.callbackUrl,
        returnUrl: this.duitku.returnUrl,
        isProduction: this.duitku.isProduction
      });
      
      logger.info(`Duitku payment created: ${orderId}`);
      return {
        success: true,
        paymentUrl: response.paymentUrl,
        reference: response.reference,
        gateway: 'duitku'
      };
    } catch (error) {
      logger.error('Duitku payment creation error:', error);
      throw new Error(`Duitku payment failed: ${error.message}`);
    }
  }

  // Verify Midtrans payment
  async verifyMidtransPayment(orderId) {
    try {
      const response = await this.midtrans.transaction.status(orderId);
      
      return {
        success: true,
        status: response.transaction_status,
        paymentType: response.payment_type,
        fraudStatus: response.fraud_status,
        grossAmount: response.gross_amount,
        transactionTime: response.transaction_time,
        settlementTime: response.settlement_time,
        gateway: 'midtrans'
      };
    } catch (error) {
      logger.error('Midtrans verification error:', error);
      throw new Error(`Midtrans verification failed: ${error.message}`);
    }
  }

  // Verify Duitku payment
  async verifyDuitkuPayment(orderId) {
    try {
      const response = await this.duitku.checkTransaction(orderId, {
        merchantCode: this.duitku.merchantCode,
        apiKey: this.duitku.apiKey
      });
      
      return {
        success: true,
        status: response.status,
        paymentMethod: response.paymentMethod,
        amount: response.amount,
        reference: response.reference,
        gateway: 'duitku'
      };
    } catch (error) {
      logger.error('Duitku verification error:', error);
      throw new Error(`Duitku verification failed: ${error.message}`);
    }
  }

  // Handle Midtrans notification
  async handleMidtransNotification(notification) {
    try {
      const orderId = notification.order_id;
      const status = notification.transaction_status;
      const fraudStatus = notification.fraud_status;

      // Verify notification authenticity
      const isValid = await this.midtrans.transaction.notification(notification);
      
      if (!isValid) {
        throw new Error('Invalid Midtrans notification');
      }

      return {
        orderId,
        status: this.mapMidtransStatus(status, fraudStatus),
        paymentType: notification.payment_type,
        grossAmount: notification.gross_amount,
        transactionTime: notification.transaction_time,
        settlementTime: notification.settlement_time
      };
    } catch (error) {
      logger.error('Midtrans notification handling error:', error);
      throw error;
    }
  }

  // Handle Duitku callback
  async handleDuitkuCallback(callbackData) {
    try {
      const { merchantOrderId, resultCode, reference } = callbackData;
      
      return {
        orderId: merchantOrderId,
        status: this.mapDuitkuStatus(resultCode),
        reference,
        resultCode
      };
    } catch (error) {
      logger.error('Duitku callback handling error:', error);
      throw error;
    }
  }

  // Get enabled payment methods for Midtrans
  getEnabledPayments(paymentMethod) {
    const allPayments = [
      'credit_card', 'bca_va', 'bni_va', 'bri_va', 'mandiri_va',
      'cimb_va', 'permata_va', 'gopay', 'shopeepay', 'qris',
      'bca_klikbca', 'bca_klikpay', 'bri_epay', 'echannel',
      'permata_va', 'bca_va', 'bni_va', 'other_va', 'indomaret',
      'alfamart', 'kioson', 'gci', 'akulaku'
    ];

    if (paymentMethod === 'all') return allPayments;
    if (paymentMethod === 'ewallet') return ['gopay', 'shopeepay', 'qris'];
    if (paymentMethod === 'va') return ['bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'cimb_va', 'permata_va'];
    if (paymentMethod === 'convenience') return ['indomaret', 'alfamart', 'kioson'];
    
    return [paymentMethod];
  }

  // Get Duitku payment method
  getDuitkuPaymentMethod(paymentMethod) {
    const methodMap = {
      'all': 'ALL',
      'ewallet': 'EWALLET',
      'va': 'VA',
      'convenience': 'CS',
      'gopay': 'GO',
      'dana': 'DA',
      'ovo': 'OV',
      'shopeepay': 'SP',
      'linkaja': 'LA',
      'bca_va': 'BC',
      'bni_va': 'BN',
      'bri_va': 'BR',
      'mandiri_va': 'MD',
      'indomaret': 'ID',
      'alfamart': 'AF'
    };

    return methodMap[paymentMethod] || 'ALL';
  }

  // Map Midtrans status to our status
  mapMidtransStatus(transactionStatus, fraudStatus) {
    if (fraudStatus === 'challenge') return 'PENDING';
    if (fraudStatus === 'deny') return 'FAILED';
    if (fraudStatus === 'accept') {
      switch (transactionStatus) {
        case 'capture': return 'PAID';
        case 'settlement': return 'PAID';
        case 'pending': return 'PENDING';
        case 'deny': return 'FAILED';
        case 'cancel': return 'CANCELLED';
        case 'expire': return 'EXPIRED';
        case 'failure': return 'FAILED';
        default: return 'PENDING';
      }
    }
    return 'PENDING';
  }

  // Map Duitku status to our status
  mapDuitkuStatus(resultCode) {
    switch (resultCode) {
      case '00': return 'PAID';
      case '01': return 'PENDING';
      case '02': return 'FAILED';
      case '03': return 'CANCELLED';
      case '04': return 'EXPIRED';
      default: return 'PENDING';
    }
  }

  // Get payment methods list
  getAvailablePaymentMethods() {
    return {
      ewallet: [
        { code: 'gopay', name: 'GoPay', icon: 'gopay.png' },
        { code: 'dana', name: 'DANA', icon: 'dana.png' },
        { code: 'ovo', name: 'OVO', icon: 'ovo.png' },
        { code: 'shopeepay', name: 'ShopeePay', icon: 'shopeepay.png' },
        { code: 'linkaja', name: 'LinkAja', icon: 'linkaja.png' }
      ],
      va: [
        { code: 'bca_va', name: 'BCA Virtual Account', icon: 'bca.png' },
        { code: 'bni_va', name: 'BNI Virtual Account', icon: 'bni.png' },
        { code: 'bri_va', name: 'BRI Virtual Account', icon: 'bri.png' },
        { code: 'mandiri_va', name: 'Mandiri Virtual Account', icon: 'mandiri.png' }
      ],
      convenience: [
        { code: 'indomaret', name: 'Indomaret', icon: 'indomaret.png' },
        { code: 'alfamart', name: 'Alfamart', icon: 'alfamart.png' }
      ],
      qris: [
        { code: 'qris', name: 'QRIS', icon: 'qris.png' }
      ]
    };
  }
}

module.exports = new PaymentGatewayService();
