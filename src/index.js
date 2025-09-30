// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, orderBy, limitToLast, startAfter, connectFirestoreEmulator } = require('firebase/firestore');
const { sendWelcomeEmail, sendPasswordResetEmail, testEmailConnection } = require('./emailService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Configure for your mobile app
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true
  }
});

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

// Video file upload configuration (supports mp4, avi, mov, mkv, webm)
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/videos');
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

const videoFileFilter = (req, file, cb) => {
  // Allow common video formats
  const allowedTypes = [
    'video/mp4',
    'video/avi', 
    'video/x-msvideo', // avi alternative
    'video/quicktime', // mov
    'video/x-matroska', // mkv
    'video/webm'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, AVI, MOV, MKV, and WEBM video files are allowed'), false);
  }
};

const uploadVideos = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for videos
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
      subjectVideos: 'GET /subjects/:id/videos, POST /subjects/:id/videos/upload (protected)',
      videoDownload: 'GET /videos/:id/download (approved videos + own pending)',
      videoDelete: 'DELETE /videos/:id (admin/uploader only)',
      adminVideosPending: 'GET /admin/videos/pending (admin only)',
      adminVideosApprove: 'PUT /admin/videos/:id/approve (admin only)',
      adminVideosReject: 'PUT /admin/videos/:id/reject (admin only)',
      adminVideosAll: 'GET /admin/videos (admin only)',
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

// Video utility functions
async function createVideo(videoData) {
  try {
    const videoId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'videos', videoId), {
      ...videoData,
      id: videoId,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, videoId, message: 'Video uploaded successfully and pending approval' };
  } catch (error) {
    console.error('❌ Error creating video:', error);
    return { success: false, error: error.message };
  }
}

async function getVideosBySubject(subjectId, userRole = null, userId = null) {
  try {
    const videosRef = collection(db, 'videos');
    let q;
    
    if (userRole === 'admin') {
      // Admin can see all videos
      q = query(videosRef, where('subjectId', '==', subjectId));
    } else if (userId) {
      // Regular authenticated user can see approved videos + their own pending videos
      const approvedQuery = query(videosRef, 
        where('subjectId', '==', subjectId),
        where('status', '==', 'approved')
      );
      const userPendingQuery = query(videosRef,
        where('subjectId', '==', subjectId),
        where('uploaderId', '==', userId)
      );
      
      // Get both approved videos and user's own videos
      const [approvedSnapshot, userSnapshot] = await Promise.all([
        getDocs(approvedQuery),
        getDocs(userPendingQuery)
      ]);
      
      const videos = [];
      const addedIds = new Set();
      
      // Add approved videos
      approvedSnapshot.forEach((doc) => {
        videos.push({ id: doc.id, ...doc.data() });
        addedIds.add(doc.id);
      });
      
      // Add user's own videos (if not already added)
      userSnapshot.forEach((doc) => {
        if (!addedIds.has(doc.id)) {
          videos.push({ id: doc.id, ...doc.data() });
        }
      });
      
      return { success: true, videos, totalVideos: videos.length };
    } else {
      // Public access - only approved videos
      q = query(videosRef, 
        where('subjectId', '==', subjectId),
        where('status', '==', 'approved')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const videos = [];
    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, videos, totalVideos: videos.length };
  } catch (error) {
    console.error('❌ Error getting videos:', error);
    return { success: false, error: error.message };
  }
}

async function deleteVideo(videoId, userRole, userId) {
  try {
    const videoDoc = await getDoc(doc(db, 'videos', videoId));
    
    if (!videoDoc.exists()) {
      return { success: false, error: 'Video not found' };
    }
    
    const videoData = videoDoc.data();
    
    // Only admin or the uploader can delete videos
    if (userRole !== 'admin' && videoData.uploaderId !== userId) {
      return { success: false, error: 'Permission denied. Only admin or uploader can delete videos.' };
    }
    
    // Delete the file from filesystem
    if (videoData.filePath) {
      const fullPath = path.join(__dirname, '..', videoData.filePath.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'videos', videoId));
    
    return { success: true, message: 'Video deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting video:', error);
    return { success: false, error: error.message };
  }
}

async function updateVideoStatus(videoId, status, adminId) {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await setDoc(videoRef, {
      status: status,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: `Video ${status} successfully` };
  } catch (error) {
    console.error('❌ Error updating video status:', error);
    return { success: false, error: error.message };
  }
}

async function getPendingVideos() {
  try {
    const videosRef = collection(db, 'videos');
    const q = query(videosRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const videos = [];
    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, videos };
  } catch (error) {
    console.error('❌ Error getting pending videos:', error);
    return { success: false, error: error.message };
  }
}

// Reference Link utility functions
async function createReferenceLink(linkData) {
  try {
    const linkId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'referenceLinks', linkId), {
      ...linkData,
      id: linkId,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, linkId, message: 'Reference link uploaded successfully and pending approval' };
  } catch (error) {
    console.error('❌ Error creating reference link:', error);
    return { success: false, error: error.message };
  }
}

