const { prisma } = require('../config/database');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

// Generate QR code for ticket
const generateTicketQRCode = async (registrationId, registrationToken) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/tickets');
    
    // Ensure directory exists
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate QR code data for ticket
    const qrCodeData = JSON.stringify({
      type: 'TICKET',
      registrationId,
      token: registrationToken,
      timestamp: new Date().toISOString()
    });

    const filename = `ticket_${registrationId}_${Date.now()}`;
    const filePath = path.join(uploadsDir, `${filename}.png`);
    const qrCodeUrl = `/uploads/tickets/${filename}.png`;

    // Generate QR code
    await QRCode.toFile(filePath, qrCodeData, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    logger.info(`Ticket QR code generated: ${qrCodeUrl}`);
    return qrCodeUrl;
  } catch (error) {
    logger.error('Error generating ticket QR code:', error);
    throw error;
  }
};

// Get ticket by registration ID
const getTicketByRegistration = async (registrationId, participantId) => {
  try {
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: registrationId,
        participantId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
            price: true,
            isFree: true,
          },
        },
        ticketType: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isFree: true,
            color: true,
            icon: true,
            badgeText: true,
          },
        },
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payments: {
          where: {
            paymentStatus: 'PAID',
          },
          select: {
            id: true,
            amount: true,
            currency: true,
            paymentStatus: true,
            paymentMethod: true,
            paidAt: true,
          },
          take: 1,
          orderBy: {
            paidAt: 'desc',
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Generate QR code if not exists
    let qrCodeUrl = registration.qrCodeUrl;
    if (!qrCodeUrl) {
      qrCodeUrl = await generateTicketQRCode(registrationId, registration.registrationToken);
      
      // Update registration with QR code URL
      await prisma.eventRegistration.update({
        where: { id: registrationId },
        data: { qrCodeUrl },
      });
    }

    // If ticketType is missing but we have payment, try to find ticketType by matching payment amount
    let ticketType = registration.ticketType;
    if (!ticketType && registration.payments && registration.payments.length > 0) {
      const payment = registration.payments[0];
      if (payment && payment.amount) {
        const paymentAmount = parseFloat(payment.amount.toString());
        
        // Try to find ticketType by matching payment amount (with small tolerance for rounding)
        const ticketTypes = await prisma.ticketType.findMany({
          where: {
            eventId: registration.eventId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            isFree: true,
            color: true,
            icon: true,
            badgeText: true,
          },
        });
        
        // Find ticket type with matching price (allow small difference for rounding)
        const matchingTicketType = ticketTypes.find(tt => {
          if (!tt.price) return false;
          const ttPrice = parseFloat(tt.price.toString());
          return Math.abs(ttPrice - paymentAmount) < 0.01; // Allow 0.01 difference
        });
        
        if (matchingTicketType) {
          logger.info(`🎫 Found ticketType by payment amount match: ${matchingTicketType.name} (${matchingTicketType.color}) for registration ${registrationId}`);
          ticketType = matchingTicketType;
        } else {
          // DON'T use first ticket type as fallback - this is dangerous and can assign wrong ticket type
          logger.warn(`⚠️  No exact ticketType match for payment amount ${paymentAmount} for registration ${registrationId}`);
          logger.warn(`⚠️  Available ticket types: ${ticketTypes.map(tt => `${tt.name}: ${tt.price}`).join(', ')}`);
          logger.warn(`⚠️  Registration will be created without ticketType - this should be investigated`);
          // ticketType remains null - don't assign wrong ticket type
        }
      }
    }

    // Format registration to ensure proper JSON serialization
    const formattedRegistration = {
      id: registration.id,
      eventId: registration.eventId,
      participantId: registration.participantId,
      registrationToken: registration.registrationToken,
      qrCodeUrl: qrCodeUrl || registration.qrCodeUrl,
      hasAttended: registration.hasAttended,
      registeredAt: registration.registeredAt instanceof Date 
        ? registration.registeredAt.toISOString() 
        : registration.registeredAt?.toString() || new Date().toISOString(),
      ticketTypeId: registration.ticketTypeId || ticketType?.id || null,
      event: {
        ...registration.event,
        eventDate: registration.event.eventDate instanceof Date
          ? registration.event.eventDate.toISOString().split('T')[0]
          : registration.event.eventDate?.toString() || null,
      },
      // Ensure ticketType is included with proper formatting
      ticketType: ticketType ? {
        id: ticketType.id,
        name: ticketType.name,
        description: ticketType.description,
        price: ticketType.price ? parseFloat(ticketType.price.toString()) : null,
        isFree: ticketType.isFree || false,
        color: ticketType.color || '#2563EB',
        icon: ticketType.icon || 'ticket',
        badgeText: ticketType.badgeText,
      } : null,
      payments: registration.payments || [],
    };

    return formattedRegistration;
  } catch (error) {
    logger.error('Get ticket by registration error:', error);
    throw error;
  }
};

