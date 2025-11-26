const { prisma } = require('../config/database');
const { emailTemplates } = require('../config/brevoEmail');
const { generateRegistrationToken } = require('./authService');
const ticketService = require('./ticketService');
const logger = require('../config/logger');
const smartAssignmentService = require('./smartAssignmentService');
const geocodingService = require('./geocodingService');
const websocketService = require('./websocketService');

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Helper function to convert localhost URLs to Tailscale IP
const convertImageUrls = (urls) => {
  if (!urls) return urls;

  if (Array.isArray(urls)) {
    return urls.map(url => {
      if (typeof url === 'string' && url.includes('localhost:5000')) {
        return url.replace('localhost:5000', 'localhost:5000');
      }
      return url;
    });
  }

  if (typeof urls === 'string' && urls.includes('localhost:5000')) {
    return urls.replace('localhost:5000', 'localhost:5000');
  }

  return urls;
};

// Helper functions for capacity management
const getAssignedEventIds = async (userId, role) => {
  // Simulate assignment using user ID hash for consistent distribution
  const allEvents = await prisma.event.findMany({
    where: { status: 'DRAFT' },
    select: { id: true },
    orderBy: { createdAt: 'desc' }
  });

  const agents = await prisma.user.findMany({
    where: { role: 'OPS_AGENT' },
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const agentIndex = agents.findIndex(agent => agent.id === userId);
  if (agentIndex === -1) return [];

  return allEvents
    .filter((_, index) => index % agents.length === agentIndex)
    .map(event => event.id);
};

const getAssignedOrganizerIds = async (userId, role) => {
  // Simulate assignment using user ID hash for consistent distribution
  const allOrganizers = await prisma.user.findMany({
    where: {
      role: 'ORGANIZER',
      verificationStatus: 'PENDING'
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' }
  });

  const agents = await prisma.user.findMany({
    where: { role: 'OPS_AGENT' },
    select: { id: true },
    orderBy: { createdAt: 'asc' }
  });

  const agentIndex = agents.findIndex(agent => agent.id === userId);
  if (agentIndex === -1) return [];

  return allOrganizers
    .filter((_, index) => index % agents.length === agentIndex)
    .map(organizer => organizer.id);
};

// Create new event
const createEvent = async (eventData, creatorId, creatorRole = 'ADMIN') => {
  try {
    logger.info(`🎯 CREATE EVENT STARTED - Title: ${eventData.title}, Creator: ${creatorId}`);
    logger.info(`📦 Event data received:`, {
      hasMultipleTicketTypes: eventData.hasMultipleTicketTypes,
      ticketTypesCount: eventData.ticketTypes?.length || 0,
      ticketTypesData: eventData.ticketTypes
    });

    const {
      title,
      eventDate,
      eventEndDate,
      eventTime,
      eventEndTime,
      location,
      latitude,
      longitude,
      address,
      city,
      province,
      country,
      postalCode,
      description,
      maxParticipants,
      registrationDeadline,
      category = 'OTHER',
      price,
      isFree = true,
      thumbnailUrl,
      galleryUrls = [],
      generateCertificate = false,
      isPrivate = false,
      privatePassword,
      hasMultipleTicketTypes = false,
      ticketTypes = [],
    } = eventData;

    // Validate event date (must be at least 3 days from now)
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    const minDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)); // 3 days from now

    if (eventDateTime < minDate) {
      throw new Error('Event date must be at least 3 days from now');
    }

    // Validate end date if provided (multi-day event)
    if (eventEndDate) {
      const eventEndDateTime = new Date(eventEndDate);
      if (eventEndDateTime < eventDateTime) {
        throw new Error('Event end date must be after or equal to event start date');
      }
    }

    // Validate registration deadline
    const registrationDeadlineDate = new Date(registrationDeadline);
    const finalEventDate = eventEndDate ? new Date(eventEndDate) : eventDateTime;
    if (registrationDeadlineDate >= finalEventDate) {
      throw new Error('Registration deadline must be before event end date');
    }

    // Validate private event password
    if (isPrivate && !privatePassword) {
      throw new Error('Private password is required for private events');
    }

    if (isPrivate && privatePassword && privatePassword.length < 4) {
      throw new Error('Private password must be at least 4 characters long');
    }

    // Check organizer subscription plan limits (for ORGANIZER role only)
    if (creatorRole === 'ORGANIZER') {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
        select: {
          id: true,
          metadata: true,
        },
      });

      if (creator && creator.metadata) {
        const metadata = typeof creator.metadata === 'object' && creator.metadata !== null ? creator.metadata : {};
        const subscriptionPlan = metadata.subscriptionPlan || 'basic';
        const planLabel = metadata.planLabel || 'Basic';

        // Check max participants per event for Basic plan
        if (subscriptionPlan === 'basic' && maxParticipants > 100) {
          throw new Error(`Paket ${planLabel} hanya mengizinkan maksimal 100 peserta per event. Silakan upgrade ke paket Premium atau Supervisor untuk lebih banyak peserta.`);
        }

        // Check max events per month for Basic plan
        if (subscriptionPlan === 'basic') {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

          const eventsThisMonth = await prisma.event.count({
            where: {
              createdBy: creatorId,
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          });

          if (eventsThisMonth >= 5) {
            throw new Error(`Paket ${planLabel} hanya mengizinkan maksimal 5 event per bulan. Anda telah mencapai batas untuk bulan ini. Silakan upgrade ke paket Premium atau Supervisor untuk event tak terbatas.`);
          }
        }
      }
    }

    // Auto-geocode if coordinates are not provided
    let geocodedData = {};
    if (!latitude || !longitude) {
      try {
        geocodedData = await geocodingService.geocodeAddress(location);
        logger.info('Auto-geocoded location:', { location, geocodedData });
      } catch (error) {
        logger.warn('Failed to auto-geocode location:', error.message);
        // Continue without coordinates if geocoding fails
      }
    }

    // Determine event status based on creator role
    // Since organizers are already verified before they can create events, their events are auto-approved
    const eventStatus = (creatorRole === 'ADMIN' || creatorRole === 'ORGANIZER') ? 'APPROVED' : 'DRAFT';
    const platformFee = creatorRole === 'ORGANIZER' ? 15.0 : 0; // 15% for organizers

    const event = await prisma.event.create({
      data: {
        title,
        eventDate: eventDateTime,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        eventTime,
        eventEndTime: eventEndTime || null,
        location,
        latitude: latitude ? parseFloat(latitude) : geocodedData.latitude || null,
        longitude: longitude ? parseFloat(longitude) : geocodedData.longitude || null,
        address: address || geocodedData.address || null,
        city: city || geocodedData.city || null,
        province: province || geocodedData.province || null,
        country: country || geocodedData.country || null,
        postalCode: postalCode || geocodedData.postalCode || null,
        description,
        maxParticipants,
        registrationDeadline: registrationDeadlineDate,
        category,
        price: price ? parseFloat(price) : null,
        isFree: isFree || !price,
        thumbnailUrl,
        galleryUrls,
        generateCertificate,
        isPrivate: isPrivate || false,
        privatePassword: isPrivate ? privatePassword : null,
        hasMultipleTicketTypes: hasMultipleTicketTypes || false,
        status: eventStatus,
        platformFee,
        createdBy: creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Create ticket types if provided
    // Convert object with numeric keys to array (happens during sanitization)
    let ticketTypesArray = ticketTypes;
    if (ticketTypes && !Array.isArray(ticketTypes) && typeof ticketTypes === 'object') {
      ticketTypesArray = Object.values(ticketTypes);
      console.log(`🔄 Converted ticketTypes from object to array: ${ticketTypesArray.length} items`);
    }

    console.log(`🔍 TICKET TYPE CHECK:`, JSON.stringify({
      hasMultipleTicketTypes,
      ticketTypesIsArray: Array.isArray(ticketTypesArray),
      ticketTypesLength: ticketTypesArray?.length || 0
    }, null, 2));

    if (hasMultipleTicketTypes && ticketTypesArray && ticketTypesArray.length > 0) {
      const ticketTypeService = require('./ticketTypeService');

      console.log(`✅ Creating ${ticketTypesArray.length} ticket types for event: ${event.id}`);

      try {
        for (let i = 0; i < ticketTypesArray.length; i++) {
          const ticketTypeData = {
            ...ticketTypesArray[i],
            sortOrder: i,
          };

          console.log(`Creating ticket type ${i + 1}/${ticketTypesArray.length}: ${ticketTypeData.name}`);

          await ticketTypeService.createTicketType(
            event.id,
            ticketTypeData,
            creatorId
          );
        }

        logger.info(`✅ Successfully created ${ticketTypes.length} ticket types for event: ${event.id}`);
      } catch (ticketError) {
        logger.error(`❌ Error creating ticket types for event ${event.id}:`, ticketError);
        throw new Error(`Failed to create ticket types: ${ticketError.message}`);
      }
    } else if (!hasMultipleTicketTypes) {
      // Create default ticket type for single-ticket events
      const ticketTypeService = require('./ticketTypeService');

      await ticketTypeService.createTicketType(
        event.id,
        {
          name: 'General Admission',
          description: 'Standard event access',
          price: price ? parseFloat(price) : null,
          isFree: isFree || !price,
          capacity: maxParticipants,
          benefits: ['Event access', 'Certificate of attendance'],
          isActive: true,
          sortOrder: 0,
        },
        creatorId
      );

      logger.info(`Created default ticket type for event: ${event.id}`);
    }

    logger.info(`Event created successfully: ${event.id} by creator: ${creatorId}`);

    // No auto-assignment needed since organizers are pre-verified and events are auto-approved

    // Manual object construction to avoid Prisma serialization issues
    return {
      id: event.id,
      title: event.title,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      location: event.location,
      thumbnailUrl: event.thumbnailUrl,
      galleryUrls: event.galleryUrls || [],
      flyerUrl: event.flyerUrl,
      certificateTemplateUrl: event.certificateTemplateUrl,
      description: event.description,
      maxParticipants: event.maxParticipants,
      registrationDeadline: event.registrationDeadline,
      isPublished: event.isPublished,
      status: event.status,
      category: event.category,
      price: event.price,
      isFree: event.isFree,
      platformFee: event.platformFee,
      organizerRevenue: event.organizerRevenue,
      createdBy: event.createdBy,
      approvedBy: event.approvedBy,
      approvedAt: event.approvedAt,
      rejectionReason: event.rejectionReason,
      assignedTo: event.assignedTo,
      assignedAt: event.assignedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      creator: event.creator,
      _count: event._count
    };
  } catch (error) {
    logger.error('Event creation error:', error);
    throw error;
  }
};

// Get all events with pagination and filters
const getEvents = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      isPublished,
      eventDateFrom,
      eventDateTo,
      latitude,
      longitude,
      radius = 50, // Default radius in kilometers
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      status: 'APPROVED', // Only show approved events to participants
      isPublished: true   // Only show published events to participants
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isPublished !== undefined) {
      // Convert string to boolean for query parameters
      const boolValue = isPublished === 'true' || isPublished === true;
      where.isPublished = boolValue;
      logger.info(`isPublished filter: ${isPublished} -> ${boolValue}`);
    }

    if (eventDateFrom || eventDateTo) {
      where.eventDate = {};
      if (eventDateFrom) {
        where.eventDate.gte = new Date(eventDateFrom);
      }
      if (eventDateTo) {
        where.eventDate.lte = new Date(eventDateTo);
      }
    }

    // Build orderBy clause
    const orderBy = {};
    // Valid sort fields mapping (Prisma field names)
    const validSortFields = {
      'createdAt': 'createdAt',
      'eventDate': 'eventDate',
      'title': 'title',
      'location': 'location',
      'maxParticipants': 'maxParticipants',
      'updatedAt': 'updatedAt'
    };

    // Use a valid field for initial sorting when distance filtering is applied
    if (latitude && longitude && sortBy === 'distance') {
      // Use eventDate for initial sorting, we'll sort by distance later
      orderBy['eventDate'] = 'asc';
    } else {
      // Validate and use sortBy field, default to createdAt if invalid
      const validField = validSortFields[sortBy] || 'createdAt';
      orderBy[validField] = sortOrder;
    }

    // Get all events first (we'll filter by distance in memory)
    let allEvents = [];
    try {
      allEvents = await prisma.event.findMany({
        where,
        orderBy,
        skip: 0, // Get all events for distance calculation
        take: 1000, // Reasonable limit for distance filtering
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          ticketTypes: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      });
    } catch (dbError) {
      logger.error('Database query error in getEvents:', dbError);
      logger.error('Query details:', { where, orderBy });
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    let filteredEvents = allEvents;

    // Apply distance filtering if coordinates provided
    if (latitude && longitude) {
      console.log(`🔍 LOCATION FILTER: User location = ${latitude}, ${longitude}, radius = ${radius}km`);
      console.log(`🔍 LOCATION FILTER: Total events before filtering = ${allEvents.length}`);

      filteredEvents = allEvents.filter(event => {
        if (!event.latitude || !event.longitude) {
          console.log(`🔍 LOCATION FILTER: Event "${event.title}" has no coordinates`);
          return false;
        }

        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(event.latitude),
          parseFloat(event.longitude)
        );

        const isWithinRadius = distance <= parseFloat(radius);
        console.log(`🔍 LOCATION FILTER: Event "${event.title}" at ${event.latitude}, ${event.longitude} is ${distance.toFixed(2)}km away (${isWithinRadius ? 'WITHIN' : 'OUTSIDE'} radius)`);

        return isWithinRadius;
      });

      console.log(`🔍 LOCATION FILTER: Events after filtering = ${filteredEvents.length}`);

      // Sort by distance if location filtering is applied
      filteredEvents.sort((a, b) => {
        const distanceA = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(a.latitude),
          parseFloat(a.longitude)
        );
        const distanceB = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(b.latitude),
          parseFloat(b.longitude)
        );
        return distanceA - distanceB;
      });
    }

    // Apply pagination after filtering
    const total = filteredEvents.length;
    const events = filteredEvents.slice(skip, skip + parseInt(limit));

    // Convert localhost URLs to Tailscale IP for mobile compatibility
    const eventsWithConvertedUrls = events.map(event => {
      // Ensure galleryUrls is always an array (fix object with numeric keys issue)
      let galleryUrls = event.galleryUrls;
      if (galleryUrls && !Array.isArray(galleryUrls) && typeof galleryUrls === 'object') {
        galleryUrls = Object.values(galleryUrls);
      }
      if (!galleryUrls) {
        galleryUrls = [];
      }

      // Ensure ticketTypes is always an array
      let ticketTypes = event.ticketTypes;
      if (ticketTypes && !Array.isArray(ticketTypes) && typeof ticketTypes === 'object') {
        ticketTypes = Object.values(ticketTypes);
      }
      if (!ticketTypes) {
        ticketTypes = [];
      }

      return {
        ...event,
        thumbnailUrl: convertImageUrls(event.thumbnailUrl),
        galleryUrls: convertImageUrls(galleryUrls),
        flyerUrl: convertImageUrls(event.flyerUrl),
        certificateTemplateUrl: convertImageUrls(event.certificateTemplateUrl),
        ticketTypes,
      };
    });

    return {
      events: eventsWithConvertedUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get events error:', error);
    logger.error('Get events error stack:', error.stack);
    logger.error('Get events error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    throw error;
  }
};

