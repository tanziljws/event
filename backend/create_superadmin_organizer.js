require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUsers() {
  try {
    console.log('🚀 Creating superadmin, organizer, and participant accounts...\n');

    // Hash password untuk semua user
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Super Admin
    console.log('📍 Creating SUPER_ADMIN account...');
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@nusaevent.com' },
      update: {
        fullName: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: true,
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
      },
      create: {
        email: 'superadmin@nusaevent.com',
        fullName: 'Super Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: true,
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
        phoneNumber: '+6281234567890',
      },
    });
    console.log('✅ Super Admin created:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${superAdmin.role}\n`);

    // 2. Create Organizer
    console.log('📍 Creating ORGANIZER account...');
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@nusaevent.com' },
      update: {
        fullName: 'Event Organizer',
        password: hashedPassword,
        role: 'ORGANIZER',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
      },
      create: {
        email: 'organizer@nusaevent.com',
        fullName: 'Event Organizer',
        password: hashedPassword,
        role: 'ORGANIZER',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
        phoneNumber: '+6281234567891',
      },
    });
    console.log('✅ Organizer created:');
    console.log(`   Email: ${organizer.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${organizer.role}\n`);

    // 3. Create Regular User (Participant)
    console.log('📍 Creating PARTICIPANT account...');
    const participant = await prisma.user.upsert({
      where: { email: 'user@nusaevent.com' },
      update: {
        fullName: 'Regular User',
        password: hashedPassword,
        role: 'PARTICIPANT',
        emailVerified: true,
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
      },
      create: {
        email: 'user@nusaevent.com',
        fullName: 'Regular User',
        password: hashedPassword,
        role: 'PARTICIPANT',
        emailVerified: true,
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
        phoneNumber: '+6281234567892',
      },
    });
    console.log('✅ Participant created:');
    console.log(`   Email: ${participant.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${participant.role}\n`);

    // 4. Create sample event for organizer
    console.log('📍 Creating sample event for organizer...');
    
    // Delete existing events for this organizer first
    await prisma.event.deleteMany({
      where: { createdBy: organizer.id }
    });
    
    const event = await prisma.event.create({
      data: {
        title: 'Tech Conference 2024',
        description: 'Annual technology conference featuring the latest innovations in software development, AI, and cloud computing.',
        location: 'Jakarta Convention Center',
        eventDate: new Date('2024-12-15T09:00:00Z'),
        eventEndDate: new Date('2024-12-15T17:00:00Z'),
        eventTime: '09:00 - 17:00 WIB',
        maxParticipants: 500,
        isFree: false,
        price: 250000,
        category: 'TECHNOLOGY',
        status: 'APPROVED',
        isPublished: true,
        creator: {
          connect: { id: organizer.id }
        },
        thumbnailUrl: null,
        galleryUrls: [],
        registrationDeadline: new Date('2024-12-10T23:59:59Z'),
        address: 'Jl. Jend. Gatot Subroto, Jakarta Selatan',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postalCode: '12930',
        country: 'Indonesia',
        latitude: -6.2088,
        longitude: 106.8456,
        approver: {
          connect: { id: superAdmin.id }
        },
        approvedAt: new Date(),
      },
    });
    console.log('✅ Sample event created:');
    console.log(`   Title: ${event.title}`);
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Organizer ID: ${organizer.id}`);
    console.log(`   Date: ${event.eventDate.toLocaleDateString('id-ID')}`);
    console.log(`   Location: ${event.location}\n`);

    console.log('🎉 All accounts created successfully!\n');
    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUPER ADMIN:');
    console.log('  Email: superadmin@nusaevent.com');
    console.log('  Password: password123');
    console.log('  Role: SUPER_ADMIN');
    console.log('');
    console.log('ORGANIZER:');
    console.log('  Email: organizer@nusaevent.com');
    console.log('  Password: password123');
    console.log('  Role: ORGANIZER');
    console.log('  Event: Tech Conference 2024');
    console.log('');
    console.log('REGULAR USER (PARTICIPANT):');
    console.log('  Email: user@nusaevent.com');
    console.log('  Password: password123');
    console.log('  Role: PARTICIPANT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createUsers()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

