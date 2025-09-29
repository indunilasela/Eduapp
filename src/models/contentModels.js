// ========================================
// CONTENT MODELS (Papers, Videos, Notes)
// ========================================
// This module defines content-related data structures and validation

const { Timestamp } = require('firebase-admin/firestore');

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

// Content constants
const PAPER_TYPES = ['past_paper', 'assignment', 'worksheet', 'notes'];
const VIDEO_CATEGORIES = ['lecture', 'tutorial', 'explanation', 'exercise'];
const NOTE_TYPES = ['book', 'short_note'];

module.exports = {
  PaperModel,
  AnswerModel,
  VideoModel,
  NotesModel,
  PAPER_TYPES,
  VIDEO_CATEGORIES,
  NOTE_TYPES
};