async function getReferenceLinksForSubject(subjectId, userRole = null, userId = null) {
  try {
    const linksRef = collection(db, 'referenceLinks');
    let q;
    
    if (userRole === 'admin') {
      // Admin can see all reference links
      q = query(linksRef, where('subjectId', '==', subjectId));
    } else if (userId) {
      // Regular authenticated user can see approved links + their own pending links
      const approvedQuery = query(linksRef, 
        where('subjectId', '==', subjectId),
        where('status', '==', 'approved')
      );
      const userPendingQuery = query(linksRef,
        where('subjectId', '==', subjectId),
        where('uploaderId', '==', userId)
      );
      
      // Get both approved links and user's own links
      const [approvedSnapshot, userSnapshot] = await Promise.all([
        getDocs(approvedQuery),
        getDocs(userPendingQuery)
      ]);
      
      const links = [];
      const addedIds = new Set();
      
      // Add approved links
      approvedSnapshot.forEach((doc) => {
        links.push({ id: doc.id, ...doc.data() });
        addedIds.add(doc.id);
      });
      
      // Add user's own links (if not already added)
      userSnapshot.forEach((doc) => {
        if (!addedIds.has(doc.id)) {
          links.push({ id: doc.id, ...doc.data() });
        }
      });
      
      return { success: true, links, totalLinks: links.length };
    } else {
      // Public access - only approved links
      q = query(linksRef, 
        where('subjectId', '==', subjectId),
        where('status', '==', 'approved')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const links = [];
    querySnapshot.forEach((doc) => {
      links.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, links, totalLinks: links.length };
  } catch (error) {
    console.error('❌ Error getting reference links:', error);
    return { success: false, error: error.message };
  }
}

async function deleteReferenceLink(linkId, userRole, userId) {
  try {
    const linkDoc = await getDoc(doc(db, 'referenceLinks', linkId));
    
    if (!linkDoc.exists()) {
      return { success: false, error: 'Reference link not found' };
    }
    
    const linkData = linkDoc.data();
    
    // Only admin or the uploader can delete reference links
    if (userRole !== 'admin' && linkData.uploaderId !== userId) {
      return { success: false, error: 'Permission denied. Only admin or uploader can delete reference links.' };
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'referenceLinks', linkId));
    
    return { success: true, message: 'Reference link deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting reference link:', error);
    return { success: false, error: error.message };
  }
}

async function updateReferenceLinkStatus(linkId, status, adminId) {
  try {
    const linkRef = doc(db, 'referenceLinks', linkId);
    await setDoc(linkRef, {
      status: status,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    return { success: true, message: `Reference link ${status} successfully` };
  } catch (error) {
    console.error('❌ Error updating reference link status:', error);
    return { success: false, error: error.message };
  }
}

async function getPendingReferenceLinks() {
  try {
    const linksRef = collection(db, 'referenceLinks');
    const q = query(linksRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const links = [];
    querySnapshot.forEach((doc) => {
      links.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, links };
  } catch (error) {
    console.error('❌ Error getting pending reference links:', error);
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

// ========================================
// CHAT SYSTEM UTILITY FUNCTIONS
// ========================================

// ============================================
// NOTES CHAT FUNCTIONS
// ============================================

async function createNotesChatMessage(messageData) {
  try {
    const messageDoc = await addDoc(collection(db, 'notesChatMessages'), {
      notesId: messageData.notesId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      senderEmail: messageData.senderEmail || 'Unknown Email', 
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      reactions: {}
    });

    const messageId = messageDoc.id;
    const message = {
      id: messageId,
      notesId: messageData.notesId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      isDeleted: false,
      reactions: {}
    };
    
    return { success: true, messageId, message, status: 'Notes chat message sent successfully' };
  } catch (error) {
    console.error('❌ Error creating notes chat message:', error);
    return { success: false, error: error.message };
  }
}

async function getNotesChatMessages(notesId, lastMessageId = null, limit = 50) {
  try {
    // Simplified query to avoid composite index requirement
    let queryRef = query(
      collection(db, 'notesChatMessages'),
      where('notesId', '==', notesId)
    );

    const snapshot = await getDocs(queryRef);
    let messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      .filter(msg => !msg.isDeleted) // Filter out deleted messages in memory
      .sort((a, b) => a.createdAt - b.createdAt); // Sort by creation time

    // Apply pagination if lastMessageId is provided
    if (lastMessageId) {
      const lastMessageIndex = messages.findIndex(msg => msg.id === lastMessageId);
      if (lastMessageIndex !== -1) {
        messages = messages.slice(lastMessageIndex + 1);
      }
    }

    // Apply limit
    if (messages.length > limit) {
      messages = messages.slice(-limit); // Get last N messages
    }

    return { success: true, messages, totalMessages: messages.length };
  } catch (error) {
    console.error('❌ Error getting notes chat messages:', error);
    return { success: false, error: error.message };
  }
}

async function deleteNotesChatMessage(messageId, userRole, userId) {
  try {
    const messageDoc = await getDoc(doc(db, 'notesChatMessages', messageId));
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message not found' };
    }

    const messageData = messageDoc.data();
    
    // Check if user can delete (own message or admin)
    if (messageData.senderId !== userId && userRole !== 'admin') {
      return { success: false, error: 'Unauthorized to delete this message' };
    }

    await updateDoc(doc(db, 'notesChatMessages', messageId), {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    return { success: true, status: 'Notes chat message deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting notes chat message:', error);
    return { success: false, error: error.message };
  }
}

async function replyToNotesMessage(originalMessageId, replyData) {
  try {
    // Get original message
    const originalDoc = await getDoc(doc(db, 'notesChatMessages', originalMessageId));
    
    if (!originalDoc.exists()) {
      return { success: false, error: 'Original message not found' };
    }

    const originalMessage = originalDoc.data();
    
    // Create reply with reference to original
    const replyMessageData = {
      ...replyData,
      replyTo: {
        messageId: originalMessageId,
        originalText: originalMessage.text,
        originalSenderName: originalMessage.senderName,
        originalSenderId: originalMessage.senderId
      }
    };

    return await createNotesChatMessage(replyMessageData);
  } catch (error) {
    console.error('❌ Error replying to notes message:', error);
    return { success: false, error: error.message };
  }
}

async function getNotesChatParticipants(notesId) {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'notesChatMessages'),
        where('notesId', '==', notesId),
        where('isDeleted', '==', false)
      )
    );

    const participantsMap = new Map();
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!participantsMap.has(data.senderId)) {
        participantsMap.set(data.senderId, {
          userId: data.senderId,
          name: data.senderName,
          email: data.senderEmail,
          messageCount: 1,
          lastMessageAt: data.createdAt?.toDate() || new Date()
        });
      } else {
        const existing = participantsMap.get(data.senderId);
        existing.messageCount += 1;
        const messageDate = data.createdAt?.toDate() || new Date();
        if (messageDate > existing.lastMessageAt) {
          existing.lastMessageAt = messageDate;
        }
      }
    });

    const participants = Array.from(participantsMap.values())
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return { success: true, participants, totalParticipants: participants.length };
  } catch (error) {
    console.error('❌ Error getting notes chat participants:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// VIDEO PAGE CHAT FUNCTIONS
// ============================================

async function createVideoPageChatMessage(messageData) {
  try {
    const messageDoc = await addDoc(collection(db, 'videoPageChatMessages'), {
      videoId: messageData.videoId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      senderEmail: messageData.senderEmail || 'Unknown Email', 
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      reactions: {}
    });

    const messageId = messageDoc.id;
    const message = {
      id: messageId,
      videoId: messageData.videoId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      isDeleted: false,
      reactions: {}
    };
    
    return { success: true, messageId, message, status: 'Video page chat message sent successfully' };
  } catch (error) {
    console.error('❌ Error creating video page chat message:', error);
    return { success: false, error: error.message };
  }
}

async function getVideoPageChatMessages(videoId, lastMessageId = null, limit = 50) {
  try {
    // Simplified query to avoid composite index requirement
    let queryRef = query(
      collection(db, 'videoPageChatMessages'),
      where('videoId', '==', videoId)
    );

    const snapshot = await getDocs(queryRef);
    let messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      .filter(msg => !msg.isDeleted) // Filter out deleted messages in memory
      .sort((a, b) => a.createdAt - b.createdAt); // Sort by creation time

    // Apply pagination if lastMessageId is provided
    if (lastMessageId) {
      const lastMessageIndex = messages.findIndex(msg => msg.id === lastMessageId);
      if (lastMessageIndex !== -1) {
        messages = messages.slice(lastMessageIndex + 1);
      }
    }

    // Apply limit
    if (messages.length > limit) {
      messages = messages.slice(-limit); // Get last N messages
    }

    return { success: true, messages, totalMessages: messages.length };
  } catch (error) {
    console.error('❌ Error getting video page chat messages:', error);
    return { success: false, error: error.message };
  }
}

async function deleteVideoPageChatMessage(messageId, userRole, userId) {
  try {
    const messageDoc = await getDoc(doc(db, 'videoPageChatMessages', messageId));
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message not found' };
    }

    const messageData = messageDoc.data();
    
    // Check if user can delete (own message or admin)
    if (messageData.senderId !== userId && userRole !== 'admin') {
      return { success: false, error: 'Unauthorized to delete this message' };
    }

    await updateDoc(doc(db, 'videoPageChatMessages', messageId), {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    return { success: true, status: 'Video page chat message deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting video page chat message:', error);
    return { success: false, error: error.message };
  }
}

async function replyToVideoPageMessage(originalMessageId, replyData) {
  try {
    // Get original message to extract videoId
    const originalDoc = await getDoc(doc(db, 'videoPageChatMessages', originalMessageId));
    
    if (!originalDoc.exists()) {
      return { success: false, error: 'Original message not found' };
    }

    const originalMessage = originalDoc.data();
    
    // Create reply with reference to original and inherit videoId
    const replyMessageData = {
      ...replyData,
      videoId: originalMessage.videoId, // Get videoId from original message
      replyTo: {
        messageId: originalMessageId,
        originalText: originalMessage.text,
        originalSenderName: originalMessage.senderName,
        originalSenderId: originalMessage.senderId
      }
    };

    return await createVideoPageChatMessage(replyMessageData);
  } catch (error) {
    console.error('❌ Error replying to video page message:', error);
    return { success: false, error: error.message };
  }
}

async function getVideoPageChatParticipants(videoId) {
  try {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'videoPageChatMessages'),
        where('videoId', '==', videoId),
        where('isDeleted', '==', false)
      )
    );

    const participantsMap = new Map();
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!participantsMap.has(data.senderId)) {
        participantsMap.set(data.senderId, {
          userId: data.senderId,
          name: data.senderName,
          email: data.senderEmail,
          messageCount: 1,
          lastMessageAt: data.createdAt?.toDate() || new Date()
        });
      } else {
        const existing = participantsMap.get(data.senderId);
        existing.messageCount += 1;
        const messageDate = data.createdAt?.toDate() || new Date();
        if (messageDate > existing.lastMessageAt) {
          existing.lastMessageAt = messageDate;
        }
      }
    });

    const participants = Array.from(participantsMap.values())
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

    return { success: true, participants, totalParticipants: participants.length };
  } catch (error) {
    console.error('❌ Error getting video page chat participants:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SUBJECT CHAT FUNCTIONS (EXISTING)
// ============================================

// ============================================
// SUBJECT CHAT FUNCTIONS
// ============================================

async function createChatMessage(messageData) {
  try {
    const messageDoc = await addDoc(collection(db, 'chatMessages'), {
      subjectId: messageData.subjectId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      senderEmail: messageData.senderEmail || 'Unknown Email', 
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      reactions: {}
    });

    const messageId = messageDoc.id;
    const message = {
      id: messageId,
      subjectId: messageData.subjectId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      isDeleted: false,
      reactions: {}
    };
    
    return { success: true, messageId, message, status: 'Message sent successfully' };
  } catch (error) {
    console.error('❌ Error creating chat message:', error);
    return { success: false, error: error.message };
  }
}

async function getChatMessages(subjectId, paperId = null, lastMessageId = null, limit = 50) {
  try {
    const messagesRef = collection(db, 'chatMessages');
    
    // Subject-only messages query
    const q = query(
      messagesRef,
      where('subjectId', '==', subjectId),
      where('isDeleted', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      });
    });

    // Sort by creation time (newest first)
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    const limitedMessages = messages.slice(0, limit);
    
    return { 
      success: true, 
      messages: limitedMessages, 
      totalMessages: messages.length 
    };
  } catch (error) {
    console.error('❌ Error getting chat messages:', error);
    return { success: false, error: error.message };
  }
}

async function deleteChatMessage(messageId, userRole, userId) {
  try {
    const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message not found' };
    }
    
    const messageData = messageDoc.data();
    
    // Check permissions: admin can delete any message, users can delete their own
    if (userRole !== 'admin' && messageData.senderId !== userId) {
      return { success: false, error: 'Permission denied. You can only delete your own messages.' };
    }
    
    // Soft delete: mark as deleted instead of removing completely
    await setDoc(doc(db, 'chatMessages', messageId), {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    }, { merge: true });
    
    return { success: true, message: 'Message deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting chat message:', error);
    return { success: false, error: error.message };
  }
}