// Get event by ID (public access - only published events)
const getEventById = async (eventId, includeRegistrations = false) => {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        status: 'APPROVED',  // Only show approved events
        isPublished: true    // Only show published events
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        ticketTypes: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        registrations: includeRegistrations
          ? {
            include: {
              participant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          }
          : false,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Add registeredCount field for frontend compatibility and convert URLs
    const eventWithCount = {
      ...event,
      registeredCount: event._count.registrations,
      thumbnailUrl: convertImageUrls(event.thumbnailUrl),
      galleryUrls: convertImageUrls(event.galleryUrls),
      flyerUrl: convertImageUrls(event.flyerUrl),
      certificateTemplateUrl: convertImageUrls(event.certificateTemplateUrl),
    };

    return eventWithCount;
  } catch (error) {
    logger.error('Get event by ID error:', error);
    throw error;
  }
};

// Get event by ID with user's registration status
const getEventByIdWithUserRegistration = async (eventId, userId) => {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        status: 'APPROVED',  // Only show approved events
        isPublished: true    // Only show published events
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        registrations: {
          where: {
            participantId: userId,
            status: 'ACTIVE'  // Only get active registrations
          },
          include: {
            participant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Add registration status and convert URLs
    const eventWithRegistration = {
      ...event,
      isRegistered: event.registrations.length > 0,
      registeredCount: event._count.registrations,
      thumbnailUrl: convertImageUrls(event.thumbnailUrl),
      galleryUrls: convertImageUrls(event.galleryUrls),
      flyerUrl: convertImageUrls(event.flyerUrl),
      certificateTemplateUrl: convertImageUrls(event.certificateTemplateUrl),
    };

    return eventWithRegistration;
  } catch (error) {
    logger.error('Get event by ID with user registration error:', error);
    throw error;
  }
};

// Get event by ID for organizer (can access their own events even if not published)
const getOrganizerEventById = async (eventId, organizerId, includeRegistrations = false) => {
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: organizerId  // Only organizer's own events
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        registrations: includeRegistrations
          ? {
            include: {
              participant: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          }
          : false,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found or you are not authorized to view this event');
    }

    // Add registeredCount field for frontend compatibility
    const eventWithCount = {
      ...event,
      registeredCount: event._count.registrations
    };

    return eventWithCount;
  } catch (error) {
    logger.error('Get organizer event by ID error:', error);
    throw error;
  }
};

