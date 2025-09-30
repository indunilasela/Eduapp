const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { createChatMessage, getChatMessages } = require('./chat');
const { db, doc, getDoc } = require('./database');

// JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ========================================
// WEBSOCKET SERVER SETUP
// ========================================

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "https://eduback.netlify.app", "https://eduplat.netlify.app"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['polling', 'websocket']
  });

  // Store io instance globally for use in other modules
  global.io = io;

  console.log('🚀 WebSocket server initialized');

  // ========================================
  // WEBSOCKET MIDDLEWARE
  // ========================================

  // Authentication middleware for WebSocket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ No token provided for WebSocket connection');
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user data from database
      const userDoc = await getDoc(doc(db, 'users', decoded.userId));
      if (!userDoc.exists()) {
        console.log('❌ User not found for WebSocket connection:', decoded.userId);
        return next(new Error('User not found'));
      }

      const userData = userDoc.data();
      
      // Attach user info to socket for later use
      socket.userId = decoded.userId;
      socket.userEmail = userData.email;
      socket.userName = userData.name || userData.username || userData.email;
      socket.userRole = userData.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
      
      console.log(`✅ User authenticated for WebSocket: ${socket.userName} (${socket.userEmail})`);
      next();
    } catch (error) {
      console.error('❌ WebSocket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  // ========================================
  // WEBSOCKET CONNECTION HANDLER
  // ========================================

  io.on('connection', (socket) => {
    console.log(`🔗 Client connected: ${socket.id} - User: ${socket.userName}`);
    
    // ========================================
    // SUBJECT ROOM MANAGEMENT
    // ========================================
    
    // Join subject-specific chat room
    socket.on('join-subject-room', async (data) => {
      try {
        const { subjectId } = data;
        
        if (!subjectId) {
          socket.emit('error', { message: 'Subject ID is required' });
          return;
        }
        
        const roomName = `subject_${subjectId}`;
        
        // Leave any previous rooms (optional - users can be in multiple rooms)
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room !== socket.id && room.startsWith('subject_')) {
            socket.leave(room);
            console.log(`📤 ${socket.userName} left room: ${room}`);
          }
        });
        
        // Join the new subject room
        socket.join(roomName);
        console.log(`📥 ${socket.userName} joined subject room: ${roomName}`);
        
        // Notify user of successful join
        socket.emit('joined-subject-room', {
          success: true,
          subjectId,
          roomName,
          message: `Successfully joined subject discussion`
        });
        
        // Notify other users in the room (optional)
        socket.to(roomName).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          timestamp: new Date()
        });
        
        // Send recent messages to the newly joined user
        try {
          const messages = await getChatMessages(subjectId, null, null, 20);
          if (messages.success) {
            socket.emit('recent-messages', {
              subjectId,
              messages: messages.messages.reverse() // Send oldest first
            });
          }
        } catch (error) {
          console.error('❌ Error sending recent messages:', error);
        }
        
      } catch (error) {
        console.error('❌ Join subject room error:', error);
        socket.emit('error', { message: 'Failed to join subject room' });
      }
    });

    // Leave subject room
    socket.on('leave-subject-room', (data) => {
      try {
        const { subjectId } = data;
        
        if (!subjectId) {
          socket.emit('error', { message: 'Subject ID is required' });
          return;
        }
        
        const roomName = `subject_${subjectId}`;
        socket.leave(roomName);
        
        console.log(`📤 ${socket.userName} left subject room: ${roomName}`);
        
        // Notify user of successful leave
        socket.emit('left-subject-room', {
          success: true,
          subjectId,
          roomName,
          message: `Left subject discussion`
        });
        
        // Notify other users in the room
        socket.to(roomName).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('❌ Leave subject room error:', error);
        socket.emit('error', { message: 'Failed to leave subject room' });
      }
    });

    // ========================================
    // REAL-TIME CHAT MESSAGING
    // ========================================
    
    // Handle sending a new chat message
    socket.on('send-message', async (data) => {
      try {
        const { subjectId, text, messageType = 'text', replyTo = null } = data;
        
        // Validate required fields
        if (!subjectId || !text) {
          socket.emit('message-error', { 
            error: 'Subject ID and message text are required',
            timestamp: new Date()
          });
          return;
        }
        
        // Validate message length
        if (text.trim().length === 0) {
          socket.emit('message-error', { 
            error: 'Message cannot be empty',
            timestamp: new Date()
          });
          return;
        }
        
        if (text.length > 1000) {
          socket.emit('message-error', { 
            error: 'Message too long. Maximum 1000 characters allowed.',
            timestamp: new Date()
          });
          return;
        }
        
        // Create message data
        const messageData = {
          subjectId,
          text: text.trim(),
          messageType,
          replyTo,
          senderId: socket.userId,
          senderName: socket.userName,
          senderEmail: socket.userEmail
        };
        
        // Save message to database
        const result = await createChatMessage(messageData);
        
        if (result.success) {
          const roomName = `subject_${subjectId}`;
          
          // Broadcast message to all users in the subject room
          io.to(roomName).emit('new-message', {
            id: result.messageId,
            ...result.message,
            timestamp: new Date()
          });
          
          console.log(`💬 Message sent in ${roomName} by ${socket.userName}: ${text.substring(0, 50)}...`);
        } else {
          socket.emit('message-error', { 
            error: result.error,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('message-error', { 
          error: 'Failed to send message',
          timestamp: new Date()
        });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      try {
        const { subjectId } = data;
        
        if (!subjectId) {
          return;
        }
        
        const roomName = `subject_${subjectId}`;
        
        // Broadcast typing indicator to other users in the room (exclude sender)
        socket.to(roomName).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userName,
          subjectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('❌ Typing start error:', error);
      }
    });

    socket.on('typing-stop', (data) => {
      try {
        const { subjectId } = data;
        
        if (!subjectId) {
          return;
        }
        
        const roomName = `subject_${subjectId}`;
        
        // Broadcast stop typing to other users in the room (exclude sender)
        socket.to(roomName).emit('user-stopped-typing', {
          userId: socket.userId,
          userName: socket.userName,
          subjectId,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('❌ Typing stop error:', error);
      }
    });

    // Handle message reactions (future feature)
    socket.on('add-reaction', async (data) => {
      try {
        const { messageId, reaction } = data;
        
        if (!messageId || !reaction) {
          socket.emit('reaction-error', { 
            error: 'Message ID and reaction are required',
            timestamp: new Date()
          });
          return;
        }
        
        // This would need to be implemented in the database layer
        // For now, just acknowledge the reaction
        socket.emit('reaction-added', {
          messageId,
          reaction,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('❌ Add reaction error:', error);
        socket.emit('reaction-error', { 
          error: 'Failed to add reaction',
          timestamp: new Date()
        });
      }
    });

    // ========================================
    // USER PRESENCE AND STATUS
    // ========================================
    
    // Handle user presence updates
    socket.on('update-presence', (data) => {
      try {
        const { status = 'online' } = data; // online, away, busy, offline
        
        // Update user's presence in all rooms they're part of
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room !== socket.id && room.startsWith('subject_')) {
            socket.to(room).emit('user-presence-updated', {
              userId: socket.userId,
              userName: socket.userName,
              status,
              timestamp: new Date()
            });
          }
        });
        
      } catch (error) {
        console.error('❌ Update presence error:', error);
      }
    });

    // ========================================
    // CONNECTION MANAGEMENT
    // ========================================
    
    // Handle graceful disconnect
    socket.on('disconnect', (reason) => {
      console.log(`💔 Client disconnected: ${socket.id} - User: ${socket.userName} - Reason: ${reason}`);
      
      // Notify all rooms that user left
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id && room.startsWith('subject_')) {
          socket.to(room).emit('user-disconnected', {
            userId: socket.userId,
            userName: socket.userName,
            userEmail: socket.userEmail,
            reason,
            timestamp: new Date()
          });
        }
      });
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
    });

    // Handle generic errors
    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      socket.emit('error', { message: 'An error occurred', timestamp: new Date() });
    });

    // Send welcome message to newly connected user
    socket.emit('connected', {
      success: true,
      message: 'Successfully connected to chat server',
      userId: socket.userId,
      userName: socket.userName,
      userEmail: socket.userEmail,
      userRole: socket.userRole,
      timestamp: new Date()
    });
  });

  return io;
}

