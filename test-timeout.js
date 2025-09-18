// Quick test to verify timeout functionality
const fetch = require('node-fetch');

async function testSignupTimeout() {
  const baseURL = 'http://localhost:4000';
  
  console.log('🧪 Testing Signup with Firestore timeout...\n');
  
  const testUser = {
    username: 'timeouttest',
    email: 'timeout@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };
  
  const startTime = Date.now();
  
  try {
    console.log('Sending signup request...');
    const response = await fetch(`${baseURL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const data = await response.json();
    
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log('📝 Response:', JSON.stringify(data, null, 2));
    console.log(`🔢 Status code: ${response.status}`);
    
    if (response.status === 503 && data.error?.includes('Firestore')) {
      console.log('✅ Timeout and error handling working correctly!');
      console.log('💡 Solution: Enable Firestore in Firebase Console');
    } else if (response.status === 201) {
      console.log('✅ Firestore is enabled and working!');
    } else {
      console.log('❓ Unexpected response');
    }
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`⏱️  Error after: ${responseTime}ms`);
    console.error('❌ Test error:', error.message);
  }
}

console.log('🚀 Make sure your server is running: npm run dev');
console.log('⏰ This test will timeout after 3 seconds if Firestore is not enabled\n');

// Run the test
testSignupTimeout();