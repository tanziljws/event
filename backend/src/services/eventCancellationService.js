const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');
const { emailTemplates } = require('../config/brevoEmail');
const paymentService = require('./paymentService');

class EventCancellationService {
  constructor() {
    this.cancellationPolicies = {
      FREE_EVENT: {
        canCancel: true,
        refundRequired: false,
        noticePeriod: 0, // Can cancel anytime
        refundPercentage: 0
      },
      PAID_EVENT: {
        canCancel: true,
        refundRequired: true,
        noticePeriod: 7, // 7 days notice required
        refundPercentage: 100, // Full refund
        lateCancellationFee: 0.1 // 10% fee for late cancellation
      },
      PAID_EVENT_LATE: {
        canCancel: true,
        refundRequired: true,
        noticePeriod: 3, // 3 days notice
        refundPercentage: 90, // 90% refund
        lateCancellationFee: 0.1 // 10% fee
      },
      PAID_EVENT_EMERGENCY: {
        canCancel: true,
        refundRequired: true,
        noticePeriod: 1, // 1 day notice
        refundPercentage: 80, // 80% refund
        lateCancellationFee: 0.2 // 20% fee
      }
    };
  }

  // Determine cancellation policy based on event and timing
  getCancellationPolicy(event, cancellationDate) {
    const eventDate = new Date(event.eventDate);
    const daysUntilEvent = Math.ceil((eventDate - cancellationDate) / (1000 * 60 * 60 * 24));
    
    if (event.isFree || !event.price) {
      return this.cancellationPolicies.FREE_EVENT;
    }
    
    // Paid event policies based on timing
    if (daysUntilEvent >= 7) {
      return this.cancellationPolicies.PAID_EVENT;
    } else if (daysUntilEvent >= 3) {
      return this.cancellationPolicies.PAID_EVENT_LATE;
    } else if (daysUntilEvent >= 1) {
      return this.cancellationPolicies.PAID_EVENT_EMERGENCY;
    } else {
      // Event is today or past - cannot cancel
      return {
        canCancel: false,
        reason: 'Event is today or has already passed'
      };
    }
  }

  // Cancel event with automatic refund processing
  async cancelEvent(eventId, reason, cancelledBy) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          registrations: {
            include: {
              participant: true,
              payments: {
                where: {
                  paymentStatus: 'COMPLETED'
                }
              }
            }
          },
          creator: true
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.isPublished) {
        throw new Error('Event is not published');
      }

      const cancellationDate = new Date();
      const policy = this.getCancellationPolicy(event, cancellationDate);

      if (!policy.canCancel) {
        throw new Error(`Cannot cancel event: ${policy.reason}`);
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update event status
        const updatedEvent = await tx.event.update({
          where: { id: eventId },
          data: {
            isPublished: false,
            updatedAt: new Date()
          }
        });

        // 2. Create cancellation record
        const cancellation = await tx.eventCancellation.create({
          data: {
            eventId,
            reason,
            cancelledBy,
            cancellationDate,
            policy: JSON.stringify(policy),
            refundRequired: policy.refundRequired,
            refundPercentage: policy.refundPercentage,
            lateCancellationFee: policy.lateCancellationFee || 0
          }
        });

        // 3. Process refunds for paid events
        const refundResults = [];
        if (policy.refundRequired && event.registrations.length > 0) {
          for (const registration of event.registrations) {
            if (registration.payments.length > 0) {
              const refundResult = await this.processRefund(
                registration, 
                policy, 
                cancellation.id,
                tx
              );
              refundResults.push(refundResult);
            }
          }
        }

        return {
          event: updatedEvent,
          cancellation,
          refunds: refundResults
        };
      });

      // 4. Send notifications
      await this.sendCancellationNotifications(event, result.cancellation, result.refunds);

      logger.info(`Event cancelled: ${eventId}, refunds processed: ${result.refunds.length}`);

      return {
        success: true,
        message: 'Event cancelled successfully',
        data: {
          event: result.event,
          cancellation: result.cancellation,
          refunds: result.refunds,
          policy
        }
      };

    } catch (error) {
      logger.error('Event cancellation error:', error);
      throw error;
    }
  }

  // Process refund for individual registration
  async processRefund(registration, policy, cancellationId, tx) {
    try {
      const payment = registration.payments[0]; // Get the main payment
      const refundAmount = Math.floor(payment.amount * policy.refundPercentage);
      const feeAmount = Math.floor(payment.amount * (policy.lateCancellationFee || 0));
      const netRefund = refundAmount - feeAmount;

      // Create refund record
      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          registrationId: registration.id,
          cancellationId,
          refundAmount,
          feeAmount,
          netRefund,
          refundPercentage: policy.refundPercentage,
          refundStatus: 'PENDING',
          refundMethod: payment.paymentMethod,
          refundReference: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          createdAt: new Date()
        }
      });

      // Update payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: netRefund
        }
      });

      // Update registration status
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });

      return {
        registrationId: registration.id,
        participantEmail: registration.participant.email,
        refundAmount: netRefund,
        feeAmount,
        refundReference: refund.refundReference,
        status: 'PENDING'
      };

    } catch (error) {
      logger.error('Refund processing error:', error);
      throw error;
    }
  }

  // Send cancellation notifications
  async sendCancellationNotifications(event, cancellation, refunds) {
    try {
      // 1. Notify event creator
      await emailTemplates.sendEventCancellationNotification(
        event.creator.email,
        event,
        cancellation,
        refunds.length
      );

      // 2. Notify all participants
      for (const refund of refunds) {
        await emailTemplates.sendParticipantCancellationNotification(
          refund.participantEmail,
          event,
          cancellation,
          refund
        );
      }

      logger.info(`Cancellation notifications sent: creator + ${refunds.length} participants`);

    } catch (error) {
      logger.error('Notification sending error:', error);
      // Don't fail cancellation if notifications fail
    }
  }

  // Get cancellation history
  async getCancellationHistory(eventId) {
    try {
      const cancellations = await prisma.eventCancellation.findMany({
        where: { eventId },
        include: {
          refunds: {
            include: {
              payment: true,
              registration: {
                include: {
                  participant: true
                }
              }
            }
          }
        },
        orderBy: { cancellationDate: 'desc' }
      });

      return {
        success: true,
        data: cancellations
      };

    } catch (error) {
      logger.error('Get cancellation history error:', error);
      throw error;
    }
  }

  // Get refund status
  async getRefundStatus(refundReference) {
    try {
      const refund = await prisma.refund.findUnique({
        where: { refundReference },
        include: {
          payment: true,
          registration: {
            include: {
              participant: true,
              event: true
            }
          },
          cancellation: true
        }
      });

      if (!refund) {
        throw new Error('Refund not found');
      }

      return {
        success: true,
        data: refund
      };

    } catch (error) {
      logger.error('Get refund status error:', error);
      throw error;
    }
  }

  // Update refund status (for payment gateway integration)
  async updateRefundStatus(refundReference, status, gatewayResponse = null) {
    try {
      const refund = await prisma.refund.update({
        where: { refundReference },
        data: {
          refundStatus: status,
          gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : null,
          updatedAt: new Date()
        }
      });

      // If refund completed, send confirmation email
      if (status === 'COMPLETED') {
        await emailTemplates.sendRefundConfirmation(
          refund.registration.participant.email,
          refund
        );
      }

      return {
        success: true,
        data: refund
      };

    } catch (error) {
      logger.error('Update refund status error:', error);
      throw error;
    }
  }
}

module.exports = new EventCancellationService();