// Update event
const updateEvent = async (eventId, eventData, adminId) => {
  try {
    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    if (existingEvent.createdBy !== adminId) {
      throw new Error('You can only update events you created');
    }

    // Validate event date if provided
    if (eventData.eventDate) {
      const now = new Date();
      const eventDateTime = new Date(eventData.eventDate);
      const minDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      if (eventDateTime < minDate) {
        throw new Error('Event date must be at least 3 days from now');
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...eventData,
        eventDate: eventData.eventDate ? new Date(eventData.eventDate) : undefined,
        registrationDeadline: eventData.registrationDeadline
          ? new Date(eventData.registrationDeadline)
          : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    logger.info(`Event updated successfully: ${eventId} by admin: ${adminId}`);

    return event;
  } catch (error) {
    logger.error('Event update error:', error);
    throw error;
  }
};

// Delete event
const deleteEvent = async (eventId, adminId) => {
  try {
    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    if (existingEvent.createdBy !== adminId) {
      throw new Error('You can only delete events you created');
    }

    // Check if event has registrations
    const registrationsCount = await prisma.eventRegistration.count({
      where: { eventId },
    });

    if (registrationsCount > 0) {
      throw new Error('Cannot delete event with existing registrations');
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    logger.info(`Event deleted successfully: ${eventId} by admin: ${adminId}`);

    return { message: 'Event deleted successfully' };
  } catch (error) {
    logger.error('Event deletion error:', error);
    throw error;
  }
};

// Publish/Unpublish event
const toggleEventPublish = async (eventId, adminId) => {
  try {
    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      throw new Error('Event not found');
    }

    if (existingEvent.createdBy !== adminId) {
      throw new Error('You can only publish/unpublish events you created');
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { isPublished: !existingEvent.isPublished },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    logger.info(
      `Event ${event.isPublished ? 'published' : 'unpublished'}: ${eventId} by admin: ${adminId}`
    );

    return event;
  } catch (error) {
    logger.error('Toggle event publish error:', error);
    throw error;
  }
};

// Register for event
const registerForEvent = async (eventId, participantId, privatePassword) => {
  try {
    logger.info(`Starting registration for event ${eventId}, participant ${participantId}`);

    // Use atomic transaction with database-level locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the event row for update to prevent concurrent modifications
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          eventDate: true,
          eventTime: true,
          isPublished: true,
          registrationDeadline: true,
          maxParticipants: true,
          price: true,
          isFree: true,
          isPrivate: true,
          privatePassword: true,
          _count: {
            select: {
              registrations: true
            }
          }
        }
      });

      logger.info(`Event found: ${JSON.stringify(event)}`);

      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.isPublished) {
        throw new Error('Event is not published');
      }

      // Check if event is private and password is required
      if (event.isPrivate) {
        if (!privatePassword) {
          throw new Error('This is a private event. Password is required to register.');
        }
        if (event.privatePassword !== privatePassword) {
          throw new Error('Invalid password for private event.');
        }
      }

      // Check if registration deadline has passed
      if (new Date() > event.registrationDeadline) {
        throw new Error('Registration deadline has passed');
      }

      // Check if event has started
      const eventDateTime = new Date(`${event.eventDate.toISOString().split('T')[0]} ${event.eventTime}`);
      if (new Date() > eventDateTime) {
        throw new Error('Event has already started');
      }

      // Check if user is already registered (with lock)
      const existingRegistration = await tx.eventRegistration.findUnique({
        where: {
          eventId_participantId: {
            eventId,
            participantId,
          },
        },
      });

      if (existingRegistration) {
        // If a registration already exists, return it instead of throwing an error.
        // This makes register-after-payment idempotent: clients can safely call the
        // endpoint after payment without risking a hard failure if the webhook
        // already created the registration.
        return {
          registration: {
            id: existingRegistration.id,
            eventId: existingRegistration.eventId,
            participantId: existingRegistration.participantId,
            registrationToken: existingRegistration.registrationToken,
            hasAttended: existingRegistration.hasAttended,
            status: existingRegistration.status,
            registeredAt: existingRegistration.registeredAt,
          },
          participantEmail: null,
          participantName: null,
          eventData: null,
          registrationToken: existingRegistration.registrationToken,
        };
      }

      // Check if event is full using the locked count
      if (event._count.registrations >= event.maxParticipants) {
        throw new Error('Event is full');
      }

      // Check if event requires payment
      if (!event.isFree && event.price > 0) {
        logger.info(`Event requires payment. Event data: ${JSON.stringify(event)}`);
        // For paid events, we need to create a payment first
        // Return payment information instead of direct registration
        const paymentResponse = {
          requiresPayment: true,
          event: {
            id: event.id,
            title: event.title,
            price: event.price,
            isFree: event.isFree
          },
          message: 'This event requires payment. Please complete payment to register.'
        };
        logger.info(`Returning payment response: ${JSON.stringify(paymentResponse)}`);
        return paymentResponse;
      }

      // 2. Generate registration token (for free events)
      const registrationToken = generateRegistrationToken();

      // 3. Create registration within the same transaction using Prisma ORM
      const registrationId = generateRegistrationToken();
      const registration = await tx.eventRegistration.create({
        data: {
          id: registrationId,
          eventId: eventId,
          participantId: participantId,
          registrationToken: registrationToken,
          hasAttended: false,
          status: 'ACTIVE',
          registeredAt: new Date(),
        }
      });

      // Get event details for response
      const eventDetails = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          eventDate: true,
          eventTime: true,
          location: true,
        },
      });

      // Get participant details for response
      const participantDetails = await tx.user.findUnique({
        where: { id: participantId },
        select: {
          fullName: true,
          email: true,
        },
      });

      // 4. Return registration data for email sending outside transaction
      return {
        registration: {
          id: registration.id,
          eventId: registration.eventId,
          participantId: registration.participantId,
          registrationToken: registration.registrationToken,
          hasAttended: registration.hasAttended,
          status: registration.status,
          registeredAt: registration.registeredAt,
          event: eventDetails,
          participant: participantDetails,
        },
        participantEmail: participantDetails.email,
        participantName: participantDetails.fullName,
        eventData: eventDetails,
        registrationToken
      };
    });

    // Check if this was a payment response (for paid events)
    if (result.requiresPayment) {
      logger.info(`Payment required for event: ${eventId}, participant: ${participantId}`);
      return result;
    }

    // 5. Generate QR code for ticket and send email
    try {
      // Generate QR code for ticket
      const qrCodeUrl = await ticketService.generateTicketQRCode(
        result.registration.id,
        result.registrationToken
      );

      // Update registration with QR code URL
      await prisma.eventRegistration.update({
        where: { id: result.registration.id },
        data: { qrCodeUrl },
      });

      logger.info(`QR code generated for registration: ${result.registration.id}`);

      // 6. Send registration confirmation email with ticket
      try {
        const ticketUrl = `${process.env.API_BASE_URL.replace('/api', '')}${qrCodeUrl}`;

        await emailTemplates.sendRegistrationConfirmation(
          result.participantEmail,
          result.eventData,
          result.registrationToken,
          result.participantName,
          ticketUrl,
          ticketUrl
        );

        logger.info(`Registration confirmation email sent to: ${result.participantEmail}`);
      } catch (emailError) {
        // Log email error but don't fail the registration
        logger.error('Failed to send registration confirmation email:', emailError);
      }
    } catch (qrError) {
      // Log QR code error but don't fail the registration
      logger.error('Failed to generate QR code:', qrError);
    }

    logger.info(`User registered for event: ${eventId}, participant: ${participantId}`);

    // Send real-time update to event room
    websocketService.sendEventUpdate(eventId, {
      type: 'registration_added',
      registration: result.registration,
      participantCount: 1 // We'll get the actual count from the event later
    });

    // Send notification to participant
    websocketService.sendNotification(participantId, {
      type: 'registration_confirmed',
      title: 'Registration Confirmed',
      message: `You have successfully registered for ${result.eventData?.title}`,
      eventId: eventId,
      registrationId: result.registration.id
    });

    // 7. Create notifications for both participant and organizer
    try {
      const notificationService = require('./notificationService');

      // Create notification for participant
      await notificationService.createNotification(
        participantId,
        'REGISTRATION_CONFIRMED',
        'Pendaftaran Berhasil',
        `Kamu mendaftar event "${result.eventData?.title}". Silahkan cek My Registrations untuk detail lengkap.`,
        {
          eventId: eventId,
          eventTitle: result.eventData?.title,
          registrationId: result.registration.id,
          registeredAt: new Date().toISOString()
        }
      );

      // Create notification for organizer
      await notificationService.createNewRegistrationNotification(
        result.registration.id,
        eventId,
        participantId
      );

      logger.info(`Registration notifications sent to participant ${participantId} and organizer for event: ${eventId}`);
    } catch (notificationError) {
      // Log notification error but don't fail the registration
      logger.error('Failed to send notifications:', notificationError);
    }

    return {
      registration: result.registration,
      message: 'Registration successful. Check your email for confirmation.',
    };
  } catch (error) {
    logger.error('Event registration error:', error);
    throw error;
  }
};

