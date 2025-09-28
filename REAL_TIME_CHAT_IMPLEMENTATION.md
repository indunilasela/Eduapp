# Real-Time Chat Implementation Guide

## Current State: HTTP-Based Chat
✅ **What Works**: Send/receive messages via API calls
❌ **What's Missing**: Automatic real-time updates

## Making It Real-Time with WebSockets

### 1. Install Socket.IO
```bash
npm install socket.io
```

### 2. Add WebSocket Server to Backend
```javascript
// Add to src/index.js
const { Server } = require('socket.io');
const http = require('http');

// Create HTTP server
const server = http.createServer(app);

// Add Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Configure for your mobile app
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Join specific chat rooms
  socket.on('join-chat', ({ subjectId, paperId, userId }) => {
    const roomName = `${subjectId}_${paperId || 'general'}`;
    socket.join(roomName);
    console.log(`👤 User ${userId} joined room: ${roomName}`);
  });

  // Handle real-time message sending
  socket.on('send-message', async (messageData) => {
    try {
      // Save message to database (use existing function)
      const result = await createChatMessage(messageData);
      
      if (result.success) {
        const roomName = `${messageData.subjectId}_${messageData.paperId || 'general'}`;
        
        // Broadcast to all users in the chat room
        io.to(roomName).emit('new-message', result.message);
        
        // Send confirmation to sender
        socket.emit('message-sent', {
          success: true,
          messageId: result.messageId
        });
      }
    } catch (error) {
      socket.emit('message-error', { error: error.message });
    }
  });

  // Handle real-time replies
  socket.on('send-reply', async (replyData) => {
    try {
      const result = await replyToMessage(replyData.originalMessageId, replyData);
      
      if (result.success) {
        const roomName = `${replyData.subjectId}_${replyData.paperId || 'general'}`;
        io.to(roomName).emit('new-message', result.message);
      }
    } catch (error) {
      socket.emit('reply-error', { error: error.message });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', ({ subjectId, paperId, userName }) => {
    const roomName = `${subjectId}_${paperId || 'general'}`;
    socket.to(roomName).emit('user-typing', { userName, isTyping: true });
  });

  socket.on('typing-stop', ({ subjectId, paperId, userName }) => {
    const roomName = `${subjectId}_${paperId || 'general'}`;
    socket.to(roomName).emit('user-typing', { userName, isTyping: false });
  });

  // Handle message deletion in real-time
  socket.on('delete-message', async ({ messageId, userId, userRole }) => {
    try {
      const result = await deleteChatMessage(messageId, userRole, userId);
      
      if (result.success) {
        // Get message to find which room to notify
        const messageDoc = await getDoc(doc(db, 'chatMessages', messageId));
        if (messageDoc.exists()) {
          const messageData = messageDoc.data();
          const roomName = `${messageData.subjectId}_${messageData.paperId || 'general'}`;
          io.to(roomName).emit('message-deleted', { messageId });
        }
      }
    } catch (error) {
      socket.emit('delete-error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Update server to use HTTP server instead of app
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time chat`);
  console.log(`🌐 Network accessible at http://0.0.0.0:${PORT}`);
  console.log(`🌐 Local access at http://localhost:${PORT}`);
  console.log(`🔥 Firebase connection ready`);
});
```

### 3. Frontend Integration (React Native)

```jsx
// Install socket.io-client
// npm install socket.io-client

import io from 'socket.io-client';

const ChatScreen = ({ subjectId, paperId, userId }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://your-server:4000');
    setSocket(newSocket);

    // Join chat room
    newSocket.emit('join-chat', { subjectId, paperId, userId });

    // Listen for new messages
    newSocket.on('new-message', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    // Listen for deleted messages
    newSocket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    // Listen for typing indicators
    newSocket.on('user-typing', ({ userName, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => [...prev, userName]);
      } else {
        setTypingUsers(prev => prev.filter(name => name !== userName));
      }
    });

    return () => newSocket.close();
  }, [subjectId, paperId, userId]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;

    const messageData = {
      subjectId,
      paperId: paperId || null,
      text: message.trim(),
      messageType: 'text',
      senderId: userId,
      senderName: 'John Doe', // Get from user context
      senderEmail: 'john@example.com'
    };

    // Send via WebSocket for real-time
    socket.emit('send-message', messageData);
    setMessage('');
  };

  const replyToMessage = (originalMessageId, replyText) => {
    if (!socket) return;

    socket.emit('send-reply', {
      originalMessageId,
      text: replyText,
      subjectId,
      paperId: paperId || null,
      senderId: userId,
      senderName: 'John Doe',
      senderEmail: 'john@example.com'
    });
  };

  const handleTyping = (isTyping) => {
    if (!socket) return;

    if (isTyping) {
      socket.emit('typing-start', { subjectId, paperId, userName: 'John Doe' });
    } else {
      socket.emit('typing-stop', { subjectId, paperId, userName: 'John Doe' });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Messages List */}
      <ScrollView>
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isOwn={msg.senderId === userId}
            onReply={replyToMessage}
          />
        ))}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <Text>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</Text>
        )}
      </ScrollView>

      {/* Message Input */}
      <View style={{ flexDirection: 'row', padding: 10 }}>
        <TextInput
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            handleTyping(text.length > 0);
          }}
          onEndEditing={() => handleTyping(false)}
          placeholder="Type a message..."
          style={{ flex: 1, borderWidth: 1, padding: 10, borderRadius: 20 }}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
};
```

## Implementation Options

### Option 1: Add Real-Time to Current System
```bash
# Quick addition to existing backend
npm install socket.io
# Add WebSocket code to src/index.js
# Keep existing HTTP endpoints as backup
```

### Option 2: Hybrid Approach (Recommended)
```bash
# Use both HTTP and WebSocket
# HTTP for: Initial message loading, authentication
# WebSocket for: Real-time updates, typing, live notifications
```

### Option 3: Pure WebSocket
```bash
# Replace HTTP endpoints with WebSocket events
# All chat operations via WebSocket
# More complex but fully real-time
```

## Real-Time Features We Can Add

### 1. Instant Messaging ⚡
- Messages appear immediately for all users
- No refresh needed

### 2. Typing Indicators 💬
- "John is typing..." notifications
- Real-time typing status

### 3. Read Receipts ✅
- Message delivered/read status
- Last seen timestamps

### 4. Online Status 🟢
- Who's currently online
- Last active timestamps

### 5. Push Notifications 📱
- Instant alerts for new messages
- Background notifications

### 6. Message Status Updates 📊
- Sending → Sent → Delivered → Read
- Real-time status changes

## Would You Like Me To Implement Real-Time?

I can add WebSocket support to your current system right now! This would give you:

✅ **Instant message delivery**
✅ **Typing indicators** 
✅ **Real-time replies**
✅ **Live message deletion**
✅ **Online user tracking**

The current HTTP-based system works great for basic chat functionality, but adding WebSockets would make it a truly real-time WhatsApp-like experience.

**Should I implement the real-time WebSocket layer on top of your current chat system?** 🚀