// Get user tickets
const getUserTickets = async (participantId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'registeredAt',
      sortOrder = 'desc'
    } = filters;

    const where = {
      participantId,
    };

    // Add search filter
    if (search) {
      where.event = {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    // Add status filter
    if (status === 'attended') {
      where.hasAttended = true;
    } else if (status === 'upcoming') {
      where.hasAttended = false;
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        select: {
          id: true,
          registrationToken: true,
          qrCodeUrl: true,
          hasAttended: true,
          registeredAt: true,
          ticketTypeId: true,
          ticketType: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              isFree: true,
              color: true,
              icon: true,
              badgeText: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true,
              latitude: true,
              longitude: true,
              isPublished: true,
              price: true,
              isFree: true,
            },
          },
          payments: {
            where: {
              paymentStatus: 'PAID',
            },
            select: {
              id: true,
              amount: true,
              currency: true,
              paymentStatus: true,
              paymentMethod: true,
              paidAt: true,
            },
            take: 1,
            orderBy: {
              paidAt: 'desc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.eventRegistration.count({ where }),
    ]);

    // Format registrations to ensure proper JSON serialization
    // Also try to find missing ticketType by matching payment amount
    const formattedRegistrations = await Promise.all(registrations.map(async (reg) => {
      let ticketType = reg.ticketType;
      
      // If ticketType is missing but we have payment, try to find ticketType by matching payment amount
      if (!ticketType && reg.payments && reg.payments.length > 0) {
        const payment = reg.payments[0];
        if (payment && payment.amount) {
          try {
            const paymentAmount = parseFloat(payment.amount.toString());
            
            // Get all ticket types for this event
            const ticketTypes = await prisma.ticketType.findMany({
              where: {
                eventId: reg.eventId,
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                isFree: true,
                color: true,
                icon: true,
                badgeText: true,
              },
            });
            
            // Find ticket type with matching price (allow small difference for rounding)
            const matchingTicketType = ticketTypes.find(tt => {
              if (!tt.price) return false;
              const ttPrice = parseFloat(tt.price.toString());
              return Math.abs(ttPrice - paymentAmount) < 0.01; // Allow 0.01 difference
            });
            
            if (matchingTicketType) {
              logger.info(`🎫 Found ticketType by payment amount match: ${matchingTicketType.name} (${matchingTicketType.color}) for registration ${reg.id}`);
              ticketType = matchingTicketType;
            } else if (ticketTypes.length === 1) {
              // Only use single ticket type if payment amount matches (or is close)
              const singleTicketPrice = parseFloat(ticketTypes[0].price?.toString() || '0');
              if (Math.abs(singleTicketPrice - paymentAmount) < 0.01 || singleTicketPrice === 0) {
                logger.info(`🎫 Using single ticketType: ${ticketTypes[0].name} for registration ${reg.id}`);
                ticketType = ticketTypes[0];
              } else {
                logger.warn(`⚠️  Single ticket type price (${singleTicketPrice}) doesn't match payment amount (${paymentAmount}) for registration ${reg.id}`);
              }
            } else {
              logger.warn(`⚠️  No exact ticketType match for payment amount ${paymentAmount} for registration ${reg.id}`);
              logger.warn(`⚠️  Available ticket types: ${ticketTypes.map(tt => `${tt.name}: ${tt.price}`).join(', ')}`);
              // Don't assign wrong ticket type - leave it null
            }
          } catch (error) {
            logger.warn(`⚠️  Error finding ticketType by payment amount for registration ${reg.id}:`, error.message);
          }
        }
      }
      
      return {
        id: reg.id,
        eventId: reg.eventId,
        participantId: reg.participantId,
        registrationToken: reg.registrationToken,
        qrCodeUrl: reg.qrCodeUrl,
        hasAttended: reg.hasAttended,
        registeredAt: reg.registeredAt instanceof Date 
          ? reg.registeredAt.toISOString() 
          : reg.registeredAt?.toString() || new Date().toISOString(),
        ticketTypeId: reg.ticketTypeId || ticketType?.id || null,
        event: {
          ...reg.event,
          eventDate: reg.event.eventDate instanceof Date
            ? reg.event.eventDate.toISOString().split('T')[0]
            : reg.event.eventDate?.toString() || null,
        },
        // Ensure ticketType is included with proper formatting and color
        ticketType: ticketType ? {
          id: ticketType.id,
          name: ticketType.name,
          description: ticketType.description,
          price: ticketType.price ? parseFloat(ticketType.price.toString()) : null,
          isFree: ticketType.isFree || false,
          color: ticketType.color || '#2563EB', // Use color from database, default to blue
          icon: ticketType.icon || 'ticket',
          badgeText: ticketType.badgeText,
        } : null,
        payments: reg.payments || [],
      };
    }));

    return {
      registrations: formattedRegistrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get user tickets error:', error);
    throw error;
  }
};

// Verify ticket QR code
const verifyTicketQRCode = async (qrCodeData) => {
  try {
    const data = JSON.parse(qrCodeData);
    
    if (data.type !== 'TICKET') {
      throw new Error('Invalid ticket QR code');
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: data.registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
          },
        },
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.registrationToken !== data.token) {
      throw new Error('Invalid ticket token');
    }

    return registration;
  } catch (error) {
    logger.error('Verify ticket QR code error:', error);
    throw error;
  }
};

