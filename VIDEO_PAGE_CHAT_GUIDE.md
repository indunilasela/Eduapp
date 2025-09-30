# Video Page Chat System - Complete API Guide

## 🎯 Overview
The **Video Page Chat System** allows users to discuss and ask questions about specific videos in real-time. This system works exactly like the subject chat - no need to specify `videoId` in requests - it automatically uses the video page context.

## ✅ Key Features
- **💬 Real-time messaging** via WebSocket for instant communication
- **🎥 Video-specific discussions** - each video has its own chat room
- **↩️ Reply functionality** - threaded conversations with easy replies
- **🗑️ Smart deletion** - users can delete their own messages, admins can delete any
- **👥 Participant tracking** - see who's active in video discussions
- **📊 Admin analytics** - comprehensive chat statistics and monitoring
- **🔒 Permission system** - role-based access control for all operations

## 🏗️ Database Schema

### Video Page Chat Messages Collection (`videoPageChatMessages`)
```json
{
  "id": "messageId",
  "videoId": "video123",
  "senderId": "user456",
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "text": "Great explanation of the concept!",
  "messageType": "text",
  "replyTo": {
    "messageId": "originalMessageId",
    "originalText": "What do you think about this part?",
    "originalSenderName": "Jane Smith",
    "originalSenderId": "user789"
  },
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "isDeleted": false,
  "reactions": {}
}
```

## 📡 API Endpoints

### 1. Send Message to Video Page Chat
**POST** `/videos/:videoId/chat`

Send a new message to a video page discussion.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "This video really helped me understand the topic!",
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "1704123456789_abc123def",
  "message": {
    "id": "1704123456789_abc123def",
    "videoId": "video123",
    "senderId": "user456",
    "senderName": "John Doe",
    "text": "This video really helped me understand the topic!",
    "messageType": "text",
    "replyTo": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Video page chat message sent successfully"
}
```

### 2. Get Video Page Chat Messages
**GET** `/videos/:videoId/chat`

Retrieve messages for a specific video page discussion.

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `lastMessageId` (optional): For pagination, get messages after this ID

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "1704123456789_abc123def",
      "videoId": "video123",
      "senderId": "user456",
      "senderName": "John Doe",  
      "text": "This video really helped me understand the topic!",
      "messageType": "text",
      "replyTo": null,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "isDeleted": false,
      "reactions": {}
    }
  ],
  "totalMessages": 1
}
```

### 3. Reply to Video Page Chat Message
**POST** `/video-page-chat/:messageId/reply`

Reply to a specific message in video page chat. **No need to specify videoId** - it automatically gets it from the original message!

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "I agree! The examples were very clear."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "1704123456790_def456ghi",
  "message": {
    "id": "1704123456790_def456ghi",
    "videoId": "video123",
    "senderId": "user789",
    "senderName": "Jane Smith",
    "text": "I agree! The examples were very clear.",
    "messageType": "reply",
    "replyTo": {
      "messageId": "1704123456789_abc123def",
      "originalText": "This video really helped me understand the topic!",
      "originalSenderName": "John Doe",
      "originalSenderId": "user456"
    },
    "createdAt": "2024-01-01T12:05:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Video page chat message sent successfully"
}
```

### 4. Get Video Page Chat Participants
**GET** `/videos/:videoId/chat/participants`

Get all users who have participated in the video page discussion.

**Response:**
```json
{
  "success": true,
  "participants": [
    {
      "userId": "user456",
      "name": "John Doe",
      "email": "john@example.com",
      "messageCount": 5,
      "lastMessageAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "userId": "user789", 
      "name": "Jane Smith",
      "email": "jane@example.com",
      "messageCount": 3,
      "lastMessageAt": "2024-01-01T12:05:00.000Z"
    }
  ],
  "totalParticipants": 2
}
```

### 5. Delete Video Page Chat Message
**DELETE** `/video-page-chat/:messageId`

Delete a message from video page chat (own messages or admin can delete any).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "status": "Video page chat message deleted successfully"
}
```

### 6. Admin: Get Video Page Chat Statistics (Global)
**GET** `/admin/video-page-chat/stats`

Get comprehensive statistics about all video page chat activity (admin only).

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 1247,
    "totalActiveUsers": 89,
    "totalVideosWithMessages": 156,
    "messagesLast24h": 45,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

### 7. Admin: Get Individual Video Chat Statistics
**GET** `/videos/:videoId/chat/stats`

