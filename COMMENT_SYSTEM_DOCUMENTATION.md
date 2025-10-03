# 💬 Comment Management System - Complete Documentation

## 🎯 **New Comment Endpoints Added**

Your Add Answer system now includes a complete comment management system with 4 new endpoints:

1. **POST** `/api/answers/:answerId/comments` - Add comment to answer
2. **GET** `/api/answers/:answerId/comments` - Get answer comments
3. **DELETE** `/api/comments/:commentId` - Delete comment
4. **POST** `/api/comments/:commentId/vote` - Vote on comment

---

## 📝 **1. Add Comment to Answer**

### **POST** `/api/answers/:answerId/comments`

Adds a new comment to a specific answer.

**Authentication**: Required (JWT Token)

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**URL Parameters**:
- `answerId` (string): The ID of the answer to comment on

**Request Body**:
```json
{
  "content": "This is a helpful comment on the answer"
}
```

**Validation Rules**:
- `content`: Required, 5-500 characters
- Cannot comment on deleted answers
- Must be authenticated user

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": "comment_1727890123456_abc123def",
    "answerId": "answer_1727890123456_abc123def",
    "userId": "user123",
    "userName": "John Doe",
    "content": "This is a helpful comment on the answer",
    "upvotes": 0,
    "downvotes": 0,
    "totalVotes": 0,
    "createdAt": "2025-10-03T12:00:00.000Z",
    "updatedAt": "2025-10-03T12:00:00.000Z",
    "isDeleted": false
  }
}
```

**Error Responses**:
```json
// Content too short
{
  "success": false,
  "message": "Comment must be at least 5 characters long"
}

// Answer not found
{
  "success": false,
  "message": "Answer not found"
}

// Deleted answer
{
  "success": false,
  "message": "Cannot comment on deleted answer"
}
```

---

## 📋 **2. Get Answer Comments**

### **GET** `/api/answers/:answerId/comments`

Retrieves all comments for a specific answer with pagination.

**Authentication**: Optional

**URL Parameters**:
- `answerId` (string): The ID of the answer

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Comments per page (default: 20)

**Example URL**:
```
GET /api/answers/answer_123/comments?page=1&limit=10
```

**Success Response (200)** ✨ **UPDATED**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment_1727890123456_abc123def",
        "commentId": "comment_1727890123456_abc123def",
        "answerId": "answer_1727890123456_abc123def",
        "userId": "user123",
        "userName": "John Doe",
        "content": "This is a helpful comment",
        "upvotes": 5,
        "downvotes": 1,
        "totalVotes": 4,
        "userVote": "upvote",  // ✨ NEW: null, "upvote", or "downvote"
        "createdAt": "2025-10-03T12:00:00.000Z",
        "updatedAt": "2025-10-03T12:05:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalComments": 15,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### 🎨 **New userVote Property**:
- **null**: User hasn't voted on this comment
- **"upvote"**: User has upvoted this comment  
- **"downvote"**: User has downvoted this comment
- **Token Required**: Include Authorization header to get user vote status
- **No Token**: userVote will be null for all comments

---

## 🗑️ **3. Delete Comment**

### **DELETE** `/api/comments/:commentId`

Deletes a specific comment. Only comment creator or admin can delete.

**Authentication**: Required (JWT Token)

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**URL Parameters**:
- `commentId` (string): The ID of the comment to delete

**Authorization Rules**:
- **Comment Creator**: Can delete their own comments
- **Admin Users**: Can delete any comment (email contains "admin")

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": {
    "commentId": "comment_1727890123456_abc123def",
    "deletedBy": "creator",  // or "admin"
    "deletedAt": "2025-10-03T12:30:00.000Z"
  }
}
```

**Error Responses**:
```json
// Access denied
{
  "success": false,
  "message": "Access denied. You can only delete your own comments or you must be an admin."
}

// Comment not found
{
  "success": false,
  "message": "Comment not found"
}
```

---

## 🗳️ **4. Vote on Comment**

### **POST** `/api/comments/:commentId/vote` ✨ **UPDATED**

Votes on a comment (upvote or downvote).

**Authentication**: Required (JWT Token)

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**URL Parameters**:
- `commentId` (string): The ID of the comment to vote on

**Request Body**:
```json
{
  "voteType": "upvote"    // or "downvote"
}
```

**Vote Behavior** ✨ **UPDATED**:
- **New Vote**: Adds vote and updates counts
- **Same Vote**: Ignored (no change, returns success with alreadyVoted flag)
- **Different Vote**: Changes vote type (upvote ↔ downvote)
- **Own Comment**: Not allowed

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Comment upvoted successfully",
  "data": {
    "voteType": "upvote",
    "upvotes": 6,
    "downvotes": 1,
    "totalVotes": 5
  }
}
```

**Duplicate Vote Response (200)** ✨ **NEW**:
```json
{
  "success": true,
  "message": "Comment already upvoted",
  "data": {
    "voteType": "upvote",
    "upvotes": 6,
    "downvotes": 1,
    "totalVotes": 5,
    "alreadyVoted": true  // Indicates duplicate vote was ignored
  }
}
```

**Error Responses**:
```json
// Own comment
{
  "success": false,
  "message": "You cannot vote on your own comment"
}

