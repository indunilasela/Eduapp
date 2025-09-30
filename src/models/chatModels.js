// ========================================
// CHAT MODELS AND VALIDATION (Subject-Only System)
// ========================================
// This module defines chat-related data structures and validation

const { Timestamp } = require('firebase-admin/firestore');

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
  
  if (messageData.messageType && !MESSAGE_TYPES.includes(messageData.messageType)) {
    errors.push('Invalid message type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Chat constants
const MESSAGE_TYPES = ['text', 'reply'];

// Utility functions
const createMessageId = () => Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

module.exports = {
  ChatMessageModel,
  ChatRoomModel,
  ChatMessageValidation,
  validateChatMessage,
  MESSAGE_TYPES,
  createMessageId
};