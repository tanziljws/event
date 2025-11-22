const express = require('express');
const ticketTypeService = require('../services/ticketTypeService');
const { authenticate, requireVerifiedOrganizer } = require('../middlewares/auth');
const { validateUUID } = require('../middlewares/validation');
const logger = require('../config/logger');

const router = express.Router();

// Validation middleware for ticket type data
const validateTicketTypeData = (req, res, next) => {
  const {
    name,
    capacity,
    price,
    isFree,
    minQuantity,
    maxQuantity,
    saleStartDate,
    saleEndDate,
  } = req.body;

  // Required fields
  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Ticket name is required',
    });
  }

  if (!capacity || capacity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Capacity must be greater than 0',
    });
  }

  // Price validation for paid tickets
  if (!isFree && (!price || price <= 0)) {
    return res.status(400).json({
      success: false,
      message: 'Price is required for paid tickets',
    });
  }

  // Quantity validation
  if (minQuantity && minQuantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Minimum quantity must be at least 1',
    });
  }

  if (maxQuantity && minQuantity && maxQuantity < minQuantity) {
    return res.status(400).json({
      success: false,
      message: 'Maximum quantity must be greater than or equal to minimum quantity',
    });
  }

  // Date validation
  if (saleStartDate && saleEndDate) {
    const startDate = new Date(saleStartDate);
    const endDate = new Date(saleEndDate);
    
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Sale end date must be after sale start date',
      });
    }
  }

  next();
};

// Create ticket type for event
router.post('/events/:eventId/ticket-types', 
  authenticate, 
  requireVerifiedOrganizer, 
  validateUUID('eventId'),
  validateTicketTypeData,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const creatorId = req.user.id;

      logger.info(`Creating ticket type for event: ${eventId} by user: ${creatorId}`);

      const ticketType = await ticketTypeService.createTicketType(
        eventId,
        req.body,
        creatorId
      );

      res.status(201).json({
        success: true,
        message: 'Ticket type created successfully',
        data: { ticketType },
      });
    } catch (error) {
      logger.error('Create ticket type error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Get ticket types for event (public - for event detail page)
router.get('/events/:eventId/ticket-types',
  validateUUID('eventId'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const ticketTypes = await ticketTypeService.getEventTicketTypes(
        eventId,
        includeInactive
      );

      res.status(200).json({
        success: true,
        data: { ticketTypes },
      });
    } catch (error) {
      logger.error('Get event ticket types error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ticket types',
      });
    }
  }
);

// Get ticket type by ID
router.get('/ticket-types/:ticketTypeId',
  validateUUID('ticketTypeId'),
  async (req, res) => {
    try {
      const { ticketTypeId } = req.params;

      const ticketType = await ticketTypeService.getTicketTypeById(ticketTypeId);

      res.status(200).json({
        success: true,
        data: { ticketType },
      });
    } catch (error) {
      logger.error('Get ticket type by ID error:', error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Update ticket type
router.put('/ticket-types/:ticketTypeId',
  authenticate,
  requireVerifiedOrganizer,
  validateUUID('ticketTypeId'),
  async (req, res) => {
    try {
      const { ticketTypeId } = req.params;
      const creatorId = req.user.id;

      logger.info(`Updating ticket type: ${ticketTypeId} by user: ${creatorId}`);

      const ticketType = await ticketTypeService.updateTicketType(
        ticketTypeId,
        req.body,
        creatorId
      );

      res.status(200).json({
        success: true,
        message: 'Ticket type updated successfully',
        data: { ticketType },
      });
    } catch (error) {
      logger.error('Update ticket type error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Delete ticket type
router.delete('/ticket-types/:ticketTypeId',
  authenticate,
  requireVerifiedOrganizer,
  validateUUID('ticketTypeId'),
  async (req, res) => {
    try {
      const { ticketTypeId } = req.params;
      const creatorId = req.user.id;

      logger.info(`Deleting ticket type: ${ticketTypeId} by user: ${creatorId}`);

      await ticketTypeService.deleteTicketType(ticketTypeId, creatorId);

      res.status(200).json({
        success: true,
        message: 'Ticket type deleted successfully',
      });
    } catch (error) {
      logger.error('Delete ticket type error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Reorder ticket types
router.put('/events/:eventId/ticket-types/reorder',
  authenticate,
  requireVerifiedOrganizer,
  validateUUID('eventId'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { ticketTypeIds } = req.body;
      const creatorId = req.user.id;

      if (!Array.isArray(ticketTypeIds)) {
        return res.status(400).json({
          success: false,
          message: 'ticketTypeIds must be an array',
        });
      }

      logger.info(`Reordering ticket types for event: ${eventId} by user: ${creatorId}`);

      await ticketTypeService.reorderTicketTypes(eventId, ticketTypeIds, creatorId);

      res.status(200).json({
        success: true,
        message: 'Ticket types reordered successfully',
      });
    } catch (error) {
      logger.error('Reorder ticket types error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Check ticket availability
router.get('/ticket-types/:ticketTypeId/availability',
  validateUUID('ticketTypeId'),
  async (req, res) => {
    try {
      const { ticketTypeId } = req.params;
      const quantity = parseInt(req.query.quantity) || 1;

      const availability = await ticketTypeService.checkTicketAvailability(
        ticketTypeId,
        quantity
      );

      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      logger.error('Check ticket availability error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Get ticket type statistics (organizer only)
router.get('/events/:eventId/ticket-types/stats',
  authenticate,
  requireVerifiedOrganizer,
  validateUUID('eventId'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const creatorId = req.user.id;

      const stats = await ticketTypeService.getTicketTypeStats(eventId, creatorId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Get ticket type stats error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Bulk create ticket types
router.post('/events/:eventId/ticket-types/bulk',
  authenticate,
  requireVerifiedOrganizer,
  validateUUID('eventId'),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { ticketTypes } = req.body;
      const creatorId = req.user.id;

      if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ticketTypes must be a non-empty array',
        });
      }

      logger.info(`Bulk creating ${ticketTypes.length} ticket types for event: ${eventId}`);

      const createdTicketTypes = [];
      for (const ticketTypeData of ticketTypes) {
        const ticketType = await ticketTypeService.createTicketType(
          eventId,
          ticketTypeData,
          creatorId
        );
        createdTicketTypes.push(ticketType);
      }

      res.status(201).json({
        success: true,
        message: `${createdTicketTypes.length} ticket types created successfully`,
        data: { ticketTypes: createdTicketTypes },
      });
    } catch (error) {
      logger.error('Bulk create ticket types error:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;