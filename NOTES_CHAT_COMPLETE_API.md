# 📝 Notes Chat System - Complete API Reference

## 🎯 Overview
The **Notes Chat System** allows users to discuss and ask questions about specific notes/documents in real-time. Each note has its own dedicated chat room for focused discussions.

## 📊 Database Collection
- **Collection**: `notesChatMessages`
- **Document Structure**: Same as other chat systems with `notesId` field

## 📡 **ALL NOTES CHAT ENDPOINTS**

### **🔵 Original Notes Chat Endpoints**

#### 1. **Send Message to Notes Chat**
```http
POST /notes/:notesId/chat
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "I have a question about this note section...",
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "messageId123",
  "message": {
    "id": "messageId123",
    "notesId": "notes123",
    "senderId": "user456",
    "senderName": "John Doe",
    "text": "I have a question about this note section...",
    "messageType": "text",
    "replyTo": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Notes chat message sent successfully"
}
```

#### 2. **Get Notes Chat Messages**
```http
GET /notes/:notesId/chat
```
**Authentication**: Not required (public access)

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `lastMessageId` (optional): For pagination

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "messageId123",
      "notesId": "notes123",
      "senderId": "user456",
      "senderName": "John Doe",
      "text": "I have a question about this note section...",
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

#### 3. **Reply to Notes Chat Message**
```http
POST /notes-chat/:messageId/reply
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "Great question! Here's the explanation...",
  "notesId": "notes123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "replyId456",
  "message": {
    "id": "replyId456",
    "notesId": "notes123",
    "senderId": "user789",
    "senderName": "Jane Smith",
    "text": "Great question! Here's the explanation...",
    "messageType": "reply",
    "replyTo": {
      "messageId": "messageId123",
      "originalText": "I have a question about this note section...",
      "originalSenderName": "John Doe",
      "originalSenderId": "user456"
    },
    "createdAt": "2024-01-01T12:05:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Notes chat message sent successfully"
}
```

#### 4. **Get Notes Chat Participants**
```http
GET /notes/:notesId/chat/participants
```
**Authentication**: Not required (public access)

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

#### 5. **Delete Notes Chat Message**
```http
DELETE /notes-chat/:messageId
```
**Authentication**: Required (Bearer token)

**Permissions**: Own messages or admin only

**Response:**
```json
{
  "success": true,
  "status": "Notes chat message deleted successfully"
}
```

#### 6. **Admin: Get Notes Chat Statistics**
```http
GET /admin/notes-chat/stats
```
**Authentication**: Required (Admin Bearer token)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 245,
    "totalActiveUsers": 67,
    "totalNotesWithMessages": 89,
    "messagesLast24h": 23,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### **🟢 Mobile App Compatible Endpoints**

#### 7. **Get Notes Messages (Mobile Format)**
```http
GET /notes/:notesId/messages
```
**Authentication**: Not required (public access)

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `lastMessageId` (optional): For pagination

**Response:** Same as endpoint #2

#### 8. **Send Notes Message (Mobile Format)**
```http
POST /notes/:notesId/messages
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "This is a great note! Thanks for sharing.",
  "messageType": "text"
}
```

**Response:** Same as endpoint #1

---

## 🔌 **WebSocket Events for Notes Chat**

### **Client → Server Events**

#### Join Notes Chat Room
```javascript
socket.emit('join-notes-chat', {
  notesId: 'notes123',
  userId: 'user456'
});
```

#### Send Notes Message
```javascript
socket.emit('send-notes-message', {
  notesId: 'notes123',
  text: 'Great explanation in this note!',
  messageType: 'text',
  tempId: Date.now()
});
```

#### Notes Typing Indicators
```javascript
// Start typing
socket.emit('notes-typing-start', {
  notesId: 'notes123',
  userName: 'John Doe'
});

// Stop typing
socket.emit('notes-typing-stop', {
  notesId: 'notes123'
});
```

### **Server → Client Events**

#### New Notes Message
```javascript
socket.on('new-notes-message', (message) => {
  console.log('New notes message:', message);
  // Update UI with new message
});
```

#### Notes Message Deleted
```javascript
socket.on('notes-message-deleted', (data) => {
  console.log(`Notes message ${data.messageId} was deleted`);
  // Remove message from UI
});
```

---

## 🧪 **Quick Test Commands**

### 1. **Get JWT Token (Login First)**
```bash
curl -X POST http://localhost:4000/auth/signin \
-H "Content-Type: application/json" \
-d '{"email":"your_email@example.com","password":"your_password"}'
```

### 2. **Send Message to Notes Chat**
```bash
curl -X POST http://localhost:4000/notes/notes123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "I have a question about this note...",
  "messageType": "text"
}'
```

### 3. **Get Notes Chat Messages**
```bash
curl http://localhost:4000/notes/notes123/chat
```

### 4. **Reply to Notes Message**
```bash
curl -X POST http://localhost:4000/notes-chat/MESSAGE_ID/reply \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Here is the answer to your question...",
  "notesId": "notes123"
}'
```

### 5. **Get Notes Chat Participants**
```bash
curl http://localhost:4000/notes/notes123/chat/participants
```

### 6. **Delete Notes Message**
```bash
curl -X DELETE http://localhost:4000/notes-chat/MESSAGE_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

### 7. **Admin: Get Notes Chat Stats**
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/notes-chat/stats
```

### 8. **Mobile App Format - Get Messages**
```bash
curl http://localhost:4000/notes/notes123/messages
```

### 9. **Mobile App Format - Send Message**
```bash
curl -X POST http://localhost:4000/notes/notes123/messages \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Mobile app message to notes!",
  "messageType": "text"
}'
```

---

## 📱 **Mobile App Integration**

Your React Native app can use either format:

### **Option 1: Original Format**
```javascript
// Get messages
const response = await fetch(`/notes/${notesId}/chat`);

// Send message
const response = await fetch(`/notes/${notesId}/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: messageText,
    messageType: 'text'
  })
});
```

### **Option 2: Mobile Compatible Format**
```javascript
// Get messages
const response = await fetch(`/notes/${notesId}/messages`);

// Send message
const response = await fetch(`/notes/${notesId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: messageText,
    messageType: 'text'
  })
});
```

---

## 🎯 **Key Features**

✅ **Real-time messaging** via WebSocket  
✅ **Reply threading** with original message context  
✅ **Public message viewing** - anyone can read  
✅ **Authenticated posting** - login required to send  
✅ **Smart permissions** - users delete own, admins delete any  
✅ **Admin analytics** - comprehensive statistics  
✅ **Participant tracking** - see who's active  
✅ **Mobile app compatible** - dual endpoint support  

---

## 🚀 **Total: 8 Notes Chat Endpoints**

Your Notes Chat system now has **complete API coverage** with both original and mobile-compatible endpoint formats, ensuring your React Native app can integrate seamlessly! 📝💬✨