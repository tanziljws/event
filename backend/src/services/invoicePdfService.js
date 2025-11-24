const PDFDocument = require('pdfkit');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

class InvoicePdfService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../uploads/invoices');
    this.ensureOutputDirectory();
  }

  async ensureOutputDirectory() {
    try {
      await fsPromises.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating invoice directory:', error);
      throw error;
    }
  }

  async generateInvoicePdf(invoiceData) {
    try {
      await this.ensureOutputDirectory();

      const {
        invoiceNumber,
        paymentId,
        customerName,
        customerEmail,
        customerPhone,
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        amount,
        quantity,
        ticketType,
        paymentStatus,
        paidAt,
        paymentMethod,
        transactionId
      } = invoiceData;

      // Format amount
      const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Generate filename
      const filename = `invoice_${invoiceNumber}_${Date.now()}.pdf`;
      const filePath = path.join(this.outputDir, filename);
      const invoiceUrl = `/uploads/invoices/${filename}`;

      // Create write stream
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .text('INVOICE', { align: 'center' })
        .moveDown(0.5);

      doc.fontSize(12)
        .font('Helvetica')
        .text(`Invoice Number: ${invoiceNumber}`, { align: 'center' })
        .text(`Date: ${new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, { align: 'center' })
        .moveDown(2);

      // Company Info (Left)
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('From:', 50, 150)
        .font('Helvetica')
        .fontSize(9)
        .text('Event Management System', 50, 170)
        .text('Nusa Event Platform', 50, 185)
        .text('Email: support@nusa-event.com', 50, 200);

      // Customer Info (Right)
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Bill To:', 350, 150)
        .font('Helvetica')
        .fontSize(9)
        .text(customerName, 350, 170)
        .text(customerEmail, 350, 185);
      
      if (customerPhone) {
        doc.text(customerPhone, 350, 200);
      }

      // Line separator
      doc.moveTo(50, 230)
        .lineTo(550, 230)
        .stroke()
        .moveDown(2);

      // Event Details
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Event Details', 50, 260)
        .moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Event: ${eventTitle}`, 50, 285)
        .text(`Date: ${new Date(eventDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`, 50, 300);

      if (eventTime) {
        doc.text(`Time: ${eventTime}`, 50, 315);
      }

      if (eventLocation) {
        doc.text(`Location: ${eventLocation}`, 50, 330);
      }

      // Line separator
      doc.moveTo(50, 360)
        .lineTo(550, 360)
        .stroke()
        .moveDown(2);

      // Invoice Items Table
      const tableTop = 380;
      const itemHeight = 30;

      // Table Header
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Quantity', 400, tableTop)
        .text('Amount', 480, tableTop, { align: 'right' });

      // Table line
      doc.moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();

      // Table Row
      const rowY = tableTop + 30;
      doc.fontSize(10)
        .font('Helvetica')
        .text(ticketType || 'Event Registration', 50, rowY)
        .text(quantity?.toString() || '1', 400, rowY)
        .text(formattedAmount, 480, rowY, { align: 'right' });

      // Table bottom line
      doc.moveTo(50, rowY + 20)
        .lineTo(550, rowY + 20)
        .stroke();

      // Total Section
      const totalY = rowY + 50;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Total Amount:', 400, totalY)
        .text(formattedAmount, 480, totalY, { align: 'right' });

      // Payment Info
      const paymentInfoY = totalY + 50;
      doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('Payment Information', 50, paymentInfoY)
        .moveDown(0.5);

      doc.font('Helvetica')
        .fontSize(9)
        .text(`Payment ID: ${paymentId}`, 50, paymentInfoY + 30)
        .text(`Status: ${paymentStatus}`, 50, paymentInfoY + 45);

      if (transactionId) {
        doc.text(`Transaction ID: ${transactionId}`, 50, paymentInfoY + 60);
      }

      if (paidAt) {
        doc.text(`Paid At: ${new Date(paidAt).toLocaleString('id-ID')}`, 50, paymentInfoY + 75);
      }

      if (paymentMethod) {
        doc.text(`Payment Method: ${paymentMethod}`, 50, paymentInfoY + 90);
      }

      // Footer
      const footerY = 700;
      doc.fontSize(8)
        .font('Helvetica')
        .text('Thank you for your registration!', 50, footerY, { align: 'center' })
        .text('This is an automated invoice. Please keep this for your records.', 50, footerY + 15, { align: 'center' });

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info(`Invoice PDF generated: ${filename}`);

      // Read PDF buffer
      const pdfBuffer = await fsPromises.readFile(filePath);

      return {
        filename,
        filePath,
        invoiceUrl,
        pdfBuffer
      };

    } catch (error) {
      logger.error('Error generating invoice PDF:', error);
      throw error;
    }
  }
}

module.exports = new InvoicePdfService();

