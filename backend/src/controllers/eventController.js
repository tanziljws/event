const eventService = require('../services/eventService');
const logger = require('../config/logger');

// Create new event (Admin or Organizer)
const createEvent = async (req, res) => {
  try {
    logger.info('🎯 CONTROLLER: createEvent called');
    logger.info(`📦 CONTROLLER: Request body keys: ${Object.keys(req.body).join(', ')}`);
    logger.info(`📦 CONTROLLER: hasMultipleTicketTypes = ${req.body.hasMultipleTicketTypes}`);
    logger.info(`📦 CONTROLLER: ticketTypes count = ${req.body.ticketTypes?.length || 0}`);
    
    // FORCE CONVERT - regardless of what comes in
    let galleryUrls = req.body.galleryUrls || [];
    
    // If it's object with numeric keys, convert to array
    if (typeof galleryUrls === 'object' && !Array.isArray(galleryUrls)) {
      galleryUrls = Object.values(galleryUrls);
    }
    
    const eventData = {
      ...req.body,
      galleryUrls: galleryUrls, // Now guaranteed to be array
    };
    
    logger.info(`📦 CONTROLLER: Calling eventService.createEvent with hasMultipleTicketTypes=${eventData.hasMultipleTicketTypes}, ticketTypes=${eventData.ticketTypes?.length || 0}`);
    
    const creatorId = req.user.id;
    const creatorRole = req.user.role;

    const event = await eventService.createEvent(eventData, creatorId, creatorRole);
    
    logger.info(`✅ CONTROLLER: Event created successfully: ${event.id}`);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event },
    });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all events (Public with optional auth)
const getEvents = async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      category: req.query.category,
      location: req.query.location,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      isFree: req.query.isFree,
      status: req.query.status,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
      radius: req.query.radius,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      isPublished: req.query.isPublished,
    };

    const result = await eventService.getEvents(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
};

// Search events
const searchEvents = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: query,
      category: req.query.category,
      location: req.query.location,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      isFree: req.query.isFree,
      status: req.query.status,
    };

    const result = await eventService.getEvents(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Search events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search events',
    });
  }
};