// ========================================
// WEBSOCKET UTILITIES
// ========================================

// Get online users in a specific subject room
function getOnlineUsersInSubject(subjectId) {
  if (!global.io) {
    return [];
  }
  
  const roomName = `subject_${subjectId}`;
  const room = global.io.sockets.adapter.rooms.get(roomName);
  
  if (!room) {
    return [];
  }
  
  const users = [];
  room.forEach(socketId => {
    const socket = global.io.sockets.sockets.get(socketId);
    if (socket && socket.userId) {
      users.push({
        userId: socket.userId,
        userName: socket.userName,
        userEmail: socket.userEmail,
        userRole: socket.userRole,
        socketId: socketId
      });
    }
  });
  
  return users;
}

// Broadcast message to specific subject room
function broadcastToSubject(subjectId, eventName, data) {
  if (!global.io) {
    console.warn('❌ WebSocket server not initialized');
    return false;
  }
  
  const roomName = `subject_${subjectId}`;
  global.io.to(roomName).emit(eventName, {
    ...data,
    timestamp: new Date()
  });
  
  return true;
}

// Get total connected users
function getTotalConnectedUsers() {
  if (!global.io) {
    return 0;
  }
  
  return global.io.engine.clientsCount;
}

// Get all active subject rooms
function getActiveSubjectRooms() {
  if (!global.io) {
    return [];
  }
  
  const rooms = [];
  global.io.sockets.adapter.rooms.forEach((room, roomName) => {
    if (roomName.startsWith('subject_')) {
      const subjectId = roomName.replace('subject_', '');
      rooms.push({
        subjectId,
        roomName,
        userCount: room.size
      });
    }
  });
  
  return rooms;
}

module.exports = {
  initializeWebSocket,
  getOnlineUsersInSubject,
  broadcastToSubject,
  getTotalConnectedUsers,
  getActiveSubjectRooms
};