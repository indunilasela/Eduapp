# Paper Management API Testing Guide

## Overview
This guide covers testing the paper management system for subjects in EduApp. Users can upload PDF papers (past papers and model papers) for any subject, and admin/uploader can delete them.

## Paper Management Features

### Four Subject Navigation Buttons
Each subject should display four navigation buttons:
- **Paper** (Past Papers & Model Papers)
- **Note** 
- **Video**
- **Reference**

### Paper Types
- **Past Paper**: Official examination papers from previous years
- **Model Paper**: Practice papers created by teachers/users

### Upload Requirements
- **File Type**: PDF only (max 10MB)
- **Required Fields**: Type, Name, Year
- **Optional Field**: Title (for model papers)

### Permissions
- **Upload**: Any authenticated user
- **View/Download**: Everyone (public access)
- **Delete**: Admin and uploader only

## Authentication Required
All upload and delete endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Paper Management Endpoints

### 1. Upload Paper
**Endpoint**: `POST /subjects/{subjectId}/papers/upload`
**Authentication**: Required (any authenticated user)
**Content-Type**: `multipart/form-data`

**Form Data**:
- `paperFile` (file): PDF file to upload
- `type` (string): "past paper" or "model paper"
- `name` (string): Paper name (e.g., "English O/L")
- `year` (string): Year (e.g., "2025")
- `title` (string, optional): Title for model papers (e.g., "Amila Dasanayaka create paper part")

**Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Paper uploaded successfully",
  "paperId": "1732248123456_abc123def",
  "data": {
    "subjectId": "subject123",
    "type": "past paper",
    "name": "English O/L",
    "year": "2025",
    "title": null,
    "fileName": "paper-1732248123456-123456789.pdf",
    "originalName": "english_ol_2025.pdf",
    "filePath": "/uploads/papers/paper-1732248123456-123456789.pdf",
    "fileSize": 2048576,
    "uploaderId": "user123",
    "uploaderEmail": "user@example.com",
    "uploaderUsername": "testuser",
    "id": "1732248123456_abc123def"
  }
}
```

**Test Cases**:

#### Past Paper Upload:
```
POST /subjects/subject123/papers/upload
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

Form Data:
- paperFile: [PDF file]
- type: "past paper"
- name: "Mathematics O/L"
- year: "2024"
```

#### Model Paper Upload:
```
POST /subjects/subject123/papers/upload
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

