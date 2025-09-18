const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDZYyoUJnEjkjueiwM3LQxsvDwlMp3O8hM",
  authDomain: "eduapp-62956.firebaseapp.com",
  projectId: "eduapp-62956",
  storageBucket: "eduapp-62956.appspot.com",
  messagingSenderId: "265182560724",
  appId: "1:265182560724:web:9e582460d99b3edf4d1641",
  measurementId: "G-6LBTTEV23F"
};

console.log('🔥 Initializing Firebase...');
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Test Firebase Firestore connection
async function testFirestore() {
  try {
    console.log('📝 Testing Firestore connection...');
    
    // Write test data
    console.log('Writing test data to Firestore...');
    await setDoc(doc(db, 'test', 'connection'), {
      message: 'Firestore connected successfully!',
      timestamp: new Date(),
      status: 'active'
    });
    console.log('✅ Data written successfully to Firestore');
    
    // Read test data
    console.log('Reading test data from Firestore...');
    const docSnap = await getDoc(doc(db, 'test', 'connection'));
    if (docSnap.exists()) {
      console.log('✅ Data read successfully from Firestore:', docSnap.data());
    } else {
      console.log('❌ No data found in Firestore');
    }
    
    console.log('🎉 Firestore connection test completed successfully!');
  } catch (error) {
    console.error('❌ Firestore connection error:', error);
  }
}

testFirestore();