const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/database');
// Use Brevo email service
const { emailTemplates } = require('../config/brevoEmail');
const { generateToken, generateRefreshToken } = require('../middlewares/auth');
const logger = require('../config/logger');
const smartAssignmentService = require('./smartAssignmentService');

// Helper functions for capacity management
const getAssignedEventIds = async (userId, role) => {
  // Simulate assignment using user ID hash for consistent distribution
  const allEvents = await prisma.event.findMany({
    where: { status: 'DRAFT' },
    select: { id: true },
    orderBy: { createdAt: 'desc' }
  });

  const agents = await prisma.user.findMany({
    where: { role: 'OPS_AGENT' },
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const agentIndex = agents.findIndex(agent => agent.id === userId);
  if (agentIndex === -1) return [];

  return allEvents
    .filter((_, index) => index % agents.length === agentIndex)
    .map(event => event.id);
};

const getAssignedOrganizerIds = async (userId, role) => {
  // Simulate assignment using user ID hash for consistent distribution
  const allOrganizers = await prisma.user.findMany({
    where: { 
      role: 'ORGANIZER',
      verificationStatus: 'PENDING'
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' }
  });

  const agents = await prisma.user.findMany({
    where: { role: 'OPS_AGENT' },
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const agentIndex = agents.findIndex(agent => agent.id === userId);
  if (agentIndex === -1) return [];

  return allOrganizers
    .filter((_, index) => index % agents.length === agentIndex)
    .map(organizer => organizer.id);
};

// Generate OTP code
const generateOTP = (length = 6) => {
  return crypto.randomInt(100000, 999999).toString().padStart(length, '0');
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate registration token
const generateRegistrationToken = () => {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Register organizer with profile
const registerOrganizerWithProfile = async (userData) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phoneNumber, 
      address, 
      lastEducation,
      organizerType,
      profileData = {}
    } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.info(`User exists: ${email}, verified: ${existingUser.emailVerified}`);
      
      // If user exists but not verified, delete the old user and allow re-registration
      if (!existingUser.emailVerified) {
        logger.info(`Deleting unverified user for re-registration: ${email}`);
        
        // Delete related OTP records first
        await prisma.otpVerification.deleteMany({
          where: { email },
        });
        
        // Delete the unverified user (with error handling)
        try {
          await prisma.user.delete({
            where: { id: existingUser.id },
          });
        } catch (deleteError) {
          // If user doesn't exist anymore, that's fine - continue with registration
          if (deleteError.code === 'P2025') {
            logger.info(`User already deleted, continuing with registration: ${email}`);
          } else {
            throw deleteError;
          }
        }
        
        logger.info(`Unverified user deleted successfully: ${email}`);
      } else {
        // User is already verified, cannot re-register
        logger.info(`User is verified, cannot re-register: ${email}`);
        throw new Error('User with this email already exists and is verified');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with Basic plan metadata (default for new organizers)
      const user = await tx.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
          phoneNumber,
          address,
          lastEducation,
          role: 'ORGANIZER',
          organizerType,
          verificationStatus: 'PENDING',
          verificationToken,
          verificationTokenExpires,
          metadata: {
            subscriptionPlan: 'basic',
            planLabel: 'Basic',
            maxEventsPerMonth: 5,
            maxParticipantsPerEvent: 100,
            subscriptionStartedAt: new Date().toISOString(),
          },
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          organizerType: true,
          verificationStatus: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Validate required fields based on organizer type
      const documents = profileData.documents || [];
      
      if (documents.length === 0) {
        throw new Error('At least one document is required');
      }

      // Create profile based on organizer type
      let profile = null;
      switch (organizerType) {
        case 'INDIVIDUAL':
          if (!profileData.nik || !profileData.personalAddress || !profileData.personalPhone) {
            throw new Error('NIK, personal address, and personal phone are required for individual organizers');
          }
          if (profileData.nik.length !== 16) {
            throw new Error('NIK must be exactly 16 digits');
          }
          profile = await tx.individualProfile.create({
            data: {
              userId: user.id,
              nik: profileData.nik,
              personalAddress: profileData.personalAddress,
              personalPhone: profileData.personalPhone,
              documents: documents
            }
          });
          break;
        case 'COMMUNITY':
          if (!profileData.communityName || !profileData.communityAddress || 
              !profileData.communityPhone || !profileData.contactPerson) {
            throw new Error('Community name, address, phone, and contact person are required');
          }
          profile = await tx.communityProfile.create({
            data: {
              userId: user.id,
              communityName: profileData.communityName,
              communityAddress: profileData.communityAddress,
              communityPhone: profileData.communityPhone,
              contactPerson: profileData.contactPerson,
              documents: documents
            }
          });
          break;
        case 'SMALL_BUSINESS':
          if (!profileData.businessName || !profileData.businessAddress || !profileData.businessPhone) {
            throw new Error('Business name, address, and phone are required');
          }
          profile = await tx.businessProfile.create({
            data: {
              userId: user.id,
              businessName: profileData.businessName,
              businessAddress: profileData.businessAddress,
              businessPhone: profileData.businessPhone,
              npwp: profileData.npwp || null,
              documents: documents
            }
          });
          break;
        case 'INSTITUTION':
          if (!profileData.institutionName || !profileData.institutionAddress || 
              !profileData.institutionPhone || !profileData.contactPerson) {
            throw new Error('Institution name, address, phone, and contact person are required');
          }
          profile = await tx.institutionProfile.create({
            data: {
              userId: user.id,
              institutionName: profileData.institutionName,
              institutionAddress: profileData.institutionAddress,
              institutionPhone: profileData.institutionPhone,
              contactPerson: profileData.contactPerson,
              documents: documents
            }
          });
          break;
      }

      return { user, profile };
    });

    const user = result.user;

    // Auto-assign organizer to agent
    try {
      const assignmentResult = await smartAssignmentService.assignToBestAgent('ORGANIZER', user.id, 'NORMAL');
      logger.info(`Auto-assigned organizer ${user.id} (${user.fullName}) to agent:`, assignmentResult);
    } catch (assignmentError) {
      logger.error('Failed to auto-assign organizer:', assignmentError);
      // Don't fail registration if assignment fails
    }

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        email,
        otpCode,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt: otpExpires,
      },
    });

    // Send verification email with OTP (with fallback)
    try {
      await emailTemplates.sendVerificationEmail(email, fullName, otpCode);
      logger.info(`✅ Email verification OTP sent to: ${email}`);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      logger.info(`[FALLBACK] Email verification OTP for ${email}: ${otpCode}`);
      // Don't fail registration if email fails
    }

    return {
      message: 'Organizer registration successful. Please check your email for verification code.',
      user,
      profile: result.profile
    };

  } catch (error) {
    logger.error('Organizer registration error:', error);
    throw error;
  }
};

