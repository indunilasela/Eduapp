# Video Management API Guide

## Overview
The Video Management System allows users to upload, download, and manage educational videos within subjects. Videos require admin approval before being visible to all users.

**Video Approval Workflow:**
1. Any authenticated user can upload videos
2. Uploaded videos start with "pending" status
3. Only admin and uploader can see pending videos
4. Admin can approve or reject videos
5. Once approved, all users can see and download videos

## Permissions
- **Upload**: Authenticated users only
- **View Pending**: Admin and uploader only
- **View Approved**: All users (no authentication required)
- **Download/Stream**: All users for approved videos, admin/uploader for pending videos
- **Approve/Reject**: Admin only
- **Delete**: Admin users and the original uploader only

## File Support
Supported video formats:
- MP4 (`.mp4`) - Recommended for best compatibility
- AVI (`.avi`)
- QuickTime (`.mov`)
- Matroska (`.mkv`)
- WebM (`.webm`)

Maximum file size: 500MB

## API Endpoints

### 1. Upload Video
**POST** `/subjects/:subjectId/videos/upload`

**Authentication**: Required (Bearer token)

**Content-Type**: `multipart/form-data`

**Form Fields**:
```
videoFile: [File] (mp4, avi, mov, mkv, webm)
subject: "Mathematics" (Auto-filled from selected subject)
title: "Algebra Fundamentals - Chapter 1"
description: "Introduction to algebraic equations and basic operations" (Optional)
```

**Example Response**:
```json
{
  "success": true,
  "message": "Video uploaded successfully and pending approval",
  "videoId": "1703123456789_abc123def",
  "video": {
    "subjectId": "subject123",
    "subject": "Mathematics",
    "title": "Algebra Fundamentals - Chapter 1",
    "description": "Introduction to algebraic equations and basic operations",
    "fileName": "algebra_chapter1.mp4",
    "filePath": "/uploads/videos/1703123456789_abc123def.mp4",
    "fileSize": 157286400,
    "mimeType": "video/mp4",
    "status": "pending",
    "uploaderId": "user123",
    "uploaderName": "John Doe",
    "uploaderEmail": "john@example.com"
  }
}
```

### 2. Get Videos by Subject
**GET** `/subjects/:subjectId/videos`

**Authentication**: Optional (affects what videos are returned)

**Access Rules**:
- **No Authentication**: Only approved videos
- **Regular User**: Approved videos + their own pending videos
- **Admin**: All videos (pending, approved, rejected)

**Example Response** (for regular user):
```json
{
  "success": true,
  "videos": [
    {
      "id": "video123",
      "subjectId": "subject123",
      "subject": "Mathematics",
      "title": "Algebra Fundamentals - Chapter 1",
      "description": "Introduction to algebraic equations and basic operations",
      "fileName": "algebra_chapter1.mp4",
      "filePath": "/uploads/videos/1703123456789_abc123def.mp4",
      "fileSize": 157286400,
      "mimeType": "video/mp4",
      "status": "approved",
      "uploaderId": "user123",
      "uploaderName": "John Doe",
      "uploaderEmail": "john@example.com",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "approvedBy": "admin123",
      "approvedAt": "2024-01-01T11:00:00Z"
    }
  ],
  "totalVideos": 1,
  "userRole": "user",
  "message": "Showing approved videos + your pending videos"
}
```

### 3. Download/Stream Video
**GET** `/videos/:videoId/download`

**Authentication**: Optional (affects access permissions)

**Access Rules**:
- **Approved Videos**: Accessible by everyone (no auth needed)
- **Pending Videos**: Only admin and uploader can access
- **Rejected Videos**: Only admin can access

**Features**:
- **Full Download**: Downloads the complete video file
- **Video Streaming**: Supports HTTP range requests for video streaming
- **Progressive Download**: Allows video to start playing while downloading

**Usage**:
- For download: Direct GET request
- For streaming: Browser/video player automatically handles range requests

**Headers Supported**:
- `Range: bytes=0-1024` - For streaming/partial content requests
- `Authorization: Bearer token` - Optional, for accessing pending videos

**Error Response** (Access Denied):
```json
{
  "success": false,
  "error": "Video is pending approval and not accessible"
}
```

### 4. Delete Video
**DELETE** `/videos/:videoId`

**Authentication**: Required (Bearer token)

**Permissions**: Only admin users or the original uploader can delete videos

**Example Response**:
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

**Error Response** (Permission Denied):
```json
{
  "success": false,
  "error": "Permission denied. Only admin or uploader can delete videos."
}
```