// Get single event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const includeRegistrationStatus = req.query.includeRegistrationStatus === 'true';
    
    let event;
    if (includeRegistrationStatus && req.user) {
      // If user is authenticated and wants registration status, get event with user's registration info
      event = await eventService.getEventByIdWithUserRegistration(id, req.user.id);
    } else {
      // Standard event fetch without registration info
      event = await eventService.getEventById(id);
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    logger.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
    });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const eventData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const event = await eventService.updateEvent(id, eventData, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event },
    });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    await eventService.deleteEvent(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    logger.error('Delete event error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Register for event
const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { privatePassword } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    logger.info(`Event registration attempt: Event ID: ${id}, User ID: ${userId}, Email: ${userEmail}`);

    const result = await eventService.registerForEvent(id, userId, privatePassword);

    // Check if payment is required
    if (result.requiresPayment) {
      logger.info(`Payment required for event ${id}, user ${userId}`);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          requiresPayment: true,
          event: result.event
        },
      });
    }

    logger.info(`Registration successful for event ${id}, user ${userId}`);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { registration: result.registration },
    });
  } catch (error) {
    logger.error('Event registration error:', error);
    logger.error('Event registration error stack:', error.stack);
    
    // Return more specific error messages instead of generic 404
    const statusCode = error.statusCode || 400;
    const errorMessage = error.message || 'Registration failed';
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Register for event after successful payment
const registerForEventAfterPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentId, privatePassword } = req.body;
    const userId = req.user.id;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
    }

    const result = await eventService.registerForEventAfterPayment(id, userId, paymentId, privatePassword);

    // Result from eventService contains: { registration, message, ticketType, registrations, etc }
    // Return the registration object directly (not nested)
    res.status(201).json({
      success: true,
      message: result.message || 'Registration successful after payment',
      data: {
        registration: result.registration, // Direct registration object
        ticketType: result.ticketType || null, // Include ticketType at root level
        quantity: result.quantity || 1, // Include quantity
      },
    });
  } catch (error) {
    logger.error('Event registration after payment error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's event registrations
const getUserEventRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || null,
      status: req.query.status || null,
    };

    // Use ticketService to get user tickets with ticket type information
    const ticketService = require('../services/ticketService');
    const result = await ticketService.getUserTickets(userId, filters);

    res.status(200).json({
      success: true,
      data: {
        registrations: result.registrations,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    logger.error('Get user event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
    });
  }
};

// Scan QR code for event check-in
const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    const userId = req.user.id;

    const result = await eventService.scanQRCode(qrData, userId);

    res.status(200).json({
      success: true,
      message: 'QR code scanned successfully',
      data: result,
    });
  } catch (error) {
    logger.error('QR code scan error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin check-in participant
const adminCheckIn = async (req, res) => {
  try {
    const { eventId, qrData } = req.body;
    const adminId = req.user.id;

    const result = await eventService.adminCheckInParticipant(eventId, qrData, adminId);

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: result,
    });
  } catch (error) {
    logger.error('Admin check-in error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Detect event from token
const detectEventFromToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    // Check if token looks like an event ID (numeric or UUID)
    if (/^[0-9]+$/.test(token) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Please scan a valid registration QR code, not an event ID.',
        hint: 'QR codes should contain registration tokens (e.g., 59D2D90102), not event IDs.',
      });
    }

    const result = await eventService.detectEventFromToken(token);

    res.status(200).json({
      success: true,
      message: 'Event detected successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Detect event from token error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Organizer check-in participant
const organizerCheckIn = async (req, res) => {
  try {
    const { eventId, qrCodeData } = req.body;
    const organizerId = req.user.id;

    const result = await eventService.organizerCheckInParticipant(eventId, qrCodeData, organizerId);

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: result,
    });
  } catch (error) {
    logger.error('Organizer check-in error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Detect organizer event from token
const detectOrganizerEventFromToken = async (req, res) => {
  try {
    const { token } = req.body;
    const organizerId = req.user.id;

    const result = await eventService.detectOrganizerEventFromToken(token, organizerId);

    res.status(200).json({
      success: true,
      message: 'Event detected successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Detect organizer event from token error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get event attendance
const getEventAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await eventService.getEventAttendance(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance data',
    });
  }
};

// Get organizer events
const getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      category: req.query.category,
      status: req.query.status,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };

    const result = await eventService.getOrganizerEvents(filters, organizerId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get organizer events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
    });
  }
};

// Get organizer event attendance
const getOrganizerEventAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const result = await eventService.getOrganizerEventAttendance(id, organizerId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Get organizer event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance data',
    });
  }
};

