// ========================================
// EDUBACK APPLICATION DATA MODELS
// ========================================
// This file defines all data structures, schemas, and validation rules
// for the EduBack educational platform

const { Timestamp } = require('firebase-admin/firestore');

// ========================================
// USER MODELS
// ========================================

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

// ========================================
// SUBJECT MODELS
// ========================================

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

// ========================================
// CHAT MODELS (Subject-Only System)
// ========================================

/**
 * Chat Message Model - Real-time messaging system
 */
const ChatMessageModel = {
  // Required fields
  id: String, // Auto-generated message ID (timestamp_random)
  subjectId: String, // Subject this message belongs to
  senderId: String, // User ID of sender
  senderName: String, // Sender's display name
  senderEmail: String, // Sender's email
  text: String, // Message content
  messageType: String, // 'text', 'reply'
  
  // Reply functionality (simplified)
  replyTo: String, // ID of message being replied to (if this is a reply)
  originalText: String, // Text of original message (for replies)
  originalSenderName: String, // Name of original sender (for replies)
  
  // System fields
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isDeleted: Boolean,
  deletedAt: Timestamp,
  deletedBy: String, // User ID who deleted the message
  
  // Future features
  reactions: Object, // Emoji reactions {emoji: [userIds]}
  attachments: Array, // File attachments
  mentions: Array, // @mentioned user IDs
  isEdited: Boolean, // If message was edited
  editedAt: Timestamp // When message was edited
};

/**
 * Chat Message Validation Rules
 */
const ChatMessageValidation = {
  subjectId: {
    required: true,
    type: 'string'
  },
  senderId: {
    required: true,
    type: 'string'
  },
  text: {
    required: true,
    minLength: 1,
    maxLength: 1000,
    trim: true
  },
  messageType: {
    required: true,
    enum: ['text', 'reply'],
    default: 'text'
  }
};

/**
 * Chat Room Model - WebSocket room management
 */
const ChatRoomModel = {
  // Room identification
  roomId: String, // Format: "subject_${subjectId}"
  subjectId: String, // Associated subject
  subjectName: String, // Subject name for display
  
  // Participants
  participants: Array, // Array of connected user objects
  activeCount: Number, // Current active participants
  totalParticipants: Number, // Total unique participants
  
  // Activity tracking
  lastMessageAt: Timestamp,
  lastMessageBy: String,
  totalMessages: Number,
  
  // System fields
  createdAt: Timestamp,
  updatedAt: Timestamp
};

// ========================================
// PAPER MODELS
// ========================================

/**
 * Paper Model - Educational documents and assignments
 */
const PaperModel = {
  // Required fields
  id: String, // Auto-generated paper ID
  subjectId: String, // Associated subject
  title: String, // Paper title
  description: String, // Paper description
  
  // File information
  fileName: String, // Original file name
  fileUrl: String, // Storage URL
  fileSize: Number, // File size in bytes
  fileType: String, // MIME type
  
  // Academic details
  type: String, // 'past_paper', 'assignment', 'worksheet', 'notes'
  year: Number, // Academic year
  term: Number, // Term number (1-3)
  difficulty: String, // 'easy', 'medium', 'hard'
  
  // Upload information
  uploadedBy: String, // User ID
  uploaderName: String, // Uploader's name
  uploaderRole: String, // Uploader's role
  
  // System fields
  isApproved: Boolean, // Admin approval status
  approvedBy: String, // Admin who approved
  approvedAt: Timestamp,
  downloadCount: Number, // Download statistics
  createdAt: Timestamp,
  updatedAt: Timestamp
};

/**
 * Answer Model - Student answers to papers
 */
const AnswerModel = {
  // Required fields
  id: String, // Auto-generated answer ID
  paperId: String, // Associated paper
  studentId: String, // Student who submitted
  studentName: String, // Student's name
  studentEmail: String, // Student's email
  
  // File information
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  fileType: String,
  
  // Submission details
  submittedAt: Timestamp,
  grade: Number, // Grade received (optional)
  feedback: String, // Teacher feedback (optional)
  gradedBy: String, // Teacher who graded (optional)
  gradedAt: Timestamp, // When graded (optional)
  
  // System fields
  createdAt: Timestamp,
  updatedAt: Timestamp
};

// ========================================
// VIDEO MODELS
// ========================================

/**
 * Video Model - Educational video content
 */
const VideoModel = {
  // Required fields
  id: String, // Auto-generated video ID
  subjectId: String, // Associated subject
  title: String, // Video title
  description: String, // Video description
  
  // File information
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  duration: Number, // Video duration in seconds
  thumbnailUrl: String, // Video thumbnail
  
  // Content details
  category: String, // 'lecture', 'tutorial', 'explanation', 'exercise'
  difficulty: String, // 'beginner', 'intermediate', 'advanced'
  tags: Array, // Array of tags for searchability
  
  // Upload information
  uploadedBy: String,
  uploaderName: String,
  uploaderRole: String,
  
  // Approval workflow
  isApproved: Boolean,
  approvedBy: String,
  approvedAt: Timestamp,
  rejectionReason: String, // If rejected
  
  // Statistics
  viewCount: Number,
  likeCount: Number,
  
  // System fields
  createdAt: Timestamp,
  updatedAt: Timestamp
};

// ========================================
// NOTES MODELS
// ========================================

/**
 * Notes Model - Study materials and books
 */
