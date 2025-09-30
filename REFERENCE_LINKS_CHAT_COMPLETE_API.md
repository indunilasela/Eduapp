# 🔗 Reference Links Chat System - Complete API Reference

## 🎯 Overview
The **Reference Links Chat System** allows users to discuss and ask questions about specific reference links in real-time. Each reference link has its own dedicated chat room for focused discussions about educational resources, research materials, and reference documents.

## 📊 Database Collection
- **Collection**: `referenceLinksChatMessages`
- **Document Structure**: Same as other chat systems with `referenceLinkId` field
- **Username Display**: Shows actual usernames (consistent with other chat systems)

## 📡 **ALL REFERENCE LINKS CHAT ENDPOINTS**

### **🔵 Original Reference Links Chat Endpoints**

#### 1. **Send Message to Reference Links Chat**
```http
POST /references/:referenceLinkId/chat
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "This reference link is very helpful for understanding the topic...",
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
    "referenceLinkId": "reference123",
    "senderId": "user456",
    "senderName": "John Doe",
    "text": "This reference link is very helpful for understanding the topic...",
    "messageType": "text",
    "replyTo": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Reference links chat message sent successfully"
}
```

#### 2. **Get Reference Links Chat Messages**
```http
GET /references/:referenceLinkId/chat
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
      "referenceLinkId": "reference123",
      "senderId": "user456",
      "senderName": "John Doe",
      "text": "This reference link is very helpful for understanding the topic...",
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

#### 3. **Reply to Reference Links Chat Message**
```http
POST /references-chat/:messageId/reply
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "I agree! This link helped me understand the concept better...",
  "referenceLinkId": "reference123"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "replyId456",
  "message": {
    "id": "replyId456",
    "referenceLinkId": "reference123",
    "senderId": "user789",
    "senderName": "Jane Smith",
    "text": "I agree! This link helped me understand the concept better...",
    "messageType": "reply",
    "replyTo": {
      "messageId": "messageId123",
      "originalText": "This reference link is very helpful for understanding the topic...",
      "originalSenderName": "John Doe",
      "originalSenderId": "user456"
    },
    "createdAt": "2024-01-01T12:05:00.000Z",
    "isDeleted": false,
    "reactions": {}
  },
  "status": "Reference links chat message sent successfully"
}
```

#### 4. **Get Reference Links Chat Participants**
```http
GET /references/:referenceLinkId/chat/participants
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
      "messageCount": 5,
      "lastMessageAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "userId": "user789",
      "name": "Jane Smith", 
      "messageCount": 3,
      "lastMessageAt": "2024-01-01T12:05:00.000Z"
    }
  ],
  "totalParticipants": 2
}
```

#### 5. **Delete Reference Links Chat Message**
```http
DELETE /references-chat/:messageId
```
**Authentication**: Required (Bearer token)

**Permissions**: Own messages or admin only

**Response:**
```json
{
  "success": true,
  "status": "Reference links chat message deleted successfully"
}
```

#### 6. **Admin: Get Reference Links Chat Statistics**
```http
GET /admin/references-chat/stats
```
**Authentication**: Required (Admin Bearer token)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalMessages": 187,
    "totalActiveUsers": 45,
    "totalReferenceLinksWithMessages": 23,
    "messagesLast24h": 15,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### **🟢 Mobile App Compatible Endpoints**

#### 7. **Get Reference Links Messages (Mobile Format)**
```http
GET /references/:referenceLinkId/messages
```
**Authentication**: Not required (public access)

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `lastMessageId` (optional): For pagination

**Response:** Same as endpoint #2

#### 8. **Send Reference Links Message (Mobile Format)**
```http
POST /references/:referenceLinkId/messages
```
**Authentication**: Required (Bearer token)

**Request Body:**
```json
{
  "text": "This reference provides excellent information about the subject!",
  "messageType": "text"
}
```

**Response:** Same as endpoint #1

---

## 🔌 **WebSocket Events for Reference Links Chat**

### **Client → Server Events**

#### Join Reference Links Chat Room
```javascript
socket.emit('join-reference-chat', {
  referenceLinkId: 'reference123',
  userId: 'user456'
});
```

#### Send Reference Links Message
```javascript
socket.emit('send-reference-message', {
  referenceLinkId: 'reference123',
  text: 'Great reference link! Very informative.',
  messageType: 'text',
  userId: 'user456',
  userName: 'John Doe',
  tempId: Date.now()
});
```

#### Reference Links Typing Indicators
```javascript
// Start typing
socket.emit('reference-typing-start', {
  referenceLinkId: 'reference123',
  userName: 'John Doe'
});

