/**
 * Script to fix private password for a specific event
 * Usage: node fix_event_password.js <eventId> <correctPassword>
 * Example: node fix_event_password.js 7909aa5c-e240-4eb4-80de-7958ebdc17ed password
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEventPassword(eventId, correctPassword) {
  try {
    console.log(`🔧 Fixing password for event: ${eventId}`);
    console.log(`📝 New password: ${correctPassword}`);

    // Find the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        isPrivate: true,
        privatePassword: true,
      },
    });

    if (!event) {
      console.error(`❌ Event not found: ${eventId}`);
      process.exit(1);
    }

    if (!event.isPrivate) {
      console.error(`❌ Event is not private: ${eventId}`);
      process.exit(1);
    }

    console.log(`📋 Current password: "${event.privatePassword}"`);
    console.log(`📋 Event title: ${event.title}`);

    // Update password
    const trimmedPassword = correctPassword.trim();
    await prisma.event.update({
      where: { id: eventId },
      data: {
        privatePassword: trimmedPassword,
      },
    });

    console.log(`✅ Password updated successfully!`);
    console.log(`   Old: "${event.privatePassword}"`);
    console.log(`   New: "${trimmedPassword}"`);

    // Verify
    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        privatePassword: true,
      },
    });

    console.log(`🔍 Verification - Stored password: "${updatedEvent.privatePassword}"`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const eventId = process.argv[2];
const correctPassword = process.argv[3];

if (!eventId || !correctPassword) {
  console.error('Usage: node fix_event_password.js <eventId> <correctPassword>');
  console.error('Example: node fix_event_password.js 7909aa5c-e240-4eb4-80de-7958ebdc17ed password');
  process.exit(1);
}

fixEventPassword(eventId, correctPassword);

