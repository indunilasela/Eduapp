# 🚀 EduApp Backend - Complete API Endpoints Reference

## 📊 **API Overview**
- **Base URL**: `http://localhost:4000`
- **Authentication**: JWT Bearer Token
- **Response Format**: JSON
- **Total Endpoints**: 30+

---

## 🔐 **Authentication Endpoints**

### **1. User Registration**
```http
POST /auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

### **2. User Login**
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### **3. Password Reset Request**
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### **4. Get User Profile**
```http
GET /auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

### **5. Get Username**
```http
GET /auth/username
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 💬 **Chat System Endpoints**

### **6. Send Papers Chat Message**
```http
POST /papers-chat/send
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Hello everyone!",
  "paperId": "paper123"
}
```

### **7. Get Papers Chat Messages**
```http
GET /papers-chat/messages/{paperId}?page=1&limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

### **8. Send Reference Links Message**
```http
POST /reference-links-chat/send
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Check this helpful link",
  "referenceLinkId": "ref123"
}
```

### **9. Get Reference Links Messages**
```http
GET /reference-links-chat/messages/{referenceLinkId}?page=1&limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 **Answer Management Endpoints**

### **10. Create Answer**
```http
POST /api/papers/{paperId}/answers
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- title: "Complete Solution Guide"
- content: "Detailed explanation of the solution..."
- tags: "math,calculus,integration"
- attachments: [File1, File2] (optional)
```

### **11. Get Paper Answers**
```http
GET /api/papers/{paperId}/answers?sortBy=votes&page=1&limit=10
```
**Query Parameters:**
- `sortBy`: `votes`, `newest`, `oldest` (default: `votes`)
- `page`: Page number (default: 1)
- `limit`: Answers per page (default: 10)

### **12. Get Specific Answer**
```http
GET /api/answers/{answerId}
```

### **13. Vote on Answer**
```http
POST /api/answers/{answerId}/vote
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "voteType": "upvote"  // or "downvote"
}
```

### **14. Delete Answer**
```http
DELETE /api/answers/{answerId}
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 💬 **Comment Management Endpoints**

### **15. Add Comment to Answer**
```http
POST /api/answers/{answerId}/comments
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "content": "Great explanation! Thanks for sharing."
}
```

### **16. Get Answer Comments**
```http
GET /api/answers/{answerId}/comments?page=1&limit=20
```

### **17. Delete Comment**
```http
DELETE /api/comments/{commentId}
Authorization: Bearer YOUR_JWT_TOKEN
```

### **18. Vote on Comment**
```http
POST /api/comments/{commentId}/vote
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "voteType": "upvote"  // or "downvote"
}
```

---

## 📎 **File Management Endpoints**

### **19. Download Attachment**
```http
GET /api/attachments/{attachmentId}/download
```

### **20. Upload File (Part of Create Answer)**
- **File Types**: PDF, DOC, DOCX, TXT, JPG, PNG, etc.
- **Max Size**: 10MB per file
- **Max Files**: 10 files per answer

---

## 🏥 **System Health Endpoints**

### **21. Add Answer Health Check**
```http
GET /api/add-answer/health
```

### **22. Main System Health**
```http
GET /health
```

---

## 📊 **Response Format Examples**

### **Success Response Structure**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### **Error Response Structure**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### **Pagination Response**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

---

## 🔑 **Authentication Headers**

### **Required for Protected Endpoints**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### **For File Uploads**
```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

---

## 📱 **Mobile App Integration Examples**

### **React Native Service Functions**

```javascript
const API_BASE_URL = 'http://localhost:4000';

// Authentication Service
const authService = {
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  
  signin: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }
};

// Answer Service
const answerService = {
  createAnswer: async (paperId, answerData, token) => {
    const formData = new FormData();
    formData.append('title', answerData.title);
    formData.append('content', answerData.content);
    formData.append('tags', answerData.tags);
    
    // Add files if any
    answerData.attachments?.forEach((file, index) => {
      formData.append('attachments', file);
    });
    
    const response = await fetch(`${API_BASE_URL}/api/papers/${paperId}/answers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return response.json();
  },
  
  getAnswers: async (paperId, sortBy = 'votes', page = 1) => {
    const response = await fetch(
      `${API_BASE_URL}/api/papers/${paperId}/answers?sortBy=${sortBy}&page=${page}`
    );
    return response.json();
  },
  
  voteAnswer: async (answerId, voteType, token) => {
    const response = await fetch(`${API_BASE_URL}/api/answers/${answerId}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ voteType })
    });
    return response.json();
  }
};

