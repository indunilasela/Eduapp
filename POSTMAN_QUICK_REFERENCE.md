# 🚀 Quick Postman Setup - Answer Management APIs

## ⚡ 5-Minute Setup

### 1. Import Collection
- File: `Postman_Answer_Management_Collection.json`
- Location: Backend folder

### 2. Set Variables (Environment)
```
base_url = http://localhost:4000
jwt_token = [Get from login response]
paper_id = [Get from papers list]
answer_id = [Will be set after upload]
```

### 3. Get JWT Token First
```
POST {{base_url}}/auth/signin
Body: {
  "email": "your-email@example.com", 
  "password": "your-password"
}
Copy token from response → Set as jwt_token variable
```

### 4. Get Paper ID
```
GET {{base_url}}/subjects
Find a subject → Copy subject ID

GET {{base_url}}/subjects/{subjectId}/papers  
Copy a paper ID → Set as paper_id variable
```

---

## 🧪 Test Sequence

### Step 1: Upload Answer ✅
**Request:** `1. Upload Answer`
**Method:** `POST /papers/{{paper_id}}/answers/upload`
**Auth:** ✅ Required
**Body:** 
- `answerFile`: Select PDF file
- `title`: "Test Answer"
- `description`: "Testing upload"

**Expected:** Status 201, answer ID in response

### Step 2: Get Answers ✅  
**Request:** `2. Get Answers by Paper`
**Method:** `GET /papers/{{paper_id}}/answers`
**Auth:** ❌ Not required

**Expected:** Status 200, array with uploaded answer

### Step 3: Download Answer ✅
**Request:** `3. Download Answer`  
**Method:** `GET /answers/{{answer_id}}/download`
**Auth:** ❌ Not required

**Expected:** Status 200, PDF binary data

### Step 4: Delete Answer ✅
**Request:** `4. Delete Answer`
**Method:** `DELETE /answers/{{answer_id}}`
**Auth:** ✅ Required (Admin or Answer Uploader Only)

**Expected:** Status 200, success message

**Permissions:** Only admin (i.asela016@gmail.com) or the user who uploaded the answer can delete it

---

## ⚠️ Quick Troubleshooting

| Error | Status | Solution |
|-------|--------|----------|
| "Access token required" | 401 | Set jwt_token variable |
| "Paper not found" | 404 | Use valid paper_id |
| "Only PDF files allowed" | 422 | Upload PDF files only |
| "Payload too large" | 413 | File must be < 10MB |
| "No permission to delete" | 403 | Use admin or uploader token |

---

## 📋 Pre-flight Checklist

- [ ] Server running on port 4000
- [ ] Postman collection imported  
- [ ] Environment variables set
- [ ] JWT token is valid
- [ ] Paper ID exists
- [ ] PDF test file ready (< 10MB)

**Ready to test! 🚀**