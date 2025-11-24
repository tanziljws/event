const express = require('express');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Get all settings
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const settings = await prisma.settings.findMany();

        // Convert array to object for easier frontend consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json({
            success: true,
            data: settingsMap
        });
    } catch (error) {
        logger.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            error: error.message
        });
    }
});

// Update settings (Bulk or Single)
router.put('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const settings = req.body; // Expecting object { key: value, key2: value2 }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings format'
            });
        }

        const updates = [];
        for (const [key, value] of Object.entries(settings)) {
            updates.push(
                prisma.settings.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value }
                })
            );
        }

        await prisma.$transaction(updates);

        logger.info(`Admin ${req.user.email} updated settings: ${Object.keys(settings).join(', ')}`);

        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        logger.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

module.exports = router;
