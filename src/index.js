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
const { getFirestore, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, connectFirestoreEmulator } = require('firebase/firestore');
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
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Length, Cache-Control');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
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

// Notes file upload configuration (supports pptx, docx, pdf, txt)
const notesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/notes');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const notesFileFilter = (req, file, cb) => {
  // Allow pptx, docx, pdf, txt files
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/pdf', // pdf
    'text/plain' // txt
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PPTX, DOCX, PDF, and TXT files are allowed'), false);
  }
};

const uploadNotes = multer({
  storage: notesStorage,
  fileFilter: notesFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for notes
  }
});

// PDF storage configuration for papers
const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/papers');
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
    cb(null, 'paper-' + uniqueSuffix + extension);
  }
});

// File filter for PDFs only
const pdfFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Multer upload configuration for PDFs
const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
  }
});

// Configure multer for answer uploads (PDFs)
const answerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/answers/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_'); // Replace spaces with underscores
    cb(null, `answer_${timestamp}_${originalName}`);
  }
});

// File filter for answer PDFs
const answerFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for answers'), false);
  }
};

// Multer upload configuration for Answer PDFs
const uploadAnswer = multer({
  storage: answerStorage,
  fileFilter: answerFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for answer PDFs
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
      subjects: 'GET /subjects (approved), POST /subjects/create (protected)',
      subjectNotes: 'GET /subjects/:id/notes, POST /subjects/:id/notes/upload (protected)',
      noteDownload: 'GET /notes/:id/download (all users)',
      noteDelete: 'DELETE /notes/:id (admin/uploader only)',
      testUpload: 'POST /test-upload (debug multipart issues)',
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

// Admin middleware - only allows admin user (i.asela016@gmail.com)
async function isAdmin(req, res, next) {
  try {
    const userId = req.user.userId;
    const userData = await readUserData(userId);
    
    if (!userData.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is admin
    if (userData.data.email !== 'i.asela016@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Admin verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// Subject utility functions
async function createSubject(subjectData) {
  try {
    const subjectId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'subjects', subjectId), {
      ...subjectData,
      id: subjectId,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, subjectId, message: 'Subject created successfully' };
  } catch (error) {
    console.error('❌ Error creating subject:', error);
    return { success: false, error: error.message };
  }
}

async function getSubjects(status = null, userId = null) {
  try {
    const subjectsRef = collection(db, 'subjects');
    let q;
    
    if (status && userId) {
      // For getting user's own subjects regardless of status
      q = query(subjectsRef, where('userId', '==', userId));
    } else if (status) {
      // For getting subjects by status (e.g., approved subjects for all users)
      q = query(subjectsRef, where('status', '==', status));
    } else {
      // For admin to get all subjects
      q = query(subjectsRef);
    }
    
    const querySnapshot = await getDocs(q);
    const subjects = [];
    
    querySnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, subjects };
  } catch (error) {
    console.error('❌ Error fetching subjects:', error);
    return { success: false, error: error.message };
  }
}

async function updateSubjectStatus(subjectId, status, adminId) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    await setDoc(subjectRef, {
      status: status,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: `Subject ${status} successfully` };
  } catch (error) {
    console.error('❌ Error updating subject status:', error);
    return { success: false, error: error.message };
  }
}

// Notes utility functions
async function createNote(noteData) {
  try {
    const noteId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'notes', noteId), {
      ...noteData,
      id: noteId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, noteId, message: 'Note uploaded successfully' };
  } catch (error) {
    console.error('❌ Error creating note:', error);
    return { success: false, error: error.message };
  }
}

async function getNotesBySubject(subjectId) {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where('subjectId', '==', subjectId));
    const querySnapshot = await getDocs(q);
    
    const notes = [];
    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Separate notes into books and short notes
    const books = notes.filter(note => note.type === 'book');
    const shortNotes = notes.filter(note => note.type === 'short_note');
    
    return { success: true, books, shortNotes, totalNotes: notes.length };
  } catch (error) {
    console.error('❌ Error getting notes:', error);
    return { success: false, error: error.message };
  }
}

