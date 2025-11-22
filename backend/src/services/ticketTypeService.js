const { prisma } = require('../config/database');
const logger = require('../config/logger');

// Create ticket type for event
const createTicketType = async (eventId, ticketTypeData, creatorId) => {
  try {
    logger.info(`🎫 createTicketType called - eventId: ${eventId}, creatorId: ${creatorId}`);
    logger.info(`📦 Ticket type data:`, ticketTypeData);
    
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: creatorId,
      },
    });

    if (!event) {
      logger.error(`❌ Event not found or no permission - eventId: ${eventId}, creatorId: ${creatorId}`);
      throw new Error('Event not found or you do not have permission to modify it');
    }

    logger.info(`✅ Event found: ${event.id}`);

    // Validate ticket type data
    const {
      name,
      description,
      price,
      isFree,
      capacity,
      saleStartDate,
      saleEndDate,
      benefits,
      color,
      icon,
      badgeText,
      minQuantity,
      maxQuantity,
      requiresApproval,
      termsConditions,
      originalPrice,
      discountPercentage,
      promoCode,
      metadata,
    } = ticketTypeData;

    logger.info(`🔍 Validating ticket type - name: ${name}, capacity: ${capacity}, isFree: ${isFree}, price: ${price}, minQuantity: ${minQuantity}, maxQuantity: ${maxQuantity}`);

    // Validation
    if (!name || name.trim().length === 0) {
      logger.error(`❌ Validation failed: Ticket name is required`);
      throw new Error('Ticket name is required');
    }

    if (!capacity || capacity <= 0) {
      logger.error(`❌ Validation failed: Capacity must be greater than 0, got: ${capacity}`);
      throw new Error('Capacity must be greater than 0');
    }

    if (!isFree && (!price || price <= 0)) {
      logger.error(`❌ Validation failed: Price required for paid tickets, got: ${price}`);
      throw new Error('Price is required for paid tickets');
    }

    if (minQuantity && minQuantity < 1) {
      logger.error(`❌ Validation failed: Min quantity must be at least 1, got: ${minQuantity}`);
      throw new Error('Minimum quantity must be at least 1');
    }

    if (maxQuantity && minQuantity && maxQuantity < minQuantity) {
      logger.error(`❌ Validation failed: Max quantity (${maxQuantity}) < min quantity (${minQuantity})`);
      throw new Error('Maximum quantity must be greater than or equal to minimum quantity');
    }

    logger.info(`✅ Validation passed`);


    // Get current sort order
    const lastTicketType = await prisma.ticketType.findFirst({
      where: { eventId },
      orderBy: { sortOrder: 'desc' },
    });

    const sortOrder = lastTicketType ? lastTicketType.sortOrder + 1 : 0;

    logger.info(`💾 Creating ticket type in database...`);
    
    // Create ticket type
    const ticketType = await prisma.ticketType.create({
      data: {
        eventId,
        name: name.trim(),
        description: description?.trim() || null,
        price: isFree ? null : parseFloat(price),
        isFree: isFree || false,
        capacity: parseInt(capacity),
        soldCount: 0,
        saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        benefits: benefits || [],
        isActive: true,
        sortOrder,
        color: color || '#2563EB',
        icon: icon || 'ticket',
        badgeText: badgeText?.trim() || null,
        minQuantity: parseInt(minQuantity) || 1,
        maxQuantity: parseInt(maxQuantity) || 10,
        requiresApproval: requiresApproval || false,
        termsConditions: termsConditions?.trim() || null,
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        promoCode: promoCode?.trim() || null,
        metadata: metadata || null,
      },
    });

    logger.info(`✅ Ticket type created in database: ${ticketType.id}`);

    // Update event to indicate it has multiple ticket types
    logger.info(`🔄 Updating event hasMultipleTicketTypes flag...`);
    await prisma.event.update({
      where: { id: eventId },
      data: { hasMultipleTicketTypes: true },
    });

    logger.info(`✅ Ticket type created successfully: ${ticketType.id} for event: ${eventId}`);
    return ticketType;
  } catch (error) {
    logger.error('Create ticket type error:', error);
    throw error;
  }
};

