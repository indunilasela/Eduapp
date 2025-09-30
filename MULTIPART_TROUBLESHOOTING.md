# Multipart Upload Troubleshooting Guide

## Error: "Malformed part header"

This error occurs when there's an issue with the multipart/form-data request format. Here are the common causes and solutions:

## Quick Fix Steps

### 1. Test the Upload Endpoint
First, test if multipart uploads are working at all:

**POST** `http://localhost:4000/test-upload`
- Headers: `Authorization: Bearer YOUR_TOKEN`
- Body: form-data with `testFile` field

### 2. Common Causes & Solutions

#### A. Content-Type Header Issues
**Problem**: Missing or incorrect Content-Type header

**Solution**: 
- ✅ **Postman**: Select "form-data" in Body tab (auto-sets Content-Type)
- ✅ **Frontend**: Don't manually set Content-Type, let browser/fetch handle it
- ❌ **Don't do**: `'Content-Type': 'multipart/form-data'` (missing boundary)

#### B. Frontend Implementation
**Correct way**:
```javascript
const formData = new FormData();
formData.append('noteType', 'book');
formData.append('noteFile', fileInput.files[0]);
formData.append('subject', 'Math');
formData.append('lessonName', 'Algebra');
formData.append('bookName', 'Textbook');

fetch('/subjects/123/notes/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // DON'T set Content-Type - browser handles it automatically
  },
  body: formData
});
```

**Wrong way**:
```javascript
// ❌ Don't do this
fetch('/subjects/123/notes/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data', // Missing boundary
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### C. React Native Implementation
```javascript
const formData = new FormData();
formData.append('noteType', 'book');
formData.append('noteFile', {
  uri: fileUri,
  type: 'application/pdf',
  name: 'document.pdf'
});
formData.append('subject', 'Math');

fetch('/subjects/123/notes/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});
```

## Testing with Postman

### Step-by-Step Postman Test:

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:4000/test-upload`

2. **Set Headers**
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`

3. **Set Body**
   - Select `form-data` tab
   - Add key `testFile` with type `File`
   - Select any small file

4. **Send Request**
   - Should return success response
   - If it fails, check the error details

### Notes Upload Test:

1. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:4000/subjects/SUBJECT_ID/notes/upload`

2. **Set Headers**
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`

3. **Set Body (form-data)**
   - `noteType`: `book`
   - `noteFile`: [Select file]
   - `subject`: `Mathematics`
   - `lessonName`: `Algebra`
   - `bookName`: `Math Textbook`
   - `description`: `Test upload`

## Debug Information

### Check Server Logs
The server now logs detailed information:
```
📝 Note upload request: {
  subjectId: 'subject123',
  noteType: 'book',
  subject: 'Math',
  lessonName: 'Algebra',
  hasFile: true,
  contentType: 'multipart/form-data; boundary=...'
}
```

### Common Error Messages & Fixes

| Error | Cause | Solution |
|-------|--------|----------|
| "Malformed part header" | Invalid multipart format | Check Content-Type header setup |
| "Content-Type must be multipart/form-data" | Missing/wrong Content-Type | Use form-data in Postman or FormData in JS |
| "Please select a file to upload" | No file in request | Ensure file field name is `noteFile` |
| "File size too large" | File > 50MB | Reduce file size or increase limit |
| "Only PPTX, DOCX, PDF, and TXT files are allowed" | Wrong file type | Use supported file formats |

## Advanced Debugging

### 1. Check Raw Request
In your browser dev tools or Postman console, look at the raw request:
- Should have `Content-Type: multipart/form-data; boundary=...`
- Should have proper multipart boundaries in body

### 2. Server-side Debugging
Add this to your upload handler for more details:
```javascript
console.log('Request headers:', req.headers);
console.log('Request body keys:', Object.keys(req.body));
console.log('Has file:', !!req.file);
```

### 3. Network Issues
- Try with a smaller file first
- Check if your network/proxy supports large uploads
- Verify server can handle the file size

## Working Examples

### Curl Command
```bash
curl -X POST "http://localhost:4000/subjects/123/notes/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "noteType=book" \
  -F "noteFile=@/path/to/file.pdf" \
  -F "subject=Math" \
  -F "lessonName=Algebra" \
  -F "bookName=Textbook"
```

### Python Requests
```python
import requests

files = {'noteFile': open('document.pdf', 'rb')}
data = {
    'noteType': 'book',
    'subject': 'Math',
    'lessonName': 'Algebra',
    'bookName': 'Textbook'
}
headers = {'Authorization': 'Bearer YOUR_TOKEN'}

response = requests.post(
    'http://localhost:4000/subjects/123/notes/upload',
    files=files,
    data=data,
    headers=headers
)
```

## If Problems Persist

1. **Test with smaller files** (< 1MB) first
2. **Use the test endpoint** to isolate the issue
3. **Check server logs** for detailed error information
4. **Try different file types** (txt files are smallest)
5. **Verify JWT token** is valid and not expired

## Server Improvements Made

1. **Better error handling** for multer errors
2. **Content-Type validation** before processing
3. **Detailed logging** for debugging
4. **Test endpoint** for troubleshooting
5. **Improved CORS** configuration

The server should now provide much clearer error messages to help identify the exact issue with your multipart uploads.