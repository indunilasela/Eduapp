// Test script for Delete Answer endpoint
const http = require('http');

// Test delete endpoint (will fail without valid JWT token)
function testDeleteEndpoint() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({});
    
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/answers/test-answer-id',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log('🧪 Delete Endpoint Test:');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, result);
          
          if (res.statusCode === 401 && result.message === 'Access token required') {
            console.log('✅ Delete endpoint is working (authentication required as expected)');
          } else {
            console.log('ℹ️ Unexpected response (may need JWT token)');
          }
          
          resolve(result);
        } catch (error) {
          console.log('❌ Delete Endpoint JSON Parse Error:', error.message);
          resolve({ error: error.message, rawResponse: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Delete Endpoint Request Error:', error.message);
      resolve({ error: error.message });
    });
    
    req.write(data);
    req.end();
  });
}

// Test health check to verify delete endpoint is listed
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/add-answer/health',
      method: 'GET'
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('🏥 Health Check:');
          console.log('   Available endpoints:');
          result.endpoints.forEach(endpoint => {
            console.log(`   - ${endpoint}`);
          });
          
          const hasDeleteEndpoint = result.endpoints.some(ep => 
            ep.includes('DELETE /api/answers/:answerId')
          );
          
          if (hasDeleteEndpoint) {
            console.log('✅ Delete endpoint is registered in health check');
          } else {
            console.log('❌ Delete endpoint not found in health check');
          }
          
          resolve(result);
        } catch (error) {
          console.log('❌ Health Check Parse Error:', error.message);
          resolve({ error: error.message });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Health Check Error:', error.message);
      resolve({ error: error.message });
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Delete Answer Functionality...\n');
  
  try {
    console.log('1. Testing Health Check for Delete Endpoint...');
    await testHealthCheck();
    console.log('');
    
    console.log('2. Testing Delete Endpoint (without authentication)...');
    await testDeleteEndpoint();
    console.log('');
    
    console.log('🎉 Delete endpoint tests completed!');
    console.log('💡 To test with authentication, use Postman with a valid JWT token.');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

runTests();