async function replyToMessage(originalMessageId, replyData) {
  try {
    // Get the original message
    const originalDoc = await getDoc(doc(db, 'chatMessages', originalMessageId));
    if (!originalDoc.exists()) {
      return { success: false, error: 'Original message not found' };
    }
    
    const originalMessage = originalDoc.data();
    
    // Create reply message with reference to original (subject-only)
    const replyMessageData = {
      ...replyData,
      replyTo: originalMessageId, // Just store the message ID for replies
      originalText: originalMessage.text,
      originalSenderName: originalMessage.senderName
    };
    
    const result = await createChatMessage(replyMessageData);
    return result;
  } catch (error) {
    console.error('❌ Error creating reply:', error);
    return { success: false, error: error.message };
  }
}

async function getChatParticipants(subjectId, paperId = null) {
  try {
    const messagesRef = collection(db, 'chatMessages');
    
    // Subject-only participants query
    const q = query(
      messagesRef,
      where('subjectId', '==', subjectId),
      where('isDeleted', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const participantsMap = new Map();
    
    querySnapshot.forEach((doc) => {
      const message = doc.data();
      if (!participantsMap.has(message.senderId)) {
        participantsMap.set(message.senderId, {
          userId: message.senderId,
          userName: message.senderName || 'Unknown User',
          userEmail: message.senderEmail || 'Unknown Email',
          messageCount: 1,
          lastMessageAt: message.createdAt?.toDate ? message.createdAt.toDate() : message.createdAt
        });
      } else {
        const existing = participantsMap.get(message.senderId);
        existing.messageCount++;
        const messageTime = message.createdAt?.toDate ? message.createdAt.toDate() : message.createdAt;
        if (new Date(messageTime) > new Date(existing.lastMessageAt)) {
          existing.lastMessageAt = messageTime;
        }
      }
    });
    
    const participants = Array.from(participantsMap.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    
    return { success: true, participants, totalParticipants: participants.length };
  } catch (error) {
    console.error('❌ Error getting chat participants:', error);
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

// ===== VIDEO MANAGEMENT ENDPOINTS =====

// Upload video endpoint
app.post('/subjects/:subjectId/videos/upload', authenticateToken, (req, res, next) => {
  // Check content-type before processing
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type must be multipart/form-data'
    });
  }
  next();
}, handleMulterError(uploadVideos.single('videoFile')), async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { subject, title, description } = req.body;
    const { userId, email } = req.user;

    // Log request details for debugging
    console.log('🎥 Video upload request:', {
      subjectId,
      subject,
      title,
      hasFile: !!req.file,
      contentType: req.headers['content-type']
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please select a video file to upload'
      });
    }

    // Validate required fields
    if (!subject || !title) {
      return res.status(400).json({
        success: false,
        error: 'Subject and title are required'
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

    // Create video data
    const videoData = {
      subjectId,
      subject,
      title,
      description: description || '',
      fileName: req.file.originalname,
      filePath: `/uploads/videos/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploaderId: userId,
      uploaderName: userData.data.firstName + ' ' + userData.data.lastName,
      uploaderEmail: email
    };

    const result = await createVideo(videoData);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        videoId: result.videoId,
        video: videoData
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
    console.error('❌ Video upload error:', error);
    
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

// Get videos by subject endpoint
app.get('/subjects/:subjectId/videos', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const authHeader = req.headers['authorization'];
    let userRole = null;
    let userId = null;
    
    // Check if user is authenticated (optional for this endpoint)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        
        // Check if user is admin
        const userData = await readUserData(userId);
        if (userData.success) {
          userRole = userData.data.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
        }
      } catch (jwtError) {
        // Invalid token, treat as public access
        console.log('Invalid or expired token, treating as public access');
      }
    }
    
    const result = await getVideosBySubject(subjectId, userRole, userId);
    
    if (result.success) {
      res.json({
        success: true,
        videos: result.videos,
        totalVideos: result.totalVideos,
        userRole: userRole,
        message: userRole === 'admin' ? 'Showing all videos (admin view)' : 
                userRole === 'user' ? 'Showing approved videos + your pending videos' : 
                'Showing approved videos only'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Download/Stream video endpoint (with approval system)
app.get('/videos/:videoId/download', async (req, res) => {
  try {
    const { videoId } = req.params;
    const authHeader = req.headers['authorization'];
    let userRole = null;
    let userId = null;
    
    // Check if user is authenticated (optional)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        
        // Check if user is admin
        const userData = await readUserData(userId);
        if (userData.success) {
          userRole = userData.data.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
        }
      } catch (jwtError) {
        // Invalid token, treat as public access
      }
    }
    
    const videoDoc = await getDoc(doc(db, 'videos', videoId));
    
    if (!videoDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    const videoData = videoDoc.data();
    
    // Check access permissions
    const canAccess = 
      videoData.status === 'approved' || // Approved videos - public access
      userRole === 'admin' || // Admin can access all videos
      (userId && videoData.uploaderId === userId); // Uploader can access their own videos
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: 'Video is pending approval and not accessible'
      });
    }
    
    const filePath = path.join(__dirname, '..', videoData.filePath.replace('/uploads/', 'uploads/'));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Video file not found on server'
      });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle video streaming with range requests
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': videoData.mimeType,
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': videoData.mimeType,
        'Content-Disposition': `attachment; filename="${videoData.fileName}"`,
      };
      
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
    
  } catch (error) {
    console.error('❌ Download video error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete video endpoint (admin and uploader only)
app.delete('/videos/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
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
    
    const result = await deleteVideo(videoId, userRole, userId);
    
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
    console.error('❌ Delete video error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== ADMIN VIDEO MANAGEMENT ENDPOINTS =====

// Get pending videos (admin only)
app.get('/admin/videos/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await getPendingVideos();
    
    if (result.success) {
      res.json({
        success: true,
        videos: result.videos,
        totalPending: result.videos.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get pending videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Approve video (admin only)
app.put('/admin/videos/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const result = await updateVideoStatus(id, 'approved', userId);
    
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
    console.error('❌ Approve video error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reject video (admin only)
app.put('/admin/videos/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const result = await updateVideoStatus(id, 'rejected', userId);
    
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
    console.error('❌ Reject video error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all videos (admin only)
app.get('/admin/videos', authenticateToken, isAdmin, async (req, res) => {
  try {
    const videosRef = collection(db, 'videos');
    const querySnapshot = await getDocs(videosRef);
    
    const videos = [];
    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Group videos by status
    const groupedVideos = {
      pending: videos.filter(v => v.status === 'pending'),
      approved: videos.filter(v => v.status === 'approved'),
      rejected: videos.filter(v => v.status === 'rejected')
    };
    
    res.json({
      success: true,
      videos: videos,
      summary: {
        total: videos.length,
        pending: groupedVideos.pending.length,
        approved: groupedVideos.approved.length,
        rejected: groupedVideos.rejected.length
      },
      groupedVideos
    });
  } catch (error) {
    console.error('❌ Get all videos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ========================================
// REFERENCE LINKS MANAGEMENT ENDPOINTS
// ========================================

// Upload reference link to a subject (authenticated users only)
app.post('/subjects/:id/links/upload', authenticateToken, async (req, res) => {
  try {
    const subjectId = req.params.id;
    const { url, title, description } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!url || !title) {
      return res.status(400).json({
        success: false,
        error: 'URL and title are required'
      });
    }
    
    // Basic URL validation
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    // Get user data for uploader info
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const linkData = {
      subjectId,
      url,
      title,
      description: description || '',
      uploaderId: userId,
      uploaderName: user.name || user.username || user.email || 'Unknown User',
      uploaderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createReferenceLink(linkData);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        linkId: result.linkId,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reference link upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get reference links for a subject
app.get('/subjects/:id/links', async (req, res) => {
  try {
    const subjectId = req.params.id;
    let userRole = null;
    let userId = null;
    
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
        
        // Check user role
        const userData = await getDoc(doc(db, 'users', userId));
        if (userData.exists()) {
          userRole = userData.data().email === 'i.asela016@gmail.com' ? 'admin' : 'user';
        }
      } catch (authError) {
        // Continue as unauthenticated user
        console.log('Invalid token, continuing as unauthenticated user');
      }
    }
    
    const result = await getReferenceLinksForSubject(subjectId, userRole, userId);
    
    if (result.success) {
      res.json({
        success: true,
        links: result.links,
        totalLinks: result.totalLinks
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get reference links error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Redirect to reference link (with click tracking)
app.get('/links/:id/redirect', async (req, res) => {
  try {
    const linkId = req.params.id;
    
    const linkDoc = await getDoc(doc(db, 'referenceLinks', linkId));
    
    if (!linkDoc.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Reference link not found'
      });
    }
    
    const linkData = linkDoc.data();
    
    // Only allow access to approved links
    if (linkData.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Reference link not approved or is pending approval'
      });
    }
    
    // Optional: Track click count
    try {
      const clickCount = (linkData.clickCount || 0) + 1;
      await setDoc(doc(db, 'referenceLinks', linkId), {
        clickCount,
        lastClickedAt: new Date()
      }, { merge: true });
    } catch (trackError) {
      console.error('❌ Click tracking error:', trackError);
      // Continue with redirect even if tracking fails
    }
    
    // Redirect to the actual URL
    res.redirect(linkData.url);
  } catch (error) {
    console.error('❌ Reference link redirect error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete reference link (uploader or admin only)
app.delete('/links/:id', authenticateToken, async (req, res) => {
  try {
    const linkId = req.params.id;
    const userId = req.user.userId;
    
    // Get user data to check role
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userRole = userData.data().email === 'i.asela016@gmail.com' ? 'admin' : 'user';
    
    const result = await deleteReferenceLink(linkId, userRole, userId);
    
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
    console.error('❌ Delete reference link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ===== ADMIN REFERENCE LINKS MANAGEMENT ENDPOINTS =====

// Get pending reference links (admin only)
app.get('/admin/links/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await getPendingReferenceLinks();
    
    if (result.success) {
      res.json({
        success: true,
        links: result.links,
        totalPending: result.links.length
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get pending reference links error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Approve reference link (admin only)
app.put('/admin/links/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
    const linkId = req.params.id;
    const adminId = req.user.userId;
    
    const result = await updateReferenceLinkStatus(linkId, 'approved', adminId);
    
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
    console.error('❌ Approve reference link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reject reference link (admin only)
app.put('/admin/links/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const linkId = req.params.id;
    const adminId = req.user.userId;
    
    const result = await updateReferenceLinkStatus(linkId, 'rejected', adminId);
    
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
    console.error('❌ Reject reference link error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all reference links (admin only)
app.get('/admin/links', authenticateToken, isAdmin, async (req, res) => {
  try {
    const linksRef = collection(db, 'referenceLinks');
    const querySnapshot = await getDocs(linksRef);
    
    const links = [];
    querySnapshot.forEach((doc) => {
      links.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Group links by status
    const groupedLinks = {
      pending: links.filter(l => l.status === 'pending'),
      approved: links.filter(l => l.status === 'approved'),
      rejected: links.filter(l => l.status === 'rejected')
    };
    
    res.json({
      success: true,
      links: links,
      summary: {
        total: links.length,
        pending: groupedLinks.pending.length,
        approved: groupedLinks.approved.length,
        rejected: groupedLinks.rejected.length
      },
      groupedLinks
    });
  } catch (error) {
    console.error('❌ Get all reference links error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ========================================
// ============================================
// NOTES CHAT ENDPOINTS
// ============================================

// Send message to notes chat
app.post('/notes/:notesId/chat', authenticateToken, async (req, res) => {
  try {
    const { notesId } = req.params;
    const { text, messageType } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1000 characters allowed.'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const messageData = {
      notesId,
      text: text.trim(),
      messageType: messageType || 'text', // text, image, file
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createNotesChatMessage(messageData);
    
    if (result.success) {
      // Broadcast via WebSocket to all users in the notes room
      const roomName = `notes_${notesId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-notes-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send notes chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reply to a notes chat message
app.post('/notes-chat/:messageId/reply', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, notesId } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }
    
    if (!notesId) {
      return res.status(400).json({
        success: false,
        error: 'Notes ID is required'
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Reply too long. Maximum 1000 characters allowed.'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const replyData = {
      notesId,
      text: text.trim(),
      messageType: 'reply',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await replyToNotesMessage(messageId, replyData);
    
    if (result.success) {
      // Broadcast reply via WebSocket to all users in the notes room
      const roomName = `notes_${notesId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-notes-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reply to notes message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notes chat messages
app.get('/notes/:notesId/chat', async (req, res) => {
  try {
    const { notesId } = req.params;
    const { limit = 50, lastMessageId } = req.query;
    
    const result = await getNotesChatMessages(notesId, lastMessageId, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        totalMessages: result.totalMessages
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get notes chat messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notes chat participants
app.get('/notes/:notesId/chat/participants', async (req, res) => {
  try {
    const { notesId } = req.params;
    
    const result = await getNotesChatParticipants(notesId);
    
    if (result.success) {
      res.json({
        success: true,
        participants: result.participants,
        totalParticipants: result.totalParticipants
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get notes chat participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete notes chat message
app.delete('/notes-chat/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role || 'user';
    
    const result = await deleteNotesChatMessage(messageId, userRole, userId);
    
    if (result.success) {
      // Broadcast message deletion via WebSocket
      if (global.io) {
        global.io.emit('notes-message-deleted', {
          messageId,
          deletedBy: userId,
          timestamp: new Date()
        });
      }
      
      res.json({
        success: true,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete notes chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin: Get notes chat statistics
app.get('/admin/notes-chat/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role || 'user';
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Get total messages
    const totalMessagesSnapshot = await getDocs(
      query(
        collection(db, 'notesChatMessages'),
        where('isDeleted', '==', false)
      )
    );
    
    // Get messages from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentMessagesSnapshot = await getDocs(
      query(
        collection(db, 'notesChatMessages'),
        where('isDeleted', '==', false),
        where('createdAt', '>=', yesterday)
      )
    );
    
    // Get unique users who sent messages
    const userIds = new Set();
    const notesWithMessages = new Set();
    
    totalMessagesSnapshot.forEach(doc => {
      const data = doc.data();
      userIds.add(data.senderId);
      notesWithMessages.add(data.notesId);
    });
    
    res.json({
      success: true,
      stats: {
        totalMessages: totalMessagesSnapshot.size,
        totalActiveUsers: userIds.size,
        totalNotesWithMessages: notesWithMessages.size,
        messagesLast24h: recentMessagesSnapshot.size,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Get notes chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================
// VIDEO PAGE CHAT ENDPOINTS
// ============================================

// Send message to video page chat
app.post('/videos/:videoId/chat', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { text, messageType } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1000 characters allowed.'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const messageData = {
      videoId,
      text: text.trim(),
      messageType: messageType || 'text', // text, image, file
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createVideoPageChatMessage(messageData);
    
    if (result.success) {
      // Broadcast via WebSocket to all users in the video page room
      const roomName = `video_${videoId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-video-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send video page chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get video page chat messages
app.get('/videos/:videoId/chat', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 50, lastMessageId } = req.query;
    
    const result = await getVideoPageChatMessages(videoId, lastMessageId, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        totalMessages: result.totalMessages
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get video page chat messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get video page chat participants
app.get('/videos/:videoId/chat/participants', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const result = await getVideoPageChatParticipants(videoId);
    
    if (result.success) {
      res.json({
        success: true,
        participants: result.participants,
        totalParticipants: result.totalParticipants
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get video page chat participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reply to a video page chat message
app.post('/video-page-chat/:messageId/reply', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body; // No videoId needed - gets it from original message
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Reply too long. Maximum 1000 characters allowed.'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const replyData = {
      text: text.trim(),
      messageType: 'reply',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await replyToVideoPageMessage(messageId, replyData);
    
    if (result.success) {
      // Get videoId from the reply result to broadcast to correct room
      const videoId = result.message.videoId;
      const roomName = `video_${videoId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-video-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reply to video page message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete video page chat message
app.delete('/video-page-chat/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role || 'user';
    
    const result = await deleteVideoPageChatMessage(messageId, userRole, userId);
    
    if (result.success) {
      // Broadcast message deletion via WebSocket
      if (global.io) {
        global.io.emit('video-message-deleted', {
          messageId,
          deletedBy: userId,
          timestamp: new Date()
        });
      }
      
      res.json({
        success: true,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete video page chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin: Get video page chat statistics
app.get('/admin/video-page-chat/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role || 'user';
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Get total messages
    const totalMessagesSnapshot = await getDocs(
      query(
        collection(db, 'videoPageChatMessages'),
        where('isDeleted', '==', false)
      )
    );
    
    // Get messages from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentMessagesSnapshot = await getDocs(
      query(
        collection(db, 'videoPageChatMessages'),
        where('isDeleted', '==', false),
        where('createdAt', '>=', yesterday)
      )
    );
    
    // Get unique users who sent messages
    const userIds = new Set();
    const videosWithMessages = new Set();
    
    totalMessagesSnapshot.forEach(doc => {
      const data = doc.data();
      userIds.add(data.senderId);
      videosWithMessages.add(data.videoId);
    });
    
    res.json({
      success: true,
      stats: {
        totalMessages: totalMessagesSnapshot.size,
        totalActiveUsers: userIds.size,
        totalVideosWithMessages: videosWithMessages.size,
        messagesLast24h: recentMessagesSnapshot.size,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Get video page chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get individual video page chat statistics (Admin only)
app.get('/videos/:videoId/chat/stats', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role || 'user';
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { videoId } = req.params;
    
    // Get all messages for this specific video
    const totalMessagesSnapshot = await getDocs(
      query(
        collection(db, 'videoPageChatMessages'),
        where('videoId', '==', videoId),
        where('isDeleted', '==', false)
      )
    );
    
    // Get messages from last 24 hours for this video
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentMessagesSnapshot = await getDocs(
      query(
        collection(db, 'videoPageChatMessages'),
        where('videoId', '==', videoId),
        where('isDeleted', '==', false),
        where('createdAt', '>=', yesterday)
      )
    );

    // Get messages from last 7 days for this video
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const weeklyMessagesSnapshot = await getDocs(
      query(
        collection(db, 'videoPageChatMessages'),
        where('videoId', '==', videoId),
        where('isDeleted', '==', false),
        where('createdAt', '>=', lastWeek)
      )
    );
    
    // Analyze participants and activity
    const participantsMap = new Map();
    const messagesByHour = new Array(24).fill(0);
    const messagesByDay = new Array(7).fill(0);
    let totalReplies = 0;
    let oldestMessageDate = null;
    let newestMessageDate = null;
    
    totalMessagesSnapshot.forEach(doc => {
      const data = doc.data();
      const messageDate = data.createdAt?.toDate() || new Date();
      
      // Track participants
      if (!participantsMap.has(data.senderId)) {
        participantsMap.set(data.senderId, {
          userId: data.senderId,
          name: data.senderName,
          email: data.senderEmail,
          messageCount: 1,
          lastMessageAt: messageDate,
          replyCount: data.replyTo ? 1 : 0
        });
      } else {
        const existing = participantsMap.get(data.senderId);
        existing.messageCount += 1;
        if (data.replyTo) existing.replyCount += 1;
        if (messageDate > existing.lastMessageAt) {
          existing.lastMessageAt = messageDate;
        }
      }
      
      // Count replies
      if (data.replyTo) {
        totalReplies += 1;
      }
      
      // Track message timing for activity analysis
      const hour = messageDate.getHours();
      const dayOfWeek = messageDate.getDay();
      messagesByHour[hour] += 1;
      messagesByDay[dayOfWeek] += 1;
      
      // Track oldest and newest messages
      if (!oldestMessageDate || messageDate < oldestMessageDate) {
        oldestMessageDate = messageDate;
      }
      if (!newestMessageDate || messageDate > newestMessageDate) {
        newestMessageDate = messageDate;
      }
    });
    
    const participants = Array.from(participantsMap.values())
      .sort((a, b) => b.messageCount - a.messageCount);
    
    // Calculate engagement metrics
    const totalMessages = totalMessagesSnapshot.size;
    const totalParticipants = participants.length;
    const averageMessagesPerUser = totalParticipants > 0 ? (totalMessages / totalParticipants).toFixed(2) : 0;
    const replyRate = totalMessages > 0 ? ((totalReplies / totalMessages) * 100).toFixed(1) : 0;
    
    // Find peak activity hours and days
    const peakHour = messagesByHour.indexOf(Math.max(...messagesByHour));
    const peakDay = messagesByDay.indexOf(Math.max(...messagesByDay));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    res.json({
      success: true,
      videoId,
      stats: {
        // Basic counts
        totalMessages,
        totalParticipants,
        messagesLast24h: recentMessagesSnapshot.size,
        messagesLast7d: weeklyMessagesSnapshot.size,
        totalReplies,
        
        // Engagement metrics
        averageMessagesPerUser: parseFloat(averageMessagesPerUser),
        replyRate: parseFloat(replyRate),
        
        // Activity timeline
        oldestMessage: oldestMessageDate,
        newestMessage: newestMessageDate,
        peakActivityHour: peakHour,
        peakActivityDay: dayNames[peakDay],
        
        // Activity patterns
        messagesByHour,
        messagesByDay,
        
        // Top participants (limited to top 10)
        topParticipants: participants.slice(0, 10),
        
        // Metadata
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Get individual video chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ============================================
// SUBJECT CHAT ENDPOINTS
// ============================================

// Send a chat message to a subject discussion
app.post('/subjects/:subjectId/chat', authenticateToken, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { text, messageType } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1000 characters allowed.'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const messageData = {
      subjectId,
      text: text.trim(),
      messageType: messageType || 'text', // text, image, file
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createChatMessage(messageData);
    
    if (result.success) {
      // Broadcast via WebSocket to all users in the room
      const roomName = `subject_${subjectId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reply to a specific message
app.post('/chat/:messageId/reply', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, subjectId } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }
    
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        error: 'Subject ID is required'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const replyData = {
      subjectId,
      text: text.trim(),
      messageType: 'reply',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await replyToMessage(messageId, replyData);
    
    if (result.success) {
      // Broadcast reply via WebSocket to all users in the subject room (subject-only system)
      const roomName = `subject_${subjectId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reply to message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat messages for a subject discussion
app.get('/subjects/:subjectId/chat', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { limit = 50, lastMessageId } = req.query;
    
    const result = await getChatMessages(subjectId, null, lastMessageId, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        totalMessages: result.totalMessages
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get chat messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat participants for a subject discussion
app.get('/subjects/:subjectId/chat/participants', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const result = await getChatParticipants(subjectId, null);
    
    if (result.success) {
      res.json({
        success: true,
        participants: result.participants,
        totalParticipants: result.totalParticipants
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get chat participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a chat message (own messages or admin can delete any)
app.delete('/chat/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    
    // Get user data to check role
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const userRole = userData.data().email === 'i.asela016@gmail.com' ? 'admin' : 'user';
    
    const result = await deleteChatMessage(messageId, userRole, userId);
    
    if (result.success) {
      // Broadcast deletion via WebSocket
      try {
        const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          const roomName = `subject_${messageData.subjectId}`;
          
          if (global.io) {
            global.io.to(roomName).emit('message-deleted', { 
              messageId,
              deletedBy: userId,
              timestamp: new Date()
            });
          }
        }
      } catch (broadcastError) {
        console.error('❌ WebSocket broadcast error:', broadcastError);
      }
      
      res.json({
        success: true,
        message: result.message
      });
    } else {
      const statusCode = result.error.includes('Permission denied') ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get chat summary/statistics for admin
app.get('/admin/chat/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const messagesRef = collection(db, 'chatMessages');
    const allMessagesQuery = query(messagesRef, where('isDeleted', '==', false));
    const querySnapshot = await getDocs(allMessagesQuery);
    
    const stats = {
      totalMessages: 0,
      messagesBySubject: {},
      activeUsers: new Set(),
      messagesLast24h: 0,
      messagesLast7d: 0
    };
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    querySnapshot.forEach((doc) => {
      const message = doc.data();
      stats.totalMessages++;
      
      // Count by subject
      if (!stats.messagesBySubject[message.subjectId]) {
        stats.messagesBySubject[message.subjectId] = 0;
      }
      stats.messagesBySubject[message.subjectId]++;
      
      // Active users
      stats.activeUsers.add(message.senderId);
      
      // Time-based counts
      const messageTime = message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
      if (messageTime > yesterday) {
        stats.messagesLast24h++;
      }
      if (messageTime > lastWeek) {
        stats.messagesLast7d++;
      }
    });
    
    stats.activeUsers = stats.activeUsers.size;
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Get chat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ========================================
// MOBILE APP COMPATIBLE ENDPOINTS
// ========================================

// Mobile app expects these specific endpoint patterns
// These are aliases to the existing chat functions

// Get subject messages (mobile app format)
app.get('/subjects/:id/messages', async (req, res) => {
  try {
    const { id: subjectId } = req.params;
    const { limit = 50, lastMessageId } = req.query;
    
    const result = await getChatMessages(subjectId, null, lastMessageId, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        totalMessages: result.totalMessages
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get subject messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send message to subject (mobile app format)
app.post('/subjects/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id: subjectId } = req.params;
    const { text, messageType } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const messageData = {
      subjectId,
      text: text.trim(),
      messageType: messageType || 'text',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createChatMessage(messageData);
    
    if (result.success) {
      // Broadcast via WebSocket
      const roomName = `subject_${subjectId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send subject message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Reply to message (mobile app format)
app.post('/messages/:messageId/reply', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, subjectId } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }
    
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        error: 'Subject ID is required'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const replyData = {
      subjectId,
      text: text.trim(),
      messageType: 'reply',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await replyToMessage(messageId, replyData);
    
    if (result.success) {
      // Broadcast reply via WebSocket
      const roomName = `subject_${subjectId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Reply to message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete message (mobile app format)
app.delete('/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role || 'user';
    
    const result = await deleteChatMessage(messageId, userRole, userId);
    
    if (result.success) {
      // Broadcast message deletion via WebSocket
      if (global.io) {
        global.io.emit('message-deleted', {
          messageId,
          deletedBy: userId,
          timestamp: new Date()
        });
      }
      
      res.json({
        success: true,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get notes messages (mobile app format) - uses same subject chat
app.get('/notes/:notesId/messages', async (req, res) => {
  try {
    const { notesId } = req.params;
    const { limit = 50, lastMessageId } = req.query;
    
    // For notes, we can use the subject chat system with notesId as subjectId
    // or create a separate notes chat system if needed
    const result = await getNotesChatMessages(notesId, lastMessageId, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        totalMessages: result.totalMessages
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get notes messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Send message to notes (mobile app format)
app.post('/notes/:notesId/messages', authenticateToken, async (req, res) => {
  try {
    const { notesId } = req.params;
    const { text, messageType } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const messageData = {
      notesId,
      text: text.trim(),
      messageType: messageType || 'text',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createNotesChatMessage(messageData);
    
    if (result.success) {
      // Broadcast via WebSocket
      const roomName = `notes_${notesId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-notes-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send notes message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Video page chat - Mobile app format
app.get('/subjects/:id/video-page-chat', async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { limit = 50, lastMessageId } = req.query;
    
    const result = await getVideoPageChatMessages(videoId, lastMessageId, parseInt(limit));
    
    if (result.success) {
      res.json({
        success: true,
        messages: result.messages,
        totalMessages: result.totalMessages
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get video page chat messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/subjects/:id/video-page-chat', authenticateToken, async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { text, messageType } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }
    
    // Get user data
    const userData = await getDoc(doc(db, 'users', userId));
    if (!userData.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userData.data();
    
    const messageData = {
      videoId,
      text: text.trim(),
      messageType: messageType || 'text',
      senderId: userId,
      senderName: user.name || user.username || user.email || 'Unknown User',
      senderEmail: user.email || 'Unknown Email'
    };
    
    const result = await createVideoPageChatMessage(messageData);
    
    if (result.success) {
      // Broadcast via WebSocket
      const roomName = `video_${videoId}`;
      if (global.io) {
        global.io.to(roomName).emit('new-video-message', {
          ...result.message,
          timestamp: new Date()
        });
      }
      
      res.status(201).json({
        success: true,
        messageId: result.messageId,
        message: result.message,
        status: result.status
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Send video page chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ========================================
// WEBSOCKET REAL-TIME CHAT HANDLERS
// ========================================

// Store active users and their socket connections
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 WebSocket connection established:', socket.id);

  // Handle user authentication and registration
  socket.on('authenticate', async ({ token, userId }) => {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.userId === userId) {
        socket.userId = userId;
        activeUsers.set(userId, {
          socketId: socket.id,
          userId: userId,
          connectedAt: new Date(),
          lastActive: new Date()
        });
        
        socket.emit('authentication-success', { userId });
        console.log(`✅ User authenticated: ${userId}`);
      } else {
        socket.emit('authentication-failed', { error: 'Invalid token' });
      }
    } catch (error) {
      socket.emit('authentication-failed', { error: 'Token verification failed' });
    }
  });

  // Join specific chat rooms (subject-based only)
  socket.on('join-chat', ({ subjectId, userId }) => {
    const roomName = `subject_${subjectId}`;
    socket.join(roomName);
    socket.currentRoom = roomName;
    
    console.log(`👥 User ${userId} joined chat room: ${roomName}`);
    
    // Notify others in the room
    socket.to(roomName).emit('user-joined', { 
      userId, 
      userName: activeUsers.get(userId)?.userName || 'Unknown User',
      timestamp: new Date()
    });
    
    socket.emit('joined-chat', { roomName, subjectId });
  });

  // Handle real-time message sending
  socket.on('send-message', async (messageData) => {
    try {
      if (!socket.userId) {
        socket.emit('message-error', { error: 'Authentication required' });
        return;
      }

      // Add socket user ID to message data
      messageData.senderId = socket.userId;
      
      // Save message to database using existing function
      const result = await createChatMessage(messageData);
      
      if (result.success) {
        const roomName = `subject_${messageData.subjectId}`;
        
        // Broadcast to all users in the chat room (including sender)
        io.to(roomName).emit('new-message', {
          ...result.message,
          timestamp: new Date()
        });
        
        // Send confirmation to sender
        socket.emit('message-sent', {
          success: true,
          messageId: result.messageId,
          tempId: messageData.tempId // For frontend message matching
        });
        
        console.log(`💬 Message sent in room ${roomName}: ${messageData.text.substring(0, 50)}...`);
      } else {
        socket.emit('message-error', { 
          error: result.error,
          tempId: messageData.tempId 
        });
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
      socket.emit('message-error', { 
        error: 'Failed to send message',
        tempId: messageData.tempId 
      });
    }
  });

  // Handle real-time replies
  socket.on('send-reply', async (replyData) => {
    try {
      if (!socket.userId) {
        socket.emit('reply-error', { error: 'Authentication required' });
        return;
      }

      replyData.senderId = socket.userId;
      const result = await replyToMessage(replyData.originalMessageId, replyData);
      
      if (result.success) {
        const roomName = `subject_${replyData.subjectId}`;
        
        // Broadcast reply to all users in the room
        io.to(roomName).emit('new-message', {
          ...result.message,
          timestamp: new Date()
        });
        
        socket.emit('reply-sent', {
          success: true,
          messageId: result.messageId,
          tempId: replyData.tempId
        });
        
        console.log(`↩️ Reply sent in room ${roomName}`);
      } else {
        socket.emit('reply-error', { 
          error: result.error,
          tempId: replyData.tempId 
        });
      }
    } catch (error) {
      console.error('❌ WebSocket reply error:', error);
      socket.emit('reply-error', { 
        error: 'Failed to send reply',
        tempId: replyData.tempId 
      });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', ({ subjectId, userName }) => {
    if (!socket.userId) return;
    
    const roomName = `subject_${subjectId}`;
    socket.to(roomName).emit('user-typing', { 
      userId: socket.userId,
      userName: userName || 'Unknown User',
      isTyping: true 
    });
  });

  socket.on('typing-stop', ({ subjectId }) => {
    if (!socket.userId) return;
    
    const roomName = `subject_${subjectId}`;
    socket.to(roomName).emit('user-typing', { 
      userId: socket.userId,
      isTyping: false 
    });
  });

  // Handle real-time message deletion
  socket.on('delete-message', async ({ messageId, userRole }) => {
    try {
      if (!socket.userId) {
        socket.emit('delete-error', { error: 'Authentication required' });
        return;
      }

      const result = await deleteChatMessage(messageId, userRole, socket.userId);
      
      if (result.success) {
        // Get message details to find the room
        const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          const roomName = `subject_${messageData.subjectId}`;
          
          // Notify all users in the room about message deletion
          io.to(roomName).emit('message-deleted', { 
            messageId,
            deletedBy: socket.userId,
            timestamp: new Date()
          });
          
          socket.emit('delete-success', { messageId });
          console.log(`🗑️ Message deleted: ${messageId}`);
        }
      } else {
        socket.emit('delete-error', { error: result.error, messageId });
      }
    } catch (error) {
      console.error('❌ WebSocket delete error:', error);
      socket.emit('delete-error', { 
        error: 'Failed to delete message',
        messageId 
      });
    }
  });

  // Handle getting online users in a room
  socket.on('get-online-users', async ({ subjectId }) => {
    const roomName = `subject_${subjectId}`;
    const socketsInRoom = await io.in(roomName).fetchSockets();
    
    const onlineUsers = socketsInRoom
      .filter(s => s.userId)
      .map(s => ({
        userId: s.userId,
        userName: activeUsers.get(s.userId)?.userName || 'Unknown User',
        socketId: s.id
      }));
    
    socket.emit('online-users', { 
      roomName,
      users: onlineUsers,
      count: onlineUsers.length 
    });
  });

  // Handle leaving chat rooms
  socket.on('leave-chat', ({ subjectId }) => {
    const roomName = `subject_${subjectId}`;
    socket.leave(roomName);
    
    socket.to(roomName).emit('user-left', { 
      userId: socket.userId,
      timestamp: new Date()
    });
    
    console.log(`👋 User ${socket.userId} left room: ${roomName}`);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      
      // Notify all rooms this user was in
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user-disconnected', {
          userId: socket.userId,
          reason,
          timestamp: new Date()
        });
      }
      
      console.log(`🔌 User ${socket.userId} disconnected: ${reason}`);
    } else {
      console.log(`🔌 Anonymous socket disconnected: ${socket.id}`);
    }
  });

  // ========================================
  // VIDEO PAGE CHAT WEBSOCKET EVENTS
  // ========================================

  // Join video page chat room
  socket.on('join-video-chat', ({ videoId, userId }) => {
    const roomName = `video_${videoId}`;
    socket.join(roomName);
    socket.currentVideoRoom = roomName;
    
    console.log(`🎥 User ${userId} joined video chat room: ${roomName}`);
    
    // Notify others in the room
    socket.to(roomName).emit('user-joined-video', { 
      userId, 
      userName: activeUsers.get(userId)?.userName || 'Unknown User',
      timestamp: new Date()
    });
    
    socket.emit('joined-video-chat', { roomName, videoId });
  });

  // Leave video page chat room
  socket.on('leave-video-chat', ({ videoId }) => {
    const roomName = `video_${videoId}`;
    socket.leave(roomName);
    
    console.log(`👋 User left video chat room: ${roomName}`);
    
    // Notify others in the room
    socket.to(roomName).emit('user-left-video', { 
      userId: socket.userId,
      userName: activeUsers.get(socket.userId)?.userName || 'Unknown User',
      timestamp: new Date()
    });
  });

  // Handle video page message sending
  socket.on('send-video-message', async (messageData) => {
    try {
      if (!socket.userId) {
        socket.emit('video-message-error', { error: 'Authentication required' });
        return;
      }

      // Add socket user ID to message data
      messageData.senderId = socket.userId;
      
      const result = await createVideoPageChatMessage(messageData);
      
      if (result.success) {
        const roomName = `video_${messageData.videoId}`;
        
        // Broadcast to all users in the video room
        io.to(roomName).emit('new-video-message', {
          ...result.message,
          timestamp: new Date()
        });
        
        socket.emit('video-message-sent', { 
          messageId: result.messageId,
          tempId: messageData.tempId 
        });
      } else {
        socket.emit('video-message-error', { 
          error: result.error,
          tempId: messageData.tempId 
        });
      }
    } catch (error) {
      console.error('❌ Video message send error:', error);
      socket.emit('video-message-error', { 
        error: 'Failed to send message',
        tempId: messageData.tempId 
      });
    }
  });

  // Handle video page reply sending
  socket.on('send-video-reply', async (replyData) => {
    try {
      if (!socket.userId) {
        socket.emit('video-reply-error', { error: 'Authentication required' });
        return;
      }

      // Add socket user ID to reply data
      replyData.senderId = socket.userId;
      
      const result = await replyToVideoPageMessage(replyData.originalMessageId, replyData);
      
      if (result.success) {
        const videoId = result.message.videoId;
        const roomName = `video_${videoId}`;
        
        // Broadcast reply to all users in the video room
        io.to(roomName).emit('new-video-message', {
          ...result.message,
          timestamp: new Date()
        });
        
        socket.emit('video-reply-sent', { 
          messageId: result.messageId,
          tempId: replyData.tempId 
        });
      } else {
        socket.emit('video-reply-error', { 
          error: result.error,
          tempId: replyData.tempId 
        });
      }
    } catch (error) {
      console.error('❌ Video reply send error:', error);
      socket.emit('video-reply-error', { 
        error: 'Failed to send reply',
        tempId: replyData.tempId 
      });
    }
  });

  // Video page typing indicators
  socket.on('video-typing-start', ({ videoId, userName }) => {
    const roomName = `video_${videoId}`;
    socket.to(roomName).emit('user-typing-video', { 
      userId: socket.userId,
      userName: userName || activeUsers.get(socket.userId)?.userName || 'Unknown User',
      timestamp: new Date()
    });
  });

  socket.on('video-typing-stop', ({ videoId }) => {
    const roomName = `video_${videoId}`;
    socket.to(roomName).emit('user-stopped-typing-video', { 
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  // Get online users in video page chat
  socket.on('get-video-online-users', async ({ videoId }) => {
    try {
      const roomName = `video_${videoId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      const onlineUsers = [];
      
      if (room) {
        for (const socketId of room) {
          const userSocket = io.sockets.sockets.get(socketId);
          if (userSocket && userSocket.userId) {
            const userData = activeUsers.get(userSocket.userId);
            onlineUsers.push({
              userId: userSocket.userId,
              userName: userData?.userName || 'Unknown User',
              socketId: socketId
            });
          }
        }
      }
      
      socket.emit('video-online-users', { 
        videoId,
        users: onlineUsers,
        count: onlineUsers.length,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Get video online users error:', error);
      socket.emit('video-online-users-error', { error: 'Failed to get online users' });
    }
  });

  // Delete video page message
  socket.on('delete-video-message', async ({ messageId, userRole }) => {
    try {
      if (!socket.userId) {
        socket.emit('video-delete-error', { error: 'Authentication required' });
        return;
      }

      const result = await deleteVideoPageChatMessage(messageId, userRole || 'user', socket.userId);
      
      if (result.success) {
        // Broadcast message deletion to all users
        io.emit('video-message-deleted', {
          messageId,
          deletedBy: socket.userId,
          timestamp: new Date()
        });
        
        socket.emit('video-message-deleted-success', { messageId });
      } else {
        socket.emit('video-delete-error', { error: result.error });
      }
    } catch (error) {
      console.error('❌ Video message delete error:', error);
      socket.emit('video-delete-error', { error: 'Failed to delete message' });
    }
  });

  // Heartbeat to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });
});

// Broadcast system-wide notifications
const broadcastSystemMessage = (message, roomName = null) => {
  const notification = {
    type: 'system',
    message,
    timestamp: new Date()
  };
  
  if (roomName) {
    io.to(roomName).emit('system-notification', notification);
  } else {
    io.emit('system-notification', notification);
  }
};

// ============================================
// 📄 PAPERS CHAT FUNCTIONS
// ============================================

// Create a new papers chat message
async function createPapersChatMessage(paperId, senderId, senderName, text, messageType = 'text', replyTo = null) {
  try {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const messageData = {
      id: messageId,
      paperId: paperId,
      senderId: senderId,
      senderName: senderName,
      text: text,
      messageType: messageType,
      replyTo: replyTo,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      reactions: {}
    };

    await setDoc(doc(db, 'papersChatMessages', messageId), messageData);
    return { success: true, messageId, message: messageData };
  } catch (error) {
    console.error('❌ Error creating papers chat message:', error);
    return { success: false, error: error.message };
  }
}

// Get papers chat messages with pagination (TEMPORARY: Simplified for index creation)
async function getPapersChatMessages(paperId, limit = 50, lastMessageId = null) {
  try {
    const messagesRef = collection(db, 'papersChatMessages');
    
    // TEMPORARY: Use simple query until Firebase index is created
    let q = query(
      messagesRef,
      where('paperId', '==', paperId),
      limit(parseInt(limit) || 50)
    );

    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out deleted messages on client side temporarily
      if (!data.isDeleted) {
        messages.push({
          id: doc.id,
          ...data
        });
      }
    });

    // Sort by createdAt on client side temporarily
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return { success: true, messages, totalMessages: messages.length };
  } catch (error) {
    console.error('❌ Error getting papers chat messages:', error);
    
    // If still fails, return empty array
    console.log('📄 Returning empty messages array - create Firebase index first');
    return { success: true, messages: [], totalMessages: 0 };
  }
}

// Delete papers chat message
async function deletePapersChatMessage(messageId, userId, isAdmin = false) {
  try {
    const messageDoc = await getDoc(doc(db, 'papersChatMessages', messageId));
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message not found' };
    }
    
    const messageData = messageDoc.data();
    
    // Check permissions - user can delete own message, admin can delete any
    if (messageData.senderId !== userId && !isAdmin) {
      return { success: false, error: 'Permission denied' };
    }

    // Soft delete
    await updateDoc(doc(db, 'papersChatMessages', messageId), {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: userId
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting papers chat message:', error);
    return { success: false, error: error.message };
  }
}

// Reply to papers chat message
async function replyToPapersMessage(messageId, paperId, senderId, senderName, text) {
  try {
    // Get original message
    const originalMessageDoc = await getDoc(doc(db, 'papersChatMessages', messageId));
    
    if (!originalMessageDoc.exists()) {
      return { success: false, error: 'Original message not found' };
    }

    const originalMessage = originalMessageDoc.data();
    
    const replyData = {
      messageId: messageId,
      originalText: originalMessage.text,
      originalSenderName: originalMessage.senderName,
      originalSenderId: originalMessage.senderId
    };

    const result = await createPapersChatMessage(paperId, senderId, senderName, text, 'reply', replyData);
    return result;
  } catch (error) {
    console.error('❌ Error replying to papers message:', error);
    return { success: false, error: error.message };
  }
}

// Get papers chat participants
async function getPapersChatParticipants(paperId) {
  try {
    const messagesRef = collection(db, 'papersChatMessages');
    const q = query(
      messagesRef,
      where('paperId', '==', paperId),
      where('isDeleted', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const participantMap = new Map();

    querySnapshot.forEach((doc) => {
      const message = doc.data();
      const userId = message.senderId;
      
      if (participantMap.has(userId)) {
        participantMap.get(userId).messageCount++;
        if (new Date(message.createdAt) > new Date(participantMap.get(userId).lastMessageAt)) {
          participantMap.get(userId).lastMessageAt = message.createdAt;
        }
      } else {
        participantMap.set(userId, {
          userId: userId,
          name: message.senderName,
          email: message.senderEmail || '',  
          messageCount: 1,
          lastMessageAt: message.createdAt
        });
      }
    });

    const participants = Array.from(participantMap.values());
    
    return { 
      success: true, 
      participants,
      totalParticipants: participants.length 
    };
  } catch (error) {
    console.error('❌ Error getting papers chat participants:', error);
    return { success: false, error: error.message };
  }
}

// Get papers chat statistics for admin
async function getPapersChatStats() {
  try {
    const messagesRef = collection(db, 'papersChatMessages');
    const allMessagesQuery = query(messagesRef, where('isDeleted', '==', false));
    const allMessages = await getDocs(allMessagesQuery);

    // Get messages from last 24 hours
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);
    const recent24hQuery = query(
      messagesRef,
      where('isDeleted', '==', false),
      where('createdAt', '>=', last24h.toISOString())
    );
    const recent24hMessages = await getDocs(recent24hQuery);

    // Count unique users and papers
    const uniqueUsers = new Set();
    const uniquePapers = new Set();

    allMessages.forEach((doc) => {
      const message = doc.data();
      uniqueUsers.add(message.senderId);
      uniquePapers.add(message.paperId);
    });

    return {
      success: true,
      stats: {
        totalMessages: allMessages.size,
        totalActiveUsers: uniqueUsers.size,
        totalPapersWithMessages: uniquePapers.size,
        messagesLast24h: recent24hMessages.size,
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('❌ Error getting papers chat stats:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 📄 PAPERS CHAT ENDPOINTS
// ============================================

// Send message to papers chat
app.post('/papers/:paperId/chat', authenticateToken, async (req, res) => {
  try {
    const { paperId } = req.params;
    const { text, messageType = 'text' } = req.body;
    const userId = req.user.userId;
    const userName = req.user.name || req.user.username || req.user.displayName || req.user.email?.split('@')[0] || 'Unknown User';

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    // Create message
    const result = await createPapersChatMessage(paperId, userId, userName, text.trim(), messageType);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Emit real-time message to papers chat room
    io.to(`papers_${paperId}`).emit('new-papers-message', result.message);

    res.status(201).json({
      success: true,
      messageId: result.messageId,
      message: result.message,
      status: 'Papers chat message sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending papers chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send papers chat message'
    });
  }
});

// Get papers chat messages
app.get('/papers/:paperId/chat', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { limit = 50, lastMessageId } = req.query;

    const result = await getPapersChatMessages(paperId, parseInt(limit), lastMessageId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      messages: result.messages,
      totalMessages: result.totalMessages
    });

  } catch (error) {
    console.error('❌ Error getting papers chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get papers chat messages'
    });
  }
});

// Reply to papers chat message
app.post('/papers-chat/:messageId/reply', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, paperId } = req.body;
    const userId = req.user.userId;
    const userName = req.user.name || req.user.username || req.user.displayName || req.user.email?.split('@')[0] || 'Unknown User';

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reply text is required'
      });
    }

    if (!paperId) {
      return res.status(400).json({
        success: false,
        error: 'Paper ID is required'
      });
    }

    // Create reply
    const result = await replyToPapersMessage(messageId, paperId, userId, userName, text.trim());
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Emit real-time reply to papers chat room
    io.to(`papers_${paperId}`).emit('new-papers-message', result.message);

    res.status(201).json({
      success: true,
      messageId: result.messageId,
      message: result.message,
      status: 'Papers chat message sent successfully'
    });

  } catch (error) {
    console.error('❌ Error replying to papers chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reply to papers chat message'
    });
  }
});

// Get papers chat participants
app.get('/papers/:paperId/chat/participants', async (req, res) => {
  try {
    const { paperId } = req.params;

    const result = await getPapersChatParticipants(paperId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      participants: result.participants,
      totalParticipants: result.totalParticipants
    });

  } catch (error) {
    console.error('❌ Error getting papers chat participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get papers chat participants'
    });
  }
});

// Delete papers chat message
app.delete('/papers-chat/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    const result = await deletePapersChatMessage(messageId, userId, isAdmin);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Emit deletion event to all connected clients
    io.emit('papers-message-deleted', { messageId });

    res.json({
      success: true,
      status: 'Papers chat message deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting papers chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete papers chat message'
    });
  }
});

// Admin: Get papers chat statistics
app.get('/admin/papers-chat/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const result = await getPapersChatStats();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      stats: result.stats
    });

  } catch (error) {
    console.error('❌ Error getting papers chat stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get papers chat statistics'
    });
  }
});

// Mobile App Compatible Endpoints for Papers Chat

// Get papers messages (mobile format)
app.get('/papers/:paperId/messages', async (req, res) => {
  try {
    const { paperId } = req.params;
    const { limit = 50, lastMessageId } = req.query;

    const result = await getPapersChatMessages(paperId, parseInt(limit), lastMessageId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      messages: result.messages,
      totalMessages: result.totalMessages
    });

  } catch (error) {
    console.error('❌ Error getting papers messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get papers messages'
    });
  }
});

// Send papers message (mobile format)
app.post('/papers/:paperId/messages', authenticateToken, async (req, res) => {
  try {
    const { paperId } = req.params;
    const { text, messageType = 'text' } = req.body;
    const userId = req.user.userId;
    const userName = req.user.name || req.user.username || req.user.displayName || req.user.email?.split('@')[0] || 'Unknown User';

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    // Create message
    const result = await createPapersChatMessage(paperId, userId, userName, text.trim(), messageType);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Emit real-time message to papers chat room
    io.to(`papers_${paperId}`).emit('new-papers-message', result.message);

    res.status(201).json({
      success: true,
      messageId: result.messageId,
      message: result.message,
      status: 'Papers chat message sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending papers message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send papers message'
    });
  }
});

// Export for use in other parts of the application
global.io = io;
global.broadcastSystemMessage = broadcastSystemMessage;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time chat`);
  console.log(`🌐 Network accessible at http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local access at http://localhost:${PORT}`);
  console.log(`🔥 Firebase connection ready`);
  console.log(`💬 Real-time chat enabled with Socket.IO`);
});
