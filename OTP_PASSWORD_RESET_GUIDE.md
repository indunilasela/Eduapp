# OTP-Based Password Reset Testing Guide

## Overview
This guide explains how to test the updated forgot password functionality that now uses a 6-digit OTP (One-Time Password) instead of a long token.

## Updated Endpoints

### 1. Forgot Password (Unchanged)
- **URL**: `POST http://localhost:4000/auth/forgot-password`
- **Purpose**: Sends a 6-digit OTP to the user's email
- **Body**: 
```json
{
  "email": "user@example.com"
}
```

### 2. Reset Password (Updated)
- **URL**: `POST http://localhost:4000/auth/reset-password`
- **Purpose**: Resets the user's password using the 6-digit OTP
- **Body**: 
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

## Key Changes

### ✅ What's New:
1. **6-digit OTP**: Instead of long hex tokens, users receive a simple 6-digit code
2. **Better UX**: Easier for users to enter and remember
3. **Clear email template**: OTP is prominently displayed in the email
4. **Better validation**: Specific validation for 6-digit numeric codes

### ❌ What's Removed:
1. **Reset URLs**: No longer need clickable links
2. **Long tokens**: No more 64-character hex strings
3. **URL parameters**: Simplified reset process

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
   - Large, bold 6-digit OTP (e.g., 123456)
   - Clear instructions to enter the code
   - 1-hour expiration notice
   - No clickable links

### Step 2: Reset Password with OTP
1. **Extract the 6-digit OTP** from the email (e.g., 123456)
2. **Send POST request to `/auth/reset-password`**:
```json
{
  "email": "your-test-user@example.com",
  "otp": "123456",
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

### Updated Collection Requests:

#### Forgot Password (Unchanged)
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

#### Reset Password (Updated)
```json
{
  "name": "Reset Password with OTP",
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
      "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"otp\": \"123456\",\n  \"newPassword\": \"newpassword123\",\n  \"confirmPassword\": \"newpassword123\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/auth/reset-password",
      "host": ["{{base_url}}"],
      "path": ["auth", "reset-password"]
    }
  }
}
```

## Validation Rules

### OTP Validation:
- Must be exactly 6 digits
- Must contain only numbers (0-9)
- No spaces or special characters allowed
- Case-insensitive (numbers only)

### Example Valid OTPs:
- ✅ `123456`
- ✅ `000001`
- ✅ `999999`

### Example Invalid OTPs:
- ❌ `12345` (too short)
- ❌ `1234567` (too long)
- ❌ `12345a` (contains letter)
- ❌ `123 456` (contains space)
- ❌ `123-456` (contains hyphen)

## Error Handling

### New Error Messages:
1. **Invalid OTP format**: "Please provide a valid 6-digit verification code"
2. **Invalid OTP**: "Invalid or expired reset token"
3. **Expired OTP**: "Reset token has expired"

### Common Test Scenarios:

#### 1. Wrong OTP Format
```json
{
  "email": "test@example.com",
  "otp": "12345",  // Too short
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```
**Response**: 400 Bad Request with validation error

#### 2. Wrong OTP Value
```json
{
  "email": "test@example.com",
  "otp": "999999",  // Wrong code
  "newPassword": "newpass123",
  "confirmPassword": "newpass123"
}
```
**Response**: 400 Bad Request with "Invalid or expired reset token"

#### 3. Expired OTP
Test after 1 hour from OTP generation
**Response**: 400 Bad Request with "Reset token has expired"

## Security Features

### Enhanced Security:
1. **Time-based expiration**: OTPs expire after 1 hour
2. **Single use**: Each OTP can only be used once
3. **Numeric validation**: Only 6-digit numbers accepted
4. **Case-insensitive**: No confusion with letter cases
5. **Rate limiting ready**: Easy to implement rate limiting on OTP requests

### Database Storage:
- OTPs are stored as strings in Firestore
- Same expiration and usage tracking as before
- Collection: `passwordResets`

## Email Template Preview

```
📚 EduApp
Password Reset Request

Hello username,

We received a request to reset your password for your EduApp account. 
Please use the verification code below to reset your password:

    123456

Enter this 6-digit verification code to reset your password

⚠️ Security Notice:
• This verification code will expire in 1 hour
• If you didn't request this reset, please ignore this email
• Never share this verification code with anyone
• For security, we recommend changing your password regularly
```

## Frontend Integration

### Suggested UI:
1. **Email input field** for forgot password
2. **6-digit OTP input field** (can be 6 separate boxes or one field)
3. **New password fields** with confirmation
4. **Clear error messages** for validation
5. **Resend OTP button** (if implementing)

### Example Frontend Flow:
1. User enters email → sends forgot password request
2. User receives email with OTP
3. User enters OTP + new password → resets password
4. User can now login with new password

## Troubleshooting

### Common Issues:
1. **OTP not received**: Check email service configuration
2. **OTP expired**: Request a new one (users need to restart process)
3. **Invalid OTP**: Check for typos, ensure it's 6 digits
4. **Database errors**: Ensure Firestore is enabled

### Testing Tips:
1. **Use a real email** for testing to receive actual OTPs
2. **Test expiration** by waiting and trying expired OTPs
3. **Test validation** with various invalid formats
4. **Test one-time use** by trying to reuse an OTP

---

**The new OTP system is more user-friendly and secure!** 🔐✨