const express = require('express');
const eventService = require('../services/eventService');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { validatePagination, validateSearch } = require('../middlewares/validation');
const logger = require('../config/logger');

const router = express.Router();

// DISABLED: Event review no longer needed - events auto-approved when organizer is verified
router.get('/events', authenticate, requireAdmin, validatePagination, async (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Event review endpoint disabled - events are auto-approved when organizer is verified',
  });
});

// DISABLED: Event approval no longer needed - events auto-approved when organizer is verified
router.post('/events/:eventId/approve', authenticate, requireAdmin, async (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Event approval endpoint disabled - events are auto-approved when organizer is verified',
  });
});

// Calculate event revenue
router.post('/events/:eventId/revenue', authenticate, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    const revenue = await eventService.calculateEventRevenue(eventId);

    res.status(200).json({
      success: true,
      message: 'Revenue calculated successfully',
      data: revenue,
    });
  } catch (error) {
    logger.error('Calculate event revenue error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get platform analytics
router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { prisma } = require('../config/database');
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const analytics = await prisma.platformAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Calculate totals
    const totals = analytics.reduce(
      (acc, analytic) => {
        acc.totalEvents += analytic.totalEvents;
        acc.publishedEvents += analytic.publishedEvents;
        acc.totalRegistrations += analytic.totalRegistrations;
        acc.totalRevenue += parseFloat(analytic.totalRevenue);
        acc.totalPlatformFee += parseFloat(analytic.platformFee);
        acc.totalOrganizerRevenue += parseFloat(analytic.organizerRevenue);
        return acc;
      },
      {
        totalEvents: 0,
        publishedEvents: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        totalPlatformFee: 0,
        totalOrganizerRevenue: 0,
      }
    );

    res.status(200).json({
      success: true,
      data: {
        analytics,
        totals,
      },
    });
  } catch (error) {
    logger.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform analytics',
    });
  }
});

module.exports = router;
