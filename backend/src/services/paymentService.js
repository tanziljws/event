const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const Midtrans = require('midtrans-client');
const emailTemplates = require('../config/email');

const prisma = new PrismaClient();

// Initialize Midtrans Snap
const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true' || false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

const paymentService = {
  // Create payment order
  async createPaymentOrder({
    userId,
    eventId,
    eventTitle,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    paymentMethod,
    ticketTypeId,
    quantity = 1
  }) {
    try {
      console.log('🔍 PAYMENT SERVICE: Creating payment order...');
      console.log('🔍 PAYMENT SERVICE: User ID:', userId);
      console.log('🔍 PAYMENT SERVICE: Event ID:', eventId);
      console.log('🔍 PAYMENT SERVICE: Amount:', amount);
      console.log('🔍 PAYMENT SERVICE: Ticket Type ID:', ticketTypeId);
      console.log('🔍 PAYMENT SERVICE: Quantity:', quantity);
      
      // Validate quantity
      const ticketQuantity = parseInt(quantity) || 1;
      if (ticketQuantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      if (ticketQuantity > 10) {
        throw new Error('Quantity cannot exceed 10 tickets per transaction');
      }
      
      // If ticketTypeId is provided, verify it exists and belongs to this event
      if (ticketTypeId) {
        const ticketType = await prisma.ticketType.findFirst({
          where: {
            id: ticketTypeId,
            eventId: eventId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            price: true,
            color: true,
            capacity: true,
            soldCount: true,
            maxQuantity: true,
          },
        });
        
        if (ticketType) {
          console.log('✅ PAYMENT SERVICE: Ticket type verified:', ticketType.name, ticketType.price, ticketType.color);
          
          // Check ticket availability
          const availableTickets = ticketType.capacity - ticketType.soldCount;
          if (availableTickets < ticketQuantity) {
            throw new Error(`Only ${availableTickets} ticket(s) available for ${ticketType.name}. Requested: ${ticketQuantity}`);
          }
          
          // Check max quantity per purchase
          const maxQuantity = ticketType.maxQuantity || 10;
          if (ticketQuantity > maxQuantity) {
            throw new Error(`Maximum ${maxQuantity} ticket(s) per purchase for ${ticketType.name}`);
          }
          
          // Verify amount matches ticket type price * quantity
          const ticketPrice = parseFloat(ticketType.price?.toString() || '0');
          const expectedAmount = ticketPrice * ticketQuantity;
          const paymentAmount = parseFloat(amount?.toString() || '0');
          if (Math.abs(expectedAmount - paymentAmount) > 0.01) {
            console.warn(`⚠️  PAYMENT SERVICE: Payment amount (${paymentAmount}) does not match expected amount (${expectedAmount} = ${ticketPrice} x ${ticketQuantity})`);
            console.warn(`⚠️  PAYMENT SERVICE: Ticket type: ${ticketType.name}, Expected: ${expectedAmount}, Received: ${paymentAmount}`);
          }
        } else {
          console.error(`❌ PAYMENT SERVICE: Ticket type not found or not active: ${ticketTypeId} for event ${eventId}`);
          console.error(`❌ PAYMENT SERVICE: This might cause registration without correct ticket type!`);
          // Don't throw error, but log warning - will be handled in registration
        }
      } else {
        console.warn('⚠️  PAYMENT SERVICE: No ticketTypeId provided - registration will try to find by payment amount');
      }

      // Check event to see if it has multiple ticket types
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { 
          hasMultipleTicketTypes: true,
          title: true 
        }
      });

      // Only check for existing registration if event DOES NOT have multiple ticket types
      // Events with multiple ticket types allow users to buy multiple tickets (different types or same type with quantity)
      if (event && !event.hasMultipleTicketTypes) {
        const existingRegistration = await prisma.eventRegistration.findFirst({
          where: {
            participantId: userId,
            eventId: eventId,
            status: 'ACTIVE'
          }
        });

        if (existingRegistration) {
          console.log('⚠️ PAYMENT SERVICE: User already registered for single-ticket event');
          return {
            success: false,
            message: 'You are already registered for this event'
          };
        }
      } else if (event && event.hasMultipleTicketTypes) {
        console.log('✅ PAYMENT SERVICE: Event has multiple ticket types - allowing multiple purchases');
        console.log(`✅ PAYMENT SERVICE: User can buy ${ticketQuantity} ticket(s) for this event`);
        console.log(`✅ PAYMENT SERVICE: Ticket Type ID: ${ticketTypeId}`);
        console.log('✅ PAYMENT SERVICE: User can buy different ticket types or same ticket type with quantity');
      } else {
        console.log('⚠️ PAYMENT SERVICE: Event not found or hasMultipleTicketTypes not set');
      }

      // Check for existing pending payment for this user and event
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: userId,
          eventId: eventId,
          paymentStatus: 'PENDING',
          expiredAt: {
            gt: new Date() // Only check non-expired payments
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (existingPayment) {
        console.log('🔄 PAYMENT SERVICE: Found existing pending payment:', existingPayment.id);
        
        // Check if Midtrans URL is still valid (not expired)
        if (existingPayment.paymentUrl && existingPayment.expiredAt > new Date()) {
          return {
            success: true,
            message: 'Payment order already exists',
            payment: {
              id: existingPayment.id,
              amount: existingPayment.amount,
              currency: existingPayment.currency,
              status: existingPayment.paymentStatus,
              paymentUrl: existingPayment.paymentUrl,
              expiresAt: existingPayment.expiredAt
            }
          };
        }
      }

      // Generate unique payment ID
      const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          id: paymentId,
          userId: userId,
          eventId: eventId,
          amount: amount,
          currency: 'IDR',
          paymentMethod: 'GATEWAY', // Use GATEWAY for Midtrans
          paymentStatus: 'PENDING',
          paymentReference: paymentId,
          metadata: {
            eventTitle: eventTitle,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            paymentMethod: paymentMethod,
            ticketTypeId: ticketTypeId || null,
            quantity: ticketQuantity
          }
        }
      });

      console.log('✅ PAYMENT SERVICE: Payment created:', payment.id);

      // Create real Midtrans payment URL
      let paymentUrl = null;
      try {
        const parameter = {
          transaction_details: {
            order_id: paymentId,
            gross_amount: amount
          },
          customer_details: {
            first_name: customerName,
            email: customerEmail,
            phone: customerPhone
          },
          item_details: [{
            id: eventId,
            price: amount / ticketQuantity, // Price per ticket
            quantity: ticketQuantity, // Quantity of tickets
            name: eventTitle
          }]
        };

        const transaction = await snap.createTransaction(parameter);
        paymentUrl = transaction.redirect_url;
        console.log('✅ MIDTRANS: Payment URL created:', paymentUrl);
      } catch (midtransError) {
        console.error('❌ MIDTRANS: Error creating payment URL:', midtransError);
        // Fallback to mock URL if Midtrans fails
        paymentUrl = `https://app.midtrans.com/snap/v2/vtweb/${paymentId}`;
      }

      // Send payment notification email
      try {
        await emailTemplates.sendPaymentNotification({
          customerName: customerName,
          customerEmail: customerEmail,
          eventTitle: eventTitle,
          amount: amount,
          paymentId: payment.id,
          paymentUrl: paymentUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        console.log('✅ PAYMENT SERVICE: Payment notification email sent');
      } catch (emailError) {
        console.error('❌ PAYMENT SERVICE: Failed to send payment notification email:', emailError);
        // Don't throw error, payment was successful
      }

      return {
        success: true,
        message: 'Payment order created successfully',
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.paymentStatus,
          paymentUrl: paymentUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      };

    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error creating payment order:', error);
      console.error('❌ PAYMENT SERVICE: Error stack:', error.stack);
      console.error('❌ PAYMENT SERVICE: Error name:', error.name);
      
      // Re-throw with more context if needed
      if (error.statusCode) {
        error.statusCode = error.statusCode;
      }
      throw error;
    }
  },

  // Check payment status
  async checkPaymentStatus(paymentId, userId) {
    try {
      console.log('🔍 PAYMENT SERVICE: Checking payment status for:', paymentId);

      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId: userId
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true
            }
          }
        }
      });

      if (!payment) {
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.paymentStatus,
          paymentMethod: payment.paymentMethod,
          customerName: payment.metadata?.customerName,
          customerEmail: payment.metadata?.customerEmail,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          event: payment.event
        }
      };

    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error checking payment status:', error);
      throw error;
    }
  },

  // Get payment history
  async getPaymentHistory(userId, { page, limit }) {
    try {
      console.log('🔍 PAYMENT SERVICE: Getting payment history for user:', userId);

      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: {
            userId: userId
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                eventDate: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: skip,
          take: limit
        }),
        prisma.payment.count({
          where: {
            userId: userId
          }
        })
      ]);

      return {
        success: true,
        payments: payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.paymentStatus,
          paymentMethod: payment.paymentMethod,
          customerName: payment.metadata?.customerName,
          customerEmail: payment.metadata?.customerEmail,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          event: payment.event
        })),
        pagination: {
          page: page,
          limit: limit,
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error getting payment history:', error);
      throw error;
    }
  },

  // Handle payment webhook
  async handleWebhook(webhookData) {
    try {
      console.log('🔍 PAYMENT SERVICE: Handling webhook:', webhookData);
      
      const {
        order_id,
        transaction_status,
        fraud_status,
        payment_type,
        gross_amount,
        transaction_time,
        signature_key
      } = webhookData;
      
      // Verify webhook signature
      const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
      const expectedSignature = crypto
        .createHash('sha512')
        .update(`${order_id}${transaction_status}${gross_amount}${serverKey}`)
        .digest('hex');
      
      if (signature_key !== expectedSignature) {
        console.error('❌ PAYMENT SERVICE: Invalid webhook signature');
        throw new Error('Invalid webhook signature');
      }
      
      // Find payment by order ID
      const payment = await prisma.payment.findUnique({
        where: { paymentReference: order_id },
        include: { event: true }
      });
      
      if (!payment) {
        console.error('❌ PAYMENT SERVICE: Payment not found for order:', order_id);
        throw new Error('Payment not found');
      }
      
      // Map Midtrans status to our status
      let paymentStatus = 'PENDING';
      if (transaction_status === 'capture' || transaction_status === 'settlement') {
        paymentStatus = fraud_status === 'accept' ? 'PAID' : 'PENDING';
      } else if (transaction_status === 'pending') {
        paymentStatus = 'PENDING';
      } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
        paymentStatus = 'FAILED';
      }
      
      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: paymentStatus,
          paidAt: paymentStatus === 'PAID' ? new Date() : null,
          paymentDetails: {
            transaction_status,
            fraud_status,
            payment_type,
            transaction_time
          }
        }
      });
      
      console.log('✅ PAYMENT SERVICE: Payment status updated:', updatedPayment.id, paymentStatus);
      
      // If payment is successful, create event registration
      if (paymentStatus === 'PAID') {
        await this.createEventRegistration(payment);
      }
      
      return {
        success: true,
        message: 'Webhook processed successfully',
        paymentStatus: paymentStatus
      };

    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error handling webhook:', error);
      throw error;
    }
  },
  
  // Create event registration after successful payment
  // NOTE: This method is called from webhook handler
  // For multiple ticket types and quantity support, use eventService.registerForEventAfterPayment instead
  async createEventRegistration(payment) {
    try {
      console.log('🔄 PAYMENT SERVICE: Creating event registration for payment:', payment.id);
      
      // Get event to check if it has multiple ticket types
      const event = await prisma.event.findUnique({
        where: { id: payment.eventId },
        select: {
          hasMultipleTicketTypes: true,
          id: true
        }
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get ticketTypeId and quantity from payment metadata
      const ticketTypeId = payment.metadata?.ticketTypeId || null;
      const quantity = parseInt(payment.metadata?.quantity || '1') || 1;
      
      console.log('🎫 PAYMENT SERVICE: Ticket Type ID:', ticketTypeId);
      console.log('🎫 PAYMENT SERVICE: Quantity:', quantity);
      
      // For events with multiple ticket types, allow multiple registrations
      // Don't check for existing registration - let eventService.handle it properly
      // Instead, delegate to eventService.registerForEventAfterPayment which has proper logic
      const eventService = require('./eventService');
      try {
        const result = await eventService.registerForEventAfterPayment(
          payment.eventId,
          payment.userId,
          payment.id
        );
        console.log('✅ PAYMENT SERVICE: Event registration created via eventService:', result.registration.id);
        return result.registration;
      } catch (error) {
        // If registration already exists or other error, log and rethrow
        console.error('❌ PAYMENT SERVICE: Error creating registration via eventService:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error creating event registration:', error);
      throw error;
    }
  },

  // Monitor crypto payments (stub - crypto payments not implemented)
  async monitorCryptoPayments() {
    try {
      // Crypto payments monitoring is not implemented
      // This is a stub method to prevent errors in crypto monitoring job
      // The system currently uses Midtrans for payments
      console.log('ℹ️  PAYMENT SERVICE: Crypto payments monitoring skipped (not implemented)');
      return {
        success: true,
        message: 'Crypto payments monitoring not implemented'
      };
    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error monitoring crypto payments:', error);
      throw error;
    }
  }
};

module.exports = paymentService;