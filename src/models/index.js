// ========================================
// MODELS INDEX - CENTRAL IMPORTS
// ========================================
// This is the main entry point for all models and validation functions
// Import this file to access all models from a single location

// Import all model modules
const userModels = require('./userModels');
const subjectModels = require('./subjectModels');
const chatModels = require('./chatModels');
const contentModels = require('./contentModels');
const fileModels = require('./fileModels');
const systemModels = require('./systemModels');

// ========================================
// CONSOLIDATED EXPORTS
// ========================================

module.exports = {
  // User Models
  UserModel: userModels.UserModel,
  UserValidation: userModels.UserValidation,
  validateUser: userModels.validateUser,
  USER_ROLES: userModels.USER_ROLES,
  createUserId: userModels.createUserId,
  
  // Subject Models
  SubjectModel: subjectModels.SubjectModel,
  SubjectValidation: subjectModels.SubjectValidation,
  validateSubject: subjectModels.validateSubject,
  SUBJECT_CATEGORIES: subjectModels.SUBJECT_CATEGORIES,
  LANGUAGES: subjectModels.LANGUAGES,
  DIFFICULTY_LEVELS: subjectModels.DIFFICULTY_LEVELS,
  createSubjectId: subjectModels.createSubjectId,
  
  // Chat Models (Subject-Only System)
  ChatMessageModel: chatModels.ChatMessageModel,
  ChatRoomModel: chatModels.ChatRoomModel,
  ChatMessageValidation: chatModels.ChatMessageValidation,
  validateChatMessage: chatModels.validateChatMessage,
  MESSAGE_TYPES: chatModels.MESSAGE_TYPES,
  createMessageId: chatModels.createMessageId,
  
  // Content Models
  PaperModel: contentModels.PaperModel,
  AnswerModel: contentModels.AnswerModel,
  VideoModel: contentModels.VideoModel,
  NotesModel: contentModels.NotesModel,
  PAPER_TYPES: contentModels.PAPER_TYPES,
  VIDEO_CATEGORIES: contentModels.VIDEO_CATEGORIES,
  NOTE_TYPES: contentModels.NOTE_TYPES,
  
  // File Models
  FileTypes: fileModels.FileTypes,
  FileSizeLimits: fileModels.FileSizeLimits,
  validateFileUpload: fileModels.validateFileUpload,
  FileUtils: fileModels.FileUtils,
  
  // System Models
  AdminStatsModel: systemModels.AdminStatsModel,
  ErrorLogModel: systemModels.ErrorLogModel,
  ActivityLogModel: systemModels.ActivityLogModel,
  SystemConfigModel: systemModels.SystemConfigModel,
  NotificationModel: systemModels.NotificationModel,
  ERROR_LEVELS: systemModels.ERROR_LEVELS,
  REPORT_PERIODS: systemModels.REPORT_PERIODS,
  ACTIVITY_ACTIONS: systemModels.ACTIVITY_ACTIONS,
  RESOURCE_TYPES: systemModels.RESOURCE_TYPES,
  NOTIFICATION_TYPES: systemModels.NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES: systemModels.NOTIFICATION_PRIORITIES,
  CONFIG_CATEGORIES: systemModels.CONFIG_CATEGORIES,
  createActivityLog: systemModels.createActivityLog,
  createNotification: systemModels.createNotification,
  createErrorLog: systemModels.createErrorLog,
  
  // Common Validation Patterns
  ValidationPatterns: fileModels.ValidationPatterns,
  
  // Utility Functions Collection
  utils: {
    createUserId: userModels.createUserId,
    createSubjectId: subjectModels.createSubjectId,
    createMessageId: chatModels.createMessageId,
    createActivityLog: systemModels.createActivityLog,
    createNotification: systemModels.createNotification,
    createErrorLog: systemModels.createErrorLog,
    ...fileModels.FileUtils
  },
  
  // All validation functions in one object
  validators: {
    validateUser: userModels.validateUser,
    validateSubject: subjectModels.validateSubject,
    validateChatMessage: chatModels.validateChatMessage,
    validateFileUpload: fileModels.validateFileUpload
  },
  
  // All constants in one object
  constants: {
    USER_ROLES: userModels.USER_ROLES,
    SUBJECT_CATEGORIES: subjectModels.SUBJECT_CATEGORIES,
    LANGUAGES: subjectModels.LANGUAGES,
    DIFFICULTY_LEVELS: subjectModels.DIFFICULTY_LEVELS,
    MESSAGE_TYPES: chatModels.MESSAGE_TYPES,
    PAPER_TYPES: contentModels.PAPER_TYPES,
    VIDEO_CATEGORIES: contentModels.VIDEO_CATEGORIES,
    NOTE_TYPES: contentModels.NOTE_TYPES,
    ERROR_LEVELS: systemModels.ERROR_LEVELS,
    REPORT_PERIODS: systemModels.REPORT_PERIODS,
    ACTIVITY_ACTIONS: systemModels.ACTIVITY_ACTIONS,
    RESOURCE_TYPES: systemModels.RESOURCE_TYPES,
    NOTIFICATION_TYPES: systemModels.NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITIES: systemModels.NOTIFICATION_PRIORITIES,
    CONFIG_CATEGORIES: systemModels.CONFIG_CATEGORIES
  }
};

// ========================================
// USAGE EXAMPLES
// ========================================

/* 
// Import all models
const models = require('./models');

// Use individual models
const { UserModel, validateUser, createUserId } = models;

// Use validation
const validation = models.validators.validateUser(userData);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}

// Use utilities
const newUserId = models.utils.createUserId();
const messageId = models.utils.createMessageId();

// Use constants
if (models.constants.USER_ROLES.includes(userRole)) {
  // Process user role
}

// Use file validation
const fileValidation = models.validators.validateFileUpload(fileData, 'images');
if (fileValidation.isValid) {
  // Process file upload
}

// Create activity log
const activityLog = models.utils.createActivityLog({
  userId: 'user123',
  userName: 'John Doe',
  action: 'upload',
  resource: 'paper',
  resourceId: 'paper456'
});
*/