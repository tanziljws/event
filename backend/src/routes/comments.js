const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireDepartment } = require('../middlewares/auth')
const emailService = require('../services/emailService')

const prisma = new PrismaClient()

// Get comments for a ticket
router.get('/tickets/:ticketId/comments', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { ticketId } = req.params

    // Verify ticket exists and user has access
    const ticket = await prisma.departmentTicket.findFirst({
      where: {
        id: ticketId,
        department: 'CUSTOMER_SERVICE'
      }
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Get comments with user info
    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId: ticketId
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            userPosition: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    res.json({
      success: true,
      data: {
        comments: comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          user: {
            id: comment.user.id,
            fullName: comment.user.fullName,
            email: comment.user.email,
            role: comment.user.role,
            department: comment.user.department,
            userPosition: comment.user.userPosition
          }
        }))
      }
    })
  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    })
  }
})

// Create a new comment
router.post('/tickets/:ticketId/comments', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { ticketId } = req.params
    const { content, isInternal = false, mentions = [] } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      })
    }

    // Verify ticket exists and user has access
    const ticket = await prisma.departmentTicket.findFirst({
      where: {
        id: ticketId,
        department: 'CUSTOMER_SERVICE'
      }
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Create comment
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: ticketId,
        userId: req.user.id,
        content: content.trim(),
        isInternal: isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            userPosition: true
          }
        }
      }
    })

    // Update ticket's updatedAt timestamp
    await prisma.departmentTicket.update({
      where: {
        id: ticketId
      },
      data: {
        updatedAt: new Date()
      }
    })

    // Send email notifications
    try {
      // Get all CS team members for notifications
      const csTeam = await prisma.user.findMany({
        where: {
          department: 'CUSTOMER_SERVICE',
          role: {
            in: ['CS_HEAD', 'CS_AGENT']
          }
        },
        select: {
          email: true,
          fullName: true
        }
      })

      const recipientEmails = csTeam.map(member => member.email)

      // Send new comment notification
      await emailService.sendNewCommentNotification(
        ticket,
        {
          ...comment,
          createdAt: comment.createdAt
        },
        comment.user,
        recipientEmails
      )

      // Check for @mentions in comment content
      const mentionRegex = /@(\w+)/g
      const mentions = comment.content.match(mentionRegex)
      
      if (mentions) {
        for (const mention of mentions) {
          const mentionedName = mention.replace('@', '')
          const mentionedUser = csTeam.find(member => 
            member.fullName.toLowerCase().includes(mentionedName.toLowerCase())
          )
          
          if (mentionedUser) {
            await emailService.sendMentionNotification(
              ticket,
              {
                ...comment,
                createdAt: comment.createdAt
              },
              mentionedUser,
              comment.user
            )
          }
        }
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      data: {
        comment: {
          id: comment.id,
          content: comment.content,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          user: {
            id: comment.user.id,
            fullName: comment.user.fullName,
            email: comment.user.email,
            role: comment.user.role,
            department: comment.user.department,
            userPosition: comment.user.userPosition
          }
        }
      }
    })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create comment'
    })
  }
})

// Update a comment (only by the author)
router.put('/comments/:commentId', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { commentId } = req.params
    const { content } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      })
    }

    // Find comment and verify ownership
    const comment = await prisma.ticketComment.findFirst({
      where: {
        id: commentId,
        userId: req.user.id
      }
    })

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you do not have permission to edit it'
      })
    }

    // Update comment
    const updatedComment = await prisma.ticketComment.update({
      where: {
        id: commentId
      },
      data: {
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            userPosition: true
          }
        }
      }
    })

    res.json({
      success: true,
      data: {
        comment: {
          id: updatedComment.id,
          content: updatedComment.content,
          isInternal: updatedComment.isInternal,
          createdAt: updatedComment.createdAt,
          user: {
            id: updatedComment.user.id,
            fullName: updatedComment.user.fullName,
            email: updatedComment.user.email,
            role: updatedComment.user.role,
            department: updatedComment.user.department,
            userPosition: updatedComment.user.userPosition
          }
        }
      }
    })
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update comment'
    })
  }
})

// Delete a comment (only by the author or admin)
router.delete('/comments/:commentId', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { commentId } = req.params

    // Find comment and verify ownership or admin role
    const comment = await prisma.ticketComment.findFirst({
      where: {
        id: commentId
      },
      include: {
        user: true
      }
    })

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    // Check if user can delete (author or admin)
    const canDelete = comment.userId === req.user.id || 
                     ['SUPER_ADMIN', 'CS_HEAD'].includes(req.user.role)

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment'
      })
    }

    // Delete comment
    await prisma.ticketComment.delete({
      where: {
        id: commentId
      }
    })

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    })
  }
})

// Get users for @mentions
router.get('/users/mentions', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        department: 'CUSTOMER_SERVICE',
        role: {
          in: ['CS_HEAD', 'CS_AGENT']
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userPosition: true
      },
      orderBy: {
        fullName: 'asc'
      }
    })

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          userPosition: user.userPosition,
          displayName: `${user.fullName} (${user.userPosition})`
        }))
      }
    })
  } catch (error) {
    console.error('Get users for mentions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users for mentions'
    })
  }
})

module.exports = router
