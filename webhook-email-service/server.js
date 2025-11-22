const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Gmail SMTP Configuration (Local Machine)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'noreply.nusaevent@gmail.com',
      pass: 'wgsd ztsy knjb jbur', // Gmail App Password
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
    logger: true,
  });
};

// Email templates
const emailTemplates = {
  otpVerification: (fullName, otpCode) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Email Verification Code</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .otp-code { background-color: #f8fafc; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-number { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
            .footer { text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .security-notice { background-color: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .security-notice p { margin: 0; color: #1e40af; }
            .expiry-notice { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .expiry-notice p { margin: 0; color: #92400e; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 Event Management System</div>
            </div>
            <h2 style="color: #2563eb;">Email Verification Code</h2>
            <p>Hello <strong>${fullName}</strong>!</p>
            <p>Please use the following verification code to complete your email verification:</p>
            <div class="otp-code">
                <div class="otp-number">${otpCode}</div>
                <p style="color: #6b7280; margin-top: 10px;">This code will expire in 5 minutes</p>
            </div>
            <div class="expiry-notice">
                <p><strong>⏰ Important:</strong> This verification code will expire in 5 minutes for security reasons.</p>
            </div>
            <div class="security-notice">
                <p><strong>🔒 Security Notice:</strong> Never share this code with anyone. Our team will never ask for your verification code.</p>
            </div>
            <p>Enter this code in the verification form to complete your registration.</p>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p><strong>Event Management System</strong></p>
                <p>&copy; 2025 All rights reserved</p>
            </div>
        </div>
    </body>
    </html>
  `,

  passwordReset: (fullName, resetUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Password Reset Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #dc3545; }
            .reset-button { background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
            .reset-button:hover { background-color: #c82333; }
            .footer { text-align: center; color: #666; font-size: 14px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Event Management System</div>
            </div>
            <h2>Password Reset Request</h2>
            <p>Hello ${fullName}!</p>
            <p>We received a request to reset your password. Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="reset-button">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; 2024 Event Management System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  paymentNotification: (customerName, eventTitle, formattedAmount, paymentId, paymentUrl, expiresAt) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Required - ${eventTitle}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
            .payment-info { background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .payment-info h3 { color: #1e293b; margin-top: 0; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
            .payment-button { display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center; margin: 20px 0; transition: background-color 0.3s; }
            .payment-button:hover { background-color: #1d4ed8; }
            .payment-details { background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .payment-details p { margin: 5px 0; }
            .expiry-notice { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .expiry-notice p { margin: 0; color: #92400e; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💳 Payment Required</h1>
                <p>Complete your event registration payment</p>
            </div>
            <p>Hello <strong>${customerName}</strong>,</p>
            <p>Thank you for registering for <strong>${eventTitle}</strong>! To complete your registration, please complete the payment below.</p>
            <div class="payment-info">
                <h3>📋 Payment Details</h3>
                <div class="amount">${formattedAmount}</div>
                <div class="payment-details">
                    <p><strong>Event:</strong> ${eventTitle}</p>
                    <p><strong>Payment ID:</strong> ${paymentId}</p>
                    <p><strong>Amount:</strong> ${formattedAmount}</p>
                </div>
                <div style="text-align: center;">
                    <a href="${paymentUrl}" class="payment-button">🚀 Pay Now</a>
                </div>
            </div>
            <div class="expiry-notice">
                <p><strong>⏰ Important:</strong> This payment link will expire on ${expiresAt}. Please complete your payment before the expiry time to secure your spot.</p>
            </div>
            <div class="payment-info">
                <h3>💡 Payment Methods Available</h3>
                <ul>
                    <li>💳 Credit/Debit Cards (Visa, Mastercard)</li>
                    <li>🏦 Bank Transfer (BCA, BNI, BRI, Mandiri)</li>
                    <li>📱 E-Wallet (DANA, OVO, GoPay, ShopeePay)</li>
                    <li>📱 QRIS (QR Code)</li>
                </ul>
            </div>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p><strong>Event Management System</strong></p>
                <p>© 2025 All rights reserved</p>
            </div>
        </div>
    </body>
    </html>
  `
};

// Webhook endpoint untuk email sending
app.post('/webhook/send-email', async (req, res) => {
  try {
    const { type, to, subject, data } = req.body;
    
    console.log('📧 Received email webhook:', { type, to, subject });
    
    const transporter = createTransporter();
    
    let htmlContent = '';
    let emailSubject = subject;
    
    switch (type) {
      case 'otp-verification':
        htmlContent = emailTemplates.otpVerification(data.fullName, data.otpCode);
        emailSubject = 'Email Verification Code - Event Management System';
        break;
      case 'password-reset':
        htmlContent = data.html || emailTemplates.passwordReset(data.fullName, data.resetUrl);
        emailSubject = 'Password Reset Request - Event Management System';
        break;
      case 'organizer-approval':
        htmlContent = data.html || emailTemplates.organizerApproval(data.fullName, data.approvalDate, data.dashboardUrl, data.supportEmail);
        emailSubject = '🎉 Selamat! Akun Organizer Anda Telah Disetujui';
        break;
      case 'organizer-rejection':
        htmlContent = data.html || emailTemplates.organizerRejection(data.fullName, data.rejectionDate, data.reason, data.supportEmail, data.upgradeUrl);
        emailSubject = '❌ Status Organizer Anda';
        break;
      case 'payment-notification':
        htmlContent = data.html || emailTemplates.paymentNotification(data.customerName, data.eventTitle, data.formattedAmount, data.paymentId, data.paymentUrl, data.expiresAt);
        emailSubject = `💳 Payment Required - ${data.eventTitle}`;
        break;
      default:
        // If it's a template name, use the HTML directly
        if (data.html) {
          htmlContent = data.html;
          emailSubject = subject;
        } else {
          throw new Error(`Unknown email type: ${type}`);
        }
    }
    
    const mailOptions = {
      from: 'Nusa <noreply.nusaevent@gmail.com>',
      to: to,
      subject: emailSubject,
      html: htmlContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Email webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Webhook Email Service',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Webhook Email Service running on port ${PORT}`);
  console.log(`📧 Ready to receive email webhooks from Railway backend`);
});

module.exports = app;
