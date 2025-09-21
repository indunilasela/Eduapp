// Load environment variables
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, connectFirestoreEmulator } = require('firebase/firestore');
const { sendWelcomeEmail, sendPasswordResetEmail, testEmailConnection } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 4000;

// JWT Secret (in production, store this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Add middleware for JSON parsing
app.use(express.json());

// Enable CORS for all routes (for mobile app access)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profile-images');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + extension);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
}

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

// Firebase utility functions
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
    return { success: false, error: error.message };
  }
}

// Authentication utility functions
async function findUserByEmail(email) {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore timeout - database may not be enabled')), 3000)
    );
    
    const firestorePromise = (async () => {
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
    })();
    
    return await Promise.race([firestorePromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Error finding user:', error);
    
    // Check if it's a timeout or Firestore not enabled error
    if (error.message.includes('timeout') || error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
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
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore timeout - database may not be enabled')), 3000)
    );
    
    const firestorePromise = (async () => {
      const userId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return { success: true, userId, message: 'User created successfully' };
    })();
    
    return await Promise.race([firestorePromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Check if it's a timeout or Firestore not enabled error
    if (error.message.includes('timeout') || error.code === 'not-found' || error.message.includes('NOT_FOUND')) {
      return { 
        success: false, 
        error: 'Firestore database not enabled. Please enable Firestore in Firebase Console.',
        firestoreError: true
      };
    }
    
    return { success: false, error: error.message };
  }
}

// Password reset functions
async function storePasswordResetToken(email, resetToken) {
  try {
    const tokenData = {
      email: email.toLowerCase(),
      resetToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      used: false
    };
    
    const tokenId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, 'passwordResets', tokenId), tokenData);
    
    return { success: true, tokenId, message: 'Reset token stored successfully' };
  } catch (error) {
    console.error('❌ Error storing reset token:', error);
    return { success: false, error: error.message };
  }
}

async function verifyPasswordResetToken(email, resetToken) {
  try {
    const resetQuery = query(
      collection(db, 'passwordResets'),
      where('email', '==', email.toLowerCase()),
      where('resetToken', '==', resetToken),
      where('used', '==', false)
    );
    
    const querySnapshot = await getDocs(resetQuery);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid or expired reset token' };
    }
    
    const resetDoc = querySnapshot.docs[0];
    const resetData = resetDoc.data();
    
    // Check if token has expired
    if (new Date() > resetData.expiresAt.toDate()) {
      return { success: false, error: 'Reset token has expired' };
    }
    
    return { 
      success: true, 
      tokenId: resetDoc.id,
      resetData,
      message: 'Reset token is valid' 
    };
  } catch (error) {
    console.error('❌ Error verifying reset token:', error);
    return { success: false, error: error.message };
  }
}

