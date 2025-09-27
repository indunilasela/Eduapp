# Notes Management API Guide

## Overview
The Notes Management System allows users to upload, download, and manage educational notes within subjects. Notes are divided into two categories:
- **Books**: Complete reference materials (textbooks, comprehensive guides)
- **Short Notes**: Quick reference materials (summaries, key points)

## Permissions
- **Upload**: Authenticated users only
- **Download**: All users (no authentication required)
- **Delete**: Admin users and the original uploader only

## File Support
Supported file formats:
- PowerPoint (`.pptx`)
- Word Documents (`.docx`)
- PDF (`.pdf`)
- Text Files (`.txt`)

Maximum file size: 50MB

## API Endpoints

### 1. Upload Notes
**POST** `/subjects/:subjectId/notes/upload`

**Authentication**: Required (Bearer token)

**Content-Type**: `multipart/form-data`

**Form Fields**:

#### For Book Notes:
```
noteType: "book"
noteFile: [File] (pptx, docx, pdf, txt)
subject: "Mathematics"
lessonName: "Algebra Fundamentals"
bookName: "Advanced Mathematics Textbook"
description: "Complete chapter on algebraic equations" (Optional)
```

#### For Short Notes:
```
noteType: "short_note"
noteFile: [File] (pptx, docx, pdf, txt)
subject: "Physics"
lessonName: "Newton's Laws"
title: "Quick Reference - Forces and Motion"
description: "Summary of key concepts" (Optional)
```

**Example Response**:
```json
{
  "success": true,
  "message": "Note uploaded successfully",
  "noteId": "1703123456789_abc123def",
  "note": {
    "subjectId": "subject123",
    "type": "book",
    "subject": "Mathematics",
    "lessonName": "Algebra Fundamentals",
    "bookName": "Advanced Mathematics Textbook",
    "description": "Complete chapter on algebraic equations",
    "fileName": "algebra_chapter.pdf",
    "filePath": "/uploads/notes/1703123456789_abc123def.pdf",
    "uploaderId": "user123",
    "uploaderName": "John Doe"
  }
}
```

### 2. Get Notes by Subject
**GET** `/subjects/:subjectId/notes`

**Authentication**: Not required

**Example Response**:
```json
{
  "success": true,
  "books": [
    {
      "id": "note123",
      "type": "book",
      "subject": "Mathematics",
      "lessonName": "Algebra Fundamentals",
      "bookName": "Advanced Mathematics Textbook",
      "description": "Complete chapter on algebraic equations",
      "fileName": "algebra_chapter.pdf",
      "filePath": "/uploads/notes/1703123456789_abc123def.pdf",
      "uploaderId": "user123",
      "uploaderName": "John Doe",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "shortNotes": [
    {
      "id": "note456",
      "type": "short_note",
      "subject": "Physics",
      "lessonName": "Newton's Laws",
      "title": "Quick Reference - Forces and Motion",
      "description": "Summary of key concepts",
      "fileName": "forces_summary.pdf",
      "filePath": "/uploads/notes/1703123456790_def456ghi.pdf",
      "uploaderId": "user456",
      "uploaderName": "Jane Smith",
      "createdAt": "2024-01-01T11:00:00Z"
    }
  ],
  "totalNotes": 2
}
```

### 3. Download Note
**GET** `/notes/:noteId/download`

**Authentication**: Not required

This endpoint serves the actual file for download with appropriate headers.

### 4. Delete Note
**DELETE** `/notes/:noteId`

**Authentication**: Required (Bearer token)

**Permissions**: Only admin users or the original uploader can delete notes

**Example Response**:
```json
{
  "success": true,
  "message": "Note deleted successfully"
}
```

**Error Response** (Permission Denied):
```json
{
  "success": false,
  "error": "Permission denied. Only admin or uploader can delete notes."
}
```

## Usage Examples

### Frontend Upload Form (React/JavaScript)

