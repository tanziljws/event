require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmailConnection = async () => {
  console.log('🔧 Testing email connection...');
  console.log('📧 Email config:', {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    // pass: process.env.EMAIL_PASS ? '***' : 'NOT SET'
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
      secureProtocol: 'TLSv1_2_method'
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    debug: true,
    logger: true,
  });

  try {
    console.log('🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ Email connection verified!');

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'tanziljws@gmail.com',
      subject: 'Test Email from Railway',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from Railway backend.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Response:', info.response);

  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('🔍 Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
  }
};

testEmailConnection();