// Stop typing
socket.emit('reference-typing-stop', {
  referenceLinkId: 'reference123'
});
```

### **Server → Client Events**

#### New Reference Links Message
```javascript
socket.on('new-reference-message', (message) => {
  console.log('New reference links message:', message);
  // Update UI with new message
});
```

#### Reference Links Message Deleted
```javascript
socket.on('reference-message-deleted', (data) => {
  console.log(`Reference links message ${data.messageId} was deleted`);
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

### 2. **Send Message to Reference Links Chat**
```bash
curl -X POST http://localhost:4000/references/reference123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "This reference link is excellent for research...",
  "messageType": "text"
}'
```

### 3. **Get Reference Links Chat Messages**
```bash
curl http://localhost:4000/references/reference123/chat
```

### 4. **Reply to Reference Links Message**
```bash
curl -X POST http://localhost:4000/references-chat/MESSAGE_ID/reply \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "I found this reference very useful too...",
  "referenceLinkId": "reference123"
}'
```

### 5. **Get Reference Links Chat Participants**
```bash
curl http://localhost:4000/references/reference123/chat/participants
```

### 6. **Delete Reference Links Message**
```bash
curl -X DELETE http://localhost:4000/references-chat/MESSAGE_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

### 7. **Admin: Get Reference Links Chat Stats**
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/references-chat/stats
```

### 8. **Mobile App Format - Get Messages**
```bash
curl http://localhost:4000/references/reference123/messages
```

### 9. **Mobile App Format - Send Message**
```bash
curl -X POST http://localhost:4000/references/reference123/messages \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Mobile app message about this reference!",
  "messageType": "text"
}'
```

---

## 📱 **Mobile App Integration**

Your React Native app can use either format:

### **Option 1: Original Format**
```javascript
// Get messages
const response = await fetch(`/references/${referenceLinkId}/chat`);

// Send message
const response = await fetch(`/references/${referenceLinkId}/chat`, {
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
const response = await fetch(`/references-chat/${messageId}/reply`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: replyText,
    referenceLinkId: referenceLinkId
  })
});
```

### **Option 2: Mobile Compatible Format**
```javascript
// Get messages
const response = await fetch(`/references/${referenceLinkId}/messages`);

// Send message
const response = await fetch(`/references/${referenceLinkId}/messages`, {
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
✅ **Educational focus** - perfect for reference link discussions  
✅ **Username display** - consistent with other chat systems  

---

## 🔬 **Reference Links Chat Use Cases**

📚 **Resource Discussion** - Discuss the value and content of reference materials  
📝 **Research Help** - Get help understanding complex reference documents  
🤔 **Question & Answer** - Ask questions about specific reference content  
👥 **Peer Review** - Share opinions and reviews about reference quality  
📖 **Study Groups** - Form study groups around specific reference materials  
🎓 **Academic Collaboration** - Collaborate on research using reference links  

---

## 🚀 **Total: 8 Reference Links Chat Endpoints**

Your Reference Links Chat system now has **complete API coverage** with both original and mobile-compatible endpoint formats, perfect for educational discussions about reference materials and research resources! 🔗💬✨

---

## 🆘 **System Integration**

The Reference Links Chat system is **fully integrated** with your existing chat ecosystem:

### **🎉 Complete Chat System Coverage:**
1. **📚 Subject Chat** - General subject discussions
2. **📄 Papers Chat** - Paper-specific discussions  
3. **📝 Notes Chat** - Note-specific discussions
4. **🎥 Videos Chat** - Video-specific discussions
5. **🔗 Reference Links Chat** - Reference link discussions ✨ **NEW!**

### **🔧 Technical Consistency:**
- ✅ Same authentication system across all chats
- ✅ Consistent username display (no email prefixes)
- ✅ Same permission model (users delete own, admins delete any)
- ✅ Same real-time WebSocket architecture
- ✅ Same mobile app compatibility
- ✅ Same admin statistics and monitoring

**Your educational platform now has comprehensive chat coverage for all types of educational content!** 🎓💬🚀
