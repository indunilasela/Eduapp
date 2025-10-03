const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, updateDoc, orderBy, limit, limitToLast, startAfter, connectFirestoreEmulator } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
console.log('🔥 Initializing Firebase...');
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Connect to Firestore emulator in development
if (process.env.NODE_ENV === 'development' && process.env.USE_FIRESTORE_EMULATOR === 'true') {
  console.log('🔧 Connecting to Firestore emulator...');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

module.exports = {
  db,
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  deleteDoc,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  limitToLast,
  startAfter
};