// Register new user (legacy function for participants)
const registerUser = async (userData) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phoneNumber, 
      address, 
      lastEducation,
      role = 'PARTICIPANT',
      organizerType,
      businessName,
      businessAddress,
      businessPhone,
      portfolio = [],
      socialMedia = {}
    } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logger.info(`User exists: ${email}, verified: ${existingUser.emailVerified}`);
      
      // If user exists but not verified, delete the old user and allow re-registration
      if (!existingUser.emailVerified) {
        logger.info(`Deleting unverified user for re-registration: ${email}`);
        
        // Delete related OTP records first
        await prisma.otpVerification.deleteMany({
          where: { email },
        });
        
        // Delete the unverified user (with error handling)
        try {
          await prisma.user.delete({
            where: { id: existingUser.id },
          });
        } catch (deleteError) {
          // If user doesn't exist anymore, that's fine - continue with registration
          if (deleteError.code === 'P2025') {
            logger.info(`User already deleted, continuing with registration: ${email}`);
          } else {
            throw deleteError;
          }
        }
        
        logger.info(`Unverified user deleted successfully: ${email}`);
      } else {
        // User is already verified, cannot re-register
        logger.info(`User is verified, cannot re-register: ${email}`);
        throw new Error('User with this email already exists and is verified');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phoneNumber,
        address,
        lastEducation,
        role,
        organizerType: role === 'ORGANIZER' ? organizerType : null,
        verificationStatus: role === 'ORGANIZER' ? 'PENDING' : 'APPROVED',
        verificationToken,
        verificationTokenExpires,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Auto-assign organizer to agent if role is ORGANIZER
    if (role === 'ORGANIZER') {
      try {
        const assignmentResult = await smartAssignmentService.assignToBestAgent('ORGANIZER', user.id, 'NORMAL');
        logger.info(`Auto-assigned organizer ${user.id} (${user.fullName}) to agent:`, assignmentResult);
      } catch (assignmentError) {
        logger.error('Failed to auto-assign organizer:', assignmentError);
        // Don't fail registration if assignment fails
      }
    }

    // Generate OTP for email verification
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        email,
        otpCode,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt: otpExpires,
      },
    });

    // Send verification email with OTP (with fallback)
    try {
      await emailTemplates.sendOtpEmail(email, otpCode, fullName);
      logger.info(`✅ Email verification OTP sent to: ${email}`);
    } catch (emailError) {
      logger.warn('Email sending failed, but user registration continues:', emailError.message);
      logger.info(`[FALLBACK] Email verification OTP for ${email}: ${otpCode}`);
      // Continue with registration even if email fails
    }

    logger.info(`User registered successfully: ${email}`);

    return {
      user,
      message: 'Registration successful. Please check your email for verification code.',
    };
  } catch (error) {
    logger.error('User registration error:', error);
    throw error;
  }
};

