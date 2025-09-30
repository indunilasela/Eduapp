# Answer Management API Documentation

## Overview
This document provides comprehensive information about the Answer Management API endpoints for the Educational Platform Backend. These endpoints allow users to upload, view, download, and manage answer files (PDFs) for papers in subjects.

## Base URL
```
http://localhost:4000
http://0.0.0.0:4000  (for network access)
```

## Authentication
Most endpoints require JWT token authentication. Include the token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

---

## Answer Management Endpoints

### 1. Upload Answer
**POST** `/papers/{paperId}/answers/upload`

Upload a PDF answer file for a specific paper.

#### Headers
- `Authorization: Bearer <token>` (Required)
- `Content-Type: multipart/form-data`

#### Parameters
- `paperId` (path parameter) - The ID of the paper to upload answer for

#### Request Body (Form Data)
- `answerFile` (file, required) - PDF file (max 10MB)
- `title` (string, required) - Title of the answer
- `description` (string, optional) - Description of the answer

#### Response
```json
{
  "success": true,
  "message": "Answer uploaded successfully",
  "data": {
    "id": "answer_id_here",
    "paperId": "paper_id_here",
    "title": "Sample Answer Title",
    "description": "Answer description",
    "fileName": "answer_1703123456789_sample.pdf",
    "originalFileName": "sample.pdf",
    "uploadedBy": "John Doe",
    "uploadedAt": "2023-12-21T10:30:45.123Z"
  }
}
```

#### Error Responses
- `400 Bad Request` - Missing title or file
- `404 Not Found` - Paper not found
- `413 Payload Too Large` - File too large (>10MB)
- `422 Unprocessable Entity` - Invalid file type (only PDF allowed)

---

### 2. Get Answers by Paper
**GET** `/papers/{paperId}/answers`

Retrieve all answers for a specific paper. This endpoint is public (no authentication required).

#### Parameters
- `paperId` (path parameter) - The ID of the paper

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "answer_id_1",
      "paperId": "paper_id_here",
      "title": "Answer Sheet 1",
      "description": "Complete solution for all questions",
      "originalFileName": "answer_sheet_1.pdf",
      "fileSize": 2048576,
      "uploadedBy": "John Doe",
      "uploadedAt": "2023-12-21T10:30:45.123Z"
    },
    {
      "id": "answer_id_2",
      "paperId": "paper_id_here",
      "title": "Alternative Solutions",
      "description": "Different approaches to solve problems",
      "originalFileName": "alternative_answers.pdf",
      "fileSize": 1536789,
      "uploadedBy": "Jane Smith",
      "uploadedAt": "2023-12-20T15:45:30.456Z"
    }
  ],
  "total": 2
}
```

#### Error Responses
- `404 Not Found` - Paper not found
- `500 Internal Server Error` - Database error

---

### 3. Download Answer
**GET** `/answers/{answerId}/download`

Download a specific answer PDF file. This endpoint is public (no authentication required).

#### Parameters
- `answerId` (path parameter) - The ID of the answer to download

#### Response
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="original_filename.pdf"`
- Binary PDF data

#### Error Responses
- `404 Not Found` - Answer not found or file missing from server
- `500 Internal Server Error` - File streaming error

---

### 4. Delete Answer
**DELETE** `/answers/{answerId}`

Delete a specific answer. Only the uploader or admin can delete answers.

#### Headers
- `Authorization: Bearer <token>` (Required)

#### Parameters
- `answerId` (path parameter) - The ID of the answer to delete

#### Response
```json
{
  "success": true,
  "message": "Answer deleted successfully"
}
```

#### Error Responses
- `401 Unauthorized` - No token provided
- `403 Forbidden` - Not the uploader or admin
- `404 Not Found` - Answer not found
- `500 Internal Server Error` - Deletion failed

---

## File Upload Specifications

### Answer Files
- **Format**: PDF only
- **Size Limit**: 10MB maximum
- **Storage Location**: `uploads/answers/`
- **Naming Convention**: `answer_{timestamp}_{original_filename}`

### File Validation
- Only PDF files are accepted (checked by MIME type)
- File size must be ≤ 10MB
- Original filename is preserved in database

---

## Error Handling

### Common Error Response Format
```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created (upload success)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `413` - Payload Too Large (file too big)
- `422` - Unprocessable Entity (invalid file type)
- `500` - Internal Server Error

---

## Permissions

### Upload Answer
- Requires authentication
- Any authenticated user can upload answers

### View Answers
- Public access (no authentication required)
- Anyone can view list of answers and download them

### Delete Answer
- Requires authentication
- Only the uploader or admin (i.asela016@gmail.com) can delete

---

## Database Schema

### Answers Collection (Firestore)
```javascript
{
  id: "auto-generated-id",
  paperId: "referenced-paper-id",
  title: "Answer title",
  description: "Optional description",
  fileName: "stored-file-name",
  originalFileName: "original-uploaded-name",
  filePath: "uploads/answers/answer_timestamp_name.pdf",
  fileSize: 1234567, // bytes
  uploadedBy: "user-id",
  uploaderName: "Full Name",
  uploaderEmail: "user@email.com",
  uploadedAt: "2023-12-21T10:30:45.123Z"
}
```

---

## Integration Examples

### Upload Answer (curl)
```bash
curl -X POST "http://localhost:4000/papers/PAPER_ID/answers/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "answerFile=@answer.pdf" \
  -F "title=Complete Solutions" \
  -F "description=All questions answered with explanations"
```

### Get Answers (curl)
```bash
curl -X GET "http://localhost:4000/papers/PAPER_ID/answers"
```

### Download Answer (curl)
```bash
curl -X GET "http://localhost:4000/answers/ANSWER_ID/download" \
  -o downloaded_answer.pdf
```

### Delete Answer (curl)
```bash
curl -X DELETE "http://localhost:4000/answers/ANSWER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing Workflow

1. **Upload Test**: Use Postman or curl to upload a sample PDF answer
2. **List Test**: Verify the answer appears in the paper's answer list
3. **Download Test**: Ensure the PDF can be downloaded correctly
4. **Permission Test**: Try deleting with different users
5. **Validation Test**: Test with non-PDF files and large files

---

## Notes
- Answer files are stored permanently until manually deleted
- File cleanup happens automatically if database operations fail
- All file operations include proper error handling
- Download endpoint supports file streaming for large PDFs
- Answer uploads require existing paper (validation performed)