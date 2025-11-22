const express = require('express');
const { authenticate, requireHierarchicalAccess, requireDepartment } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

const router = express.Router();

// Get all tickets for department
router.get('/', authenticate, requireHierarchicalAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category, assignedTo } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      department: req.user.department
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;

    const [tickets, total] = await Promise.all([
      prisma.departmentTicket.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          },
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  role: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.departmentTicket.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get department tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Create new ticket
router.post('/', authenticate, requireHierarchicalAccess, async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'MEDIUM',
      category,
      assignedTo,
      dueDate,
      tags = [],
      attachments = []
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required',
        error: 'VALIDATION_ERROR'
      });
    }

    const ticket = await prisma.departmentTicket.create({
      data: {
        title,
        description,
        department: req.user.department,
        priority,
        category,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags,
        attachments,
        createdBy: req.user.id
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    logger.info(`Ticket created: ${ticket.id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });

  } catch (error) {
    logger.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Update ticket
router.patch('/:id', authenticate, requireHierarchicalAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      status,
      category,
      assignedTo,
      dueDate,
      tags,
      attachments
    } = req.body;

    // Check if ticket exists and user has access
    const existingTicket = await prisma.departmentTicket.findUnique({
      where: { id },
      include: { creator: true, assignee: true }
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        error: 'NOT_FOUND'
      });
    }

    // Check permissions
    const canEdit = 
      existingTicket.createdBy === req.user.id ||
      existingTicket.assignedTo === req.user.id ||
      req.user.role === 'SUPER_ADMIN' ||
      (req.user.role.includes('HEAD') && existingTicket.department === req.user.department);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (category) updateData.category = category;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags) updateData.tags = tags;
    if (attachments) updateData.attachments = attachments;

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.completedAt = new Date();
    }

    const ticket = await prisma.departmentTicket.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    logger.info(`Ticket updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });

  } catch (error) {
    logger.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Add comment to ticket
router.post('/:id/comments', authenticate, requireHierarchicalAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal = false } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
        error: 'VALIDATION_ERROR'
      });
    }

    // Check if ticket exists
    const ticket = await prisma.departmentTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        error: 'NOT_FOUND'
      });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId: req.user.id,
        content,
        isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Comment added to ticket: ${id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });

  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get ticket details
router.get('/:id', authenticate, requireHierarchicalAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.departmentTicket.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    logger.error('Get ticket details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

module.exports = router;