## Admin Endpoints

### 5. Get Pending Videos (Admin Only)
**GET** `/admin/videos/pending`

**Authentication**: Required (Admin only)

**Example Response**:
```json
{
  "success": true,
  "videos": [
    {
      "id": "video456",
      "subjectId": "subject123",
      "subject": "Physics",
      "title": "Newton's Laws - Chapter 2",
      "description": "Detailed explanation of Newton's second law",
      "fileName": "newtons_laws.mp4",
      "status": "pending",
      "uploaderId": "user456",
      "uploaderName": "Jane Smith",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "totalPending": 1
}
```

### 6. Approve Video (Admin Only)
**PUT** `/admin/videos/:videoId/approve`

**Authentication**: Required (Admin only)

**Example Response**:
```json
{
  "success": true,
  "message": "Video approved successfully"
}
```

### 7. Reject Video (Admin Only)
**PUT** `/admin/videos/:videoId/reject`

**Authentication**: Required (Admin only)

**Example Response**:
```json
{
  "success": true,
  "message": "Video rejected successfully"
}
```

### 8. Get All Videos (Admin Only)
**GET** `/admin/videos`

**Authentication**: Required (Admin only)

**Example Response**:
```json
{
  "success": true,
  "videos": [...],
  "summary": {
    "total": 15,
    "pending": 3,
    "approved": 10,
    "rejected": 2
  },
  "groupedVideos": {
    "pending": [...],
    "approved": [...],
    "rejected": [...]
  }
}
```

## Usage Examples

### Frontend Upload Form (React/JavaScript)

```javascript
// Upload Video
const uploadVideo = async (subjectId, formData) => {
  const form = new FormData();
  form.append('videoFile', formData.videoFile);
  form.append('subject', formData.subject);
  form.append('title', formData.title);
  form.append('description', formData.description);

  const response = await fetch(`/api/subjects/${subjectId}/videos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  return await response.json();
};

// Get Videos for a Subject
const getSubjectVideos = async (subjectId) => {
  const response = await fetch(`/api/subjects/${subjectId}/videos`);
  return await response.json();
};

