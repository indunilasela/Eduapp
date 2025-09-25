# 📸 Postman Visual Setup Guide - Answer Management APIs

## 🎯 Step-by-Step Screenshots Guide

### Step 1: Import Collection
```
1. Open Postman
2. Click "Import" button (top left)
3. Click "Upload Files" 
4. Select: Postman_Answer_Management_Collection.json
5. Click "Import"
```
**Result:** You'll see "Answer Management API - EduBack Backend" collection in sidebar

---

### Step 2: Create Environment
```
1. Click "Environments" tab (left sidebar)
2. Click "+" to create new environment
3. Name: "EduBack Testing"
4. Add variables:
```

| Variable Name | Initial Value | Current Value |
|---------------|---------------|---------------|
| `base_url` | `http://localhost:4000` | `http://localhost:4000` |
| `jwt_token` | `your_token_here` | `[Leave empty for now]` |
| `paper_id` | `sample_paper_id` | `[Leave empty for now]` |
| `answer_id` | `sample_answer_id` | `[Leave empty for now]` |

```
5. Click "Save"
6. Select this environment from dropdown (top right)
```

---

### Step 3: Get JWT Token

#### 3.1 Login Request (if you don't have auth collection)
```
1. Create new request: "GET JWT Token"
2. Method: POST
3. URL: {{base_url}}/auth/signin
4. Body → raw → JSON:
{
  "email": "your-email@example.com",
  "password": "your-password"
}
5. Click Send
6. Copy token from response
7. Go to Environment → Edit
8. Set jwt_token = copied_token
9. Save environment
```

---

### Step 4: Get Paper ID

#### 4.1 Get Subjects
```
1. New request: "Get Subjects"
2. Method: GET  
3. URL: {{base_url}}/subjects
4. Send → Copy a subject ID
```

#### 4.2 Get Papers for Subject
```
1. New request: "Get Papers"
2. Method: GET
3. URL: {{base_url}}/subjects/[SUBJECT_ID]/papers
4. Send → Copy a paper ID
5. Update environment: paper_id = copied_paper_id
```

---

### Step 5: Test Answer Upload

#### 5.1 Configure Upload Request
```
1. Select "1. Upload Answer" from collection
2. Check URL: {{base_url}}/papers/{{paper_id}}/answers/upload
3. Check Headers tab:
   - Authorization: Bearer {{jwt_token}} ✅
4. Go to Body tab:
   - Select "form-data" ✅
   - Set fields:
```

| Key | Type | Value |
|-----|------|-------|
| `answerFile` | File | [Click "Select Files" → Choose PDF] |
| `title` | Text | `"Complete Solutions Manual"` |
| `description` | Text | `"Detailed step-by-step solutions"` |

```
5. Click "Send"
6. Expected: Status 201 Created
7. Copy "data.id" from response
8. Update environment: answer_id = copied_answer_id
```

**Success Response:**
```json
{
  "success": true,
  "message": "Answer uploaded successfully", 
  "data": {
    "id": "answer_1727347200000_solutions",
    "paperId": "your_paper_id",
    "title": "Complete Solutions Manual",
    ...
  }
}
```

---

### Step 6: Test Get Answers

#### 6.1 Configure Get Request
```
1. Select "2. Get Answers by Paper"
2. Check URL: {{base_url}}/papers/{{paper_id}}/answers
3. No Authorization needed ✅
4. Click "Send"
5. Expected: Status 200 OK
```

**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "answer_1727347200000_solutions",
      "paperId": "your_paper_id", 
      "title": "Complete Solutions Manual",
      "originalFileName": "solutions.pdf",
      "fileSize": 2048576,
      "uploadedBy": "John Doe",
      "uploadedAt": "2025-09-26T..."
    }
  ],
  "total": 1
}
```

---

### Step 7: Test Download Answer

#### 7.1 Configure Download Request  
```
1. Select "3. Download Answer"
2. Check URL: {{base_url}}/answers/{{answer_id}}/download
3. No Authorization needed ✅
4. Click "Send and Download" (not just "Send")
5. Choose save location
6. Expected: Status 200 OK + PDF file download
```

**Response Headers to Check:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="solutions.pdf"
```

---

### Step 8: Test Delete Answer

#### 8.1 Configure Delete Request
```
1. Select "4. Delete Answer"
2. Check URL: {{base_url}}/answers/{{answer_id}}
3. Check Headers:
   - Authorization: Bearer {{jwt_token}} ✅
4. Click "Send"
5. Expected: Status 200 OK
```

**Success Response:**
```json
{
  "success": true,
  "message": "Answer deleted successfully"
}
```

---

## 🔍 Visual Verification Checklist

### After Upload:
- [ ] Status: 201 Created
- [ ] Response body has "success": true
- [ ] File exists in backend/uploads/answers/
- [ ] answer_id saved in environment

### After Get Answers:
- [ ] Status: 200 OK
- [ ] Array contains uploaded answer
- [ ] Metadata looks correct
- [ ] Total count = 1

### After Download:
- [ ] Status: 200 OK
- [ ] File downloaded to computer
- [ ] PDF opens correctly
- [ ] Content matches uploaded file

### After Delete:
- [ ] Status: 200 OK
- [ ] Success message received
- [ ] Re-running "Get Answers" shows empty array
- [ ] File removed from uploads/answers/

---

## 🚨 Common Postman Mistakes

### ❌ Wrong Environment Selected
**Fix:** Check dropdown (top right) shows "EduBack Testing"

### ❌ Variables Not Set
**Fix:** 
```
1. Click eye icon (👁️) next to environment
2. Verify all variables have values
3. Edit if needed
```

### ❌ File Upload Not Working  
**Fix:**
```
1. Body tab → form-data (not raw)
2. Key: "answerFile" (exact spelling)
3. Type: File (not Text)
4. Value: Select actual PDF file
```

### ❌ Authorization Header Missing
**Fix:**
```
1. Headers tab
2. Key: Authorization
3. Value: Bearer {{jwt_token}}
4. Make sure jwt_token variable is set
```

### ❌ Wrong Content-Type
**Fix:** Remove Content-Type header for file uploads (auto-set)

---

## 🎯 Testing Order (Important!)

1. **Upload** → Get answer_id ✅
2. **Get Answers** → Verify upload worked ✅  
3. **Download** → Test file retrieval ✅
4. **Delete** → Clean up ✅
5. **Get Answers Again** → Verify deletion ✅

**Don't test delete first - you'll lose the answer_id!**

---

## 📱 Export Results

### Save Collection Run:
```
1. Click "Runner" (top right)
2. Select "Answer Management API" collection  
3. Select "EduBack Testing" environment
4. Click "Run Answer Management API"
5. Results will show pass/fail for each request
```

This visual guide ensures you can successfully test all answer management endpoints in Postman! 📸✅