const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"Event Management System" <${process.env.SMTP_USER || 'noreply@company.com'}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        text: text,
        html: html
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Email template untuk ticket status change
  generateTicketStatusChangeEmail(ticket, oldStatus, newStatus, user) {
    const statusColors = {
      'OPEN': '#ef4444',
      'IN_PROGRESS': '#f59e0b',
      'RESOLVED': '#10b981',
      'CLOSED': '#6b7280'
    };

    const statusLabels = {
      'OPEN': 'Open',
      'IN_PROGRESS': 'In Progress',
      'RESOLVED': 'Resolved',
      'CLOSED': 'Closed'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Ticket Status Updated</h1>
            <p>Ticket #${ticket.id.slice(-8)} has been updated</p>
          </div>
          <div class="content">
            <div class="ticket-info">
              <h2>${ticket.title}</h2>
              <p><strong>Status Changed:</strong> 
                <span class="status-badge" style="background-color: ${statusColors[oldStatus]}">${statusLabels[oldStatus]}</span>
                → 
                <span class="status-badge" style="background-color: ${statusColors[newStatus]}">${statusLabels[newStatus]}</span>
              </p>
              <p><strong>Priority:</strong> ${ticket.priority}</p>
              <p><strong>Category:</strong> ${ticket.category}</p>
              <p><strong>Updated by:</strong> ${user.fullName} (${user.userPosition})</p>
              <p><strong>Updated at:</strong> ${new Date().toLocaleString('id-ID')}</p>
            </div>
            <p>You can view the full ticket details by clicking the link below:</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/department/customer_service/tickets/${ticket.id}" 
                  style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Ticket
            </a></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Event Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Email template untuk new comment
  generateNewCommentEmail(ticket, comment, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Comment on Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .comment-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .internal-note { background: #fef3c7; border-left-color: #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Comment Added</h1>
            <p>New comment on Ticket #${ticket.id.slice(-8)}</p>
          </div>
          <div class="content">
            <div class="ticket-info">
              <h2>${ticket.title}</h2>
              <p><strong>Status:</strong> ${ticket.status}</p>
              <p><strong>Priority:</strong> ${ticket.priority}</p>
            </div>
            <div class="comment-box ${comment.isInternal ? 'internal-note' : ''}">
              <p><strong>${comment.isInternal ? '🔒 Internal Note' : '💬 Public Comment'}</strong></p>
              <p><strong>By:</strong> ${user.fullName} (${user.userPosition})</p>
              <p><strong>At:</strong> ${new Date(comment.createdAt).toLocaleString('id-ID')}</p>
              <hr>
              <p>${comment.content}</p>
            </div>
            <p>You can view the full conversation by clicking the link below:</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/department/customer_service/tickets/${ticket.id}" 
                  style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Ticket
            </a></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Event Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Email template untuk @mention
  generateMentionEmail(ticket, comment, mentionedUser, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>You were mentioned in a ticket comment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .mention-box { background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👋 You were mentioned!</h1>
            <p>Someone mentioned you in a ticket comment</p>
          </div>
          <div class="content">
            <div class="ticket-info">
              <h2>${ticket.title}</h2>
              <p><strong>Status:</strong> ${ticket.status}</p>
              <p><strong>Priority:</strong> ${ticket.priority}</p>
            </div>
            <div class="mention-box">
              <p><strong>@${mentionedUser.fullName}</strong> - You were mentioned by ${user.fullName}</p>
              <p><strong>At:</strong> ${new Date(comment.createdAt).toLocaleString('id-ID')}</p>
              <hr>
              <p>${comment.content}</p>
            </div>
            <p>Click the link below to respond:</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/department/customer_service/tickets/${ticket.id}" 
                  style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View & Respond
            </a></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Event Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send ticket status change notification
  async sendTicketStatusChangeNotification(ticket, oldStatus, newStatus, user, recipients) {
    const subject = `Ticket #${ticket.id.slice(-8)} status changed to ${newStatus}`;
    const html = this.generateTicketStatusChangeEmail(ticket, oldStatus, newStatus, user);
    
    return await this.sendEmail(recipients, subject, html);
  }

  // Send new comment notification
  async sendNewCommentNotification(ticket, comment, user, recipients) {
    const subject = `New comment on Ticket #${ticket.id.slice(-8)}`;
    const html = this.generateNewCommentEmail(ticket, comment, user);
    
    return await this.sendEmail(recipients, subject, html);
  }

  // Send @mention notification
  async sendMentionNotification(ticket, comment, mentionedUser, user) {
    const subject = `You were mentioned in Ticket #${ticket.id.slice(-8)}`;
    const html = this.generateMentionEmail(ticket, comment, mentionedUser, user);
    
    return await this.sendEmail(mentionedUser.email, subject, html);
  }

  // Send email verification
  async sendVerificationEmail(email, fullName, otpCode) {
    const subject = 'Email Verification - Event Management System';
    const html = this.generateVerificationEmail(fullName, otpCode);
    
    return await this.sendEmail(email, subject, html);
  }

  // Generate verification email template
  generateVerificationEmail(fullName, otpCode) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-code { background: #1f2937; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${fullName}!</h2>
            <p>Thank you for registering with Event Management System. To complete your registration, please verify your email address using the verification code below:</p>
            
            <div class="otp-code">${otpCode}</div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 5 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this verification, please ignore this email</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>Event Management System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate payout completed email template
  generatePayoutCompletedEmail(organizerName, amount, accountName, accountNumber, accountType, completedAt) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const accountDisplay = accountType === 'BANK_ACCOUNT' 
      ? `${accountName} - ${accountNumber}`
      : `${accountType} - ${accountNumber}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .amount { font-size: 28px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payout Completed</h1>
            <p>Your payout request has been successfully processed</p>
          </div>
          <div class="content">
            <h2>Hello ${organizerName}!</h2>
            <p>We're happy to inform you that your payout request has been completed successfully.</p>
            
            <div class="info-box">
              <div class="amount">${formatCurrency(amount)}</div>
              <p><strong>Account:</strong> ${accountDisplay}</p>
              <p><strong>Completed at:</strong> ${new Date(completedAt).toLocaleString('id-ID')}</p>
            </div>
            
            <p>The funds have been transferred to your account. Please check your bank or e-wallet to confirm receipt.</p>
            
            <p>You can view your transaction history by clicking the link below:</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/organizer/wallet/transactions" 
                  style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction History
            </a></p>
            
            <p>If you have any questions or concerns, please contact our support team.</p>
            
            <p>Best regards,<br>Event Management System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate payout failed email template
  generatePayoutFailedEmail(organizerName, amount, accountName, failureReason, requestedAt) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Failed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .amount { font-size: 28px; font-weight: bold; color: #ef4444; text-align: center; margin: 20px 0; }
          .error-box { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ef4444; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Payout Failed</h1>
            <p>Your payout request could not be processed</p>
          </div>
          <div class="content">
            <h2>Hello ${organizerName}!</h2>
            <p>We're sorry to inform you that your payout request has failed.</p>
            
            <div class="info-box">
              <div class="amount">${formatCurrency(amount)}</div>
              <p><strong>Account:</strong> ${accountName}</p>
              <p><strong>Requested at:</strong> ${new Date(requestedAt).toLocaleString('id-ID')}</p>
            </div>
            
            <div class="error-box">
              <p><strong>Reason:</strong></p>
              <p>${failureReason || 'Unknown error occurred during processing'}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your balance has been unlocked and is available for withdrawal again</li>
              <li>You can retry the payout request from your transaction history</li>
              <li>Please verify your account details are correct</li>
            </ul>
            
            <p>You can retry the payout or view your transaction history by clicking the link below:</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/organizer/wallet/transactions" 
                  style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction History
            </a></p>
            
            <p>If you continue to experience issues, please contact our support team.</p>
            
            <p>Best regards,<br>Event Management System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send payout completed notification
  async sendPayoutCompletedNotification(organizerEmail, organizerName, amount, accountName, accountNumber, accountType, completedAt) {
    try {
      const subject = `✅ Payout Completed - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}`;
      const html = this.generatePayoutCompletedEmail(organizerName, amount, accountName, accountNumber, accountType, completedAt);
      
      return await this.sendEmail(organizerEmail, subject, html);
    } catch (error) {
      logger.error('Error sending payout completed email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send payout failed notification
  async sendPayoutFailedNotification(organizerEmail, organizerName, amount, accountName, failureReason, requestedAt) {
    try {
      const subject = `❌ Payout Failed - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}`;
      const html = this.generatePayoutFailedEmail(organizerName, amount, accountName, failureReason, requestedAt);
      
      return await this.sendEmail(organizerEmail, subject, html);
    } catch (error) {
      logger.error('Error sending payout failed email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate payout requested email template
  generatePayoutRequestedEmail(organizerName, amount, accountName, accountNumber, accountType, requestedAt) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const accountDisplay = accountType === 'BANK_ACCOUNT' 
      ? `${accountName} - ${accountNumber}`
      : `${accountType} - ${accountNumber}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payout Request Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .amount { font-size: 28px; font-weight: bold; color: #3b82f6; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payout Request Received</h1>
            <p>Your payout request is being processed</p>
          </div>
          <div class="content">
            <h2>Hello ${organizerName}!</h2>
            <p>We've received your payout request and it's currently being processed.</p>
            
            <div class="info-box">
              <div class="amount">${formatCurrency(amount)}</div>
              <p><strong>Account:</strong> ${accountDisplay}</p>
              <p><strong>Requested at:</strong> ${new Date(requestedAt).toLocaleString('id-ID')}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your balance has been locked for this payout</li>
              <li>We're processing the transfer to your account</li>
              <li>Processing usually takes 1-3 business days</li>
              <li>You'll receive an email notification when it's completed</li>
            </ul>
            
            <p>You can track the status of your payout by clicking the link below:</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/organizer/wallet/transactions" 
                  style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction History
            </a></p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>Event Management System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send payout requested notification
  async sendPayoutRequestedNotification(organizerEmail, organizerName, amount, accountName, accountNumber, accountType, requestedAt) {
    try {
      const subject = `💰 Payout Request Received - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}`;
      const html = this.generatePayoutRequestedEmail(organizerName, amount, accountName, accountNumber, accountType, requestedAt);
      
      return await this.sendEmail(organizerEmail, subject, html);
    } catch (error) {
      logger.error('Error sending payout requested email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
