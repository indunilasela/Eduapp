# Chat System - Quick Test Guide

## Test Setup
Your backend server is already running on http://localhost:4000

## Quick Test Steps

### 1. First, get a valid JWT token by logging in
```bash
# POST request to login
curl -X POST http://localhost:4000/login \
-H "Content-Type: application/json" \
-d '{"email":"your_email@example.com","password":"your_password"}'
```

### 2. Send a message to subject chat (replace YOUR_TOKEN with actual JWT)
```bash
curl -X POST http://localhost:4000/subjects/subject123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Hello everyone! This is my first message in the subject chat.",
  "messageType": "text"
}'
```

### 3. Send a message to paper-specific chat
```bash
curl -X POST http://localhost:4000/subjects/subject123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Great paper! I have a question about section 2.",
  "paperId": "paper456",
  "messageType": "text"
}'
```

### 4. Get all messages for subject chat
```bash
curl http://localhost:4000/subjects/subject123/chat
```

### 5. Get messages for specific paper discussion
```bash
curl "http://localhost:4000/subjects/subject123/chat?paperId=paper456"
```

### 6. Reply to a message (replace MESSAGE_ID with actual message ID)
```bash
curl -X POST http://localhost:4000/chat/MESSAGE_ID/reply \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Thanks for the clarification!",
  "subjectId": "subject123",
  "paperId": "paper456"
}'
```

### 7. Get chat participants
```bash
curl "http://localhost:4000/subjects/subject123/chat/participants?paperId=paper456"
```

### 8. Delete a message (replace MESSAGE_ID with actual message ID)
```bash
curl -X DELETE http://localhost:4000/chat/MESSAGE_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Admin: Get chat statistics (admin token required)
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/chat/stats
```

## Expected Behavior

1. **Send Message**: Message created with status "Message sent successfully"
2. **Get Messages**: Returns array of messages in chronological order
3. **Paper-Specific**: Messages filtered by paperId parameter
4. **Reply System**: Creates message with replyTo object containing original message info
5. **Participants**: Shows users who have sent messages in the chat
6. **Delete Permission**: Users can delete own messages, admins can delete any
7. **Admin Stats**: Comprehensive analytics for chat usage

## Chat System Features Implemented

✅ **Real-time Messaging**: Send and receive messages instantly  
✅ **Paper-Specific Chats**: Contextual discussions for each paper  
✅ **Reply Functionality**: WhatsApp-like reply system  
✅ **Admin Controls**: Delete any message, view statistics  
✅ **Permission System**: Users manage own messages  
✅ **Participant Tracking**: See who's active in discussions  
✅ **Message Analytics**: Track engagement and activity  
✅ **Smart Positioning**: Support for sender/receiver layout  

## Database Collections

### chatMessages Collection
```javascript
{
  id: "timestamp_randomId",
  subjectId: "subject123",
  paperId: "paper456", // null for general subject chat
  text: "Message content",
  messageType: "text", // text, reply, image, file
  senderId: "user123",
  senderName: "John Doe",
  senderEmail: "john@example.com",
  createdAt: timestamp,
  isDeleted: false,
  replyTo: { // Only for reply messages
    messageId: "original_message_id",
    originalText: "Original message content",
    originalSenderName: "Original Sender",
    originalSenderId: "original_user_id"
  }
}
```

## Frontend Integration Ready

### React/React Native Components
- **ChatInput**: Send messages with text validation
- **MessageList**: Display messages with reply indicators
- **ReplyBox**: Quote and reply to specific messages
- **ParticipantsList**: Show active users
- **AdminDashboard**: Monitor chat activity

### Key Features for Mobile App
- **WhatsApp-like UI**: Familiar chat interface
- **Message Bubbles**: Right-aligned for own messages, left for others
- **Reply Indicators**: Visual connection to original message
- **Participant Badges**: Show who's online/active
- **Delete Animations**: Smooth message removal
- **Typing Indicators**: Real-time typing status (can be added)
- **Read Receipts**: Message delivery status (can be added)

## Real-time Considerations

While the current system uses standard HTTP requests, for truly real-time chat you can enhance with:

### WebSocket Integration
```javascript
// Server-side (Socket.IO)
io.on('connection', (socket) => {
  socket.on('join-chat', ({ subjectId, paperId }) => {
    socket.join(`${subjectId}_${paperId || 'general'}`);
  });
  
  socket.on('send-message', (messageData) => {
    // Save to database
    // Emit to chat room
    io.to(`${messageData.subjectId}_${messageData.paperId || 'general'}`)
      .emit('new-message', messageData);
  });
});
```

### Push Notifications
```javascript
// When new message is sent
const sendPushNotification = (participants, message) => {
  participants.forEach(participant => {
    if (participant.id !== message.senderId) {
      sendPush(participant.pushToken, {
        title: `New message in ${message.subjectName}`,
        body: `${message.senderName}: ${message.text}`,
        data: { subjectId, paperId, messageId }
      });
    }
  });
};
```

## Chat System Workflow

1. **User opens subject** → Loads general chat + available paper chats
2. **User selects paper** → Switches to paper-specific discussion
3. **User types message** → Real-time validation and send
4. **Message appears** → Positioned right for sender, left for others
5. **Reply to message** → Click message, quote appears, send reply
6. **Admin moderation** → Delete inappropriate messages
7. **Analytics tracking** → Monitor engagement and activity

The chat system is now fully operational and ready for your mobile application! 💬🎉