// Get ticket types for event
const getEventTicketTypes = async (eventId, includeInactive = false) => {
  try {
    const where = { eventId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return ticketTypes;
  } catch (error) {
    logger.error('Get event ticket types error:', error);
    throw error;
  }
};

// Update ticket type
const updateTicketType = async (ticketTypeId, ticketTypeData, creatorId) => {
  try {
    // Verify ownership through event
    const existingTicketType = await prisma.ticketType.findFirst({
      where: { id: ticketTypeId },
      include: {
        event: {
          select: {
            id: true,
            createdBy: true,
          },
        },
      },
    });

    if (!existingTicketType) {
      throw new Error('Ticket type not found');
    }

    if (existingTicketType.event.createdBy !== creatorId) {
      throw new Error('You do not have permission to modify this ticket type');
    }

    const {
      name,
      description,
      price,
      isFree,
      capacity,
      saleStartDate,
      saleEndDate,
      benefits,
      isActive,
      color,
      icon,
      badgeText,
      minQuantity,
      maxQuantity,
      requiresApproval,
      termsConditions,
      originalPrice,
      discountPercentage,
      promoCode,
      metadata,
    } = ticketTypeData;

    // Validation
    if (name && name.trim().length === 0) {
      throw new Error('Ticket name cannot be empty');
    }

    if (capacity && capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }

    if (capacity && capacity < existingTicketType.soldCount) {
      throw new Error(`Cannot reduce capacity below sold count (${existingTicketType.soldCount})`);
    }

    if (!isFree && price && price <= 0) {
      throw new Error('Price must be greater than 0 for paid tickets');
    }

    // Update ticket type
    const updatedTicketType = await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: isFree ? null : parseFloat(price) }),
        ...(isFree !== undefined && { isFree }),
        ...(capacity !== undefined && { capacity: parseInt(capacity) }),
        ...(saleStartDate !== undefined && { saleStartDate: saleStartDate ? new Date(saleStartDate) : null }),
        ...(saleEndDate !== undefined && { saleEndDate: saleEndDate ? new Date(saleEndDate) : null }),
        ...(benefits !== undefined && { benefits }),
        ...(isActive !== undefined && { isActive }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(badgeText !== undefined && { badgeText: badgeText?.trim() || null }),
        ...(minQuantity !== undefined && { minQuantity: parseInt(minQuantity) }),
        ...(maxQuantity !== undefined && { maxQuantity: parseInt(maxQuantity) }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(termsConditions !== undefined && { termsConditions: termsConditions?.trim() || null }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(discountPercentage !== undefined && { discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null }),
        ...(promoCode !== undefined && { promoCode: promoCode?.trim() || null }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    logger.info(`Ticket type updated: ${ticketTypeId}`);
    return updatedTicketType;
  } catch (error) {
    logger.error('Update ticket type error:', error);
    throw error;
  }
};

// Delete ticket type
const deleteTicketType = async (ticketTypeId, creatorId) => {
  try {
    // Verify ownership and check if has registrations
    const ticketType = await prisma.ticketType.findFirst({
      where: { id: ticketTypeId },
      include: {
        event: {
          select: {
            id: true,
            createdBy: true,
          },
        },
        registrations: {
          select: { id: true },
        },
      },
    });

    if (!ticketType) {
      throw new Error('Ticket type not found');
    }

    if (ticketType.event.createdBy !== creatorId) {
      throw new Error('You do not have permission to delete this ticket type');
    }

    if (ticketType.registrations.length > 0) {
      throw new Error('Cannot delete ticket type with existing registrations');
    }

    // Delete ticket type
    await prisma.ticketType.delete({
      where: { id: ticketTypeId },
    });

    // Check if event still has other ticket types
    const remainingTicketTypes = await prisma.ticketType.count({
      where: { eventId: ticketType.event.id },
    });

    // Update event flag if no more ticket types
    if (remainingTicketTypes === 0) {
      await prisma.event.update({
        where: { id: ticketType.event.id },
        data: { hasMultipleTicketTypes: false },
      });
    }

    logger.info(`Ticket type deleted: ${ticketTypeId}`);
    return { success: true };
  } catch (error) {
    logger.error('Delete ticket type error:', error);
    throw error;
  }
};

// Reorder ticket types
const reorderTicketTypes = async (eventId, ticketTypeIds, creatorId) => {
  try {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: creatorId,
      },
    });

    if (!event) {
      throw new Error('Event not found or you do not have permission to modify it');
    }

    // Update sort orders
    const updatePromises = ticketTypeIds.map((ticketTypeId, index) =>
      prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updatePromises);

    logger.info(`Ticket types reordered for event: ${eventId}`);
    return { success: true };
  } catch (error) {
    logger.error('Reorder ticket types error:', error);
    throw error;
  }
};

