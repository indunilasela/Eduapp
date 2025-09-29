// ========================================
// FILE VALIDATION AND UTILITY MODELS
// ========================================
// This module defines file handling, validation patterns, and utility functions

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

/**
 * Utility functions for file handling
 */
const FileUtils = {
  // Generate safe filename
  generateSafeFileName: (originalName) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  },
  
  // Get file extension
  getFileExtension: (filename) => {
    return filename.split('.').pop().toLowerCase();
  },
  
  // Format file size for display
  formatFileSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },
  
  // Check if file is image
  isImageFile: (mimetype) => {
    return FileTypes.images.includes(mimetype);
  },
  
  // Check if file is document
  isDocumentFile: (mimetype) => {
    return FileTypes.documents.includes(mimetype);
  },
  
  // Check if file is video
  isVideoFile: (mimetype) => {
    return FileTypes.videos.includes(mimetype);
  }
};

module.exports = {
  FileTypes,
  FileSizeLimits,
  ValidationPatterns,
  validateFileUpload,
  FileUtils
};