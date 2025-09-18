const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, connectFirestoreEmulator } = require('firebase/firestore');

const app = express();
const PORT = process.env.PORT || 4000;

// JWT Secret (in production, store this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Add middleware for JSON parsing
app.use(express.json());

const firebaseConfig = {
  apiKey: "AIzaSyDZYyoUJnEjkjueiwM3LQxsvDwlMp3O8hM",
  authDomain: "eduapp-62956.firebaseapp.com",
  projectId: "eduapp-62956",
  storageBucket: "eduapp-62956.firebasestorage.app",
  messagingSenderId: "265182560724",
  appId: "1:265182560724:web:9e582460d99b3edf4d1641",
  measurementId: "G-6LBTTEV23F"
};

console.log('🔥 Initializing Firebase...');
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Improved Firebase utility functions with better error handling
async function writeUserData(userId, userData) {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, message: 'User data written successfully' };
  } catch (error) {
    console.error('❌ Error writing user data:', error);
    
    // Check if it's a Firestore not enabled error
    if (error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
      return { 
        success: false, 
        error: 'Firestore database not enabled. Please enable Firestore in Firebase Console.',
        firestoreError: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

async function readUserData(userId) {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, message: 'No user data found' };
    }
  } catch (error) {
    console.error('❌ Error reading user data:', error);
    
    // Check if it's a Firestore not enabled error
    if (error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
      return { 
        success: false, 
        error: 'Firestore database not enabled. Please enable Firestore in Firebase Console.',
        firestoreError: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

// Authentication utility functions
async function findUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        success: true,
        user: {
          id: userDoc.id,
          ...userDoc.data()
        }
      };
    }
    return { success: false, message: 'User not found' };
  } catch (error) {
    console.error('❌ Error finding user:', error);
    
    // Check if it's a Firestore not enabled error
    if (error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
      return { 
        success: false, 
        error: 'Firestore database not enabled. Please enable Firestore in Firebase Console.',
        firestoreError: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

async function createUser(userData) {
  try {
    const userId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, userId, message: 'User created successfully' };
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Check if it's a Firestore not enabled error
    if (error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
      return { 
        success: false, 
        error: 'Firestore database not enabled. Please enable Firestore in Firebase Console.',
        firestoreError: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

// Validation functions
function validateSignupData(username, email, password, confirmPassword) {
  const errors = [];
  
  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  
  return errors;
}

function validateSigninData(email, password) {
  const errors = [];
  
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!password) {
    errors.push('Password is required');
  }
  
  return errors;
}

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to eduback backend!', 
    status: 'Server running',
    firebaseStatus: 'Connected (enable Firestore in Firebase Console if you see errors)',
    timestamp: new Date().toISOString(),
    endpoints: {
      signup: 'POST /auth/signup',
      signin: 'POST /auth/signin',
      users: 'GET /users/:id',
      firestoreSetup: 'Check FIREBASE_SETUP_GUIDE.md for Firestore setup'
    }
  });
});

// Authentication Routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validate input data
    const validationErrors = validateSignupData(username, email, password, confirmPassword);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    
    // Handle Firestore errors specifically
    if (existingUser.firestoreError) {
      return res.status(503).json({
        success: false,
        error: existingUser.error,
        solution: 'Please enable Firestore in Firebase Console. Check FIREBASE_SETUP_GUIDE.md for instructions.'
      });
    }
    
    if (existingUser.success) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const userData = {
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword
    };
    
    const result = await createUser(userData);
    
    // Handle Firestore errors specifically
    if (result.firestoreError) {
      return res.status(503).json({
        success: false,
        error: result.error,
        solution: 'Please enable Firestore in Firebase Console. Check FIREBASE_SETUP_GUIDE.md for instructions.'
      });
    }
    
    if (result.success) {
      // Generate JWT token
      const token = jwt.sign(
        { userId: result.userId, email: userData.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: result.userId,
          username: userData.username,
          email: userData.email
        },
        token
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create user'
      });
    }
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input data
    const validationErrors = validateSigninData(email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Find user by email
    const userResult = await findUserByEmail(email.toLowerCase());
    
    // Handle Firestore errors specifically
    if (userResult.firestoreError) {
      return res.status(503).json({
        success: false,
        error: userResult.error,
        solution: 'Please enable Firestore in Firebase Console. Check FIREBASE_SETUP_GUIDE.md for instructions.'
      });
    }
    
    if (!userResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userResult.user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: userResult.user.id, email: userResult.user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Signin successful',
      user: {
        id: userResult.user.id,
        username: userResult.user.username,
        email: userResult.user.email
      },
      token
    });
  } catch (error) {
    console.error('❌ Signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test Firebase connection
app.get('/test-firebase', async (req, res) => {
  try {
    const testData = {
      message: 'Firebase test successful',
      timestamp: new Date().toISOString()
    };
    
    const result = await writeUserData('test-user', testData);
    
    if (result.firestoreError) {
      return res.status(503).json({
        success: false,
        error: result.error,
        solution: 'Please enable Firestore in Firebase Console. Check FIREBASE_SETUP_GUIDE.md for instructions.',
        status: 'Firestore not enabled'
      });
    }
    
    if (result.success) {
      const readResult = await readUserData('test-user');
      res.json({
        success: true,
        writeResult: result,
        readResult: readResult,
        status: 'Firestore working correctly'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      solution: 'Check FIREBASE_SETUP_GUIDE.md for Firestore setup instructions.'
    });
  }
});

// Create user endpoint
app.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username and email are required'
      });
    }
    
    const userId = Date.now().toString(); // Simple ID generation
    const result = await writeUserData(userId, { username, email });
    
    if (result.firestoreError) {
      return res.status(503).json({
        success: false,
        error: result.error,
        solution: 'Please enable Firestore in Firebase Console. Check FIREBASE_SETUP_GUIDE.md for instructions.'
      });
    }
    
    if (result.success) {
      res.status(201).json({
        success: true,
        userId,
        message: result.message
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user endpoint
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await readUserData(id);
    
    if (result.firestoreError) {
      return res.status(503).json({
        success: false,
        error: result.error,
        solution: 'Please enable Firestore in Firebase Console. Check FIREBASE_SETUP_GUIDE.md for instructions.'
      });
    }
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Visit http://localhost:${PORT} to test the connection`);
  console.log(`🔥 Firebase connection ready`);
  console.log(`📝 If you see Firestore errors, check FIREBASE_SETUP_GUIDE.md`);
});