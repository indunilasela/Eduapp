# 🗑️ Delete Answer Endpoint - Complete Documentation

## 🎯 **New Endpoint Added**

### **DELETE** `/api/answers/:answerId`

Deletes a specific answer. Only the answer creator or admin users can delete answers.

**Authentication**: Required (JWT Token)

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**URL Parameters**:
- `answerId` (string): The ID of the answer to delete

**Request Body**: None required

---

## 🔒 **Authorization Rules**

### **Who Can Delete Answers:**
1. **Answer Creator**: The user who originally created the answer
2. **Admin Users**: Users with admin privileges (email contains "admin")

### **Access Control Logic**:
```javascript
const isAnswerCreator = answerData.userId === userId;
const isAdmin = userEmail && userEmail.toLowerCase().includes('admin');

if (!isAnswerCreator && !isAdmin) {
  // Access denied
}
```

---

## 📊 **Response Examples**

### **Success Response (200)**:
```json
{
  "success": true,
  "message": "Answer deleted successfully",
  "data": {
    "answerId": "answer_1727890123456_abc123def",
    "deletedBy": "creator",  // or "admin"
    "deletedAt": "2025-10-03T11:30:00.000Z"
  }
}
```

### **Error Responses**:

#### **Answer Not Found (404)**:
```json
{
  "success": false,
  "message": "Answer not found"
}
```

#### **Access Denied (403)**:
```json
{
  "success": false,
  "message": "Access denied. You can only delete your own answers or you must be an admin."
}
```

#### **Unauthorized (401)**:
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### **Server Error (500)**:
```json
{
  "success": false,
  "message": "Failed to delete answer"
}
```

---

## 🔄 **Deletion Process**

### **Soft Delete Implementation**:
The system uses **soft delete** - answers are marked as deleted rather than permanently removed:

```javascript
// Database update
await updateDoc(doc(db, 'paperAnswers', answerId), {
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: userId,
  updatedAt: new Date()
});
```

### **Complete Cleanup Process**:
1. ✅ **Mark Answer as Deleted**: Sets `isDeleted: true`
2. ✅ **Delete Associated Votes**: Removes all upvotes/downvotes
3. ✅ **Clean Up Files**: Deletes attachment files from storage
4. ✅ **Update Timestamps**: Records deletion time and user

---

## 📱 **Mobile App Integration**

### **Delete Answer Function (React Native)**:
```javascript
const deleteAnswer = async (answerId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/answers/${answerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Answer deleted successfully');
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('❌ Error deleting answer:', error);
    throw error;
  }
};
```

### **Usage Example**:
```javascript
// Delete an answer
try {
  await deleteAnswer('answer_1727890123456_abc123def', userToken);
  
  // Refresh the answers list
  const updatedAnswers = await getAnswers(paperId);
  setAnswers(updatedAnswers.answers);
  
} catch (error) {
  Alert.alert('Error', error.message);
}
```

---

## 🧪 **Testing the Endpoint**

### **Test with Postman/Curl**:

#### **1. Delete Own Answer (Creator)**:
```bash
DELETE http://localhost:4000/api/answers/answer_1727890123456_abc123def
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

#### **2. Delete as Admin**:
```bash
DELETE http://localhost:4000/api/answers/answer_1727890123456_abc123def
Headers:
  Authorization: Bearer ADMIN_JWT_TOKEN
  Content-Type: application/json
```

#### **3. Test Access Denied**:
```bash
# Try to delete someone else's answer (non-admin)
DELETE http://localhost:4000/api/answers/answer_1727890123456_abc123def
Headers:
  Authorization: Bearer OTHER_USER_TOKEN
  Content-Type: application/json

# Expected: 403 Access Denied
```

---

## 🛡️ **Security Features**

- ✅ **JWT Authentication**: Requires valid token
- ✅ **Authorization Check**: Only creator or admin can delete
- ✅ **Answer Ownership**: Verifies user owns the answer
- ✅ **Admin Detection**: Checks for admin privileges
- ✅ **Soft Delete**: Preserves data integrity
- ✅ **File Cleanup**: Removes associated files securely

---

## 📊 **Database Impact**

### **Answer Document Update**:
```javascript
// Before deletion
{
  id: "answer_1727890123456_abc123def",
  title: "My Answer",
  content: "Answer content...",
  isDeleted: false  // or undefined
}

// After deletion
{
  id: "answer_1727890123456_abc123def",
  title: "My Answer",
  content: "Answer content...",
  isDeleted: true,          // ✅ Marked as deleted
  deletedAt: "2025-10-03T11:30:00.000Z",
  deletedBy: "user123",
  updatedAt: "2025-10-03T11:30:00.000Z"
}
```

### **Votes Cleanup**:
```javascript
// All votes for the answer are permanently deleted
// Collection: answerVotes
// Query: where('answerId', '==', answerId)
// Action: deleteDoc() for each vote
```

### **File System Cleanup**:
```javascript
// Attachment files are deleted from uploads/answers/ directory
// Example: uploads/answers/answer_1727890123456_abc123def.pdf
```

---

## 🔍 **Filtering in GET Requests**

Deleted answers are automatically filtered out in the `getPaperAnswers` function:

```javascript
querySnapshot.forEach((docSnap) => {
  const answerData = docSnap.data();
  
  // Filter out deleted answers
  if (answerData.isDeleted === true) {
    return; // Skip this answer
  }
  
  answers.push(answerData);
});
```

---

## 🚀 **Updated API Endpoints List**

Your Add Answer system now includes:

1. **POST** `/api/papers/:paperId/answers` - Create answer
2. **GET** `/api/papers/:paperId/answers` - Get answers (excludes deleted)
3. **GET** `/api/answers/:answerId` - Get specific answer
4. **POST** `/api/answers/:answerId/vote` - Vote on answer
5. **DELETE** `/api/answers/:answerId` - Delete answer ✨ **NEW**
6. **GET** `/api/attachments/:attachmentId/download` - Download file
7. **GET** `/api/add-answer/health` - Health check

---

## ✅ **Ready to Use**

The delete endpoint is now active on your server! You can:

1. **Test it immediately** using the examples above
2. **Integrate it into your mobile app** using the provided code
3. **Set up admin users** by ensuring admin emails contain "admin"
4. **Monitor deleted answers** in your Firebase console

Your Add Answer system now has complete CRUD functionality! 🎉