# Two-Step Password Reset API Guide

## Overview
The password reset process has been divided into two separate steps for better user experience:

1. **Step 1**: Verify OTP only
2. **Step 2**: Set new password after OTP verification

## Complete Flow

### Step 0: Request Password Reset
- **URL**: `POST /auth/forgot-password`
- **Purpose**: Send OTP to user's email
- **Body**: 
```json
{
  "email": "user@example.com"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "If an account with this email exists, you will receive a password reset email shortly."
}
```

### Step 1: Verify OTP
- **URL**: `POST /auth/verify-otp`
- **Purpose**: Verify the 6-digit OTP received via email
- **Body**: 
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```
- **Success Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully. You can now set your new password.",
  "nextStep": "Please provide your new password"
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

### Step 2: Set New Password
- **URL**: `POST /auth/reset-password`
- **Purpose**: Set new password after OTP verification
- **Body**: 
```json
{
  "email": "user@example.com",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```
- **Success Response**:
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now sign in with your new password."
}
```
- **Error Response**:
```json
{
  "success": false,
  "error": "OTP not verified or expired"
}
```

## Complete Testing Workflow

### 1. Request OTP
```bash
curl -X POST http://localhost:4000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

### 2. Verify OTP (Step 1)
```bash
curl -X POST http://localhost:4000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

### 3. Set New Password (Step 2)
```bash
curl -X POST http://localhost:4000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "newPassword": "mynewpassword123",
    "confirmPassword": "mynewpassword123"
  }'
```

### 4. Test Login with New Password
```bash
curl -X POST http://localhost:4000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "mynewpassword123"
  }'
```

## Postman Collection Updates

### Step 1: Verify OTP
```json
{
  "name": "Verify OTP (Step 1)",
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
      "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"otp\": \"{{otp_code}}\"\n}"
    },
    "url": {
      "raw": "{{base_url}}/auth/verify-otp",
      "host": ["{{base_url}}"],
      "path": ["auth", "verify-otp"]
    }
  }
}
```

### Step 2: Reset Password
```json
{
  "name": "Reset Password (Step 2)",
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
      "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"newPassword\": \"newpassword123\",\n  \"confirmPassword\": \"newpassword123\"\n}"
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

### Step 1 (OTP Verification):
- **Original OTP validity**: 1 hour from generation
- **One-time use**: OTP is marked as used after verification
- **Verification tracking**: Creates temporary verification record

### Step 2 (Password Reset):
- **Verification timeout**: 10 minutes to complete after OTP verification
- **Verification required**: Must complete Step 1 before Step 2
- **Automatic cleanup**: Verification record is cleared after password reset

## Error Handling

### Common Errors:

#### Step 1 Errors:
1. **Invalid OTP format**: 
   ```json
   {
     "success": false,
     "errors": ["Please provide a valid 6-digit verification code"]
   }
   ```

2. **Wrong/Expired OTP**:
   ```json
   {
     "success": false,
     "error": "Invalid or expired reset token"
   }
   ```

#### Step 2 Errors:
1. **OTP Not Verified**:
   ```json
   {
     "success": false,
     "error": "OTP not verified or expired"
   }
   ```

2. **Verification Expired**:
   ```json
   {
     "success": false,
     "error": "OTP verification has expired. Please verify OTP again."
   }
   ```

3. **Password Validation**:
   ```json
   {
     "success": false,
     "errors": [
       "New password must be at least 6 characters long",
       "Passwords do not match"
     ]
   }
   ```

## Database Collections

### 1. passwordResets
- Stores original OTP tokens
- 1-hour expiration
- Marked as used after Step 1

### 2. otpVerifications (New)
- Stores temporary verification status
- 10-minute expiration
- Created in Step 1, used in Step 2
- Automatically cleaned up

## Time Limits

| Step | Time Limit | Description |
|------|------------|-------------|
| OTP Generation | 1 hour | OTP remains valid for verification |
| OTP Verification | Instant | Once verified, creates 10-minute window |
| Password Reset | 10 minutes | Must complete password reset within 10 minutes of OTP verification |

## Frontend Integration

### Suggested UI Flow:

1. **Forgot Password Page**:
   - Email input field
   - "Send OTP" button

2. **OTP Verification Page**:
   - 6-digit OTP input (can be 6 separate boxes)
   - "Verify OTP" button
   - "Resend OTP" option

3. **New Password Page**:
   - New password field
   - Confirm password field
   - "Reset Password" button

### React Example Flow:
```javascript
// Step 1: Verify OTP
const verifyOTP = async (email, otp) => {
  const response = await fetch('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  
  if (response.ok) {
    // Navigate to password reset form
    navigate('/reset-password');
  }
};

// Step 2: Reset Password
const resetPassword = async (email, newPassword, confirmPassword) => {
  const response = await fetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword, confirmPassword })
  });
  
  if (response.ok) {
    // Navigate to login page
    navigate('/login');
  }
};
```

## Benefits of Two-Step Process

### User Experience:
- **Clear Progress**: Users know exactly what step they're on
- **Better Error Handling**: Specific feedback for each step
- **Mobile Friendly**: Easier to handle on mobile devices
- **Reduced Frustration**: Don't need to re-enter everything if one field is wrong

### Security:
- **Time-bounded**: Each step has appropriate time limits
- **Separation of Concerns**: OTP verification separate from password setting
- **Audit Trail**: Clear tracking of each step in the process

### Development:
- **Modular**: Each endpoint has single responsibility
- **Testable**: Each step can be tested independently
- **Maintainable**: Easier to modify individual steps

## Testing Checklist

- [ ] Request OTP via forgot-password
- [ ] Receive OTP in email
- [ ] Verify correct OTP (Step 1)
- [ ] Try invalid OTP (should fail)
- [ ] Set new password (Step 2)
- [ ] Try setting password without OTP verification (should fail)
- [ ] Test password validation errors
- [ ] Test OTP expiration (wait 1 hour)
- [ ] Test verification expiration (wait 10 minutes after Step 1)
- [ ] Login with new password
- [ ] Try to reuse OTP (should fail)

---

**The two-step process provides better UX and security!** 🔐✨