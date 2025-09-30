const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const path = require('path');
const fs = require('fs');
const { db, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc } = require('./database');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./emailService');
const { JWT_SECRET } = require('./config');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Admin middleware - only allows admin user
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

// Validation functions
function validateSignupData(username, email, password, confirmPassword) {
  const errors = [];
  
  if (!username || username.trim().length < 2) {
    errors.push('Username must be at least 2 characters long');
  }
  
  if (username && username.length > 50) {
    errors.push('Username must be less than 50 characters');
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
  
  if (password && (password.includes(' ') || password.includes('\\t'))) {
    errors.push('Password cannot contain spaces or tabs');
  }
  
  return errors;
}

function validateSigninData(email, password) {
  const errors = [];
  
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  
  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
  }
  
  return errors;
}

// User utility functions
async function createUser(userData) {
  try {
    const userId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      id: userId,
      createdAt: new Date(),
      profileImage: null
    });
    return { success: true, userId, message: 'User created successfully' };
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        error: 'Database permission denied. Please check Firestore security rules.',
        firestoreError: true 
      };
    }
    return { success: false, error: error.message, firestoreError: true };
  }
}

async function findUserByEmail(email) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: 'User not found' };
    }
    
    let user = null;
    querySnapshot.forEach((doc) => {
      user = { id: doc.id, ...doc.data() };
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ Error finding user:', error);
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        error: 'Database permission denied. Please check Firestore security rules.',
        firestoreError: true 
      };
    }
    return { success: false, error: error.message, firestoreError: true };
  }
}

async function readUserData(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    return { success: true, data: userDoc.data() };
  } catch (error) {
    console.error('❌ Error reading user data:', error);
    return { success: false, error: error.message };
  }
}

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

// Password reset functions
async function storePasswordResetToken(email, token) {
  try {
    const tokenId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'passwordResets', tokenId), {
      id: tokenId,
      email: email.toLowerCase(),
      token: token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      isUsed: false
    });
    return { success: true, tokenId };
  } catch (error) {
    console.error('❌ Error storing password reset token:', error);
    return { success: false, error: error.message };
  }
}

async function verifyPasswordResetToken(email, token) {
  try {
    const resetTokensRef = collection(db, 'passwordResets');
    const q = query(
      resetTokensRef,
      where('email', '==', email.toLowerCase()),
      where('token', '==', token),
      where('isUsed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid or expired verification code' };
    }
    
    let resetToken = null;
    querySnapshot.forEach((doc) => {
      resetToken = { id: doc.id, ...doc.data() };
    });
    
    // Check if token is expired
    if (new Date() > resetToken.expiresAt.toDate()) {
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }
    
    return { success: true, tokenId: resetToken.id };
  } catch (error) {
    console.error('❌ Error verifying reset token:', error);
    return { success: false, error: error.message };
  }
}

async function storeOTPVerification(email, otp) {
  try {
    const verificationId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, 'otpVerifications', verificationId), {
      id: verificationId,
      email: email.toLowerCase(),
      otp: otp,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes to complete password reset
    });
    return { success: true, verificationId };
  } catch (error) {
    console.error('❌ Error storing OTP verification:', error);
    return { success: false, error: error.message };
  }
}

async function markResetTokenAsUsed(tokenId) {
  try {
    await setDoc(doc(db, 'passwordResets', tokenId), {
      isUsed: true,
      usedAt: new Date()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking token as used:', error);
    return { success: false, error: error.message };
  }
}

// Utility function for file system operations
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

// Authentication routes
function setupAuthRoutes(app, uploadProfileImage) {
  // Test email endpoint
  app.post('/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address'
        });
      }
      
      // Test email sending
      const result = await sendWelcomeEmail(email, 'Test User');
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Test email sent successfully',
          details: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Email test failed',
          suggestions: [
            'Check SMTP configuration in .env file',
            'Verify email credentials',
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

  // Signup endpoint
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

  // Signin endpoint
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

  // Other auth endpoints (forgot password, reset password, profile image) would go here...
  // I'll include the key endpoints for brevity
}

module.exports = {
  authenticateToken,
  isAdmin,
  setupAuthRoutes,
  createUser,
  findUserByEmail,
  readUserData,
  updateUserProfileImage,
  deleteUserProfileImage,
  deleteFileFromSystem
};