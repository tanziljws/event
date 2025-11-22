const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate, requireParticipant } = require('../middlewares/auth');
const { secureNotFound } = require('../middlewares/security');

// Public routes (no authentication required)
router.get('/verify/:ticketNumber', ticketController.verifyTicket);

// Protected routes (authentication required) - Participant only with 404 security
router.use(secureNotFound, authenticate, requireParticipant);

// Ticket management
router.get('/', ticketController.getUserTickets);
router.get('/registration/:registrationId', ticketController.getTicketByRegistration);
router.get('/qr/:ticketNumber', ticketController.getTicketQRCode);

module.exports = router;
