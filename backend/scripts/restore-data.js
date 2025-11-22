#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../src/config/logger');

const prisma = new PrismaClient();

async function restoreData() {
  try {
    logger.info('🔄 Starting data restoration...');

    // 1. Create test users
    logger.info('1️⃣ Creating test users...');
    
    const users = [
      {
        fullName: 'Tanzil Jawa',
        email: 'tanziljawas77@gmail.com',
        password: 'Apaweh!1',
        phoneNumber: '081234567890',
        role: 'ORGANIZER',
        organizerType: 'INDIVIDUAL',
        verificationStatus: 'APPROVED',
        emailVerified: true,
        verifiedAt: new Date()
      },
      {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'Test123456',
        phoneNumber: '081234567891',
        role: 'PARTICIPANT',
        emailVerified: true
      },
      {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        password: 'Test123456',
        phoneNumber: '081234567892',
        role: 'PARTICIPANT',
        emailVerified: true
      },
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin123456',
        phoneNumber: '081234567893',
        role: 'SUPER_ADMIN',
        emailVerified: true
      }
    ];

    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword
          }
        });
        
        logger.info(`✅ Created user: ${user.fullName} (${user.email})`);
      } else {
        logger.info(`⏭️ User already exists: ${existingUser.fullName} (${existingUser.email})`);
      }
    }

    // 2. Create test events
    logger.info('2️⃣ Creating test events...');
    
    const organizer = await prisma.user.findUnique({
      where: { email: 'tanziljawas77@gmail.com' }
    });

    if (organizer) {
      const events = [
        {
          title: 'Workshop Flutter Development',
          description: 'Pelatihan lengkap tentang pengembangan aplikasi mobile menggunakan Flutter framework.',
          eventDate: new Date('2025-09-25'),
          eventTime: '09:00',
          location: 'Jakarta Convention Center',
          latitude: -6.200000,
          longitude: 106.816666,
          address: 'Jl. Gatot Subroto, Kuningan, Jakarta Selatan',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          country: 'Indonesia',
          postalCode: '12950',
          maxParticipants: 50,
          registrationDeadline: new Date('2025-09-20'),
          isPublished: true,
          generateCertificate: true,
          status: 'APPROVED',
          category: 'TECHNOLOGY',
          price: 150000,
          isFree: false,
          platformFee: 5.0,
          createdBy: organizer.id,
          approvedBy: organizer.id,
          approvedAt: new Date()
        },
        {
          title: 'Seminar Digital Marketing',
          description: 'Pelajari strategi digital marketing terbaru untuk meningkatkan penjualan online.',
          eventDate: new Date('2025-09-30'),
          eventTime: '14:00',
          location: 'Bandung Digital Valley',
          latitude: -6.917464,
          longitude: 107.619125,
          address: 'Jl. Soekarno Hatta No. 123, Bandung',
          city: 'Bandung',
          province: 'Jawa Barat',
          country: 'Indonesia',
          postalCode: '40163',
          maxParticipants: 100,
          registrationDeadline: new Date('2025-09-25'),
          isPublished: true,
          generateCertificate: true,
          status: 'APPROVED',
          category: 'BUSINESS',
          price: 200000,
          isFree: false,
          platformFee: 5.0,
          createdBy: organizer.id,
          approvedBy: organizer.id,
          approvedAt: new Date()
        },
        {
          title: 'Konser Musik Akustik',
          description: 'Nikmati malam yang indah dengan musik akustik dari berbagai artis lokal.',
          eventDate: new Date('2025-10-05'),
          eventTime: '19:00',
          location: 'Taman Suropati, Jakarta',
          latitude: -6.194444,
          longitude: 106.829167,
          address: 'Taman Suropati, Menteng, Jakarta Pusat',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          country: 'Indonesia',
          postalCode: '10310',
          maxParticipants: 200,
          registrationDeadline: new Date('2025-10-01'),
          isPublished: true,
          generateCertificate: false,
          status: 'APPROVED',
          category: 'ENTERTAINMENT',
          price: 0,
          isFree: true,
          platformFee: 0,
          createdBy: organizer.id,
          approvedBy: organizer.id,
          approvedAt: new Date()
        },
        {
          title: 'Pelatihan Public Speaking',
          description: 'Tingkatkan kemampuan berbicara di depan umum dengan teknik yang tepat.',
          eventDate: new Date('2025-10-10'),
          eventTime: '09:00',
          location: 'Surabaya Convention Center',
          latitude: -7.257472,
          longitude: 112.752088,
          address: 'Jl. Raya Darmo Permai III, Surabaya',
          city: 'Surabaya',
          province: 'Jawa Timur',
          country: 'Indonesia',
          postalCode: '60226',
          maxParticipants: 30,
          registrationDeadline: new Date('2025-10-05'),
          isPublished: true,
          generateCertificate: true,
          status: 'APPROVED',
          category: 'EDUCATION',
          price: 300000,
          isFree: false,
          platformFee: 5.0,
          createdBy: organizer.id,
          approvedBy: organizer.id,
          approvedAt: new Date()
        }
      ];

      for (const eventData of events) {
        const existingEvent = await prisma.event.findFirst({
          where: { title: eventData.title }
        });

        if (!existingEvent) {
          const event = await prisma.event.create({
            data: eventData
          });
          
          logger.info(`✅ Created event: ${event.title}`);
        } else {
          logger.info(`⏭️ Event already exists: ${existingEvent.title}`);
        }
      }
    }

    // 3. Create some event registrations
    logger.info('3️⃣ Creating event registrations...');
    
    const participants = await prisma.user.findMany({
      where: { role: 'PARTICIPANT' }
    });

    const events = await prisma.event.findMany({
      where: { isPublished: true }
    });

    for (const event of events) {
      for (const participant of participants) {
        const existingRegistration = await prisma.eventRegistration.findFirst({
          where: {
            eventId: event.id,
            participantId: participant.id
          }
        });

        if (!existingRegistration) {
          const registration = await prisma.eventRegistration.create({
            data: {
              eventId: event.id,
              participantId: participant.id,
              registrationToken: `REG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              hasAttended: Math.random() > 0.5, // Random attendance
              attendanceTime: Math.random() > 0.5 ? new Date() : null,
              attendedAt: Math.random() > 0.5 ? new Date() : null,
              status: 'ACTIVE'
            }
          });
          
          logger.info(`✅ Created registration: ${participant.fullName} -> ${event.title}`);
        }
      }
    }

    // 4. Create some notifications
    logger.info('4️⃣ Creating notifications...');
    
    for (const user of await prisma.user.findMany()) {
      const notifications = [
        {
          userId: user.id,
          title: 'Selamat Datang!',
          message: `Halo ${user.fullName}, selamat datang di Event Management System!`,
          type: 'REGISTRATION_CONFIRMED',
          isRead: false
        },
        {
          userId: user.id,
          title: 'Event Baru Tersedia',
          message: 'Ada event menarik yang baru saja ditambahkan. Yuk cek sekarang!',
          type: 'EVENT_UPDATED',
          isRead: Math.random() > 0.5
        }
      ];

      for (const notificationData of notifications) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: notificationData.userId,
            title: notificationData.title
          }
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: notificationData
          });
        }
      }
    }

    logger.info('🎉 Data restoration completed successfully!');
    
    // Summary
    const userCount = await prisma.user.count();
    const eventCount = await prisma.event.count();
    const registrationCount = await prisma.eventRegistration.count();
    const notificationCount = await prisma.notification.count();

    logger.info('\n📊 Database Summary:');
    logger.info(`   Users: ${userCount}`);
    logger.info(`   Events: ${eventCount}`);
    logger.info(`   Registrations: ${registrationCount}`);
    logger.info(`   Notifications: ${notificationCount}`);

  } catch (error) {
    logger.error('❌ Data restoration failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  restoreData();
}

module.exports = restoreData;
