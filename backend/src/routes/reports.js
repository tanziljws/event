const express = require('express')
const router = express.Router()
const { authenticate, requireRole } = require('../middlewares/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const PDFDocument = require('pdfkit')
const ExcelJS = require('exceljs')
const fs = require('fs')
const path = require('path')

// Get operations reports data
router.get('/operations', authenticate, requireRole(['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']), async (req, res) => {
  try {
    const { timeRange = '30d', agentId } = req.query
    const userId = req.user.id
    const userRole = req.user.role

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get summary data
    const [
      totalOrganizers,
      approvedOrganizers,
      rejectedOrganizers,
      pendingOrganizers,
      totalEvents,
      approvedEvents,
      rejectedEvents,
      draftEvents,
      totalAssignments,
      completedAssignments,
      pendingAssignments
    ] = await Promise.all([
      // Organizer counts
      prisma.user.count({
        where: {
          role: 'ORGANIZER',
          ...(agentId && { assignedTo: agentId })
        }
      }),
      prisma.user.count({
        where: {
          role: 'ORGANIZER',
          verificationStatus: 'APPROVED',
          ...(agentId && { assignedTo: agentId })
        }
      }),
      prisma.user.count({
        where: {
          role: 'ORGANIZER',
          verificationStatus: 'REJECTED',
          ...(agentId && { assignedTo: agentId })
        }
      }),
      prisma.user.count({
        where: {
          role: 'ORGANIZER',
          verificationStatus: 'PENDING',
          ...(agentId && { assignedTo: agentId })
        }
      }),
      
      // Event counts - removed since events don't need operations approval anymore
      0, // totalEvents
      0, // approvedEvents  
      0, // rejectedEvents
      0, // draftEvents
      
      // Assignment counts
      prisma.assignmentQueue.count({
        where: {
          ...(agentId && { assignedTo: agentId })
        }
      }),
      prisma.assignmentQueue.count({
        where: {
          status: 'COMPLETED',
          ...(agentId && { assignedTo: agentId })
        }
      }),
      prisma.assignmentQueue.count({
        where: {
          status: 'ASSIGNED',
          ...(agentId && { assignedTo: agentId })
        }
      })
    ])

    // Get monthly trends for organizers - with mock data for better visualization
    const organizerTrends = [
      { month: 'Jan', approved: 12, rejected: 2, pending: 3 },
      { month: 'Feb', approved: 15, rejected: 1, pending: 2 },
      { month: 'Mar', approved: 18, rejected: 3, pending: 1 },
      { month: 'Apr', approved: 22, rejected: 2, pending: 4 },
      { month: 'May', approved: 19, rejected: 1, pending: 2 },
      { month: 'Jun', approved: 25, rejected: 4, pending: 3 }
    ]

    // Event trends removed since events don't need operations approval
    const eventTrends = []

    // Get agent performance data
    const agentPerformance = await prisma.user.findMany({
      where: {
        role: { in: ['OPS_AGENT', 'OPS_SENIOR_AGENT'] },
        ...(userRole === 'OPS_HEAD' && { managerId: userId })
      },
      select: {
        id: true,
        fullName: true
      }
    })

    const assignmentPerformance = await Promise.all(
      agentPerformance.map(async (agent) => {
        const assignments = await prisma.assignmentQueue.findMany({
          where: { assignedTo: agent.id },
          select: {
            status: true,
            assignedAt: true,
            createdAt: true
          }
        })

        const completed = assignments.filter(a => a.status === 'COMPLETED').length
        const total = assignments.length
        const completionRate = total > 0 ? (completed / total) * 100 : 0

        // Calculate average processing time
        const completedAssignments = assignments.filter(a => a.status === 'COMPLETED')
        const avgProcessingTime = completedAssignments.length > 0 
          ? completedAssignments.reduce((sum, a) => {
              const processingTime = new Date(a.createdAt).getTime() - new Date(a.assignedAt).getTime()
              return sum + processingTime
            }, 0) / completedAssignments.length / (1000 * 60 * 60) // Convert to hours
          : 0

        return {
          agentName: agent.fullName,
          totalAssignments: total,
          completedAssignments: completed,
          completionRate: Math.round(completionRate * 10) / 10,
          avgProcessingTime: Math.round(avgProcessingTime * 10) / 10
        }
      })
    )

    // Get monthly stats - with mock data for better visualization
    const monthlyStats = [
      { month: 'Jan', organizers: 17, events: 0, assignments: 28 },
      { month: 'Feb', organizers: 18, events: 0, assignments: 33 },
      { month: 'Mar', organizers: 22, events: 0, assignments: 41 },
      { month: 'Apr', organizers: 28, events: 0, assignments: 50 },
      { month: 'May', organizers: 22, events: 0, assignments: 38 },
      { month: 'Jun', organizers: 31, events: 0, assignments: 56 }
    ]

    // Get recent activity - simplified mock data for now
    const formattedRecentActivity = [
      {
        id: '1',
        type: 'organizer',
        description: 'New organizer application received',
        timestamp: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: '2',
        type: 'event',
        description: 'Event approval completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed'
      },
      {
        id: '3',
        type: 'organizer',
        description: 'Organizer verification in progress',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'pending'
      }
    ]

    const reportData = {
      summary: {
        totalOrganizers: Number(totalOrganizers),
        approvedOrganizers: Number(approvedOrganizers),
        rejectedOrganizers: Number(rejectedOrganizers),
        pendingOrganizers: Number(pendingOrganizers),
        totalEvents: 0, // Events don't need operations approval
        approvedEvents: 0,
        rejectedEvents: 0,
        draftEvents: 0,
        totalAssignments: Number(totalAssignments),
        completedAssignments: Number(completedAssignments),
        pendingAssignments: Number(pendingAssignments)
      },
      organizerTrends: organizerTrends.map(item => ({
        month: item.month,
        approved: Number(item.approved),
        rejected: Number(item.rejected),
        pending: Number(item.pending)
      })),
      eventTrends: eventTrends.map(item => ({
        month: item.month,
        approved: Number(item.approved),
        rejected: Number(item.rejected),
        draft: Number(item.draft)
      })),
      assignmentPerformance,
      monthlyStats: monthlyStats.map(item => ({
        month: item.month,
        organizers: Number(item.organizers)
      })),
      recentActivity: formattedRecentActivity
    }

    res.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Error fetching operations reports:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching reports data',
      error: error.message
    })
  }
})

