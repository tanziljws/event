const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUsers() {
  try {
    console.log('🚀 Creating admin users...');

    // Create Super Admin
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@nusaevent.com' },
      update: {},
      create: {
        fullName: 'Super Administrator',
        email: 'superadmin@nusaevent.com',
        password: superAdminPassword,
        phoneNumber: '081234567890',
        address: 'Jakarta, Indonesia',
        lastEducation: 'S2',
        role: 'SUPER_ADMIN',
        organizerType: null,
        verificationStatus: 'APPROVED',
        emailVerified: true,
      },
    });

    console.log('✅ Super Admin created:', superAdmin.email);

    // Create Operations Agent
    const operationsPassword = await bcrypt.hash('Operations123!', 12);
    const operationsAgent = await prisma.user.upsert({
      where: { email: 'operations@nusaevent.com' },
      update: {},
      create: {
        fullName: 'Operations Agent',
        email: 'operations@nusaevent.com',
        password: operationsPassword,
        phoneNumber: '081234567891',
        address: 'Jakarta, Indonesia',
        lastEducation: 'S1',
        role: 'OPS_AGENT',
        organizerType: null,
        verificationStatus: 'APPROVED',
        emailVerified: true,
      },
    });

    console.log('✅ Operations Agent created:', operationsAgent.email);

    // Create Event Organizer
    const organizerPassword = await bcrypt.hash('Organizer123!', 12);
    const eventOrganizer = await prisma.user.upsert({
      where: { email: 'organizer@nusaevent.com' },
      update: {},
      create: {
        fullName: 'Event Organizer',
        email: 'organizer@nusaevent.com',
        password: organizerPassword,
        phoneNumber: '081234567892',
        address: 'Jakarta, Indonesia',
        lastEducation: 'S1',
        role: 'ORGANIZER',
        organizerType: 'INSTITUTION',
        verificationStatus: 'APPROVED',
        emailVerified: true,
      },
    });

    console.log('✅ Event Organizer created:', eventOrganizer.email);

    console.log('\n🎉 Admin users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('┌─────────────────────┬─────────────────────────┬─────────────────┐');
    console.log('│ Role                │ Email                   │ Password        │');
    console.log('├─────────────────────┼─────────────────────────┼─────────────────┤');
    console.log('│ Super Admin         │ superadmin@nusaevent.com│ SuperAdmin123!  │');
    console.log('│ Operations Agent    │ operations@nusaevent.com│ Operations123!  │');
    console.log('│ Event Organizer     │ organizer@nusaevent.com │ Organizer123!   │');
    console.log('└─────────────────────┴─────────────────────────┴─────────────────┘');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUsers();
