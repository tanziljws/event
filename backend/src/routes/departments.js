const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, requireHierarchicalAccess, requireDepartment, requireSuperAdmin } = require('../middlewares/auth');
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const emailService = require('../services/emailService');

const router = express.Router();

// Helper function to validate role department mapping
const isValidRoleForDepartment = (role, department) => {
  // CS roles only for CUSTOMER_SERVICE
  if (role.startsWith('CS_') && department === 'CUSTOMER_SERVICE') return true;
  
  // OPS roles only for Operations
  if (role.startsWith('OPS_') && department === 'Operations') return true;
  
  // FINANCE roles for both FINANCE A and FIANNACE A
  if (role.startsWith('FINANCE_') && (department === 'FINANCE A' || department === 'FIANNACE A')) return true;
  
  // MARKETING roles for Marketing & Communications
  if (role.startsWith('MARKETING_') && department === 'Marketing & Communications') return true;
  
  // QA roles for Quality Assurance
  if (role.startsWith('QA_') && department === 'Quality Assurance') return true;
  
  // IT roles for IT Support
  if (role.startsWith('IT_') && department === 'IT Support') return true;
  
  // HR roles for HUMAN_RESOURCES
  if (role.startsWith('CS_') && department === 'HUMAN_RESOURCES') return true; // Use CS roles for HR for now
  
  return false;
};

// Create ticket from contact form (public endpoint - no auth required)
router.post('/tickets', async (req, res) => {
  try {
    const { title, description, priority, category, createdBy, source } = req.body;

    // Validate required fields
    if (!title || !description || !priority || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, priority, category'
      });
    }

    // Map category to valid enum values
    const categoryMapping = {
      'TECHNICAL': 'TECHNICAL_ISSUE',
      'TECHNICAL_ISSUE': 'TECHNICAL_ISSUE',
      'BILLING': 'PAYMENT_ISSUE',
      'PAYMENT_ISSUE': 'PAYMENT_ISSUE',
      'FEATURE_REQUEST': 'GENERAL_INQUIRY',
      'CUSTOMER_SUPPORT': 'CUSTOMER_SUPPORT',
      'EVENT_MANAGEMENT': 'EVENT_MANAGEMENT',
      'ORGANIZER_SUPPORT': 'ORGANIZER_SUPPORT',
      'FINANCE_QUERY': 'FINANCE_QUERY',
      'GENERAL_INQUIRY': 'GENERAL_INQUIRY',
      'MARKETING_INQUIRY': 'MARKETING_INQUIRY'
    };

    const mappedCategory = categoryMapping[category.toUpperCase()] || 'GENERAL_INQUIRY';

    // Create ticket
    const ticket = await prisma.departmentTicket.create({
      data: {
        title,
        description,
        priority: priority.toUpperCase(),
        category: mappedCategory,
        status: 'OPEN',
        createdBy: createdBy || 'contact-form-user-id-12345',
        department: 'CUSTOMER_SERVICE',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      }
    });

    // Auto-assign ticket based on category (internal logic)
    try {
      logger.info(`Starting auto-assignment for ticket ${ticket.id} with category ${mappedCategory}`);
      
      // Get team configurations from database
      const teamConfigs = await prisma.$queryRaw`
        SELECT team_id, team_name, description, categories, is_active
        FROM team_configurations 
        WHERE is_active = true
        ORDER BY created_at ASC
      `;
      
      logger.info(`Found ${teamConfigs.length} team configurations`);
      
      // Find the appropriate team for this category
      let assignedTeam = null;
      for (const config of teamConfigs) {
        logger.info(`Checking team ${config.team_id} with categories: ${JSON.stringify(config.categories)}`);
        if (config.categories && config.categories.includes(mappedCategory)) {
          assignedTeam = {
            id: config.team_id,
            name: config.team_name,
            description: config.description,
            categories: config.categories,
            isActive: config.is_active
          };
          logger.info(`Found matching team: ${assignedTeam.name}`);
          break;
        }
      }

      if (assignedTeam) {
        // Get available members for this team
        const availableMembers = await prisma.user.findMany({
          where: {
            department: 'CUSTOMER_SERVICE',
            role: {
              in: ['CS_HEAD', 'CS_AGENT']
            }
          },
          select: {
            id: true,
            fullName: true,
            role: true
          }
        });

        if (availableMembers.length > 0) {
          // Simple round-robin assignment
          const randomMember = availableMembers[Math.floor(Math.random() * availableMembers.length)];

          // Update ticket assignment
          const updatedTicket = await prisma.departmentTicket.update({
            where: { id: ticket.id },
            data: {
              assignedTo: randomMember.id,
              updatedAt: new Date()
            }
          });

          logger.info(`Ticket ${ticket.id} auto-assigned to team ${assignedTeam.name} and member ${randomMember.fullName}`);
          
          // Return the updated ticket with assignment
          logger.info(`New ticket created from contact form: ${ticket.id}`);
          return res.status(201).json({
            success: true,
            message: 'Ticket created successfully',
            data: updatedTicket
          });
        }
      }
    } catch (assignError) {
      logger.error('Auto-assignment failed:', assignError);
      // Don't fail ticket creation if auto-assignment fails
    }

    logger.info(`New ticket created from contact form: ${ticket.id}`);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
    logger.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error.message
    });
  }
});

