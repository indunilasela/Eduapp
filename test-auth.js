// Test script for authentication endpoints
// Use this to test your signup and signin functionality
const fetch = require('node-fetch');

const testAuth = async () => {
  const baseURL = 'http://localhost:4000';
  
  console.log('🧪 Testing Authentication Endpoints\n');
  
  // Test data
  const testUser = {
    username: 'testuser123',
    email: 'test@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  };
  
  try {
    // Test Signup
    console.log('1. Testing Signup...');
    const signupResponse = await fetch(`${baseURL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);
    
    if (signupData.success) {
      console.log('✅ Signup successful!');
      console.log('Token:', signupData.token);
      
      // Test Signin
      console.log('\n2. Testing Signin...');
      const signinResponse = await fetch(`${baseURL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      const signinData = await signinResponse.json();
      console.log('Signin Response:', signinData);
      
      if (signinData.success) {
        console.log('✅ Signin successful!');
        console.log('Token:', signinData.token);
      } else {
        console.log('❌ Signin failed:', signinData.error);
      }
    } else {
      console.log('❌ Signup failed:', signupData.errors || signupData.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run tests only if server is running
console.log('Make sure your server is running on http://localhost:4000');
console.log('Run: npm run dev\n');

// Uncomment the line below to run the test
testAuth();