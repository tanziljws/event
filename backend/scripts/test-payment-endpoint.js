require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002/api';

console.log('🧪 Testing Payment Endpoints...\n');
console.log(`📍 API Base URL: ${API_BASE_URL}\n`);

// Test 1: Check if backend is running
async function testBackendHealth() {
  console.log('1️⃣  Testing backend connection...');
  try {
    // Try to hit any endpoint to see if backend is running
    const response = await axios.get(`${API_BASE_URL}/payments/history`, { 
      timeout: 3000,
      validateStatus: () => true // Accept any status
    });
    console.log('   ✅ Backend is running (port 5002)\n');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('   ❌ Backend is not running on port 5002');
      console.log('   💡 Please start backend: cd backend && npm run dev\n');
      return false;
    } else {
      // If we get 401 or other status, backend is running
      console.log('   ✅ Backend is running (port 5002)\n');
      return true;
    }
  }
}

// Test 2: Check payment routes
async function testPaymentRoutes() {
  console.log('2️⃣  Testing payment routes...');
  
  const routes = [
    { method: 'POST', path: '/payments/create-order', needsAuth: true },
    { method: 'GET', path: '/payments/history', needsAuth: true },
    { method: 'POST', path: '/payments/webhook', needsAuth: false },
    { method: 'POST', path: '/payments/order/:orderId/sync', needsAuth: false },
  ];

  for (const route of routes) {
    try {
      const testPath = route.path.replace(':orderId', 'TEST123');
      const response = await axios({
        method: route.method,
        url: `${API_BASE_URL}${testPath}`,
        validateStatus: () => true, // Don't throw on any status
        timeout: 2000,
      });

      if (response.status === 401 && route.needsAuth) {
        console.log(`   ✅ ${route.method} ${route.path} - Exists (requires auth)`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${route.method} ${route.path} - Not found`);
      } else {
        console.log(`   ✅ ${route.method} ${route.path} - Exists (status: ${response.status})`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ ${route.method} ${route.path} - Connection refused`);
      } else {
        console.log(`   ⚠️  ${route.method} ${route.path} - ${error.message}`);
      }
    }
  }
  console.log('');
}

// Test 3: Check balance routes
async function testBalanceRoutes() {
  console.log('3️⃣  Testing balance routes...');
  
  const routes = [
    { method: 'GET', path: '/balance', needsAuth: true },
    { method: 'GET', path: '/balance/history', needsAuth: true },
    { method: 'GET', path: '/balance/stats', needsAuth: true },
  ];

  for (const route of routes) {
    try {
      const response = await axios({
        method: route.method,
        url: `${API_BASE_URL}${route.path}`,
        validateStatus: () => true,
        timeout: 2000,
      });

      if (response.status === 401) {
        console.log(`   ✅ ${route.method} ${route.path} - Exists (requires auth)`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${route.method} ${route.path} - Not found`);
      } else {
        console.log(`   ✅ ${route.method} ${route.path} - Exists (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${route.method} ${route.path} - ${error.message}`);
    }
  }
  console.log('');
}

// Test 4: Check payout routes
async function testPayoutRoutes() {
  console.log('4️⃣  Testing payout routes...');
  
  const routes = [
    { method: 'GET', path: '/payout-accounts', needsAuth: true },
    { method: 'POST', path: '/payout-accounts', needsAuth: true },
    { method: 'POST', path: '/disbursements/request', needsAuth: true },
    { method: 'GET', path: '/disbursements', needsAuth: true },
  ];

  for (const route of routes) {
    try {
      const response = await axios({
        method: route.method,
        url: `${API_BASE_URL}${route.path}`,
        validateStatus: () => true,
        timeout: 2000,
      });

      if (response.status === 401) {
        console.log(`   ✅ ${route.method} ${route.path} - Exists (requires auth)`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${route.method} ${route.path} - Not found`);
      } else {
        console.log(`   ✅ ${route.method} ${route.path} - Exists (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${route.method} ${route.path} - ${error.message}`);
    }
  }
  console.log('');
}

// Run all tests
async function runTests() {
  const isRunning = await testBackendHealth();
  if (!isRunning) {
    console.log('❌ Backend is not running. Please start it first.\n');
    process.exit(1);
  }

  await testPaymentRoutes();
  await testBalanceRoutes();
  await testPayoutRoutes();

  console.log('✅ Endpoint testing completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Login as organizer to test balance endpoints');
  console.log('   2. Create a paid event');
  console.log('   3. Register and pay for the event');
  console.log('   4. Check if balance updates automatically');
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test error:', error);
    process.exit(1);
  });

