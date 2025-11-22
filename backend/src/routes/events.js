const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate, optionalAuthenticate, requireAdmin, requireParticipant, requireVerifiedOrganizer } = require('../middlewares/auth');
const { secureNotFound } = require('../middlewares/security');
const {
  validateEventCreation,
  validateEventUpdate,
  validateEventRegistration,
  validateAttendance,
  validateQRCode,
  validateAdminCheckIn,
  validateUUID,
  validatePagination,
  validateSearch,
} = require('../middlewares/validation');
const { eventRegistrationRateLimit } = require('../middlewares/security');

const router = express.Router();

// Public routes
router.get('/', validatePagination, eventController.getEvents);
router.get('/search', validateSearch, eventController.searchEvents);
router.post('/verify-private', eventController.verifyPrivateEventPassword);

// Protected routes - Organizer only
router.post('/', authenticate, requireVerifiedOrganizer, validateEventCreation, eventController.createEvent);

// Protected routes - Admin only (MUST be before /:id routes)
router.post('/admin/check-in', authenticate, requireAdmin, validateAdminCheckIn, eventController.adminCheckIn);
router.post('/admin/detect-event', authenticate, requireAdmin, eventController.detectEventFromToken);
router.get('/admin/attendance/:id', authenticate, requireAdmin, validateUUID('id'), eventController.getEventAttendance);

// Protected routes - Organizer only (MUST be before /:id routes)
router.get('/organizer', authenticate, requireVerifiedOrganizer, validatePagination, eventController.getOrganizerEvents);
router.get('/organizer/:id', authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.getOrganizerEventById);
router.put('/organizer/:id', authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.updateOrganizerEvent);
router.post('/organizer/check-in', authenticate, requireVerifiedOrganizer, validateAdminCheckIn, eventController.organizerCheckIn);
router.post('/organizer/detect-event', authenticate, requireVerifiedOrganizer, eventController.detectOrganizerEventFromToken);
router.get('/organizer/attendance/:id', authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.getOrganizerEventAttendance);
router.get('/organizer/export/attendance/:id', authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.exportOrganizerEventAttendance);
router.get('/organizer/export/registrations/:id', authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.exportOrganizerEventRegistrations);
router.patch('/organizer/:id/publish', authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.publishOrganizerEvent);

// Protected routes - Participant only (specific routes first)
router.post('/scan-qr', authenticate, requireParticipant, validateQRCode, eventController.scanQRCode);
router.get('/my/registrations', authenticate, requireParticipant, validatePagination, eventController.getUserEventRegistrations);

// Payment routes (MUST be before /:id routes)
router.post('/:id/payment/create-order', 
  validateUUID('id'),
  authenticate,
  requireParticipant,
  async (req, res) => {
    try {
      console.log('🔍 PAYMENT: Creating payment order...');
      console.log('🔍 PAYMENT: Request body:', req.body);
      console.log('🔍 PAYMENT: User:', req.user?.email);
      console.log('🔍 PAYMENT: Event ID:', req.params.id);

      const {
        eventTitle,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        ticketTypeId,
        quantity
      } = req.body;

      const eventId = req.params.id;

      // Validate required fields
      if (!amount || !customerName || !customerEmail) {
        console.error('❌ PAYMENT: Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: amount, customerName, customerEmail'
        });
      }

      // Import payment service
      const paymentService = require('../services/paymentService');

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

      console.log('✅ PAYMENT: Payment order created successfully:', result?.payment?.id);
      res.status(200).json(result);

    } catch (error) {
      console.error('❌ PAYMENT: Error creating payment order:', error);
      console.error('❌ PAYMENT: Error stack:', error.stack);
      
      // Return more specific error messages
      const errorMessage = error.message || 'Failed to create payment order';
      const statusCode = error.statusCode || 500;
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Protected routes - Admin only (with 404 security)
// Note: Admin event creation moved to admin routes

// ALL ROUTES WITH PARAMETERS MUST BE AT THE BOTTOM (last resort)
// Protected routes - Participant only (with 404 security)
router.post('/:id/register', secureNotFound, authenticate, requireParticipant, validateEventRegistration, eventRegistrationRateLimit, eventController.registerForEvent);
router.post('/:id/register-after-payment', secureNotFound, authenticate, requireParticipant, eventController.registerForEventAfterPayment);
// router.delete('/:id/cancel-registration', secureNotFound, authenticate, requireParticipant, validateUUID('id'), eventController.cancelEventRegistration);
// router.post('/:id/attendance', secureNotFound, authenticate, requireParticipant, validateAttendance, eventController.markAttendance);

// Protected routes - Organizer only (with 404 security)
router.get('/:id/registrations', secureNotFound, authenticate, requireVerifiedOrganizer, validateUUID('id'), eventController.getEventRegistrations);

// Get user's registrations
// router.get('/my/registrations', authenticate, requireParticipant, validatePagination, eventController.getMyRegistrations);

// Protected routes - Admin only (with 404 security) - parameter routes
router.put('/:id', secureNotFound, authenticate, requireAdmin, validateEventUpdate, eventController.updateEvent);
router.delete('/:id', secureNotFound, authenticate, requireAdmin, validateUUID('id'), eventController.deleteEvent);
// router.patch('/:id/toggle-publish', secureNotFound, authenticate, requireAdmin, validateUUID('id'), eventController.toggleEventPublish);

// Public routes with parameters (MUST be at the bottom - last resort)
// router.get('/:id/check-availability', eventController.checkEventAvailability);

// Route /:id MUST be at the very bottom to avoid catching admin routes
// Note: optionalAuthenticate middleware - if user is authenticated, we get registration status
router.get('/:id', validateUUID('id'), optionalAuthenticate, eventController.getEventById);

module.exports = router;