// Invalid vote type
{
  "success": false,
  "message": "Vote type must be \"upvote\" or \"downvote\""
}
```

---

## 📱 **Mobile App Integration**

### **Complete Comment Service (React Native)**:

```javascript
// Comment Service Functions
const commentService = {
  
  // Add comment to answer
  addComment: async (answerId, content, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/answers/${answerId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
  
  // Get comments for answer
  getComments: async (answerId, page = 1, limit = 20) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/answers/${answerId}/comments?page=${page}&limit=${limit}`
      );
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },
  
  // Delete comment
  deleteComment: async (commentId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
  
  // Vote on comment
  voteComment: async (commentId, voteType, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voteType })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  }
};
```

### **Usage Examples**:

```javascript
// Add comment
const handleAddComment = async () => {
  try {
    const result = await commentService.addComment(
      answerId, 
      commentText, 
      userToken
    );
    
    if (result.success) {
      // Refresh comments
      const updatedComments = await commentService.getComments(answerId);
      setComments(updatedComments.data.comments);
      setCommentText('');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to add comment');
  }
};

// Delete comment with confirmation
const handleDeleteComment = async (commentId) => {
  Alert.alert(
    'Delete Comment',
    'Are you sure you want to delete this comment?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await commentService.deleteComment(commentId, userToken);
            if (result.success) {
              // Remove from UI
              setComments(comments.filter(c => c.id !== commentId));
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        }
      }
    ]
  );
};

// Vote on comment
const handleVoteComment = async (commentId, voteType) => {
  try {
    const result = await commentService.voteComment(commentId, voteType, userToken);
    
    if (result.success) {
      // Update comment votes in UI
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, ...result.data }
          : comment
      ));
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to vote on comment');
  }
};
```

---

## 🗄️ **Database Schema**

### **Collection: `answerComments`**
```javascript
{
  id: "comment_1727890123456_abc123def",
  answerId: "answer_1727890123456_abc123def",
  userId: "user123",
  userName: "John Doe",
  content: "This is a helpful comment",
  upvotes: 5,
  downvotes: 1,
  totalVotes: 4,
  createdAt: "2025-10-03T12:00:00.000Z",
  updatedAt: "2025-10-03T12:05:00.000Z",
  isDeleted: false,
  deletedAt: null,
  deletedBy: null
}
```

### **Collection: `commentVotes`**
```javascript
{
  id: "vote_comment_1727890123456_abc123def_user123",
  commentId: "comment_1727890123456_abc123def",
  userId: "user123",
  voteType: "upvote", // or "downvote"
  createdAt: "2025-10-03T12:05:00.000Z",
  updatedAt: "2025-10-03T12:10:00.000Z"
}
```

---

## 🔄 **Comment Count Updates**

Comments automatically update the answer's `commentsCount`:

- **Add Comment**: Increments count by 1
- **Delete Comment**: Decrements count by 1
- **Soft Delete**: Maintains data integrity

```javascript
// Answer document update
{
  commentsCount: 5,  // Updated automatically
  updatedAt: "2025-10-03T12:00:00.000Z"
}
```

---

## 🛡️ **Security Features**

- ✅ **JWT Authentication**: Required for write operations
- ✅ **Input Validation**: Content length and format checks
- ✅ **Authorization**: Creator/admin permissions for deletion
- ✅ **Soft Delete**: Preserves comment history
- ✅ **Vote Validation**: Prevents self-voting and manipulation
- ✅ **Content Sanitization**: Trims whitespace and validates input

---

## 🚀 **Complete API Endpoints List**

Your Add Answer system now includes **11 total endpoints**:

### **Answer Management**:
1. **POST** `/api/papers/:paperId/answers` - Create answer
2. **GET** `/api/papers/:paperId/answers` - Get answers
3. **GET** `/api/answers/:answerId` - Get specific answer
4. **POST** `/api/answers/:answerId/vote` - Vote on answer
5. **DELETE** `/api/answers/:answerId` - Delete answer

### **Comment Management** ✨ **NEW**:
6. **POST** `/api/answers/:answerId/comments` - Add comment
7. **GET** `/api/answers/:answerId/comments` - Get comments
8. **DELETE** `/api/comments/:commentId` - Delete comment
9. **POST** `/api/comments/:commentId/vote` - Vote on comment

### **File & System**:
10. **GET** `/api/attachments/:attachmentId/download` - Download file
11. **GET** `/api/add-answer/health` - Health check

---

## 🧪 **Testing the Comment System**

### **Test with Postman/Curl**:

```bash
# 1. Add comment
POST http://localhost:4000/api/answers/ANSWER_ID/comments
Headers: Authorization: Bearer TOKEN
Body: {"content": "Great explanation! Thanks for sharing."}

# 2. Get comments
GET http://localhost:4000/api/answers/ANSWER_ID/comments?page=1&limit=10

# 3. Vote on comment
POST http://localhost:4000/api/comments/COMMENT_ID/vote
Headers: Authorization: Bearer TOKEN
Body: {"voteType": "upvote"}

# 4. Delete comment
DELETE http://localhost:4000/api/comments/COMMENT_ID
Headers: Authorization: Bearer TOKEN
```

---

## ✅ **Ready to Use**

Your complete comment management system is now live! Features include:

- ✅ **Add Comments**: Users can comment on answers
- ✅ **View Comments**: Paginated comment display
- ✅ **Delete Comments**: Creator/admin permissions
- ✅ **Vote on Comments**: Upvote/downvote system
- ✅ **Comment Counts**: Automatic answer count updates
- ✅ **Soft Delete**: Data preservation
- ✅ **Mobile Ready**: Complete API integration

Your Add Answer system now provides a full Stack Overflow-style experience with answers, comments, and voting! 🎉