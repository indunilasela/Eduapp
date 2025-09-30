# 📄 Papers Chat System - Complete API Reference

## 🎯 Overview
The **Papers Chat System** allows users to discuss and ask questions about specific papers/documents in real-time. Each paper has its own dedicated chat room for focused discussions about research papers, assignments, and academic documents.

## 📊 Database Collection
- **Collection**: `papersChatMessages`
- **Document Structure**: Same as other chat systems with `paperId` field
- **Username Display**: Shows actual usernames (like notes & videos chat), not email prefixes

## 📡 **ALL PAPERS CHAT ENDPOINTS**

### **🔵 Original Papers Chat Endpoints**

#### 1. **Send Message to Papers Chat**
```http
POST /papers/:paperId/chat
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "I have a question about this research methodology...",
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
    "paperId": "paper123",
    "senderId": "user456",
    "senderName": "John Doe",
    "text": "I have a question about this research methodology...",
    "messageType": "text",
    "replyTo": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Papers chat message sent successfully"
}
```

#### 2. **Get Papers Chat Messages**
```http
GET /papers/:paperId/chat
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
      "paperId": "paper123",
      "senderId": "user456",
      "senderName": "John Doe",
      "text": "I have a question about this research methodology...",
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

#### 3. **Reply to Papers Chat Message**
```http
POST /papers-chat/:messageId/reply
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "Great question! The methodology follows these principles...",
  "paperId": "paper123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "replyId456",
  "message": {
    "id": "replyId456",
    "paperId": "paper123",
    "senderId": "user789",
    "senderName": "Jane Smith",
    "text": "Great question! The methodology follows these principles...",
    "messageType": "reply",
    "replyTo": {
      "messageId": "messageId123",
      "originalText": "I have a question about this research methodology...",
      "originalSenderName": "John Doe",
      "originalSenderId": "user456"
    },
    "createdAt": "2024-01-01T12:05:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Papers chat message sent successfully"
}
```

#### 4. **Get Papers Chat Participants**
```http
GET /papers/:paperId/chat/participants
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

#### 5. **Delete Papers Chat Message**
```http
DELETE /papers-chat/:messageId
```
**Authentication**: Required (Bearer token)

**Permissions**: Own messages or admin only

**Response:**
```json
{
  "success": true,
  "status": "Papers chat message deleted successfully"
}
```

#### 6. **Admin: Get Papers Chat Statistics**
```http
GET /admin/papers-chat/stats
```
**Authentication**: Required (Admin Bearer token)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 187,
    "totalActiveUsers": 45,
    "totalPapersWithMessages": 23,
    "messagesLast24h": 15,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### **🟢 Mobile App Compatible Endpoints**

#### 7. **Get Papers Messages (Mobile Format)**
```http
GET /papers/:paperId/messages
```
**Authentication**: Not required (public access)

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `lastMessageId` (optional): For pagination

**Response:** Same as endpoint #2

#### 8. **Send Papers Message (Mobile Format)**
```http
POST /papers/:paperId/messages
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "This paper provides excellent insights into the topic!",
  "messageType": "text"
}
```

**Response:** Same as endpoint #1

---

## 🔌 **WebSocket Events for Papers Chat**

### **Client → Server Events**

#### Join Papers Chat Room
```javascript
socket.emit('join-papers-chat', {
  paperId: 'paper123',
  userId: 'user456'
});
```

#### Send Papers Message
```javascript
socket.emit('send-papers-message', {
  paperId: 'paper123',
  text: 'Excellent research findings in this paper!',
  messageType: 'text',
  tempId: Date.now()
});
```

#### Papers Typing Indicators
```javascript
// Start typing
socket.emit('papers-typing-start', {
  paperId: 'paper123',
  userName: 'John Doe'
});

// Stop typing
socket.emit('papers-typing-stop', {
  paperId: 'paper123'
});
```

### **Server → Client Events**

#### New Papers Message
```javascript
socket.on('new-papers-message', (message) => {
  console.log('New papers message:', message);
  // Update UI with new message
});
```

#### Papers Message Deleted
```javascript
socket.on('papers-message-deleted', (data) => {
  console.log(`Papers message ${data.messageId} was deleted`);
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

### 2. **Send Message to Papers Chat**
```bash
curl -X POST http://localhost:4000/papers/paper123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "I have a question about this research paper...",
  "messageType": "text"
}'
```

### 3. **Get Papers Chat Messages**
```bash
curl http://localhost:4000/papers/paper123/chat
```

### 4. **Reply to Papers Message**
```bash
curl -X POST http://localhost:4000/papers-chat/MESSAGE_ID/reply \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Here is the answer to your research question...",
  "paperId": "paper123"
}'
```

### 5. **Get Papers Chat Participants**
```bash
curl http://localhost:4000/papers/paper123/chat/participants
```

### 6. **Delete Papers Message**
```bash
curl -X DELETE http://localhost:4000/papers-chat/MESSAGE_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

### 7. **Admin: Get Papers Chat Stats**
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/papers-chat/stats
```

### 8. **Mobile App Format - Get Messages**
```bash
curl http://localhost:4000/papers/paper123/messages
```

### 9. **Mobile App Format - Send Message**
```bash
curl -X POST http://localhost:4000/papers/paper123/messages \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Mobile app message to papers discussion!",
  "messageType": "text"
}'
```

---

## 📱 **Mobile App Integration**

Your React Native app can use either format:

### **Option 1: Original Format**
```javascript
// Get messages
const response = await fetch(`/papers/${paperId}/chat`);

// Send message
const response = await fetch(`/papers/${paperId}/chat`, {
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

// Reply to message
const response = await fetch(`/papers-chat/${messageId}/reply`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: replyText,
    paperId: paperId
  })
});
```

### **Option 2: Mobile Compatible Format**
```javascript
// Get messages
const response = await fetch(`/papers/${paperId}/messages`);

// Send message
const response = await fetch(`/papers/${paperId}/messages`, {
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
✅ **Academic focus** - perfect for research paper discussions  

---

## 🔬 **Papers Chat Use Cases**

📚 **Research Discussion** - Discuss research methodologies and findings  
📝 **Assignment Help** - Get help with paper-based assignments  
🤔 **Question & Answer** - Ask questions about complex academic content  
👥 **Peer Review** - Collaborate on paper reviews and feedback  
📖 **Study Groups** - Form study groups around specific papers  
🎓 **Academic Debates** - Engage in scholarly discussions  

---

## 🚀 **Total: 8 Papers Chat Endpoints**

Your Papers Chat system now has **complete API coverage** with both original and mobile-compatible endpoint formats, perfect for academic discussions and research collaboration! 📄💬✨

---

## 🆘 **Troubleshooting Your Error**

The error you mentioned: `"Reply text is required"` means your mobile app is sending empty text. Make sure to:

1. **Check text field**: Ensure `text` is not empty before sending
2. **Use correct endpoint**: For papers replies, use `/papers-chat/:messageId/reply`
3. **Include paperId**: Make sure to include `paperId` in request body
4. **Validate input**: Check that `text.trim().length > 0`

**Debug your mobile app:**
```javascript
console.log('Sending reply:', {
  text: replyText,
  paperId: paperId,
  isTextEmpty: !replyText || replyText.trim().length === 0
});
```

## ✅ **Username Display Fixed**

**Papers chat now displays usernames consistently:**
- ✅ **Before**: Showed email prefixes (e.g., "john" from "john@example.com")
- ✅ **After**: Shows actual usernames (same as notes & videos chat)
- 🔄 **Implementation**: Fetches user data from Firebase like other chat systems
- 📱 **Compatibility**: Works for both web and mobile endpoints