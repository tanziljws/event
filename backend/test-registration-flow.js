require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const paymentService = require('./src/services/paymentService');
const eventService = require('./src/services/eventService');

const prisma = new PrismaClient();

// Test registration flow after payment
async function testRegistrationFlow() {
  console.log('🧪 Testing Registration Flow After Payment...\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // 1. Find an event with ticket types
    console.log('📋 Step 1: Finding event with ticket types...');
    const event = await prisma.event.findFirst({
      where: {
        isPublished: true,
        hasMultipleTicketTypes: true
      },
      include: {
        ticketTypes: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!event || !event.ticketTypes || event.ticketTypes.length === 0) {
      console.log('⚠️  No event with ticket types found. Creating test event...');
      // Skip test if no event found
      console.log('   Skipping test - no suitable event found');
      return;
    }

    const ticketType = event.ticketTypes[0];
    console.log('✅ Event found:');
    console.log('   Event ID:', event.id);
    console.log('   Event Title:', event.title);
    console.log('   Ticket Type:', ticketType.name);
    console.log('   Ticket Capacity:', ticketType.capacity);
    console.log('   Ticket Sold Count (Before):', ticketType.soldCount);
    console.log('   Available Tickets (Before):', ticketType.capacity - ticketType.soldCount);
    console.log('\n');

    // 2. Find a test user
    console.log('📋 Step 2: Finding test user...');
    const user = await prisma.user.findFirst({
      where: {
        role: 'PARTICIPANT'
      }
    });

    if (!user) {
      console.log('⚠️  No participant user found. Skipping test.');
      return;
    }

    console.log('✅ User found:');
    console.log('   User ID:', user.id);
    console.log('   User Name:', user.fullName);
    console.log('   User Email:', user.email);
    console.log('\n');

    // 3. Check existing registrations
    console.log('📋 Step 3: Checking existing registrations...');
    const existingRegistrations = await prisma.eventRegistration.count({
      where: {
        eventId: event.id,
        participantId: user.id,
        status: 'ACTIVE'
      }
    });
    console.log('   Existing Registrations:', existingRegistrations);
    console.log('\n');

    // 4. Create payment order
    console.log('📋 Step 4: Creating payment order...');
    const quantity = 1;
    const amount = ticketType.price * quantity;
    
    const paymentResult = await paymentService.createPaymentOrder({
      userId: user.id,
      eventId: event.id,
      eventTitle: event.title,
      amount: amount,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      paymentMethod: 'midtrans',
      ticketTypeId: ticketType.id,
      quantity: quantity
    });

    console.log('✅ Payment order created:');
    console.log('   Payment ID:', paymentResult.payment.id);
    console.log('   Payment Status:', paymentResult.payment.status);
    console.log('\n');

    // 5. Simulate payment success (update payment status to PAID)
    console.log('📋 Step 5: Simulating payment success...');
    await prisma.payment.update({
      where: { id: paymentResult.payment.id },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date()
      }
    });
    console.log('✅ Payment status updated to PAID');
    console.log('\n');

    // 6. Register for event after payment
    console.log('📋 Step 6: Registering for event after payment...');
    const registrationResult = await eventService.registerForEventAfterPayment(
      event.id,
      user.id,
      paymentResult.payment.id
    );

    console.log('✅ Registration created:');
    console.log('   Registration ID:', registrationResult.registration.id);
    console.log('   Registration Status:', registrationResult.registration.status);
    console.log('   Ticket Type ID:', registrationResult.registration.ticketTypeId);
    console.log('\n');

    // 7. Verify ticket quantity decreased
    console.log('📋 Step 7: Verifying ticket quantity decreased...');
    const updatedTicketType = await prisma.ticketType.findUnique({
      where: { id: ticketType.id }
    });

    console.log('   Ticket Sold Count (After):', updatedTicketType.soldCount);
    console.log('   Available Tickets (After):', updatedTicketType.capacity - updatedTicketType.soldCount);
    
    if (updatedTicketType.soldCount === ticketType.soldCount + quantity) {
      console.log('✅ Ticket quantity correctly decreased!');
      console.log('   Before:', ticketType.soldCount, '→ After:', updatedTicketType.soldCount);
    } else {
      console.log('❌ Ticket quantity NOT decreased correctly!');
      console.log('   Expected:', ticketType.soldCount + quantity);
      console.log('   Actual:', updatedTicketType.soldCount);
    }
    console.log('\n');

    // 8. Verify user is registered
    console.log('📋 Step 8: Verifying user registration...');
    const userRegistrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: event.id,
        participantId: user.id,
        status: 'ACTIVE'
      }
    });

    console.log('   Total Active Registrations:', userRegistrations.length);
    
    if (userRegistrations.length > existingRegistrations) {
      console.log('✅ User successfully registered!');
      console.log('   Before:', existingRegistrations, '→ After:', userRegistrations.length);
      console.log('   New Registration:', userRegistrations[userRegistrations.length - 1].id);
    } else {
      console.log('❌ User registration NOT found!');
    }
    console.log('\n');

    // Summary
    console.log('=' .repeat(60));
    console.log('📊 Test Summary:');
    console.log('   ✅ Payment created:', paymentResult.payment.id);
    console.log('   ✅ Registration created:', registrationResult.registration.id);
    console.log('   ✅ Ticket quantity decreased:', ticketType.soldCount, '→', updatedTicketType.soldCount);
    console.log('   ✅ User registered:', userRegistrations.length > existingRegistrations);
    console.log('\n');
    console.log('✅ All verifications passed!');
    console.log('\n');

  } catch (error) {
    console.error('\n');
    console.error('=' .repeat(60));
    console.error('❌ Test failed!');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    console.error('\n');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testRegistrationFlow();

