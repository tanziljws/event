const express = require('express');
const router = express.Router();
const smartAssignmentService = require('../services/smartAssignmentService');
const notificationService = require('../services/notificationService');
const analyticsService = require('../services/analyticsService');
const assignmentHistoryService = require('../services/assignmentHistoryService');
const advancedQueueService = require('../services/advancedQueueService');
const { authenticate } = require('../middlewares/auth');
const logger = require('../config/logger');

// Simple role check middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    next();
  };
};

// Get assignment dashboard data
router.get('/dashboard', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const dashboardData = await smartAssignmentService.getAssignmentDashboard();
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error getting assignment dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignment dashboard'
    });
  }
});

// Get agent workload details
router.get('/workload/:agentId', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const workloadDetails = await smartAssignmentService.getAgentWorkloadDetails(agentId);
    
    res.json({
      success: true,
      data: workloadDetails
    });
  } catch (error) {
    logger.error('Error getting agent workload details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get agent workload details'
    });
  }
});

// Get available agents
router.get('/agents', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const agents = await smartAssignmentService.getAvailableAgents();
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('Error getting available agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available agents'
    });
  }
});

// Manually assign item to agent
router.post('/assign', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { type, itemId, agentId, priority = 'NORMAL' } = req.body;
    
    if (!type || !itemId || !agentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, itemId, agentId'
      });
    }
    
    if (!['EVENT', 'ORGANIZER'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be EVENT or ORGANIZER'
      });
    }
    
    const result = await smartAssignmentService.reassign(type, itemId, agentId, 'Manual assignment');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error assigning item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign item'
    });
  }
});

// Process assignment queue
router.post('/queue/process', authenticate, requireRole(['OPS_HEAD']), async (req, res) => {
  try {
    const result = await smartAssignmentService.processQueue();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error processing queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process queue'
    });
  }
});

// Get queue status
router.get('/queue/status', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const queueStatus = await smartAssignmentService.getQueueStatus();
    
    res.json({
      success: true,
      data: queueStatus
    });
  } catch (error) {
    logger.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
});

// Get recent assignments
router.get('/recent', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recentAssignments = await smartAssignmentService.getRecentAssignments(parseInt(limit));
    
    res.json({
      success: true,
      data: recentAssignments
    });
  } catch (error) {
    logger.error('Error getting recent assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent assignments'
    });
  }
});

// Auto-assign item (trigger smart assignment)
router.post('/auto-assign', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { type, itemId, priority = 'NORMAL' } = req.body;
    
    if (!type || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, itemId'
      });
    }
    
    if (!['EVENT', 'ORGANIZER'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be EVENT or ORGANIZER'
      });
    }
    
    const result = await smartAssignmentService.assignToBestAgent(type, itemId, priority);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error auto-assigning item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign item'
    });
  }
});

// Get assignment strategy and rules
router.get('/strategy', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const strategy = await smartAssignmentService.getAssignmentStrategy();
    res.json({ success: true, data: strategy });
  } catch (error) {
    logger.error('Error fetching assignment strategy:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignment strategy', error: error.message });
  }
});

// Update assignment strategy
router.put('/strategy', authenticate, requireRole(['OPS_HEAD']), async (req, res) => {
  try {
    const { strategy } = req.body;
    const validStrategies = ['WORKLOAD_BASED', 'ROUND_ROBIN', 'SKILL_BASED', 'ADVANCED'];
    
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid strategy. Must be one of: ' + validStrategies.join(', ') 
      });
    }

    const result = await smartAssignmentService.setAssignmentStrategy(strategy);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error updating assignment strategy:', error);
    res.status(500).json({ success: false, message: 'Failed to update assignment strategy', error: error.message });
  }
});

// Test assignment scoring for a specific item
router.post('/test-scoring', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { type, itemId, priority = 'NORMAL' } = req.body;
    
    if (!type || !itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and itemId are required' 
      });
    }

    const scores = await smartAssignmentService.testAssignmentScoring(type, itemId, priority);
    res.json({ success: true, data: scores });
  } catch (error) {
    logger.error('Error testing assignment scoring:', error);
    res.status(500).json({ success: false, message: 'Failed to test assignment scoring', error: error.message });
  }
});

// Get notification service stats
router.get('/notifications/stats', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']), async (req, res) => {
  try {
    const stats = notificationService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting notification stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get notification stats', error: error.message });
  }
});

// Get agent performance analytics
router.get('/analytics/agent/:agentId', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { timeRange = '7d' } = req.query;
    
    const metrics = await analyticsService.getAgentPerformanceMetrics(agentId, timeRange);
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Error getting agent performance metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to get agent performance metrics', error: error.message });
  }
});

// Get all agents performance comparison
router.get('/analytics/agents', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const performance = await analyticsService.getAllAgentsPerformance(timeRange);
    res.json({ success: true, data: performance });
  } catch (error) {
    logger.error('Error getting all agents performance:', error);
    res.status(500).json({ success: false, message: 'Failed to get all agents performance', error: error.message });
  }
});

