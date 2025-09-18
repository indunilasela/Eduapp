const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDZYyoUJnEjkjueiwM3LQxsvDwlMp3O8hM",
  authDomain: "eduapp-62956.firebaseapp.com",
  databaseURL: "https://eduapp-62956-default-rtdb.firebaseio.com",
  projectId: "eduapp-62956",
  storageBucket: "eduapp-62956.appspot.com",
  messagingSenderId: "265182560724",
  appId: "1:265182560724:web:9e582460d99b3edf4d1641",
  measurementId: "G-6LBTTEV23F"
};

console.log('Initializing Firebase...');
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Test Firebase connection
async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    // Write test data
    console.log('Writing test data...');
    await set(ref(db, 'test/connection'), {
      message: 'Firebase connected successfully!',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Data written successfully');
    
    // Read test data
    console.log('Reading test data...');
    const snapshot = await get(ref(db, 'test/connection'));
    if (snapshot.exists()) {
      console.log('✅ Data read successfully:', snapshot.val());
    } else {
      console.log('❌ No data found');
    }
    
    console.log('🎉 Firebase connection test completed successfully!');
  } catch (error) {
    console.error('❌ Firebase connection error:', error);
  }
}

testFirebase();