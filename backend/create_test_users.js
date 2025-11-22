const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🚀 Creating test users...');

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create 2 organizers
    const organizer1 = await prisma.user.create({
      data: {
        fullName: 'Organizer Satu',
        email: 'organizer1@test.com',
        password: hashedPassword,
        role: 'ORGANIZER',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        organizerType: 'COMMUNITY',
        department: 'ORGANIZER',
        userPosition: 'ORGANIZER',
      },
    });
    console.log('✅ Organizer 1 created:', organizer1.email);

    const organizer2 = await prisma.user.create({
      data: {
        fullName: 'Organizer Dua',
        email: 'organizer2@test.com',
        password: hashedPassword,
        role: 'ORGANIZER',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        organizerType: 'SMALL_BUSINESS',
        department: 'ORGANIZER',
        userPosition: 'ORGANIZER',
      },
    });
    console.log('✅ Organizer 2 created:', organizer2.email);

    // Create 2 regular users (participants)
    const user1 = await prisma.user.create({
      data: {
        fullName: 'User Satu',
        email: 'user1@test.com',
        password: hashedPassword,
        role: 'PARTICIPANT',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
      },
    });
    console.log('✅ User 1 created:', user1.email);

    const user2 = await prisma.user.create({
      data: {
        fullName: 'User Dua',
        email: 'user2@test.com',
        password: hashedPassword,
        role: 'PARTICIPANT',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        department: 'PARTICIPANT',
        userPosition: 'PARTICIPANT',
      },
    });
    console.log('✅ User 2 created:', user2.email);

    console.log('\n🎉 All test users created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('┌─────────────────────┬─────────────────────────┬─────────────────┐');
    console.log('│ Role                │ Email                   │ Password        │');
    console.log('├─────────────────────┼─────────────────────────┼─────────────────┤');
    console.log('│ Organizer 1         │ organizer1@test.com     │ Password123!    │');
    console.log('│ Organizer 2         │ organizer2@test.com     │ Password123!    │');
    console.log('│ Participant 1       │ user1@test.com          │ Password123!    │');
    console.log('│ Participant 2       │ user2@test.com          │ Password123!    │');
    console.log('└─────────────────────┴─────────────────────────┴─────────────────┘');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