// Get analytics dashboard data
router.get('/analytics/dashboard', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    
    const [agentsPerformance, assignmentData] = await Promise.all([
      analyticsService.getAllAgentsPerformance(timeRange),
      smartAssignmentService.getAssignmentDashboard()
    ]);
    
    const dashboardData = {
      timeRange,
      agentsPerformance: agentsPerformance.summary,
      topPerformers: agentsPerformance.agents.slice(0, 3),
      assignmentOverview: {
        totalCapacity: assignmentData.totalCapacity,
        totalWorkload: assignmentData.totalWorkload,
        utilizationRate: assignmentData.utilizationRate
      },
      queueStatus: assignmentData.queueStatus
    };
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    logger.error('Error getting analytics dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics dashboard', error: error.message });
  }
});

// Manual reassignment
router.post('/reassign', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { type, itemId, newAgentId, reason = 'Manual reassignment' } = req.body;
    
    if (!type || !itemId || !newAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, itemId, newAgentId'
      });
    }
    
    if (!['EVENT', 'ORGANIZER'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be EVENT or ORGANIZER'
      });
    }
    
    const result = await smartAssignmentService.reassign(type, itemId, newAgentId, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error reassigning item:', error);
    res.status(500).json({ success: false, message: 'Failed to reassign item', error: error.message });
  }
});

// Auto-reassignment for load balancing
router.post('/reassign/auto-load-balancing', authenticate, requireRole(['OPS_HEAD']), async (req, res) => {
  try {
    const result = await smartAssignmentService.autoReassignForLoadBalancing();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in auto load balancing reassignment:', error);
    res.status(500).json({ success: false, message: 'Failed to perform auto load balancing', error: error.message });
  }
});

// Performance-based reassignment
router.post('/reassign/performance-based', authenticate, requireRole(['OPS_HEAD']), async (req, res) => {
  try {
    const result = await smartAssignmentService.reassignForPerformance();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error in performance-based reassignment:', error);
    res.status(500).json({ success: false, message: 'Failed to perform performance-based reassignment', error: error.message });
  }
});

// Get reassignable assignments for an agent
router.get('/reassign/agent/:agentId/reassignable', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const reassignableAssignments = await smartAssignmentService.getReassignableAssignments(agentId);
    
    res.json({ success: true, data: reassignableAssignments });
  } catch (error) {
    logger.error('Error getting reassignable assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to get reassignable assignments', error: error.message });
  }
});

// Get reassignment history
router.get('/reassign/history', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { agentId, limit = 50 } = req.query;
    const history = await assignmentHistoryService.getReassignmentHistory(agentId, parseInt(limit));
    
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error getting reassignment history:', error);
    res.status(500).json({ success: false, message: 'Failed to get reassignment history', error: error.message });
  }
});

// Get assignment history for an item
router.get('/history/item/:itemType/:itemId', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    if (!['EVENT', 'ORGANIZER'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid itemType. Must be EVENT or ORGANIZER'
      });
    }
    
    const history = await assignmentHistoryService.getItemHistory(itemType, itemId, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error getting item history:', error);
    res.status(500).json({ success: false, message: 'Failed to get item history', error: error.message });
  }
});

// Get agent assignment history
router.get('/history/agent/:agentId', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const history = await assignmentHistoryService.getAgentHistory(agentId, parseInt(limit), parseInt(offset));
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error getting agent history:', error);
    res.status(500).json({ success: false, message: 'Failed to get agent history', error: error.message });
  }
});

// Get assignment statistics
router.get('/history/statistics', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const { timeRange = '7d', agentId } = req.query;
    
    const statistics = await assignmentHistoryService.getAssignmentStatistics(timeRange, agentId);
    res.json({ success: true, data: statistics });
  } catch (error) {
    logger.error('Error getting assignment statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get assignment statistics', error: error.message });
  }
});

// Search assignment history
router.post('/history/search', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT']), async (req, res) => {
  try {
    const searchParams = req.body;
    
    const results = await assignmentHistoryService.searchHistory(searchParams);
    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Error searching assignment history:', error);
    res.status(500).json({ success: false, message: 'Failed to search assignment history', error: error.message });
  }
});

// Get advanced queue analytics
router.get('/queue/analytics', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']), async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const analytics = await advancedQueueService.getQueueAnalytics(timeRange);
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('Error getting queue analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to get queue analytics', error: error.message });
  }
});

// Get queue health status
router.get('/queue/health', authenticate, requireRole(['OPS_HEAD', 'OPS_SENIOR_AGENT', 'OPS_AGENT']), async (req, res) => {
  try {
    const healthStatus = await advancedQueueService.getQueueHealthStatus();
    res.json({ success: true, data: healthStatus });
  } catch (error) {
    logger.error('Error getting queue health status:', error);
    res.status(500).json({ success: false, message: 'Failed to get queue health status', error: error.message });
  }
});

// Auto-escalate SLA violations

module.exports = router;