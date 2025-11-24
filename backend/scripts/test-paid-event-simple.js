require('dotenv').config();
const axios = require('axios');

// Use localhost:5002
const API_BASE_URL = 'http://localhost:5002/api';

// Test with existing users - UPDATE THESE with correct credentials
const TEST_ORGANIZER = {
  email: 'organizer1@test.com',
  password: 'Password123!' // Default test password
};

const TEST_PARTICIPANT = {
  email: 'user1@test.com',
  password: 'Password123!' // Default test password
};

async function login(email, password) {
  try {
    console.log(`   Attempting login for: ${email}`);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    console.log(`   ✅ Login successful`);
    return response.data.data.accessToken;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error(`   ❌ Invalid credentials for ${email}`);
      console.error(`   💡 Please update TEST_ORGANIZER or TEST_PARTICIPANT password in the script`);
    } else {
      console.error('   Login error:', error.response?.data || error.message);
    }
    throw error;
  }
}

async function getBalance(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  } catch (error) {
    console.error('Get balance error:', error.response?.data || error.message);
    throw error;
  }
}

async function getEvents(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/events?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.events || [];
  } catch (error) {
    console.error('Get events error:', error.response?.data || error.message);
    throw error;
  }
}

async function getUserProfile(token) {
  try {
    // Try different profile endpoints
    const endpoints = ['/auth/me', '/auth/profile', '/users/me'];
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        });
        if (response.status === 200 && response.data.success) {
          return response.data.data.user || response.data.data;
        }
      } catch (e) {
        continue;
      }
    }
    // If all fail, extract from token (decode JWT) or use defaults
    console.log('   ⚠️  Could not get profile, using defaults');
    return {
      fullName: 'Test User',
      email: TEST_PARTICIPANT.email,
      phoneNumber: '081234567890',
    };
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    // Return defaults
    return {
      fullName: 'Test User',
      email: TEST_PARTICIPANT.email,
      phoneNumber: '081234567890',
    };
  }
}

async function createPaymentOrder(token, eventId, amount, userProfile) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-order`,
      {
        eventId,
        amount,
        customerName: userProfile.fullName,
        customerEmail: userProfile.email,
        customerPhone: userProfile.phoneNumber || '081234567890',
        paymentMethod: 'MIDTRANS',
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    // Handle different response structures
    if (response.data.data?.payment) {
      return response.data.data.payment;
    } else if (response.data.data) {
      return response.data.data;
    } else if (response.data.payment) {
      return response.data.payment;
    } else {
      return response.data;
    }
  } catch (error) {
    console.error('Create payment order error:', error.response?.data || error.message);
    throw error;
  }
}

async function syncPaymentStatus(token, orderId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/order/${orderId}/sync`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Sync payment status error:', error.response?.data || error.message);
    throw error;
  }
}

