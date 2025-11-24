require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBalanceUpdate() {
  console.log('🧪 Testing Balance Update After Payment...\n');

  try {
    // Step 1: Find a PENDING payment
    console.log('1️⃣  Finding PENDING payment...');
    const payment = await prisma.payment.findFirst({
      where: {
        paymentStatus: 'PENDING',
        amount: { gt: 0 },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            createdBy: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!payment) {
      console.log('   ⚠️  No PENDING payment found');
      console.log('   💡 Please create a payment order first via frontend\n');
      return;
    }

    console.log(`   ✅ Found payment: ${payment.id}`);
    console.log(`      Event: ${payment.event.title}`);
    console.log(`      Amount: Rp ${parseFloat(payment.amount).toLocaleString('id-ID')}`);
    console.log(`      Organizer: ${payment.event.createdBy}\n`);

    // Step 2: Get organizer balance before
    console.log('2️⃣  Getting organizer balance (before)...');
    let balanceBefore = await prisma.organizerBalance.findUnique({
      where: { organizerId: payment.event.createdBy },
    });

    if (!balanceBefore) {
      balanceBefore = await prisma.organizerBalance.create({
        data: {
          organizerId: payment.event.createdBy,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      });
    }

    console.log(`   Available: Rp ${parseFloat(balanceBefore.balance.toString()).toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${parseFloat(balanceBefore.totalEarned.toString()).toLocaleString('id-ID')}\n`);

    // Step 3: Update payment to PAID
    console.log('3️⃣  Updating payment status to PAID...');
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });
    console.log('   ✅ Payment updated to PAID\n');

    // Step 4: Trigger balance update (simulate webhook)
    console.log('4️⃣  Triggering balance update...');
    const eventService = require('../src/services/eventService');
    const balanceService = require('../src/services/balanceService');

    // Calculate revenue
    const revenue = await eventService.calculateEventRevenue(payment.event.id);
    console.log(`   Revenue calculated:`);
    console.log(`      Total: Rp ${parseFloat(revenue.totalRevenue.toString()).toLocaleString('id-ID')}`);
    console.log(`      Platform Fee (15%): Rp ${parseFloat(revenue.platformFee.toString()).toLocaleString('id-ID')}`);
    console.log(`      Organizer Revenue (85%): Rp ${parseFloat(revenue.organizerRevenue.toString()).toLocaleString('id-ID')}\n`);

    // Update balance
    if (revenue.organizerRevenueId && revenue.organizerRevenue > 0) {
      await balanceService.addRevenueCredit(
        payment.event.createdBy,
        revenue.organizerRevenueId,
        revenue.organizerRevenue,
        `Revenue dari event: ${payment.event.title}`,
        {
          eventId: payment.event.id,
          eventTitle: payment.event.title,
        }
      );
      console.log('   ✅ Balance updated!\n');
    }

    // Step 5: Get balance after
    console.log('5️⃣  Getting organizer balance (after)...');
    const balanceAfter = await prisma.organizerBalance.findUnique({
      where: { organizerId: payment.event.createdBy },
    });

    console.log(`   Available: Rp ${parseFloat(balanceAfter.balance.toString()).toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${parseFloat(balanceAfter.totalEarned.toString()).toLocaleString('id-ID')}\n`);

    // Step 6: Verify
    console.log('6️⃣  Verifying balance update...');
    const balanceIncrease = parseFloat(balanceAfter.balance.toString()) - parseFloat(balanceBefore.balance.toString());
    const expectedRevenue = parseFloat(revenue.organizerRevenue.toString());

    console.log(`   Expected: Rp ${expectedRevenue.toLocaleString('id-ID')}`);
    console.log(`   Actual: Rp ${balanceIncrease.toLocaleString('id-ID')}`);

    if (Math.abs(balanceIncrease - expectedRevenue) < 100) {
      console.log('   ✅ Balance updated correctly!\n');
    } else {
      console.log('   ⚠️  Balance mismatch\n');
    }

    // Step 7: Check transactions
    console.log('7️⃣  Checking transaction history...');
    const transactions = await prisma.balanceTransaction.findMany({
      where: { organizerId: payment.event.createdBy },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (transactions.length > 0) {
      console.log('   Recent transactions:');
      transactions.forEach((tx, idx) => {
        console.log(`      ${idx + 1}. ${tx.type}: Rp ${parseFloat(tx.amount.toString()).toLocaleString('id-ID')} - ${tx.description}`);
      });
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Event: ${payment.event.title}`);
    console.log(`   Amount: Rp ${parseFloat(payment.amount).toLocaleString('id-ID')}`);
    console.log(`   Balance Increase: Rp ${balanceIncrease.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testBalanceUpdate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });

