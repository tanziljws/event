const sgMail = require('@sendgrid/mail');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates directory
const templatesDir = path.join(__dirname, '../templates/email');

// Load email template
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf8');
    return handlebars.compile(templateContent);
  } catch (error) {
    logger.error(`Error loading email template ${templateName}:`, error);
    throw new Error(`Email template ${templateName} not found`);
  }
};

// Send email function using SendGrid
const sendEmail = async (to, subject, templateName, data = {}) => {
  try {
    // Load template
    const template = await loadTemplate(templateName);
    const htmlContent = template(data);

    // Prepare email
    const msg = {
      to: to,
      from: process.env.EMAIL_FROM || 'noreply@nusaevent.com',
      subject: subject,
      html: htmlContent,
    };

    // Send email
    const response = await sgMail.send(msg);
    
    logger.info(`✅ Email sent successfully to: ${to}`);
    logger.info(`📧 SendGrid Response:`, response[0].statusCode);
    
    return {
      success: true,
      messageId: response[0].headers['x-message-id'],
      statusCode: response[0].statusCode
    };

  } catch (error) {
    logger.error('❌ SendGrid email error:', error);
    
    if (error.response) {
      logger.error('📧 SendGrid Error Details:', {
        statusCode: error.response.status,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    
    throw error;
  }
};

// Email templates using SendGrid
const emailTemplates = {
  // OTP for email verification
  sendOtpEmail: async (email, otpCode, fullName) => {
    const data = {
      fullName,
      otpCode,
    };
    return sendEmail(
      email,
      'Email Verification Code - Event Management System',
      'otp-verification',
      data
    );
  },

  // Email verification
  sendVerificationEmail: async (email, fullName, otpCode) => {
    const data = {
      fullName,
      otpCode,
    };
    return sendEmail(
      email,
      'Email Verification Code - Event Management System',
      'otp-verification',
      data
    );
  },

  // Password reset
  sendPasswordResetEmail: async (email, fullName, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    const data = {
      fullName,
      resetUrl,
    };
    return sendEmail(
      email,
      'Password Reset Request - Event Management System',
      'password-reset',
      data
    );
  },

  // Registration confirmation
  sendRegistrationConfirmation: async (email, eventData, registrationToken, participantName, ticketUrl, qrCodeUrl) => {
    const data = {
      participantName,
      eventTitle: eventData.title,
      eventDate: new Date(eventData.eventDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      eventTime: eventData.eventTime,
      eventLocation: eventData.location,
      registrationToken,
      ticketUrl,
      qrCodeUrl,
    };
    return sendEmail(
      email,
      `Registration Confirmed - ${eventData.title}`,
      'registration-confirmation',
      data
    );
  },

  // Event reminder
  sendEventReminder: async (email, eventData, fullName) => {
    const data = {
      fullName,
      eventTitle: eventData.title,
      eventDate: eventData.eventDate,
      eventTime: eventData.eventTime,
      location: eventData.location,
    };
    return sendEmail(
      email,
      `Event Reminder - ${eventData.title}`,
      'event-reminder',
      data
    );
  },

  // Certificate ready notification
  sendCertificateNotification: async (email, eventData, certificateUrl, fullName, certificateNumber) => {
    const data = {
      fullName,
      eventTitle: eventData.title,
      eventDate: new Date(eventData.eventDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      eventLocation: eventData.location,
      certificateUrl,
      certificateNumber,
      issuedDate: new Date().toLocaleDateString('id-ID'),
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/certificates/verify/${certificateNumber}`
    };
    return sendEmail(
      email,
      `Certificate Ready - ${eventData.title}`,
      'certificate-notification',
      data
    );
  },

  // Registration cancelled
  sendRegistrationCancelled: async (email, eventData, fullName) => {
    const data = {
      fullName,
      eventTitle: eventData.title,
      eventDate: eventData.eventDate,
      eventTime: eventData.eventTime,
      location: eventData.location,
    };
    return sendEmail(
      email,
      `Registration Cancelled - ${eventData.title}`,
      'registration-cancelled',
      data
    );
  },
};

module.exports = {
  sendEmail,
  emailTemplates,
};
