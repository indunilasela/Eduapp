// Simple test script for Add Answer API
const http = require('http');

// Test 1: Health Check
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/add-answer/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Health Check Success:', result);
          resolve(result);
        } catch (error) {
          console.log('❌ Health Check JSON Parse Error:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health Check Request Error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Test 2: Get Answers for a Paper
function testGetAnswers() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/papers/test123/answers',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Get Answers Success:', result);
          resolve(result);
        } catch (error) {
          console.log('❌ Get Answers JSON Parse Error:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Get Answers Request Error:', error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Add Answer API...\n');
  
  try {
    console.log('1. Testing Health Check...');
    await testHealthCheck();
    console.log('');
    
    console.log('2. Testing Get Answers...');
    await testGetAnswers();
    console.log('');
    
    console.log('🎉 All tests completed!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

runTests();