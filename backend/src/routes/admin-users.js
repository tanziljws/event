const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Get all users with filtering
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            role,
            status, // 'active', 'suspended'
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        if (role) {
            where.role = role;
        }

        if (status) {
            if (status === 'suspended') {
                where.isSuspended = true;
            } else if (status === 'active') {
                where.isSuspended = false;
            }
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    isSuspended: true,
                    createdAt: true,
                    lastActivity: true,
                    organizerType: true,
                    verificationStatus: true
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// Create new user (Admin/Organizer/Participant)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { fullName, email, password, role, phoneNumber } = req.body;

        // Basic validation
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                role,
                phoneNumber,
                emailVerified: true // Admin created users are verified by default
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        logger.info(`Admin ${req.user.email} created new user ${email} with role ${role}`);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user: newUser }
        });
    } catch (error) {
        logger.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

// Update user details (role, suspension)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isSuspended, fullName, phoneNumber } = req.body;

        // Prevent modifying own account to avoid lockout
        if (id === req.user.id) {
            // Allow updating own profile info, but not role or suspension
            if (role || isSuspended !== undefined) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot modify your own role or suspension status'
                });
            }
        }

        const updateData = {};
        if (role) updateData.role = role;
        if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
        if (fullName) updateData.fullName = fullName;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isSuspended: true
            }
        });

        logger.info(`Admin ${req.user.email} updated user ${id}: ${JSON.stringify(updateData)}`);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        logger.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// Admin trigger password reset
router.patch('/:id/reset-password', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                tokenVersion: { increment: 1 } // Invalidate existing sessions
            }
        });

        logger.info(`Admin ${req.user.email} reset password for user ${id}`);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        logger.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
});

// Delete user
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Check if user has related data that prevents deletion
        // For now, we might just want to soft delete or suspend, but if hard delete is requested:
        // Prisma cascade delete will handle relations if configured, otherwise this might fail.
        // Safer to just delete.

        await prisma.user.delete({
            where: { id }
        });

        logger.info(`Admin ${req.user.email} deleted user ${id}`);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

module.exports = router;
