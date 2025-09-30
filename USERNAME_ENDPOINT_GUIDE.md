# Username Endpoint Guide

## Overview
The `/auth/username` endpoint allows you to retrieve only the username of the currently authenticated user.

## Endpoint Details

### Get Username
- **URL**: `GET /auth/username`
- **Method**: GET
- **Authentication**: Required (Bearer Token)
- **Purpose**: Get only the username of the authenticated user

## Request Format

### Headers Required:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Example Request:
```bash
curl -X GET http://localhost:4000/auth/username \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Response Format

### Success Response:
```json
{
  "success": true,
  "username": "john_doe"
}
```

### Error Responses:

#### 1. No Token Provided:
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 2. Invalid/Expired Token:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### 3. User Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

## How to Get JWT Token

### 1. Sign Up or Sign In First:
```bash
# Sign In
curl -X POST http://localhost:4000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Extract Token from Response:
```json
{
  "success": true,
  "message": "Signin successful",
  "user": {
    "id": "12345",
    "username": "john_doe",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Use Token in Username Request:
```bash
curl -X GET http://localhost:4000/auth/username \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Postman Testing

### 1. Create New Request:
- Method: GET
- URL: `{{base_url}}/auth/username`

### 2. Add Authorization Header:
- Go to Headers tab
- Add header:
  - Key: `Authorization`
  - Value: `Bearer {{auth_token}}`

### 3. Set Environment Variables:
```json
{
  "base_url": "http://localhost:4000",
  "auth_token": "your_jwt_token_here"
}
```

### 4. Complete Postman Collection Entry:
```json
{
  "name": "Get Username",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}",
        "type": "text"
      }
    ],
    "url": {
      "raw": "{{base_url}}/auth/username",
      "host": ["{{base_url}}"],
      "path": ["auth", "username"]
    }
  }
}
```

## JavaScript Frontend Example

### Using Fetch:
```javascript
const getUsername = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('/auth/username', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Username:', data.username);
      return data.username;
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

### Using Axios:
```javascript
import axios from 'axios';

const getUsername = async () => {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await axios.get('/auth/username', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Username:', response.data.username);
    return response.data.username;
  } catch (error) {
    console.error('Error:', error.response?.data?.message || error.message);
  }
};
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const UserProfile = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsername = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/auth/username', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.success) {
          setUsername(data.username);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to fetch username');
      } finally {
        setLoading(false);
      }
    };

    fetchUsername();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Welcome, {username}!</h2>
    </div>
  );
};

export default UserProfile;
```

## Security Features

### 1. Protected Endpoint:
- Requires valid JWT token
- Token must be in Authorization header
- Token expiration is checked

### 2. Minimal Data Exposure:
- Returns only username
- No sensitive information exposed
- No password or email returned

### 3. Error Handling:
- Consistent error messages
- No user enumeration
- Proper HTTP status codes

## Use Cases

### 1. User Dashboard:
```javascript
// Display welcome message
const username = await getUsername();
document.getElementById('welcome').textContent = `Welcome, ${username}!`;
```

### 2. Profile Header:
```javascript
// Show username in navigation
const username = await getUsername();
document.getElementById('nav-username').textContent = username;
```

### 3. Conditional Rendering:
```javascript
// Show different content based on user
const username = await getUsername();
if (username === 'admin') {
  showAdminPanel();
}
```

## Testing Checklist

- [ ] Test with valid JWT token (should return username)
- [ ] Test without Authorization header (should return 401)
- [ ] Test with invalid token (should return 403)
- [ ] Test with expired token (should return 403)
- [ ] Test with malformed token (should return 403)
- [ ] Verify response format matches documentation
- [ ] Test with different user accounts
- [ ] Verify no sensitive data is exposed

## Troubleshooting

### Common Issues:

1. **"Access token required"**
   - Solution: Add Authorization header with Bearer token

2. **"Invalid or expired token"**
   - Solution: Sign in again to get a fresh token

3. **"User not found"**
   - Solution: Ensure the user account still exists in the database

4. **Empty username returned**
   - Check if username field exists in user data
   - Fallback logic returns 'User' if username is missing

---

**The username endpoint is ready to use!** 👤✨