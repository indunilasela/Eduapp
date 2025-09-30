# Chat System API Guide

## Overview
Complete real-time chat system for the EduBack application, allowing students and teachers to discuss subjects, share resources, and ask questions. Features include subject-based discussions, reply functionality, real-time messaging via WebSocket, and admin controls.

## System Features
- � **Subject-Based Discussions**: Chat is focused on subject-level conversations (simplified from paper-specific)
- 💬 **Reply Functionality**: Click any message to reply (like WhatsApp)
- ⚡ **Real-time Messaging**: Send and receive messages instantly via WebSocket
- 🔒 **Admin Controls**: Admins can delete any message, users can delete their own
- 👥 **Participant Tracking**: See who's active in subject discussions
- 📊 **Message Analytics**: Track chat activity and engagement
- � **WebSocket Integration**: Real-time room management with subject-based rooms
- 🎯 **Simplified UX**: Users discuss subjects directly without paper complexity

## Database Schema

### Chat Messages Collection (`chatMessages`)
```json
{
  "id": "1704123456789_abc123def",
  "subjectId": "subject123",
  "text": "This is a great explanation! Thanks for sharing.",
  "messageType": "text", // text, reply
  "senderId": "user123",
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "isDeleted": false,
  "replyTo": "messageId123", // Just stores the message ID for replies
  "reactions": {} // For future emoji reactions feature
}
```

## API Endpoints

### 1. Send Chat Message
**POST** `/subjects/:subjectId/chat`

