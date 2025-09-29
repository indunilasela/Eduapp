// ========================================
// SUBJECT MODELS AND VALIDATION
// ========================================
// This module defines subject-related data structures and validation

const { Timestamp } = require('firebase-admin/firestore');

/**
 * Subject Model - Educational subjects/courses
 */
const SubjectModel = {
  // Required fields
  id: String, // Auto-generated unique identifier
  name: String, // Subject name (e.g., "Mathematics Grade 10")
  code: String, // Subject code (e.g., "MATH10")
  description: String, // Subject description
  
  // Academic details
  grade: Number, // Grade level (1-13)
  category: String, // 'science', 'mathematics', 'language', 'social', 'arts', 'technology'
  language: String, // 'sinhala', 'tamil', 'english'
  
  // Content
  syllabus: String, // Syllabus document URL
  coverImage: String, // Subject cover image URL
  
  // Instructor information
  teacherId: String, // ID of assigned teacher
  teacherName: String, // Teacher's name
  teacherEmail: String, // Teacher's email
  
  // System fields
  isActive: Boolean, // Subject active status
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: String, // User ID who created
  
  // Statistics
  enrolledCount: Number, // Number of enrolled students
  paperCount: Number, // Number of papers uploaded
  videoCount: Number, // Number of videos
  noteCount: Number, // Number of notes
  chatMessageCount: Number // Number of chat messages
};

/**
 * Subject Validation Rules
 */
const SubjectValidation = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  code: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[A-Z0-9]+$/
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 500
  },
  grade: {
    required: true,
    min: 1,
    max: 13
  },
  category: {
    required: true,
    enum: ['science', 'mathematics', 'language', 'social', 'arts', 'technology']
  },
  language: {
    required: true,
    enum: ['sinhala', 'tamil', 'english']
  }
};

/**
 * Validate subject data
 */
function validateSubject(subjectData) {
  const errors = [];
  
  if (!subjectData.name) errors.push('Subject name is required');
  if (!subjectData.code) errors.push('Subject code is required');
  else if (!ValidationPatterns.subjectCode.test(subjectData.code)) {
    errors.push('Subject code must contain only letters and numbers');
  }
  
  if (!subjectData.description) errors.push('Description is required');
  if (!subjectData.grade) errors.push('Grade is required');
  else if (subjectData.grade < 1 || subjectData.grade > 13) {
    errors.push('Grade must be between 1 and 13');
  }
  
  if (!subjectData.category) errors.push('Category is required');
  if (!subjectData.language) errors.push('Language is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validation patterns
const ValidationPatterns = {
  subjectCode: /^[A-Z0-9]+$/
};

// Subject constants
const SUBJECT_CATEGORIES = ['science', 'mathematics', 'language', 'social', 'arts', 'technology'];
const LANGUAGES = ['sinhala', 'tamil', 'english'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced'];

// Utility functions
const createSubjectId = () => 'subject_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

module.exports = {
  SubjectModel,
  SubjectValidation,
  validateSubject,
  ValidationPatterns,
  SUBJECT_CATEGORIES,
  LANGUAGES,
  DIFFICULTY_LEVELS,
  createSubjectId
};