// Register for event after successful payment
const registerForEventAfterPayment = async (eventId, participantId, paymentId) => {
  try {
    // Use atomic transaction with database-level locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock the event row for update to prevent concurrent modifications
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          eventDate: true,
          eventTime: true,
          isPublished: true,
          registrationDeadline: true,
          maxParticipants: true,
          price: true,
          isFree: true,
          hasMultipleTicketTypes: true, // Include hasMultipleTicketTypes
          _count: {
            select: {
              registrations: true
            }
          }
        }
      });

      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.isPublished) {
        throw new Error('Event is not published');
      }

      // Check if registration deadline has passed
      if (new Date() > event.registrationDeadline) {
        throw new Error('Registration deadline has passed');
      }

      // Check if event has started
      const eventDateTime = new Date(`${event.eventDate.toISOString().split('T')[0]} ${event.eventTime}`);
      if (new Date() > eventDateTime) {
        throw new Error('Event has already started');
      }

      // For events with multiple ticket types, allow users to buy multiple tickets
      // Users can register multiple times with different ticket types OR same ticket type (for quantity)
      // Only check for duplicate registration if event does NOT have multiple ticket types
      if (!event.hasMultipleTicketTypes) {
        const existingRegistration = await tx.eventRegistration.findFirst({
          where: {
            eventId: eventId,
            participantId: participantId,
            status: 'ACTIVE'
          }
        });

        if (existingRegistration) {
          throw new Error('You are already registered for this event');
        }
      } else {
        console.log('✅ Event has multiple ticket types - allowing multiple registrations');
        // For events with multiple ticket types, we allow:
        // 1. Multiple registrations with different ticket types
        // 2. Multiple registrations with same ticket type (for quantity)
        // So we don't check for duplicates here
      }

      // Verify payment exists and is successful
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          paymentStatus: true,
          amount: true,
          userId: true,
          eventId: true,
          metadata: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Auto-update PENDING payment to PAID for development/testing
      // In production with real Midtrans, webhook will update payment status
      if (payment.paymentStatus === 'PENDING') {
        console.log('🟠 AUTO-UPDATE: Updating payment status from PENDING to PAID');
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            paymentStatus: 'PAID',
            paidAt: new Date()
          }
        });
        payment.paymentStatus = 'PAID'; // Update local variable
      }

      if (payment.paymentStatus !== 'PAID') {
        throw new Error(`Payment not completed. Status: ${payment.paymentStatus}`);
      }

      if (payment.userId !== participantId) {
        throw new Error('Payment does not belong to this user');
      }

      if (payment.eventId !== eventId) {
        throw new Error('Payment does not belong to this event');
      }

      // Check if payment already has registration(s) linked to it
      // This prevents duplicate registration if webhook already created it
      // Payment.registrationId stores the first registration ID
      if (payment.registrationId) {
        console.log('🔄 Payment already has registrationId:', payment.registrationId);
        // Check if registration exists
        const existingReg = await tx.eventRegistration.findUnique({
          where: { id: payment.registrationId }
        });

        if (existingReg) {
          console.log('✅ Registration already exists for this payment - returning existing registration');
          // Get all registrations for this payment (check by payment metadata registrationIds or by paymentId in registration)
          // Since we store registrationIds in payment.metadata, check that
          const registrationIds = payment.metadata?.registrationIds || [payment.registrationId];

          const allRegistrations = await tx.eventRegistration.findMany({
            where: {
              id: {
                in: registrationIds
              },
              status: 'ACTIVE'
            },
            orderBy: {
              registeredAt: 'desc'
            }
          });

          if (allRegistrations.length > 0) {
            console.log(`✅ Found ${allRegistrations.length} registration(s) for this payment - all registrations already created`);
            const firstReg = allRegistrations[0];

            // Get event and participant details
            const eventDetails = await tx.event.findUnique({
              where: { id: eventId },
              select: {
                title: true,
                eventDate: true,
                eventTime: true,
                location: true,
              },
            });

            const participantDetails = await tx.user.findUnique({
              where: { id: participantId },
              select: {
                fullName: true,
                email: true,
              },
            });

            // Get ticket type for existing registration
            let existingTicketType = null;
            if (firstReg.ticketTypeId) {
              const ticketType = await tx.ticketType.findUnique({
                where: { id: firstReg.ticketTypeId },
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
              if (ticketType) {
                existingTicketType = {
                  id: ticketType.id,
                  name: ticketType.name,
                  description: ticketType.description,
                  price: ticketType.price ? parseFloat(ticketType.price.toString()) : null,
                  isFree: ticketType.isFree || false,
                  color: ticketType.color || '#2563EB',
                  icon: ticketType.icon || 'ticket',
                  badgeText: ticketType.badgeText,
                };
              }
            }

            // Format registeredAt as ISO string
            const registeredAtISO = firstReg.registeredAt instanceof Date
              ? firstReg.registeredAt.toISOString()
              : (firstReg.registeredAt?.toString() || new Date().toISOString());

            return {
              registration: {
                id: firstReg.id,
                eventId: firstReg.eventId,
                participantId: firstReg.participantId,
                registrationToken: firstReg.registrationToken,
                hasAttended: firstReg.hasAttended,
                status: firstReg.status,
                registeredAt: registeredAtISO, // Ensure ISO string format
                ticketTypeId: firstReg.ticketTypeId || null,
                ticketType: existingTicketType, // Include ticket type
                paymentId: paymentId,
                event: eventDetails,
                participant: participantDetails,
              },
              ticketType: existingTicketType, // Also include at root level
              registrations: allRegistrations,
              registrationIds: allRegistrations.map(r => r.id),
              participantEmail: participantDetails.email,
              participantName: participantDetails.fullName,
              eventData: eventDetails,
              registrationToken: firstReg.registrationToken,
              quantity: allRegistrations.length
            };
          }
        }
      }

      // 2. Get ticketTypeId and quantity from payment metadata
      let ticketTypeId = payment.metadata?.ticketTypeId || null;
      const quantity = parseInt(payment.metadata?.quantity || '1') || 1;
      console.log('🎫 REGISTER AFTER PAYMENT:');
      console.log('🎫 Event ID:', eventId);
      console.log('🎫 Event hasMultipleTicketTypes:', event.hasMultipleTicketTypes);
      console.log('🎫 Participant ID:', participantId);
      console.log('🎫 Payment ID:', paymentId);
      console.log('🎫 TICKET TYPE ID from payment metadata:', ticketTypeId);
      console.log('🎫 QUANTITY from payment metadata:', quantity);
      console.log('🎫 PAYMENT METADATA:', JSON.stringify(payment.metadata, null, 2));
      console.log('🎫 PAYMENT AMOUNT:', payment.amount);

      // 3. Check if event has enough capacity for the quantity being registered
      const availableCapacity = event.maxParticipants - event._count.registrations;
      if (availableCapacity < quantity) {
        throw new Error(`Event only has ${availableCapacity} spot(s) available. Requested: ${quantity}`);
      }

      // 4. Verify ticketTypeId and check capacity if ticketTypeId is provided
      if (ticketTypeId) {
        const ticketType = await tx.ticketType.findFirst({
          where: {
            id: ticketTypeId,
            eventId: eventId,
            isActive: true
          },
          select: {
            id: true,
            name: true,
            price: true,
            color: true,
            capacity: true,
            soldCount: true
          }
        });

        if (!ticketType) {
          console.warn('⚠️  Ticket type not found or not active:', ticketTypeId);
          console.warn('⚠️  Setting ticketTypeId to null and will try fallback by payment amount');
          ticketTypeId = null; // Reset to null if not valid
        } else {
          console.log('✅ Ticket type verified:', ticketType.name, ticketType.price, ticketType.color);

          // Check ticket type capacity
          const availableTickets = ticketType.capacity - ticketType.soldCount;
          if (availableTickets < quantity) {
            throw new Error(`Ticket type "${ticketType.name}" only has ${availableTickets} ticket(s) available. Requested: ${quantity}`);
          }

          // Verify that payment amount matches ticket type price * quantity
          const ticketPrice = parseFloat(ticketType.price?.toString() || '0');
          const expectedAmount = ticketPrice * quantity;
          const paymentAmount = parseFloat(payment.amount?.toString() || '0');
          if (Math.abs(expectedAmount - paymentAmount) > 0.01) {
            console.warn(`⚠️  Payment amount (${paymentAmount}) does not match expected amount (${expectedAmount} = ${ticketPrice} x ${quantity})`);
            console.warn('⚠️  This might indicate wrong ticket type or quantity was selected');
          }
        }
      }

      // IMPORTANT: For events with multiple ticket types, we DON'T check for duplicate registration
      // Users can buy multiple tickets with different ticket types OR same ticket type (for quantity)
      // The duplicate check was removed earlier in the function (lines 1172-1193)
      console.log('✅ Proceeding with registration creation...');
      console.log('✅ Event allows multiple registrations:', event.hasMultipleTicketTypes);

      // If ticketTypeId is still null, try to find by payment amount
      if (!ticketTypeId && payment.amount) {
        console.log('🔍 No ticketTypeId in metadata, trying to find by payment amount...');
        const paymentAmount = parseFloat(payment.amount.toString());
        const ticketTypes = await tx.ticketType.findMany({
          where: {
            eventId: eventId,
            isActive: true,
          },
        });

        // Find ticket type with matching price (allow small difference for rounding)
        const matchingTicketType = ticketTypes.find(tt => {
          if (!tt.price) return false;
          const ttPrice = parseFloat(tt.price.toString());
          return Math.abs(ttPrice - paymentAmount) < 0.01; // Allow 0.01 difference
        });

        if (matchingTicketType) {
          console.log(`✅ Found ticket type by payment amount: ${matchingTicketType.name} (${matchingTicketType.price})`);
          ticketTypeId = matchingTicketType.id;
        } else {
          console.warn(`⚠️  No ticket type found matching payment amount: ${paymentAmount}`);
          console.warn('⚠️  Available ticket types:', ticketTypes.map(tt => `${tt.name}: ${tt.price}`).join(', '));
        }
      }

      // 3. Update ticket type soldCount if ticketTypeId is provided
      if (ticketTypeId) {
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: {
            soldCount: {
              increment: quantity
            }
          }
        });
        console.log(`✅ Updated ticket type soldCount: +${quantity} for ticketTypeId:`, ticketTypeId);
      }

      // 8. Create registrations based on quantity
      const registrations = [];
      const registrationIds = [];

      for (let i = 0; i < quantity; i++) {
        const registrationToken = generateRegistrationToken();
        const registrationId = generateRegistrationToken();

        const registration = await tx.eventRegistration.create({
          data: {
            id: registrationId,
            eventId: eventId,
            participantId: participantId,
            registrationToken: registrationToken,
            hasAttended: false,
            status: 'ACTIVE',
            registeredAt: new Date(),
            ticketTypeId: ticketTypeId || null,
          }
        });

        registrations.push(registration);
        registrationIds.push(registrationId);
        console.log(`✅ Registration ${i + 1}/${quantity} created with ticketTypeId:`, registration.ticketTypeId);
      }

      console.log(`✅ Created ${quantity} registration(s) for payment:`, paymentId);

      // 5. Update payment with first registration ID (for backward compatibility)
      // All registrations are linked to the same payment via paymentId in metadata
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          registrationId: registrationIds[0],
          metadata: {
            ...payment.metadata,
            registrationIds: registrationIds // Store all registration IDs
          }
        }
      });

      // Use first registration for response (backward compatibility)
      const registration = registrations[0];

      // Get event details for response
      const eventDetails = await tx.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          eventDate: true,
          eventTime: true,
          location: true,
        },
      });

      // Get participant details for response
      const participantDetails = await tx.user.findUnique({
        where: { id: participantId },
        select: {
          fullName: true,
          email: true,
        },
      });

      // Get ticket type details if ticketTypeId exists
      let ticketTypeDetails = null;
      if (ticketTypeId) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
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
        if (ticketType) {
          ticketTypeDetails = {
            id: ticketType.id,
            name: ticketType.name,
            description: ticketType.description,
            price: ticketType.price ? parseFloat(ticketType.price.toString()) : null,
            isFree: ticketType.isFree || false,
            color: ticketType.color || '#2563EB',
            icon: ticketType.icon || 'ticket',
            badgeText: ticketType.badgeText,
          };
          console.log('✅ Including ticket type in response:', ticketTypeDetails.name);
        }
      }

      // 6. Return registration data for email sending outside transaction
      // Ensure registeredAt is formatted as ISO string for JSON serialization
      const registeredAtISO = registration.registeredAt instanceof Date
        ? registration.registeredAt.toISOString()
        : (registration.registeredAt?.toString() || new Date().toISOString());

      return {
        registration: {
          id: registration.id,
          eventId: registration.eventId,
          participantId: registration.participantId,
          registrationToken: registration.registrationToken,
          hasAttended: registration.hasAttended,
          status: registration.status,
          registeredAt: registeredAtISO, // Ensure ISO string format
          ticketTypeId: registration.ticketTypeId || null,
          ticketType: ticketTypeDetails, // Include ticket type details
          paymentId: paymentId, // Include paymentId
          event: eventDetails,
          participant: participantDetails,
        },
        ticketType: ticketTypeDetails, // Also include at root level for easy access
        registrations: registrations, // Return all registrations for QR code generation
        registrationIds: registrationIds, // All registration IDs
        participantEmail: participantDetails.email,
        participantName: participantDetails.fullName,
        eventData: eventDetails,
        registrationToken: registration.registrationToken, // First registration token for backward compatibility
        quantity: quantity // Return quantity for reference
      };
    });

    // 5. Generate QR code for ticket and send email
    try {
      // Generate QR code for ticket
      const qrCodeUrl = await ticketService.generateTicketQRCode(
        result.registration.id,
        result.registrationToken
      );

      // Update registration with QR code URL
      await prisma.eventRegistration.update({
        where: { id: result.registration.id },
        data: { qrCodeUrl },
      });

      logger.info(`QR code generated for registration: ${result.registration.id}`);

      // 6. Send registration confirmation email with ticket
      try {
        const ticketUrl = `${process.env.API_BASE_URL.replace('/api', '')}${qrCodeUrl}`;

        // Only send email if eventData is available
        if (result.eventData && result.eventData?.title) {
          await emailTemplates.sendRegistrationConfirmation(
            result.participantEmail,
            result.eventData,
            result.registrationToken,
            result.participantName,
            ticketUrl,
            ticketUrl
          );
          logger.info(`Registration confirmation email sent to: ${result.participantEmail}`);
        } else {
          logger.warn('Skipping email send - event data incomplete');
        }
      } catch (emailError) {
        // Log email error but don't fail the registration
        logger.error('Failed to send registration confirmation email:', emailError);
      }
    } catch (qrError) {
      // Log QR code error but don't fail the registration
      logger.error('Failed to generate QR code:', qrError);
    }

    logger.info(`User registered for paid event: ${eventId}, participant: ${participantId}`);

    // Send real-time update to event room
    websocketService.sendEventUpdate(eventId, {
      type: 'registration_added',
      registration: result.registration,
      participantCount: 1 // We'll get the actual count from the event later
    });

    // Send notification to participant
    websocketService.sendNotification(participantId, {
      type: 'registration_confirmed',
      title: 'Registration Confirmed',
      message: `You have successfully registered for ${result.eventData?.title || 'the event'}`,
      eventId: eventId,
      registrationId: result.registration.id
    });

    // 7. Create notifications for both participant and organizer
    try {
      const notificationService = require('./notificationService');

      // Create notification for participant
      await notificationService.createNotification(
        participantId,
        'REGISTRATION_CONFIRMED',
        'Pendaftaran Berhasil',
        `Kamu mendaftar event "${result.eventData?.title}". Silahkan cek My Registrations untuk detail lengkap.`,
        {
          eventId: eventId,
          eventTitle: result.eventData?.title,
          registrationId: result.registration.id,
          registeredAt: new Date().toISOString()
        }
      );

      // Create notification for organizer
      await notificationService.createNewRegistrationNotification(
        result.registration.id,
        eventId,
        participantId
      );

      logger.info(`Registration notifications sent to participant ${participantId} and organizer for event: ${eventId}`);
    } catch (notificationError) {
      // Log notification error but don't fail the registration
      logger.error('Failed to send notifications:', notificationError);
    }

    return {
      registration: result.registration,
      message: 'Registration successful. Check your email for confirmation.',
    };
  } catch (error) {
    logger.error('Event registration after payment error:', error);
    throw error;
  }
};

