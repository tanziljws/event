const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const Midtrans = require('midtrans-client');
const { emailTemplates } = require('../config/brevoEmail');

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
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
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
          }],
          callbacks: {
            finish: `${frontendUrl}/payment/success`,
            pending: `${frontendUrl}/payment/pending`,
            error: `${frontendUrl}/payment/error`
          }
        };

        const transaction = await snap.createTransaction(parameter);
        // Midtrans Snap returns both token and redirect_url
        // Token is used for frontend snap.js popup/embed
        // redirect_url is used for redirect flow
        const snapToken = transaction.token;
        paymentUrl = transaction.redirect_url;
        console.log('✅ MIDTRANS: Payment token created:', snapToken);
        console.log('✅ MIDTRANS: Payment URL created:', paymentUrl);
        
        // Store token in payment metadata for frontend use
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            metadata: {
              ...payment.metadata,
              snapToken: snapToken
            }
          }
        });
      } catch (midtransError) {
        console.error('❌ MIDTRANS: Error creating payment URL:', midtransError);
        console.error('❌ MIDTRANS: Error details:', midtransError.message);
        // Don't create fallback URL - let error propagate
        throw new Error(`Midtrans payment creation failed: ${midtransError.message}`);
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

      // Get updated payment with snapToken
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: {
          id: true,
          amount: true,
          currency: true,
          paymentStatus: true,
          metadata: true
        }
      });

      return {
        success: true,
        message: 'Payment order created successfully',
        payment: {
          id: updatedPayment.id,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          status: updatedPayment.paymentStatus,
          paymentUrl: paymentUrl, // For redirect flow
          snapToken: updatedPayment.metadata?.snapToken || null, // For snap.js popup/embed
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

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return payment;
    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error getting payment by ID:', error);
      throw error;
    }
  },

  // Get payment by order ID (paymentReference)
  async getPaymentByOrderId(orderId, userId) {
    try {
      console.log('🔍 PAYMENT SERVICE: Getting payment by order ID:', orderId, 'for user:', userId);
      
      if (!orderId) {
        return {
          success: false,
          message: 'Order ID is required'
        };
      }

      // Build where clause
      const whereClause = {
        paymentReference: orderId
      };

      // Only filter by userId if provided (for security)
      if (userId) {
        whereClause.userId = userId;
      }

      const payment = await prisma.payment.findFirst({
        where: whereClause,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true
            }
          }
        }
      });

      if (!payment) {
        console.log('❌ PAYMENT SERVICE: Payment not found for order ID:', orderId);
        return {
          success: false,
          message: 'Payment not found'
        };
      }

      // Convert Decimal to Number for amount
      const amount = typeof payment.amount === 'object' && payment.amount.toNumber 
        ? payment.amount.toNumber() 
        : Number(payment.amount);

      return {
        success: true,
        payment: {
          id: payment.id,
          paymentReference: payment.paymentReference,
          amount: amount,
          currency: payment.currency,
          status: payment.paymentStatus,
          paymentMethod: payment.paymentMethod,
          eventId: payment.eventId,
          userId: payment.userId,
          registrationId: payment.registrationId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          paidAt: payment.paidAt,
          event: payment.event,
          user: payment.user ? {
            id: payment.user.id,
            fullName: payment.user.fullName,
            email: payment.user.email,
            phone: payment.user.phoneNumber // Map phoneNumber to phone for consistency
          } : null
        }
      };
    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error getting payment by order ID:', error);
      console.error('❌ PAYMENT SERVICE: Error stack:', error.stack);
      throw error;
    }
  },

  // Sync payment status with Midtrans (for localhost/development when webhook doesn't work)
  async syncPaymentStatusWithMidtrans(orderId, userId) {
    try {
      console.log('🔄 PAYMENT SERVICE: Syncing payment status with Midtrans for order:', orderId, 'userId:', userId || 'null');
      
      // Build where clause - userId is optional (for public access)
      const whereClause = {
        paymentReference: orderId
      };
      
      // Only filter by userId if provided (for security)
      if (userId) {
        whereClause.userId = userId;
      }
      
      // Get payment first
      const payment = await prisma.payment.findFirst({
        where: whereClause,
        include: { event: true }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check status from Midtrans
      const paymentGatewayService = require('./paymentGatewayService');
      const midtransStatus = await paymentGatewayService.verifyMidtransPayment(orderId);

      console.log('🔍 PAYMENT SERVICE: Midtrans status:', midtransStatus);

      // Map Midtrans status to our status
      let paymentStatus = payment.paymentStatus;
      if (midtransStatus.status === 'settlement' || midtransStatus.status === 'capture') {
        paymentStatus = midtransStatus.fraudStatus === 'accept' ? 'PAID' : 'PENDING';
      } else if (midtransStatus.status === 'pending') {
        paymentStatus = 'PENDING';
      } else if (midtransStatus.status === 'deny' || midtransStatus.status === 'cancel' || midtransStatus.status === 'expire') {
        paymentStatus = 'FAILED';
      }

      // Update payment status if changed
      if (paymentStatus !== payment.paymentStatus) {
        console.log(`🔄 PAYMENT SERVICE: Updating payment status from ${payment.paymentStatus} to ${paymentStatus}`);
        
        // Get existing metadata
        const existingMetadata = payment.metadata && typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {};
        
        // Update payment status and store payment details in metadata
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: paymentStatus,
            paidAt: paymentStatus === 'PAID' ? new Date() : null,
            metadata: {
              ...existingMetadata,
              paymentDetails: {
                transaction_status: midtransStatus.status,
                fraud_status: midtransStatus.fraudStatus,
                payment_type: midtransStatus.paymentType,
                transaction_time: midtransStatus.transactionTime,
                settlement_time: midtransStatus.settlementTime,
                syncedAt: new Date().toISOString()
              }
            }
          }
        });

        // If payment is now PAID, create registration
        if (paymentStatus === 'PAID') {
          await this.createEventRegistration(updatedPayment);
          
          // Generate and send invoice
          try {
            await this.generateAndSendInvoice(updatedPayment);
          } catch (invoiceError) {
            console.error('❌ PAYMENT SERVICE: Error generating/sending invoice:', invoiceError);
          }

          // Create payment success notifications
          try {
            const notificationService = require('./notificationService');
            await notificationService.createPaymentSuccessNotification(updatedPayment.id);
          } catch (notificationError) {
            console.error('❌ PAYMENT SERVICE: Error creating payment success notifications:', notificationError);
          }

          // Auto-calculate revenue and update balance
          try {
            const eventService = require('./eventService');
            const balanceService = require('./balanceService');
            
            // Get event to get organizer ID
            const event = await prisma.event.findUnique({
              where: { id: updatedPayment.eventId },
              select: { id: true, title: true, createdBy: true },
            });

            if (event) {
              // Calculate revenue for this event
              const revenue = await eventService.calculateEventRevenue(event.id);
              
              // Update organizer balance
              if (revenue.organizerRevenueId && revenue.organizerRevenue > 0) {
                try {
                  await balanceService.addRevenueCredit(
                    event.createdBy,
                    revenue.organizerRevenueId,
                    revenue.organizerRevenue,
                    `Revenue dari event: ${event.title}`,
                    {
                      eventId: event.id,
                      eventTitle: event.title,
                    }
                  );
                  console.log(`✅ PAYMENT SERVICE: Balance updated for organizer ${event.createdBy}: +${revenue.organizerRevenue}`);
                } catch (balanceError) {
                  console.error('❌ PAYMENT SERVICE: Error updating balance:', balanceError);
                  // Don't fail the payment process if balance update fails
                }
              }
            }
          } catch (balanceError) {
            console.error('❌ PAYMENT SERVICE: Error updating balance:', balanceError);
            // Don't throw error - balance update is not critical for payment flow
          }
        }

        return {
          success: true,
          message: 'Payment status synced successfully',
          paymentStatus: paymentStatus,
          payment: updatedPayment
        };
      } else {
        console.log('✅ PAYMENT SERVICE: Payment status already up to date');
        return {
          success: true,
          message: 'Payment status already up to date',
          paymentStatus: paymentStatus,
          payment: payment
        };
      }
    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error syncing payment status:', error);
      throw error;
    }
  },

  // Trigger registration manually (for localhost/development when webhook doesn't work)
  async triggerRegistrationFromPayment(paymentId, userId) {
    try {
      console.log('🔄 PAYMENT SERVICE: Triggering registration from payment:', paymentId);
      
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          event: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.userId !== userId) {
        throw new Error('Payment does not belong to this user');
      }

      // Check if payment is PAID - if PENDING, try to sync first
      if (payment.paymentStatus === 'PENDING') {
        console.log('🔄 Payment status is PENDING, attempting to sync with Midtrans first...');
        try {
          // Try to sync payment status
          const syncResult = await this.syncPaymentStatusWithMidtrans(payment.paymentReference, userId);
          if (syncResult.success && syncResult.paymentStatus === 'PAID') {
            console.log('✅ Payment status synced to PAID, proceeding with registration...');
            // Re-fetch payment to get updated status
            const updatedPayment = await prisma.payment.findUnique({
              where: { id: paymentId },
              include: { event: true }
            });
            if (updatedPayment && updatedPayment.paymentStatus === 'PAID') {
              payment = updatedPayment;
            } else {
              throw new Error(`Payment is still not completed after sync. Status: ${updatedPayment?.paymentStatus || 'UNKNOWN'}`);
            }
          } else {
            throw new Error(`Payment is not completed. Status: ${payment.paymentStatus}. Sync result: ${syncResult.paymentStatus || 'UNKNOWN'}`);
          }
        } catch (syncError) {
          console.error('❌ Error syncing payment status:', syncError);
          throw new Error(`Payment is not completed. Status: ${payment.paymentStatus}. Sync failed: ${syncError.message}`);
        }
      } else if (payment.paymentStatus !== 'PAID') {
        throw new Error(`Payment is not completed. Status: ${payment.paymentStatus}`);
      }

      // Check if registration already exists
      if (payment.registrationId) {
        const existingReg = await prisma.eventRegistration.findUnique({
          where: { id: payment.registrationId }
        });

        if (existingReg) {
          console.log('✅ Registration already exists for this payment');
          return {
            success: true,
            message: 'Registration already exists',
            registration: existingReg
          };
        }
      }

      // Create registration using eventService
      const eventService = require('./eventService');
      const result = await eventService.registerForEventAfterPayment(
        payment.eventId,
        payment.userId,
        payment.id
      );

      console.log('✅ PAYMENT SERVICE: Registration created:', result.registration.id);
      
      return {
        success: true,
        message: 'Registration created successfully',
        registration: result.registration
      };
    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error triggering registration:', error);
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
      
      // Get existing metadata
      const existingMetadata = payment.metadata && typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {};
      
      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: paymentStatus,
          paidAt: paymentStatus === 'PAID' ? new Date() : null,
          metadata: {
            ...existingMetadata,
            paymentDetails: {
              transaction_status,
              fraud_status,
              payment_type,
              transaction_time
            }
          }
        }
      });
      
      console.log('✅ PAYMENT SERVICE: Payment status updated:', updatedPayment.id, paymentStatus);
      
      // If payment is successful, create event registration and send invoice
      if (paymentStatus === 'PAID') {
        await this.createEventRegistration(payment);
        
        // Generate and send invoice
        try {
          await this.generateAndSendInvoice(payment);
        } catch (invoiceError) {
          console.error('❌ PAYMENT SERVICE: Error generating/sending invoice:', invoiceError);
          // Don't throw error - invoice is not critical
        }

        // Auto-calculate revenue and update balance
        try {
          const eventService = require('./eventService');
          const balanceService = require('./balanceService');
          
          // Calculate revenue for this event
          const revenue = await eventService.calculateEventRevenue(payment.eventId);
          
          // Update organizer balance
          if (revenue.organizerRevenueId && revenue.organizerRevenue > 0) {
            await balanceService.addRevenueCredit(
              payment.event.createdBy,
              revenue.organizerRevenueId,
              revenue.organizerRevenue,
              `Revenue dari event: ${payment.event.title}`,
              {
                eventId: payment.eventId,
                eventTitle: payment.event.title,
              }
            );
            console.log(`✅ PAYMENT SERVICE: Balance updated for organizer ${payment.event.createdBy}: +${revenue.organizerRevenue}`);
          }
        } catch (balanceError) {
          console.error('❌ PAYMENT SERVICE: Error updating balance:', balanceError);
          // Don't throw error - balance update is not critical for payment flow
          // But log it for manual review
        }
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
  },

  // Generate and send invoice after successful payment
  async generateAndSendInvoice(payment) {
    try {
      console.log('📄 PAYMENT SERVICE: Generating invoice for payment:', payment.id);
      
      const invoicePdfService = require('./invoicePdfService');
      
      // Get payment with event and user details
      const paymentWithDetails = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: {
          event: {
            select: {
              title: true,
              eventDate: true,
              eventTime: true,
              location: true
            }
          },
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!paymentWithDetails) {
        throw new Error('Payment not found');
      }

      // Get ticket type if exists
      const ticketTypeId = paymentWithDetails.metadata?.ticketTypeId || null;
      let ticketType = null;
      if (ticketTypeId) {
        ticketType = await prisma.ticketType.findUnique({
          where: { id: ticketTypeId },
          select: { name: true }
        });
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${payment.id.substring(0, 8).toUpperCase()}`;

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber,
        paymentId: payment.id,
        customerName: paymentWithDetails.user.fullName,
        customerEmail: paymentWithDetails.user.email,
        customerPhone: paymentWithDetails.user.phone || null,
        eventTitle: paymentWithDetails.event.title,
        eventDate: paymentWithDetails.event.eventDate,
        eventTime: paymentWithDetails.event.eventTime || null,
        eventLocation: paymentWithDetails.event.location || null,
        amount: paymentWithDetails.amount,
        quantity: parseInt(paymentWithDetails.metadata?.quantity || '1') || 1,
        ticketType: ticketType?.name || 'Event Registration',
        paymentStatus: paymentWithDetails.paymentStatus,
        paidAt: paymentWithDetails.paidAt,
        paymentMethod: paymentWithDetails.paymentMethod || 'Midtrans',
        transactionId: paymentWithDetails.paymentReference || null
      };

      // Generate invoice PDF
      const invoiceResult = await invoicePdfService.generateInvoicePdf(invoiceData);

      // Store invoice URL in payment metadata
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            ...paymentWithDetails.metadata,
            invoiceNumber: invoiceNumber,
            invoiceUrl: invoiceResult.invoiceUrl
          }
        }
      });

      // Send invoice email with PDF attachment
      await emailTemplates.sendInvoiceEmail(invoiceData, invoiceResult.pdfBuffer);

      console.log('✅ PAYMENT SERVICE: Invoice generated and sent:', invoiceNumber);
      
      return {
        invoiceNumber,
        invoiceUrl: invoiceResult.invoiceUrl,
        filePath: invoiceResult.filePath
      };

    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error generating invoice:', error);
      throw error;
    }
  },

  // Cancel payment order
  async cancelPayment(paymentId, userId) {
    try {
      console.log('🔄 PAYMENT SERVICE: Cancelling payment:', paymentId);

      // Get payment and verify ownership
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          event: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Verify user owns this payment
      if (payment.userId !== userId) {
        throw new Error('Unauthorized to cancel this payment');
      }

      // Only allow cancellation if payment is still PENDING
      if (payment.paymentStatus !== 'PENDING') {
        throw new Error(`Cannot cancel payment with status: ${payment.paymentStatus}`);
      }

      // Update payment status to EXPIRED (closest to cancelled in PaymentStatus enum)
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: 'EXPIRED', // Using EXPIRED as PaymentStatus enum doesn't have CANCELLED
          metadata: {
            ...payment.metadata,
            cancelledAt: new Date().toISOString(),
            cancelledBy: userId,
            cancellationReason: 'User cancelled payment'
          }
        }
      });

      console.log('✅ PAYMENT SERVICE: Payment cancelled:', paymentId);

      return {
        success: true,
        message: 'Payment cancelled successfully',
        payment: updatedPayment
      };

    } catch (error) {
      console.error('❌ PAYMENT SERVICE: Error cancelling payment:', error);
      throw error;
    }
  }
};

module.exports = paymentService;