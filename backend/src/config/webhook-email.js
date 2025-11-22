const axios = require('axios');
const logger = require('./logger');

// Webhook email service configuration
const WEBHOOK_EMAIL_URL = process.env.WEBHOOK_EMAIL_URL || 'http://localhost:3001';

// Send email via webhook
const sendEmailViaWebhook = async (type, to, subject, data) => {
  try {
    logger.info(`📤 Sending email via webhook: ${type} to ${to}`);
    
    const response = await axios.post(`${WEBHOOK_EMAIL_URL}/webhook/send-email`, {
      type,
      to,
      subject,
      data
    }, {
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logger.info(`✅ Email sent via webhook:`, response.data);
    return response.data;
    
  } catch (error) {
    logger.error('❌ Webhook email error:', error.message);
    
    if (error.response) {
      logger.error('📧 Webhook Error Details:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

// Email templates using webhook
const emailTemplates = {
  // OTP for email verification
  sendOtpEmail: async (email, otpCode, fullName) => {
    return sendEmailViaWebhook(
      'otp-verification',
      email,
      'Email Verification Code - Event Management System',
      { fullName, otpCode }
    );
  },

  // Email verification
  sendVerificationEmail: async (email, fullName, otpCode) => {
    return sendEmailViaWebhook(
      'otp-verification',
      email,
      'Email Verification Code - Event Management System',
      { fullName, otpCode }
    );
  },

  // Password reset
  sendPasswordResetEmail: async (email, fullName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    return sendEmailViaWebhook(
      'password-reset',
      email,
      'Password Reset Request - Event Management System',
      { fullName, resetUrl }
    );
  },

  // Registration confirmation
  sendRegistrationConfirmation: async (email, eventData, registrationToken, participantName, ticketUrl, qrCodeUrl) => {
    return sendEmailViaWebhook(
      'registration-confirmation',
      email,
      `Registration Confirmed - ${eventData.title}`,
      {
        participantName,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        eventLocation: eventData.location,
        registrationToken,
        ticketUrl,
        qrCodeUrl,
      }
    );
  },

  // Event reminder
  sendEventReminder: async (email, eventData, fullName) => {
    return sendEmailViaWebhook(
      'event-reminder',
      email,
      `Event Reminder - ${eventData.title}`,
      {
        fullName,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        location: eventData.location,
      }
    );
  },

  // Certificate ready notification
  sendCertificateNotification: async (email, eventData, certificateUrl, fullName, certificateNumber) => {
    return sendEmailViaWebhook(
      'certificate-notification',
      email,
      `Certificate Ready - ${eventData.title}`,
      {
        fullName,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventLocation: eventData.location,
        certificateUrl,
        certificateNumber,
        issuedDate: new Date().toLocaleDateString('id-ID'),
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/certificates/verify/${certificateNumber}`
      }
    );
  },

  // Registration cancelled
  sendRegistrationCancelled: async (email, eventData, fullName) => {
    return sendEmailViaWebhook(
      'registration-cancelled',
      email,
      `Registration Cancelled - ${eventData.title}`,
      {
        fullName,
        eventTitle: eventData.title,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        location: eventData.location,
      }
    );
  },
};

module.exports = {
  sendEmailViaWebhook,
  emailTemplates,
};