async function testFlow() {
  console.log('🧪 Starting Payment Flow Test...\n');
  console.log('📝 Note: Make sure backend is running on port 5002\n');

  try {
    // Step 1: Login as Organizer
    console.log('1️⃣  Logging in as Organizer...');
    let organizerToken;
    try {
      organizerToken = await login(TEST_ORGANIZER.email, TEST_ORGANIZER.password);
    } catch (error) {
      console.log('\n⚠️  Organizer login failed. Please:');
      console.log('   1. Check if organizer1@test.com exists');
      console.log('   2. Update TEST_ORGANIZER.password in the script');
      console.log('   3. Or use a different organizer email\n');
      return;
    }

    // Step 2: Get Balance Before
    console.log('\n2️⃣  Getting organizer balance (before)...');
    let balanceBefore;
    try {
      balanceBefore = await getBalance(organizerToken);
      console.log('📊 Balance Before:');
      console.log(`   Available: Rp ${balanceBefore.stats.availableBalance.toLocaleString('id-ID')}`);
      console.log(`   Total Earned: Rp ${balanceBefore.stats.totalEarned.toLocaleString('id-ID')}`);
    } catch (error) {
      console.log('   ⚠️  Could not get balance (might be first time, will be created automatically)');
      balanceBefore = { stats: { availableBalance: 0, totalEarned: 0 } };
    }

    // Step 3: Get Existing Paid Event or Create New
    console.log('\n3️⃣  Looking for paid events...');
    const events = await getEvents(organizerToken);
    const paidEvent = events.find(e => !e.isFree && e.price > 0 && e.isPublished);
    
    let eventId;
    if (paidEvent) {
      console.log(`   ✅ Found paid event: "${paidEvent.title}" (Rp ${paidEvent.price.toLocaleString('id-ID')})`);
      eventId = paidEvent.id;
    } else {
      console.log('   ⚠️  No paid events found. Please create a paid event first.');
      console.log('   💡 Go to /organizer/events/create and create an event with price > 0');
      return;
    }

    // Step 4: Login as Participant
    console.log('\n4️⃣  Logging in as Participant...');
    let participantToken;
    try {
      participantToken = await login(TEST_PARTICIPANT.email, TEST_PARTICIPANT.password);
    } catch (error) {
      console.log('\n⚠️  Participant login failed. Please:');
      console.log('   1. Check if user1@test.com exists');
      console.log('   2. Update TEST_PARTICIPANT.password in the script');
      console.log('   3. Or use a different participant email\n');
      return;
    }

    // Step 5: Get Participant Profile
    console.log('\n5️⃣  Getting participant profile...');
    const participantProfile = await getUserProfile(participantToken);
    console.log(`   ✅ Profile: ${participantProfile.fullName} (${participantProfile.email})`);

    // Step 6: Create Payment Order
    console.log('\n6️⃣  Creating payment order...');
    const payment = await createPaymentOrder(participantToken, eventId, paidEvent.price, participantProfile);
    console.log(`   ✅ Payment order created:`);
    console.log(`      Payment ID: ${payment.id || payment.paymentId || 'N/A'}`);
    console.log(`      Order ID: ${payment.paymentReference || payment.orderId || 'N/A'}`);
    console.log(`      Amount: Rp ${parseFloat(payment.amount || 0).toLocaleString('id-ID')}`);
    console.log(`      Status: ${payment.paymentStatus || 'PENDING'}`);

    const paymentId = payment.id || payment.paymentId;
    const orderId = payment.paymentReference || payment.orderId;

    // Step 7: Manually update payment to PAID (for testing)
    console.log('\n7️⃣  Updating payment status to PAID (for testing)...');
    console.log('   💡 In production, this would come from Midtrans webhook');
    
    // Try to trigger registration manually
    try {
      if (paymentId) {
        const triggerRes = await axios.post(
          `${API_BASE_URL}/payments/${paymentId}/trigger-registration`,
          {},
          {
            headers: { Authorization: `Bearer ${participantToken}` },
            validateStatus: () => true,
          }
        );
        if (triggerRes.data.success) {
          console.log('   ✅ Registration triggered');
        } else {
          console.log('   ⚠️  Trigger failed:', triggerRes.data.message);
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not trigger registration:', error.response?.data?.message || error.message);
    }
    
    // Try sync if we have orderId
    if (orderId) {
      try {
        const syncResult = await syncPaymentStatus(participantToken, orderId);
        if (syncResult.success) {
          console.log('   ✅ Payment synced');
        }
      } catch (error) {
        console.log('   ⚠️  Sync failed (payment might need manual update)');
      }
    }

    // Step 8: Wait for processing
    console.log('\n8️⃣  Waiting for balance update (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 9: Check Balance After
    console.log('\n9️⃣  Getting organizer balance (after)...');
    const balanceAfter = await getBalance(organizerToken);
    console.log('📊 Balance After:');
    console.log(`   Available: Rp ${balanceAfter.stats.availableBalance.toLocaleString('id-ID')}`);
    console.log(`   Total Earned: Rp ${balanceAfter.stats.totalEarned.toLocaleString('id-ID')}`);

    // Step 10: Verify
    console.log('\n🔟 Verifying balance update...');
    const expectedRevenue = paidEvent.price * 0.85; // 85% for organizer
    const balanceIncrease = balanceAfter.stats.totalEarned - balanceBefore.stats.totalEarned;
    
    console.log(`   Expected Revenue (85%): Rp ${expectedRevenue.toLocaleString('id-ID')}`);
    console.log(`   Actual Increase: Rp ${balanceIncrease.toLocaleString('id-ID')}`);
    
    if (balanceIncrease > 0) {
      console.log('   ✅ Balance increased!');
    } else {
      console.log('   ⚠️  Balance not updated yet (payment might still be PENDING)');
      console.log('   💡 Make sure payment status is PAID for balance to update');
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📝 Summary:');
    console.log(`   Event: ${paidEvent.title}`);
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Payment Status: ${payment.paymentStatus}`);
    console.log(`   Balance Increase: Rp ${balanceIncrease.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run test
testFlow()
  .then(() => {
    console.log('\n✅ Test script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test error:', error);
    process.exit(1);
  });