Send a new message to a subject discussion.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "This is my message content",
  "messageType": "text" // Optional - defaults to "text"
}
```

**Response (Success):**
```json
{
  "success": true,
  "messageId": "1704123456789_abc123def",
  "message": {
    "id": "1704123456789_abc123def",
    "subjectId": "subject123",
    "text": "This is my message content",
    "messageType": "text",
    "senderId": "user123",
    "senderName": "John Doe",
    "senderEmail": "john@example.com",
    "createdAt": "2024-01-01T10:00:00Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Message sent successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Message text is required"
}
```

### 2. Reply to Message
**POST** `/chat/:messageId/reply`

Reply to a specific message in the chat.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Thanks for the explanation!",
  "subjectId": "subject123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "1704123456790_def456ghi",
  "message": {
    "id": "1704123456790_def456ghi",
    "subjectId": "subject123",
    "text": "Thanks for the explanation!",
    "messageType": "reply",
    "senderId": "user456",
    "senderName": "Jane Smith",
    "replyTo": "1704123456789_abc123def",
    "originalText": "This is my message content",
    "originalSenderName": "John Doe",
    "createdAt": "2024-01-01T10:01:00Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Message sent successfully"
}
```

### 3. Get Chat Messages
**GET** `/subjects/:subjectId/chat`

Get chat messages for a subject discussion.

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `lastMessageId` (optional): For pagination

**Example URLs:**
```
GET /subjects/subject123/chat           // Subject chat messages
GET /subjects/subject123/chat?limit=20  // Limit messages
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "1704123456789_abc123def",
      "subjectId": "subject123",
      "text": "This is a great resource!",
      "messageType": "text",
      "senderId": "user123",
      "senderName": "John Doe",
      "senderEmail": "john@example.com",
      "createdAt": "2024-01-01T10:00:00Z",
      "isDeleted": false,
      "reactions": {}
    },
    {
      "id": "1704123456790_def456ghi",
      "subjectId": "subject123",
      "text": "I agree! Very helpful.",
      "messageType": "reply",
      "senderId": "user456",
      "senderName": "Jane Smith",
      "replyTo": "1704123456789_abc123def",
      "originalText": "This is a great resource!",
      "originalSenderName": "John Doe",
      "createdAt": "2024-01-01T10:01:00Z",
      "isDeleted": false,
      "reactions": {}
    }
  ],
  "totalMessages": 2
}
```

### 4. Get Chat Participants
**GET** `/subjects/:subjectId/chat/participants`

Get list of users who have participated in the subject chat.

**Response:**
```json
{
  "success": true,
  "participants": [
    {
      "userId": "user123",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "messageCount": 5,
      "lastMessageAt": "2024-01-01T10:00:00Z"
    },
    {
      "userId": "user456",
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "messageCount": 3,
      "lastMessageAt": "2024-01-01T09:30:00Z"
    }
  ],
  "totalParticipants": 2
}
```

### 5. Delete Chat Message
**DELETE** `/chat/:messageId`

Delete a chat message (users can delete their own messages, admins can delete any).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### 6. Get Chat Statistics (Admin Only)
**GET** `/admin/chat/stats`

Get comprehensive chat statistics for admin dashboard.

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 1542,
    "messagesBySubject": {
      "subject123": 234,
      "subject456": 189,
      "subject789": 156
    },
    "activeUsers": 28,
    "messagesLast24h": 45,
    "messagesLast7d": 178,
    "repliesCount": 287,
    "reactionsCount": 156,
    "mostActiveSubject": "subject123",
    "peakChatTime": "14:00-16:00"
  }
}
```

## Frontend Integration Examples

### Send Message Component (React/React Native)
```jsx
const ChatInput = ({ subjectId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    
    setSending(true);
    try {
      const response = await fetch(`http://your-server:4000/subjects/${subjectId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: message.trim(),
          messageType: 'text'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('');
        // Refresh chat messages or add to state
        onMessageSent(result.message);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    }
    setSending(false);
  };

  return (
    <div className="chat-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        maxLength={1000}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button onClick={sendMessage} disabled={!message.trim() || sending}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
};
```

### Chat Messages Display Component
```jsx
const ChatMessages = ({ subjectId, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    fetchMessages();
    // Set up real-time updates via WebSocket here
  }, [subjectId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://your-server:4000/subjects/${subjectId}/chat`);
      const result = await response.json();
      
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
    setLoading(false);
  };

  const replyToMessage = async (originalMessageId, replyText) => {
    try {
      const response = await fetch(`http://your-server:4000/chat/${originalMessageId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: replyText,
          subjectId: subjectId
        })
      });

      const result = await response.json();
      if (result.success) {
        fetchMessages(); // Refresh messages
        setReplyingTo(null); // Clear reply state
      }
    } catch (error) {
      console.error('Reply error:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      const response = await fetch(`http://your-server:4000/chat/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const result = await response.json();
      if (result.success) {
        fetchMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Delete message error:', error);
    }
  };

  return (
    <div className="chat-messages">
      {replyingTo && (
        <div className="reply-banner">
          <span>Replying to: {replyingTo.senderName}</span>
          <button onClick={() => setReplyingTo(null)}>×</button>
        </div>
      )}
      
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`message ${message.senderId === currentUserId ? 'own-message' : 'other-message'}`}
        >
          {message.messageType === 'reply' && (
            <div className="reply-reference">
              <small>Replying to: {message.originalSenderName}</small>
              <p>"{message.originalText}"</p>
            </div>
          )}
          
          <div className="message-header">
            <strong>{message.senderName}</strong>
            <small>{new Date(message.createdAt).toLocaleString()}</small>
          </div>
          
          <p>{message.text}</p>
          
          <div className="message-actions">
            <button onClick={() => setReplyingTo(message)}>Reply</button>
            {(message.senderId === currentUserId || isAdmin) && (
              <button onClick={() => deleteMessage(message.id)}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Admin Chat Dashboard
```jsx
const AdminChatDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchChatStats();
  }, []);

  const fetchChatStats = async () => {
    try {
      const response = await fetch('http://your-server:4000/admin/chat/stats', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  if (!stats) return <div>Loading chat statistics...</div>;

  return (
    <div className="admin-chat-dashboard">
      <h2>Chat System Statistics</h2>
      
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Messages</h3>
          <p>{stats.totalMessages}</p>
        </div>
        
        <div className="stat-card">
          <h3>Active Users</h3>
          <p>{stats.activeUsers}</p>
        </div>
        
        <div className="stat-card">
          <h3>Messages (24h)</h3>
          <p>{stats.messagesLast24h}</p>
        </div>
        
        <div className="stat-card">
          <h3>Messages (7d)</h3>
          <p>{stats.messagesLast7d}</p>
        </div>
      </div>

      <div className="subject-breakdown">
        <h3>Messages by Subject</h3>
        {Object.entries(stats.messagesBySubject).map(([subjectId, count]) => (
          <div key={subjectId} className="subject-stat">
            Subject {subjectId}: {count} messages
          </div>
        ))}
      </div>
      
      <div className="additional-stats">
        <div className="stat-item">
          <span>Total Replies: {stats.repliesCount}</span>
        </div>
        <div className="stat-item">
          <span>Peak Chat Time: {stats.peakChatTime}</span>
        </div>
        <div className="stat-item">
          <span>Most Active Subject: {stats.mostActiveSubject}</span>
        </div>
      </div>
    </div>
  );
};
```

## Postman Testing Collection

### Environment Variables
```json
{
  "server_url": "http://localhost:4000",
  "jwt_token": "your_jwt_token_here",
  "admin_token": "admin_jwt_token_here",
  "subject_id": "subject123",
  "message_id": "1704123456789_abc123def"
}
```

### Test Scenarios

#### 1. Send Message to Subject Chat
```
POST {{server_url}}/subjects/{{subject_id}}/chat
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "text": "Hello everyone! Great to be part of this subject discussion.",
  "messageType": "text"
}
```

#### 2. Reply to a Message
```
POST {{server_url}}/chat/{{message_id}}/reply
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "text": "I completely agree! Thanks for sharing your thoughts.",
  "subjectId": "{{subject_id}}"
}
```

#### 3. Get Subject Chat Messages
```
GET {{server_url}}/subjects/{{subject_id}}/chat
```

#### 4. Get Subject Chat Messages with Limit
```
GET {{server_url}}/subjects/{{subject_id}}/chat?limit=20
```

#### 5. Get Chat Participants
```
GET {{server_url}}/subjects/{{subject_id}}/chat/participants
```

#### 6. Delete Message
```
DELETE {{server_url}}/chat/{{message_id}}
Authorization: Bearer {{jwt_token}}
```

#### 7. Admin - Get Chat Statistics
```
GET {{server_url}}/admin/chat/stats
Authorization: Bearer {{admin_token}}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Message text is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Permission denied. You can only delete your own messages."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Message not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Best Practices

### Message Management
- **Character Limit**: Messages limited to 1000 characters
- **Soft Delete**: Messages are marked as deleted, not removed
- **Real-time Updates**: Consider WebSocket integration for live updates
- **Pagination**: Use limit parameter for large chat histories

### Security Considerations
- **Authentication Required**: All write operations require JWT
- **Permission Checks**: Users can only delete their own messages
- **Input Validation**: Text length and format validation
- **Admin Controls**: Full message moderation capabilities

### Performance Optimization
- **Indexed Queries**: Firestore indexes on subjectId, paperId, createdAt
- **Message Limiting**: Default 50 messages per request
- **Caching**: Consider caching frequent chat participants
- **Background Cleanup**: Implement cleanup for very old deleted messages

### User Experience Features
- **Reply Threading**: Visual indication of message replies
- **Participant Lists**: See who's active in discussions
- **Message Status**: Clear indication of sent/delivered status
- **Smart Positioning**: Own messages on right, others on left

## Real-time Integration (Optional)

For real-time chat functionality, consider integrating:

### WebSocket Support
```javascript
// Add to your frontend
const socket = io('http://your-server:4000');

// Join subject-specific chat room
socket.emit('join-chat', { subjectId });

// Listen for new messages
socket.on('new-message', (message) => {
  // Update chat messages in real-time
  setMessages(prev => [...prev, message]);
});

// Listen for message replies
socket.on('message-reply', (reply) => {
  setMessages(prev => [...prev, reply]);
});

// Listen for deleted messages
socket.on('message-deleted', (messageId) => {
  // Remove deleted message from UI
  setMessages(prev => prev.filter(m => m.id !== messageId));
});

// Listen for typing indicators
socket.on('user-typing', ({ userId, userName, isTyping }) => {
  setTypingUsers(prev => 
    isTyping 
      ? [...prev, { userId, userName }]
      : prev.filter(u => u.userId !== userId)
  );
});

// Send typing indicator
const handleTyping = (isTyping) => {
  socket.emit('typing', { subjectId, isTyping });
};
```

## Workflow Summary

1. **User joins subject chat** → Loads recent messages via WebSocket room `subject_${subjectId}`
2. **User sends message** → Stored in Firestore, broadcasted to room participants
3. **Other users see message** → Real-time via WebSocket or on refresh
4. **Reply functionality** → Click message to reply with simplified context
5. **Delete permissions** → Own messages + admin controls
6. **Admin monitoring** → Statistics and moderation tools
7. **WebSocket rooms** → Format: `subject_${subjectId}` for real-time communication

## Key Improvements in Subject-Only System

✅ **Simplified UX**: No need to navigate paper-specific chats  
✅ **Better Performance**: Single room per subject vs multiple paper rooms  
✅ **Cleaner Architecture**: Reduced complexity in frontend and backend  
✅ **Real-time Efficiency**: WebSocket rooms based on subjects only  
✅ **Easier Moderation**: Admins manage subject-level conversations  
✅ **Mobile-Friendly**: Less navigation complexity for mobile apps  

This chat system provides a streamlined WhatsApp-like messaging experience for educational discussions focused on subjects! 🚀