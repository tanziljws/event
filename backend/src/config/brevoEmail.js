const SibApiV3Sdk = require('@getbrevo/brevo');
const logger = require('./logger');

// Initialize Brevo API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;
if (!apiKey.apiKey) {
  logger.warn('⚠️  BREVO_API_KEY not set. Email functionality may not work.');
}

const senderEmail = process.env.BREVO_SENDER_EMAIL || 'tanziljws@icloud.com';
const senderName = process.env.BREVO_SENDER_NAME || 'Event Management System';

// Universal email template (white, simple design)
const generateEmailTemplate = (title, content, buttonText = null, buttonUrl = null) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #ffffff;
      padding: 40px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .email-logo {
      font-size: 24px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 10px;
    }
    .email-body {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    .email-title {
      font-size: 24px;
      font-weight: 600;
      color: #333333;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .email-content {
      font-size: 16px;
      color: #666666;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .email-content p {
      margin-bottom: 15px;
    }
    .email-button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #333333;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .email-button:hover {
      background-color: #1a1a1a;
    }
    .email-footer {
      padding: 30px;
      background-color: #f9f9f9;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 14px;
      color: #999999;
    }
    .email-divider {
      height: 1px;
      background-color: #e5e5e5;
      margin: 30px 0;
    }
    .email-info-box {
      background-color: #f9f9f9;
      border-left: 4px solid #333333;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .email-info-box strong {
      color: #333333;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="email-logo">Event Management System</div>
    </div>
    <div class="email-body">
      <h1 class="email-title">${title}</h1>
      <div class="email-content">
        ${content}
      </div>
      ${buttonText && buttonUrl ? `
        <div style="text-align: center;">
          <a href="${buttonUrl}" class="email-button">${buttonText}</a>
        </div>
      ` : ''}
    </div>
    <div class="email-footer">
      <p>This is an automated message from Event Management System.</p>
      <p style="margin-top: 10px;">Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send email using Brevo
const sendEmail = async (to, subject, title, content, buttonText = null, buttonUrl = null, attachments = null) => {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = generateEmailTemplate(title, content, buttonText, buttonUrl);
    sendSmtpEmail.sender = {
      name: senderName,
      email: senderEmail
    };
    sendSmtpEmail.to = Array.isArray(to) 
      ? to.map(email => ({ email }))
      : [{ email: to }];

    // Add attachments if provided
    if (attachments && Array.isArray(attachments)) {
      sendSmtpEmail.attachment = attachments.map(att => ({
        name: att.name,
        content: att.content.toString('base64')
      }));
    }

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    logger.info(`✅ Brevo email sent successfully to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('❌ Error sending Brevo email:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  // Email verification
  sendVerificationEmail: async (email, fullName, otpCode) => {
    const title = 'Email Verification';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Thank you for registering with Event Management System. To complete your registration, please verify your email address using the verification code below:</p>
      <div class="email-info-box">
        <div style="text-align: center; font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #333333; padding: 20px;">
          ${otpCode}
        </div>
      </div>
      <p><strong>Important:</strong></p>
      <ul style="margin-left: 20px; margin-top: 10px;">
        <li>This code will expire in 5 minutes</li>
        <li>Do not share this code with anyone</li>
        <li>If you didn't request this verification, please ignore this email</li>
      </ul>
    `;
    return sendEmail(
      email,
      'Email Verification - Event Management System',
      title,
      content
    );
  },

  // OTP for email verification
  sendOtpEmail: async (email, otpCode, fullName) => {
    return emailTemplates.sendVerificationEmail(email, fullName, otpCode);
  },

  // Password reset email
  sendPasswordResetEmail: async (email, resetToken, fullName) => {
    const title = '🔐 Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>We received a request to reset your password for your Event Management System account.</p>
      <p>Click the button below to reset your password:</p>
      <div class="email-info-box">
        <p><strong>Important:</strong></p>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this, please ignore this email</li>
          <li>Your password will remain unchanged if you don't click the link</li>
        </ul>
      </div>
    `;
    return sendEmail(
      email,
      'Password Reset Request - Event Management System',
      title,
      content,
      'Reset Password',
      resetUrl
    );
  },

  // Organizer approval notification
  sendOrganizerApprovalEmail: async (email, fullName) => {
    const title = '🎉 Organizer Account Approved';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Congratulations! Your organizer account has been approved.</p>
      <p>You can now create and manage events on our platform.</p>
      <div class="email-info-box">
        <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
    `;
    const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/organizer`;
    return sendEmail(
      email,
      '🎉 Selamat! Akun Organizer Anda Telah Disetujui',
      title,
      content,
      'Go to Dashboard',
      dashboardUrl
    );
  },

  // Organizer rejection notification
  sendOrganizerRejectionEmail: async (email, fullName, reason) => {
    const title = '❌ Organizer Account Status';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>We regret to inform you that your organizer account application has been rejected.</p>
      <div class="email-info-box">
        <p><strong>Rejection Reason:</strong></p>
        <p>${reason || 'Tidak memenuhi kriteria yang ditetapkan'}</p>
      </div>
      <p>If you believe this is an error or would like to reapply, please contact our support team.</p>
      <p>You can also try to upgrade your account again with updated information.</p>
    `;
    const upgradeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/upgrade-business`;
    return sendEmail(
      email,
      '❌ Status Organizer Anda',
      title,
      content,
      'Try Again',
      upgradeUrl
    );
  },

  // Certificate ready notification
  sendCertificateNotification: async (email, eventData, certificateUrl, fullName, certificateNumber) => {
    const title = 'Certificate Ready';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your certificate for the event <strong>${eventData.title}</strong> is now ready!</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${eventData.title}</p>
        <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        <p><strong>Location:</strong> ${eventData.location}</p>
        <p><strong>Certificate Number:</strong> ${certificateNumber}</p>
      </div>
      <p>You can download your certificate using the button below.</p>
    `;
    return sendEmail(
      email,
      `Certificate Ready - ${eventData.title}`,
      title,
      content,
      'Download Certificate',
      certificateUrl
    );
  },

  // Event registration confirmation
  sendEventRegistrationConfirmation: async (registrationData) => {
    const title = '🎉 Registration Confirmed';
    const content = `
      <p>Hello <strong>${registrationData.fullName}</strong>,</p>
      <p>Your registration for <strong>${registrationData.eventTitle}</strong> has been confirmed!</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${registrationData.eventTitle}</p>
        <p><strong>Date:</strong> ${new Date(registrationData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        <p><strong>Location:</strong> ${registrationData.location}</p>
        ${registrationData.ticketType ? `<p><strong>Ticket Type:</strong> ${registrationData.ticketType}</p>` : ''}
        ${registrationData.price ? `<p><strong>Price:</strong> Rp ${registrationData.price.toLocaleString('id-ID')}</p>` : ''}
      </div>
      <p>We look forward to seeing you at the event!</p>
    `;
    const eventUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/events/${registrationData.eventId}`;
    return sendEmail(
      registrationData.email,
      `🎉 Registration Confirmed - ${registrationData.eventTitle}`,
      title,
      content,
      'View Event',
      eventUrl
    );
  },

  // Event reminder
  sendEventReminder: async (reminderData) => {
    const title = '⏰ Event Reminder';
    const content = `
      <p>Hello <strong>${reminderData.fullName}</strong>,</p>
      <p>This is a reminder that you have registered for <strong>${reminderData.eventTitle}</strong>.</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${reminderData.eventTitle}</p>
        <p><strong>Date:</strong> ${new Date(reminderData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        <p><strong>Time:</strong> ${new Date(reminderData.eventDate).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p><strong>Location:</strong> ${reminderData.location}</p>
      </div>
      <p>Don't forget to attend!</p>
    `;
    const eventUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/events/${reminderData.eventId}`;
    return sendEmail(
      reminderData.email,
      `⏰ Event Reminder - ${reminderData.eventTitle}`,
      title,
      content,
      'View Event Details',
      eventUrl
    );
  },

  // Registration confirmation (with QR code)
  sendRegistrationConfirmation: async (email, eventData, registrationToken, fullName, qrCodeUrl, ticketUrl) => {
    const title = '🎉 Registration Confirmed';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your registration for <strong>${eventData.title}</strong> has been confirmed!</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${eventData.title}</p>
        <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        ${eventData.eventTime ? `<p><strong>Time:</strong> ${eventData.eventTime}</p>` : ''}
        <p><strong>Location:</strong> ${eventData.location}</p>
        <p><strong>Registration Token:</strong> ${registrationToken}</p>
      </div>
      ${ticketUrl ? `<p>You can view your ticket using the button below.</p>` : ''}
    `;
    return sendEmail(
      email,
      `Registration Confirmed - ${eventData.title}`,
      title,
      content,
      ticketUrl ? 'View Ticket' : null,
      ticketUrl || null
    );
  },

  // Payment notification
  sendPaymentNotification: async (paymentData) => {
    const title = '💳 Payment Required';
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(paymentData.amount);
    const content = `
      <p>Hello <strong>${paymentData.customerName}</strong>,</p>
      <p>Payment is required for your registration to <strong>${paymentData.eventTitle}</strong>.</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${paymentData.eventTitle}</p>
        <p><strong>Amount:</strong> ${formattedAmount}</p>
        <p><strong>Payment ID:</strong> ${paymentData.paymentId}</p>
        ${paymentData.expiresAt ? `<p><strong>Expires At:</strong> ${new Date(paymentData.expiresAt).toLocaleString('id-ID')}</p>` : ''}
      </div>
      <p>Please complete your payment using the button below.</p>
    `;
    return sendEmail(
      paymentData.customerEmail,
      `Payment Required - ${paymentData.eventTitle}`,
      title,
      content,
      'Complete Payment',
      paymentData.paymentUrl
    );
  },

  // Send invoice email with PDF attachment
  sendInvoiceEmail: async (invoiceData, pdfBuffer) => {
    const title = '📄 Invoice - Payment Confirmed';
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(invoiceData.amount);
    const content = `
      <p>Hello <strong>${invoiceData.customerName}</strong>,</p>
      <p>Thank you for your payment! Your invoice for <strong>${invoiceData.eventTitle}</strong> is attached to this email.</p>
      <div class="email-info-box">
        <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
        <p><strong>Event:</strong> ${invoiceData.eventTitle}</p>
        <p><strong>Amount:</strong> ${formattedAmount}</p>
        <p><strong>Payment ID:</strong> ${invoiceData.paymentId}</p>
        ${invoiceData.paidAt ? `<p><strong>Paid At:</strong> ${new Date(invoiceData.paidAt).toLocaleString('id-ID')}</p>` : ''}
      </div>
      <p>Please find your invoice attached to this email. You can download it for your records.</p>
      <p>If you have any questions, please contact our support team.</p>
    `;
    
    const attachments = [{
      name: `Invoice_${invoiceData.invoiceNumber}.pdf`,
      content: pdfBuffer
    }];

    return sendEmail(
      invoiceData.customerEmail,
      `Invoice - ${invoiceData.eventTitle}`,
      title,
      content,
      null,
      null,
      attachments
    );
  },

  // Event cancellation notification
  sendEventCancellationNotification: async (email, eventData, fullName) => {
    const title = '❌ Event Cancelled';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>We regret to inform you that the event <strong>${eventData.title}</strong> has been cancelled.</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${eventData.title}</p>
        <p><strong>Original Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        ${eventData.cancellationReason ? `<p><strong>Reason:</strong> ${eventData.cancellationReason}</p>` : ''}
      </div>
      <p>If you have any questions or concerns, please contact our support team.</p>
    `;
    return sendEmail(
      email,
      `Event Cancelled - ${eventData.title}`,
      title,
      content
    );
  },

  // Participant cancellation notification
  sendParticipantCancellationNotification: async (email, eventData, fullName) => {
    const title = 'Registration Cancelled';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your registration for <strong>${eventData.title}</strong> has been cancelled.</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${eventData.title}</p>
        <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
    `;
    return sendEmail(
      email,
      `Registration Cancelled - ${eventData.title}`,
      title,
      content
    );
  },

  // Refund confirmation
  sendRefundConfirmation: async (email, refundData, fullName) => {
    const title = '💰 Refund Processed';
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(refundData.amount);
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your refund has been processed successfully.</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${refundData.eventTitle}</p>
        <p><strong>Refund Amount:</strong> ${formattedAmount}</p>
        <p><strong>Refund ID:</strong> ${refundData.refundId}</p>
        <p><strong>Processed Date:</strong> ${new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>
      <p>The refund will be processed to your original payment method within 5-7 business days.</p>
    `;
    return sendEmail(
      email,
      `Refund Processed - ${refundData.eventTitle}`,
      title,
      content
    );
  },

  // Registration cancellation
  sendRegistrationCancellation: async (email, eventData, registrationToken, fullName) => {
    const title = 'Registration Cancelled';
    const content = `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your registration for <strong>${eventData.title}</strong> has been cancelled.</p>
      <div class="email-info-box">
        <p><strong>Event:</strong> ${eventData.title}</p>
        <p><strong>Date:</strong> ${new Date(eventData.eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        ${eventData.eventTime ? `<p><strong>Time:</strong> ${eventData.eventTime}</p>` : ''}
        <p><strong>Location:</strong> ${eventData.location}</p>
        <p><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>
      <p>If you have any questions, please contact our support team.</p>
    `;
    return sendEmail(
      email,
      `Registration Cancelled - ${eventData.title}`,
      title,
      content
    );
  }
};

module.exports = {
  sendEmail,
  emailTemplates,
  generateEmailTemplate
};

