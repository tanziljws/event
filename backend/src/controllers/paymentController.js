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
  }
};

module.exports = paymentController;