async function markResetTokenAsUsed(tokenId) {
  try {
    await setDoc(doc(db, 'passwordResets', tokenId), {
      used: true,
      usedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: 'Reset token marked as used' };
  } catch (error) {
    console.error('❌ Error marking token as used:', error);
    return { success: false, error: error.message };
  }
}

async function updateUserPassword(email, newPassword) {
  try {
    const userResult = await findUserByEmail(email);
    if (!userResult.success) {
      return { success: false, error: 'User not found' };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await setDoc(doc(db, 'users', userResult.user.id), {
      password: hashedPassword,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    console.error('❌ Error updating password:', error);
    return { success: false, error: error.message };
  }
}

// Profile image utility functions
async function updateUserProfileImage(userId, imagePath) {
  try {
    await setDoc(doc(db, 'users', userId), {
      profileImage: imagePath,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: 'Profile image updated successfully' };
  } catch (error) {
    console.error('❌ Error updating profile image:', error);
    return { success: false, error: error.message };
  }
}

async function deleteUserProfileImage(userId) {
  try {
    await setDoc(doc(db, 'users', userId), {
      profileImage: null,
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: 'Profile image deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting profile image:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to delete file from filesystem
function deleteFileFromSystem(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return false;
  }
}

// OTP verification tracking functions
async function storeOTPVerification(email, resetToken) {
  try {
    const verificationData = {
      email: email.toLowerCase(),
      resetToken,
      verified: true,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes to complete password reset
    };
    
    const verificationId = `verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await setDoc(doc(db, 'otpVerifications', verificationId), verificationData);
    
    return { success: true, verificationId, message: 'OTP verification stored successfully' };
  } catch (error) {
    console.error('❌ Error storing OTP verification:', error);
    return { success: false, error: error.message };
  }
}

async function checkOTPVerification(email) {
  try {
    const verificationQuery = query(
      collection(db, 'otpVerifications'),
      where('email', '==', email.toLowerCase()),
      where('verified', '==', true)
    );
    
    const querySnapshot = await getDocs(verificationQuery);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'OTP not verified or expired' };
    }
    
    const verificationDoc = querySnapshot.docs[0];
    const verificationData = verificationDoc.data();
    
    // Check if verification has expired (10 minutes)
    if (new Date() > verificationData.expiresAt.toDate()) {
      return { success: false, error: 'OTP verification has expired. Please verify OTP again.' };
    }
    
    return { 
      success: true, 
      verificationId: verificationDoc.id,
      verificationData,
      message: 'OTP verification is valid' 
    };
  } catch (error) {
    console.error('❌ Error checking OTP verification:', error);
    return { success: false, error: error.message };
  }
}

async function clearOTPVerification(verificationId) {
  try {
    await setDoc(doc(db, 'otpVerifications', verificationId), {
      used: true,
      usedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: 'OTP verification cleared' };
  } catch (error) {
    console.error('❌ Error clearing OTP verification:', error);
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
    emailStatus: 'Welcome emails enabled',
    timestamp: new Date().toISOString(),
    endpoints: {
      signup: 'POST /auth/signup (includes welcome email)',
      signin: 'POST /auth/signin',
      forgotPassword: 'POST /auth/forgot-password',
      verifyOTP: 'POST /auth/verify-otp (Step 1: Verify OTP)',
      resetPassword: 'POST /auth/reset-password (Step 2: Set new password)',
      username: 'GET /auth/username (protected - requires Bearer token)',
      profileImageUpload: 'POST /auth/profile-image/upload (protected - multipart/form-data)',
      profileImageUpdate: 'PUT /auth/profile-image/update (protected - multipart/form-data)',
      profileImageDelete: 'DELETE /auth/profile-image/delete (protected)',
      profileImageGet: 'GET /auth/profile-image (protected)',
      users: 'GET /users/:id',
      testEmail: 'GET /test-email',
      firestoreSetup: 'Check FIREBASE_SETUP_GUIDE.md for Firestore setup'
    }
  });
});

// Test email connection endpoint
app.get('/test-email', async (req, res) => {
  try {
    console.log('🔍 Testing email connection...');
    const result = await testEmailConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email server connection successful',
        emailConfig: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          from: '123456@asela@gmail.com'
        },
        status: 'Ready to send welcome emails'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Email server connection failed',
        troubleshooting: [
          'Check email credentials',
          'Verify SMTP settings',
          'Ensure less secure app access is enabled (for Gmail)',
          'Check network connectivity'
        ]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Email test failed'
    });
  }
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
      
      // Send welcome email (don't wait for it to complete)
      console.log('📧 Sending welcome email...');
      sendWelcomeEmail(userData.email, userData.username)
        .then((emailResult) => {
          if (emailResult.success) {
            console.log('✅ Welcome email sent successfully to:', userData.email);
          } else {
            console.log('⚠️ Email sending failed but signup completed:', emailResult.message);
          }
        })
        .catch((emailError) => {
          console.error('⚠️ Email error (signup still successful):', emailError.message);
        });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully! Welcome email sent.',
        user: {
          id: result.userId,
          username: userData.username,
          email: userData.email
        },
        token,
        emailStatus: 'Welcome email is being sent to your email address'
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

// Forgot Password endpoint
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }
    
    // Check if user exists
    const userResult = await findUserByEmail(email.toLowerCase());
    if (!userResult.success) {
      // For security, we don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset email shortly.'
      });
    }
    
    // Generate reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    
    // Store reset token in database
    const storeResult = await storePasswordResetToken(email.toLowerCase(), resetToken);
    if (!storeResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate password reset token'
      });
    }
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      email.toLowerCase(),
      userResult.user.username,
      resetToken
    );
    
    if (!emailResult.success) {
      console.error('❌ Failed to send reset email:', emailResult.error);
      // Even if email fails, we don't reveal this to the user for security
    }
    
    res.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset email shortly.'
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify OTP endpoint (Step 1)
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Validate input
    const errors = [];
    
    if (!email || !validator.isEmail(email)) {
      errors.push('Please provide a valid email address');
    }
    
    if (!otp || otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      errors.push('Please provide a valid 6-digit verification code');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Verify reset token (OTP)
    const tokenResult = await verifyPasswordResetToken(email.toLowerCase(), otp.trim());
    if (!tokenResult.success) {
      return res.status(400).json({
        success: false,
        error: tokenResult.error
      });
    }
    
    // Store OTP verification for next step
    const verificationResult = await storeOTPVerification(email.toLowerCase(), otp.trim());
    if (!verificationResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to verify OTP'
      });
    }
    
    // Mark original reset token as used
    await markResetTokenAsUsed(tokenResult.tokenId);
    
    res.json({
      success: true,
      message: 'OTP verified successfully. You can now set your new password.',
      nextStep: 'Please provide your new password'
    });
    
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reset Password endpoint (Step 2)
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    
    // Validate input
    const errors = [];
    
    if (!email || !validator.isEmail(email)) {
      errors.push('Please provide a valid email address');
    }
    
    if (!newPassword || newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long');
    }
    
    if (newPassword !== confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Check if OTP was verified (Step 1 completed)
    const verificationResult = await checkOTPVerification(email.toLowerCase());
    if (!verificationResult.success) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error
      });
    }
    
    // Update user password
    const updateResult = await updateUserPassword(email.toLowerCase(), newPassword);
    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }
    
    // Clear OTP verification
    await clearOTPVerification(verificationResult.verificationId);
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
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
    if (result.success) {
      const readResult = await readUserData('test-user');
      res.json({
        success: true,
        writeResult: result,
        readResult: readResult
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
      error: error.message
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

// Get username only endpoint (protected)
app.get('/auth/username', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await readUserData(userId);
    
    if (result.success) {
      const userData = result.data;
      res.json({
        success: true,
        username: userData.username || userData.firstName || 'User'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Profile Image Upload endpoint
app.post('/auth/profile-image/upload', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const userId = req.user.userId;
    const imagePath = `/uploads/profile-images/${req.file.filename}`;

    // Get current user data to check for existing profile image
    const currentUser = await readUserData(userId);
    if (currentUser.success && currentUser.data.profileImage) {
      // Delete old profile image
      const oldImagePath = path.join(__dirname, '../', currentUser.data.profileImage);
      deleteFileFromSystem(oldImagePath);
    }

    // Update user profile image in database
    const updateResult = await updateUserProfileImage(userId, imagePath);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        profileImage: imagePath,
        imageUrl: `http://localhost:${PORT}${imagePath}`
      });
    } else {
      // Delete uploaded file if database update failed
      deleteFileFromSystem(req.file.path);
      res.status(500).json({
        success: false,
        error: 'Failed to save profile image'
      });
    }
  } catch (error) {
    // Delete uploaded file if error occurred
    if (req.file) {
      deleteFileFromSystem(req.file.path);
    }
    console.error('❌ Profile image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Profile Image Update/Edit endpoint
app.put('/auth/profile-image/update', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const userId = req.user.userId;
    const imagePath = `/uploads/profile-images/${req.file.filename}`;

    // Get current user data to delete old image
    const currentUser = await readUserData(userId);
    if (currentUser.success && currentUser.data.profileImage) {
      // Delete old profile image
      const oldImagePath = path.join(__dirname, '../', currentUser.data.profileImage);
      deleteFileFromSystem(oldImagePath);
    }

    // Update user profile image in database
    const updateResult = await updateUserProfileImage(userId, imagePath);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'Profile image updated successfully',
        profileImage: imagePath,
        imageUrl: `http://localhost:${PORT}${imagePath}`
      });
    } else {
      // Delete uploaded file if database update failed
      deleteFileFromSystem(req.file.path);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile image'
      });
    }
  } catch (error) {
    // Delete uploaded file if error occurred
    if (req.file) {
      deleteFileFromSystem(req.file.path);
    }
    console.error('❌ Profile image update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Profile Image Delete endpoint
app.delete('/auth/profile-image/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user data to find image path
    const currentUser = await readUserData(userId);
    if (!currentUser.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!currentUser.data.profileImage) {
      return res.status(400).json({
        success: false,
        error: 'No profile image to delete'
      });
    }

    // Delete image from filesystem
    const imagePath = path.join(__dirname, '../', currentUser.data.profileImage);
    const fileDeleted = deleteFileFromSystem(imagePath);

    // Remove profile image from database
    const updateResult = await deleteUserProfileImage(userId);
    
    if (updateResult.success) {
      res.json({
        success: true,
        message: 'Profile image deleted successfully',
        fileDeleted: fileDeleted
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete profile image from database'
      });
    }
  } catch (error) {
    console.error('❌ Profile image delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get Profile Image endpoint
app.get('/auth/profile-image', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get current user data
    const currentUser = await readUserData(userId);
    if (!currentUser.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!currentUser.data.profileImage) {
      return res.json({
        success: true,
        profileImage: null,
        message: 'No profile image set'
      });
    }

    res.json({
      success: true,
      profileImage: currentUser.data.profileImage,
      imageUrl: `http://localhost:${PORT}${currentUser.data.profileImage}`
    });
  } catch (error) {
    console.error('❌ Get profile image error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Network accessible at http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local access at http://localhost:${PORT}`);
  console.log(`🔥 Firebase connection ready`);
});
