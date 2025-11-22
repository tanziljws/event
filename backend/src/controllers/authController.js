const authService = require('../services/authService');
const logger = require('../config/logger');

// Register new user
const register = async (req, res) => {
  try {
    const userData = req.body;
    const result = await authService.registerUser(userData);

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    // Handle specific error cases
    let errorMessage = error.message;
    if (error.message === 'User with this email already exists and is verified') {
      errorMessage = 'Email sudah terdaftar dan terverifikasi. Silakan lakukan login atau gunakan email lain.';
    } else if (error.message === 'User with this email already exists') {
      errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau lakukan login.';
    } else if (error.message.includes('Email sending failed')) {
      errorMessage = 'Registrasi berhasil, tetapi email verifikasi gagal dikirim. Silakan coba login.';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

// Register organizer with profile
const registerOrganizer = async (req, res) => {
  try {
    const userData = req.body;
    const result = await authService.registerOrganizerWithProfile(userData);

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
        profile: result.profile,
      },
    });
  } catch (error) {
    logger.error('Organizer registration error:', error);
    
    // Handle specific error cases
    let errorMessage = error.message;
    if (error.message === 'User with this email already exists and is verified') {
      errorMessage = 'Email sudah terdaftar dan terverifikasi. Silakan lakukan login atau gunakan email lain.';
    } else if (error.message === 'User with this email already exists') {
      errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau lakukan login.';
    } else if (error.message.includes('Email sending failed')) {
      errorMessage = 'Registrasi berhasil, tetapi email verifikasi gagal dikirim. Silakan coba login.';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
};

// Resend OTP for email verification
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOtp(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify email with OTP
const verifyEmail = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const result = await authService.verifyEmail(email, otpCode);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken, // Include refresh token for mobile apps
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    // Try to get refresh token from cookies first (web), then from body (mobile)
    let refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided',
      });
    }

    const result = await authService.refreshToken(refreshToken);

    // Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken, // Include refresh token for mobile apps
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    await authService.logoutUser(userId, ipAddress, userAgent);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: result.success,
      message: result.message,
      code: result.code,
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

// Validate reset token
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    const isValid = await authService.validateResetToken(token);
    
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Reset token is valid',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }
  } catch (error) {
    logger.error('Token validation error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const result = await authService.updateUserProfile(userId, updateData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  register,
  resendOtp,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getMe,
  updateProfile,
  registerOrganizer,
};
