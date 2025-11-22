const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const logger = require('../config/logger');

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Preserve ticketTypes before sanitization
  const ticketTypes = req.body.ticketTypes;
  const hasMultipleTicketTypes = req.body.hasMultipleTicketTypes;
  
  // Sanitize string fields recursively
  const sanitizeObject = (obj, skipKeys = []) => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj.trim());
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item, skipKeys));
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip sanitization for specific keys
        if (skipKeys.includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeObject(value, skipKeys);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body (skip ticketTypes to preserve structure)
  if (req.body) {
    req.body = sanitizeObject(req.body, ['ticketTypes', 'hasMultipleTicketTypes']);
  }

  // Restore ticketTypes after sanitization
  if (ticketTypes !== undefined) {
    req.body.ticketTypes = ticketTypes;
  }
  if (hasMultipleTicketTypes !== undefined) {
    req.body.hasMultipleTicketTypes = hasMultipleTicketTypes;
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ VALIDATION FAILED:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  console.log('✅ VALIDATION PASSED - Proceeding to controller');
  next();
};

// Common validation rules
const commonValidations = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Name validation
  fullName: body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),

  // Phone number validation
  phoneNumber: body('phoneNumber')
    .optional()
    .trim()
    .isMobilePhone('id-ID')
    .withMessage('Please provide a valid Indonesian phone number'),

  // UUID validation
  uuid: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  // Pagination validation
  pagination: [
    query('page')
    .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
    .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Event validation
  eventTitle: body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Event title must be between 5 and 200 characters'),
  
  eventDescription: body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Event description cannot exceed 2000 characters'),

  eventDate: body('eventDate')
    .isISO8601()
    .withMessage('Event date must be a valid date')
    .custom((value) => {
      const eventDate = new Date(value);
      const now = new Date();
      const minDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now
      
      if (eventDate < minDate) {
        throw new Error('Event date must be at least 3 days from now');
      }
      return true;
    }),
  
  registrationDeadline: body('registrationDeadline')
    .isISO8601()
    .withMessage('Registration deadline must be a valid date'),

  maxParticipants: body('maxParticipants')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Maximum participants must be between 1 and 10,000'),

  eventPrice: body('price')
    .optional()
    .custom((value, { req }) => {
      // If event has multiple ticket types, price validation is skipped
      if (req.body.hasMultipleTicketTypes === true) {
        return true;
      }
      
      // If event is free, price can be null or 0
      if (req.body.isFree === true) {
        if (value === null || value === undefined || value === 0) {
          return true;
        }
        return false;
      }
      // If event is not free, price must be a positive number
      if (value === null || value === undefined) {
        throw new Error('Event price is required for paid events');
      }
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Event price must be a positive number');
      }
      return true;
    })
    .withMessage('Event price validation failed'),

  // File upload validation
  fileUpload: body('file')
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('File type not allowed. Only JPEG, PNG, GIF, and WebP are allowed');
        }
        
        if (req.file.size > maxSize) {
          throw new Error('File size too large. Maximum size is 5MB');
        }
      }
      return true;
    })
};

// Specific validation sets
const validationSets = {
  // User registration
  userRegistration: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.fullName,
    commonValidations.phoneNumber,
    sanitizeInput,
    handleValidationErrors
  ],

  // User login
  userLogin: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
    sanitizeInput,
    handleValidationErrors
  ],

  // Event creation
  eventCreation: [
    commonValidations.eventTitle,
    commonValidations.eventDescription,
    commonValidations.eventDate,
    commonValidations.registrationDeadline,
    commonValidations.maxParticipants,
    commonValidations.eventPrice,
    body('location').trim().notEmpty().withMessage('Event location is required'),
    body('category').isIn(['ACADEMIC', 'SPORTS', 'ARTS', 'CULTURE', 'TECHNOLOGY', 'BUSINESS', 'HEALTH', 'EDUCATION', 'ENTERTAINMENT', 'OTHER'])
      .withMessage('Invalid event category'),
    sanitizeInput,
    handleValidationErrors
  ],

  // Event update
  eventUpdate: [
    param('id').isUUID().withMessage('Invalid event ID'),
    commonValidations.eventTitle.optional(),
    commonValidations.eventDescription.optional(),
    commonValidations.eventDate.optional(),
    commonValidations.registrationDeadline.optional(),
    commonValidations.maxParticipants.optional(),
    commonValidations.eventPrice.optional(),
    sanitizeInput,
    handleValidationErrors
  ],

  // Event registration
  eventRegistration: [
    param('id').isUUID().withMessage('Invalid event ID'),
    sanitizeInput,
    handleValidationErrors
  ],

  // Payment creation
  paymentCreation: [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('paymentMethod').isIn(['BANK_TRANSFER', 'E_WALLET', 'CREDIT_CARD', 'QR_CODE', 'CASH', 'CRYPTO', 'GATEWAY'])
      .withMessage('Invalid payment method'),
    sanitizeInput,
    handleValidationErrors
  ],

  // Pagination
  pagination: [
    ...commonValidations.pagination,
    sanitizeInput,
    handleValidationErrors
  ],

  // UUID parameter
  uuidParam: [
    commonValidations.uuid,
    sanitizeInput,
    handleValidationErrors
  ]
};

