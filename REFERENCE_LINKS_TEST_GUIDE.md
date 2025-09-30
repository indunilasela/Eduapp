# Reference Links System - Quick Test Guide

## Test Setup
Your backend server is already running on http://localhost:4000

## Quick Test Steps

### 1. First, get a valid JWT token by logging in
```bash
# POST request to login
curl -X POST http://localhost:4000/login \
-H "Content-Type: application/json" \
-d '{"email":"your_email@example.com","password":"your_password"}'
```

### 2. Upload a reference link (replace YOUR_TOKEN with actual JWT)
```bash
curl -X POST http://localhost:4000/subjects/subject123/links/upload \
-H "Authorization: Bearer YOUR_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "url": "https://www.w3schools.com/html/",
  "title": "HTML Tutorial - W3Schools",
  "description": "Complete HTML tutorial and reference"
}'
```

### 3. Get reference links for a subject (public view)
```bash
curl http://localhost:4000/subjects/subject123/links
```

### 4. Get reference links (authenticated view)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
http://localhost:4000/subjects/subject123/links
```

### 5. Admin: Get pending links (admin token required)
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
http://localhost:4000/admin/links/pending
```

### 6. Admin: Approve a link (replace LINK_ID with actual ID)
```bash
curl -X PUT http://localhost:4000/admin/links/LINK_ID/approve \
-H "Authorization: Bearer ADMIN_TOKEN"
```

### 7. Test link redirect (replace LINK_ID with actual ID)
```bash
curl -L http://localhost:4000/links/LINK_ID/redirect
```

## Expected Behavior

1. **Upload**: Link uploaded with status "pending"
2. **Public View**: No links shown (not approved yet)
3. **Authenticated View**: User sees their own pending links
4. **Admin Pending**: Admin sees all pending links
5. **Admin Approve**: Link status changes to "approved"
6. **Public View (after approval)**: Link now visible to everyone
7. **Redirect**: Direct navigation to the actual URL with click tracking

## Features Implemented

✅ **URL Validation**: Invalid URLs are rejected  
✅ **Approval Workflow**: All links require admin approval  
✅ **Permission System**: Users manage own, admins manage all  
✅ **Click Tracking**: Counts and timestamps tracked  
✅ **Smart Redirect**: Direct redirect to actual URLs  
✅ **Mobile Compatible**: Works with mobile applications  

## Admin Features

- View all pending links waiting for approval
- Approve/reject links with one click
- View comprehensive statistics
- Manage all links regardless of uploader
- Track click analytics

## User Experience

- Upload links instantly (pending approval)
- View approved links immediately
- See own pending links in personal view
- Click through with automatic tracking
- Delete own uploaded links

The reference links system is now fully functional with the same robust approval workflow as the video system!