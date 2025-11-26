require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createOrganizerTest() {
  try {
    console.log('🚀 Creating organizer test user...\n');

    const hashedPassword = await bcrypt.hash('Test123!', 12);

    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@1test.com' },
      update: {
        fullName: 'Test Organizer',
        password: hashedPassword,
        role: 'ORGANIZER',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        organizerType: 'INDIVIDUAL',
      },
      create: {
        fullName: 'Test Organizer',
        email: 'organizer@1test.com',
        password: hashedPassword,
        role: 'ORGANIZER',
        emailVerified: true,
        verificationStatus: 'APPROVED',
        organizerType: 'INDIVIDUAL',
        phoneNumber: '+6281234567890',
      },
    });

    console.log('✅ Organizer created/updated:');
    console.log(`   Email: ${organizer.email}`);
    console.log(`   Password: Test123!`);
    console.log(`   Role: ${organizer.role}`);
    console.log(`   Email Verified: ${organizer.emailVerified}`);
    console.log(`   Verification Status: ${organizer.verificationStatus}\n`);

  } catch (error) {
    console.error('❌ Error creating organizer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createOrganizerTest();
