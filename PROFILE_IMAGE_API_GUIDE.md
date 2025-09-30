# Profile Image API Endpoints Guide

## Overview
This guide covers the complete profile image management system with upload, update, delete, and retrieve functionality.

## Available Endpoints

### 1. Upload Profile Image
- **URL**: `POST /auth/profile-image/upload`
- **Method**: POST
- **Authentication**: Required (Bearer Token)
- **Content-Type**: `multipart/form-data`
- **Purpose**: Upload a new profile image

### 2. Update Profile Image
- **URL**: `PUT /auth/profile-image/update`
- **Method**: PUT
- **Authentication**: Required (Bearer Token)
- **Content-Type**: `multipart/form-data`
- **Purpose**: Replace existing profile image

### 3. Delete Profile Image
- **URL**: `DELETE /auth/profile-image/delete`
- **Method**: DELETE
- **Authentication**: Required (Bearer Token)
- **Purpose**: Remove current profile image

### 4. Get Profile Image
- **URL**: `GET /auth/profile-image`
- **Method**: GET
- **Authentication**: Required (Bearer Token)
- **Purpose**: Retrieve current profile image information

## File Requirements

### Supported Formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### File Size Limit:
- Maximum: 5MB per file

### Storage Location:
- Server directory: `uploads/profile-images/`
- URL access: `http://localhost:4000/uploads/profile-images/filename`

## Request Examples

### 1. Upload Profile Image

#### Using cURL:
```bash
curl -X POST http://localhost:4000/auth/profile-image/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profileImage=@/path/to/your/image.jpg"
```

#### Using JavaScript Fetch:
```javascript
const uploadProfileImage = async (imageFile) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('profileImage', imageFile);

  try {
    const response = await fetch('/auth/profile-image/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    console.log('Upload result:', data);
    return data;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### Success Response:
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "profileImage": "/uploads/profile-images/profile-1695123456789-123456789.jpg",
  "imageUrl": "http://localhost:4000/uploads/profile-images/profile-1695123456789-123456789.jpg"
}
```

### 2. Update Profile Image

#### Using cURL:
```bash
curl -X PUT http://localhost:4000/auth/profile-image/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profileImage=@/path/to/new/image.png"
```

#### Using JavaScript:
```javascript
const updateProfileImage = async (imageFile) => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append('profileImage', imageFile);

  try {
    const response = await fetch('/auth/profile-image/update', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### 3. Delete Profile Image

#### Using cURL:
```bash
curl -X DELETE http://localhost:4000/auth/profile-image/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Using JavaScript:
```javascript
const deleteProfileImage = async () => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch('/auth/profile-image/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete failed:', error);
  }
};
```

#### Success Response:
```json
{
  "success": true,
  "message": "Profile image deleted successfully",
  "fileDeleted": true
}
```

### 4. Get Profile Image Info

#### Using cURL:
```bash
curl -X GET http://localhost:4000/auth/profile-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Using JavaScript:
```javascript
const getProfileImage = async () => {
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch('/auth/profile-image', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get failed:', error);
  }
};
```

#### Success Response (with image):
```json
{
  "success": true,
  "profileImage": "/uploads/profile-images/profile-1695123456789-123456789.jpg",
  "imageUrl": "http://localhost:4000/uploads/profile-images/profile-1695123456789-123456789.jpg"
}
```

#### Success Response (no image):
```json
{
  "success": true,
  "profileImage": null,
  "message": "No profile image set"
}
```

## React Component Examples

### Complete Profile Image Component:
```jsx
import React, { useState, useEffect } from 'react';

const ProfileImageManager = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load current profile image on component mount
  useEffect(() => {
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/auth/profile-image', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.profileImage) {
        setImageUrl(data.imageUrl);
      }
    } catch (error) {
      console.error('Failed to load profile image:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const url = imageUrl ? '/auth/profile-image/update' : '/auth/profile-image/upload';
      const method = imageUrl ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setImageUrl(data.imageUrl);
        alert('Profile image updated successfully!');
      } else {
        alert('Failed to upload image: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile image?')) {
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('/auth/profile-image/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setImageUrl('');
        alert('Profile image deleted successfully!');
      } else {
        alert('Failed to delete image: ' + data.error);
      }
    } catch (error) {
      alert('Delete failed: ' + error.message);
    }
  };

  return (
    <div className="profile-image-manager">
      <h3>Profile Image</h3>
      
      <div className="image-preview">
        {imageUrl ? (
          <div>
            <img 
              src={imageUrl} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%' }}
            />
            <br />
            <button onClick={handleImageDelete} disabled={uploading}>
              Delete Image
            </button>
          </div>
        ) : (
          <div style={{ width: '150px', height: '150px', border: '2px dashed #ccc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No Image
          </div>
        )}
      </div>

      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <p>Uploading...</p>}
      </div>
    </div>
  );
};

