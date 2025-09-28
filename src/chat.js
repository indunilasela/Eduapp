const { db, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc } = require('./database');
const { authenticateToken, isAdmin, readUserData } = require('./auth');

// ========================================
// CHAT SYSTEM UTILITY FUNCTIONS (SUBJECT-ONLY)
// ========================================

async function createChatMessage(messageData) {
  try {
    const messageDoc = await addDoc(collection(db, 'chatMessages'), {
      subjectId: messageData.subjectId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      senderEmail: messageData.senderEmail || 'Unknown Email', 
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      reactions: {}
    });

    const messageId = messageDoc.id;
    const message = {
      id: messageId,
      subjectId: messageData.subjectId,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown User',
      text: messageData.text,
      messageType: messageData.messageType || 'text',
      replyTo: messageData.replyTo || null,
      createdAt: new Date(),
      isDeleted: false,
      reactions: {}
    };
    
    return { success: true, messageId, message, status: 'Message sent successfully' };
  } catch (error) {
    console.error('❌ Error creating chat message:', error);
    return { success: false, error: error.message };
  }
}

async function getChatMessages(subjectId, paperId = null, lastMessageId = null, limit = 50) {
  try {
    const messagesRef = collection(db, 'chatMessages');
    
    // Subject-only messages query
    const q = query(
      messagesRef,
      where('subjectId', '==', subjectId),
      where('isDeleted', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt
      });
    });

    // Sort by creation time (newest first)
    messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply limit
    const limitedMessages = messages.slice(0, limit);
    
    return { 
      success: true, 
      messages: limitedMessages, 
      totalMessages: messages.length 
    };
  } catch (error) {
    console.error('❌ Error getting chat messages:', error);
    return { success: false, error: error.message };
  }
}

async function replyToMessage(originalMessageId, replyData) {
  try {
    // Get the original message
    const originalDoc = await getDoc(doc(db, 'chatMessages', originalMessageId));
    if (!originalDoc.exists()) {
      return { success: false, error: 'Original message not found' };
    }
    
    const originalMessage = originalDoc.data();
    
    // Create reply message with reference to original (subject-only)
    const replyMessageData = {
      ...replyData,
      replyTo: originalMessageId, // Just store the message ID for replies
      originalText: originalMessage.text,
      originalSenderName: originalMessage.senderName
    };
    
    const result = await createChatMessage(replyMessageData);
    return result;
  } catch (error) {
    console.error('❌ Error creating reply:', error);
    return { success: false, error: error.message };
  }
}

async function deleteChatMessage(messageId, userRole, userId) {
  try {
    const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
    
    if (!messageDoc.exists()) {
      return { success: false, error: 'Message not found' };
    }
    
    const messageData = messageDoc.data();
    
    // Check permissions: admin can delete any message, users can delete their own
    if (userRole !== 'admin' && messageData.senderId !== userId) {
      return { success: false, error: 'Permission denied. You can only delete your own messages.' };
    }
    
    // Soft delete: mark as deleted instead of removing completely
    await setDoc(doc(db, 'chatMessages', messageId), {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    }, { merge: true });
    
    return { success: true, message: 'Message deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting message:', error);
    return { success: false, error: error.message };
  }
}