// Legacy validation functions for backward compatibility
const validateUserRegistration = validationSets.userRegistration;
const validateOrganizerRegistration = validationSets.userRegistration; // Using same validation for now
const validateUserLogin = validationSets.userLogin;
const validateEmailVerification = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits'),
  sanitizeInput,
  handleValidationErrors
];
const validatePasswordResetRequest = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  sanitizeInput,
  handleValidationErrors
];
const validatePasswordReset = [
  body('token').notEmpty().withMessage('Reset token is required'),
  commonValidations.password,
  sanitizeInput,
  handleValidationErrors
];

// Additional validation functions for events
const validateEventCreation = validationSets.eventCreation;
const validateEventUpdate = validationSets.eventUpdate;
const validateEventRegistration = validationSets.eventRegistration;
const validateAttendance = [
  param('id').isUUID().withMessage('Invalid event ID'),
  body('participantId').isUUID().withMessage('Invalid participant ID'),
  sanitizeInput,
  handleValidationErrors
];
const validateQRCode = [
  body('qrCodeData').notEmpty().withMessage('QR code data is required'),
  sanitizeInput,
  handleValidationErrors
];
const validateAdminCheckIn = [
  body('eventId').isUUID().withMessage('Invalid event ID'),
  body('participantId').optional().isUUID().withMessage('Invalid participant ID'),
  body('qrCodeData').optional().isString().withMessage('QR code data must be a string'),
  body().custom((value, { req }) => {
    // Either participantId OR qrCodeData must be provided
    if (!req.body.participantId && !req.body.qrCodeData) {
      throw new Error('Either participantId or qrCodeData must be provided');
    }
    if (req.body.participantId && req.body.qrCodeData) {
      throw new Error('Cannot provide both participantId and qrCodeData');
    }
    return true;
  }),
  sanitizeInput,
  handleValidationErrors
];
const validateUUID = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Invalid ${paramName} format`),
  sanitizeInput,
  handleValidationErrors
];
const validatePagination = validationSets.pagination;
const validateSearch = [
  query('q').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('category').optional().isIn(['ACADEMIC', 'SPORTS', 'ARTS', 'CULTURE', 'TECHNOLOGY', 'BUSINESS', 'HEALTH', 'EDUCATION', 'ENTERTAINMENT', 'OTHER'])
    .withMessage('Invalid category'),
  query('location').optional().trim().isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  ...commonValidations.pagination,
  sanitizeInput,
  handleValidationErrors
];

// Contact validation
const validateContactUs = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
  sanitizeInput,
  handleValidationErrors
];

module.exports = {
  sanitizeInput,
  handleValidationErrors,
  commonValidations,
  validationSets,
  DOMPurify,
  // Legacy exports for backward compatibility
  validateUserRegistration,
  validateOrganizerRegistration,
  validateUserLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  // Event validation exports
  validateEventCreation,
  validateEventUpdate,
  validateEventRegistration,
  validateAttendance,
  validateQRCode,
  validateAdminCheckIn,
  validateUUID,
  validatePagination,
  validateSearch,
  validateContactUs
};