const NotesModel = {
  // Required fields
  id: String, // Auto-generated notes ID
  subjectId: String, // Associated subject
  title: String, // Notes title
  description: String, // Notes description
  
  // Content type
  type: String, // 'book', 'short_note'
  
  // File information
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  fileType: String, // PDF, DOC, etc.
  pageCount: Number, // For books/PDFs
  
  // Academic details
  author: String, // Author name
  publisher: String, // Publisher (for books)
  isbn: String, // ISBN (for books)
  edition: String, // Edition number
  
  // Upload information
  uploadedBy: String,
  uploaderName: String,
  uploaderRole: String,
  
  // Statistics
  downloadCount: Number,
  rating: Number, // Average rating
  ratingCount: Number, // Number of ratings
  
  // System fields
  isApproved: Boolean,
  approvedBy: String,
  approvedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
};

// ========================================
// SYSTEM MODELS
// ========================================

/**
 * Admin Statistics Model - System analytics
 */
const AdminStatsModel = {
  // User statistics
  totalUsers: Number,
  activeUsers: Number,
  newUsersToday: Number,
  usersByRole: {
    students: Number,
    teachers: Number,
    admins: Number
  },
  
  // Content statistics
  totalSubjects: Number,
  totalPapers: Number,
  totalVideos: Number,
  totalNotes: Number,
  
  // Chat statistics
  totalMessages: Number,
  messagesLast24h: Number,
  messagesLast7d: Number,
  activeChats: Number,
  
  // Activity statistics
  totalDownloads: Number,
  totalUploads: Number,
  diskUsage: Number, // Storage usage in bytes
  
  // System fields
  generatedAt: Timestamp,
  reportPeriod: String // 'daily', 'weekly', 'monthly'
};

/**
 * Error Log Model - System error tracking
 */
const ErrorLogModel = {
  id: String,
  level: String, // 'error', 'warning', 'info'
  message: String,
  stack: String, // Error stack trace
  endpoint: String, // API endpoint where error occurred
  method: String, // HTTP method
  userId: String, // User who triggered error (if applicable)
  ip: String, // Client IP address
  userAgent: String, // Client user agent
  timestamp: Timestamp,
  resolved: Boolean, // If error was resolved
  resolvedBy: String, // Admin who resolved
  resolvedAt: Timestamp
};

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Common validation patterns
 */
const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[\d\s\-\(\)]{10,15}$/,
  subjectCode: /^[A-Z0-9]+$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  url: /^https?:\/\/.+/,
  fileName: /^[^<>:"/\\|?*\x00-\x1f]+$/
};

/**
 * File type validation
 */
const FileTypes = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg']
};

/**
 * File size limits (in bytes)
 */
const FileSizeLimits = {
  profileImage: 5 * 1024 * 1024, // 5MB
  documents: 50 * 1024 * 1024, // 50MB
  videos: 100 * 1024 * 1024, // 100MB
  notes: 20 * 1024 * 1024 // 20MB
};

// ========================================
// VALIDATION FUNCTIONS
// ========================================

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
  else if (!['student', 'teacher', 'admin'].includes(userData.role)) {
    errors.push('Invalid role');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate chat message data
 */
function validateChatMessage(messageData) {
  const errors = [];
  
  if (!messageData.subjectId) errors.push('Subject ID is required');
  if (!messageData.senderId) errors.push('Sender ID is required');
  if (!messageData.text) errors.push('Message text is required');
  else if (messageData.text.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (messageData.text.length > 1000) {
    errors.push('Message too long (max 1000 characters)');
  }
  
  if (messageData.messageType && !['text', 'reply'].includes(messageData.messageType)) {
    errors.push('Invalid message type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

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

/**
 * Validate file upload data
 */
function validateFileUpload(fileData, fileType) {
  const errors = [];
  
  if (!fileData) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // Check file size
  const sizeLimit = FileSizeLimits[fileType];
  if (sizeLimit && fileData.size > sizeLimit) {
    errors.push(`File too large (max ${Math.round(sizeLimit / 1024 / 1024)}MB)`);
  }
  
  // Check file type
  const allowedTypes = FileTypes[fileType];
  if (allowedTypes && !allowedTypes.includes(fileData.mimetype)) {
    errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  // Check filename
  if (!ValidationPatterns.fileName.test(fileData.originalname)) {
    errors.push('Invalid filename characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Models
  UserModel,
  SubjectModel,
  ChatMessageModel,
  ChatRoomModel,
  PaperModel,
  AnswerModel,
  VideoModel,
  NotesModel,
  AdminStatsModel,
  ErrorLogModel,
  
  // Validation rules
  UserValidation,
  SubjectValidation,
  ChatMessageValidation,
  
  // Validation helpers
  ValidationPatterns,
  FileTypes,
  FileSizeLimits,
  
  // Validation functions
  validateUser,
  validateChatMessage,
  validateSubject,
  validateFileUpload,
  
  // Utility functions
  createMessageId: () => Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
  createUserId: () => 'user_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
  createSubjectId: () => 'subject_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
  
  // Constants
  USER_ROLES: ['student', 'teacher', 'admin'],
  MESSAGE_TYPES: ['text', 'reply'],
  SUBJECT_CATEGORIES: ['science', 'mathematics', 'language', 'social', 'arts', 'technology'],
  LANGUAGES: ['sinhala', 'tamil', 'english'],
  PAPER_TYPES: ['past_paper', 'assignment', 'worksheet', 'notes'],
  VIDEO_CATEGORIES: ['lecture', 'tutorial', 'explanation', 'exercise'],
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard', 'beginner', 'intermediate', 'advanced'],
  NOTE_TYPES: ['book', 'short_note']
};