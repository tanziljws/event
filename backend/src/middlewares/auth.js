const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Optional authentication middleware - sets req.user if token is valid, but doesn't return 401 if no token
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePicture: true,
        role: true,
        verificationStatus: true,
        emailVerified: true,
        tokenVersion: true,
        metadata: true,
      },
    });

    if (!user) {
      req.user = null;
      return next();
    }

    // Check token version
    if (user.tokenVersion !== decoded.tokenVersion) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    // Token invalid, continue without authentication
    req.user = null;
    next();
  }
};

// Authentication middleware - returns 401 for unauthorized access
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return 401 for unauthorized access
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        messageId: 'auth.unauthorized',
        statusCode: 401,
        traceID: ''
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        profilePicture: true,
        phoneNumber: true,
        address: true,
        lastEducation: true,
        role: true,
        department: true,
        userPosition: true,
        managerId: true,
        employeeId: true,
        emailVerified: true,
        verificationStatus: true,
        lastActivity: true,
        tokenVersion: true,
        organizerType: true,
        verifiedAt: true,
        rejectedReason: true,
        assignedTo: true,
        assignedAt: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        individualProfile: true,
        communityProfile: true,
        businessProfile: true,
        institutionProfile: true,
      },
    });

    if (!user) {
      // Return 404 instead of 401 for security
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }

    if (!user.emailVerified) {
      // Return 404 instead of 401 for security
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }

    // Check token version for logout invalidation
    if (decoded.tokenVersion !== user.tokenVersion) {
      // Return 404 instead of 401 for security
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }

    // Check session timeout
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MINUTES) * 60 * 1000; // Convert to milliseconds
    const now = new Date();
    const lastActivity = new Date(user.lastActivity);

    if (now - lastActivity > sessionTimeout) {
      // Return 404 instead of 401 for security
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivity: now },
    });

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    // Return 404 instead of 401 for security
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
};

// Authorization middleware for admin and staff - returns 404 for security
const requireAdmin = (req, res, next) => {
  const allowedRoles = [
    'SUPER_ADMIN',
    'CS_HEAD', 'CS_AGENT',
    'OPS_HEAD', 'OPS_AGENT',
    'FINANCE_HEAD', 'FINANCE_AGENT'
  ];
  
  if (!allowedRoles.includes(req.user.role)) {
    // Return 404 instead of 403 for security - don't reveal that admin endpoints exist
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  next();
};

// Authorization middleware for participant only - returns 404 for security
const requireParticipant = (req, res, next) => {
  // Allow PARTICIPANT, SUPER_ADMIN, and ORGANIZER (including rejected ones) to access participant endpoints
  console.log(`requireParticipant: user role = ${req.user.role}, path = ${req.path}`);
  if (req.user.role !== 'PARTICIPANT' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ORGANIZER') {
    // Return 404 instead of 403 for security - don't reveal that participant endpoints exist
    console.log(`requireParticipant: access denied for role ${req.user.role}`);
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  console.log(`requireParticipant: access granted for role ${req.user.role}`);
  next();
};

// Authorization middleware for organizer only - returns 404 for security
// Blocks access if user is in participant mode (temporary role)
const requireOrganizer = (req, res, next) => {
  // Check if user exists
  if (!req.user) {
    logger.warn('requireOrganizer: No user in request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'UNAUTHORIZED'
    });
  }

  // Check if user is in participant mode (temporary role)
  const metadata = req.user.metadata && typeof req.user.metadata === 'object' && req.user.metadata !== null ? req.user.metadata : null;
  const temporaryRole = metadata?.temporaryRole;
  
  logger.info(`requireOrganizer check - User: ${req.user.id}, Role: ${req.user.role}, TemporaryRole: ${temporaryRole}`);
  
  // If in participant mode, block organizer access
  if (temporaryRole === 'PARTICIPANT') {
    logger.warn(`requireOrganizer: User ${req.user.id} is in PARTICIPANT mode`);
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  
  if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    logger.warn(`requireOrganizer: User ${req.user.id} has role ${req.user.role}, not ORGANIZER/ADMIN`);
    // Return 404 instead of 403 for security - don't reveal that organizer endpoints exist
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  
  logger.info(`requireOrganizer: Access granted for user ${req.user.id}`);
  next();
};

// Authorization middleware for verified organizer only
// Blocks access if user is in participant mode (temporary role)
const requireVerifiedOrganizer = (req, res, next) => {
  // Check if user is in participant mode (temporary role)
  const metadata = req.user.metadata && typeof req.user.metadata === 'object' && req.user.metadata !== null ? req.user.metadata : null;
  const temporaryRole = metadata?.temporaryRole;
  
  // If in participant mode, block organizer access
  if (temporaryRole === 'PARTICIPANT') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  
  if (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }

  if (req.user.role === 'ORGANIZER' && req.user.verificationStatus !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'Organizer account not verified yet',
      error: 'NOT_VERIFIED'
    });
  }

  next();
};