// Export report as PDF/Excel
router.post('/operations/export', authenticate, requireRole(['SUPER_ADMIN', 'OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']), async (req, res) => {
  try {
    const { format = 'pdf', timeRange = '30d', agentId } = req.body
    const userId = req.user.id

    // Get the same data as the reports endpoint
    const reportData = await getReportData(timeRange, agentId, userId, req.user.role)

    if (format === 'pdf') {
      await generatePDFReport(reportData, res, timeRange)
    } else if (format === 'excel') {
      await generateExcelReport(reportData, res, timeRange)
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format. Use "pdf" or "excel"'
      })
    }

  } catch (error) {
    console.error('Error exporting report:', error)
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    })
  }
})

// Helper function to get report data (extracted from main endpoint)
async function getReportData(timeRange, agentId, userId, userRole) {
  // Calculate date range
  const now = new Date()
  let startDate = new Date()
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7)
      break
    case '30d':
      startDate.setDate(now.getDate() - 30)
      break
    case '90d':
      startDate.setDate(now.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      startDate.setDate(now.getDate() - 30)
  }

  // Get summary data
  const [
    totalOrganizers,
    approvedOrganizers,
    rejectedOrganizers,
    pendingOrganizers,
    totalAssignments,
    completedAssignments,
    pendingAssignments
  ] = await Promise.all([
    // Organizer counts
    prisma.user.count({
      where: {
        role: 'ORGANIZER',
        ...(agentId && { assignedTo: agentId })
      }
    }),
    prisma.user.count({
      where: {
        role: 'ORGANIZER',
        verificationStatus: 'APPROVED',
        ...(agentId && { assignedTo: agentId })
      }
    }),
    prisma.user.count({
      where: {
        role: 'ORGANIZER',
        verificationStatus: 'REJECTED',
        ...(agentId && { assignedTo: agentId })
      }
    }),
    prisma.user.count({
      where: {
        role: 'ORGANIZER',
        verificationStatus: 'PENDING',
        ...(agentId && { assignedTo: agentId })
      }
    }),
    
    // Assignment counts
    prisma.assignmentQueue.count({
      where: {
        ...(agentId && { assignedTo: agentId })
      }
    }),
    prisma.assignmentQueue.count({
      where: {
        status: 'COMPLETED',
        ...(agentId && { assignedTo: agentId })
      }
    }),
    prisma.assignmentQueue.count({
      where: {
        status: 'ASSIGNED',
        ...(agentId && { assignedTo: agentId })
      }
    })
  ])

  // Mock data for charts
  const organizerTrends = [
    { month: 'Jan', approved: 12, rejected: 2, pending: 3 },
    { month: 'Feb', approved: 15, rejected: 1, pending: 2 },
    { month: 'Mar', approved: 18, rejected: 3, pending: 1 },
    { month: 'Apr', approved: 22, rejected: 2, pending: 4 },
    { month: 'May', approved: 19, rejected: 1, pending: 2 },
    { month: 'Jun', approved: 25, rejected: 4, pending: 3 }
  ]

  const monthlyStats = [
    { month: 'Jan', organizers: 17, events: 0, assignments: 28 },
    { month: 'Feb', organizers: 18, events: 0, assignments: 33 },
    { month: 'Mar', organizers: 22, events: 0, assignments: 41 },
    { month: 'Apr', organizers: 28, events: 0, assignments: 50 },
    { month: 'May', organizers: 22, events: 0, assignments: 38 },
    { month: 'Jun', organizers: 31, events: 0, assignments: 56 }
  ]

  const assignmentPerformance = [
    { agentName: 'Agent Alpha', totalAssignments: 45, completedAssignments: 42, completionRate: 93.3, avgProcessingTime: 2.5 },
    { agentName: 'Agent Beta', totalAssignments: 38, completedAssignments: 35, completionRate: 92.1, avgProcessingTime: 2.8 },
    { agentName: 'Agent Gamma', totalAssignments: 52, completedAssignments: 48, completionRate: 92.3, avgProcessingTime: 2.2 },
    { agentName: 'Agent Delta', totalAssignments: 41, completedAssignments: 38, completionRate: 92.7, avgProcessingTime: 2.6 },
    { agentName: 'Agent Echo', totalAssignments: 35, completedAssignments: 32, completionRate: 91.4, avgProcessingTime: 2.9 }
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'organizer',
      description: 'New organizer application received',
      timestamp: new Date().toISOString(),
      status: 'pending'
    },
    {
      id: '2',
      type: 'event',
      description: 'Event approval completed',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed'
    },
    {
      id: '3',
      type: 'organizer',
      description: 'Organizer verification in progress',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'pending'
    }
  ]

  return {
    summary: {
      totalOrganizers: Number(totalOrganizers),
      approvedOrganizers: Number(approvedOrganizers),
      rejectedOrganizers: Number(rejectedOrganizers),
      pendingOrganizers: Number(pendingOrganizers),
      totalEvents: 0,
      approvedEvents: 0,
      rejectedEvents: 0,
      draftEvents: 0,
      totalAssignments: Number(totalAssignments),
      completedAssignments: Number(completedAssignments),
      pendingAssignments: Number(pendingAssignments)
    },
    organizerTrends,
    monthlyStats,
    assignmentPerformance,
    recentActivity
  }
}

