const eventCancellationService = require('../services/eventCancellationService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

class EventCancellationController {
  // Cancel event
  async cancelEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason is required'
        });
      }

      const result = await eventCancellationService.cancelEvent(eventId, reason, userId);

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      logger.error('Cancel event error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel event'
      });
    }
  }

  // Get cancellation history
  async getCancellationHistory(req, res) {
    try {
      const { eventId } = req.params;

      const result = await eventCancellationService.getCancellationHistory(eventId);

      res.json(result);

    } catch (error) {
      logger.error('Get cancellation history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get cancellation history'
      });
    }
  }

  // Get refund status
  async getRefundStatus(req, res) {
    try {
      const { refundReference } = req.params;

      const result = await eventCancellationService.getRefundStatus(refundReference);

      res.json(result);

    } catch (error) {
      logger.error('Get refund status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get refund status'
      });
    }
  }

  // Update refund status (webhook)
  async updateRefundStatus(req, res) {
    try {
      const { refundReference } = req.params;
      const { status, gatewayResponse } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const result = await eventCancellationService.updateRefundStatus(
        refundReference, 
        status, 
        gatewayResponse
      );

      res.json(result);

    } catch (error) {
      logger.error('Update refund status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update refund status'
      });
    }
  }

  // Get cancellation policy for event
  async getCancellationPolicy(req, res) {
    try {
      const { eventId } = req.params;

      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const policy = eventCancellationService.getCancellationPolicy(event, new Date());

      res.json({
        success: true,
        data: {
          eventId,
          eventTitle: event.title,
          eventDate: event.eventDate,
          isFree: event.isFree,
          price: event.price,
          policy
        }
      });

    } catch (error) {
      logger.error('Get cancellation policy error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get cancellation policy'
      });
    }
  }
}

module.exports = new EventCancellationController();
