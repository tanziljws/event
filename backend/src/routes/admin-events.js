const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Delete event (Admin Override)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if event exists
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                creator: {
                    select: { email: true }
                }
            }
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Delete event (cascade delete should handle related records like tickets, registrations)
        await prisma.event.delete({
            where: { id }
        });

        logger.info(`Admin ${req.user.email} deleted event ${id} created by ${event.creator.email}`);

        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message
        });
    }
});

// Force update event status (e.g. Suspend/Reject)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, isPublished, rejectionReason } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (isPublished !== undefined) updateData.isPublished = isPublished;
        if (rejectionReason) updateData.rejectionReason = rejectionReason;

        const event = await prisma.event.update({
            where: { id },
            data: updateData
        });

        logger.info(`Admin ${req.user.email} updated status for event ${id}: ${JSON.stringify(updateData)}`);

        res.json({
            success: true,
            message: 'Event status updated successfully',
            data: { event }
        });
    } catch (error) {
        logger.error('Error updating event status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update event status',
            error: error.message
        });
    }
});

module.exports = router;
