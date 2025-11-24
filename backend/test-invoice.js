require('dotenv').config();
const invoicePdfService = require('./src/services/invoicePdfService');
const { emailTemplates } = require('./src/config/brevoEmail');

// Test invoice generation
async function testInvoiceGeneration() {
  console.log('🧪 Testing Invoice PDF Generation...\n');

  const testInvoiceData = {
    invoiceNumber: `INV-${Date.now()}-TEST`,
    paymentId: 'PAY_TEST_123456',
    customerName: 'John Doe',
    customerEmail: 'tanziljws@icloud.com',
    customerPhone: '+6281234567890',
    eventTitle: 'Test Event - Midtrans Integration',
    eventDate: new Date('2024-12-25'),
    eventTime: '10:00 AM',
    eventLocation: 'Jakarta Convention Center',
    amount: 150000,
    quantity: 2,
    ticketType: 'VIP Ticket',
    paymentStatus: 'PAID',
    paidAt: new Date(),
    paymentMethod: 'Midtrans - GoPay',
    transactionId: 'MIDTRANS_TEST_123456'
  };

  try {
    console.log('📄 Generating invoice PDF...');
    const result = await invoicePdfService.generateInvoicePdf(testInvoiceData);
    
    console.log('✅ Invoice PDF generated successfully!');
    console.log('   📁 Filename:', result.filename);
    console.log('   📍 File Path:', result.filePath);
    console.log('   🔗 Invoice URL:', result.invoiceUrl);
    console.log('   📊 PDF Size:', (result.pdfBuffer.length / 1024).toFixed(2), 'KB');
    console.log('\n');

    return result;
  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    throw error;
  }
}

// Test email with invoice attachment
async function testInvoiceEmail(invoiceResult) {
  console.log('🧪 Testing Invoice Email with Attachment...\n');

  const invoiceData = {
    invoiceNumber: `INV-${Date.now()}-TEST`,
    paymentId: 'PAY_TEST_123456',
    customerName: 'John Doe',
    customerEmail: 'tanziljws@icloud.com',
    eventTitle: 'Test Event - Midtrans Integration',
    amount: 150000,
    paidAt: new Date()
  };

  try {
    console.log('📧 Sending invoice email with PDF attachment...');
    console.log('   📬 To:', invoiceData.customerEmail);
    console.log('   📎 Attachment:', `Invoice_${invoiceData.invoiceNumber}.pdf`);
    
    const emailResult = await emailTemplates.sendInvoiceEmail(invoiceData, invoiceResult.pdfBuffer);
    
    console.log('✅ Invoice email sent successfully!');
    console.log('   📧 Message ID:', emailResult.messageId);
    console.log('\n');
    console.log('💡 Check your email inbox for the invoice PDF attachment!');
    console.log('\n');

    return emailResult;
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Invoice Test Suite...\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // Test 1: Generate Invoice PDF
    const invoiceResult = await testInvoiceGeneration();

    // Test 2: Send Email with Invoice Attachment
    await testInvoiceEmail(invoiceResult);

    console.log('=' .repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('\n');
    console.log('📋 Summary:');
    console.log('   ✅ Invoice PDF generation: PASSED');
    console.log('   ✅ Email with attachment: PASSED');
    console.log('\n');
    console.log('💡 Next steps:');
    console.log('   1. Check your email inbox (tanziljws@icloud.com)');
    console.log('   2. Verify invoice PDF is attached');
    console.log('   3. Download and open the PDF to verify format');
    console.log('\n');

  } catch (error) {
    console.error('\n');
    console.error('=' .repeat(60));
    console.error('❌ Test failed!');
    console.error('   Error:', error.message);
    console.error('\n');
    process.exit(1);
  }
}

// Run tests
runTests();

