# Answer Management API Testing Guide

## Quick Testing Checklist

### Prerequisites
1. ✅ Server running on port 4000
2. ✅ Have a valid JWT token for authenticated requests
3. ✅ Have a valid paper ID from existing papers
4. ✅ Have PDF files ready for upload testing (max 10MB)

### Testing Steps

#### 1. Test Answer Upload
```bash
# Upload an answer (replace with actual values)
curl -X POST "http://localhost:4000/papers/YOUR_PAPER_ID/answers/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "answerFile=@sample_answer.pdf" \
  -F "title=Test Answer Upload" \
  -F "description=Testing answer upload functionality"
```

**Expected**: Status 201, returns answer ID and details

#### 2. Test Get Answers
```bash
# Get all answers for a paper (no auth required)
curl -X GET "http://localhost:4000/papers/YOUR_PAPER_ID/answers"
```

**Expected**: Status 200, returns array of answers with details

#### 3. Test Download Answer
```bash
# Download answer file (no auth required)
curl -X GET "http://localhost:4000/answers/YOUR_ANSWER_ID/download" \
  -o downloaded_answer.pdf
```

**Expected**: Status 200, PDF file downloaded

#### 4. Test Delete Answer
```bash
# Delete answer (requires auth and permissions)
curl -X DELETE "http://localhost:4000/answers/YOUR_ANSWER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Status 200, success message

### Postman Testing
1. Import `Postman_Answer_Management_Collection.json`
2. Set environment variables:
   - `jwt_token`: Your valid JWT token
   - `paper_id`: Valid paper ID
   - `answer_id`: Valid answer ID (from upload response)
3. Run requests in order: Upload → Get → Download → Delete

### Error Testing
1. **Upload without file**: Should return 400
2. **Upload non-PDF file**: Should return 422
3. **Upload large file (>10MB)**: Should return 413
4. **Get answers for non-existent paper**: Should return 404
5. **Delete without auth**: Should return 401
6. **Delete other user's answer**: Should return 403

### File System Verification
Check that files are properly stored:
```bash
ls -la uploads/answers/
```

Files should be named: `answer_[timestamp]_[original_name]`

### Database Verification
Check Firestore console for `answers` collection with proper document structure.

---

## Sample Test Data

### Sample Paper Creation (for testing)
```json
{
  "subject": "Mathematics",
  "grade": "12",
  "school": "Test School",
  "type": "Past Paper",
  "description": "Sample paper for answer testing"
}
```

### Sample Answer Upload Data
```json
{
  "title": "Complete Mathematics Solutions",
  "description": "Step-by-step solutions for all questions with detailed explanations"
}
```

---

## Common Issues & Solutions

### Issue: Port already in use
**Solution**: Kill existing process or use different port

### Issue: File upload fails
**Check**: File size (<10MB), file type (PDF only), form field name (answerFile)

### Issue: Authentication errors
**Check**: JWT token validity, Bearer prefix, token in Authorization header

### Issue: Permission errors on delete
**Check**: Token belongs to uploader or admin (i.asela016@gmail.com)

### Issue: Paper not found
**Check**: Paper ID exists in database, paper ID format is correct

---

## API Flow Example

1. **Create/Get Paper ID**: Use existing paper or create new one
2. **Upload Answer**: POST with PDF file and details
3. **List Answers**: GET to see uploaded answers
4. **Download Answer**: GET with answer ID to download PDF
5. **Delete Answer**: DELETE with proper authentication

---

## Status Codes Reference

- `200` - OK (get, download, delete success)
- `201` - Created (upload success)
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (paper/answer doesn't exist)
- `413` - Payload Too Large (file too big)
- `422` - Unprocessable Entity (invalid file type)
- `500` - Internal Server Error

---

## Integration Notes for Mobile App

1. **File Upload**: Use multipart/form-data with proper field names
2. **Download**: Handle binary PDF response appropriately
3. **Error Handling**: Check status codes and parse error messages
4. **Permissions**: Cache user role for delete button visibility
5. **File Size**: Validate file size client-side before upload