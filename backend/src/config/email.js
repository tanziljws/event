const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const webhookEmail = require('./webhook-email');

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
      secureProtocol: 'TLSv1_2_method'
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 30000, // 30 seconds
    debug: true, // Always enable debug for email troubleshooting
    logger: true, // Always enable logger for email troubleshooting
  });
};

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

// Send email function with webhook fallback
const sendEmail = async (to, subject, templateName, data = {}) => {
  // Try webhook first if available
  if (process.env.WEBHOOK_EMAIL_URL) {
    try {
      logger.info(`📤 Attempting to send email via webhook: ${templateName} to ${to}`);
      
      const template = await loadTemplate(templateName);
      const html = template(data);
      
      const result = await webhookEmail.sendEmailViaWebhook(templateName, to, subject, {
        ...data,
        html
      });
      
      logger.info(`✅ Email sent via webhook to ${to}`);
      return result;
    } catch (webhookError) {
      logger.error('❌ Webhook email failed, falling back to direct SMTP:', webhookError.message);
      // Fall through to direct SMTP
    }
  }
  
  // Fallback to direct SMTP
  let transporter;
  try {
    logger.info(`📤 Sending email via direct SMTP: ${templateName} to ${to}`);
    
    // Create transporter with retry mechanism
    transporter = createTransporter();
    
    // Verify connection before sending
    await transporter.verify();
    logger.info('Email connection verified successfully');
    
    const template = await loadTemplate(templateName);
    const html = template(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`✅ Email sent successfully to ${to}:`, result.messageId);
    return result;
  } catch (error) {
    logger.error('❌ Error sending email:', error);
    
    // Close transporter connection on error
    if (transporter) {
      transporter.close();
    }
    
    throw error;
  }
};

// Email templates
const emailTemplates = {
  // Email verification
  sendVerificationEmail: async (email, verificationToken, fullName) => {
    const data = {
      fullName,
      verificationToken,
      verificationUrl: `${process.env.API_BASE_URL}/auth/verify-email?token=${verificationToken}`,
    };
    return sendEmail(
      email,
      'Verify Your Email - Event Management System',
      'email-verification',
      data
    );
  },

  // Password reset
  sendPasswordResetEmail: async (email, resetToken, fullName) => {
    const data = {
      fullName,
      resetToken,
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password?token=${resetToken}`,
    };
    return sendEmail(
      email,
      'Reset Your Password - Event Management System',
      'password-reset',
      data
    );
  },

  // Event registration confirmation
  sendRegistrationConfirmation: async (email, eventData, registrationToken, fullName, qrCodeUrl, ticketUrl) => {
    const data = {
      fullName,
      eventTitle: eventData.title,
      eventDate: eventData.eventDate,
      eventTime: eventData.eventTime,
      location: eventData.location,
      registrationToken,
      qrCodeUrl,
      ticketUrl,
    };
    return sendEmail(
      email,
      `Registration Confirmed - ${eventData.title}`,
      'registration-confirmation',
      data
    );
  },

  // Event registration cancellation
  sendRegistrationCancellation: async (email, eventData, registrationToken, fullName) => {
    const data = {
      fullName,
      eventTitle: eventData.title,
      eventDate: eventData.eventDate,
      eventTime: eventData.eventTime,
      location: eventData.location,
      registrationToken,
      cancellationDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
    };
    return sendEmail(
      email,
      `Registration Cancelled - ${eventData.title}`,
      'registration-cancelled',
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

  // Payment notification
  sendPaymentNotification: async (paymentData) => {
    const data = {
      customerName: paymentData.customerName,
      eventTitle: paymentData.eventTitle,
      amount: paymentData.amount,
      paymentId: paymentData.paymentId,
      paymentUrl: paymentData.paymentUrl,
      expiresAt: paymentData.expiresAt,
      formattedAmount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(paymentData.amount),
    };
    return sendEmail(
      paymentData.customerEmail,
      `Payment Required - ${paymentData.eventTitle}`,
      'payment-notification',
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

  // Organizer approval notification
  sendOrganizerApprovalEmail: async (email, fullName) => {
    const data = {
      fullName,
      approvalDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/organizer`,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@nusa.com'
    };
    return sendEmail(
      email,
      '🎉 Selamat! Akun Organizer Anda Telah Disetujui',
      'organizer-approval',
      data
    );
  },

  // Organizer rejection notification
  sendOrganizerRejectionEmail: async (email, fullName, reason) => {
    const data = {
      fullName,
      rejectionDate: new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      reason: reason || 'Tidak memenuhi kriteria yang ditetapkan',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@nusa.com',
      upgradeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/upgrade-business`
    };
    return sendEmail(
      email,
      '❌ Status Organizer Anda',
      'organizer-rejection',
      data
    );
  },

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

  // Event registration confirmation
  sendEventRegistrationConfirmation: async (registrationData) => {
    try {
      await sendEmail(
        registrationData.email,
        `🎉 Registration Confirmed - ${registrationData.eventTitle}`,
        'event-registration',
        registrationData
      );
      
      logger.info(`Event registration confirmation sent to ${registrationData.email}`);
    } catch (error) {
      logger.error('Failed to send event registration confirmation:', error);
      throw error;
    }
  },

  // Event reminder
  sendEventReminder: async (reminderData) => {
    try {
      await sendEmail(
        reminderData.email,
        `⏰ Event Reminder - ${reminderData.eventTitle}`,
        'event-reminder',
        reminderData
      );
      
      logger.info(`Event reminder sent to ${reminderData.email}`);
    } catch (error) {
      logger.error('Failed to send event reminder:', error);
      throw error;
    }
  },
};

module.exports = {
  createTransporter,
  sendEmail,
  emailTemplates,
};