// Get ticket type by ID
const getTicketTypeById = async (ticketTypeId) => {
  try {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            createdBy: true,
          },
        },
      },
    });

    if (!ticketType) {
      throw new Error('Ticket type not found');
    }

    return ticketType;
  } catch (error) {
    logger.error('Get ticket type by ID error:', error);
    throw error;
  }
};

// Check ticket availability
const checkTicketAvailability = async (ticketTypeId, quantity = 1) => {
  try {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
    });

    if (!ticketType) {
      throw new Error('Ticket type not found');
    }

    if (!ticketType.isActive) {
      throw new Error('Ticket type is not active');
    }

    // Check sale period
    const now = new Date();
    if (ticketType.saleStartDate && now < ticketType.saleStartDate) {
      throw new Error('Ticket sale has not started yet');
    }

    if (ticketType.saleEndDate && now > ticketType.saleEndDate) {
      throw new Error('Ticket sale has ended');
    }

    // Check capacity
    const availableCapacity = ticketType.capacity - ticketType.soldCount;
    if (availableCapacity < quantity) {
      throw new Error(`Only ${availableCapacity} tickets available`);
    }

    // Check quantity limits
    if (quantity < ticketType.minQuantity) {
      throw new Error(`Minimum quantity is ${ticketType.minQuantity}`);
    }

    if (quantity > ticketType.maxQuantity) {
      throw new Error(`Maximum quantity is ${ticketType.maxQuantity}`);
    }

    return {
      available: true,
      availableCapacity,
      ticketType,
    };
  } catch (error) {
    logger.error('Check ticket availability error:', error);
    throw error;
  }
};

// Reserve tickets (increment sold count)
const reserveTickets = async (ticketTypeId, quantity) => {
  try {
    const ticketType = await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        soldCount: {
          increment: quantity,
        },
      },
    });

    logger.info(`Reserved ${quantity} tickets for ticket type: ${ticketTypeId}`);
    return ticketType;
  } catch (error) {
    logger.error('Reserve tickets error:', error);
    throw error;
  }
};

// Release tickets (decrement sold count)
const releaseTickets = async (ticketTypeId, quantity) => {
  try {
    const ticketType = await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: {
        soldCount: {
          decrement: quantity,
        },
      },
    });

    logger.info(`Released ${quantity} tickets for ticket type: ${ticketTypeId}`);
    return ticketType;
  } catch (error) {
    logger.error('Release tickets error:', error);
    throw error;
  }
};

// Get ticket type statistics
const getTicketTypeStats = async (eventId, creatorId) => {
  try {
    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        createdBy: creatorId,
      },
    });

    if (!event) {
      throw new Error('Event not found or you do not have permission to view it');
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
      include: {
        registrations: {
          select: {
            id: true,
            registeredAt: true,
            hasAttended: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const stats = ticketTypes.map(ticketType => {
      const registrations = ticketType.registrations;
      const totalSold = registrations.length;
      const totalAttended = registrations.filter(r => r.hasAttended).length;
      const revenue = ticketType.isFree ? 0 : totalSold * (ticketType.price || 0);

      return {
        id: ticketType.id,
        name: ticketType.name,
        capacity: ticketType.capacity,
        sold: totalSold,
        attended: totalAttended,
        available: ticketType.capacity - totalSold,
        revenue,
        conversionRate: totalSold > 0 ? (totalAttended / totalSold) * 100 : 0,
      };
    });

    const totalStats = {
      totalCapacity: stats.reduce((sum, s) => sum + s.capacity, 0),
      totalSold: stats.reduce((sum, s) => sum + s.sold, 0),
      totalAttended: stats.reduce((sum, s) => sum + s.attended, 0),
      totalRevenue: stats.reduce((sum, s) => sum + s.revenue, 0),
    };

    return {
      ticketTypes: stats,
      totals: totalStats,
    };
  } catch (error) {
    logger.error('Get ticket type stats error:', error);
    throw error;
  }
};

module.exports = {
  createTicketType,
  getEventTicketTypes,
  updateTicketType,
  deleteTicketType,
  reorderTicketTypes,
  getTicketTypeById,
  checkTicketAvailability,
  reserveTickets,
  releaseTickets,
  getTicketTypeStats,
};