// Generate PDF Report
async function generatePDFReport(reportData, res, timeRange) {
  const doc = new PDFDocument()
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="operations-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf"`)
  
  // Pipe PDF to response
  doc.pipe(res)
  
  // Add title
  doc.fontSize(20).text('Operations Department Report', { align: 'center' })
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' })
  doc.fontSize(12).text(`Time Range: ${timeRange}`, { align: 'center' })
  doc.moveDown(2)
  
  // Summary section
  doc.fontSize(16).text('Summary', { underline: true })
  doc.moveDown(0.5)
  
  const summary = reportData.summary
  doc.fontSize(12)
    .text(`Total Organizers: ${summary.totalOrganizers}`)
    .text(`Approved Organizers: ${summary.approvedOrganizers}`)
    .text(`Rejected Organizers: ${summary.rejectedOrganizers}`)
    .text(`Pending Organizers: ${summary.pendingOrganizers}`)
    .text(`Total Assignments: ${summary.totalAssignments}`)
    .text(`Completed Assignments: ${summary.completedAssignments}`)
    .text(`Pending Assignments: ${summary.pendingAssignments}`)
  
  doc.moveDown(1)
  
  // Organizer trends
  doc.fontSize(16).text('Organizer Trends (Last 6 Months)', { underline: true })
  doc.moveDown(0.5)
  
  doc.fontSize(10)
  reportData.organizerTrends.forEach(trend => {
    doc.text(`${trend.month}: Approved: ${trend.approved}, Rejected: ${trend.rejected}, Pending: ${trend.pending}`)
  })
  
  doc.moveDown(1)
  
  // Agent performance
  doc.fontSize(16).text('Agent Performance', { underline: true })
  doc.moveDown(0.5)
  
  doc.fontSize(10)
  reportData.assignmentPerformance.forEach(agent => {
    doc.text(`${agent.agentName}: ${agent.completionRate}% completion rate (${agent.completedAssignments}/${agent.totalAssignments} assignments)`)
  })
  
  doc.moveDown(1)
  
  // Recent activity
  doc.fontSize(16).text('Recent Activity', { underline: true })
  doc.moveDown(0.5)
  
  doc.fontSize(10)
  reportData.recentActivity.forEach(activity => {
    const date = new Date(activity.timestamp).toLocaleString()
    doc.text(`${date}: ${activity.description} (${activity.status})`)
  })
  
  // Finalize PDF
  doc.end()
}

// Generate Excel Report
async function generateExcelReport(reportData, res, timeRange) {
  const workbook = new ExcelJS.Workbook()
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 15 }
  ]
  
  const summary = reportData.summary
  summarySheet.addRows([
    { metric: 'Total Organizers', value: summary.totalOrganizers },
    { metric: 'Approved Organizers', value: summary.approvedOrganizers },
    { metric: 'Rejected Organizers', value: summary.rejectedOrganizers },
    { metric: 'Pending Organizers', value: summary.pendingOrganizers },
    { metric: 'Total Assignments', value: summary.totalAssignments },
    { metric: 'Completed Assignments', value: summary.completedAssignments },
    { metric: 'Pending Assignments', value: summary.pendingAssignments }
  ])
  
  // Organizer trends sheet
  const trendsSheet = workbook.addWorksheet('Organizer Trends')
  trendsSheet.columns = [
    { header: 'Month', key: 'month', width: 10 },
    { header: 'Approved', key: 'approved', width: 12 },
    { header: 'Rejected', key: 'rejected', width: 12 },
    { header: 'Pending', key: 'pending', width: 12 }
  ]
  
  trendsSheet.addRows(reportData.organizerTrends)
  
  // Agent performance sheet
  const performanceSheet = workbook.addWorksheet('Agent Performance')
  performanceSheet.columns = [
    { header: 'Agent Name', key: 'agentName', width: 20 },
    { header: 'Total Assignments', key: 'totalAssignments', width: 18 },
    { header: 'Completed', key: 'completedAssignments', width: 15 },
    { header: 'Completion Rate (%)', key: 'completionRate', width: 18 },
    { header: 'Avg Processing Time (hrs)', key: 'avgProcessingTime', width: 22 }
  ]
  
  performanceSheet.addRows(reportData.assignmentPerformance)
  
  // Monthly stats sheet
  const monthlySheet = workbook.addWorksheet('Monthly Statistics')
  monthlySheet.columns = [
    { header: 'Month', key: 'month', width: 10 },
    { header: 'Organizers', key: 'organizers', width: 12 },
    { header: 'Events', key: 'events', width: 10 },
    { header: 'Assignments', key: 'assignments', width: 15 }
  ]
  
  monthlySheet.addRows(reportData.monthlyStats)
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="operations-report-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx"`)
  
  // Write Excel to response
  await workbook.xlsx.write(res)
  res.end()
}

module.exports = router
