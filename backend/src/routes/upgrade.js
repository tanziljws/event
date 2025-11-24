const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Upgrade user to business/organizer
router.post('/business', authenticate, [
  body('organizerType')
    .isIn(['INDIVIDUAL', 'COMMUNITY', 'SMALL_BUSINESS', 'INSTITUTION'])
    .withMessage('Invalid organizer type'),
  body('documents')
    .isArray({ min: 1 })
    .withMessage('At least one document is required'),
  body('documents.*')
    .isString()
    .isURL()
    .withMessage('Each document must be a valid URL'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { organizerType, documents } = req.body;

    // Validate required fields based on organizer type
    let requiredFields = {};
    if (organizerType === 'INDIVIDUAL') {
      requiredFields = {
        nik: req.body.nik,
        personalAddress: req.body.personalAddress,
        personalPhone: req.body.personalPhone
      };
      if (!requiredFields.nik || !requiredFields.personalAddress || !requiredFields.personalPhone) {
        return res.status(400).json({
          success: false,
          message: 'NIK, personal address, and personal phone are required for individual organizers'
        });
      }
      if (requiredFields.nik.length !== 16) {
        return res.status(400).json({
          success: false,
          message: 'NIK must be exactly 16 digits'
        });
      }
    } else if (organizerType === 'COMMUNITY') {
      requiredFields = {
        communityName: req.body.communityName || req.body.businessName,
        communityAddress: req.body.communityAddress || req.body.businessAddress,
        communityPhone: req.body.communityPhone || req.body.businessPhone,
        contactPerson: req.body.contactPerson
      };
      if (!requiredFields.communityName || !requiredFields.communityAddress || 
          !requiredFields.communityPhone || !requiredFields.contactPerson) {
        return res.status(400).json({
          success: false,
          message: 'Community name, address, phone, and contact person are required'
        });
      }
    } else if (organizerType === 'SMALL_BUSINESS') {
      requiredFields = {
        businessName: req.body.businessName,
        businessAddress: req.body.businessAddress,
        businessPhone: req.body.businessPhone
      };
      if (!requiredFields.businessName || !requiredFields.businessAddress || !requiredFields.businessPhone) {
        return res.status(400).json({
          success: false,
          message: 'Business name, address, and phone are required'
        });
      }
    } else if (organizerType === 'INSTITUTION') {
      requiredFields = {
        institutionName: req.body.institutionName || req.body.businessName,
        institutionAddress: req.body.institutionAddress || req.body.businessAddress,
        institutionPhone: req.body.institutionPhone || req.body.businessPhone,
        contactPerson: req.body.contactPerson
      };
      if (!requiredFields.institutionName || !requiredFields.institutionAddress || 
          !requiredFields.institutionPhone || !requiredFields.contactPerson) {
        return res.status(400).json({
          success: false,
          message: 'Institution name, address, phone, and contact person are required'
        });
      }
    }

    // Check if user exists and is a participant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizerType: true,
        verificationStatus: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'PARTICIPANT') {
      return res.status(400).json({
        success: false,
        message: 'User is already upgraded or has different role'
      });
    }

    // Check if user already has pending organizer request
    if (user.organizerType && user.verificationStatus === 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending organizer request. Please wait for approval.'
      });
    }

    // Get current metadata or initialize empty object
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true }
    });
    const currentMetadata = (currentUser && typeof currentUser.metadata === 'object' && currentUser.metadata !== null) 
      ? currentUser.metadata 
      : {};

    // Update user: Keep role as PARTICIPANT, only set organizerType and verificationStatus
    // Set subscription plan to 'basic' in metadata (default for new organizers)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        organizerType: organizerType,
        verificationStatus: 'PENDING',
        metadata: {
          ...currentMetadata,
          subscriptionPlan: 'basic',
          planLabel: 'Basic',
          maxEventsPerMonth: 5,
          maxParticipantsPerEvent: 100,
          subscriptionStartedAt: new Date().toISOString(),
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
        updatedAt: true
      }
    });

    // Create or update appropriate profile based on organizer type
    if (organizerType === 'INDIVIDUAL') {
      await prisma.individualProfile.upsert({
        where: { userId: userId },
        update: {
          nik: requiredFields.nik,
          personalAddress: requiredFields.personalAddress,
          personalPhone: requiredFields.personalPhone,
          documents: documents
        },
        create: {
          userId: userId,
          nik: requiredFields.nik,
          personalAddress: requiredFields.personalAddress,
          personalPhone: requiredFields.personalPhone,
          documents: documents
        }
      });
    } else if (organizerType === 'COMMUNITY') {
      await prisma.communityProfile.upsert({
        where: { userId: userId },
        update: {
          communityName: requiredFields.communityName,
          communityAddress: requiredFields.communityAddress,
          communityPhone: requiredFields.communityPhone,
          contactPerson: requiredFields.contactPerson,
          documents: documents
        },
        create: {
          userId: userId,
          communityName: requiredFields.communityName,
          communityAddress: requiredFields.communityAddress,
          communityPhone: requiredFields.communityPhone,
          contactPerson: requiredFields.contactPerson,
          documents: documents
        }
      });
    } else if (organizerType === 'SMALL_BUSINESS') {
      await prisma.businessProfile.upsert({
        where: { userId: userId },
        update: {
          businessName: requiredFields.businessName,
          businessAddress: requiredFields.businessAddress,
          businessPhone: requiredFields.businessPhone,
          npwp: req.body.npwp || null,
          documents: documents
        },
        create: {
          userId: userId,
          businessName: requiredFields.businessName,
          businessAddress: requiredFields.businessAddress,
          businessPhone: requiredFields.businessPhone,
          npwp: req.body.npwp || null,
          documents: documents
        }
      });
    } else if (organizerType === 'INSTITUTION') {
      await prisma.institutionProfile.upsert({
        where: { userId: userId },
        update: {
          institutionName: requiredFields.institutionName,
          institutionAddress: requiredFields.institutionAddress,
          institutionPhone: requiredFields.institutionPhone,
          contactPerson: requiredFields.contactPerson,
          documents: documents
        },
        create: {
          userId: userId,
          institutionName: requiredFields.institutionName,
          institutionAddress: requiredFields.institutionAddress,
          institutionPhone: requiredFields.institutionPhone,
          contactPerson: requiredFields.contactPerson,
          documents: documents
        }
      });
    }

    // Auto-assign to agent for verification (only if not already assigned)
    if (!updatedUser.assignedTo) {
      try {
        const smartAssignmentService = require('../services/smartAssignmentService');
        const assignmentResult = await smartAssignmentService.assignToBestAgent('ORGANIZER', userId, 'NORMAL');
        logger.info(`Auto-assigned organizer request ${userId} (${user.fullName}) to agent:`, assignmentResult);
      } catch (assignmentError) {
        logger.error('Failed to auto-assign organizer request:', assignmentError);
        // Don't fail upgrade if assignment fails
      }
    }

    logger.info(`User ${userId} (${user.fullName}) submitted organizer request with type: ${organizerType}`);

    res.status(200).json({
      success: true,
      message: 'Organizer request submitted successfully. Your request is pending admin approval. You will remain as a participant until approved.',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    logger.error('Upgrade business error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade account'
    });
  }
});

// Get upgrade status
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
        businessProfile: {
          select: {
            businessName: true,
            businessAddress: true,
            businessPhone: true
          }
        },
        individualProfile: {
          select: {
            portfolio: true,
            socialMedia: true
          }
        },
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        canUpgrade: user.role === 'PARTICIPANT',
        isUpgraded: user.role === 'ORGANIZER',
        isVerified: user.verificationStatus === 'APPROVED'
      }
    });

  } catch (error) {
    logger.error('Get upgrade status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upgrade status'
    });
  }
});

module.exports = router;
