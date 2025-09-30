# Subject Management API Testing Guide

## Overview
This guide covers testing the new subject management endpoints for the EduApp backend. The system allows users to create subjects that require admin approval before being visible to all users.

## Admin Information
- **Admin Email**: i.asela016@gmail.com
- **Admin Role**: Only this email has admin privileges for approving/rejecting/deleting subjects

## Authentication Required
All endpoints except `GET /subjects` require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Subject Management Endpoints

### 1. Create Subject
**Endpoint**: `POST /subjects/create`
**Authentication**: Required (any authenticated user)

**Request Body**:
```json
{
  "subject": "OOP",
  "grade": "BSc",
  "school": "UoM",
  "description": "Second-year subject"
}
```

**Required Fields**:
- `subject` (string): Name of the subject
- `grade` (string): Grade/level of the subject

**Optional Fields**:
- `school` (string): School/institution name
- `description` (string): Subject description

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Subject created successfully and pending admin approval",
  "subjectId": "1732248123456_abc123def",
  "data": {
    "subject": "OOP",
    "grade": "BSc",
    "school": "UoM",
    "description": "Second-year subject",
    "userId": "user123",
    "creatorEmail": "user@example.com",
    "creatorUsername": "testuser",
    "id": "1732248123456_abc123def",
    "status": "pending"
  }
}
```

**Test Cases**:
```json
// Test Case 1: Valid subject with all fields
{
  "subject": "Mathematics",
  "grade": "Grade 10",
  "school": "Royal College",
  "description": "Advanced mathematics for grade 10 students"
}

// Test Case 2: Valid subject with required fields only
{
  "subject": "English Literature",
  "grade": "A Level"
}

// Test Case 3: Missing required field (should fail)
{
  "grade": "Grade 11"
}
```

### 2. Get Approved Subjects (Public)
**Endpoint**: `GET /subjects`
**Authentication**: Not required

**Response (Success - 200)**:
```json
{
  "success": true,
  "subjects": [
    {
      "id": "subject123",
      "subject": "Mathematics",
      "grade": "Grade 10",
      "school": "Royal College",
      "description": "Advanced mathematics",
      "status": "approved",
      "userId": "user123",
      "creatorEmail": "user@example.com",
      "creatorUsername": "testuser",
      "createdAt": "2025-09-22T10:30:00.000Z",
      "approvedAt": "2025-09-22T11:00:00.000Z",
      "approvedBy": "admin123"
    }
  ],
  "count": 1
}
```

### 3. Get User's Own Subjects
**Endpoint**: `GET /subjects/my`
**Authentication**: Required

**Response**: Returns all subjects created by the authenticated user (pending, approved, rejected)

### 4. Get Pending Subjects (Admin Only)
**Endpoint**: `GET /admin/subjects/pending`
**Authentication**: Required (admin only)

**Response**: Returns all subjects with status "pending" waiting for approval

### 5. Get All Subjects (Admin Only)
**Endpoint**: `GET /admin/subjects`
**Authentication**: Required (admin only)

**Response**: Returns all subjects regardless of status

### 6. Approve Subject (Admin Only)
**Endpoint**: `PUT /admin/subjects/{subjectId}/approve`
**Authentication**: Required (admin only)

**Path Parameter**:
- `subjectId`: The ID of the subject to approve

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Subject approved successfully"
}
```

### 7. Reject Subject (Admin Only)
**Endpoint**: `PUT /admin/subjects/{subjectId}/reject`
**Authentication**: Required (admin only)

**Path Parameter**:
- `subjectId`: The ID of the subject to reject

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Subject rejected successfully"
}
```

### 8. Delete Subject (Admin Only)
**Endpoint**: `DELETE /admin/subjects/{subjectId}`
**Authentication**: Required (admin only)

**Path Parameter**:
- `subjectId`: The ID of the subject to delete

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Subject deleted successfully"
}
```

## Testing Workflow

### For Regular Users:
1. **Sign up/Sign in** to get authentication token
2. **Create subjects** using `POST /subjects/create`
3. **View own subjects** using `GET /subjects/my` (will show pending status)
4. **View approved subjects** using `GET /subjects` (only shows approved by admin)

### For Admin (i.asela016@gmail.com):
1. **Sign in** with admin email to get admin token
2. **View pending subjects** using `GET /admin/subjects/pending`
3. **Approve subjects** using `PUT /admin/subjects/{id}/approve`
4. **Reject subjects** using `PUT /admin/subjects/{id}/reject`
5. **Delete subjects** using `DELETE /admin/subjects/{id}`
6. **View all subjects** using `GET /admin/subjects`

## Postman Collection

### Environment Variables
Create these variables in Postman:
- `baseUrl`: `http://localhost:4000` (or your server URL)
- `authToken`: Your JWT token after login
- `adminToken`: Admin JWT token
- `subjectId`: Subject ID for testing admin actions

### Sample Requests

#### 1. Create Subject
```
POST {{baseUrl}}/subjects/create
Authorization: Bearer {{authToken}}
Content-Type: application/json

{
  "subject": "Computer Science",
  "grade": "BSc Year 2",
  "school": "University of Moratuwa",
  "description": "Object-oriented programming concepts"
}
```

#### 2. Get Approved Subjects
```
GET {{baseUrl}}/subjects
```

#### 3. Admin - Get Pending Subjects
```
GET {{baseUrl}}/admin/subjects/pending
Authorization: Bearer {{adminToken}}
```

#### 4. Admin - Approve Subject
```
PUT {{baseUrl}}/admin/subjects/{{subjectId}}/approve
Authorization: Bearer {{adminToken}}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Subject and grade are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden (Non-admin accessing admin endpoint)
```json
{
  "success": false,
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Subject Lifecycle

1. **Created**: User creates subject → Status: "pending"
2. **Visible to**: Creator and admin only
3. **Admin Action**: 
   - Approve → Status: "approved" → Visible to all users
   - Reject → Status: "rejected" → Visible to creator and admin only
   - Delete → Subject removed from database
4. **Final State**: Approved subjects appear in public subject list

## Testing Checklist

### User Actions:
- [ ] Create subject with all fields
- [ ] Create subject with required fields only
- [ ] Try to create subject without required fields (should fail)
- [ ] View own subjects (should see all statuses)
- [ ] View public subjects (should see only approved)

### Admin Actions:
- [ ] View pending subjects
- [ ] Approve a pending subject
- [ ] Reject a pending subject
- [ ] Delete a subject
- [ ] View all subjects (all statuses)

### Security Tests:
- [ ] Try admin endpoints without authentication (should fail)
- [ ] Try admin endpoints with regular user token (should fail)
- [ ] Verify only admin email has admin access
- [ ] Test token expiration handling

## Database Structure

### Subjects Collection
```json
{
  "id": "generated_id",
  "subject": "Subject Name",
  "grade": "Grade Level",
  "school": "School Name (optional)",
  "description": "Description (optional)",
  "status": "pending|approved|rejected",
  "userId": "creator_user_id",
  "creatorEmail": "creator@email.com",
  "creatorUsername": "creator_username",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "approvedAt": "timestamp (if approved)",
  "approvedBy": "admin_user_id (if approved)"
}
```

## Notes
- Subjects are created with "pending" status by default
- Only admin (i.asela016@gmail.com) can approve/reject/delete subjects
- Approved subjects are visible to all users via `GET /subjects`
- Users can view their own subjects regardless of status via `GET /subjects/my`
- Admin can view all subjects regardless of status via `GET /admin/subjects`