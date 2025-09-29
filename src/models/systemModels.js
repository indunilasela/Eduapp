// ========================================
// SYSTEM MODELS (Admin, Analytics, Error Tracking)
// ========================================
// This module defines system-level data structures and analytics

const { Timestamp } = require('firebase-admin/firestore');

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
  messagesBySubject: Object,
  repliesCount: Number,
  reactionsCount: Number,
  mostActiveSubject: String,
  peakChatTime: String,
  
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

/**
 * System Activity Log Model - Track user activities
 */
const ActivityLogModel = {
  id: String,
  userId: String, // User who performed the action
  userName: String, // User's name
  action: String, // Action performed ('login', 'upload', 'download', 'chat', etc.)
  resource: String, // Resource affected ('user', 'subject', 'paper', 'video', etc.)
  resourceId: String, // ID of the affected resource
  details: Object, // Additional details about the action
  ipAddress: String, // Client IP
  userAgent: String, // Client user agent
  timestamp: Timestamp,
  sessionId: String // User session ID
};

/**
 * System Configuration Model - App settings
 */
const SystemConfigModel = {
  id: String,
  key: String, // Configuration key
  value: String, // Configuration value
  type: String, // 'string', 'number', 'boolean', 'json'
  category: String, // 'general', 'security', 'storage', 'chat', 'upload'
  description: String, // Human-readable description
  isPublic: Boolean, // Whether config is visible to frontend
  updatedBy: String, // Admin who last updated
  updatedAt: Timestamp,
  createdAt: Timestamp
};

/**
 * Notification Model - System notifications
 */
const NotificationModel = {
  id: String,
  recipientId: String, // User who should receive notification
  recipientRole: String, // User role ('student', 'teacher', 'admin', 'all')
  type: String, // 'info', 'warning', 'success', 'error'
  title: String, // Notification title
  message: String, // Notification message
  actionUrl: String, // URL to navigate when clicked (optional)
  
  // System fields
  isRead: Boolean,
  readAt: Timestamp,
  createdAt: Timestamp,
  expiresAt: Timestamp, // When notification expires (optional)
  
  // Metadata
  relatedResource: String, // Type of related resource
  relatedResourceId: String, // ID of related resource
  priority: String // 'low', 'medium', 'high'
};

// System constants
const ERROR_LEVELS = ['error', 'warning', 'info', 'debug'];
const REPORT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const ACTIVITY_ACTIONS = ['login', 'logout', 'register', 'upload', 'download', 'chat', 'delete', 'update', 'create'];
const RESOURCE_TYPES = ['user', 'subject', 'paper', 'video', 'note', 'chat', 'system'];
const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'error'];
const NOTIFICATION_PRIORITIES = ['low', 'medium', 'high'];
const CONFIG_CATEGORIES = ['general', 'security', 'storage', 'chat', 'upload', 'email'];

/**
 * Create activity log entry
 */
function createActivityLog(data) {
  return {
    id: 'activity_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
    userId: data.userId,
    userName: data.userName,
    action: data.action,
    resource: data.resource,
    resourceId: data.resourceId || null,
    details: data.details || {},
    ipAddress: data.ipAddress || 'unknown',
    userAgent: data.userAgent || 'unknown',
    timestamp: new Date(),
    sessionId: data.sessionId || null
  };
}

/**
 * Create notification
 */
function createNotification(data) {
  return {
    id: 'notification_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
    recipientId: data.recipientId,
    recipientRole: data.recipientRole || 'student',
    type: data.type || 'info',
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl || null,
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    expiresAt: data.expiresAt || null,
    relatedResource: data.relatedResource || null,
    relatedResourceId: data.relatedResourceId || null,
    priority: data.priority || 'medium'
  };
}

/**
 * Create error log entry
 */
function createErrorLog(data) {
  return {
    id: 'error_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
    level: data.level || 'error',
    message: data.message,
    stack: data.stack || null,
    endpoint: data.endpoint || null,
    method: data.method || null,
    userId: data.userId || null,
    ip: data.ip || 'unknown',
    userAgent: data.userAgent || 'unknown',
    timestamp: new Date(),
    resolved: false,
    resolvedBy: null,
    resolvedAt: null
  };
}

module.exports = {
  AdminStatsModel,
  ErrorLogModel,
  ActivityLogModel,
  SystemConfigModel,
  NotificationModel,
  
  // Constants
  ERROR_LEVELS,
  REPORT_PERIODS,
  ACTIVITY_ACTIONS,
  RESOURCE_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  CONFIG_CATEGORIES,
  
  // Utility functions
  createActivityLog,
  createNotification,
  createErrorLog
};