// Get organizer event by ID
const getOrganizerEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const event = await eventService.getOrganizerEventById(id, organizerId);

    res.status(200).json({
      success: true,
      data: { event },
    });
  } catch (error) {
    logger.error('Get organizer event by ID error:', error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update organizer event
const updateOrganizerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;
    const eventData = req.body;

    const event = await eventService.updateOrganizerEvent(id, organizerId, eventData);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event },
    });
  } catch (error) {
    logger.error('Update organizer event error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Publish organizer event
const publishOrganizerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const result = await eventService.publishOrganizerEvent(id, organizerId);

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Publish organizer event error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// Get event registrations (for organizers)
const getEventRegistrations = async (req, res) => {
  try {
    const eventId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const registrations = await eventService.getEventRegistrations(eventId, {
      page,
      limit,
      status
    });

    res.json({
      success: true,
      data: registrations
    });
  } catch (error) {
    logger.error('Get event registrations error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get organizer event analytics
const getOrganizerEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const analytics = await eventService.getOrganizerEventAnalytics(id, organizerId);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Get organizer event analytics error:', error);
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify private event password
const verifyPrivateEventPassword = async (req, res) => {
  try {
    const { eventId, password } = req.body;

    if (!eventId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Event ID and password are required',
      });
    }

    const result = await eventService.verifyPrivateEventPassword(eventId, password);

    res.json({
      success: true,
      message: result.message,
      data: { isValid: result.isValid },
    });
  } catch (error) {
    logger.error('Verify private event password error:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Export organizer event attendance as Excel
const exportOrganizerEventAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;
    const ExcelJS = require('exceljs');

    // Get attendance data
    const attendanceData = await eventService.getOrganizerEventAttendance(id, organizerId);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Event Attendance');

    // Add headers
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Participant Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Registration Date', key: 'registeredAt', width: 20 },
      { header: 'Has Attended', key: 'hasAttended', width: 15 },
      { header: 'Attendance Time', key: 'attendanceTime', width: 20 },
      { header: 'Attended At', key: 'attendedAt', width: 20 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    attendanceData.registrations.forEach((registration, index) => {
      worksheet.addRow({
        no: index + 1,
        name: registration.participant.fullName,
        email: registration.participant.email,
        phone: registration.participant.phoneNumber || '-',
        registeredAt: registration.registeredAt ? new Date(registration.registeredAt).toLocaleString() : '-',
        hasAttended: registration.hasAttended ? 'Yes' : 'No',
        attendanceTime: registration.attendanceTime ? new Date(registration.attendanceTime).toLocaleString() : '-',
        attendedAt: registration.attendedAt ? new Date(registration.attendedAt).toLocaleString() : '-',
      });
    });

    // Add summary
    worksheet.addRow({});
    worksheet.addRow({ name: 'SUMMARY', font: { bold: true } });
    worksheet.addRow({ name: 'Total Registrations:', email: attendanceData.statistics.totalRegistrations });
    worksheet.addRow({ name: 'Attended:', email: attendanceData.statistics.attendedRegistrations });
    worksheet.addRow({ name: 'Attendance Rate:', email: `${attendanceData.statistics.attendanceRate}%` });

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="event-attendance-${attendanceData.event.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx"`);

    res.send(excelBuffer);
  } catch (error) {
    logger.error('Export organizer event attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance data',
    });
  }
};

// Export organizer event registrations as Excel
const exportOrganizerEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;
    const ExcelJS = require('exceljs');

    // Verify organizer owns the event
    const event = await prisma.event.findFirst({
      where: {
        id: id,
        createdBy: organizerId
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you are not authorized to view this event'
      });
    }

    // Get all registrations for this event
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: id
      },
      include: {
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Event Registrations');

    // Add headers
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Participant Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Registration Date', key: 'registeredAt', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Has Attended', key: 'hasAttended', width: 15 },
      { header: 'Attendance Time', key: 'attendanceTime', width: 20 },
      { header: 'Attended At', key: 'attendedAt', width: 20 },
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    registrations.forEach((registration, index) => {
      worksheet.addRow({
        no: index + 1,
        name: registration.participant.fullName,
        email: registration.participant.email,
        phone: registration.participant.phoneNumber || '-',
        registeredAt: registration.registeredAt ? new Date(registration.registeredAt).toLocaleString() : '-',
        status: registration.status,
        hasAttended: registration.hasAttended ? 'Yes' : 'No',
        attendanceTime: registration.attendanceTime ? new Date(registration.attendanceTime).toLocaleString() : '-',
        attendedAt: registration.attendedAt ? new Date(registration.attendedAt).toLocaleString() : '-',
      });
    });

    // Add summary
    worksheet.addRow({});
    worksheet.addRow({ name: 'SUMMARY', font: { bold: true } });
    worksheet.addRow({ name: 'Total Registrations:', email: registrations.length });
    worksheet.addRow({ name: 'Attended:', email: registrations.filter(r => r.hasAttended).length });
    worksheet.addRow({ name: 'Not Attended:', email: registrations.filter(r => !r.hasAttended).length });

    // Generate Excel buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="event-registrations-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx"`);

    res.send(excelBuffer);
  } catch (error) {
    logger.error('Export organizer event registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations data',
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  searchEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  registerForEventAfterPayment,
  getUserEventRegistrations,
  scanQRCode,
  adminCheckIn,
  detectEventFromToken,
  getEventAttendance,
  organizerCheckIn,
  detectOrganizerEventFromToken,
  getOrganizerEventAttendance,
  getOrganizerEvents,
  getOrganizerEventById,
  updateOrganizerEvent,
  publishOrganizerEvent,
  getEventRegistrations,
  verifyPrivateEventPassword,
  exportOrganizerEventAttendance,
  exportOrganizerEventRegistrations,
  getOrganizerEventAnalytics,
};