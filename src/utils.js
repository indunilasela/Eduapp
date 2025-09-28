const fs = require('fs');
const path = require('path');

// ========================================
// FILE UTILITIES
// ========================================

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function deleteFileIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true, message: 'File deleted successfully' };
    }
    return { success: true, message: 'File does not exist' };
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return { success: false, error: error.message };
  }
}

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase();
}

function getFilenameWithoutExtension(filename) {
  return path.basename(filename, path.extname(filename));
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isValidFileType(filename, allowedExtensions) {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
}

// ========================================
// DATE UTILITIES
// ========================================

function formatDate(date) {
  if (!date) return '';
  
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  const diffInMs = now - dateObj;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  
  return `${Math.floor(diffInDays / 365)} years ago`;
}

function isDateExpired(expiryDate) {
  if (!expiryDate) return false;
  
  const now = new Date();
  const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
  
  return now > expiry;
}

// ========================================
// STRING UTILITIES
// ========================================

function sanitizeString(str) {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
}

function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function extractEmailDomain(email) {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1];
}

// ========================================
// VALIDATION UTILITIES
// ========================================

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateRequired(fields, data) {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] || data[field].toString().trim().length === 0) {
      missing.push(field);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missingFields: missing,
    message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : 'All required fields provided'
  };
}

function validateStringLength(text, fieldName, minLength = 0, maxLength = null) {
  if (!text) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  
  if (text.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters long` };
  }
  
  if (maxLength && text.length > maxLength) {
    return { isValid: false, message: `${fieldName} must not exceed ${maxLength} characters` };
  }
  
  return { isValid: true, message: 'Valid' };
}

// ========================================
// ARRAY UTILITIES
// ========================================

function removeDuplicates(array, key = null) {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    // Remove duplicates based on a specific key
    const seen = new Set();
    return array.filter(item => {
      const identifier = item[key];
      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });
  } else {
    // Remove primitive duplicates
    return [...new Set(array)];
  }
}

function sortArrayByDate(array, dateField, ascending = false) {
  return array.sort((a, b) => {
    const dateA = a[dateField]?.toDate ? a[dateField].toDate() : new Date(a[dateField]);
    const dateB = b[dateField]?.toDate ? b[dateField].toDate() : new Date(b[dateField]);
    
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

function groupArrayBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

function paginateArray(array, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      itemsPerPage: limit,
      hasNext: endIndex < array.length,
      hasPrev: startIndex > 0
    }
  };
}

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

function createErrorResponse(message, statusCode = 500, details = null) {
  return {
    success: false,
    error: message,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
}

function createSuccessResponse(data = null, message = 'Operation successful') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ERROR ${context ? `in ${context}` : ''}:`, error);
  
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
}

function logInfo(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ℹ️  INFO: ${message}`, data || '');
}

// ========================================
// SEARCH UTILITIES
// ========================================

function performTextSearch(items, searchTerm, searchFields) {
  if (!searchTerm || !Array.isArray(items) || !Array.isArray(searchFields)) {
    return items;
  }
  
  const term = searchTerm.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = getNestedProperty(item, field);
      return value && value.toString().toLowerCase().includes(term);
    });
  });
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

function highlightSearchTerm(text, searchTerm) {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// ========================================
// ID GENERATION UTILITIES
// ========================================

function generateRandomId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const randomId = generateRandomId(6);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFilenameWithoutExtension(originalName);
  
  return `${nameWithoutExt}_${timestamp}_${randomId}${extension}`;
}

// ========================================
// RESPONSE FORMATTING UTILITIES
// ========================================

function formatApiResponse(success, data = null, message = '', error = null) {
  const response = {
    success,
    timestamp: new Date().toISOString()
  };
  
  if (success) {
    response.message = message || 'Operation completed successfully';
    if (data !== null) {
      response.data = data;
    }
  } else {
    response.error = error || message || 'An error occurred';
  }
  
  return response;
}

function formatUserForResponse(user, includePrivate = false) {
  if (!user) return null;
  
  const publicFields = {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    createdAt: user.createdAt,
    isActive: user.isActive
  };
  
  if (includePrivate) {
    return {
      ...publicFields,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      role: user.role
    };
  }
  
  return publicFields;
}

module.exports = {
  // File utilities
  ensureDirectoryExists,
  deleteFileIfExists,
  getFileExtension,
  getFilenameWithoutExtension,
  formatFileSize,
  isValidFileType,
  
  // Date utilities
  formatDate,
  getRelativeTime,
  isDateExpired,
  
  // String utilities
  sanitizeString,
  generateSlug,
  truncateText,
  capitalizeWords,
  extractEmailDomain,
  
  // Validation utilities
  isValidEmail,
  isValidUrl,
  validateRequired,
  validateStringLength,
  
  // Array utilities
  removeDuplicates,
  sortArrayByDate,
  groupArrayBy,
  paginateArray,
  
  // Error handling utilities
  createErrorResponse,
  createSuccessResponse,
  logError,
  logInfo,
  
  // Search utilities
  performTextSearch,
  getNestedProperty,
  highlightSearchTerm,
  
  // ID generation utilities
  generateRandomId,
  generateUniqueFilename,
  
  // Response formatting utilities
  formatApiResponse,
  formatUserForResponse
};