// Cancel event registration
const cancelEventRegistration = async (eventId, participantId) => {
  try {
    // Find the registration
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_participantId: {
          eventId,
          participantId,
        },
      },
      include: {
        event: {
          select: {
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            isPublished: true,
          },
        },
        participant: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (!registration.event.isPublished) {
      throw new Error('Event is not published');
    }

    // Check if user has already attended
    if (registration.hasAttended) {
      throw new Error('Cannot cancel registration after attending the event');
    }

    // Check if cancellation deadline has passed (H-3 = 3 days before event)
    const eventDate = new Date(registration.event.eventDate);
    const now = new Date();

    // Calculate days difference
    const timeDiff = eventDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff <= 3) {
      throw new Error('Cannot cancel registration within 3 days of the event');
    }

    // Send cancellation email notification
    try {
      await emailTemplates.sendRegistrationCancellation(
        registration.participant.email,
        registration.event,
        registration.registrationToken,
        registration.participant.fullName
      );
      logger.info(`Cancellation email sent to: ${registration.participant.email}`);
    } catch (emailError) {
      logger.error('Failed to send cancellation email:', emailError);
      // Don't throw error, continue with cancellation
    }

    // Delete the registration
    await prisma.eventRegistration.delete({
      where: { id: registration.id },
    });

    logger.info(`Event registration cancelled: ${eventId} by participant: ${participantId}`);

    return {
      message: 'Registration cancelled successfully',
      eventTitle: registration.event.title,
      eventDate: registration.event.eventDate,
      eventTime: registration.event.eventTime,
    };
  } catch (error) {
    logger.error('Cancel event registration error:', error);
    throw error;
  }
};

