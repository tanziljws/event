const { emailTemplates } = require('./src/config/brevoEmail');
const logger = require('./src/config/logger');

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Service...\n');
  
  const testEmail = 'tanziljws@icloud.com';
  const testName = 'Tanzil Test';
  
  try {
    // Test 1: Email Verification
    console.log('📧 Test 1: Sending Email Verification...');
    await emailTemplates.sendVerificationEmail(testEmail, testName, '123456');
    console.log('✅ Email Verification sent successfully!\n');
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Password Reset
    console.log('📧 Test 2: Sending Password Reset...');
    const resetToken = 'test-reset-token-12345';
    await emailTemplates.sendPasswordResetEmail(testEmail, resetToken, testName);
    console.log('✅ Password Reset email sent successfully!\n');
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Organizer Approval
    console.log('📧 Test 3: Sending Organizer Approval...');
    await emailTemplates.sendOrganizerApprovalEmail(testEmail, testName);
    console.log('✅ Organizer Approval email sent successfully!\n');
    
    // Wait a bit between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Event Registration Confirmation
    console.log('📧 Test 4: Sending Event Registration Confirmation...');
    const eventData = {
      title: 'Test Event',
      eventDate: new Date(),
      location: 'Test Location',
      eventTime: '10:00 AM'
    };
    await emailTemplates.sendRegistrationConfirmation(
      testEmail,
      eventData,
      'test-token-123',
      testName,
      'https://example.com/qr',
      'https://example.com/ticket'
    );
    console.log('✅ Event Registration Confirmation sent successfully!\n');
    
    console.log('🎉 All email tests completed successfully!');
    console.log(`📬 Check your inbox at: ${testEmail}`);
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    console.error('Error details:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testBrevoEmail()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

