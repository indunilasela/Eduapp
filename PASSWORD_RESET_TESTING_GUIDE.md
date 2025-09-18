# Password Reset Testing Guide

## Overview
This guide explains how to test the forgot password and reset password functionality in your EduApp backend.

## New Endpoints Added

### 1. Forgot Password
- **URL**: `POST http://localhost:4000/auth/forgot-password`
- **Purpose**: Sends a password reset email to the user
- **Body**: 
```json
{
  "email": "user@example.com"
}
```

### 2. Reset Password
- **URL**: `POST http://localhost:4000/auth/reset-password`
- **Purpose**: Resets the user's password using the reset token
- **Body**: 
```json
{
  "email": "user@example.com",
  "resetToken": "abc123...",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

## Testing Steps

### Step 1: Request Password Reset
1. **Send POST request to `/auth/forgot-password`**:
```json
{
  "email": "your-test-user@example.com"
}
```

2. **Expected Response**:
```json
{
  "success": true,
  "message": "If an account with this email exists, you will receive a password reset email shortly."
}
```

3. **Check Email**: You should receive an email with:
   - Reset button link
   - Reset token (visible in email)
   - 1-hour expiration notice

### Step 2: Reset Password
1. **Extract the reset token** from the email you received
2. **Send POST request to `/auth/reset-password`**:
```json
{
  "email": "your-test-user@example.com",
  "resetToken": "the-token-from-email",
  "newPassword": "mynewpassword123",
  "confirmPassword": "mynewpassword123"
}
```

3. **Expected Response**:
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now sign in with your new password."
}
```

### Step 3: Test New Password
1. **Try signing in with the new password**:
```json
{
  "email": "your-test-user@example.com",
  "password": "mynewpassword123"
}
```

2. **Should succeed** and return JWT token

## Postman Testing

### Collection Update
Add these requests to your Postman collection:

```json
{
  "name": "Forgot Password",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"{{test_email}}\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/auth/forgot-password",
      "host": ["{{base_url}}"],
      "path": ["auth", "forgot-password"]
    }
  }
}
```

```json
{
  "name": "Reset Password",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"resetToken\": \"{{reset_token}}\",\n  \"newPassword\": \"newpassword123\",\n  \"confirmPassword\": \"newpassword123\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/auth/reset-password",
      "host": ["{{base_url}}"],
      "path": ["auth", "reset-password"]
    }
  }
}
```

## Security Features

### 1. Token Security
- Reset tokens are 32-byte random hex strings
- Tokens expire after 1 hour
- Tokens can only be used once
- Tokens are stored securely in Firestore

### 2. Email Security
- Reset emails don't reveal if the email exists in the system
- Reset URLs include both email and token for verification
- HTML and text versions of emails included

### 3. Password Security
- New passwords must be at least 6 characters
- Passwords are hashed with bcrypt before storage
- Password confirmation required

## Error Handling

### Common Errors:
1. **Invalid email format**: Returns 400 with validation error
2. **Invalid reset token**: Returns 400 with "Invalid or expired reset token"
3. **Expired token**: Returns 400 with "Reset token has expired"
4. **Password mismatch**: Returns 400 with "Passwords do not match"
5. **Email service error**: Logged but doesn't fail the request

## Database Collections

### Users Collection
- Stores user accounts with hashed passwords
- Updated when password is reset

### Password Resets Collection
- Stores reset tokens with metadata:
  - `email`: User's email
  - `resetToken`: The reset token
  - `createdAt`: When token was created
  - `expiresAt`: When token expires (1 hour)
  - `used`: Whether token has been used
  - `usedAt`: When token was used (if applicable)

## Frontend Integration

### Reset URL Format
The reset emails contain links in this format:
```
http://localhost:3000/reset-password?token=RESET_TOKEN&email=USER_EMAIL
```

You can customize the domain and path in `emailService.js` if needed.

## Troubleshooting

### 1. Emails Not Sending
- Check Gmail credentials in `.env` file
- Ensure Gmail app password is correctly configured
- Check server logs for email errors

### 2. Firestore Errors
- Ensure Firestore is enabled in Firebase Console
- Check Firebase configuration
- Verify network connectivity

### 3. Token Issues
- Tokens are case-sensitive
- Tokens expire after 1 hour
- Each token can only be used once

## Next Steps

1. **Test the endpoints** using Postman or curl
2. **Create a frontend** to handle the reset flow
3. **Customize email templates** if needed
4. **Add rate limiting** for production use
5. **Set up proper logging** for security monitoring

---

**Happy Testing!** 🚀