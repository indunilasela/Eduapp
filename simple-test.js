// Simple connectivity test
const http = require('http');

console.log('🔍 Testing basic server connectivity...');

const req = http.get('http://localhost:4000/api/add-answer/health', (res) => {
  console.log(`✅ Connection successful! Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('📝 Response:', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('❌ Connection failed:', err.message);
  console.log('🔍 Error code:', err.code);
  
  if (err.code === 'ECONNREFUSED') {
    console.log('💡 Server may not be running on port 4000');
  }
  
  process.exit(1);
});

req.setTimeout(3000, () => {
  console.log('⏰ Request timed out');
  req.destroy();
  process.exit(1);
});