async function deleteNote(noteId, userRole, userId) {
  try {
    const noteDoc = await getDoc(doc(db, 'notes', noteId));
    
    if (!noteDoc.exists()) {
      return { success: false, error: 'Note not found' };
    }
    
    const noteData = noteDoc.data();
    
    // Only admin or the uploader can delete notes
    if (userRole !== 'admin' && noteData.uploaderId !== userId) {
      return { success: false, error: 'Permission denied. Only admin or uploader can delete notes.' };
    }
    
    // Delete the file from filesystem
    if (noteData.filePath) {
      const fullPath = path.join(__dirname, '..', noteData.filePath.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'notes', noteId));
    
    return { success: true, message: 'Note deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    return { success: false, error: error.message };
  }
}

async function deleteSubject(subjectId) {
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
    return { success: true, message: 'Subject deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting subject:', error);
    return { success: false, error: error.message };
  }
}

// Paper utility functions
async function createPaper(paperData) {
  try {
    const paperId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'papers', paperId), {
      ...paperData,
      id: paperId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, paperId, message: 'Paper uploaded successfully' };
  } catch (error) {
    console.error('❌ Error creating paper:', error);
    return { success: false, error: error.message };
  }
}

async function getPapers(subjectId, type = null) {
  try {
    const papersRef = collection(db, 'papers');
    let q;
    
    if (type) {
      // Filter by subject and type
      q = query(papersRef, where('subjectId', '==', subjectId), where('type', '==', type));
    } else {
      // Get all papers for subject
      q = query(papersRef, where('subjectId', '==', subjectId));
    }
    
    const querySnapshot = await getDocs(q);
    const papers = [];
    
    querySnapshot.forEach((doc) => {
      papers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, papers };
  } catch (error) {
    console.error('❌ Error fetching papers:', error);
    return { success: false, error: error.message };
  }
}

async function deletePaper(paperId) {
  try {
    // Get paper data first to delete file
    const paperDoc = await getDoc(doc(db, 'papers', paperId));
    if (paperDoc.exists()) {
      const paperData = paperDoc.data();
      
      // Delete file from filesystem
      if (paperData.filePath) {
        const fullPath = path.join(__dirname, '..', paperData.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      
      // Delete from database
      await deleteDoc(doc(db, 'papers', paperId));
      return { success: true, message: 'Paper deleted successfully' };
    } else {
      return { success: false, error: 'Paper not found' };
    }
  } catch (error) {
    console.error('❌ Error deleting paper:', error);
    return { success: false, error: error.message };
  }
}

async function getPaperById(paperId) {
  try {
    const docSnap = await getDoc(doc(db, 'papers', paperId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, message: 'Paper not found' };
    }
  } catch (error) {
    console.error('❌ Error reading paper data:', error);
    return { success: false, error: error.message };
  }
}

// ===============================
// ANSWER UTILITY FUNCTIONS
// ===============================

async function addAnswer(data) {
  try {
    const answersRef = collection(db, 'answers');
    const docRef = await addDoc(answersRef, data);
    console.log('✅ Answer added successfully with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error adding answer:', error);
    return { success: false, error: error.message };
  }
}

async function getAnswersByPaper(paperId) {
  try {
    const answersRef = collection(db, 'answers');
    const q = query(answersRef, where('paperId', '==', paperId));
    const querySnapshot = await getDocs(q);
    
    const answers = [];
    querySnapshot.forEach((doc) => {
      answers.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Retrieved ${answers.length} answers for paper: ${paperId}`);
    return { success: true, data: answers };
  } catch (error) {
    console.error('❌ Error reading answers data:', error);
    return { success: false, error: error.message };
  }
}

async function deleteAnswer(answerId) {
  try {
    const docRef = doc(db, 'answers', answerId);
    await deleteDoc(docRef);
    console.log('✅ Answer deleted successfully:', answerId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting answer:', error);
    return { success: false, error: error.message };
  }
}

async function getAnswerById(answerId) {
  try {
    const docSnap = await getDoc(doc(db, 'answers', answerId));
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, message: 'Answer not found' };
    }
  } catch (error) {
    console.error('❌ Error reading answer data:', error);
    return { success: false, error: error.message };
  }
}

// ===============================
// ANSWER MANAGEMENT ENDPOINTS
// ===============================

// Upload Answer endpoint
app.post('/papers/:paperId/answers/upload', authenticateToken, uploadAnswer.single('answerFile'), async (req, res) => {
  try {
    const { paperId } = req.params;
    const { title, description } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!title || !req.file) {
      return res.status(400).json({
        success: false,
        error: 'Title and answer file are required'
      });
    }

    // Verify the paper exists
    const paperCheck = await getPaperById(paperId);
    if (!paperCheck.success) {
      // Delete uploaded file if paper doesn't exist
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      return res.status(404).json({
        success: false,
        error: 'Paper not found'
      });
    }

    // Get user data for uploader info
    const userData = await readUserData(userId);
    if (!userData.success) {
      return res.status(400).json({
        success: false,
        error: 'Unable to fetch user data'
      });
    }

    const answerData = {
      paperId: paperId,
      title: title.trim(),
      description: description ? description.trim() : '',
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path.replace(/\\/g, '/'),
      fileSize: req.file.size,
      uploadedBy: userId,
      uploaderName: userData.data.fullName || 'Unknown',
      uploaderEmail: userData.data.email || 'unknown@example.com',
      uploadedAt: new Date()
    };

    const result = await addAnswer(answerData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Answer uploaded successfully',
        data: {
          id: result.id,
          paperId: paperId,
          title: answerData.title,
          description: answerData.description,
          fileName: answerData.fileName,
          originalFileName: answerData.originalFileName,
          uploadedBy: answerData.uploaderName,
          uploadedAt: answerData.uploadedAt
        }
      });
    } else {
      // Delete uploaded file on database error
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
      res.status(500).json({
        success: false,
        error: 'Failed to save answer data'
      });
    }
  } catch (error) {
    console.error('❌ Error uploading answer:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get Answers by Paper endpoint
app.get('/papers/:paperId/answers', async (req, res) => {
  try {
    const { paperId } = req.params;

    // Verify the paper exists
    const paperCheck = await getPaperById(paperId);
    if (!paperCheck.success) {
      return res.status(404).json({
        success: false,
        error: 'Paper not found'
      });
    }

    const result = await getAnswersByPaper(paperId);

    if (result.success) {
      // Format response data
      const formattedAnswers = result.data.map(answer => ({
        id: answer.id,
        paperId: answer.paperId,
        title: answer.title,
        description: answer.description || '',
        originalFileName: answer.originalFileName,
        fileSize: answer.fileSize,
        uploadedBy: answer.uploaderName,
        uploadedAt: answer.uploadedAt
      }));

      res.json({
        success: true,
        data: formattedAnswers,
        total: formattedAnswers.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to retrieve answers'
      });
    }
  } catch (error) {
    console.error('❌ Error retrieving answers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Download Answer endpoint
app.get('/answers/:answerId/download', async (req, res) => {
  try {
    const { answerId } = req.params;

    const result = await getAnswerById(answerId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    const answer = result.data;
    const filePath = path.resolve(answer.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Answer file not found on server'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${answer.originalFileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('❌ Error streaming answer file:', err);
      res.status(500).json({
        success: false,
        error: 'Error downloading answer file'
      });
    });

  } catch (error) {
    console.error('❌ Error downloading answer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete Answer endpoint
app.delete('/answers/:answerId', authenticateToken, async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user.userId;
    const userEmail = req.user.email;

    // Get answer data first to check ownership
    const answerResult = await getAnswerById(answerId);
    if (!answerResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    const answer = answerResult.data;

    // Check permissions: admin or uploader can delete
    const isAdmin = userEmail === 'i.asela016@gmail.com';
    const isUploader = answer.uploadedBy === userId;

    if (!isAdmin && !isUploader) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this answer'
      });
    }

    // Delete from database
    const deleteResult = await deleteAnswer(answerId);
    
    if (deleteResult.success) {
      // Delete the actual file
      try {
        if (fs.existsSync(answer.filePath)) {
          fs.unlinkSync(answer.filePath);
          console.log('✅ Answer file deleted from server:', answer.filePath);
        }
      } catch (fileError) {
        console.error('❌ Error deleting answer file:', fileError);
        // Continue anyway since database record is deleted
      }

      res.json({
        success: true,
        message: 'Answer deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: deleteResult.error || 'Failed to delete answer'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting answer:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===============================
// SUBJECT MANAGEMENT ENDPOINTS
// ===============================

// Create Subject endpoint
app.post('/subjects/create', authenticateToken, async (req, res) => {
  try {
    const { subject, grade, school, description } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!subject || !grade) {
      return res.status(400).json({
        success: false,
        error: 'Subject and grade are required'
      });
    }

    // Get user data for creator info
    const userData = await readUserData(userId);
    if (!userData.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const subjectData = {
      subject: subject.trim(),
      grade: grade.trim(),
      school: school ? school.trim() : null,
      description: description ? description.trim() : null,
      userId: userId,
      creatorEmail: userData.data.email,
      creatorUsername: userData.data.username || userData.data.email
    };

    const result = await createSubject(subjectData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Subject created successfully and pending admin approval',
        subjectId: result.subjectId,
        data: {
          ...subjectData,
          id: result.subjectId,
          status: 'pending'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Create subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get approved subjects (for all users)
app.get('/subjects', async (req, res) => {
  try {
    const result = await getSubjects('approved');

    if (result.success) {
      res.json({
        success: true,
        subjects: result.subjects,
        count: result.subjects.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's own subjects (all statuses)
app.get('/subjects/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getSubjects(null, userId);

    if (result.success) {
      res.json({
        success: true,
        subjects: result.subjects,
        count: result.subjects.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get my subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get pending subjects (admin only)
app.get('/admin/subjects/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await getSubjects('pending');

    if (result.success) {
      res.json({
        success: true,
        subjects: result.subjects,
        count: result.subjects.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get pending subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all subjects (admin only)
app.get('/admin/subjects', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await getSubjects(); // Get all subjects regardless of status

    if (result.success) {
      res.json({
        success: true,
        subjects: result.subjects,
        count: result.subjects.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get all subjects error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Approve subject (admin only)
app.put('/admin/subjects/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const adminId = req.user.userId;

    const result = await updateSubjectStatus(subjectId, 'approved', adminId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Approve subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reject subject (admin only)
app.put('/admin/subjects/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const adminId = req.user.userId;

    const result = await updateSubjectStatus(subjectId, 'rejected', adminId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reject subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete subject (admin only)
app.delete('/admin/subjects/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const subjectId = req.params.id;

    const result = await deleteSubject(subjectId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete subject error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===============================
// PAPER MANAGEMENT ENDPOINTS
// ===============================

// Upload Paper endpoint
app.post('/subjects/:subjectId/papers/upload', authenticateToken, uploadPDF.single('paperFile'), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { type, name, year, title } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!type || !name || !year) {
      return res.status(400).json({
        success: false,
        error: 'Type, name, and year are required'
      });
    }

    if (!['past paper', 'model paper'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "past paper" or "model paper"'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'PDF file is required'
      });
    }

    // Get user data for uploader info
    const userData = await readUserData(userId);
    if (!userData.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify subject exists
    const subjectData = await getDoc(doc(db, 'subjects', subjectId));
    if (!subjectData.exists()) {
      // Delete uploaded file if subject doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Subject not found'
      });
    }

    const paperData = {
      subjectId: subjectId,
      type: type.toLowerCase(),
      name: name.trim(),
      year: year.trim(),
      title: title ? title.trim() : null,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/uploads/papers/${req.file.filename}`,
      fileSize: req.file.size,
      uploaderId: userId,
      uploaderEmail: userData.data.email,
      uploaderUsername: userData.data.username || userData.data.email
    };

    const result = await createPaper(paperData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Paper uploaded successfully',
        paperId: result.paperId,
        data: {
          ...paperData,
          id: result.paperId
        }
      });
    } else {
      // Delete uploaded file if database save failed
      fs.unlinkSync(req.file.path);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    // Delete uploaded file if any error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('❌ Upload paper error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get Papers for Subject endpoint
app.get('/subjects/:subjectId/papers', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { type } = req.query; // Optional filter by type

    const result = await getPapers(subjectId, type);

    if (result.success) {
      res.json({
        success: true,
        papers: result.papers,
        count: result.papers.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get papers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get Past Papers for Subject endpoint
app.get('/subjects/:subjectId/papers/past', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const result = await getPapers(subjectId, 'past paper');

    if (result.success) {
      res.json({
        success: true,
        papers: result.papers,
        count: result.papers.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get past papers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get Model Papers for Subject endpoint
app.get('/subjects/:subjectId/papers/model', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const result = await getPapers(subjectId, 'model paper');

    if (result.success) {
      res.json({
        success: true,
        papers: result.papers,
        count: result.papers.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get model papers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Download Paper endpoint
app.get('/papers/:paperId/download', async (req, res) => {
  try {
    const { paperId } = req.params;
    
    const paperResult = await getPaperById(paperId);
    if (!paperResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Paper not found'
      });
    }

    const paper = paperResult.data;
    const filePath = path.join(__dirname, '..', paper.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${paper.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ Download paper error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// View Paper endpoint (for viewing in browser)
app.get('/papers/:paperId/view', async (req, res) => {
  try {
    const { paperId } = req.params;
    
    const paperResult = await getPaperById(paperId);
    if (!paperResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Paper not found'
      });
    }

    const paper = paperResult.data;
    const filePath = path.join(__dirname, '..', paper.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Set headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${paper.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('❌ View paper error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete Paper endpoint (Admin and uploader only)
app.delete('/papers/:paperId', authenticateToken, async (req, res) => {
  try {
    const { paperId } = req.params;
    const userId = req.user.userId;

    // Get paper data to check permissions
    const paperResult = await getPaperById(paperId);
    if (!paperResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Paper not found'
      });
    }

    const paper = paperResult.data;
    
    // Get user data to check if admin
    const userData = await readUserData(userId);
    if (!userData.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is admin or the uploader
    const isAdmin = userData.data.email === 'i.asela016@gmail.com';
    const isUploader = paper.uploaderId === userId;

    if (!isAdmin && !isUploader) {
      return res.status(403).json({
        success: false,
        error: 'Only admin or the uploader can delete this paper'
      });
    }

    const result = await deletePaper(paperId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete paper error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== NOTES MANAGEMENT ENDPOINTS =====

// Test endpoint for multipart uploads
app.post('/test-upload', authenticateToken, (req, res, next) => {
  console.log('🔍 Testing multipart upload...');
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  
  // Simple test with basic multer
  const testUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 } // 1MB for testing
  }).single('testFile');
  
  testUpload(req, res, (err) => {
    if (err) {
      console.error('❌ Test upload error:', err);
      return res.status(400).json({
        success: false,
        error: 'Test upload failed: ' + err.message,
        details: {
          contentType: req.headers['content-type'],
          hasBody: !!req.body,
          bodyKeys: Object.keys(req.body || {}),
          hasFile: !!req.file
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Test upload successful',
      details: {
        contentType: req.headers['content-type'],
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
        hasFile: !!req.file,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      }
    });
  });
});

// Multer error handling middleware
const handleMulterError = (upload) => {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        console.error('❌ Multer error:', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File size too large. Maximum size is 50MB'
          });
        }
        
        if (err.message === 'Only PPTX, DOCX, PDF, and TXT files are allowed') {
          return res.status(400).json({
            success: false,
            error: err.message
          });
        }
        
        if (err.message.includes('Malformed part header')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid form data. Please ensure you are sending multipart/form-data with proper headers.'
          });
        }
        
        return res.status(400).json({
          success: false,
          error: 'File upload error: ' + err.message
        });
      }
      next();
    });
  };
};

// Upload notes endpoint (Book or Short Notes)
app.post('/subjects/:subjectId/notes/upload', authenticateToken, (req, res, next) => {
  // Check content-type before processing
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type must be multipart/form-data'
    });
  }
  next();
}, handleMulterError(uploadNotes.single('noteFile')), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { noteType, subject, lessonName, bookName, title, description } = req.body;
    const { userId, email } = req.user;

    // Log request details for debugging
    console.log('📝 Note upload request:', {
      subjectId,
      noteType,
      subject,
      lessonName,
      hasFile: !!req.file,
      contentType: req.headers['content-type']
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please select a file to upload'
      });
    }

    // Validate required fields based on note type
    if (!noteType || !subject || !lessonName) {
      return res.status(400).json({
        success: false,
        error: 'Note type, subject, and lesson name are required'
      });
    }

    if (noteType === 'book' && !bookName) {
      return res.status(400).json({
        success: false,
        error: 'Book name is required for book notes'
      });
    }

    if (noteType === 'short_note' && !title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required for short notes'
      });
    }

    // Get user data
    const userData = await readUserData(userId);
    if (!userData.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create note data
    const noteData = {
      subjectId,
      type: noteType, // 'book' or 'short_note'
      subject,
      lessonName,
      description: description || '',
      fileName: req.file.originalname,
      filePath: `/uploads/notes/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploaderId: userId,
      uploaderName: userData.data.firstName + ' ' + userData.data.lastName,
      uploaderEmail: email
    };

    // Add specific fields based on note type
    if (noteType === 'book') {
      noteData.bookName = bookName;
    } else if (noteType === 'short_note') {
      noteData.title = title;
    }

    const result = await createNote(noteData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        noteId: result.noteId,
        note: noteData
      });
    } else {
      // Delete uploaded file if database save failed
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Note upload error:', error);
    
    // Delete uploaded file if error occurred
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notes by subject endpoint
app.get('/subjects/:subjectId/notes', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const result = await getNotesBySubject(subjectId);
    
    if (result.success) {
      res.json({
        success: true,
        books: result.books,
        shortNotes: result.shortNotes,
        totalNotes: result.totalNotes
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Download note endpoint (accessible to all users)
app.get('/notes/:noteId/download', async (req, res) => {
  try {
    const { noteId } = req.params;
    
    const noteDoc = await getDoc(doc(db, 'notes', noteId));
    
    if (!noteDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }
    
    const noteData = noteDoc.data();
    const filePath = path.join(__dirname, '..', noteData.filePath.replace('/uploads/', 'uploads/'));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on server'
      });
    }
    
    // Set appropriate headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${noteData.fileName}"`);
    res.setHeader('Content-Type', noteData.mimeType);
    
    // Send file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('❌ Download note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete note endpoint (admin and uploader only)
app.delete('/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.user;
    
    // Get user data to check if admin
    const userData = await readUserData(userId);
    if (!userData.success) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userRole = userData.data.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
    
    const result = await deleteNote(noteId, userRole, userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('Permission denied') ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete note error:', error);
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
