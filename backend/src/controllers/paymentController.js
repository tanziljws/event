const paymentService = require('../services/paymentService');
// const { validationResult } = require('express-validator'); // Not using validation middleware in this controller

const paymentController = {
  // Create payment order
  async createPaymentOrder(req, res) {
    try {
      console.log('🔍 PAYMENT: Creating payment order...');
      console.log('🔍 PAYMENT: Request body:', req.body);
      console.log('🔍 PAYMENT: User:', req.user?.email);

      // Note: validationResult requires validator middleware, but we're not using it here
      // So we'll skip validation and do manual validation instead
      // const errors = validationResult(req);
      // if (!errors.isEmpty()) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Validation failed',
      //     errors: errors.array()
      //   });
      // }

      const {
        eventId,
        eventTitle,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        ticketTypeId,
        quantity
      } = req.body;

      console.log('🎫 PAYMENT CONTROLLER: Ticket Type ID:', ticketTypeId);
      console.log('🎫 PAYMENT CONTROLLER: Quantity:', quantity);

      // Validate required fields
      if (!eventId || !amount || !customerName || !customerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: eventId, amount, customerName, customerEmail'
        });
      }

      const result = await paymentService.createPaymentOrder({
        userId: req.user.id,
        eventId,
        eventTitle: eventTitle || 'Event Registration',
        amount: parseFloat(amount),
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        paymentMethod: paymentMethod || 'midtrans',
        ticketTypeId: ticketTypeId || null,
        quantity: quantity || 1
      });

      console.log('✅ PAYMENT: Payment order created successfully');
      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error creating payment order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: error.message
      });
    }
  },

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      console.log('🔍 PAYMENT: Checking payment status for:', paymentId);

      const result = await paymentService.checkPaymentStatus(paymentId, userId);

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error checking payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        error: error.message
      });
    }
  },

  // Get payment history
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      console.log('🔍 PAYMENT: Getting payment history for user:', userId);

      const result = await paymentService.getPaymentHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error getting payment history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment history',
        error: error.message
      });
    }
  },

  // Process payment
  async processPayment(req, res) {
    try {
      const userId = req.user.id;
      const { orderId, amount, customerName, customerEmail, customerPhone } = req.body;

      console.log('🔍 PAYMENT: Processing payment for order:', orderId);

      // For now, return success (actual processing happens via webhook)
      const result = {
        success: true,
        message: 'Payment processing initiated',
        orderId: orderId,
        status: 'PENDING'
      };

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: error.message
      });
    }
  },

  // Handle payment webhook
  async handlePaymentWebhook(req, res) {
    try {
      console.log('🔍 PAYMENT: Webhook received:', req.body);

      const result = await paymentService.handleWebhook(req.body);

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error handling webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to handle webhook',
        error: error.message
      });
    }
  },

  // Get payment by order ID
  async getPaymentByOrderId(req, res) {
    try {
      const { orderId } = req.params;
      // userId is optional - if user is authenticated, use it for security
      // If not authenticated, we can still get payment by orderId (for public success page)
      const userId = req.user?.id || null;

      console.log('🔍 PAYMENT: Getting payment by order ID:', orderId, 'for user:', userId || 'anonymous');

      const result = await paymentService.getPaymentByOrderId(orderId, userId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error getting payment by order ID:', error);
      console.error('❌ PAYMENT: Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment',
        error: error.message || 'Internal server error'
      });
    }
  },

  // Sync payment status with Midtrans
  async syncPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id || null;

      console.log('🔄 PAYMENT: Syncing payment status with Midtrans for order:', orderId);

      const result = await paymentService.syncPaymentStatusWithMidtrans(orderId, userId);

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error syncing payment status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to sync payment status',
        error: error.message
      });
    }
  },

  // Trigger registration manually
  async triggerRegistration(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      console.log('🔄 PAYMENT: Triggering registration for payment:', paymentId);

      const result = await paymentService.triggerRegistrationFromPayment(paymentId, userId);

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error triggering registration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to trigger registration',
        error: error.message
      });
    }
  },

  // Download invoice
  async downloadInvoice(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      console.log('📄 PAYMENT: Download invoice request:', paymentId);

      // Get payment with invoice URL
      const payment = await paymentService.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user owns this payment
      if (payment.userId !== userId && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access this invoice'
        });
      }

      // Get invoice URL from metadata
      const invoiceUrl = payment.metadata?.invoiceUrl;

      if (!invoiceUrl) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found for this payment'
        });
      }

      // Read invoice file
      const path = require('path');
      const fs = require('fs').promises;
      const invoicePath = path.join(__dirname, '../../uploads/invoices', path.basename(invoiceUrl));

      try {
        const invoiceBuffer = await fs.readFile(invoicePath);
        const invoiceNumber = payment.metadata?.invoiceNumber || paymentId;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoiceNumber}.pdf"`);
        res.send(invoiceBuffer);
      } catch (fileError) {
        console.error('❌ PAYMENT: Error reading invoice file:', fileError);
        return res.status(404).json({
          success: false,
          message: 'Invoice file not found'
        });
      }

    } catch (error) {
      console.error('❌ PAYMENT: Error downloading invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download invoice',
        error: error.message
      });
    }
  },

  // Cancel payment
  async cancelPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      console.log('🔄 PAYMENT: Cancelling payment:', paymentId);

      const result = await paymentService.cancelPayment(paymentId, userId);

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error cancelling payment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel payment',
        error: error.message
      });
    }
  }
};

module.exports = paymentController;