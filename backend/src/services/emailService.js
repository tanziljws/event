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
}

module.exports = new EmailService();
