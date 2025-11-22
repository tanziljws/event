const { prisma } = require('../config/database');
const { emailTemplates } = require('../config/email');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs').promises;
const certificatePdfService = require('./certificatePdfService');

// Generate certificate for attended event
const generateCertificate = async (registrationId, participantId) => {
  try {
    // Get registration details
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: registrationId,
        participantId,
        hasAttended: true,
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

    if (!registration) {
      throw new Error('Registration not found or attendance not marked');
    }

    // Check if certificate already exists for this registration
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        registrationId: registrationId
      }
    });

    if (existingCertificate) {
      throw new Error('Certificate already generated');
    }

    // Check if event has certificate generation enabled
    const event = await prisma.event.findUnique({
      where: { id: registration.event.id },
      select: { generateCertificate: true }
    });

    if (!event?.generateCertificate) {
      throw new Error('Certificate generation is not enabled for this event');
    }

    // Get default global certificate template
    const certificateTemplate = await prisma.globalCertificateTemplate.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    });

    if (!certificateTemplate) {
      throw new Error('No default certificate template found. Please contact administrator.');
    }

    // Generate certificate number
    const certificateNumber = await certificatePdfService.generateCertificateNumber();
    
    // Extract signature data from template elements
    let signerName = 'John Doe'; // Default fallback
    let signerTitle = 'Chief Executive Officer'; // Default fallback
    
    logger.info('Certificate template elements:', {
      hasElements: !!certificateTemplate.elements,
      elementsType: typeof certificateTemplate.elements,
      elementsLength: certificateTemplate.elements?.length || 0
    });
    
    if (certificateTemplate.elements && Array.isArray(certificateTemplate.elements)) {
      const signatureElement = certificateTemplate.elements.find(el => el.type === 'signature');
      logger.info('Signature element found:', {
        found: !!signatureElement,
        element: signatureElement
      });
      
      if (signatureElement) {
        signerName = signatureElement.text || signerName;
        signerTitle = signatureElement.title || signerTitle;
        logger.info('Extracted signature data:', { signerName, signerTitle });
      }
    }

    // Prepare certificate data
    const certificateData = {
      participantName: registration.participant.fullName,
      eventTitle: registration.event.title,
      eventDate: new Date(registration.event.eventDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      eventLocation: registration.event.location,
      certificateNumber,
      companyInitials: 'EM', // Event Management
      signerName: signerName, // Dynamic from template
      signerTitle: signerTitle, // Dynamic from template
      issuedDate: new Date().toLocaleDateString('id-ID'),
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/certificates/verify/${certificateNumber}`,
      // Template data
      template: {
        backgroundImage: certificateTemplate.backgroundImage,
        backgroundSize: certificateTemplate.backgroundSize,
        elements: certificateTemplate.elements
      }
    };

    // Generate PDF certificate
    const pdfResult = await certificatePdfService.generateCertificatePdf(certificateData);
    
    // Create certificate record in database
    const certificate = await prisma.certificate.create({
      data: {
        registrationId,
        certificateNumber,
        certificateUrl: pdfResult.certificateUrl,
        verificationHash: `sha256:${Date.now().toString(36)}`
      }
    });

    // Update registration with certificate URL
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { certificateUrl: pdfResult.certificateUrl },
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

    // Send certificate notification email
    await emailTemplates.sendCertificateNotification(
      registration.participant.email,
      registration.event,
      pdfResult.certificateUrl,
      registration.participant.fullName,
      certificateNumber
    );

    logger.info(`Certificate generated for registration: ${registrationId}`);

    return {
      registration: updatedRegistration,
      certificateUrl: pdfResult.certificateUrl,
      certificateNumber,
      message: 'Certificate generated successfully',
    };
  } catch (error) {
    logger.error('Generate certificate error:', error);
    throw error;
  }
};

// Get user's certificates
const getUserCertificates = async (participantId, filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'attendedAt',
      sortOrder = 'desc',
      search,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      participantId,
      hasAttended: true,
      certificateUrl: {
        not: null,
      },
    };

    if (search) {
      where.event = {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where: {
          registration: {
            participantId,
            hasAttended: true,
          },
          ...(search && {
            registration: {
              event: {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          }),
        },
        orderBy: {
          [sortBy === 'attendedAt' ? 'issuedAt' : sortBy]: sortOrder,
        },
        skip,
        take: parseInt(limit),
        include: {
          registration: {
            include: {
              event: {
                select: {
                  id: true,
                  title: true,
                  eventDate: true,
                  eventTime: true,
                  location: true,
                  flyerUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.certificate.count({
        where: {
          registration: {
            participantId,
            hasAttended: true,
          },
          ...(search && {
            registration: {
              event: {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          }),
        },
      }),
    ]);

    return {
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get user certificates error:', error);
    throw error;
  }
};

// Search certificates by token
const searchCertificateByToken = async (token) => {
  try {
    const certificate = await prisma.certificate.findFirst({
      where: {
        registration: {
          registrationToken: token,
          hasAttended: true,
        },
      },
      include: {
        registration: {
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
        },
      },
    });

    if (!certificate) {
      throw new Error('Certificate not found or not available');
    }

    return {
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        certificateUrl: certificate.certificateUrl,
        participantName: certificate.registration.participant.fullName,
        eventTitle: certificate.registration.event.title,
        eventDate: certificate.registration.event.eventDate,
        eventTime: certificate.registration.event.eventTime,
        location: certificate.registration.event.location,
        attendedAt: certificate.registration.attendedAt,
        issuedAt: certificate.issuedAt,
        verificationHash: certificate.verificationHash,
      },
    };
  } catch (error) {
    logger.error('Search certificate by token error:', error);
    throw error;
  }
};

// Get certificate download URL
const getCertificateDownloadUrl = async (certificateId, participantId) => {
  try {
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: certificateId,
        participantId,
        hasAttended: true,
        certificateUrl: {
          not: null,
        },
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
        participant: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!registration) {
      throw new Error('Certificate not found or not available');
    }

    // Generate download filename
    const eventTitle = registration.event.title.replace(/[^a-zA-Z0-9]/g, '_');
    const participantName = registration.participant.fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadFilename = `Certificate_${eventTitle}_${participantName}.pdf`;

    return {
      downloadUrl: registration.certificateUrl,
      filename: downloadFilename,
    };
  } catch (error) {
    logger.error('Get certificate download URL error:', error);
    throw error;
  }
};

// Bulk generate certificates for an event
const bulkGenerateCertificates = async (eventId, adminId) => {
  try {
    // Verify admin owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.createdBy !== adminId) {
      throw new Error('You can only generate certificates for your own events');
    }

    // Get all attended registrations without certificates
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        hasAttended: true,
        certificateUrl: null,
      },
      include: {
        participant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (registrations.length === 0) {
      return {
        message: 'No attended participants found without certificates',
        generatedCount: 0,
      };
    }

    // Generate certificates for all registrations
    const results = [];
    for (const registration of registrations) {
      try {
        const result = await generateCertificate(registration.id, registration.participantId);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to generate certificate for registration ${registration.id}:`, error);
        // Continue with other certificates
      }
    }

    logger.info(`Bulk generated ${results.length} certificates for event: ${eventId}`);

    return {
      message: `Successfully generated ${results.length} certificates`,
      generatedCount: results.length,
      totalAttended: registrations.length,
    };
  } catch (error) {
    logger.error('Bulk generate certificates error:', error);
    throw error;
  }
};

// Verify certificate by certificate number
const verifyCertificate = async (certificateNumber) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        registration: {
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
        },
      },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    return {
      valid: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        participantName: certificate.registration.participant.fullName,
        eventTitle: certificate.registration.event.title,
        eventDate: certificate.registration.event.eventDate,
        eventTime: certificate.registration.event.eventTime,
        location: certificate.registration.event.location,
        attendedAt: certificate.registration.attendedAt,
        issuedAt: certificate.issuedAt,
        verificationHash: certificate.verificationHash,
      },
    };
  } catch (error) {
    logger.error('Verify certificate error:', error);
    throw error;
  }
};

module.exports = {
  generateCertificate,
  getUserCertificates,
  searchCertificateByToken,
  getCertificateDownloadUrl,
  bulkGenerateCertificates,
  verifyCertificate,
};