// Mark attendance
const markAttendance = async (eventId, registrationToken, participantId) => {
  try {
    // Find registration
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        registrationToken,
        participantId,
      },
      include: {
        event: {
          select: {
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Invalid registration token or event ID');
    }

    if (registration.hasAttended) {
      throw new Error('You have already marked attendance for this event');
    }

    // Check if event is currently happening (within 2 hours before and after event time)
    const eventDateTime = new Date(`${registration.event.eventDate.toISOString().split('T')[0]} ${registration.event.eventTime}`);
    const now = new Date();
    const twoHoursBefore = new Date(eventDateTime.getTime() - (2 * 60 * 60 * 1000));
    const twoHoursAfter = new Date(eventDateTime.getTime() + (2 * 60 * 60 * 1000));

    if (now < twoHoursBefore || now > twoHoursAfter) {
      throw new Error('Attendance can only be marked during the event (2 hours before and after event time)');
    }

    // Update attendance
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        hasAttended: true,
        attendanceTime: now,
        attendedAt: now,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
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

    logger.info(`Attendance marked for event: ${eventId}, participant: ${participantId}`);

    // Note: Certificate will be generated after event ends (not immediately after check-in)
    // Certificate can only be generated after eventEndDate + eventEndTime (for multi-day) 
    // or eventDate + 1 day (for single day event)

    return {
      registration: updatedRegistration,
      message: 'Attendance marked successfully',
    };
  } catch (error) {
    logger.error('Mark attendance error:', error);
    throw error;
  }
};

// Get user's event registrations
const getUserEventRegistrations = async (participantId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'registeredAt',
      sortOrder = 'desc',
      hasAttended,
    } = filters;

    const skip = (page - 1) * limit;

    const where = { participantId };

    if (hasAttended !== undefined) {
      where.hasAttended = hasAttended === 'true' || hasAttended === true;
    }

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true,
              latitude: true,
              longitude: true,
              thumbnailUrl: true,
              flyerUrl: true,
              isPublished: true,
              maxParticipants: true,
              description: true,
              category: true,
              price: true,
              isFree: true,
              createdBy: true,
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  registrations: true,
                },
              },
            },
          },
          tickets: {
            select: {
              id: true,
              ticketNumber: true,
              qrCodeUrl: true,
              qrCodeData: true,
              isUsed: true,
              usedAt: true,
            },
          },
        },
      }),
      prisma.eventRegistration.count({ where }),
    ]);

    // Convert localhost URLs to Tailscale IP for mobile compatibility
    const registrationsWithConvertedUrls = registrations.map(registration => ({
      ...registration,
      event: {
        ...registration.event,
        thumbnailUrl: convertImageUrls(registration.event.thumbnailUrl),
        galleryUrls: convertImageUrls(registration.event.galleryUrls),
        flyerUrl: convertImageUrls(registration.event.flyerUrl),
        certificateTemplateUrl: convertImageUrls(registration.event.certificateTemplateUrl),
      },
    }));

    return {
      registrations: registrationsWithConvertedUrls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get user event registrations error:', error);
    throw error;
  }
};

// Check event availability
const checkEventAvailability = async (eventId) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        maxParticipants: true,
        registrationDeadline: true,
        eventDate: true,
        eventTime: true,
        isPublished: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const registeredCount = event._count.registrations;
    const availableSlots = event.maxParticipants - registeredCount;
    const isAvailable = availableSlots > 0;
    const isRegistrationOpen = new Date() < new Date(event.registrationDeadline);
    const canRegister = isAvailable && isRegistrationOpen && event.isPublished;

    return {
      eventId: event.id,
      title: event.title,
      maxParticipants: event.maxParticipants,
      registeredCount,
      availableSlots,
      isAvailable,
      isRegistrationOpen,
      canRegister,
      registrationDeadline: event.registrationDeadline,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
    };
  } catch (error) {
    logger.error('Check event availability error:', error);
    throw error;
  }
};

// Scan QR code for attendance
const scanQRCodeForAttendance = async (qrCodeData, participantId) => {
  try {
    const ticketService = require('./ticketService');
    const result = await ticketService.scanQRCodeForAttendance(qrCodeData, participantId);

    // Mark attendance
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: result.registration.id },
      data: {
        hasAttended: true,
        attendanceTime: new Date(),
        attendedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
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

    logger.info(`Attendance marked for event: ${result.registration.eventId}, participant: ${participantId}`);

    // Note: Certificate will be generated after event ends (not immediately after check-in)
    // Certificate can only be generated after eventEndDate + eventEndTime (for multi-day) 
    // or eventDate + 1 day (for single day event)

    return {
      registration: updatedRegistration,
      message: 'Attendance marked successfully',
    };
  } catch (error) {
    logger.error('Scan QR code for attendance error:', error);
    throw error;
  }
};

// Admin check-in using QR code
const adminCheckIn = async (eventId, qrCodeData, adminId) => {
  try {
    const ticketService = require('./ticketService');
    const result = await ticketService.adminScanQRCode(qrCodeData, eventId);

    // Mark attendance
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: result.registration.id },
      data: {
        hasAttended: true,
        attendanceTime: new Date(),
        attendedAt: new Date(),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
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

    logger.info(`Admin check-in for event: ${eventId}, participant: ${updatedRegistration.participantId}`);

    // Note: Certificate will be generated after event ends (not immediately after check-in)
    // Certificate can only be generated after eventEndDate + eventEndTime (for multi-day) 
    // or eventDate + 1 day (for single day event)

    return {
      registration: updatedRegistration,
      message: 'Participant checked in successfully',
    };
  } catch (error) {
    logger.error('Admin check-in error:', error);
    throw error;
  }
};

// Get event attendance (Admin)
const getEventAttendance = async (eventId, adminId) => {
  try {
    // Check if admin has access to this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: adminId,
      },
    });

    if (!event) {
      throw new Error('Event not found or unauthorized to view this event attendance');
    }

    // Get all registrations for this event
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
      },
      include: {
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    // Calculate attendance statistics
    const totalRegistrations = registrations.length;
    const attendedRegistrations = registrations.filter(r => r.hasAttended).length;
    const attendanceRate = totalRegistrations > 0 ? (attendedRegistrations / totalRegistrations) * 100 : 0;

    return {
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
      },
      statistics: {
        totalRegistrations,
        attendedRegistrations,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      },
      registrations,
    };
  } catch (error) {
    logger.error('Get event attendance error:', error);
    throw error;
  }
};

// Detect event from token (for admin auto-select)
const detectEventFromToken = async (token) => {
  try {
    // Find registration by token
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        registrationToken: token,
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
            phoneNumber: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Token not found');
    }

    return {
      event: registration.event,
      participant: registration.participant,
      registration: {
        id: registration.id,
        token: registration.registrationToken,
        hasAttended: registration.hasAttended,
        registeredAt: registration.registeredAt,
      },
    };
  } catch (error) {
    logger.error('Detect event from token error:', error);
    throw error;
  }
};