// Authorization middleware for super admin only
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  next();
};

// Authorization middleware for department heads
const requireDepartmentHead = (req, res, next) => {
  const headRoles = ['SUPER_ADMIN', 'CS_HEAD', 'OPS_HEAD', 'FINANCE_HEAD'];
  if (!headRoles.includes(req.user.role)) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: 'NOT_FOUND'
    });
  }
  next();
};

// Authorization middleware for specific department
const requireDepartment = (department) => {
  return (req, res, next) => {
    const departmentRoles = {
      'CUSTOMER_SERVICE': ['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT'],
      'OPERATIONS': ['SUPER_ADMIN', 'OPS_HEAD', 'OPS_AGENT'],
      'FINANCE': ['SUPER_ADMIN', 'FINANCE_HEAD', 'FINANCE_AGENT']
    };

    if (!departmentRoles[department] || !departmentRoles[department].includes(req.user.role)) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }
    next();
  };
};

// Authorization middleware for hierarchical access (can access own department and subordinates)
const requireHierarchicalAccess = (req, res, next) => {
  const userRole = req.user.role;
  const userDepartment = req.user.department;
  
  // Super admin can access everything
  if (userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Department heads can access their department
  const headRoles = ['CS_HEAD', 'OPS_HEAD', 'FINANCE_HEAD'];
  if (headRoles.includes(userRole)) {
    return next();
  }

  // Senior agents can access their department
  const seniorRoles = ['CS_SENIOR_AGENT', 'OPS_SENIOR_AGENT', 'FINANCE_SENIOR_AGENT'];
  if (seniorRoles.includes(userRole)) {
    return next();
  }

  // Regular agents can only access their own data
  const agentRoles = ['CS_AGENT', 'OPS_AGENT', 'FINANCE_AGENT'];
  if (agentRoles.includes(userRole)) {
    return next();
  }

  return res.status(404).json({
    success: false,
    message: 'Resource not found',
    error: 'NOT_FOUND'
  });
};

// Helper function to check if user can manage another user
const canManageUser = (managerRole, managerDepartment, targetRole, targetDepartment) => {
  // Super admin can manage everyone
  if (managerRole === 'SUPER_ADMIN') return true;
  
  // Department heads can manage their department
  const headRoles = ['CS_HEAD', 'OPS_HEAD', 'FINANCE_HEAD'];
  if (headRoles.includes(managerRole) && managerDepartment === targetDepartment) return true;
  
  // Senior agents can manage agents in their department
  const seniorRoles = ['CS_SENIOR_AGENT', 'OPS_SENIOR_AGENT', 'FINANCE_SENIOR_AGENT'];
  const agentRoles = ['CS_AGENT', 'OPS_AGENT', 'FINANCE_AGENT'];
  if (seniorRoles.includes(managerRole) && 
      managerDepartment === targetDepartment && 
      agentRoles.includes(targetRole)) return true;
  
  return false;
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        lastActivity: true,
      },
    });

    if (user && user.emailVerified) {
      // Check session timeout
      const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MINUTES) * 60 * 1000;
      const now = new Date();
      const lastActivity = new Date(user.lastActivity);

      if (now - lastActivity <= sessionTimeout) {
        req.user = user;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general API endpoints
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password strength validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          error: 'NOT_FOUND'
        });
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          error: 'NOT_FOUND'
        });
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
        error: 'NOT_FOUND'
      });
    }
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  optionalAuthenticate,
  authenticate,
  requireAdmin,
  requireParticipant,
  requireOrganizer,
  requireVerifiedOrganizer,
  requireSuperAdmin,
  requireDepartmentHead,
  requireDepartment,
  requireHierarchicalAccess,
  requireRole,
  canManageUser,
  optionalAuth,
  authRateLimit,
  apiRateLimit,
  validatePasswordStrength,
  sanitizeInput
};