// Resend OTP for email verification
const resendOtp = async (email) => {
  try {
    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old OTP records for this email
    await prisma.otpVerification.deleteMany({
      where: { 
        email,
        purpose: 'EMAIL_VERIFICATION'
      },
    });

    // Store new OTP in database
    await prisma.otpVerification.create({
      data: {
        email,
        otpCode,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt: otpExpires,
      },
    });

    // Send verification email with OTP (with fallback)
    if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
      logger.info(`[DEV MODE] Resend OTP for ${email}: ${otpCode}`);
    } else {
      try {
        await emailTemplates.sendOtpEmail(email, otpCode, user.fullName);
      } catch (emailError) {
        logger.warn('Email sending failed, but OTP resend continues:', emailError.message);
        logger.info(`[FALLBACK] Resend OTP for ${email}: ${otpCode}`);
      }
    }

    logger.info(`OTP resent successfully for: ${email}`);

    return {
      message: 'OTP has been resent to your email',
    };
  } catch (error) {
    logger.error('Resend OTP error:', error);
    throw error;
  }
};

// Verify email with OTP
const verifyEmail = async (email, otpCode) => {
  try {
    logger.info(`Verifying OTP for email: ${email}, OTP: ${otpCode}`);
    
    // Find valid OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email: email,
        otpCode: otpCode,
        purpose: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    logger.info(`OTP Record found:`, otpRecord);

    if (!otpRecord) {
      throw new Error('Invalid or expired OTP code');
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update user verification status
    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    logger.info(`Email verified successfully: ${email}`);

    return {
      user,
      message: 'Email verified successfully',
    };
  } catch (error) {
    logger.error('Email verification error:', error);
    throw error;
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    console.log('🔍 Login attempt:', { email, passwordLength: password.length });
    
    // Debug: Check database connection
    console.log('🔍 Database connection check...');
    const dbCheck = await prisma.user.count();
    console.log('📊 Total users in database:', dbCheck);
    
    // Debug: Check if user exists with different query
    const userExists = await prisma.user.findFirst({
      where: { email: email },
      select: { email: true, role: true }
    });
    console.log('🔍 User exists check:', userExists);
    
    // Find user (exclude metadata for now since it might not exist in database yet)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        password: true,
        role: true,
        emailVerified: true,
        verificationStatus: true,
        organizerType: true,
        phoneNumber: true,
        address: true,
        lastEducation: true,
        createdAt: true,
        updatedAt: true,
        lastActivity: true,
        tokenVersion: true,
        verifiedAt: true,
        rejectedReason: true,
        assignedTo: true,
        assignedAt: true,
        metadata: true,
      },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      throw new Error('Invalid email or password');
    }

    console.log('✅ User found:', { 
      email: user.email, 
      emailVerified: user.emailVerified, 
      verificationStatus: user.verificationStatus,
      role: user.role 
    });

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('❌ Email not verified:', email);
      throw new Error('Please verify your email before logging in');
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    console.log('🔑 Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      throw new Error('Invalid email or password');
    }

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivity: new Date() },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: null, // Will be set by middleware
        userAgent: null, // Will be set by middleware
      },
    });

    logger.info(`User logged in successfully: ${email}`);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        verificationStatus: user.verificationStatus,
        rejectedReason: user.rejectedReason,
        verifiedAt: user.verifiedAt,
        organizerType: user.organizerType,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        businessPhone: user.businessPhone,
        portfolio: user.portfolio,
        socialMedia: user.socialMedia,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('User login error:', error);
    throw error;
  }
};

