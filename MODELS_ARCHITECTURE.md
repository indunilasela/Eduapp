# 📊 EduBack Models Architecture

## Overview
The EduBack models have been **modularized** into focused, maintainable sections for better organization, type safety, and scalability. Each module handles a specific domain of the application.

## 🏗️ **Modular Structure**

```
src/models/
├── index.js          # Main entry point - imports all models
├── userModels.js     # User management and authentication
├── subjectModels.js  # Educational subjects and courses
├── chatModels.js     # Subject-only chat system
├── contentModels.js  # Papers, videos, notes, answers
├── fileModels.js     # File validation and utilities
└── systemModels.js   # Admin, analytics, error tracking
```

## 📁 **Module Details**

### **1. User Models (`userModels.js`)**
**Purpose:** User management, authentication, and validation

**Exports:**
- ✅ `UserModel` - Complete user structure
- ✅ `UserValidation` - Validation rules
- ✅ `validateUser()` - User data validation
- ✅ `USER_ROLES` - Role constants
- ✅ `createUserId()` - ID generation

**Key Features:**
- Student, teacher, admin roles
- Profile management
- Academic field tracking
- Preference settings

### **2. Subject Models (`subjectModels.js`)**
**Purpose:** Educational subjects, courses, and academic structure

**Exports:**
- ✅ `SubjectModel` - Subject structure
- ✅ `SubjectValidation` - Validation rules
- ✅ `validateSubject()` - Subject validation
- ✅ `SUBJECT_CATEGORIES` - Category constants
- ✅ `LANGUAGES` - Language support
- ✅ `createSubjectId()` - ID generation

**Key Features:**
- Grade levels 1-13
- Multiple categories (science, math, language, etc.)
- Multi-language support (Sinhala, Tamil, English)
- Teacher assignment
- Statistics tracking

### **3. Chat Models (`chatModels.js`)**
**Purpose:** Subject-only real-time messaging system

**Exports:**
- ✅ `ChatMessageModel` - Message structure
- ✅ `ChatRoomModel` - WebSocket room management
- ✅ `validateChatMessage()` - Message validation
- ✅ `MESSAGE_TYPES` - Message type constants
- ✅ `createMessageId()` - Message ID generation

**Key Features:**
- Subject-only conversations (simplified from paper-specific)
- Reply functionality with context
- Real-time WebSocket integration
- Emoji reactions support (future)
- Message soft delete

### **4. Content Models (`contentModels.js`)**
**Purpose:** Educational content (papers, videos, notes, answers)

**Exports:**
- ✅ `PaperModel` - Educational documents
- ✅ `AnswerModel` - Student submissions
- ✅ `VideoModel` - Video content with approval
- ✅ `NotesModel` - Study materials and books
- ✅ Content type constants

**Key Features:**
- Admin approval workflow
- File metadata tracking
- Download/view statistics
- Rating and feedback system
- Academic year and term organization

### **5. File Models (`fileModels.js`)**
**Purpose:** File handling, validation, and utilities

**Exports:**
- ✅ `FileTypes` - Supported file types
- ✅ `FileSizeLimits` - Size restrictions
- ✅ `validateFileUpload()` - File validation
- ✅ `FileUtils` - File utility functions
- ✅ `ValidationPatterns` - Common regex patterns

**Key Features:**
- MIME type validation
- Size limit enforcement
- Safe filename generation
- File format utilities
- Security validation

### **6. System Models (`systemModels.js`)**
**Purpose:** System administration, analytics, and monitoring

**Exports:**
- ✅ `AdminStatsModel` - System analytics
- ✅ `ErrorLogModel` - Error tracking
- ✅ `ActivityLogModel` - User activity tracking
- ✅ `NotificationModel` - System notifications
- ✅ `SystemConfigModel` - App configuration
- ✅ Utility functions for logging

**Key Features:**
- Comprehensive analytics dashboard
- Error monitoring and resolution
- User activity tracking
- System notifications
- Configuration management

## 🎯 **Usage Examples**

### **Import All Models:**
```javascript
// Import everything from main index
const models = require('./models');

// Use specific models
const { UserModel, validateUser } = models;
const { ChatMessageModel, createMessageId } = models;
```

### **Import Specific Modules:**
```javascript
// Import only what you need
const { validateUser, USER_ROLES } = require('./models/userModels');
const { validateChatMessage } = require('./models/chatModels');
const { validateFileUpload } = require('./models/fileModels');
```

### **Validation Examples:**
```javascript
// User validation
const userValidation = models.validators.validateUser(userData);
if (!userValidation.isValid) {
  return res.status(400).json({
    success: false,
    errors: userValidation.errors
  });
}

// Chat message validation
const messageValidation = models.validators.validateChatMessage(messageData);
if (messageValidation.isValid) {
  // Process message
}

// File upload validation
const fileValidation = models.validators.validateFileUpload(file, 'documents');
```

