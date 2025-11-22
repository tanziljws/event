const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Development endpoint to get OTP (temporary for email debugging)
router.get('/otp/:email', async (req, res) => {
  try {

    const { email } = req.params;
    
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { 
        email,
        purpose: 'EMAIL_VERIFICATION'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'No OTP found for this email'
      });
    }

    res.json({
      success: true,
      data: {
        email: otpRecord.email,
        otpCode: otpRecord.otpCode,
        expiresAt: otpRecord.expiresAt,
        createdAt: otpRecord.createdAt
      }
    });
  } catch (error) {
    console.error('Dev OTP endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;