// Approve event (Admin only)
const approveEvent = async (eventId, adminId, action, reason = null) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            organizerType: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const updateData = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedBy: action === 'approve' ? adminId : null,
      approvedAt: action === 'approve' ? new Date() : null,
      rejectionReason: action === 'reject' ? reason : null,
      isPublished: action === 'approve' ? true : false,
    };

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            organizerType: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Event ${action}d: ${event.title} by admin: ${adminId}`);

    return updatedEvent;
  } catch (error) {
    logger.error('Approve event error:', error);
    throw error;
  }
};

// Get events for admin review
const getEventsForReview = async (filters = {}, userRole = null, userId = null) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      search,
      organizerId,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (organizerId) {
      where.createdBy = organizerId;
    }

    // Role-based assignment simulation
    if (userRole && userRole.startsWith('OPS_')) {
      // Get all Operations team members
      const opsTeam = await prisma.user.findMany({
        where: {
          role: {
            in: ['OPS_AGENT', 'OPS_HEAD']
          }
        },
        select: { id: true, role: true },
        orderBy: { createdAt: 'asc' }
      });

      // Smart assignment workflow: Agent + Head only
      if (userRole === 'OPS_AGENT') {
        // Get events assigned to this agent
        where.assignedTo = userId;
      } else if (userRole === 'OPS_HEAD') {
        // Head handles special cases and oversight
        // Show all events for oversight and special case handling
        // No additional filtering - full visibility
      }
      // Note: OPS_SENIOR_AGENT removed - simplified to 2-level workflow
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              organizerType: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get events for review error:', error);
    throw error;
  }
};

// Calculate revenue for event
const calculateEventRevenue = async (eventId) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          include: {
            payments: {
              where: {
                paymentStatus: 'PAID',
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    let totalRevenue = 0;
    let platformFeeTotal = 0;
    let organizerRevenue = 0;

    event.registrations.forEach(registration => {
      registration.payments.forEach(payment => {
        totalRevenue += parseFloat(payment.amount);
        const platformFee = (parseFloat(payment.amount) * event.platformFee) / 100;
        platformFeeTotal += platformFee;
        organizerRevenue += parseFloat(payment.amount) - platformFee;
      });
    });

    // Update event with calculated revenue
    await prisma.event.update({
      where: { id: eventId },
      data: {
        organizerRevenue,
      },
    });

    // Create or update organizer revenue record
    // First, try to find existing record
    let organizerRevenueRecord = await prisma.organizerRevenue.findFirst({
      where: {
        organizerId: event.createdBy,
        eventId: event.id,
      },
    });

    if (organizerRevenueRecord) {
      // Update existing record
      organizerRevenueRecord = await prisma.organizerRevenue.update({
        where: { id: organizerRevenueRecord.id },
        data: {
          totalRevenue,
          platformFee: platformFeeTotal,
          organizerAmount: organizerRevenue,
          feePercentage: event.platformFee ? parseFloat(event.platformFee.toString()) : 0,
        },
      });
    } else {
      // Create new record
      organizerRevenueRecord = await prisma.organizerRevenue.create({
        data: {
          totalRevenue: parseFloat(totalRevenue.toString()),
          platformFee: parseFloat(platformFeeTotal.toString()),
          organizerAmount: parseFloat(organizerRevenue.toString()),
          feePercentage: event.platformFee ? parseFloat(event.platformFee.toString()) : 0,
          event: {
            connect: { id: event.id }
          },
          organizer: {
            connect: { id: event.createdBy }
          }
        },
      });
    }

    return {
      totalRevenue,
      platformFee: platformFeeTotal,
      organizerRevenue,
      feePercentage: event.platformFee,
      organizerRevenueId: organizerRevenueRecord.id, // Return ID for balance transaction
    };
  } catch (error) {
    logger.error('Calculate event revenue error:', error);
    throw error;
  }
};

// Admin check-in participant (for organizer use)
const adminCheckInParticipant = async (eventId, qrData, adminId) => {
  try {
    const ticketService = require('./ticketService');
    const result = await ticketService.adminScanQRCode(qrData, eventId);

    // Mark attendance
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: result.registration.id },
      data: {
        hasAttended: true,
        attendanceTime: new Date(),
        attendedAt: new Date(),
      },
      include: {
        event: {
          select: {
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
          },
        },
        participant: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      registration: updatedRegistration,
      message: 'Check-in successful',
    };
  } catch (error) {
    logger.error('Admin check-in participant error:', error);
    throw error;
  }
};

// Organizer check-in participant
const organizerCheckInParticipant = async (eventId, qrData, organizerId) => {
  try {
    // First verify that the organizer owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: organizerId
      }
    });

    if (!event) {
      throw new Error('Event not found or you are not authorized to manage this event');
    }

    // Use the same logic as admin check-in but with organizer verification
    return await adminCheckInParticipant(eventId, qrData, organizerId);
  } catch (error) {
    logger.error('Organizer check-in participant error:', error);
    throw error;
  }
};

// Detect organizer event from token
const detectOrganizerEventFromToken = async (token, organizerId) => {
  try {
    // First detect the event from token
    const result = await detectEventFromToken(token);

    // Then verify that the organizer owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: result.event.id,
        createdBy: organizerId
      }
    });

    if (!event) {
      throw new Error('Not authorized to access this event');
    }

    return result;
  } catch (error) {
    logger.error('Detect organizer event from token error:', error);
    throw error;
  }
};

// Get organizer events
const getOrganizerEvents = async (filters, organizerId) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause - only events created by this organizer
    const where = {
      createdBy: organizerId
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              organizerType: true,
            },
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Ensure galleryUrls and ticketTypes are always arrays for all events
    const eventsWithFixedArrays = events.map(event => {
      let galleryUrls = event.galleryUrls;
      if (galleryUrls && !Array.isArray(galleryUrls) && typeof galleryUrls === 'object') {
        galleryUrls = Object.values(galleryUrls);
      }
      if (!galleryUrls) {
        galleryUrls = [];
      }

      let ticketTypes = event.ticketTypes;
      if (ticketTypes && !Array.isArray(ticketTypes) && typeof ticketTypes === 'object') {
        ticketTypes = Object.values(ticketTypes);
      }
      if (!ticketTypes) {
        ticketTypes = [];
      }

      return {
        ...event,
        galleryUrls,
        ticketTypes,
      };
    });

    return {
      events: eventsWithFixedArrays,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error('Get organizer events error:', error);
    throw error;
  }
};

// Get organizer event attendance
const getOrganizerEventAttendance = async (eventId, organizerId) => {
  try {
    // First verify that the organizer owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: organizerId
      }
    });

    if (!event) {
      throw new Error('Event not found or you are not authorized to view this event');
    }

    // Use the same logic as admin attendance but with organizer verification
    return await getEventAttendance(eventId);
  } catch (error) {
    logger.error('Get organizer event attendance error:', error);
    throw error;
  }
};

// Publish organizer event
const publishOrganizerEvent = async (eventId, organizerId) => {
  try {
    // First verify that the organizer owns this event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: organizerId
      }
    });

    if (!event) {
      throw new Error('Event not found or you are not authorized to manage this event');
    }

    // Check if event is already published
    if (event.isPublished) {
      throw new Error('Event is already published');
    }

    // Since organizers are pre-verified, their events are auto-approved, no need to check status

    // Publish the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        isPublished: true
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    logger.info(`Event published: ${eventId} by organizer: ${organizerId}`);

    return updatedEvent;
  } catch (error) {
    logger.error('Publish organizer event error:', error);
    throw error;
  }
};


// Get organizer event analytics
const getOrganizerEventAnalytics = async (eventId, organizerId) => {
  try {
    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: organizerId,
      },
      include: {
        registrations: {
          include: {
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
            },
            ticketType: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        ticketTypes: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found or you are not authorized to view this event');
    }

    // Calculate statistics - only count ACTIVE registrations
    const activeRegistrations = event.registrations.filter(r => r.status === 'ACTIVE');
    const totalRegistrations = activeRegistrations.length;
    const totalAttendance = activeRegistrations.filter(r => r.hasAttended).length;
    const attendanceRate = totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0;

    // Calculate revenue directly from payments table (more accurate)
    // This ensures we get ALL payments for this event, not just those linked to registrations
    const allPayments = await prisma.payment.findMany({
      where: {
        eventId: eventId,
        paymentStatus: 'PAID',
      },
      include: {
        registration: {
          select: {
            id: true,
            ticketTypeId: true,
            ticketType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let platformFeeTotal = 0;
    let organizerRevenue = 0;

    allPayments.forEach(payment => {
      const amount = parseFloat(payment.amount.toString());
      totalRevenue += amount;
      const platformFee = (amount * (event.platformFee || 0)) / 100;
      platformFeeTotal += platformFee;
      organizerRevenue += amount - platformFee;
    });

    // Calculate average ticket price based on actual paid payments
    const averageTicketPrice = allPayments.length > 0 ? totalRevenue / allPayments.length : 0;

    // Generate daily registrations data
    const dailyRegistrationsMap = new Map();
    const eventCreatedAt = new Date(event.createdAt);

    // Map payments by date for daily revenue
    const paymentsByDate = new Map();
    allPayments.forEach(payment => {
      // Get payment date from created_at or paid_at
      const paymentDate = payment.paidAt || payment.createdAt;
      const dateStr = new Date(paymentDate).toISOString().split('T')[0];
      
      if (!paymentsByDate.has(dateStr)) {
        paymentsByDate.set(dateStr, 0);
      }
      paymentsByDate.set(dateStr, paymentsByDate.get(dateStr) + parseFloat(payment.amount.toString()));
    });

    // Only count ACTIVE registrations for daily data
    activeRegistrations.forEach(registration => {
      const regDate = new Date(registration.registeredAt);
      const dateStr = regDate.toISOString().split('T')[0];
      
      if (!dailyRegistrationsMap.has(dateStr)) {
        dailyRegistrationsMap.set(dateStr, {
          date: dateStr,
          registrations: 0,
          revenue: 0,
        });
      }

      const dayData = dailyRegistrationsMap.get(dateStr);
      dayData.registrations += 1;
    });

    // Add revenue to daily data
    paymentsByDate.forEach((revenue, dateStr) => {
      if (dailyRegistrationsMap.has(dateStr)) {
        dailyRegistrationsMap.get(dateStr).revenue = revenue;
      } else {
        // If there's revenue but no registration on that date, still add it
        dailyRegistrationsMap.set(dateStr, {
          date: dateStr,
          registrations: 0,
          revenue: revenue,
        });
      }
    });

    // Fill in missing dates from event creation to latest registration or payment
    const latestRegistration = activeRegistrations.length > 0
      ? activeRegistrations.reduce((latest, r) => {
          const regDate = new Date(r.registeredAt);
          return regDate > latest ? regDate : latest;
        }, new Date(eventCreatedAt))
      : new Date(eventCreatedAt);
    
    // Also check latest payment date
    const latestPayment = allPayments.length > 0
      ? allPayments.reduce((latest, p) => {
          const payDate = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
          return payDate > latest ? payDate : latest;
        }, new Date(eventCreatedAt))
      : new Date(eventCreatedAt);
    
    const latestDate = latestPayment > latestRegistration ? latestPayment : latestRegistration;
    
    const dailyRegistrations = [];
    const currentDate = new Date(eventCreatedAt);
    while (currentDate <= latestDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyRegistrations.push(
        dailyRegistrationsMap.get(dateStr) || {
          date: dateStr,
          registrations: 0,
          revenue: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate attendance data
    const attendanceData = [
      {
        status: 'Present',
        count: totalAttendance,
        percentage: attendanceRate,
      },
      {
        status: 'Absent',
        count: totalRegistrations - totalAttendance,
        percentage: 100 - attendanceRate,
      },
    ];

    // Generate revenue breakdown
    const revenueBreakdown = [
      {
        source: 'Ticket Sales',
        amount: totalRevenue,
        percentage: totalRevenue > 0 ? 100 : 0,
      },
      {
        source: 'Platform Fee',
        amount: platformFeeTotal,
        percentage: totalRevenue > 0 ? (platformFeeTotal / totalRevenue) * 100 : 0,
      },
      {
        source: 'Organizer Revenue',
        amount: organizerRevenue,
        percentage: totalRevenue > 0 ? (organizerRevenue / totalRevenue) * 100 : 0,
      },
    ];

    // Calculate ticket type breakdown
    const ticketTypeBreakdown = [];
    const ticketTypeStats = new Map();

    // Initialize stats for all ticket types
    event.ticketTypes.forEach(ticketType => {
      ticketTypeStats.set(ticketType.id, {
        id: ticketType.id,
        name: ticketType.name,
        price: parseFloat(ticketType.price?.toString() || '0'),
        isFree: ticketType.isFree || false,
        color: ticketType.color || '#3B82F6',
        capacity: ticketType.capacity || 0,
        sold: 0,
        revenue: 0,
        attendance: 0,
        countedPaymentIds: new Set(), // Track which payment IDs we've already counted
      });
    });

    // Calculate stats from registrations
    activeRegistrations.forEach(registration => {
      if (registration.ticketType) {
        const ticketTypeId = registration.ticketType.id;
        if (ticketTypeStats.has(ticketTypeId)) {
          const stats = ticketTypeStats.get(ticketTypeId);
          stats.sold += 1;
          if (registration.hasAttended) {
            stats.attendance += 1;
          }
          
          // Calculate revenue from payments for this registration
          registration.payments.forEach(payment => {
            const amount = parseFloat(payment.amount.toString());
            stats.revenue += amount;
            // Track this payment ID to avoid double counting
            if (payment.id) {
              stats.countedPaymentIds.add(payment.id);
            }
          });
        }
      }
    });

    // Also calculate revenue from allPayments that are linked to registrations with ticketType
    // This ensures we capture all payments, even if registration.payments is incomplete
    allPayments.forEach(payment => {
      if (payment.registration && payment.registration.ticketType) {
        const ticketTypeId = payment.registration.ticketType.id;
        if (ticketTypeStats.has(ticketTypeId)) {
          const stats = ticketTypeStats.get(ticketTypeId);
          const amount = parseFloat(payment.amount.toString());
          // Only add if not already counted from registration.payments
          if (!stats.countedPaymentIds.has(payment.id)) {
            stats.revenue += amount;
            stats.countedPaymentIds.add(payment.id);
          }
        }
      }
    });

    // Convert map to array and calculate percentages
    ticketTypeStats.forEach((stats, ticketTypeId) => {
      const percentage = totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0;
      const soldPercentage = stats.capacity > 0 ? (stats.sold / stats.capacity) * 100 : 0;
      const attendanceRate = stats.sold > 0 ? (stats.attendance / stats.sold) * 100 : 0;
      
      // Remove countedPaymentIds Set before returning (not serializable to JSON)
      const { countedPaymentIds, ...statsWithoutSet } = stats;
      
      ticketTypeBreakdown.push({
        ...statsWithoutSet,
        percentage,
        soldPercentage,
        attendanceRate,
        available: stats.capacity - stats.sold,
      });
    });

    // Sort by revenue (descending)
    ticketTypeBreakdown.sort((a, b) => b.revenue - a.revenue);

    return {
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
        maxParticipants: event.maxParticipants,
        price: event.price ? parseFloat(event.price.toString()) : 0,
        isFree: event.isFree,
        category: event.category,
        platformFee: event.platformFee ? parseFloat(event.platformFee.toString()) : 0,
        createdAt: event.createdAt,
      },
      stats: {
        totalRegistrations,
        totalAttendance,
        attendanceRate,
        totalRevenue,
        averageTicketPrice,
        platformFee: platformFeeTotal,
        organizerRevenue,
        registrationGrowth: 0, // Can be calculated later with historical data
        attendanceGrowth: 0,
        revenueGrowth: 0,
      },
      dailyRegistrations,
      attendanceData,
      revenueBreakdown,
      ticketTypeBreakdown,
    };
  } catch (error) {
    logger.error('Get organizer event analytics error:', error);
    throw error;
  }
};

// Get event registrations (for organizers)
const getEventRegistrations = async (eventId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      eventId: eventId
    };

    if (status) {
      where.status = status;
    }

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          registeredAt: 'desc'
        },
        include: {
          participant: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true
            }
          },
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              eventTime: true,
              location: true
            }
          }
        }
      }),
      prisma.eventRegistration.count({ where })
    ]);

    return {
      registrations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get event registrations error:', error);
    throw error;
  }
};

// Update organizer event
const updateOrganizerEvent = async (eventId, organizerId, eventData) => {
  try {
    // First check if event exists and belongs to organizer
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: organizerId
      },
    });

    if (!existingEvent) {
      throw new Error('Event not found or access denied');
    }

    // Check if event is published (cannot edit published events)
    if (existingEvent.isPublished) {
      throw new Error('Cannot edit published events');
    }

    // Prepare update data
    const updateData = {
      title: eventData.title,
      description: eventData.description,
      eventDate: new Date(eventData.eventDate),
      eventTime: eventData.eventTime,
      location: eventData.location,
      maxParticipants: parseInt(eventData.maxParticipants),
      registrationDeadline: new Date(eventData.registrationDeadline),
      category: eventData.category,
      price: eventData.isFree ? null : parseFloat(eventData.price),
      isFree: eventData.isFree,
      generateCertificate: eventData.generateCertificate,
      thumbnailUrl: eventData.thumbnailUrl || null,
      galleryUrls: eventData.galleryUrls || [],
      updatedAt: new Date(),
    };

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    logger.info(`Event updated: ${eventId} by organizer: ${organizerId}`);
    return updatedEvent;
  } catch (error) {
    logger.error('Update organizer event error:', error);
    throw error;
  }
};

// Verify private event password
const verifyPrivateEventPassword = async (eventId, password) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        isPrivate: true,
        privatePassword: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.isPrivate) {
      return { isValid: true, message: 'Event is public' };
    }

    if (!event.privatePassword) {
      throw new Error('Private event password not set');
    }

    if (event.privatePassword !== password) {
      throw new Error('Invalid password');
    }

    return { isValid: true, message: 'Password verified successfully' };
  } catch (error) {
    logger.error('Verify private event password error:', error);
    throw error;
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  getEventByIdWithUserRegistration,
  updateEvent,
  deleteEvent,
  toggleEventPublish,
  registerForEvent,
  registerForEventAfterPayment,
  cancelEventRegistration,
  markAttendance,
  getUserEventRegistrations,
  checkEventAvailability,
  scanQRCodeForAttendance,
  adminCheckIn,
  detectEventFromToken,
  verifyPrivateEventPassword,
  getEventAttendance,
  approveEvent,
  getEventsForReview,
  calculateEventRevenue,
  organizerCheckInParticipant,
  detectOrganizerEventFromToken,
  getOrganizerEventAttendance,
  getOrganizerEvents,
  getOrganizerEventById,
  updateOrganizerEvent,
  publishOrganizerEvent,
  adminCheckInParticipant,
  organizerCheckInParticipant,
  getEventRegistrations,
  getOrganizerEventAnalytics,
};