Get detailed statistics for a specific video's chat activity (admin only).

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "videoId": "video123",
  "stats": {
    "totalMessages": 45,
    "totalParticipants": 12,
    "messagesLast24h": 8,
    "messagesLast7d": 32,
    "totalReplies": 15,
    "averageMessagesPerUser": 3.75,
    "replyRate": 33.3,
    "oldestMessage": "2024-01-01T10:00:00.000Z",
    "newestMessage": "2024-01-01T16:30:00.000Z",
    "peakActivityHour": 14,
    "peakActivityDay": "Monday",
    "messagesByHour": [0, 0, 1, 2, 3, 1, 0, 2, 4, 5, 3, 2, 8, 6, 12, 4, 2, 1, 0, 0, 0, 0, 0, 0],
    "messagesByDay": [2, 12, 8, 6, 5, 7, 5],
    "topParticipants": [
      {
        "userId": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "messageCount": 8,
        "replyCount": 3,
        "lastMessageAt": "2024-01-01T16:30:00.000Z"
      }
    ],
    "lastUpdated": "2024-01-01T17:00:00.000Z"
  }
}
```

## 🔌 WebSocket Events

### Client → Server Events

#### Join Video Page Chat Room
```javascript
socket.emit('join-video-chat', {
  videoId: 'video123',
  userId: 'user456'
});
```

#### Send Message to Video Page
```javascript
socket.emit('send-video-message', {
  videoId: 'video123',
  text: 'Great explanation in this video!',
  messageType: 'text',
  tempId: Date.now() // For tracking message status
});
```

#### Send Reply to Video Page Message
```javascript
socket.emit('send-video-reply', {
  originalMessageId: 'messageId123',
  text: 'I completely agree!',
  messageType: 'reply',
  tempId: Date.now()
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('video-typing-start', {
  videoId: 'video123',
  userName: 'John Doe'
});

// Stop typing
socket.emit('video-typing-stop', {
  videoId: 'video123'
});
```

#### Get Online Users in Video Chat
```javascript
socket.emit('get-video-online-users', {
  videoId: 'video123'
});
```

#### Delete Message
```javascript
socket.emit('delete-video-message', {
  messageId: 'messageId123',
  userRole: 'user' // or 'admin'
});
```

#### Leave Video Page Chat
```javascript
socket.emit('leave-video-chat', {
  videoId: 'video123'
});
```

### Server → Client Events

#### New Message Received
```javascript
socket.on('new-video-message', (message) => {
  console.log('New video message:', message);
  // Update UI with new message
});
```

#### User Joined Video Chat
```javascript
socket.on('user-joined-video', (data) => {
  console.log(`${data.userName} joined video chat`);
  // Update online users list
});
```

#### User Left Video Chat
```javascript
socket.on('user-left-video', (data) => {
  console.log(`${data.userName} left video chat`);
  // Update online users list
});
```

#### Typing Indicators
```javascript
socket.on('user-typing-video', (data) => {
  console.log(`${data.userName} is typing in video chat...`);
  // Show typing indicator
});

socket.on('user-stopped-typing-video', (data) => {
  console.log('User stopped typing in video chat');
  // Hide typing indicator
});
```

#### Online Users List
```javascript
socket.on('video-online-users', (data) => {
  console.log(`${data.count} users online in video ${data.videoId}`);
  console.log('Users:', data.users);
  // Update online users display
});
```

#### Message Deletion
```javascript
socket.on('video-message-deleted', (data) => {
  console.log(`Message ${data.messageId} was deleted`);
  // Remove message from UI
});
```

#### Message Status Updates
```javascript
socket.on('video-message-sent', (data) => {
  console.log(`Message sent successfully: ${data.messageId}`);
  // Update message status in UI
});

socket.on('video-message-error', (data) => {
  console.error(`Message failed: ${data.error}`);
  // Show error to user
});
```

## 🧪 Quick Test Commands

### 1. Get JWT Token (Login First)
```bash
curl -X POST http://localhost:4000/auth/signin \
-H "Content-Type: application/json" \
-d '{"email":"your_email@example.com","password":"your_password"}'
```

### 2. Send Message to Video Page Chat
```bash
curl -X POST http://localhost:4000/videos/video123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "This video explains the concept very well!",
  "messageType": "text"
}'
```

### 3. Get Video Page Chat Messages
```bash
curl http://localhost:4000/videos/video123/chat
```

### 4. Reply to a Message (No videoId needed!)
```bash
curl -X POST http://localhost:4000/video-page-chat/MESSAGE_ID/reply \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Thanks for sharing this insight!"
}'
```

### 5. Get Video Page Chat Participants
```bash
curl http://localhost:4000/videos/video123/chat/participants
```

### 6. Delete a Message
```bash
curl -X DELETE http://localhost:4000/video-page-chat/MESSAGE_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Admin: Get Global Statistics
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/video-page-chat/stats
```

### 8. Admin: Get Individual Video Statistics
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/videos/video123/chat/stats
```

## 🎯 Key Features Summary

✅ **Same Pattern as Subject Chat** - Consistent API design across all chat systems  
✅ **No videoId in Replies** - Automatically gets videoId from original message  
✅ **Real-time Updates** - Instant message delivery via WebSocket  
✅ **Smart Permissions** - Users delete own messages, admins delete any  
✅ **Complete Analytics** - Admin statistics and monitoring  
✅ **Typing Indicators** - Real-time typing status  
✅ **Online Users** - See who's currently active in video discussions  
✅ **Message Threading** - Reply system with original message context  

## 🚀 Ready for Integration

The video page chat system is now **completely ready** for your mobile application! It follows the exact same proven pattern as your working subject chat system, ensuring consistency and reliability.

Your students can now have **real-time discussions about specific videos**, ask questions, share insights, and collaborate effectively while watching educational content! 🎥💬✨