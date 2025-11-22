const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleEvents() {
  try {
    console.log('🎉 Creating sample events...');

    // Get organizer user
    const organizer = await prisma.user.findFirst({
      where: { email: 'organizer1@test.com' }
    });

    if (!organizer) {
      throw new Error('Organizer not found. Please create users first.');
    }

    // Event 1: FREE EVENT - Tech Talk
    const freeEvent = await prisma.event.create({
      data: {
        title: 'Workshop Web Development Gratis',
        eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        eventTime: '14:00',
        eventEndTime: '17:00',
        location: 'Gedung Serbaguna Universitas Indonesia',
        latitude: -6.3656,
        longitude: 106.8286,
        address: 'Jl. Margonda Raya, Pondok Cina',
        city: 'Depok',
        province: 'Jawa Barat',
        country: 'Indonesia',
        postalCode: '16424',
        description: 'Workshop gratis untuk belajar web development dari basic sampai advanced. Cocok untuk pemula yang ingin memulai karir di bidang IT. Materi meliputi HTML, CSS, JavaScript, dan React.',
        maxParticipants: 100,
        registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        category: 'TECHNOLOGY',
        isFree: true,
        price: null,
        status: 'APPROVED',
        isPublished: true,
        generateCertificate: true,
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
        galleryUrls: [
          'https://images.unsplash.com/photo-1531482615713-2afd69097998',
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c'
        ],
        platformFee: 0,
        createdBy: organizer.id,
        approvedBy: organizer.id,
        approvedAt: new Date(),
        hasMultipleTicketTypes: false,
      }
    });

    // Create default ticket type for free event
    await prisma.ticketType.create({
      data: {
        eventId: freeEvent.id,
        name: 'General Admission',
        description: 'Tiket gratis untuk mengikuti workshop',
        price: null,
        isFree: true,
        capacity: 100,
        soldCount: 0,
        benefits: ['Akses ke semua sesi workshop', 'Sertifikat digital', 'Materi pembelajaran'],
        isActive: true,
        sortOrder: 0,
        color: '#10B981',
        icon: 'ticket',
      }
    });

    console.log('✅ Free event created:', freeEvent.title);

    // Event 2: PAID EVENT - Music Festival with Multiple Ticket Types
    const paidEvent = await prisma.event.create({
      data: {
        title: 'Jakarta Music Festival 2025',
        eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        eventEndDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // 31 days from now
        eventTime: '18:00',
        eventEndTime: '23:59',
        location: 'Jakarta International Expo (JIExpo)',
        latitude: -6.1754,
        longitude: 106.8272,
        address: 'Jl. Gatot Subroto, Senayan',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        country: 'Indonesia',
        postalCode: '10270',
        description: 'Festival musik terbesar di Jakarta dengan lineup artis internasional dan lokal. Nikmati pengalaman musik yang tak terlupakan dengan berbagai pilihan tiket sesuai kebutuhan Anda. Tersedia Early Bird, Regular, dan VIP tickets!',
        maxParticipants: 5000,
        registrationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        category: 'ENTERTAINMENT',
        isFree: false,
        price: 150000, // Base price (Early Bird)
        status: 'APPROVED',
        isPublished: true,
        generateCertificate: false,
        thumbnailUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
        galleryUrls: [
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
          'https://images.unsplash.com/photo-1506157786151-b8491531f063',
          'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec'
        ],
        platformFee: 15.0,
        createdBy: organizer.id,
        approvedBy: organizer.id,
        approvedAt: new Date(),
        hasMultipleTicketTypes: true,
      }
    });

    // Create multiple ticket types for paid event
    const ticketTypes = [
      {
        name: 'Early Bird',
        description: 'Harga spesial untuk pembeli awal! Terbatas!',
        price: 150000,
        isFree: false,
        capacity: 500,
        soldCount: 0,
        benefits: [
          'Akses ke semua stage',
          'Festival merchandise',
          'Free drink voucher'
        ],
        isActive: true,
        sortOrder: 0,
        color: '#F59E0B',
        icon: 'star',
        badgeText: 'BEST VALUE',
        minQuantity: 1,
        maxQuantity: 5,
        saleEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Available for 14 days
      },
      {
        name: 'Regular',
        description: 'Tiket reguler untuk akses festival',
        price: 250000,
        isFree: false,
        capacity: 3000,
        soldCount: 0,
        benefits: [
          'Akses ke semua stage',
          'Festival merchandise'
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
        description: 'Pengalaman premium dengan akses eksklusif!',
        price: 500000,
        isFree: false,
        capacity: 500,
        soldCount: 0,
        benefits: [
          'Priority entrance',
          'VIP lounge access',
          'Exclusive VIP merchandise',
          'Meet & greet opportunity',
          'Premium food & beverages',
          'Reserved seating area'
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
        description: 'Ultimate festival experience dengan fasilitas terbaik!',
        price: 1000000,
        isFree: false,
        capacity: 100,
        soldCount: 0,
        benefits: [
          'All VIP benefits',
          'Backstage access',
          'Private meet & greet',
          'Dedicated concierge',
          'Premium parking',
          'Exclusive after-party access',
          'Luxury gift package'
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
          eventId: paidEvent.id,
          ...ticketType
        }
      });
    }

    console.log('✅ Paid event created:', paidEvent.title);
    console.log('✅ Created', ticketTypes.length, 'ticket types for paid event');

    console.log('\n🎉 Sample events created successfully!\n');
    console.log('📋 Events Summary:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 1. FREE EVENT                                               │');
    console.log('│    Title: Workshop Web Development Gratis                  │');
    console.log('│    Price: FREE                                              │');
    console.log('│    Capacity: 100 people                                     │');
    console.log('│    Ticket Types: 1 (General Admission)                      │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ 2. PAID EVENT                                               │');
    console.log('│    Title: Jakarta Music Festival 2025                       │');
    console.log('│    Price: Rp 150.000 - Rp 1.000.000                         │');
    console.log('│    Capacity: 5000 people                                    │');
    console.log('│    Ticket Types: 4                                          │');
    console.log('│      - Early Bird: Rp 150.000 (500 seats)                   │');
    console.log('│      - Regular: Rp 250.000 (3000 seats)                     │');
    console.log('│      - VIP: Rp 500.000 (500 seats)                          │');
    console.log('│      - VVIP: Rp 1.000.000 (100 seats)                       │');
    console.log('└─────────────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Error creating sample events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleEvents();
