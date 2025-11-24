require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const eventService = require('../src/services/eventService');
const balanceService = require('../src/services/balanceService');

async function fixBalanceForPaidPayments() {
  console.log('🔧 Fixing balance for existing PAID payments...\n');

  try {
    // Get all PAID payments
    const paidPayments = await prisma.payment.findMany({
      where: {
        paymentStatus: 'PAID',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            createdBy: true,
            platformFee: true,
          },
        },
      },
      distinct: ['eventId'], // Only process each event once
    });

    console.log(`Found ${paidPayments.length} unique events with PAID payments\n`);

    for (const payment of paidPayments) {
      try {
        console.log(`Processing event: ${payment.event.title} (${payment.event.id})`);
        console.log(`  Organizer: ${payment.event.createdBy}`);

        // Calculate revenue for this event
        const revenue = await eventService.calculateEventRevenue(payment.event.id);
        console.log(`  Total Revenue: Rp ${parseFloat(revenue.totalRevenue.toString()).toLocaleString('id-ID')}`);
        console.log(`  Platform Fee: Rp ${parseFloat(revenue.platformFee.toString()).toLocaleString('id-ID')}`);
        console.log(`  Organizer Revenue: Rp ${parseFloat(revenue.organizerRevenue.toString()).toLocaleString('id-ID')}`);

        // Check current balance
        let balance = await prisma.organizerBalance.findUnique({
          where: { organizerId: payment.event.createdBy },
        });

        if (!balance) {
          balance = await prisma.organizerBalance.create({
            data: {
              organizerId: payment.event.createdBy,
              balance: 0,
              pendingBalance: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
            },
          });
          console.log(`  Created new balance record`);
        }

        console.log(`  Balance Before: Rp ${parseFloat(balance.balance.toString()).toLocaleString('id-ID')}`);
        console.log(`  Total Earned Before: Rp ${parseFloat(balance.totalEarned.toString()).toLocaleString('id-ID')}`);

        // Update balance if revenue exists
        if (revenue.organizerRevenueId && revenue.organizerRevenue > 0) {
          await balanceService.addRevenueCredit(
            payment.event.createdBy,
            revenue.organizerRevenueId,
            revenue.organizerRevenue,
            `Revenue dari event: ${payment.event.title} (backdated)`,
            {
              eventId: payment.event.id,
              eventTitle: payment.event.title,
              backdated: true,
            }
          );

          // Get updated balance
          const updatedBalance = await prisma.organizerBalance.findUnique({
            where: { organizerId: payment.event.createdBy },
          });

          console.log(`  Balance After: Rp ${parseFloat(updatedBalance.balance.toString()).toLocaleString('id-ID')}`);
          console.log(`  Total Earned After: Rp ${parseFloat(updatedBalance.totalEarned.toString()).toLocaleString('id-ID')}`);
          console.log(`  ✅ Balance updated!\n`);
        } else {
          console.log(`  ⚠️  No revenue to add\n`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing event ${payment.event.id}:`, error.message);
        console.log('');
      }
    }

    console.log('✅ Balance fix completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBalanceForPaidPayments()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