Form Data:
- paperFile: [PDF file]
- type: "model paper"
- name: "Physics A/L"
- year: "2025"
- title: "Amila Dasanayaka create paper part 1"
```

### 2. Get All Papers for Subject
**Endpoint**: `GET /subjects/{subjectId}/papers`
**Authentication**: Not required (public access)

**Query Parameters** (optional):
- `type`: Filter by "past paper" or "model paper"

**Response (Success - 200)**:
```json
{
  "success": true,
  "papers": [
    {
      "id": "paper123",
      "subjectId": "subject123",
      "type": "past paper",
      "name": "Mathematics O/L",
      "year": "2024",
      "title": null,
      "fileName": "paper-1732248123456-123456789.pdf",
      "originalName": "math_ol_2024.pdf",
      "filePath": "/uploads/papers/paper-1732248123456-123456789.pdf",
      "fileSize": 1024576,
      "uploaderId": "user123",
      "uploaderEmail": "user@example.com",
      "uploaderUsername": "testuser",
      "createdAt": "2025-09-24T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Get Past Papers Only
**Endpoint**: `GET /subjects/{subjectId}/papers/past`
**Authentication**: Not required

**Response**: Returns only past papers for the subject

### 4. Get Model Papers Only
**Endpoint**: `GET /subjects/{subjectId}/papers/model`
**Authentication**: Not required

**Response**: Returns only model papers for the subject

### 5. Download Paper
**Endpoint**: `GET /papers/{paperId}/download`
**Authentication**: Not required (public download)

**Response**: Downloads the PDF file with proper filename

**Example**:
```
GET /papers/paper123/download
```

### 6. View Paper (In Browser)
**Endpoint**: `GET /papers/{paperId}/view`
**Authentication**: Not required (public viewing)

**Response**: Opens the PDF file in browser for viewing

**Example**:
```
GET /papers/paper123/view
```

### 7. Delete Paper
**Endpoint**: `DELETE /papers/{paperId}`
**Authentication**: Required (admin or uploader only)

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Paper deleted successfully"
}
```

**Authorization Rules**:
- Admin (i.asela016@gmail.com) can delete any paper
- Paper uploader can delete their own papers
- Other users cannot delete papers

## Testing Workflow

### For Regular Users:
1. **Sign in** to get authentication token
2. **Upload papers** using `POST /subjects/{subjectId}/papers/upload`
3. **View papers** using `GET /subjects/{subjectId}/papers`
4. **Download papers** using `GET /papers/{paperId}/download`
5. **Delete own papers** using `DELETE /papers/{paperId}`

### For Admin:
1. **Sign in** with admin email
2. **View all papers** for any subject
3. **Delete any paper** using admin privileges

### For Public Users (No Auth):
1. **View papers** for any subject
2. **Download papers** freely
3. **View papers** in browser

## Paper Upload Form Examples

### Past Paper Form:
```html
<form enctype="multipart/form-data">
  <select name="type" required>
    <option value="past paper">Past Paper</option>
    <option value="model paper">Model Paper</option>
  </select>
  
  <input type="text" name="name" placeholder="English O/L" required>
  <input type="text" name="year" placeholder="2025" required>
  
  <!-- Title field only for model papers -->
  <input type="text" name="title" placeholder="Title (for model papers)">
  
  <input type="file" name="paperFile" accept=".pdf" required>
  <button type="submit">Upload Paper</button>
</form>
```

### Sample Form Data:

#### Example 1: Past Paper
- Type: "past paper"
- Name: "English O/L"
- Year: "2025"
- Title: (leave empty)

#### Example 2: Model Paper
- Type: "model paper"
- Name: "Physics A/L"
- Year: "2025"
- Title: "Amila Dasanayaka create paper part 1"

## Postman Testing

### Environment Variables
```
baseUrl: http://localhost:4000
authToken: YOUR_JWT_TOKEN
adminToken: ADMIN_JWT_TOKEN
subjectId: SUBJECT_ID_FOR_TESTING
paperId: PAPER_ID_FOR_TESTING
```

### Sample Requests

#### 1. Upload Past Paper
```
POST {{baseUrl}}/subjects/{{subjectId}}/papers/upload
Authorization: Bearer {{authToken}}
Content-Type: multipart/form-data

Form Data:
- paperFile: [Select PDF file]
- type: past paper
- name: Mathematics O/L
- year: 2024
```

#### 2. Upload Model Paper
```
POST {{baseUrl}}/subjects/{{subjectId}}/papers/upload
Authorization: Bearer {{authToken}}
Content-Type: multipart/form-data

Form Data:
- paperFile: [Select PDF file]
- type: model paper
- name: Physics A/L
- year: 2025
- title: Teacher Created Practice Paper
```

#### 3. Get All Papers
```
GET {{baseUrl}}/subjects/{{subjectId}}/papers
```

#### 4. Get Past Papers Only
```
GET {{baseUrl}}/subjects/{{subjectId}}/papers/past
```

#### 5. Download Paper
```
GET {{baseUrl}}/papers/{{paperId}}/download
```

#### 6. Delete Paper
```
DELETE {{baseUrl}}/papers/{{paperId}}
Authorization: Bearer {{authToken}}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Type, name, and year are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Only admin or the uploader can delete this paper"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Paper not found"
}
```

### File Type Error
```json
{
  "success": false,
  "error": "Only PDF files are allowed"
}
```

## File System Structure

```
uploads/
  papers/
    paper-1732248123456-123456789.pdf
    paper-1732248567890-987654321.pdf
    ...
```

## Database Structure

### Papers Collection
```json
{
  "id": "generated_id",
  "subjectId": "subject_id",
  "type": "past paper|model paper",
  "name": "Paper Name",
  "year": "Year",
  "title": "Title (optional)",
  "fileName": "paper-timestamp-random.pdf",
  "originalName": "original_filename.pdf",
  "filePath": "/uploads/papers/paper-timestamp-random.pdf",
  "fileSize": 1024576,
  "uploaderId": "uploader_user_id",
  "uploaderEmail": "uploader@email.com",
  "uploaderUsername": "uploader_username",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Security Features

- PDF file type validation
- File size limit (10MB)
- Proper file naming with timestamps
- User authentication for uploads and deletes
- Admin and uploader permissions for deletion
- Secure file serving

## Testing Checklist

### Upload Tests:
- [ ] Upload past paper with all required fields
- [ ] Upload model paper with title
- [ ] Try uploading non-PDF file (should fail)
- [ ] Try uploading without required fields (should fail)
- [ ] Try uploading without authentication (should fail)

### Viewing Tests:
- [ ] Get all papers for a subject
- [ ] Filter papers by type (past/model)
- [ ] Download paper file
- [ ] View paper in browser

### Deletion Tests:
- [ ] Delete own paper as uploader
- [ ] Delete any paper as admin
- [ ] Try deleting other's paper as regular user (should fail)
- [ ] Try deleting without authentication (should fail)

### Permission Tests:
- [ ] Verify admin can delete any paper
- [ ] Verify uploader can delete own papers
- [ ] Verify other users cannot delete papers
- [ ] Verify public access to viewing and downloading

## Mobile App Integration

### Frontend Components Needed:
1. **Subject Navigation**: Four buttons (Paper, Note, Video, Reference)
2. **Paper Upload Form**: File picker, type selector, text inputs
3. **Paper List**: Display papers with download/view options
4. **Paper Viewer**: PDF viewer component

### API Integration Points:
- Subject papers listing
- Paper upload with file picker
- Paper download/view functionality
- Delete confirmation for own papers

The paper management system is now fully functional and ready for testing!