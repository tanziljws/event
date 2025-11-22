const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authService = require('../services/authService');
const eventService = require('../services/eventService');
const auditService = require('../services/auditService');
const { authenticate, requireAdmin, requireOrganizer } = require('../middlewares/auth');
const { validatePagination, validateSearch } = require('../middlewares/validation');
const logger = require('../config/logger');

const prisma = new PrismaClient();

const router = express.Router();

// Get organizers for admin review
router.get('/review', authenticate, requireAdmin, validatePagination, async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      verificationStatus: req.query.status,
      organizerType: req.query.type,
      search: req.query.q,
    };

    const result = await authService.getOrganizersForReview(filters, req.user.role, req.user.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get organizers for review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizers',
    });
  }
});

// Verify organizer (approve/reject) - moved to end of file to avoid route conflicts

// Get organizer's events
router.get('/:organizerId/events', authenticate, requireOrganizer, validatePagination, async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { page, limit, status, category, search } = req.query;

    // Check if user can access this organizer's events
    if (req.user.role !== 'ADMIN' && req.user.id !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const filters = {
      page,
      limit,
      status,
      category,
      search,
      organizerId,
    };

    const result = await eventService.getEventsForReview(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get organizer events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer events',
    });
  }
});

// Get organizer revenue
router.get('/:organizerId/revenue', authenticate, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params;

    // Check if user can access this organizer's revenue
    if (req.user.role !== 'ADMIN' && req.user.id !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { prisma } = require('../config/database');

    const revenue = await prisma.organizerRevenue.findMany({
      where: { organizerId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const totals = revenue.reduce(
      (acc, rev) => {
        acc.totalRevenue += parseFloat(rev.totalRevenue);
        acc.totalPlatformFee += parseFloat(rev.platformFee);
        acc.totalOrganizerAmount += parseFloat(rev.organizerAmount);
        return acc;
      },
      { totalRevenue: 0, totalPlatformFee: 0, totalOrganizerAmount: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        revenue,
        totals,
      },
    });
  } catch (error) {
    logger.error('Get organizer revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer revenue',
    });
  }
});

// Get organizer dashboard stats
router.get('/:organizerId/dashboard', authenticate, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params;

    // Check if user can access this organizer's dashboard
    if (req.user.role !== 'ADMIN' && req.user.id !== organizerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { prisma } = require('../config/database');

    const [
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalRevenue,
      recentEvents,
    ] = await Promise.all([
      prisma.event.count({
        where: { createdBy: organizerId },
      }),
      prisma.event.count({
        where: { 
          createdBy: organizerId,
          status: 'PUBLISHED',
        },
      }),
      prisma.eventRegistration.count({
        where: {
          event: {
            createdBy: organizerId,
          },
        },
      }),
      prisma.organizerRevenue.aggregate({
        where: { organizerId },
        _sum: {
          organizerAmount: true,
        },
      }),
      prisma.event.findMany({
        where: { createdBy: organizerId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEvents,
          publishedEvents,
          totalRegistrations,
          totalRevenue: totalRevenue._sum.organizerAmount || 0,
        },
        recentEvents,
      },
    });
  } catch (error) {
    logger.error('Get organizer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer dashboard',
    });
  }
});

// Get organizer details for operations team
router.get('/:organizerId/details', authenticate, async (req, res) => {
  try {
    const { organizerId } = req.params;
    const userRole = req.user.role;

    // Check if user has permission to view organizer details
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_AGENT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Operations role required'
      });
    }

    // For agents, only allow viewing organizers assigned to them (can be PARTICIPANT with organizerType)
    if (userRole === 'OPS_AGENT') {
      const organizer = await prisma.user.findFirst({
        where: {
          id: organizerId,
          organizerType: { not: null },
          assignedTo: req.user.id
        }
      });

      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer request not found or not assigned to you'
        });
      }
    }

    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
        organizerType: true,
        verificationStatus: true,
        verifiedAt: true,
        rejectedReason: true,
        createdAt: true,
        updatedAt: true,
        // Include profile relations with documents
        individualProfile: {
          select: {
            nik: true,
            personalAddress: true,
            personalPhone: true,
            portfolio: true,
            socialMedia: true,
            documents: true // Include documents
          }
        },
        communityProfile: {
          select: {
            communityName: true,
            communityType: true,
            communityAddress: true,
            communityPhone: true,
            contactPerson: true,
            legalDocument: true,
            website: true,
            socialMedia: true,
            documents: true // Include documents
          }
        },
        businessProfile: {
          select: {
            businessName: true,
            businessType: true,
            businessAddress: true,
            businessPhone: true,
            npwp: true,
            legalDocument: true,
            logo: true,
            socialMedia: true,
            portfolio: true,
            documents: true // Include documents
          }
        },
        institutionProfile: {
          select: {
            institutionName: true,
            institutionType: true,
            institutionAddress: true,
            institutionPhone: true,
            contactPerson: true,
            akta: true,
            siup: true,
            website: true,
            socialMedia: true,
            documents: true // Include documents
          }
        }
      }
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    res.json({
      success: true,
      data: organizer
    });
  } catch (error) {
    logger.error('Get organizer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer details'
    });
  }
});

