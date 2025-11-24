const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const {
  validateUserRegistration,
  validateOrganizerRegistration,
  validateUserLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
} = require('../middlewares/validation');
const {
  authRateLimitMiddleware,
  passwordResetRateLimit,
  emailVerificationRateLimit,
} = require('../middlewares/security');

const router = express.Router();

// Public routes
router.post('/register', authRateLimitMiddleware, validateUserRegistration, authController.register);
router.post('/register-organizer', authRateLimitMiddleware, validateOrganizerRegistration, authController.registerOrganizer);
router.post('/resend-otp', emailVerificationRateLimit, authController.resendOtp);
router.post('/verify-email', emailVerificationRateLimit, validateEmailVerification, authController.verifyEmail);
router.post('/login', authRateLimitMiddleware, validateUserLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', passwordResetRateLimit, validatePasswordResetRequest, authController.forgotPassword);
router.get('/reset-password', authController.validateResetToken);
router.post('/reset-password', passwordResetRateLimit, validatePasswordReset, authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/switch-role', authenticate, authController.switchRole);

module.exports = router;
