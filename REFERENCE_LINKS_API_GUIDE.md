# Reference Links Management API Guide

## Overview
Complete API guide for managing reference links with approval workflow system. Reference links are URLs that users can upload to subjects, requiring admin approval before being accessible to all users.

## System Features
- 📌 **URL Validation**: Automatic validation of URL format
- 🔒 **Approval Workflow**: Admin approval required for all links
- 👤 **Permission System**: Users can manage their own links, admins can manage all
- 📊 **Click Tracking**: Track click counts and last clicked time
- 🚀 **Smart Redirect**: Direct redirect to approved URLs
- 📱 **Mobile Compatible**: Full support for mobile applications

## Database Schema

### Reference Links Collection (`referenceLinks`)
```json
{
  "id": "1704123456789_abc123def",
  "subjectId": "subject123",
  "url": "https://example.com/resource",
  "title": "Example Resource",
  "description": "Optional description of the resource",
  "uploaderId": "user123",
  "uploaderName": "John Doe",
  "uploaderEmail": "john@example.com",
  "status": "pending", // pending, approved, rejected
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "approvedBy": "admin123",
  "approvedAt": "2024-01-01T11:00:00Z",
  "clickCount": 25,
  "lastClickedAt": "2024-01-01T15:30:00Z"
}
```

## API Endpoints

### 1. Upload Reference Link
**POST** `/subjects/:id/links/upload`

Upload a new reference link to a subject (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://example.com/resource",
  "title": "Example Resource Title",
  "description": "Optional description of the resource"
}
```

**Response (Success):**
```json
{
  "success": true,
  "linkId": "1704123456789_abc123def",
  "message": "Reference link uploaded successfully and pending approval"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "URL and title are required"
}
```

**Note:** The system automatically handles user field variations by using fallback values:
- `uploaderName`: Uses `user.name` → `user.username` → `user.email` → "Unknown User"
- `uploaderEmail`: Uses `user.email` → "Unknown Email"

### 2. Get Reference Links for Subject
**GET** `/subjects/:id/links`

Get all reference links for a subject (authentication optional).

**Headers (Optional):**
```
Authorization: Bearer <JWT_TOKEN>
```

**Access Levels:**
- **Public (No Auth)**: Only approved links
- **Authenticated Users**: Approved links + their own pending links
- **Admin**: All links (any status)

**Response:**
```json
{
  "success": true,
  "links": [
    {
      "id": "1704123456789_abc123def",
      "subjectId": "subject123",
      "url": "https://example.com/resource",
      "title": "Example Resource",
      "description": "Resource description",
      "uploaderId": "user123",
      "uploaderName": "John Doe",
      "status": "approved",
      "createdAt": "2024-01-01T10:00:00Z",
      "clickCount": 25
    }
  ],
  "totalLinks": 1
}
```

### 3. Redirect to Reference Link
**GET** `/links/:id/redirect`

Redirect to the actual URL (with click tracking).

**Response:**
- **Success**: HTTP 302 redirect to the actual URL
- **Error**: JSON error response

**Features:**
- Only works for approved links
- Automatically tracks click count
- Updates last clicked timestamp

### 4. Delete Reference Link
**DELETE** `/links/:id`

Delete a reference link (uploader or admin only).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Reference link deleted successfully"
}
```

## Admin Endpoints

### 5. Get Pending Reference Links (Admin Only)
**GET** `/admin/links/pending`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "links": [
    {
      "id": "1704123456789_abc123def",
      "subjectId": "subject123",
      "url": "https://example.com/resource",
      "title": "Example Resource",
      "uploaderId": "user123",
      "uploaderName": "John Doe",
      "uploaderEmail": "john@example.com",
      "status": "pending",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "totalPending": 1
}
```

### 6. Approve Reference Link (Admin Only)
**PUT** `/admin/links/:id/approve`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Reference link approved successfully"
}
```

### 7. Reject Reference Link (Admin Only)
**PUT** `/admin/links/:id/reject`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Reference link rejected successfully"
}
```

### 8. Get All Reference Links (Admin Only)
**GET** `/admin/links`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "links": [...],
  "summary": {
    "total": 10,
    "pending": 3,
    "approved": 6,
    "rejected": 1
  },
  "groupedLinks": {
    "pending": [...],
    "approved": [...],
    "rejected": [...]
  }
}
```

## Frontend Integration Examples

### Upload Reference Link Form (React/React Native)
```jsx
const uploadReferenceLink = async (subjectId, linkData) => {
  try {
    const response = await fetch(`http://your-server:3001/subjects/${subjectId}/links/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: linkData.url,
        title: linkData.title,
        description: linkData.description
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Link uploaded successfully and pending approval!');
      return result;
    } else {
      alert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Network error occurred');
  }
};