async function getChatParticipants(subjectId, paperId = null) {
  try {
    const messagesRef = collection(db, 'chatMessages');
    
    // Subject-only participants query
    const q = query(
      messagesRef,
      where('subjectId', '==', subjectId),
      where('isDeleted', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const participantsMap = new Map();
    
    querySnapshot.forEach((doc) => {
      const message = doc.data();
      if (!participantsMap.has(message.senderId)) {
        participantsMap.set(message.senderId, {
          userId: message.senderId,
          userName: message.senderName || 'Unknown User',
          userEmail: message.senderEmail || 'Unknown Email',
          messageCount: 1,
          lastMessageAt: message.createdAt?.toDate ? message.createdAt.toDate() : message.createdAt
        });
      } else {
        const existing = participantsMap.get(message.senderId);
        existing.messageCount++;
        const messageTime = message.createdAt?.toDate ? message.createdAt.toDate() : message.createdAt;
        if (new Date(messageTime) > new Date(existing.lastMessageAt)) {
          existing.lastMessageAt = messageTime;
        }
      }
    });
    
    const participants = Array.from(participantsMap.values())
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    
    return { success: true, participants, totalParticipants: participants.length };
  } catch (error) {
    console.error('❌ Error getting chat participants:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// CHAT HTTP ENDPOINTS (SUBJECT-ONLY)
// ========================================

function setupChatRoutes(app) {
  // Send a chat message to a subject discussion
  app.post('/subjects/:subjectId/chat', authenticateToken, async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { text, messageType } = req.body;
      const userId = req.user.userId;
      
      // Validate input
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message text is required'
        });
      }
      
      if (text.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Message too long. Maximum 1000 characters allowed.'
        });
      }
      
      // Get user data
      const userData = await getDoc(doc(db, 'users', userId));
      if (!userData.exists()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const user = userData.data();
      
      const messageData = {
        subjectId,
        text: text.trim(),
        messageType: messageType || 'text', // text, image, file
        senderId: userId,
        senderName: user.name || user.username || user.email || 'Unknown User',
        senderEmail: user.email || 'Unknown Email'
      };
      
      const result = await createChatMessage(messageData);
      
      if (result.success) {
        // Broadcast via WebSocket to all users in the room
        const roomName = `subject_${subjectId}`;
        if (global.io) {
          global.io.to(roomName).emit('new-message', {
            ...result.message,
            timestamp: new Date()
          });
        }
        
        res.status(201).json({
          success: true,
          messageId: result.messageId,
          message: result.message,
          status: result.status
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Send chat message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Reply to a specific message
  app.post('/chat/:messageId/reply', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      const { text, subjectId } = req.body;
      const userId = req.user.userId;
      
      // Validate input
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Reply text is required'
        });
      }
      
      if (!subjectId) {
        return res.status(400).json({
          success: false,
          error: 'Subject ID is required'
        });
      }
      
      // Get user data
      const userData = await getDoc(doc(db, 'users', userId));
      if (!userData.exists()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const user = userData.data();
      
      const replyData = {
        subjectId,
        text: text.trim(),
        messageType: 'reply',
        senderId: userId,
        senderName: user.name || user.username || user.email || 'Unknown User',
        senderEmail: user.email || 'Unknown Email'
      };
      
      const result = await replyToMessage(messageId, replyData);
      
      if (result.success) {
        // Broadcast reply via WebSocket to all users in the room
        const roomName = `subject_${subjectId}`;
        if (global.io) {
          global.io.to(roomName).emit('new-message', {
            ...result.message,
            timestamp: new Date()
          });
        }
        
        res.status(201).json({
          success: true,
          messageId: result.messageId,
          message: result.message,
          status: result.status
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Reply to message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get chat messages for a subject discussion
  app.get('/subjects/:subjectId/chat', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { limit = 50, lastMessageId } = req.query;
      
      const result = await getChatMessages(subjectId, null, lastMessageId, parseInt(limit));
      
      if (result.success) {
        res.json({
          success: true,
          messages: result.messages,
          totalMessages: result.totalMessages
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get chat messages error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get chat participants for a subject discussion
  app.get('/subjects/:subjectId/chat/participants', async (req, res) => {
    try {
      const { subjectId } = req.params;
      
      const result = await getChatParticipants(subjectId, null);
      
      if (result.success) {
        res.json({
          success: true,
          participants: result.participants,
          totalParticipants: result.totalParticipants
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get chat participants error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete a chat message (own messages or admin can delete any)
  app.delete('/chat/:messageId', authenticateToken, async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;
      
      // Get user data to check role
      const userData = await getDoc(doc(db, 'users', userId));
      if (!userData.exists()) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const userRole = userData.data().email === 'i.asela016@gmail.com' ? 'admin' : 'user';
      
      const result = await deleteChatMessage(messageId, userRole, userId);
      
      if (result.success) {
        // Broadcast deletion via WebSocket
        try {
          const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
          if (messageDoc.exists()) {
            const messageData = messageDoc.data();
            const roomName = `subject_${messageData.subjectId}`;
            
            if (global.io) {
              global.io.to(roomName).emit('message-deleted', { 
                messageId,
                deletedBy: userId,
                timestamp: new Date()
              });
            }
          }
        } catch (broadcastError) {
          console.error('❌ WebSocket broadcast error:', broadcastError);
        }
        
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error.includes('Permission denied') ? 403 : 404;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Delete chat message error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

module.exports = {
  createChatMessage,
  getChatMessages,
  replyToMessage,
  deleteChatMessage,
  getChatParticipants,
  setupChatRoutes
};