// Comment Service
const commentService = {
  addComment: async (answerId, content, token) => {
    const response = await fetch(`${API_BASE_URL}/api/answers/${answerId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    return response.json();
  },
  
  getComments: async (answerId, page = 1) => {
    const response = await fetch(
      `${API_BASE_URL}/api/answers/${answerId}/comments?page=${page}`
    );
    return response.json();
  }
};

// Chat Service
const chatService = {
  sendPapersMessage: async (paperId, message, token) => {
    const response = await fetch(`${API_BASE_URL}/papers-chat/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, paperId })
    });
    return response.json();
  },
  
  getPapersMessages: async (paperId, page = 1, token) => {
    const response = await fetch(
      `${API_BASE_URL}/papers-chat/messages/${paperId}?page=${page}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    return response.json();
  }
};
```

---

## 🛡️ **Security & Permissions**

### **Public Endpoints (No Auth Required)**
- GET `/api/papers/{paperId}/answers`
- GET `/api/answers/{answerId}`
- GET `/api/answers/{answerId}/comments`
- GET `/api/attachments/{attachmentId}/download`
- GET `/health`
- GET `/api/add-answer/health`

### **Protected Endpoints (Auth Required)**
- All POST, PUT, DELETE operations
- All chat endpoints
- User profile endpoints
- Voting endpoints

### **Admin-Only Operations**
- Delete any answer or comment
- Access admin controls
- System management

---

## 🔄 **Real-time Features (Socket.IO)**

### **WebSocket Events**

```javascript
// Client-side Socket.IO integration
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

// Join paper chat room
socket.emit('join-paper-chat', paperId);

// Listen for new messages
socket.on('new-paper-message', (message) => {
  // Update UI with new message
});

// Join reference links chat
socket.emit('join-reference-chat', referenceLinkId);

// Listen for reference messages
socket.on('new-reference-message', (message) => {
  // Update UI with new message
});
```

---

## 📊 **Status Codes**

### **Success Codes**
- `200` - OK (GET, PUT, DELETE)
- `201` - Created (POST)
- `204` - No Content (DELETE success)

### **Error Codes**
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (No token)
- `403` - Forbidden (No permission)
- `404` - Not Found (Resource doesn't exist)
- `500` - Internal Server Error

---

## 🧪 **Testing Endpoints**

### **Using Postman/Curl**

```bash
# Test authentication
curl -X POST http://localhost:4000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test getting answers
curl -X GET "http://localhost:4000/api/papers/paper123/answers?sortBy=votes&page=1"

# Test creating answer (with auth)
curl -X POST http://localhost:4000/api/papers/paper123/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Answer" \
  -F "content=This is a test answer with detailed explanation" \
  -F "tags=test,api"

# Test voting
curl -X POST http://localhost:4000/api/answers/answer123/vote \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"voteType":"upvote"}'
```

---

## 🔧 **Environment Configuration**

### **Required Environment Variables**
```env
PORT=4000
JWT_SECRET=your-super-secret-jwt-key
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## 📈 **Performance Tips**

### **Pagination**
- Use `page` and `limit` parameters for large datasets
- Default limits: Answers (10), Comments (20), Messages (50)

### **Caching**
- Implement client-side caching for frequently accessed data
- Cache user profiles and static content

### **File Uploads**
- Compress images before upload
- Use appropriate file formats
- Monitor upload progress

---

## 🚀 **API Versioning**
- Current Version: `v1`
- Endpoint Pattern: `/api/v1/...` (future versions)
- Backward Compatibility: Maintained for major versions

---

## ✅ **Complete Endpoint Summary**

### **Authentication (5 endpoints)**
- Signup, Signin, Password Reset, Profile, Username

### **Chat System (4 endpoints)**
- Papers Chat (Send/Get), Reference Links Chat (Send/Get)

### **Answer Management (5 endpoints)**
- Create, Get List, Get Single, Vote, Delete

### **Comment Management (4 endpoints)**
- Add, Get List, Delete, Vote

### **File Management (1 endpoint)**
- Download Attachments

### **System Health (2 endpoints)**
- Add Answer Health, Main System Health

### **Real-time (Socket.IO)**
- Paper Chat Events, Reference Chat Events

**Total: 21+ HTTP Endpoints + Real-time Events**

Your EduApp backend provides a complete Stack Overflow-style Q&A platform with real-time chat capabilities! 🎉