export default ProfileImageManager;
```

## Postman Collection

### Environment Variables:
```json
{
  "base_url": "http://localhost:4000",
  "auth_token": "your_jwt_token_here"
}
```

### Collection Requests:

#### 1. Upload Profile Image:
```json
{
  "name": "Upload Profile Image",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}"
      }
    ],
    "body": {
      "mode": "formdata",
      "formdata": [
        {
          "key": "profileImage",
          "type": "file",
          "src": "/path/to/image.jpg"
        }
      ]
    },
    "url": {
      "raw": "{{base_url}}/auth/profile-image/upload",
      "host": ["{{base_url}}"],
      "path": ["auth", "profile-image", "upload"]
    }
  }
}
```

#### 2. Update Profile Image:
```json
{
  "name": "Update Profile Image",
  "request": {
    "method": "PUT",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}"
      }
    ],
    "body": {
      "mode": "formdata",
      "formdata": [
        {
          "key": "profileImage",
          "type": "file",
          "src": "/path/to/new-image.png"
        }
      ]
    },
    "url": {
      "raw": "{{base_url}}/auth/profile-image/update",
      "host": ["{{base_url}}"],
      "path": ["auth", "profile-image", "update"]
    }
  }
}
```

#### 3. Delete Profile Image:
```json
{
  "name": "Delete Profile Image",
  "request": {
    "method": "DELETE",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}"
      }
    ],
    "url": {
      "raw": "{{base_url}}/auth/profile-image/delete",
      "host": ["{{base_url}}"],
      "path": ["auth", "profile-image", "delete"]
    }
  }
}
```

#### 4. Get Profile Image:
```json
{
  "name": "Get Profile Image",
  "request": {
    "method": "GET",
    "header": [
      {
        "key": "Authorization",
        "value": "Bearer {{auth_token}}"
      }
    ],
    "url": {
      "raw": "{{base_url}}/auth/profile-image",
      "host": ["{{base_url}}"],
      "path": ["auth", "profile-image"]
    }
  }
}
```

## Error Handling

### Common Error Responses:

#### 1. Authentication Errors:
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 2. File Validation Errors:
```json
{
  "success": false,
  "error": "Only image files (JPEG, PNG, GIF, WebP) are allowed"
}
```

#### 3. File Size Error:
```json
{
  "success": false,
  "error": "File too large"
}
```

#### 4. No File Provided:
```json
{
  "success": false,
  "error": "No image file provided"
}
```

#### 5. No Image to Delete:
```json
{
  "success": false,
  "error": "No profile image to delete"
}
```

## Security Features

### 1. Authentication Required:
- All endpoints require valid JWT token
- Token validation for each request

### 2. File Validation:
- Only image files allowed
- 5MB size limit
- MIME type checking

### 3. File Management:
- Automatic old image cleanup
- Unique filename generation
- Secure file path handling

### 4. Error Handling:
- Graceful failure handling
- File cleanup on errors
- Detailed error messages

## Database Schema

### User Collection Update:
```json
{
  "userId": "12345",
  "username": "john_doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "profileImage": "/uploads/profile-images/profile-1695123456789-123456789.jpg",
  "createdAt": "2025-09-21T10:00:00Z",
  "updatedAt": "2025-09-21T15:30:00Z"
}
```

## Testing Checklist

- [ ] Upload new profile image (POST)
- [ ] Update existing profile image (PUT)
- [ ] Delete profile image (DELETE)
- [ ] Get profile image info (GET)
- [ ] Test with invalid file types
- [ ] Test with oversized files
- [ ] Test without authentication token
- [ ] Test with expired token
- [ ] Verify old images are deleted
- [ ] Check image accessibility via URL
- [ ] Test concurrent uploads
- [ ] Verify database updates

## Production Considerations

### 1. File Storage:
- Consider cloud storage (AWS S3, Google Cloud)
- Implement CDN for faster image delivery
- Add image optimization/resizing

### 2. Security:
- Add rate limiting for uploads
- Implement virus scanning
- Add CSRF protection

### 3. Performance:
- Image compression
- Thumbnail generation
- Caching strategies

---

**Profile image management is now fully functional!** 📸✨