// Test endpoint
router.get('/test', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Department API is working',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department
    }
  });
});

// Get department structure
router.get('/structure', authenticate, requireHierarchicalAccess, async (req, res) => {
  try {
    // Get all departments from departments table
    const allDepartments = await prisma.organizationDepartment.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        headId: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('🔍 All departments from DB:', allDepartments.map(d => d.name));

    // Get all users with department roles
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'CS_HEAD', 'CS_AGENT', 
               'OPS_HEAD', 'OPS_AGENT',
               'FINANCE_HEAD', 'FINANCE_AGENT']
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        managerId: true,
        employeeId: true,
        createdAt: true
      },
      orderBy: [
        { department: 'asc' },
        { userPosition: 'asc' },
        { fullName: 'asc' }
      ]
    });

    // Create dynamic structure based on departments in database
    const structure = {};
    
    allDepartments.forEach(dept => {
      const deptName = dept.name.toUpperCase().replace(/\s+/g, '_');
      structure[deptName] = {
        head: null,
        agents: []
      };
    });
    
    console.log('🔍 Structure keys:', Object.keys(structure));

    // Create mapping from Prisma enum to structure keys
    const departmentMapping = {
      'FINANCE': 'FIANNACE_A',  // Map FINANCE enum to FIANNACE_A structure key
      'CUSTOMER_SERVICE': 'CUSTOMER_SERVICE',
      'OPERATIONS': 'OPERATIONS'
    };

    // Organize users by department
    users.forEach(user => {
      if (user.department && departmentMapping[user.department]) {
        const structureKey = departmentMapping[user.department];
        if (structure[structureKey]) {
          if (user.role.includes('_HEAD')) {
            structure[structureKey].head = user;
          } else if (user.role.includes('_AGENT')) {
            structure[structureKey].agents.push(user);
          }
        }
      }
      
      // Special handling for HR users (they have CUSTOMER_SERVICE department but should appear in HUMAN_RESOURCES)
      if (user.department === 'CUSTOMER_SERVICE' && user.employeeId && user.employeeId.startsWith('HR')) {
        if (structure['HUMAN_RESOURCES']) {
          if (user.role.includes('_HEAD')) {
            structure['HUMAN_RESOURCES'].head = user;
          } else if (user.role.includes('_AGENT')) {
            structure['HUMAN_RESOURCES'].agents.push(user);
          }
        }
      }
    });

    res.json({
      success: true,
      data: structure
    });

  } catch (error) {
    logger.error('Get department structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department structure',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get department members
router.get('/:department/members', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { department } = req.params;
    
    const members = await prisma.user.findMany({
      where: {
        department: department.toUpperCase()
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        userPosition: true,
        managerId: true,
        employeeId: true,
        createdAt: true,
        lastActivity: true
      },
      orderBy: [
        { userPosition: 'asc' },
        { fullName: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: members
    });

  } catch (error) {
    logger.error('Get department members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department members',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get department statistics
router.get('/:department/stats', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { department } = req.params;
    
    const [
      totalMembers,
      activeMembers,
      totalTickets,
      openTickets,
      completedTickets
    ] = await Promise.all([
      prisma.user.count({
        where: { department: department.toUpperCase() }
      }),
      prisma.user.count({
        where: { 
          department: department.toUpperCase(),
          lastActivity: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.departmentTicket.count({
        where: { department: department.toUpperCase() }
      }),
      prisma.departmentTicket.count({
        where: { 
          department: department.toUpperCase(),
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      }),
      prisma.departmentTicket.count({
        where: { 
          department: department.toUpperCase(),
          status: 'RESOLVED'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        totalTickets,
        openTickets,
        completedTickets,
        completionRate: totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0
      }
    });

  } catch (error) {
    logger.error('Get department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Add new department member (Super Admin only)
router.post('/:department/members', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { department } = req.params;
    const { userId, role, userPosition, managerId } = req.body;

    console.log('🔍 DEBUG: Add member request:', { department, userId, role, userPosition });

    // Validate required fields
    if (!userId || !role || !userPosition) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, role, userPosition'
      });
    }

    // Validate department - get from database
    console.log('🔍 DEBUG: Getting departments from database...');
    let validDepartments;
    try {
      const existingDepartments = await prisma.$queryRaw`
        SELECT name FROM departments WHERE is_active = true
      `;
      console.log('🔍 DEBUG: Existing departments:', existingDepartments);
      validDepartments = existingDepartments.map(d => d.name);
      console.log('🔍 DEBUG: Valid departments:', validDepartments);
    } catch (dbError) {
      console.log('🔍 DEBUG: Database error:', dbError);
      throw dbError;
    }
    
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department. Valid departments: ${validDepartments.join(', ')}`
      });
    }

    // Validate role matches department
    console.log('🔍 DEBUG: Validating role for department...');
    if (!isValidRoleForDepartment(role, department)) {
      console.log('🔍 DEBUG: Role validation failed');
      return res.status(400).json({
        success: false,
        message: `Role ${role} is not valid for department ${department}. Please select a role that matches the department.`
      });
    }
    console.log('🔍 DEBUG: Role validation passed');

    // Check if user exists
    console.log('🔍 DEBUG: Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, department: true }
    });
    console.log('🔍 DEBUG: User found:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already in a department
    if (user.department && user.department !== 'PARTICIPANT') {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to a department'
      });
    }

    // Generate employee ID
    const employeeId = `${department.toUpperCase()}-${Date.now()}`;
    console.log('🔍 DEBUG: Generated employee ID:', employeeId);

    // Update user
    console.log('🔍 DEBUG: Updating user...');
    
    // Map department names to Prisma enum values
    const departmentMap = {
      'CUSTOMER_SERVICE': 'CUSTOMER_SERVICE',
      'FIANNACE A': 'FINANCE',  // Map FIANNACE A to FINANCE enum
      'FINANCE A': 'FINANCE',
      'OPERATIONS': 'OPERATIONS',
      'HUMAN_RESOURCES': 'CUSTOMER_SERVICE'  // Map HUMAN_RESOURCES to CUSTOMER_SERVICE enum for now
    };
    
    // Map user positions to Prisma enum values (only HEAD and AGENT, no SENIOR_AGENT)
    const positionMap = {
      'Head of Finance': 'HEAD',
      'Head of Customer Service': 'HEAD',
      'Head of Operations': 'HEAD',
      'Head of Human Resources': 'HEAD',
      'Finance Staff': 'AGENT',
      'Customer Service Staff': 'AGENT',
      'Operations Staff': 'AGENT',
      'HR Staff': 'AGENT'
    };
    
    const prismaDepartment = departmentMap[department] || 'CUSTOMER_SERVICE';
    const prismaPosition = positionMap[userPosition] || 'AGENT';
    
    console.log('🔍 DEBUG: Mapped values:', {
      originalDepartment: department,
      prismaDepartment,
      originalPosition: userPosition,
      prismaPosition,
      role
    });
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        department: prismaDepartment,
        userPosition: prismaPosition,
        managerId: managerId || null,
        employeeId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        managerId: true,
        employeeId: true
      }
    });
    console.log('🔍 DEBUG: User updated successfully:', updatedUser);

    res.status(201).json({
      success: true,
      message: 'Member added to department successfully',
      data: updatedUser
    });

  } catch (error) {
    console.log('🔍 DEBUG Add member error details:', {
      error: error.message,
      stack: error.stack,
      department: req.params.department,
      userId: req.body.userId,
      role: req.body.role,
      userPosition: req.body.userPosition
    });
    logger.error('Add department member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member to department',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Remove member from department (Super Admin only)
router.delete('/:department/members/:userId', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { department, userId } = req.params;

    // Check if user exists and is in the department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, department: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.department !== department.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'User is not in this department'
      });
    }

    // Update user to remove from department
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'PARTICIPANT',
        department: null,
        userPosition: null,
        managerId: null,
        employeeId: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true
      }
    });

    res.json({
      success: true,
      message: 'Member removed from department successfully',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Remove department member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member from department',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Update member role in department (Super Admin only)
router.put('/:department/members/:userId', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { department, userId } = req.params;
    const { role, userPosition, managerId } = req.body;

    // Validate required fields
    if (!role || !userPosition) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: role, userPosition'
      });
    }

    // Validate role matches department
    if (!isValidRoleForDepartment(role, department)) {
      return res.status(400).json({
        success: false,
        message: `Role ${role} is not valid for department ${department}. Please select a role that matches the department.`
      });
    }

    // Check if user exists and is in the department
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, role: true, department: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.department !== department.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'User is not in this department'
      });
    }

    // Update user role and position
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role,
        userPosition,
        managerId: managerId || null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        managerId: true,
        employeeId: true
      }
    });

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: updatedUser
    });

  } catch (error) {
    logger.error('Update department member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Get available users for department assignment (Super Admin only)
router.get('/available-users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
        department: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true
      },
      orderBy: { fullName: 'asc' }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    logger.error('Get available users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available users',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Create new staff directly
router.post('/:department/create-staff', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { department } = req.params;
    const { 
      fullName, 
      email, 
      phoneNumber, 
      address, 
      lastEducation, 
      role, 
      userPosition, 
      managerId 
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !role || !userPosition) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, role, and position are required'
      });
    }

    // Validate department - get from database
    const existingDepartments = await prisma.$queryRaw`
      SELECT name FROM departments WHERE is_active = true
    `;
    const validDepartments = existingDepartments.map(d => d.name);
    
    if (!validDepartments.includes(department)) {
      return res.status(400).json({
        success: false,
        message: `Invalid department. Valid departments: ${validDepartments.join(', ')}`
      });
    }

    // Validate role matches department
    if (!isValidRoleForDepartment(role, department)) {
      return res.status(400).json({
        success: false,
        message: `Role ${role} is not valid for department ${department}. Please select a role that matches the department.`
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate employee ID
    const departmentPrefix = {
      'CUSTOMER_SERVICE': 'CS',
      'OPERATIONS': 'OPS',
      'FINANCE': 'FIN',
      'HUMAN_RESOURCES': 'HR'  // Add HUMAN_RESOURCES prefix
    };
    
    // Map department name to Prisma enum
    const departmentMap = {
      'CUSTOMER_SERVICE': 'CUSTOMER_SERVICE',
      'FIANNACE A': 'FINANCE',
      'FINANCE A': 'FINANCE',
      'OPERATIONS': 'OPERATIONS',
      'Operations': 'OPERATIONS',  // Add Operations mapping
      'HUMAN_RESOURCES': 'CUSTOMER_SERVICE'  // Map HUMAN_RESOURCES to CUSTOMER_SERVICE enum
    };
    
    const prismaDepartment = departmentMap[department] || 'CUSTOMER_SERVICE';
    
    const lastEmployee = await prisma.user.findFirst({
      where: {
        department: prismaDepartment,
        employeeId: {
          startsWith: departmentPrefix[department]
        }
      },
      orderBy: { employeeId: 'desc' }
    });

    let employeeNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNumber = parseInt(lastEmployee.employeeId.replace(departmentPrefix[department], ''));
      employeeNumber = lastNumber + 1;
    }

    const employeeId = `${departmentPrefix[department]}${employeeNumber.toString().padStart(3, '0')}`;

    // Map user position to Prisma enum (only HEAD and AGENT, no SENIOR_AGENT)
    const positionMap = {
      'Head of Finance': 'HEAD',
      'Head of Customer Service': 'HEAD',
      'Head of Operations': 'HEAD',
      'Head of Human Resources': 'HEAD',
      'Finance Staff': 'AGENT',
      'Customer Service Staff': 'AGENT',
      'Operations Staff': 'AGENT',
      'HR Staff': 'AGENT'
    };
    
    const prismaPosition = positionMap[userPosition] || 'AGENT';

    // Hash password
    const hashedPassword = await bcrypt.hash('temp_password_123', 12);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        address: address || null,
        lastEducation: lastEducation || null,
        role,
        department: prismaDepartment,
        userPosition: prismaPosition,
        managerId: managerId || null,
        employeeId,
        emailVerified: true, // Admin created, so auto-verify
        password: hashedPassword, // Hashed temporary password, user should change on first login
        verificationToken: null,
        verificationTokenExpires: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        department: true,
        userPosition: true,
        employeeId: true,
        createdAt: true
      }
    });

    logger.info(`New staff created: ${newUser.fullName} (${newUser.email}) in ${department}`);

    res.json({
      success: true,
      message: 'New staff created successfully',
      data: newUser
    });

  } catch (error) {
    logger.error('Create new staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create new staff',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
});


// Get tickets for department
router.get('/tickets', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;
    
    const where = {
      department: 'CUSTOMER_SERVICE'
    };

    if (status) {
      where.status = status.toUpperCase();
    }
    if (priority) {
      where.priority = priority.toUpperCase();
    }
    if (category) {
      where.category = category.toUpperCase();
    }

    const tickets = await prisma.departmentTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.departmentTicket.count({ where });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
});

// Get single ticket by ID
router.get('/tickets/:id', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.departmentTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    logger.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
});

// Update ticket (assign, change status, etc.)
router.put('/tickets/:id', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, category, assignedTo, dueDate } = req.body;

    // Get current ticket to check for status changes
    const currentTicket = await prisma.departmentTicket.findUnique({
      where: { id }
    });

    if (!currentTicket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const updateData = {};
    if (status) updateData.status = status.toUpperCase();
    if (priority) updateData.priority = priority.toUpperCase();
    if (category) updateData.category = category.toUpperCase();
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    const ticket = await prisma.departmentTicket.update({
      where: { id },
      data: updateData
    });

    logger.info(`Ticket ${id} updated by user ${req.user.id}`);

    // Send email notification if status changed
    if (status && status.toUpperCase() !== currentTicket.status) {
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
        });

        const recipientEmails = csTeam.map(member => member.email);

        // Send status change notification
        await emailService.sendTicketStatusChangeNotification(
          ticket,
          currentTicket.status,
          status.toUpperCase(),
          {
            fullName: req.user.fullName,
            userPosition: req.user.userPosition
          },
          recipientEmails
        );
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket
    });
  } catch (error) {
    logger.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error.message
    });
  }
});

// Assign ticket to current user
router.post('/tickets/:id/assign', authenticate, requireDepartment('CUSTOMER_SERVICE'), async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.departmentTicket.update({
      where: { id },
      data: {
        assignedTo: req.user.id, // Use user ID instead of email
        status: 'IN_PROGRESS'
      }
    });

    logger.info(`Ticket ${id} assigned to ${req.user.email} (${req.user.id})`);

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: ticket
    });
  } catch (error) {
    logger.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
});

// Add new department (Super Admin only)
router.post('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, headId } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department already exists
    const existingDepartment = await prisma.organizationDepartment.findUnique({
      where: { name }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    // If headId is provided, verify user exists and is available
    if (headId) {
      const user = await prisma.user.findUnique({
        where: { id: headId },
        select: { id: true, fullName: true, role: true, department: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is already a department head
      const existingHead = await prisma.organizationDepartment.findFirst({
        where: { headId }
      });

      if (existingHead) {
        return res.status(400).json({
          success: false,
          message: 'User is already a department head'
        });
      }
    }

    // Create department
    const department = await prisma.organizationDepartment.create({
      data: {
        name,
        description: description || null,
        headId: headId || null,
        isActive: true
      }
    });

    // Note: We don't update user role here as it's handled separately
    // The headId is just stored as a reference in the department

    logger.info(`Department ${name} created successfully`);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    logger.error('Add department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
});

// Get all departments
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const departments = await prisma.organizationDepartment.findMany({
      where: {
        isActive: true
      },
      include: {
        head: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response to match expected structure
    const formattedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      head_id: dept.headId,
      head_name: dept.head?.fullName || null,
      head_email: dept.head?.email || null,
      is_active: dept.isActive,
      created_at: dept.createdAt,
      updated_at: dept.updatedAt
    }));

    res.json({
      success: true,
      data: formattedDepartments
    });
  } catch (error) {
    logger.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

// Update department
router.put('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, headId, isActive } = req.body;

    // Check if department exists
    const existingDepartment = await prisma.organizationDepartment.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Update department
    const updatedDepartment = await prisma.organizationDepartment.update({
      where: { id },
      data: {
        name,
        description: description !== undefined ? description : null,
        headId: headId !== undefined ? headId : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    logger.info(`Department ${id} updated successfully`);

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updatedDepartment
    });
  } catch (error) {
    logger.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
});

// Delete department
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const existingDepartment = await prisma.organizationDepartment.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Soft delete department
    await prisma.organizationDepartment.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    logger.info(`Department ${id} deleted successfully`);

    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    logger.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
});

module.exports = router;
