const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireDepartment } = require('../middlewares/auth');
const logger = require('../config/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Escalate event to senior agent or head
router.post('/events/:eventId/escalate', authenticate, requireDepartment(['OPERATIONS']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { target, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate input
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason must be at least 10 characters'
      });
    }

    // Validate target
    if (!['SENIOR_AGENT', 'HEAD'].includes(target)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid escalation target. Must be SENIOR_AGENT or HEAD'
      });
    }

    // Check if user can escalate
    if (userRole === 'OPS_HEAD') {
      return res.status(403).json({
        success: false,
        message: 'Head cannot escalate - already at top level'
      });
    }

    // Check if user can escalate to target
    if (userRole === 'OPS_SENIOR_AGENT' && target === 'SENIOR_AGENT') {
      return res.status(403).json({
        success: false,
        message: 'Senior Agent cannot escalate to Senior Agent'
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { creator: true }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is in draft status
    if (event.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Can only escalate events in DRAFT status'
      });
    }

    // Check if already escalated
    if (event.escalationStatus && event.escalationStatus !== 'NONE') {
      return res.status(400).json({
        success: false,
        message: 'Event has already been escalated'
      });
    }

    // Update event with escalation info
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        escalationStatus: 'PENDING',
        escalatedBy: userId,
        escalatedTo: target,
        escalationReason: reason.trim(),
        escalatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Log escalation in activity log
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: `Escalated event "${event.title}" to ${target}. Reason: ${reason}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info(`Event ${eventId} escalated to ${target} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Event escalated to ${target} successfully`,
      data: {
        eventId,
        escalatedBy: req.user.fullName,
        escalatedTo: target,
        reason: reason.trim(),
        escalatedAt: new Date(),
        event: updatedEvent
      }
    });

  } catch (error) {
    logger.error('Event escalation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Escalate organizer to senior agent or head
router.post('/organizers/:organizerId/escalate', authenticate, requireDepartment(['OPERATIONS']), async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { target, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate input
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Escalation reason must be at least 10 characters'
      });
    }

    // Validate target
    if (!['SENIOR_AGENT', 'HEAD'].includes(target)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid escalation target. Must be SENIOR_AGENT or HEAD'
      });
    }

    // Check if user can escalate
    if (userRole === 'OPS_HEAD') {
      return res.status(403).json({
        success: false,
        message: 'Head cannot escalate - already at top level'
      });
    }

    // Check if user can escalate to target
    if (userRole === 'OPS_SENIOR_AGENT' && target === 'SENIOR_AGENT') {
      return res.status(403).json({
        success: false,
        message: 'Senior Agent cannot escalate to Senior Agent'
      });
    }

    // Check if organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        fullName: true,
        email: true,
        businessName: true,
        verificationStatus: true,
        role: true,
        escalationStatus: true
      }
    });

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Check if organizer is in pending status
    if (organizer.verificationStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Can only escalate organizers in PENDING status'
      });
    }

    // Check if already escalated
    if (organizer.escalationStatus && organizer.escalationStatus !== 'NONE') {
      return res.status(400).json({
        success: false,
        message: 'Organizer has already been escalated'
      });
    }

    // Update organizer with escalation info
    const updatedOrganizer = await prisma.user.update({
      where: { id: organizerId },
      data: {
        escalationStatus: 'PENDING',
        escalatedBy: userId,
        escalatedTo: target,
        escalationReason: reason.trim(),
        escalatedAt: new Date()
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        businessName: true,
        verificationStatus: true,
        role: true
      }
    });

    // Log escalation in activity log
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: `Escalated organizer "${organizer.fullName}" to ${target}. Reason: ${reason}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    logger.info(`Organizer ${organizerId} escalated to ${target} by ${req.user.email}`);

    res.json({
      success: true,
      message: `Organizer escalated to ${target} successfully`,
      data: {
        organizerId,
        escalatedBy: req.user.fullName,
        escalatedTo: target,
        reason: reason.trim(),
        escalatedAt: new Date(),
        organizer: updatedOrganizer
      }
    });

  } catch (error) {
    logger.error('Organizer escalation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get escalation history for events
router.get('/events/:eventId/history', authenticate, requireDepartment(['OPERATIONS']), async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get escalation history from activity logs
    const escalations = await prisma.activityLog.findMany({
      where: {
        action: {
          contains: `eventId:${eventId}`
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: escalations
    });

  } catch (error) {
    logger.error('Get escalation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get escalation history for organizers
router.get('/organizers/:organizerId/history', authenticate, requireDepartment(['OPERATIONS']), async (req, res) => {
  try {
    const { organizerId } = req.params;

    // Get escalation history from activity logs
    const escalations = await prisma.activityLog.findMany({
      where: {
        action: {
          contains: `organizerId:${organizerId}`
        }
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: escalations
    });

  } catch (error) {
    logger.error('Get escalation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get escalated cases for Head review
router.get('/escalated-cases', authenticate, requireDepartment(['OPERATIONS']), async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Only Head can see escalated cases
    if (userRole !== 'OPS_HEAD') {
      return res.status(403).json({
        success: false,
        message: 'Only Head can view escalated cases'
      });
    }

    // Get escalated events
    const escalatedEvents = await prisma.event.findMany({
      where: {
        escalationStatus: 'PENDING',
        escalatedTo: 'HEAD'
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        escalatedAt: 'asc'
      }
    });

    // Get escalated organizers
    const escalatedOrganizers = await prisma.user.findMany({
      where: {
        role: 'ORGANIZER',
        escalationStatus: 'PENDING',
        escalatedTo: 'HEAD'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        businessName: true,
        organizerType: true,
        verificationStatus: true,
        escalationReason: true,
        escalatedAt: true,
        escalatedBy: true,
      },
      orderBy: {
        escalatedAt: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        events: escalatedEvents,
        organizers: escalatedOrganizers,
        total: escalatedEvents.length + escalatedOrganizers.length
      }
    });

  } catch (error) {
    logger.error('Get escalated cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Head provides feedback on escalated case
router.post('/feedback', authenticate, requireDepartment(['OPERATIONS']), async (req, res) => {
  try {
    const { type, id, feedback, action } = req.body; // action: 'approve', 'reject', 'return'
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only Head can provide feedback
    if (userRole !== 'OPS_HEAD') {
      return res.status(403).json({
        success: false,
        message: 'Only Head can provide feedback'
      });
    }

    if (!feedback || feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must be at least 10 characters'
      });
    }

    if (type === 'event') {
      const event = await prisma.event.findUnique({
        where: { id },
        include: { creator: true }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      if (event.escalationStatus !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Event is not in pending escalation status'
        });
      }

      // Update event with feedback and action
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          escalationStatus: 'REVIEWED',
          escalationFeedback: feedback.trim(),
          ...(action === 'approve' && { 
            status: 'APPROVED',
            approvedBy: userId,
            approvedAt: new Date()
          }),
          ...(action === 'reject' && { 
            status: 'REJECTED',
            rejectionReason: feedback.trim()
          })
        }
      });

      // If event is approved, also approve the organizer
      if (action === 'approve' && event.creator.role === 'ORGANIZER') {
        await prisma.user.update({
          where: { id: event.createdBy },
          data: {
            verificationStatus: 'APPROVED',
            verifiedAt: new Date()
          }
        });
      }

      // Log feedback in activity log
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: `Head provided feedback on escalated event "${event.title}". Action: ${action}. Feedback: ${feedback}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: `Feedback provided successfully. Event ${action}ed.`,
        data: updatedEvent
      });

    } else if (type === 'organizer') {
      const organizer = await prisma.user.findUnique({
        where: { id }
      });

      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }

      if (organizer.escalationStatus !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Organizer is not in pending escalation status'
        });
      }

      // Update organizer with feedback and action
      const updatedOrganizer = await prisma.user.update({
        where: { id },
        data: {
          escalationStatus: 'REVIEWED',
          escalationFeedback: feedback.trim(),
          ...(action === 'approve' && { 
            verificationStatus: 'APPROVED',
            verifiedAt: new Date()
          }),
          ...(action === 'reject' && { 
            verificationStatus: 'REJECTED',
            rejectedReason: feedback.trim()
          })
        }
      });

      // Log feedback in activity log
      await prisma.activityLog.create({
        data: {
          userId: userId,
          action: `Head provided feedback on escalated organizer "${organizer.fullName}". Action: ${action}. Feedback: ${feedback}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: `Feedback provided successfully. Organizer ${action}ed.`,
        data: updatedOrganizer
      });

    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be "event" or "organizer"'
      });
    }

  } catch (error) {
    logger.error('Provide feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

