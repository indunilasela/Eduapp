// ========================================
// USER MODELS AND VALIDATION
// ========================================
// This module defines user-related data structures and validation

const { Timestamp } = require('firebase-admin/firestore');

/**
 * User Model - Represents system users (students, teachers, admins)
 */
const UserModel = {
  // Required fields
  id: String, // Auto-generated unique identifier
  email: String, // User email (unique)
  password: String, // Hashed password (bcrypt)
  name: String, // Full name
  role: String, // 'student', 'teacher', 'admin'
  
  // Optional fields
  username: String, // Optional username
  profileImage: String, // Profile image URL
  phone: String, // Phone number
  dateOfBirth: Date, // Date of birth
  address: String, // Physical address
  
  // System fields
  isVerified: Boolean, // Email verification status
  isActive: Boolean, // Account active status
  lastLogin: Timestamp, // Last login timestamp
  createdAt: Timestamp, // Account creation timestamp
  updatedAt: Timestamp, // Last update timestamp
  
  // Academic fields
  enrolledSubjects: Array, // Array of subject IDs
  teachingSubjects: Array, // For teachers - subjects they teach
  
  // Settings
  preferences: {
    notifications: Boolean,
    theme: String, // 'light', 'dark', 'auto'
    language: String // 'en', 'si', 'ta'
  }
};

/**
 * User Validation Rules
 */
const UserValidation = {
  email: {
    required: true,
    type: 'email',
    maxLength: 255
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  role: {
    required: true,
    enum: ['student', 'teacher', 'admin']
  },
  phone: {
    pattern: /^[+]?[\d\s\-\(\)]{10,15}$/
  }
};

/**
 * Validate user data
 */
function validateUser(userData) {
  const errors = [];
  
  // Required field validation
  if (!userData.email) errors.push('Email is required');
  else if (!ValidationPatterns.email.test(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (!userData.password) errors.push('Password is required');
  else if (userData.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!userData.name) errors.push('Name is required');
  else if (userData.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!userData.role) errors.push('Role is required');
  else if (!USER_ROLES.includes(userData.role)) {
    errors.push('Invalid role');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validation patterns
const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[\d\s\-\(\)]{10,15}$/,
  mongoId: /^[0-9a-fA-F]{24}$/
};

// User constants
const USER_ROLES = ['student', 'teacher', 'admin'];

// Utility functions
const createUserId = () => 'user_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

module.exports = {
  UserModel,
  UserValidation,
  validateUser,
  ValidationPatterns,
  USER_ROLES,
  createUserId
};