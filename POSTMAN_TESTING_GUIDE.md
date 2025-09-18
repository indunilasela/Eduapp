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