const logger = require('../config/logger');

// Create contact us controller
const contactUs = async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    // Log the contact message
    logger.info(`Contact us message received from ${name} (${email}): ${subject}`);
    logger.info(`Message: ${message}`);
    if (phone) logger.info(`Phone: ${phone}`);

    // For now, just return success (email will be implemented later)
    res.status(200).json({
      success: true,
      message: 'Pesan Anda telah berhasil dikirim! Kami akan segera merespons.',
      data: {
        name,
        email,
        subject,
        message: message.substring(0, 100) + '...', // Truncate for response
        phone: phone || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Contact us error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  contactUs,
};