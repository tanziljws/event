require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Event categories available
const EVENT_CATEGORIES = [
  'ACADEMIC',
  'SPORTS',
  'ARTS',
  'CULTURE',
  'TECHNOLOGY',
  'BUSINESS',
  'HEALTH',
  'EDUCATION',
  'ENTERTAINMENT',
  'OTHER'
];

async function createTestAccounts() {
  try {
    console.log('🚀 Creating test accounts and events...\n');

    // Hash password untuk semua user
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Get superadmin untuk approval
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!superAdmin) {
      throw new Error('Super admin not found. Please create super admin first.');
    }

    // ============================================
    // 1. CREATE 2 ORGANIZER ACCOUNTS
    // ============================================
    const organizers = [];
    
    for (let i = 1; i <= 2; i++) {
      console.log(`📍 Creating Organizer ${i}...`);
      const organizer = await prisma.user.upsert({
        where: { email: `organizer${i}@nusaevent.com` },
        update: {
          fullName: `Organizer ${i}`,
          password: hashedPassword,
          role: 'ORGANIZER',
          emailVerified: true,
          verificationStatus: 'APPROVED',
          department: 'PARTICIPANT',
          userPosition: 'PARTICIPANT',
          phoneNumber: `+628123456789${i}`,
        },
        create: {
          email: `organizer${i}@nusaevent.com`,
          fullName: `Organizer ${i}`,
          password: hashedPassword,
          role: 'ORGANIZER',
          emailVerified: true,
          verificationStatus: 'APPROVED',
          department: 'PARTICIPANT',
          userPosition: 'PARTICIPANT',
          phoneNumber: `+628123456789${i}`,
          address: `Jl. Organizer ${i} No. ${i * 10}`,
          lastEducation: 'S1 Teknik Informatika',
          organizerType: 'INDIVIDUAL',
        },
      });
      organizers.push(organizer);
      console.log(`✅ Organizer ${i} created:`);
      console.log(`   Email: ${organizer.email}`);
      console.log(`   Password: password123`);
      console.log(`   Role: ${organizer.role}\n`);
    }

    // ============================================
    // 2. CREATE 3 REGULAR USER ACCOUNTS
    // ============================================
    const users = [];
    
    for (let i = 1; i <= 3; i++) {
      console.log(`📍 Creating User ${i}...`);
      const user = await prisma.user.upsert({
        where: { email: `user${i}@nusaevent.com` },
        update: {
          fullName: `User ${i}`,
          password: hashedPassword,
          role: 'PARTICIPANT',
          emailVerified: true,
          department: 'PARTICIPANT',
          userPosition: 'PARTICIPANT',
          phoneNumber: `+628123456790${i}`,
        },
        create: {
          email: `user${i}@nusaevent.com`,
          fullName: `User ${i}`,
          password: hashedPassword,
          role: 'PARTICIPANT',
          emailVerified: true,
          department: 'PARTICIPANT',
          userPosition: 'PARTICIPANT',
          phoneNumber: `+628123456790${i}`,
          address: `Jl. User ${i} No. ${i * 20}`,
          lastEducation: 'S1',
        },
      });
      users.push(user);
      console.log(`✅ User ${i} created:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: password123`);
      console.log(`   Role: ${user.role}\n`);
    }

    // ============================================
    // 3. CREATE 3 EVENTS FOR EACH ORGANIZER
    // ============================================
    const eventTemplates = [
      {
        title: 'Tech Innovation Summit',
        description: 'Konferensi teknologi terdepan membahas inovasi terbaru di bidang AI, Cloud Computing, dan Software Development.',
        category: 'TECHNOLOGY',
        location: 'Jakarta Convention Center',
        address: 'Jl. Jend. Gatot Subroto, Jakarta Selatan',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12930',
        country: 'Indonesia',
        latitude: -6.2088,
        longitude: 106.8456,
        maxParticipants: 500,
        isFree: false,
        price: 250000,
        eventTime: '09:00',
        eventEndTime: '17:00',
        thumbnailUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
        galleryUrls: [
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        ],
      },
      {
        title: 'Music Festival Jakarta',
        description: 'Festival musik terbesar di Jakarta dengan lineup artis internasional dan lokal. Nikmati pengalaman musik yang tak terlupakan!',
        category: 'ENTERTAINMENT',
        location: 'Jakarta International Expo (JIExpo)',
        address: 'Jl. Gatot Subroto, Senayan',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '10270',
        country: 'Indonesia',
        latitude: -6.1754,
        longitude: 106.8272,
        maxParticipants: 5000,
        isFree: false,
        price: 150000,
        eventTime: '18:00',
        eventEndTime: '23:59',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
        galleryUrls: [
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=600&fit=crop',
        ],
      },
      {
        title: 'Workshop Web Development Gratis',
        description: 'Workshop gratis untuk belajar web development dari basic sampai advanced. Cocok untuk pemula yang ingin memulai karir di bidang IT.',
        category: 'EDUCATION',
        location: 'Gedung Serbaguna Universitas Indonesia',
        address: 'Jl. Margonda Raya, Pondok Cina',
        city: 'Depok',
        province: 'Jawa Barat',
        postalCode: '16424',
        country: 'Indonesia',
        latitude: -6.3656,
        longitude: 106.8286,
        maxParticipants: 100,
        isFree: true,
        price: null,
        eventTime: '14:00',
        eventEndTime: '17:00',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
        galleryUrls: [
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        ],
      },
      {
        title: 'Business Networking Conference',
        description: 'Konferensi networking untuk para entrepreneur dan business owner. Peluang untuk bertemu investor dan mitra bisnis potensial.',
        category: 'BUSINESS',
        location: 'Grand Ballroom Hotel Indonesia',
        address: 'Jl. MH Thamrin, Jakarta Pusat',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '10310',
        country: 'Indonesia',
        latitude: -6.1944,
        longitude: 106.8229,
        maxParticipants: 300,
        isFree: false,
        price: 500000,
        eventTime: '10:00',
        eventEndTime: '16:00',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2e87c?w=800&h=600&fit=crop',
        galleryUrls: [
          'https://images.unsplash.com/photo-1540575467063-178a50c2e87c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop',
        ],
      },
      {
        title: 'Marathon Jakarta 2025',
        description: 'Lari marathon tahunan di Jakarta dengan rute melewati landmark kota. Tersedia kategori 5K, 10K, dan 21K.',
        category: 'SPORTS',
        location: 'Monas (Monumen Nasional)',
        address: 'Jl. Medan Merdeka, Jakarta Pusat',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '10110',
        country: 'Indonesia',
        latitude: -6.1751,
        longitude: 106.8650,
        maxParticipants: 2000,
        isFree: false,
        price: 100000,
        eventTime: '06:00',
        eventEndTime: '12:00',
        thumbnailUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop',
        galleryUrls: [
          'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
        ],
      },
      {
        title: 'Art Exhibition: Modern Indonesian Art',
        description: 'Pameran seni modern Indonesia menampilkan karya-karya terbaik dari seniman kontemporer Indonesia.',
        category: 'ARTS',
        location: 'Galeri Nasional Indonesia',
        address: 'Jl. Medan Merdeka Timur, Jakarta Pusat',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '10110',
        country: 'Indonesia',
        latitude: -6.1750,
        longitude: 106.8320,
        maxParticipants: 200,
        isFree: true,
        price: null,
        eventTime: '10:00',
        eventEndTime: '18:00',
        thumbnailUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        galleryUrls: [
          'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&h=600&fit=crop',
        ],
      },
    ];

    // Create events for each organizer (3 events per organizer)
    for (let orgIndex = 0; orgIndex < organizers.length; orgIndex++) {
      const organizer = organizers[orgIndex];
      console.log(`📍 Creating events for ${organizer.fullName}...`);

      // Delete existing events for this organizer first
      await prisma.event.deleteMany({
        where: { createdBy: organizer.id }
      });

      // Create 3 events with different categories
      const eventIndices = orgIndex === 0 
        ? [0, 1, 2]  // Organizer 1: Tech, Entertainment, Education
        : [3, 4, 5]; // Organizer 2: Business, Sports, Arts

      for (let i = 0; i < 3; i++) {
        const template = eventTemplates[eventIndices[i]];
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + (30 + i * 7)); // Events 30, 37, 44 days from now
        eventDate.setHours(9, 0, 0, 0);
        
        const eventEndDate = new Date(eventDate);
        eventEndDate.setHours(17, 0, 0, 0);

        const registrationDeadline = new Date(eventDate);
        registrationDeadline.setDate(registrationDeadline.getDate() - 3); // 3 days before event

        const event = await prisma.event.create({
          data: {
            title: template.title,
            description: template.description,
            location: template.location,
            eventDate: eventDate,
            eventEndDate: eventEndDate,
            eventTime: template.eventTime,
            eventEndTime: template.eventEndTime,
            maxParticipants: template.maxParticipants,
            isFree: template.isFree,
            price: template.price,
            category: template.category,
            status: 'APPROVED',
            isPublished: true,
            creator: {
              connect: { id: organizer.id }
            },
            thumbnailUrl: template.thumbnailUrl,
            galleryUrls: template.galleryUrls,
            registrationDeadline: registrationDeadline,
            address: template.address,
            city: template.city,
            province: template.province,
            postalCode: template.postalCode,
            country: template.country,
            latitude: template.latitude,
            longitude: template.longitude,
            approver: {
              connect: { id: superAdmin.id }
            },
            approvedAt: new Date(),
          },
        });

        console.log(`   ✅ Event ${i + 1}: ${event.title} (${event.category})`);
      }
      console.log('');
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('🎉 All accounts and events created successfully!\n');
    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ORGANIZERS (2):');
    organizers.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.fullName}`);
      console.log(`     Email: ${org.email}`);
      console.log(`     Password: password123`);
      console.log(`     Events: 3 events created`);
    });
    console.log('');
    console.log('REGULAR USERS (3):');
    users.forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.fullName}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Password: password123`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error creating accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestAccounts()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

