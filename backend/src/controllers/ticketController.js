const paymentService = require('../services/paymentService');
const ticketService = require('../services/ticketService');
const logger = require('../config/logger');

class TicketController {
  // Verify ticket
  async verifyTicket(req, res) {
    try {
      const { ticketNumber } = req.params;

      if (!ticketNumber) {
        return res.status(400).json({
          success: false,
          message: 'Ticket number is required'
        });
      }

      const ticket = await paymentService.getTicketInfo(ticketNumber);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        data: { ticket }
      });

    } catch (error) {
      logger.error('Error verifying ticket:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Scan ticket (mark as used)
  async scanTicket(req, res) {
    try {
      const { ticketNumber } = req.body;

      if (!ticketNumber) {
        return res.status(400).json({
          success: false,
          message: 'Ticket number is required'
        });
      }

      const ticket = await paymentService.scanTicket(ticketNumber);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found'
        });
      }

      res.json({
        success: true,
        message: 'Ticket scanned successfully',
        data: { ticket }
      });

    } catch (error) {
      logger.error('Error scanning ticket:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get ticket by registration ID
  async getTicketByRegistration(req, res) {
    try {
      const { registrationId } = req.params;
      const { id: userId } = req.user;

      if (!registrationId) {
        return res.status(400).json({
          success: false,
          message: 'Registration ID is required'
        });
      }

      const ticket = await ticketService.getTicketByRegistration(registrationId, userId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found for this registration'
        });
      }

      res.json({
        success: true,
        data: ticket
      });

    } catch (error) {
      logger.error('Error getting ticket by registration:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get QR code data for ticket
  async getTicketQRCode(req, res) {
    try {
      const { ticketNumber } = req.params;

      if (!ticketNumber) {
        return res.status(400).json({
          success: false,
          message: 'Ticket number is required'
        });
      }

      const qrCodeData = await paymentService.getQRCodeData(ticketNumber);

      res.json({
        success: true,
        data: qrCodeData
      });

    } catch (error) {
      logger.error('Error getting ticket QR code:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // Get user tickets
  async getUserTickets(req, res) {
    try {
      const { id: userId } = req.user;
      const { page = 1, limit = 10, search, status } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      };

      const result = await ticketService.getUserTickets(userId, filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting user tickets:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = new TicketController();