// Refresh token
const refreshToken = async (refreshToken) => {
  try {
    const { verifyRefreshToken } = require('../middlewares/auth');
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.emailVerified) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const newAccessToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error('Token refresh error:', error);
    throw error;
  }
};

// Forgot password
const forgotPassword = async (email) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        verificationStatus: true,
      },
    });

    if (!user) {
      // User doesn't exist
      return {
        success: false,
        message: 'No account found with this email address. Please check your email or create a new account.',
        code: 'USER_NOT_FOUND'
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      logger.info(`Password reset blocked for unverified email: ${email}`);
      return {
        success: false,
        message: 'Please verify your email address before resetting your password. Check your inbox for verification instructions.',
        code: 'EMAIL_NOT_VERIFIED'
      };
    }

    // For organizers, check if they are verified
    // Note: PENDING organizers can still reset password since they have verified email
    if (user.verificationStatus && user.verificationStatus === 'REJECTED') {
      logger.info(`Password reset blocked for rejected organizer: ${email}`);
      return {
        success: false,
        message: 'Your organizer account has been rejected. Please contact support for assistance.',
        code: 'ORGANIZER_REJECTED'
      };
    }

    logger.info(`Password reset allowed for verified user: ${email}`);

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    // Send password reset email
    await emailTemplates.sendPasswordResetEmail(email, resetToken, user.fullName);

    logger.info(`Password reset requested for: ${email}`);

    return {
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
    };
  } catch (error) {
    logger.error('Forgot password error:', error);
    throw error;
  }
};

// Validate reset token
const validateResetToken = async (token) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    return !!user;
  } catch (error) {
    logger.error('Error validating reset token:', error);
    return false;
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  try {
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        ipAddress: null,
        userAgent: null,
      },
    });

    logger.info(`Password reset successfully for: ${user.email}`);

    return {
      message: 'Password reset successfully',
    };
  } catch (error) {
    logger.error('Password reset error:', error);
    throw error;
  }
};

