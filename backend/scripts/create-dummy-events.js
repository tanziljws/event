#!/usr/bin/env node

/**
 * Create Dummy Events
 * 
 * Creates 3 dummy events:
 * 1. Paid event (single price)
 * 2. Free event
 * 3. Multiple ticket types event
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const logger = require('../src/config/logger');

const prisma = new PrismaClient();

async function createDummyEvents() {
  try {
    logger.info('🎉 Creating dummy events...');

    // Get organizer user (try to find any organizer, or use first user)
    let organizer = await prisma.user.findFirst({
      where: { 
        role: 'ORGANIZER',
        verificationStatus: 'APPROVED'
      }
    });

    // If no organizer found, try to find any user
    if (!organizer) {
      organizer = await prisma.user.findFirst({
        where: { role: { in: ['ORGANIZER', 'SUPER_ADMIN', 'ADMIN'] } }
      });
    }

    // If still no user, create a test organizer
    if (!organizer) {
      logger.error('❌ No organizer found. Please create an organizer user first.');
      logger.info('💡 You can create one by running: npm run create-admin');
      process.exit(1);
    }

    logger.info(`✅ Using organizer: ${organizer.fullName} (${organizer.email})`);

    // Calculate dates
    const now = new Date();
    const tenDaysFromNow = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const fifteenDaysFromNow = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const thirtyOneDaysFromNow = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);

    // ========================================
    // 1. PAID EVENT (Single Price)
    // ========================================
    logger.info('');
    logger.info('📦 Creating paid event (single price)...');
    
    const paidEvent = await prisma.event.create({
      data: {
        title: 'Seminar Digital Marketing 2025',
        description: 'Seminar lengkap tentang digital marketing untuk bisnis modern. Belajar strategi pemasaran digital, social media marketing, content marketing, dan SEO untuk meningkatkan penjualan bisnis Anda.',
        eventDate: fifteenDaysFromNow,
        eventTime: '09:00',
        eventEndTime: '17:00',
        location: 'Jakarta Convention Center',
        latitude: -6.200000,
        longitude: 106.816666,
        address: 'Jl. Gatot Subroto, Kuningan, Jakarta Selatan',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        postalCode: '12950',
        maxParticipants: 200,
        registrationDeadline: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        category: 'BUSINESS',
        isFree: false,
        price: 250000, // Single price
        status: 'APPROVED',
        isPublished: true,
        generateCertificate: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
        galleryUrls: [
          'https://images.unsplash.com/photo-1556740758-90de374c12ad',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71'
        ],
        platformFee: 10.0,
        createdBy: organizer.id,
        approvedBy: organizer.id,
        approvedAt: now,
        hasMultipleTicketTypes: false,
      }
    });

    // Create default ticket type for paid event
    await prisma.ticketType.create({
      data: {
        eventId: paidEvent.id,
        name: 'General Admission',
        description: 'Tiket umum untuk seminar',
        price: 250000,
        isFree: false,
        capacity: 200,
        soldCount: 0,
        benefits: [
          'Akses ke semua sesi seminar',
          'Sertifikat digital',
          'Materi pembelajaran PDF',
          'Coffee break & lunch',
          'Networking session'
        ],
        isActive: true,
        sortOrder: 0,
        color: '#3B82F6',
        icon: 'ticket',
      }
    });

    logger.info(`✅ Paid event created: ${paidEvent.title} (Rp ${paidEvent.price?.toLocaleString('id-ID')})`);

    // ========================================
    // 2. FREE EVENT
    // ========================================
    logger.info('');
    logger.info('📦 Creating free event...');
    
    const freeEvent = await prisma.event.create({
      data: {
        title: 'Workshop Flutter Development Gratis',
        description: 'Workshop gratis untuk belajar Flutter development dari dasar sampai advanced. Cocok untuk pemula yang ingin memulai karir sebagai mobile app developer. Materi meliputi Dart basics, Widget system, State management, dan API integration.',
        eventDate: tenDaysFromNow,
        eventTime: '14:00',
        eventEndTime: '18:00',
        location: 'Bandung Tech Hub',
        latitude: -6.917464,
        longitude: 107.619123,
        address: 'Jl. Soekarno Hatta, Gedebage',
        city: 'Bandung',
        province: 'Jawa Barat',
        country: 'Indonesia',
        postalCode: '40294',
        maxParticipants: 100,
        registrationDeadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        category: 'TECHNOLOGY',
        isFree: true,
        price: null,
        status: 'APPROVED',
        isPublished: true,
        generateCertificate: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
        galleryUrls: [
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c',
          'https://images.unsplash.com/photo-1531482615713-2afd69097998'
        ],
        platformFee: 0,
        createdBy: organizer.id,
        approvedBy: organizer.id,
        approvedAt: now,
        hasMultipleTicketTypes: false,
      }
    });

    // Create default ticket type for free event
    await prisma.ticketType.create({
      data: {
        eventId: freeEvent.id,
        name: 'General Admission',
        description: 'Tiket gratis untuk workshop',
        price: null,
        isFree: true,
        capacity: 100,
        soldCount: 0,
        benefits: [
          'Akses ke semua sesi workshop',
          'Sertifikat digital',
          'Materi pembelajaran',
          'Source code contoh'
        ],
        isActive: true,
        sortOrder: 0,
        color: '#10B981',
        icon: 'ticket',
      }
    });

    logger.info(`✅ Free event created: ${freeEvent.title} (FREE)`);

    // ========================================
    // 3. MULTIPLE TICKET TYPES EVENT
    // ========================================
    logger.info('');
    logger.info('📦 Creating multiple ticket types event...');
    
    const multipleTicketEvent = await prisma.event.create({
      data: {
        title: 'Jakarta Tech Conference 2025',
        description: 'Konferensi teknologi terbesar di Jakarta dengan berbagai topik menarik: AI, Blockchain, Cloud Computing, Cybersecurity, dan Mobile Development. Pilih tiket sesuai kebutuhan Anda dengan berbagai benefit eksklusif!',
        eventDate: thirtyDaysFromNow,
        eventEndDate: thirtyOneDaysFromNow,
        eventTime: '08:00',
        eventEndTime: '20:00',
        location: 'Jakarta International Expo (JIExpo)',
        latitude: -6.1754,
        longitude: 106.8272,
        address: 'Jl. Gatot Subroto, Senayan',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        postalCode: '10270',
        maxParticipants: 1000,
        registrationDeadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
        category: 'TECHNOLOGY',
        isFree: false,
        price: 500000, // Base price (Early Bird)
        status: 'APPROVED',
        isPublished: true,
        generateCertificate: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2',
        galleryUrls: [
          'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
        ],
        platformFee: 15.0,
        createdBy: organizer.id,
        approvedBy: organizer.id,
        approvedAt: now,
        hasMultipleTicketTypes: true,
      }
    });

    // Create multiple ticket types
    const ticketTypes = [
      {
        name: 'Early Bird',
        description: 'Harga spesial untuk pembeli awal! Terbatas hanya untuk 200 peserta pertama.',
        price: 500000,
        isFree: false,
        capacity: 200,
        soldCount: 0,
        benefits: [
          'Akses ke semua sesi konferensi',
          'Sertifikat digital',
          'Conference swag bag',
          'Coffee break & lunch',
          'Access to digital materials'
        ],
        isActive: true,
        sortOrder: 0,
        color: '#F59E0B',
        icon: 'star',
        badgeText: 'BEST VALUE',
        minQuantity: 1,
        maxQuantity: 5,
        saleEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // Available for 14 days
      },
      {
        name: 'Regular',
        description: 'Tiket reguler dengan akses penuh ke semua sesi konferensi.',
        price: 750000,
        isFree: false,
        capacity: 600,
        soldCount: 0,
        benefits: [
          'Akses ke semua sesi konferensi',
          'Sertifikat digital',
          'Conference swag bag',
          'Coffee break & lunch'
        ],
        isActive: true,
        sortOrder: 1,
        color: '#3B82F6',
        icon: 'ticket',
        minQuantity: 1,
        maxQuantity: 10,
      },
      {
        name: 'VIP',
        description: 'Pengalaman premium dengan akses eksklusif dan fasilitas terbaik!',
        price: 1500000,
        isFree: false,
        capacity: 150,
        soldCount: 0,
        benefits: [
          'Akses ke semua sesi konferensi',
          'VIP lounge access',
          'Priority seating',
          'Premium lunch & dinner',
          'Exclusive VIP swag bag',
          'Meet & greet dengan speakers',
          'Access to workshop sessions',
          'Sertifikat premium'
        ],
        isActive: true,
        sortOrder: 2,
        color: '#8B5CF6',
        icon: 'crown',
        badgeText: 'VIP',
        minQuantity: 1,
        maxQuantity: 4,
        requiresApproval: false,
      },
      {
        name: 'VVIP',
        description: 'Ultimate conference experience dengan akses paling eksklusif dan fasilitas premium!',
        price: 2500000,
        isFree: false,
        capacity: 50,
        soldCount: 0,
        benefits: [
          'All VIP benefits',
          'Backstage access',
          'Private meet & greet dengan speakers',
          'Dedicated concierge service',
          'Premium parking',
          'Exclusive after-party access',
          'Luxury gift package',
          '1-on-1 mentoring session',
          'Lifetime access to materials'
        ],
        isActive: true,
        sortOrder: 3,
        color: '#EC4899',
        icon: 'diamond',
        badgeText: 'EXCLUSIVE',
        minQuantity: 1,
        maxQuantity: 2,
        requiresApproval: false,
      }
    ];

    for (const ticketType of ticketTypes) {
      await prisma.ticketType.create({
        data: {
          eventId: multipleTicketEvent.id,
          ...ticketType
        }
      });
    }

    logger.info(`✅ Multiple ticket event created: ${multipleTicketEvent.title}`);
    logger.info(`✅ Created ${ticketTypes.length} ticket types`);

    // Summary
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('🎉 DUMMY EVENTS CREATED SUCCESSFULLY!');
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('📋 Events Summary:');
    logger.info('');
    logger.info('1. 💰 PAID EVENT (Single Price)');
    logger.info(`   Title: ${paidEvent.title}`);
    logger.info(`   Price: Rp ${paidEvent.price?.toLocaleString('id-ID')}`);
    logger.info(`   Capacity: ${paidEvent.maxParticipants} people`);
    logger.info(`   Date: ${paidEvent.eventDate.toLocaleDateString('id-ID')} ${paidEvent.eventTime}`);
    logger.info(`   Location: ${paidEvent.location}`);
    logger.info(`   Ticket Types: 1 (General Admission)`);
    logger.info('');
    logger.info('2. 🆓 FREE EVENT');
    logger.info(`   Title: ${freeEvent.title}`);
    logger.info(`   Price: FREE`);
    logger.info(`   Capacity: ${freeEvent.maxParticipants} people`);
    logger.info(`   Date: ${freeEvent.eventDate.toLocaleDateString('id-ID')} ${freeEvent.eventTime}`);
    logger.info(`   Location: ${freeEvent.location}`);
    logger.info(`   Ticket Types: 1 (General Admission)`);
    logger.info('');
    logger.info('3. 🎫 MULTIPLE TICKET TYPES EVENT');
    logger.info(`   Title: ${multipleTicketEvent.title}`);
    logger.info(`   Price: Rp 500.000 - Rp 2.500.000`);
    logger.info(`   Capacity: ${multipleTicketEvent.maxParticipants} people`);
    logger.info(`   Date: ${multipleTicketEvent.eventDate.toLocaleDateString('id-ID')} ${multipleTicketEvent.eventTime}`);
    logger.info(`   Location: ${multipleTicketEvent.location}`);
    logger.info(`   Ticket Types: ${ticketTypes.length}`);
    ticketTypes.forEach((tt, idx) => {
      logger.info(`      ${idx + 1}. ${tt.name}: Rp ${tt.price?.toLocaleString('id-ID')} (${tt.capacity} seats) - ${tt.badgeText || ''}`);
    });
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    logger.error('❌ Error creating dummy events:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createDummyEvents()
    .then(() => {
      logger.info('');
      logger.info('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('');
      logger.error('❌ Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createDummyEvents };

