# Notes Chat System - Quick Test Guide

## Test Setup
Your backend server is already running on http://localhost:4000

## Notes Chat Test Steps

### 1. First, get a valid JWT token by logging in
```bash
# POST request to signin (correct endpoint)
curl -X POST http://localhost:4000/auth/signin \
-H "Content-Type: application/json" \
-d '{"email":"your_email@example.com","password":"your_password"}'

# PowerShell version:
Invoke-RestMethod -Uri "http://localhost:4000/auth/signin" -Method POST -ContentType "application/json" -Body '{"email":"your_email@example.com","password":"your_password"}'
```

### 2. Send a message to notes chat (replace YOUR_TOKEN with actual JWT)
```bash
curl -X POST http://localhost:4000/notes/notes123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Hello! This is my first message in the notes chat.",
  "messageType": "text"
}'
```

### 3. Send another message to notes chat
```bash
curl -X POST http://localhost:4000/notes/notes123/chat \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Great notes! I have a question about the conclusion.",
  "messageType": "text"
}'
```

### 4. Get all messages for notes chat
```bash
curl http://localhost:4000/notes/notes123/chat

# PowerShell version:
Invoke-RestMethod -Uri "http://localhost:4000/notes/notes123/chat" -Method GET
```

### 5. Reply to a message (replace MESSAGE_ID with actual message ID)
```bash
curl -X POST http://localhost:4000/notes-chat/MESSAGE_ID/reply \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "text": "Thanks for the clarification!",
  "notesId": "notes123"
}'
```

### 6. Get notes chat participants
```bash
curl http://localhost:4000/notes/notes123/chat/participants
```

### 7. Delete a message (replace MESSAGE_ID with actual message ID)
```bash
curl -X DELETE http://localhost:4000/notes-chat/MESSAGE_ID \
-H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Admin: Get notes chat statistics (admin token required)
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/notes-chat/stats
```

## Expected Behavior

1. **Send Message**: Message created with status "Notes chat message sent successfully"
2. **Get Messages**: Returns array of messages in chronological order
3. **Notes-Specific**: Messages are specific to each notes page
4. **Reply System**: Creates message with replyTo object containing original message info
5. **Participants**: Shows users who have sent messages in the notes chat
6. **Delete Permission**: Users can delete own messages, admins can delete any
7. **Admin Stats**: Comprehensive analytics for notes chat usage

## Notes Chat System Features

✅ **Real-time Messaging**: Send and receive messages instantly for notes  
✅ **Notes-Specific Chats**: Separate discussion for each notes page  
✅ **Reply Functionality**: WhatsApp-like reply system  
✅ **Admin Controls**: Delete any message, view statistics  
✅ **Permission System**: Users manage own messages  
✅ **Participant Tracking**: See who's active in notes discussions  
✅ **Message Analytics**: Track engagement and activity  
✅ **Public Access**: Anyone can view messages (no auth required for reading)  
✅ **Send/Delete Auth**: Authentication required only for sending and deleting  

## Database Collection

### notesChatMessages Collection
```javascript
{
  id: "timestamp_randomId",
  notesId: "notes123", // The specific notes page ID
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

## Key Differences from Subject Chat

| Feature | Subject Chat | Notes Chat |
|---------|-------------|------------|
| **Collection** | `chatMessages` | `notesChatMessages` |
| **ID Field** | `subjectId` | `notesId` |
| **WebSocket Room** | `subject_${subjectId}` | `notes_${notesId}` |
| **WebSocket Event** | `new-message` | `new-notes-message` |
| **Delete Event** | `message-deleted` | `notes-message-deleted` |
| **Admin Stats URL** | `/admin/chat/stats` | `/admin/notes-chat/stats` |
| **Reply Endpoint** | `/chat/:messageId/reply` | `/notes-chat/:messageId/reply` |

## API Endpoints Summary

### Notes Chat Endpoints
```
POST   /notes/:notesId/chat                    # Send message
GET    /notes/:notesId/chat                    # Get messages
GET    /notes/:notesId/chat/participants       # Get participants
POST   /notes-chat/:messageId/reply            # Reply to message
DELETE /notes-chat/:messageId                  # Delete message
GET    /admin/notes-chat/stats                 # Admin statistics
```

### WebSocket Events
```javascript
// Join notes chat room
socket.emit('join-notes-chat', { notesId: 'notes123' });

// Listen for new messages
socket.on('new-notes-message', (message) => {
  console.log('New notes message:', message);
});

// Listen for deleted messages
socket.on('notes-message-deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

## Frontend Integration Ready

### React/React Native Components
- **NotesChatInput**: Send messages specific to notes page
- **NotesMessageList**: Display notes-specific messages
- **NotesReplyBox**: Quote and reply to specific notes messages
- **NotesParticipantsList**: Show active users in notes chat
- **NotesAdminDashboard**: Monitor notes chat activity

### Mobile App Integration
```javascript
// Join notes chat when user opens notes page
const joinNotesChat = (notesId) => {
  socket.emit('join-notes-chat', { notesId });
};

// Send message to notes chat
const sendNotesMessage = async (notesId, message) => {
  const response = await fetch(`/notes/${notesId}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: message,
      messageType: 'text'
    })
  });
  return response.json();
};

// Get notes messages
const getNotesMessages = async (notesId) => {
  const response = await fetch(`/notes/${notesId}/chat`);
  return response.json();
};
```

## Usage Scenarios

### 1. Study Notes Discussion
Students can discuss specific study notes, ask questions, and share insights about particular topics covered in the notes.

### 2. Collaborative Learning
Multiple users can collaborate on understanding complex concepts explained in the notes through real-time chat.

### 3. Q&A Sessions
Students can ask questions about specific sections of notes and get answers from peers or instructors.

### 4. Note Corrections
Users can point out errors or suggest improvements to the notes content through chat discussions.

## Security Features

- **Authentication Required**: Only for sending messages and deleting
- **Public Reading**: Anyone can view messages (great for open learning)
- **Admin Moderation**: Admins can delete inappropriate messages
- **User Privacy**: Users can delete their own messages
- **Rate Limiting**: Built-in message length limits (1000 chars)

## Real-time Features

- **Instant Messaging**: Messages appear immediately via WebSocket
- **Live Participants**: See who's active in notes discussions
- **Real-time Replies**: Immediate reply notifications
- **Message Deletion**: Live deletion updates

The notes chat system is now fully operational and ready for your educational platform! 📝💬🎉

## Integration with Existing Chat

Both systems work independently:
- **Subject Chat**: For general subject discussions
- **Notes Chat**: For specific notes page discussions

Users can participate in both simultaneously, making your platform more interactive and engaging for collaborative learning! 🚀