// Delete Video
const deleteVideo = async (videoId) => {
  const response = await fetch(`/api/videos/${videoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### Video Player Integration

```javascript
// Simple Video Player
const VideoPlayer = ({ videoId, title }) => {
  const videoUrl = `/api/videos/${videoId}/download`;
  
  return (
    <div className="video-player">
      <h3>{title}</h3>
      <video 
        controls 
        width="100%" 
        height="400"
        preload="metadata"
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

// Download Video
const downloadVideo = (videoId, fileName) => {
  const link = document.createElement('a');
  link.href = `/api/videos/${videoId}/download`;
  link.download = fileName;
  link.click();
};
```

### Upload Progress Tracking

```javascript
const uploadVideoWithProgress = (subjectId, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    const form = new FormData();
    form.append('videoFile', formData.videoFile);
    form.append('subject', formData.subject);
    form.append('title', formData.title);
    form.append('description', formData.description);

    xhr.open('POST', `/api/subjects/${subjectId}/videos/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(form);
  });
};
```

### Postman Testing

#### Upload Video Test:
1. **Method**: POST
2. **URL**: `http://localhost:4000/subjects/your-subject-id/videos/upload`
3. **Headers**: 
   - `Authorization: Bearer your-jwt-token`
4. **Body** (form-data):
   - `videoFile`: [Select video file]
   - `subject`: Mathematics
   - `title`: Algebra Chapter 1
   - `description`: Introduction to algebra

#### Get Videos Test:
1. **Method**: GET
2. **URL**: `http://localhost:4000/subjects/your-subject-id/videos`
3. **Headers**: None required

#### Stream Video Test:
1. **Method**: GET
2. **URL**: `http://localhost:4000/videos/your-video-id/download`
3. **Headers**: `Range: bytes=0-1024` (optional, for streaming)

#### Delete Video Test:
1. **Method**: DELETE
2. **URL**: `http://localhost:4000/videos/your-video-id`
3. **Headers**: `Authorization: Bearer your-jwt-token`

#### Admin Tests:

#### Get Pending Videos:
1. **Method**: GET
2. **URL**: `http://localhost:4000/admin/videos/pending`
3. **Headers**: `Authorization: Bearer admin-jwt-token`

#### Approve Video:
1. **Method**: PUT
2. **URL**: `http://localhost:4000/admin/videos/your-video-id/approve`
3. **Headers**: `Authorization: Bearer admin-jwt-token`

#### Reject Video:
1. **Method**: PUT
2. **URL**: `http://localhost:4000/admin/videos/your-video-id/reject`
3. **Headers**: `Authorization: Bearer admin-jwt-token`

#### Get All Videos (Admin):
1. **Method**: GET
2. **URL**: `http://localhost:4000/admin/videos`
3. **Headers**: `Authorization: Bearer admin-jwt-token`

## Database Structure

### Videos Collection (`videos`)
```json
{
  "id": "unique_video_id",
  "subjectId": "subject_id",
  "subject": "Subject Name",
  "title": "Video Title",
  "description": "Video description",
  "fileName": "original_filename.mp4",
  "filePath": "/uploads/videos/unique_filename.mp4",
  "fileSize": 157286400,
  "mimeType": "video/mp4",
  "status": "pending" | "approved" | "rejected",
  "uploaderId": "user_id",
  "uploaderName": "User Name",
  "uploaderEmail": "user@email.com",
  "approvedBy": "admin_user_id", // Only present if approved/rejected
  "approvedAt": "2024-01-01T11:00:00Z", // Only present if approved/rejected
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

## Error Handling

Common error responses:

```json
// Missing file
{
  "success": false,
  "error": "Please select a video file to upload"
}

// Invalid file type
{
  "success": false,
  "error": "Only MP4, AVI, MOV, MKV, and WEBM video files are allowed"
}

// Missing required fields
{
  "success": false,
  "error": "Subject and title are required"
}

// File too large
{
  "success": false,
  "error": "File size too large. Maximum size is 500MB"
}

// Video not found
{
  "success": false,
  "error": "Video not found"
}

// Permission denied
{
  "success": false,
  "error": "Permission denied. Only admin or uploader can delete videos."
}

// Video pending approval
{
  "success": false,
  "error": "Video is pending approval and not accessible"
}

// Admin only access
{
  "success": false,
  "error": "Access denied. Admin privileges required"
}
```

## File Storage

Videos are stored in `/uploads/videos/` directory with unique filenames to prevent conflicts. The system automatically creates the directory if it doesn't exist.

## Video Streaming Features

### HTTP Range Requests Support
The API supports HTTP range requests for efficient video streaming:

- **Partial Content**: Returns 206 status with requested byte range
- **Progressive Loading**: Videos can start playing before fully downloaded
- **Bandwidth Optimization**: Only downloads requested portions
- **Seek Support**: Allows jumping to specific video positions

### Browser Compatibility
The streaming feature works with:
- HTML5 `<video>` elements
- Modern video players (Video.js, Plyr, etc.)
- Mobile browsers and apps

## Security Features

1. **Authentication**: Upload and delete operations require valid JWT tokens
2. **File Type Validation**: Only allowed video file types can be uploaded
3. **File Size Limits**: 500MB maximum file size (configurable)
4. **Permission Checks**: Only admin or uploader can delete videos
5. **Path Sanitization**: File paths are properly sanitized to prevent directory traversal attacks
6. **Public Access**: Download/streaming endpoints are public for easy content access

## Performance Considerations

### Upload Optimization
- **Large File Support**: 500MB limit for educational videos
- **Progress Tracking**: Upload progress monitoring support
- **Error Recovery**: Automatic cleanup of failed uploads

### Streaming Optimization
- **Range Request Support**: Efficient video streaming
- **MIME Type Detection**: Proper content-type headers
- **Caching Headers**: Can be extended with CDN caching

### Storage Recommendations
- **File Organization**: Videos stored by subject for better management
- **Backup Strategy**: Regular backup of video files recommended
- **CDN Integration**: Consider CDN for production deployment

## Integration with Subjects

The video system is integrated with the existing subjects system. Videos belong to specific subjects and can be organized by educational topics within each subject.

## Mobile App Considerations

### React Native Integration
```javascript
// Video upload in React Native
const uploadVideo = async (subjectId, videoUri) => {
  const formData = new FormData();
  formData.append('videoFile', {
    uri: videoUri,
    type: 'video/mp4',
    name: 'video.mp4'
  });
  formData.append('subject', subject);
  formData.append('title', title);
  formData.append('description', description);

  const response = await fetch(`${API_BASE}/subjects/${subjectId}/videos/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });

  return await response.json();
};
```

### Video Playback
- Use native video players for optimal performance
- Support for offline downloads (implement separately)
- Thumbnail generation (can be added as enhancement)