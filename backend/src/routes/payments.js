const express = require('express');
const paymentController = require('../controllers/paymentController');
const { authenticate, requireParticipant } = require('../middlewares/auth');
const { validateUUID } = require('../middlewares/validation');
const { generalRateLimitMiddleware } = require('../middlewares/security');

const router = express.Router();

// Debug middleware to log all requests to payments routes
router.use((req, res, next) => {
  console.log('🔍 PAYMENTS ROUTE:', req.method, req.originalUrl);
  console.log('🔍 PAYMENTS PATH:', req.path);
  console.log('🔍 PAYMENTS BODY:', req.body);
  next();
});

// Create payment order
router.post('/create-order', 
  (req, res, next) => {
    console.log('🎯 PAYMENTS: create-order route hit!');
    console.log('🎯 PAYMENTS: Method:', req.method);
    console.log('🎯 PAYMENTS: Path:', req.path);
    console.log('🎯 PAYMENTS: Original URL:', req.originalUrl);
    console.log('🎯 PAYMENTS: Body:', req.body);
    next();
  },
  generalRateLimitMiddleware,
  authenticate,
  requireParticipant,
  paymentController.createPaymentOrder
);

// Check payment status
router.get('/status/:paymentId', 
  generalRateLimitMiddleware,
  authenticate,
  // Payment ID is not UUID format (e.g., PAY_1762575048848_0FD4B86B), so no UUID validation
  paymentController.checkPaymentStatus
);

// Get payment history
router.get('/history', 
  generalRateLimitMiddleware,
  authenticate,
  requireParticipant,
  paymentController.getPaymentHistory
);

// Process payment
router.post('/process', 
  generalRateLimitMiddleware,
  authenticate,
  requireParticipant,
  paymentController.processPayment
);

// Webhook for payment notifications (from Midtrans)
router.post('/webhook', 
  paymentController.handlePaymentWebhook
);

module.exports = router;