require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicateBalance() {
  console.log('🔧 Fixing duplicate balance...\n');

  try {
    const organizerId = 'da1c616d-c369-4978-8f1b-ce5ce2ecfb42';

    // Get all PAID payments for this organizer's events
    const payments = await prisma.payment.findMany({
      where: {
        paymentStatus: 'PAID',
        event: {
          createdBy: organizerId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            platformFee: true,
          },
        },
      },
    });

    console.log(`Found ${payments.length} PAID payments\n`);

    // Calculate actual revenue
    let totalRevenue = 0;
    let totalPlatformFee = 0;
    let totalOrganizerRevenue = 0;

    const eventRevenueMap = new Map();

    for (const payment of payments) {
      const amount = parseFloat(payment.amount.toString());
      const platformFeePercent = payment.event.platformFee ? parseFloat(payment.event.platformFee.toString()) : 0;
      const platformFee = (amount * platformFeePercent) / 100;
      const organizerRevenue = amount - platformFee;

      totalRevenue += amount;
      totalPlatformFee += platformFee;
      totalOrganizerRevenue += organizerRevenue;

      // Group by event
      if (!eventRevenueMap.has(payment.event.id)) {
        eventRevenueMap.set(payment.event.id, {
          eventId: payment.event.id,
          eventTitle: payment.event.title,
          totalRevenue: 0,
          platformFee: 0,
          organizerRevenue: 0,
        });
      }

      const eventRevenue = eventRevenueMap.get(payment.event.id);
      eventRevenue.totalRevenue += amount;
      eventRevenue.platformFee += platformFee;
      eventRevenue.organizerRevenue += organizerRevenue;
    }

    console.log('📊 Actual Revenue Calculation:');
    console.log(`   Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
    console.log(`   Total Platform Fee: Rp ${totalPlatformFee.toLocaleString('id-ID')}`);
    console.log(`   Total Organizer Revenue: Rp ${totalOrganizerRevenue.toLocaleString('id-ID')}\n`);

    // Get current balance
    let balance = await prisma.organizerBalance.findUnique({
      where: { organizerId },
    });

    if (!balance) {
      balance = await prisma.organizerBalance.create({
        data: {
          organizerId,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      });
    }

    console.log('📊 Current Balance:');
    console.log(`   Available: Rp ${parseFloat(balance.balance.toString()).toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${parseFloat(balance.totalEarned.toString()).toLocaleString('id-ID')}\n`);

    // Delete all existing CREDIT transactions for this organizer
    console.log('🗑️  Deleting existing CREDIT transactions...');
    const deletedCount = await prisma.balanceTransaction.deleteMany({
      where: {
        organizerId,
        type: 'CREDIT',
      },
    });
    console.log(`   Deleted ${deletedCount.count} transactions\n`);

    // Reset balance
    console.log('🔄 Resetting balance...');
    await prisma.organizerBalance.update({
      where: { organizerId },
      data: {
        balance: 0,
        totalEarned: 0,
      },
    });
    console.log('   ✅ Balance reset to 0\n');

    // Recreate transactions for each event (one transaction per event)
    console.log('💰 Creating new transactions...');
    for (const [eventId, revenue] of eventRevenueMap.entries()) {
      // Get current balance before this transaction
      const currentBalance = await prisma.organizerBalance.findUnique({
        where: { organizerId },
      });

      const balanceBefore = parseFloat(currentBalance.balance.toString());
      const balanceAfter = balanceBefore + revenue.organizerRevenue;

      // Create transaction
      await prisma.balanceTransaction.create({
        data: {
          organizerId,
          type: 'CREDIT',
          amount: revenue.organizerRevenue,
          balanceBefore,
          balanceAfter,
          referenceType: 'OrganizerRevenue',
          referenceId: eventId,
          description: `Revenue dari event: ${revenue.eventTitle}`,
          metadata: {
            eventId: revenue.eventId,
            eventTitle: revenue.eventTitle,
            totalRevenue: revenue.totalRevenue,
            platformFee: revenue.platformFee,
            organizerRevenue: revenue.organizerRevenue,
          },
        },
      });

      // Update balance
      await prisma.organizerBalance.update({
        where: { organizerId },
        data: {
          balance: balanceAfter,
          totalEarned: balanceAfter,
        },
      });

      console.log(`   ✅ Event: ${revenue.eventTitle}`);
      console.log(`      Revenue: Rp ${revenue.organizerRevenue.toLocaleString('id-ID')}`);
      console.log(`      Balance: Rp ${balanceAfter.toLocaleString('id-ID')}\n`);
    }

    // Get final balance
    const finalBalance = await prisma.organizerBalance.findUnique({
      where: { organizerId },
    });

    console.log('✅ Balance fixed!');
    console.log('\n📊 Final Balance:');
    console.log(`   Available: Rp ${parseFloat(finalBalance.balance.toString()).toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${parseFloat(finalBalance.totalEarned.toString()).toLocaleString('id-ID')}`);
    console.log(`   Expected: Rp ${totalOrganizerRevenue.toLocaleString('id-ID')}`);

    if (Math.abs(parseFloat(finalBalance.balance.toString()) - totalOrganizerRevenue) < 1) {
      console.log('\n✅ Balance matches expected revenue!');
    } else {
      console.log('\n⚠️  Balance mismatch!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicateBalance()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

