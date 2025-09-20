 # Postman Testing Guide for Authentication API

## Server URL
Base URL: `http://localhost:4000`

## 1. SIGNUP ENDPOINT

### Request Details:
- **Method**: POST
- **URL**: `http://localhost:4000/auth/signup`
- **Headers**: 
  ```
  Content-Type: application/json
  ```

### Request Body (JSON):
```json
{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
}
```

### Expected Success Response (Status: 201):
```json
{
    "success": true,
    "message": "User registered successfully",
    "user": {
        "id": "1726649200123_abc123def",
        "username": "testuser123",
        "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNzI2NjQ5MjAwMTIzX2FiYzEyM2RlZiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcyNjY0OTIwMCwiZXhwIjoxNzI2NzM1NjAwfQ.signature"
}
```

### Test Cases for Signup:

#### Test 1: Valid Signup
```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
}
```

#### Test 2: Invalid Email
```json
{
    "username": "testuser",
    "email": "invalid-email",
    "password": "password123",
    "confirmPassword": "password123"
}
```
Expected: 400 Bad Request with validation errors

#### Test 3: Password Mismatch
```json
{
    "username": "testuser",
    "email": "test2@example.com",
    "password": "password123",
    "confirmPassword": "differentpassword"
}
```
Expected: 400 Bad Request with "Passwords do not match" error

#### Test 4: Short Password
```json
{
    "username": "testuser",
    "email": "test3@example.com",
    "password": "123",
    "confirmPassword": "123"
}
```
Expected: 400 Bad Request with "Password must be at least 6 characters long"

#### Test 5: Duplicate Email (run after Test 1)
```json
{
    "username": "anothername",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
}
```
Expected: 409 Conflict with "User with this email already exists"

---

## 2. SIGNIN ENDPOINT

### Request Details:
- **Method**: POST
- **URL**: `http://localhost:4000/auth/signin`
- **Headers**: 
  ```
  Content-Type: application/json
  ```

### Request Body (JSON):
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

### Expected Success Response (Status: 200):
```json
{
    "success": true,
    "message": "Signin successful",
    "user": {
        "id": "1726649200123_abc123def",
        "username": "testuser123",
        "email": "test@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxNzI2NjQ5MjAwMTIzX2FiYzEyM2RlZiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTcyNjY0OTIwMCwiZXhwIjoxNzI2NzM1NjAwfQ.signature"
}
```

### Test Cases for Signin:

#### Test 1: Valid Signin (use credentials from successful signup)
```json
{
    "email": "test@example.com",
    "password": "password123"
}
```

#### Test 2: Invalid Email
```json
{
    "email": "nonexistent@example.com",
    "password": "password123"
}
```
Expected: 401 Unauthorized with "Invalid email or password"

#### Test 3: Wrong Password
```json
{
    "email": "test@example.com",
    "password": "wrongpassword"
}
```
Expected: 401 Unauthorized with "Invalid email or password"

#### Test 4: Invalid Email Format
```json
{
    "email": "invalid-email",
    "password": "password123"
}
```
Expected: 400 Bad Request with validation errors

#### Test 5: Missing Password
```json
{
    "email": "test@example.com"
}
```
Expected: 400 Bad Request with "Password is required"

---

## 3. GENERAL INFO ENDPOINT

### Request Details:
- **Method**: GET
- **URL**: `http://localhost:4000/`

### Expected Response:
```json
{
    "message": "Welcome to eduback backend!",
    "status": "Firebase connected",
    "timestamp": "2025-09-18T08:20:00.000Z",
    "endpoints": {
        "signup": "POST /auth/signup",
        "signin": "POST /auth/signin",
        "users": "GET /users/:id"
    }
}
```

---

## Postman Collection Setup

### Step 1: Create Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "Eduback Authentication API"

### Step 2: Add Environment
1. Click "Environments" → "Create Environment"
2. Name it "Eduback Local"
3. Add variable:
   - Variable: `baseURL`
   - Initial Value: `http://localhost:4000`
   - Current Value: `http://localhost:4000`

### Step 3: Create Requests

#### Request 1: Get Info
- Method: GET
- URL: `{{baseURL}}/`

#### Request 2: Signup
- Method: POST
- URL: `{{baseURL}}/auth/signup`
- Headers: `Content-Type: application/json`
- Body: Raw JSON (use test data above)

#### Request 3: Signin
- Method: POST
- URL: `{{baseURL}}/auth/signin`
- Headers: `Content-Type: application/json`
- Body: Raw JSON (use test data above)

### Step 4: Test Scripts (Optional)

Add this to the "Tests" tab of your Signup request:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
});
```

Add this to the "Tests" tab of your Signin request:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
});
```

---

## Quick Test Sequence