```javascript
// Upload Book Note
const uploadBookNote = async (subjectId, formData) => {
  const form = new FormData();
  form.append('noteType', 'book');
  form.append('noteFile', formData.file);
  form.append('subject', formData.subject);
  form.append('lessonName', formData.lessonName);
  form.append('bookName', formData.bookName);
  form.append('description', formData.description);

  const response = await fetch(`/api/subjects/${subjectId}/notes/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  return await response.json();
};

// Upload Short Note
const uploadShortNote = async (subjectId, formData) => {
  const form = new FormData();
  form.append('noteType', 'short_note');
  form.append('noteFile', formData.file);
  form.append('subject', formData.subject);
  form.append('lessonName', formData.lessonName);
  form.append('title', formData.title);
  form.append('description', formData.description);

  const response = await fetch(`/api/subjects/${subjectId}/notes/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  return await response.json();
};
```

### Frontend Download

```javascript
// Download Note
const downloadNote = (noteId, fileName) => {
  const link = document.createElement('a');
  link.href = `/api/notes/${noteId}/download`;
  link.download = fileName;
  link.click();
};
```

### Postman Testing

#### Upload Note Test:
1. **Method**: POST
2. **URL**: `http://localhost:4000/subjects/your-subject-id/notes/upload`
3. **Headers**: 
   - `Authorization: Bearer your-jwt-token`
4. **Body** (form-data):
   - `noteType`: book (or short_note)
   - `noteFile`: [Select file]
   - `subject`: Mathematics
   - `lessonName`: Algebra
   - `bookName`: Math Textbook (for books)
   - `title`: Quick Reference (for short notes)
   - `description`: Optional description

#### Get Notes Test:
1. **Method**: GET
2. **URL**: `http://localhost:4000/subjects/your-subject-id/notes`
3. **Headers**: None required

#### Download Test:
1. **Method**: GET
2. **URL**: `http://localhost:4000/notes/your-note-id/download`
3. **Headers**: None required

## Database Structure

### Notes Collection (`notes`)
```json
{
  "id": "unique_note_id",
  "subjectId": "subject_id",
  "type": "book" | "short_note",
  "subject": "Subject Name",
  "lessonName": "Lesson Name",
  "bookName": "Book Name", // Only for books
  "title": "Note Title", // Only for short notes
  "description": "Optional description",
  "fileName": "original_filename.pdf",
  "filePath": "/uploads/notes/unique_filename.pdf",
  "fileSize": 1234567,
  "mimeType": "application/pdf",
  "uploaderId": "user_id",
  "uploaderName": "User Name",
  "uploaderEmail": "user@email.com",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

## Error Handling

Common error responses:

```json
// Missing file
{
  "success": false,
  "error": "Please select a file to upload"
}

// Invalid file type
{
  "success": false,
  "error": "Only PPTX, DOCX, PDF, and TXT files are allowed"
}

// Missing required fields
{
  "success": false,
  "error": "Note type, subject, and lesson name are required"
}

// File too large
{
  "success": false,
  "error": "File size exceeds 50MB limit"
}

// Note not found
{
  "success": false,
  "error": "Note not found"
}

// Permission denied
{
  "success": false,
  "error": "Permission denied. Only admin or uploader can delete notes."
}
```

## File Storage

Files are stored in `/uploads/notes/` directory with unique filenames to prevent conflicts. The system automatically creates the directory if it doesn't exist.

## Security Features

1. **Authentication**: Upload and delete operations require valid JWT tokens
2. **File Type Validation**: Only allowed file types can be uploaded
3. **File Size Limits**: 50MB maximum file size
4. **Permission Checks**: Only admin or uploader can delete notes
5. **Path Sanitization**: File paths are properly sanitized to prevent directory traversal attacks

## Integration with Subjects

The notes system is integrated with the existing subjects system. Notes belong to specific subjects and can be categorized by lesson names within each subject.