// Approve organizer
router.post('/:organizerId/approve', authenticate, async (req, res) => {
  try {
    const { organizerId } = req.params;
    const userRole = req.user.role;

    // Check if user has permission to approve organizers
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_AGENT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Operations role required'
      });
    }

    // For agents, only allow approving organizers assigned to them
    if (userRole === 'OPS_AGENT') {
      const organizer = await prisma.user.findFirst({
        where: {
          id: organizerId,
          organizerType: { not: null },
          assignedTo: req.user.id,
          verificationStatus: 'PENDING'
        }
      });

      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer request not found, not assigned to you, or not pending'
        });
      }
    }

    const result = await authService.verifyOrganizer(organizerId, 'approve', null, req.user.id);

    if (result.success) {
      // Log audit trail
      await auditService.logAction({
        userId: req.user.id,
        action: 'ORGANIZER_APPROVED',
        targetType: 'ORGANIZER',
        targetId: organizerId,
        details: { organizerName: result.organizer?.fullName }
      });

      res.json({
        success: true,
        message: 'Organizer approved successfully',
        data: result.organizer
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Approve organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve organizer'
    });
  }
});

// Reject organizer
router.post('/:organizerId/reject', authenticate, async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { reason } = req.body;
    const userRole = req.user.role;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Check if user has permission to reject organizers
    if (!['SUPER_ADMIN', 'OPS_HEAD', 'OPS_AGENT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Operations role required'
      });
    }

    // For agents, only allow rejecting organizers assigned to them
    if (userRole === 'OPS_AGENT') {
      const organizer = await prisma.user.findFirst({
        where: {
          id: organizerId,
          role: 'ORGANIZER',
          assignedTo: req.user.id,
          verificationStatus: 'PENDING'
        }
      });

      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found, not assigned to you, or not pending'
        });
      }
    }

    const result = await authService.verifyOrganizer(organizerId, 'reject', reason, req.user.id);

    if (result.success) {
      // Log audit trail
      await auditService.logAction({
        userId: req.user.id,
        action: 'ORGANIZER_REJECTED',
        targetType: 'ORGANIZER',
        targetId: organizerId,
        details: { 
          organizerName: result.organizer?.fullName,
          reason: reason
        }
      });

      res.json({
        success: true,
        message: 'Organizer rejected successfully',
        data: result.organizer
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    logger.error('Reject organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject organizer'
    });
  }
});

// Verify organizer (approve/reject) - moved here to avoid route conflicts
router.post('/:organizerId/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { action, reason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"',
      });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Get organizer before verification for audit trail
    const organizerBefore = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { 
        id: true, 
        fullName: true, 
        email: true, 
        verificationStatus: true 
      }
    });

    if (!organizerBefore) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    const organizer = await authService.verifyOrganizer(organizerId, action, reason);

    // Log audit trail
    try {
      await auditService.logAction({
        action: action === 'approve' ? auditService.ACTIONS.APPROVE : auditService.ACTIONS.DECLINE,
        entityType: auditService.ENTITY_TYPES.ORGANIZER,
        entityId: organizerId,
        performedBy: req.user.id,
        reason: reason || null,
        previousStatus: organizerBefore.verificationStatus,
        newStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID,
        metadata: {
          organizerName: organizerBefore.fullName,
          organizerEmail: organizerBefore.email,
          action: action
        }
      });
    } catch (auditError) {
      logger.error('Failed to log audit trail for organizer verification:', auditError);
      // Don't fail the main operation if audit logging fails
    }

    res.status(200).json({
      success: true,
      message: `Organizer ${action}d successfully`,
      data: organizer,
    });
  } catch (error) {
    logger.error('Verify organizer error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
