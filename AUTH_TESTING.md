# Authentication API Testing Guide

## Server Status
Your server should be running on: `http://localhost:4000`

## Available Endpoints

### 1. Welcome Endpoint
**GET** `http://localhost:4000/`
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

### 2. User Signup
**POST** `http://localhost:4000/auth/signup`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "1726649200123_abc123def",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "errors": [
    "Username must be at least 3 characters long",
    "Passwords do not match"
  ]
}
```

### 3. User Signin
**POST** `http://localhost:4000/auth/signin`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Signin successful",
  "user": {
    "id": "1726649200123_abc123def",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

## Validation Rules

### Signup Validation:
- **Username**: Minimum 3 characters
- **Email**: Must be valid email format
- **Password**: Minimum 6 characters
- **Confirm Password**: Must match password

### Signin Validation:
- **Email**: Must be valid email format
- **Password**: Required

## Testing with Postman/Thunder Client

1. **Start the server**: `npm run dev`
2. **Test Signup**:
   - Method: POST
   - URL: `http://localhost:4000/auth/signup`
   - Headers: `Content-Type: application/json`
   - Body: JSON with username, email, password, confirmPassword

3. **Test Signin**:
   - Method: POST
   - URL: `http://localhost:4000/auth/signin`
   - Headers: `Content-Type: application/json`
   - Body: JSON with email, password

## Testing with cURL

### Signup:
```bash
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Signin:
```bash
curl -X POST http://localhost:4000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Features Implemented

✅ **User Registration (Signup)**
- Username, email, password validation
- Password confirmation check
- Duplicate email prevention
- Password hashing with bcrypt
- JWT token generation

✅ **User Authentication (Signin)**
- Email and password validation
- Password verification
- JWT token generation
- Secure error messages

✅ **Security Features**
- Password hashing (bcrypt)
- JWT tokens for session management
- Input validation and sanitization
- Proper error handling

## Notes

- Passwords are hashed using bcrypt before storing
- JWT tokens expire in 24 hours
- All emails are stored in lowercase
- Usernames are trimmed of whitespace
- Firestore is used for data storage