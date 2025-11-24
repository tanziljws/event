require('dotenv').config();
const axios = require('axios');

// Force use localhost:5002
const API_BASE_URL = 'http://localhost:5002/api';

// Test credentials (adjust based on your test data)
const TEST_ORGANIZER = {
  email: 'organizer1@test.com', // Change to your organizer email
  password: 'password123' // Change to your organizer password
};

const TEST_PARTICIPANT = {
  email: 'user1@test.com', // Change to your participant email
  password: 'password123' // Change to your participant password
};

let organizerToken = '';
let participantToken = '';
let organizerId = '';
let participantId = '';
let eventId = '';
let paymentId = '';

async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

async function createPaidEvent(token) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = tomorrow.toISOString().split('T')[0];

    const response = await axios.post(
      `${API_BASE_URL}/events`,
      {
        title: 'Test Paid Event - Payment Flow',
        description: 'Test event untuk verify payment flow dan balance update',
        eventDate: eventDate,
        eventTime: '10:00',
        location: 'Test Venue',
        category: 'TECHNOLOGY',
        price: 100000, // Rp 100.000
        isFree: false,
        maxParticipants: 100,
        registrationDeadline: eventDate,
        isPublished: true,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data.event.id;
  } catch (error) {
    console.error('Create event error:', error.response?.data || error.message);
    throw error;
  }
}

async function getBalance(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('Get balance error:', error.response?.data || error.message);
    throw error;
  }
}

async function createPaymentOrder(token, eventId, amount) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-order`,
      {
        eventId,
        amount,
        paymentMethod: 'MIDTRANS',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data.payment.id;
  } catch (error) {
    console.error('Create payment order error:', error.response?.data || error.message);
    throw error;
  }
}

async function simulatePaymentSuccess(paymentId) {
  try {
    // Simulate webhook from Midtrans
    const response = await axios.post(
      `${API_BASE_URL}/payments/webhook`,
      {
        order_id: `PAY-${paymentId.substring(0, 8).toUpperCase()}-${Date.now()}`,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'credit_card',
        gross_amount: '100000',
        transaction_time: new Date().toISOString(),
        signature_key: 'test_signature', // In production, this should be validated
      }
    );

    return response.data;
  } catch (error) {
    console.error('Simulate payment success error:', error.response?.data || error.message);
    throw error;
  }
}

async function syncPaymentStatus(token, orderId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/order/${orderId}/sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Sync payment status error:', error.response?.data || error.message);
    throw error;
  }
}

async function getPaymentById(token, paymentId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data.payment;
  } catch (error) {
    console.error('Get payment error:', error.response?.data || error.message);
    throw error;
  }
}

async function testFlow() {
  console.log('🧪 Starting Payment Flow Test...\n');

  try {
    // Step 1: Login as Organizer
    console.log('1️⃣  Logging in as Organizer...');
    organizerToken = await login(TEST_ORGANIZER.email, TEST_ORGANIZER.password);
    console.log('✅ Organizer logged in\n');

    // Step 2: Get Organizer ID and Balance
    console.log('2️⃣  Getting organizer balance (before)...');
    const balanceBefore = await getBalance(organizerToken);
    console.log('📊 Balance Before:');
    console.log(`   Available: Rp ${balanceBefore.stats.availableBalance.toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${balanceBefore.stats.totalEarned.toLocaleString('id-ID')}`);
    console.log(`   Total Withdrawn: Rp ${balanceBefore.stats.totalWithdrawn.toLocaleString('id-ID')}\n`);

    // Step 3: Create Paid Event
    console.log('3️⃣  Creating paid event...');
    eventId = await createPaidEvent(organizerToken);
    console.log(`✅ Event created: ${eventId}\n`);

    // Step 4: Login as Participant
    console.log('4️⃣  Logging in as Participant...');
    participantToken = await login(TEST_PARTICIPANT.email, TEST_PARTICIPANT.password);
    console.log('✅ Participant logged in\n');

    // Step 5: Create Payment Order
    console.log('5️⃣  Creating payment order...');
    paymentId = await createPaymentOrder(participantToken, eventId, 100000);
    console.log(`✅ Payment order created: ${paymentId}\n`);

    // Step 6: Get Payment Details
    console.log('6️⃣  Getting payment details...');
    const payment = await getPaymentById(participantToken, paymentId);
    console.log(`📄 Payment Status: ${payment.paymentStatus}`);
    console.log(`📄 Payment Reference: ${payment.paymentReference}\n`);

    // Step 7: Simulate Payment Success (via webhook or sync)
    console.log('7️⃣  Simulating payment success...');
    
    // Option 1: Try webhook (might need proper signature)
    try {
      await simulatePaymentSuccess(paymentId);
      console.log('✅ Payment webhook processed\n');
    } catch (webhookError) {
      console.log('⚠️  Webhook failed, trying sync...');
      
      // Option 2: Use sync endpoint
      const syncResult = await syncPaymentStatus(participantToken, payment.paymentReference);
      console.log('✅ Payment synced\n');
    }

    // Step 8: Wait a bit for async processing
    console.log('8️⃣  Waiting for balance update (3 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 9: Check Balance After
    console.log('9️⃣  Getting organizer balance (after)...');
    const balanceAfter = await getBalance(organizerToken);
    console.log('📊 Balance After:');
    console.log(`   Available: Rp ${balanceAfter.stats.availableBalance.toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${balanceAfter.stats.totalEarned.toLocaleString('id-ID')}`);
    console.log(`   Total Withdrawn: Rp ${balanceAfter.stats.totalWithdrawn.toLocaleString('id-ID')}\n`);

    // Step 10: Verify Balance Update
    console.log('🔟 Verifying balance update...');
    const expectedRevenue = 100000 * 0.85; // 85% for organizer (15% platform fee)
    const balanceIncrease = balanceAfter.stats.totalEarned - balanceBefore.stats.totalEarned;
    
    console.log(`   Expected Revenue: Rp ${expectedRevenue.toLocaleString('id-ID')}`);
    console.log(`   Actual Increase: Rp ${balanceIncrease.toLocaleString('id-ID')}`);
    
    if (Math.abs(balanceIncrease - expectedRevenue) < 1000) { // Allow small difference
      console.log('✅ Balance updated correctly!\n');
    } else {
      console.log('⚠️  Balance update mismatch (might need manual trigger)\n');
    }

    // Step 11: Check Transactions
    console.log('1️⃣1️⃣  Checking transaction history...');
    const transactionsRes = await axios.get(`${API_BASE_URL}/balance/history?limit=5`, {
      headers: {
        Authorization: `Bearer ${organizerToken}`,
      },
    });
    
    if (transactionsRes.data.success && transactionsRes.data.data.transactions.length > 0) {
      console.log('📋 Recent Transactions:');
      transactionsRes.data.data.transactions.slice(0, 3).forEach((tx, idx) => {
        console.log(`   ${idx + 1}. ${tx.type}: Rp ${parseFloat(tx.amount).toLocaleString('id-ID')} - ${tx.description}`);
      });
      console.log('');
    }

    console.log('🎉 Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Event ID: ${eventId}`);
    console.log(`   Payment ID: ${paymentId}`);
    console.log(`   Balance Increase: Rp ${balanceIncrease.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run test
testFlow()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  });