// Scan QR code and validate ticket for attendance
const scanQRCodeForAttendance = async (qrCodeData, participantId) => {
  try {
    // Parse QR code data
    let qrData;
    try {
      qrData = JSON.parse(qrCodeData);
    } catch (parseError) {
      throw new Error('Invalid QR code format');
    }

    // Validate QR code structure
    if (!qrData.type || !qrData.registrationId || !qrData.token) {
      throw new Error('Invalid QR code data structure');
    }

    if (qrData.type !== 'TICKET') {
      throw new Error('QR code is not a valid ticket');
    }

    // Find registration
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: qrData.registrationId,
        registrationToken: qrData.token,
        participantId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
          },
        },
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Invalid ticket or ticket not found');
    }

    if (registration.hasAttended) {
      throw new Error('Ticket has already been used for attendance');
    }

    // Check if event is currently happening (within 2 hours before and after event time)
    const eventDateTime = new Date(`${registration.event.eventDate.toISOString().split('T')[0]} ${registration.event.eventTime}`);
    const now = new Date();
    const twoHoursBefore = new Date(eventDateTime.getTime() - (2 * 60 * 60 * 1000));
    const twoHoursAfter = new Date(eventDateTime.getTime() + (2 * 60 * 60 * 1000));

    if (now < twoHoursBefore || now > twoHoursAfter) {
      throw new Error('Attendance can only be marked during the event (2 hours before and after event time)');
    }

    return {
      registration,
      isValid: true,
      message: 'Ticket is valid for attendance',
    };
  } catch (error) {
    logger.error('Scan QR code for attendance error:', error);
    throw error;
  }
};

// Admin scan QR code for check-in
const adminScanQRCode = async (qrCodeData, eventId) => {
  try {
    // Parse QR code data
    let qrData;
    try {
      qrData = JSON.parse(qrCodeData);
    } catch (parseError) {
      throw new Error('Invalid QR code format');
    }

    // Validate QR code structure
    if (!qrData.type || !qrData.token) {
      throw new Error('Invalid QR code data structure');
    }

    if (qrData.type !== 'TICKET') {
      throw new Error('QR code is not a valid ticket');
    }

    // Find registration - handle both cases: with registrationId and without
    const whereClause = qrData.registrationId 
      ? {
          id: qrData.registrationId,
          registrationToken: qrData.token,
          eventId,
        }
      : {
          registrationToken: qrData.token,
          eventId,
        };

    const registration = await prisma.eventRegistration.findFirst({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
          },
        },
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Invalid ticket or ticket not found for this event');
    }

    if (registration.hasAttended) {
      throw new Error('Participant has already checked in');
    }

    return {
      registration,
      isValid: true,
      message: 'Ticket is valid for check-in',
    };
  } catch (error) {
    logger.error('Admin scan QR code error:', error);
    throw error;
  }
};

module.exports = {
  generateTicketQRCode,
  getTicketByRegistration,
  getUserTickets,
  verifyTicketQRCode,
  scanQRCodeForAttendance,
  adminScanQRCode,
};