// Logout user
const logoutUser = async (userId, ipAddress, userAgent) => {
  try {
    // Invalidate all tokens by incrementing tokenVersion
    await prisma.user.update({
      where: { id: userId },
      data: { 
        tokenVersion: { increment: 1 }
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        ipAddress,
        userAgent,
      },
    });

    logger.info(`User logged out and tokens invalidated: ${userId}`);
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

// Update user profile
const updateUserProfile = async (userId, updateData) => {
  try {
    const { fullName, phoneNumber, address, lastEducation, email, profilePicture } = updateData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Validate email change (not allowed)
    if (email !== undefined && email !== existingUser.email) {
      throw new Error('Email cannot be changed');
    }

    // Prepare update data (only include allowed fields)
    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (address !== undefined) updateFields.address = address;
    if (lastEducation !== undefined) updateFields.lastEducation = lastEducation;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateFields,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        lastEducation: true,
        profilePicture: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User profile updated: ${userId}`);

    return {
      user,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    logger.error('Update user profile error:', error);
    throw error;
  }
};

// Verify organizer (Admin only)
const verifyOrganizer = async (organizerId, action, reason = null) => {
  try {
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
      },
    });

    if (!organizer) {
      throw new Error('Organizer not found');
    }

    // Check if user has organizerType and is pending (can be PARTICIPANT or ORGANIZER)
    if (!organizer.organizerType) {
      throw new Error('User does not have organizer request');
    }

    if (organizer.verificationStatus !== 'PENDING') {
      throw new Error(`Organizer request is already ${organizer.verificationStatus}`);
    }

    // Prepare update data
    const updateData = {
      verificationStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
      verifiedAt: action === 'approve' ? new Date() : null,
      rejectedReason: action === 'reject' ? reason : null,
    };

    // If approving, change role to ORGANIZER
    if (action === 'approve') {
      updateData.role = 'ORGANIZER';
    }

    const updatedOrganizer = await prisma.user.update({
      where: { id: organizerId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
        verifiedAt: true,
        rejectedReason: true,
      },
    });

    // Send email notification
    try {
      if (action === 'approve') {
        await emailTemplates.sendOrganizerApprovalEmail(organizer.email, organizer.fullName);
        logger.info(`✅ Organizer approval email sent to: ${organizer.email}`);
      } else if (action === 'reject') {
        await emailTemplates.sendOrganizerRejectionEmail(organizer.email, organizer.fullName, reason);
        logger.info(`✅ Organizer rejection email sent to: ${organizer.email}`);
      }
    } catch (emailError) {
      logger.error('Failed to send organizer notification email:', emailError);
      // Don't fail the main operation if email fails
    }

    logger.info(`Organizer ${action}d: ${organizer.email}`);

    return {
      success: true,
      message: `Organizer ${action}d successfully`,
      organizer: updatedOrganizer
    };
  } catch (error) {
    logger.error('Verify organizer error:', error);
    return {
      success: false,
      message: error.message || 'Failed to verify organizer'
    };
  }
};

// Get organizers for admin review
const getOrganizersForReview = async (filters = {}, userRole = null, userId = null) => {
  try {
    const {
      page = 1,
      limit = 10,
      verificationStatus,
      organizerType,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    // Get organizer requests (can be PARTICIPANT or ORGANIZER with organizerType)
    const where = {
      organizerType: { not: null }, // Must have organizerType
    };

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (organizerType) {
      where.organizerType = organizerType;
    }

    // Role-based assignment simulation
    if (userRole && userRole.startsWith('OPS_')) {
      // Get all Operations team members (only HEAD and AGENT, no SENIOR_AGENT)
      const opsTeam = await prisma.user.findMany({
        where: {
          role: {
            in: ['OPS_AGENT', 'OPS_HEAD']
          }
        },
        select: { id: true, role: true },
        orderBy: { createdAt: 'asc' }
      });

      // Smart assignment workflow: Agent + Head only
      if (userRole === 'OPS_AGENT') {
        // Get organizer requests assigned to this agent
        where.assignedTo = userId;
      } else if (userRole === 'OPS_HEAD') {
        // Head handles special cases and oversight
        // Show all organizer requests for oversight and special case handling
        // No additional filtering - full visibility
      }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [organizers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true, // Include role to show if PARTICIPANT or ORGANIZER
          organizerType: true,
          verificationStatus: true,
          verifiedAt: true,
          rejectedReason: true,
          createdAt: true,
          assignedTo: true,
          assignedAt: true,
          // Include profile relations with documents
          individualProfile: {
            select: {
              nik: true,
              personalAddress: true,
              personalPhone: true,
              documents: true // Include documents
            }
          },
          communityProfile: {
            select: {
              communityName: true,
              communityAddress: true,
              communityPhone: true,
              contactPerson: true,
              documents: true // Include documents
            }
          },
          businessProfile: {
            select: {
              businessName: true,
              businessAddress: true,
              businessPhone: true,
              npwp: true,
              documents: true // Include documents
            }
          },
          institutionProfile: {
            select: {
              institutionName: true,
              institutionAddress: true,
              institutionPhone: true,
              contactPerson: true,
              documents: true // Include documents
            }
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      organizers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get organizers for review error:', error);
    throw error;
  }
};

// Switch role (organizer <-> participant)
// Allows:
// 1. Participant with approved organizer request to switch to organizer mode
// 2. Approved organizer to switch to participant mode
const switchRole = async (userId, targetRole) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
        metadata: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const metadata = typeof user.metadata === 'object' && user.metadata !== null ? user.metadata : {};
    const isInParticipantMode = metadata.temporaryRole === 'PARTICIPANT';
    const isInOrganizerMode = !isInParticipantMode;

    // Case 1: Participant with approved organizer request wants to switch to organizer mode
    if (user.role === 'PARTICIPANT' && user.organizerType && user.verificationStatus === 'APPROVED') {
      if (targetRole === 'ORGANIZER') {
        // Switch to organizer mode (temporary - store in metadata)
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...metadata,
              temporaryRole: 'ORGANIZER',
              originalRole: 'PARTICIPANT',
              roleSwitchedAt: new Date().toISOString(),
            },
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            organizerType: true,
            verificationStatus: true,
            metadata: true,
          },
        });

        logger.info(`User ${user.email} (participant) switched to organizer mode`);
        return {
          success: true,
          message: 'Switched to organizer mode',
          user: updatedUser,
          currentMode: 'ORGANIZER',
        };
      }
    }

    // Case 2: Approved organizer wants to switch to participant mode
    if (user.role === 'ORGANIZER' && user.verificationStatus === 'APPROVED') {
      if (targetRole === 'PARTICIPANT') {
        // Switch to participant mode (temporary - store in metadata)
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            metadata: {
              ...metadata,
              temporaryRole: 'PARTICIPANT',
              originalRole: 'ORGANIZER',
              roleSwitchedAt: new Date().toISOString(),
            },
          },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            organizerType: true,
            verificationStatus: true,
            metadata: true,
          },
        });

        logger.info(`User ${user.email} (organizer) switched to participant mode`);
        return {
          success: true,
          message: 'Switched to participant mode',
          user: updatedUser,
          currentMode: 'PARTICIPANT',
        };
      }
    }

    // Case 3: Switch back to original role (if currently in temporary mode)
    if (isInParticipantMode && metadata.originalRole === 'ORGANIZER' && targetRole === 'ORGANIZER') {
      // Switch back to organizer mode
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...metadata,
            temporaryRole: null,
            originalRole: null,
            roleSwitchedAt: null,
          },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          organizerType: true,
          verificationStatus: true,
          metadata: true,
        },
      });

      logger.info(`User ${user.email} switched back to organizer mode`);
      return {
        success: true,
        message: 'Switched back to organizer mode',
        user: updatedUser,
        currentMode: 'ORGANIZER',
      };
    }

    if (isInOrganizerMode && metadata.originalRole === 'PARTICIPANT' && targetRole === 'PARTICIPANT') {
      // Switch back to participant mode
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...metadata,
            temporaryRole: null,
            originalRole: null,
            roleSwitchedAt: null,
          },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          organizerType: true,
          verificationStatus: true,
          metadata: true,
        },
      });

      logger.info(`User ${user.email} switched back to participant mode`);
      return {
        success: true,
        message: 'Switched back to participant mode',
        user: updatedUser,
        currentMode: 'PARTICIPANT',
      };
    }

    throw new Error('Invalid role switch. You must be an approved organizer or participant with approved organizer request to switch roles.');
  } catch (error) {
    logger.error('Switch role error:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  generateVerificationToken,
  generatePasswordResetToken,
  generateRegistrationToken,
  hashPassword,
  comparePassword,
  registerUser,
  registerOrganizerWithProfile,
  resendOtp,
  verifyEmail,
  loginUser,
  refreshToken,
  forgotPassword,
  validateResetToken,
  resetPassword,
  logoutUser,
  updateUserProfile,
  verifyOrganizer,
  getOrganizersForReview,
  switchRole,
};