1. **Start your server**: `npm run dev`
2. **Test GET /**: Should return welcome message
3. **Test Signup**: Use the signup JSON data above
4. **Copy user credentials**: Save email/password from signup
5. **Test Signin**: Use the same email/password
6. **Verify tokens**: Both responses should include JWT tokens

## Common Error Responses

### 400 Bad Request
```json
{
    "success": false,
    "errors": [
        "Username must be at least 3 characters long",
        "Please provide a valid email address",
        "Password must be at least 6 characters long",
        "Passwords do not match"
    ]
}
```

### 401 Unauthorized
```json
{
    "success": false,
    "error": "Invalid email or password"
}
```

### 409 Conflict
```json
{
    "success": false,
    "error": "User with this email already exists"
}
```

### 500 Internal Server Error
```json
{
    "success": false,
    "error": "Internal server error"
}
```

---

## 3. PROFILE IMAGE ENDPOINTS

### Prerequisites for Image Testing:
1. **Login first** to get JWT token (use signin endpoint above)
2. **Copy the token** from login response
3. **Prepare test images** (JPEG, PNG, GIF, or WebP files under 5MB)

### 3.1 UPLOAD PROFILE IMAGE

### Request Details:
- **Method**: POST
- **URL**: `http://localhost:4000/auth/profile-image/upload`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
  ⚠️ **Don't add Content-Type** - Postman sets it automatically for form-data

### Request Body:
- **Type**: form-data
- **Key**: `profileImage` (type: File)
- **Value**: Select an image file from your computer

### Expected Success Response (Status: 200):
```json
{
    "message": "Profile image uploaded successfully",
    "imageUrl": "http://localhost:4000/uploads/profile-images/profile-1726934567890-123456789.jpg",
    "filename": "profile-1726934567890-123456789.jpg"
}
```

### How to Test in Postman:
1. Create new POST request
2. URL: `http://localhost:4000/auth/profile-image/upload`
3. **Headers** tab: Add `Authorization: Bearer YOUR_TOKEN`
4. **Body** tab: Select **form-data**
5. Add key `profileImage`, change type to **File**, select image
6. Click **Send**

---

### 3.2 GET PROFILE IMAGE

### Request Details:
- **Method**: GET
- **URL**: `http://localhost:4000/auth/profile-image`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Expected Success Response (if image exists):
```json
{
    "imageUrl": "http://localhost:4000/uploads/profile-images/profile-1726934567890-123456789.jpg",
    "filename": "profile-1726934567890-123456789.jpg"
}
```

### Expected Response (no image):
```json
{
    "message": "No profile image found"
}
```

---

### 3.3 UPDATE/CHANGE PROFILE IMAGE

### Request Details:
- **Method**: PUT
- **URL**: `http://localhost:4000/auth/profile-image/update`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Request Body:
- **Type**: form-data
- **Key**: `profileImage` (type: File)
- **Value**: Select a NEW image file

### Expected Success Response (Status: 200):
```json
{
    "message": "Profile image updated successfully",
    "imageUrl": "http://localhost:4000/uploads/profile-images/profile-1726934678901-987654321.jpg",
    "filename": "profile-1726934678901-987654321.jpg",
    "oldImageDeleted": true
}
```

---

### 3.4 DELETE PROFILE IMAGE

### Request Details:
- **Method**: DELETE
- **URL**: `http://localhost:4000/auth/profile-image/delete`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Expected Success Response (Status: 200):
```json
{
    "message": "Profile image deleted successfully",
    "deletedFile": "profile-1726934678901-987654321.jpg"
}
```

---

## COMPLETE PROFILE IMAGE TESTING WORKFLOW

### 🔄 **Step-by-Step Test Sequence:**

1. **Login** → Copy JWT token from response
2. **Get Profile Image** → Should return "No profile image found"
3. **Upload Image** → Upload first image (should succeed)
4. **Get Profile Image** → Should return the uploaded image URL
5. **Update Image** → Replace with different image
6. **Get Profile Image** → Should return new image URL
7. **Delete Image** → Remove the image
8. **Get Profile Image** → Should return "No profile image found" again

### 📋 **Postman Collection Setup:**

Create environment variables:
- `base_url`: `http://localhost:4000`
- `auth_token`: Will be set automatically

Add this script to your **Login request Tests tab**:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("auth_token", response.token);
}
```

Then use `{{auth_token}}` in Authorization headers: `Bearer {{auth_token}}`

### 🧪 **Error Testing:**

#### File Size Error (>5MB):
```json
{
    "error": "File too large. Maximum size is 5MB"
}
```

#### Invalid File Type:
```json
{
    "error": "Only image files are allowed (JPEG, PNG, GIF, WebP)"
}
```

#### No Authentication:
```json
{
    "error": "Access denied. No token provided"
}
```

#### Invalid Token:
```json
{
    "error": "Invalid token"
}
```

### 🎯 **Success Indicators:**

✅ **Upload**: Returns imageUrl, file appears in `uploads/profile-images/`
✅ **Update**: Returns new imageUrl, old file deleted
✅ **Delete**: File removed, database cleared
✅ **Get**: Returns current image or "not found"

### 🔗 **Image Verification:**
- Copy imageUrl and open in browser to verify image displays
- Check `backend/uploads/profile-images/` folder for physical files
- Images are accessible at: `http://localhost:4000/uploads/profile-images/filename.jpg`