// Usage
const handleSubmit = () => {
  uploadReferenceLink('subject123', {
    url: 'https://example.com/resource',
    title: 'Helpful Resource',
    description: 'This is a great learning resource'
  });
};
```

### Display Reference Links Component
```jsx
const ReferenceLinks = ({ subjectId }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinks();
  }, [subjectId]);

  const fetchLinks = async () => {
    try {
      const response = await fetch(`http://your-server:3001/subjects/${subjectId}/links`, {
        headers: userToken ? {
          'Authorization': `Bearer ${userToken}`
        } : {}
      });

      const result = await response.json();
      if (result.success) {
        setLinks(result.links);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const openLink = (linkId) => {
    // Use the redirect endpoint for tracking
    window.open(`http://your-server:3001/links/${linkId}/redirect`, '_blank');
  };

  if (loading) return <div>Loading links...</div>;

  return (
    <div>
      <h3>Reference Links</h3>
      {links.map((link) => (
        <div key={link.id} className="link-card">
          <h4>{link.title}</h4>
          {link.description && <p>{link.description}</p>}
          <div>
            <button onClick={() => openLink(link.id)}>
              Open Link
            </button>
            <span className="status-badge status-{link.status}">
              {link.status}
            </span>
            {link.clickCount && (
              <span className="click-count">{link.clickCount} clicks</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### Admin Links Management Component
```jsx
const AdminLinksManagement = () => {
  const [pendingLinks, setPendingLinks] = useState([]);
  const [allLinks, setAllLinks] = useState([]);

  const fetchPendingLinks = async () => {
    const response = await fetch('http://your-server:3001/admin/links/pending', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const result = await response.json();
    if (result.success) {
      setPendingLinks(result.links);
    }
  };

  const approveLink = async (linkId) => {
    const response = await fetch(`http://your-server:3001/admin/links/${linkId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      alert('Link approved successfully!');
      fetchPendingLinks(); // Refresh list
    }
  };

  const rejectLink = async (linkId) => {
    const response = await fetch(`http://your-server:3001/admin/links/${linkId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const result = await response.json();
    if (result.success) {
      alert('Link rejected successfully!');
      fetchPendingLinks(); // Refresh list
    }
  };

  return (
    <div>
      <h2>Pending Links</h2>
      {pendingLinks.map((link) => (
        <div key={link.id} className="admin-link-card">
          <h4>{link.title}</h4>
          <p>URL: <a href={link.url} target="_blank">{link.url}</a></p>
          <p>Uploaded by: {link.uploaderName} ({link.uploaderEmail})</p>
          <p>Subject ID: {link.subjectId}</p>
          <div>
            <button onClick={() => approveLink(link.id)}>
              Approve
            </button>
            <button onClick={() => rejectLink(link.id)}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Postman Testing Collection

### Environment Variables
```json
{
  "server_url": "http://localhost:3001",
  "jwt_token": "your_jwt_token_here",
  "admin_token": "admin_jwt_token_here",
  "subject_id": "subject123",
  "link_id": "1704123456789_abc123def"
}
```

### Test Scenarios

#### 1. Upload Reference Link
```
POST {{server_url}}/subjects/{{subject_id}}/links/upload
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "url": "https://www.w3schools.com/html/",
  "title": "HTML Tutorial - W3Schools",
  "description": "Learn HTML basics and advanced concepts"
}
```

#### 2. Get Reference Links (Public)
```
GET {{server_url}}/subjects/{{subject_id}}/links
```

#### 3. Get Reference Links (Authenticated)
```
GET {{server_url}}/subjects/{{subject_id}}/links
Authorization: Bearer {{jwt_token}}
```

#### 4. Test Link Redirect
```
GET {{server_url}}/links/{{link_id}}/redirect
```

#### 5. Admin - Get Pending Links
```
GET {{server_url}}/admin/links/pending
Authorization: Bearer {{admin_token}}
```

#### 6. Admin - Approve Link
```
PUT {{server_url}}/admin/links/{{link_id}}/approve
Authorization: Bearer {{admin_token}}
```

#### 7. Admin - Get All Links
```
GET {{server_url}}/admin/links
Authorization: Bearer {{admin_token}}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": "URL and title are required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": "Permission denied. Only admin or uploader can delete reference links."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "Reference link not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Best Practices

### URL Validation
- Server validates URL format using `new URL()` constructor
- Consider adding domain whitelist/blacklist for security
- Monitor for malicious links in admin dashboard

### Security Considerations
- All uploads require authentication
- Admin approval prevents spam/malicious content
- Click tracking helps identify popular resources
- Permission checks on all operations

### Performance Tips
- Use pagination for large link collections
- Cache approved links for faster loading
- Consider CDN for frequently accessed resources
- Monitor click tracking for performance impact

### User Experience
- Clear status indicators (pending, approved, rejected)
- Responsive design for mobile compatibility
- Loading states for async operations
- Error messages for failed operations

## Workflow Summary

1. **User uploads link** → Link status: `pending`
2. **Admin reviews in dashboard** → Can approve/reject
3. **Approved links visible to all** → Available in subject view
4. **Users click links** → Redirected via tracking URL
5. **Analytics tracked** → Click counts and timestamps
6. **Management capabilities** → Delete own links, admin manages all

This system provides a complete reference links management solution with approval workflow, perfect for educational content curation.