### **Utility Functions:**
```javascript
// ID generation
const userId = models.utils.createUserId();
const messageId = models.utils.createMessageId();
const subjectId = models.utils.createSubjectId();

// File utilities
const safeFileName = models.utils.generateSafeFileName(originalName);
const fileSize = models.utils.formatFileSize(bytes);
const isImage = models.utils.isImageFile(mimetype);

// Activity logging
const activityLog = models.utils.createActivityLog({
  userId: 'user123',
  action: 'upload',
  resource: 'paper'
});
```

### **Constants Usage:**
```javascript
// Check user roles
if (models.constants.USER_ROLES.includes(userRole)) {
  // Valid role
}

// Validate message types
if (models.constants.MESSAGE_TYPES.includes(messageType)) {
  // Valid message type
}

// Check subject categories
const validCategories = models.constants.SUBJECT_CATEGORIES;
```

## 🚀 **Integration with Chat System**

### **Chat Message Creation:**
```javascript
const { validateChatMessage, createMessageId, ChatMessageModel } = require('./models');

// Validate message data
const validation = validateChatMessage(req.body);
if (!validation.isValid) {
  return res.status(400).json({
    success: false,
    errors: validation.errors
  });
}

// Create message with proper structure
const messageData = {
  id: createMessageId(),
  subjectId: req.params.subjectId,
  senderId: req.user.userId,
  senderName: req.user.name,
  text: req.body.text.trim(),
  messageType: req.body.messageType || 'text',
  createdAt: new Date(),
  isDeleted: false,
  reactions: {}
};
```

## 📈 **Benefits of Modular Structure**

### **1. Maintainability:**
✅ **Focused Modules**: Each file handles one specific domain  
✅ **Clear Separation**: Easy to find and modify specific functionality  
✅ **Reduced Complexity**: Smaller, more manageable files  

### **2. Scalability:**
✅ **Easy Extension**: Add new models without affecting others  
✅ **Flexible Imports**: Import only what you need  
✅ **Modular Testing**: Test individual modules separately  

### **3. Type Safety:**
✅ **Clear Contracts**: Well-defined data structures  
✅ **Validation**: Built-in validation for all models  
✅ **Documentation**: Self-documenting code structure  

### **4. Performance:**
✅ **Selective Loading**: Load only required modules  
✅ **Reduced Memory**: Smaller memory footprint  
✅ **Faster Startup**: Quicker application initialization  

## 🔧 **Migration from Monolithic Model**

### **Before (Single File):**
```javascript
// models.js - 800+ lines, everything mixed together
const { UserModel, ChatMessageModel, PaperModel, ... } = require('./models');
```

### **After (Modular):**
```javascript
// Clean, organized imports
const { validateUser } = require('./models/userModels');
const { validateChatMessage } = require('./models/chatModels');
const { validateFileUpload } = require('./models/fileModels');

// Or import everything from index
const models = require('./models');
```

## 🎯 **Subject-Only Chat Integration**

The modular structure perfectly supports the **subject-only chat system**:

```javascript
// chatModels.js - Focused on subject-only messaging
const ChatMessageModel = {
  subjectId: String,     // Subject association (no paperId)
  replyTo: String,       // Simple reply system
  messageType: 'text|reply', // Simplified types
  reactions: Object      // Future emoji support
};

// Room format: subject_${subjectId}
const roomFormat = `subject_${messageData.subjectId}`;
```

## 🔄 **Update Instructions**

### **1. Update Import Statements:**
```javascript
// Old way
const { validateUser, validateChatMessage } = require('./models');

// New way (specific modules)
const { validateUser } = require('./models/userModels');
const { validateChatMessage } = require('./models/chatModels');

// Or new way (main index)
const models = require('./models');
const userValidation = models.validators.validateUser(data);
```

### **2. Update Chat System:**
```javascript
// Use new chat models
const { validateChatMessage, createMessageId } = require('./models/chatModels');

// Or from main index
const { validateChatMessage, createMessageId } = require('./models');
```

### **3. Update File Handling:**
```javascript
// Use file validation
const { validateFileUpload, FileUtils } = require('./models/fileModels');

// Generate safe filenames
const safeFileName = FileUtils.generateSafeFileName(originalName);
```

## 🎉 **Ready for Production**

The modular models architecture is now:
✅ **Fully Compatible** with existing chat system  
✅ **Subject-Only Focused** for simplified UX  
✅ **Validation Ready** with comprehensive error handling  
✅ **Type Safe** with clear data contracts  
✅ **Scalable** for future feature additions  
✅ **Maintainable** with organized code structure  

Import the models and start using them in your EduBack application! 🚀