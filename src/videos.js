const fs = require('fs');
const path = require('path');
const { db, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, updateDoc, orderBy } = require('./database');
const { authenticateToken, isAdmin, readUserData } = require('./auth');
const { uploadVideos, handleMulterError } = require('./config');

// ========================================
// VIDEO MANAGEMENT FUNCTIONS
// ========================================

async function createVideo(videoData) {
  try {
    const newVideo = {
      subjectId: videoData.subjectId,
      subject: videoData.subject,
      title: videoData.title,
      description: videoData.description || '',
      fileName: videoData.fileName,
      filePath: videoData.filePath,
      fileSize: videoData.fileSize,
      mimeType: videoData.mimeType,
      uploaderId: videoData.uploaderId,
      uploaderName: videoData.uploaderName,
      uploaderEmail: videoData.uploaderEmail,
      uploadedAt: new Date(),
      status: 'pending', // pending, approved, rejected
      viewCount: 0,
      downloadCount: 0,
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'videos'), newVideo);
    
    return {
      success: true,
      videoId: docRef.id,
      message: 'Video uploaded successfully and is pending approval',
      video: { id: docRef.id, ...newVideo }
    };
  } catch (error) {
    console.error('❌ Error creating video:', error);
    return { success: false, error: error.message };
  }
}

async function getVideosBySubject(subjectId, userRole = null, userId = null) {
  try {
    const videosRef = collection(db, 'videos');
    let q;

    if (userRole === 'admin') {
      // Admin can see all videos
      q = query(
        videosRef,
        where('subjectId', '==', subjectId),
        where('isActive', '==', true)
      );
    } else if (userRole === 'user' && userId) {
      // Authenticated users see approved videos + their own pending videos
      // We'll filter this in post-processing since Firestore doesn't support OR queries well
      q = query(
        videosRef,
        where('subjectId', '==', subjectId),
        where('isActive', '==', true)
      );
    } else {
      // Public users see only approved videos
      q = query(
        videosRef,
        where('subjectId', '==', subjectId),
        where('status', '==', 'approved'),
        where('isActive', '==', true)
      );
    }

    const querySnapshot = await getDocs(q);
    const videos = [];

    querySnapshot.forEach((doc) => {
      const videoData = doc.data();
      
      // Filter based on user role and permissions
      if (userRole === 'admin') {
        // Admin sees all videos
        videos.push({
          id: doc.id,
          ...videoData,
          uploadedAt: videoData.uploadedAt?.toDate ? videoData.uploadedAt.toDate() : videoData.uploadedAt
        });
      } else if (userRole === 'user' && userId) {
        // User sees approved videos + their own pending/rejected videos
        if (videoData.status === 'approved' || videoData.uploaderId === userId) {
          videos.push({
            id: doc.id,
            ...videoData,
            uploadedAt: videoData.uploadedAt?.toDate ? videoData.uploadedAt.toDate() : videoData.uploadedAt
          });
        }
      } else {
        // Public sees only approved videos (already filtered in query)
        videos.push({
          id: doc.id,
          ...videoData,
          uploadedAt: videoData.uploadedAt?.toDate ? videoData.uploadedAt.toDate() : videoData.uploadedAt
        });
      }
    });

    // Sort by upload date (newest first)
    videos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return { success: true, videos, totalVideos: videos.length };
  } catch (error) {
    console.error('❌ Error getting videos by subject:', error);
    return { success: false, error: error.message };
  }
}

async function getVideoById(videoId) {
  try {
    const videoDoc = await getDoc(doc(db, 'videos', videoId));
    
    if (!videoDoc.exists()) {
      return { success: false, error: 'Video not found' };
    }

    const videoData = videoDoc.data();
    return {
      success: true,
      data: {
        id: videoDoc.id,
        ...videoData,
        uploadedAt: videoData.uploadedAt?.toDate ? videoData.uploadedAt.toDate() : videoData.uploadedAt
      }
    };
  } catch (error) {
    console.error('❌ Error getting video by ID:', error);
    return { success: false, error: error.message };
  }
}

async function deleteVideo(videoId, userRole, userId) {
  try {
    const videoDoc = await getDoc(doc(db, 'videos', videoId));
    
    if (!videoDoc.exists()) {
      return { success: false, error: 'Video not found' };
    }

    const videoData = videoDoc.data();
    
    // Check permissions: admin or uploader can delete
    if (userRole !== 'admin' && videoData.uploaderId !== userId) {
      return { success: false, error: 'Permission denied. You can only delete your own videos.' };
    }

    const videoFilePath = path.join(__dirname, '..', videoData.filePath.replace('/uploads/', 'uploads/'));

    // Delete from database (soft delete)
    await updateDoc(doc(db, 'videos', videoId), {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Delete physical file
    if (fs.existsSync(videoFilePath)) {
      fs.unlinkSync(videoFilePath);
    }

    return { success: true, message: 'Video deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting video:', error);
    return { success: false, error: error.message };
  }
}

async function updateVideoStatus(videoId, status, adminId) {
  try {
    const videoRef = doc(db, 'videos', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return { success: false, error: 'Video not found' };
    }

    await updateDoc(videoRef, {
      status: status,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date()
    });

    const statusMessage = status === 'approved' ? 'Video approved successfully' : 
                         status === 'rejected' ? 'Video rejected' : 
                         'Video status updated';

    return { success: true, message: statusMessage };
  } catch (error) {
    console.error('❌ Error updating video status:', error);
    return { success: false, error: error.message };
  }
}

async function getPendingVideos() {
  try {
    const videosRef = collection(db, 'videos');
    const q = query(
      videosRef,
      where('status', '==', 'pending'),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const videos = [];

    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : doc.data().uploadedAt
      });
    });

    // Sort by upload date (oldest first for review)
    videos.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

    return { success: true, videos };
  } catch (error) {
    console.error('❌ Error getting pending videos:', error);
    return { success: false, error: error.message };
  }
}

async function getAllVideos(userRole = null) {
  try {
    const videosRef = collection(db, 'videos');
    let q;

    if (userRole === 'admin') {
      // Admin sees all videos
      q = query(videosRef, where('isActive', '==', true));
    } else {
      // Regular users see only approved videos
      q = query(
        videosRef,
        where('status', '==', 'approved'),
        where('isActive', '==', true)
      );
    }

    const querySnapshot = await getDocs(q);
    const videos = [];

    querySnapshot.forEach((doc) => {
      videos.push({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : doc.data().uploadedAt
      });
    });

    // Sort by upload date (newest first)
    videos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return { success: true, videos };
  } catch (error) {
    console.error('❌ Error getting all videos:', error);
    return { success: false, error: error.message };
  }
}

async function incrementVideoViewCount(videoId) {
  try {
    const videoRef = doc(db, 'videos', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return { success: false, error: 'Video not found' };
    }

    const currentCount = videoDoc.data().viewCount || 0;
    await updateDoc(videoRef, {
      viewCount: currentCount + 1,
      lastViewed: new Date()
    });

    return { success: true, viewCount: currentCount + 1 };
  } catch (error) {
    console.error('❌ Error incrementing video view count:', error);
    return { success: false, error: error.message };
  }
}

async function incrementVideoDownloadCount(videoId) {
  try {
    const videoRef = doc(db, 'videos', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return { success: false, error: 'Video not found' };
    }

    const currentCount = videoDoc.data().downloadCount || 0;
    await updateDoc(videoRef, {
      downloadCount: currentCount + 1,
      lastDownloaded: new Date()
    });

    return { success: true, downloadCount: currentCount + 1 };
  } catch (error) {
    console.error('❌ Error incrementing video download count:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// VIDEO HTTP ENDPOINTS
// ========================================

function setupVideoRoutes(app) {
  // Upload video endpoint
  app.post('/subjects/:subjectId/videos/upload', authenticateToken, (req, res, next) => {
    // Check content-type before processing
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be multipart/form-data'
      });
    }
    next();
  }, handleMulterError(uploadVideos.single('videoFile')), async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { subject, title, description } = req.body;
      const { userId, email } = req.user;

      // Log request details for debugging
      console.log('🎥 Video upload request:', {
        subjectId,
        subject,
        title,
        hasFile: !!req.file,
        contentType: req.headers['content-type']
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please select a video file to upload'
        });
      }

      // Validate required fields
      if (!subject || !title) {
        return res.status(400).json({
          success: false,
          error: 'Subject and title are required'
        });
      }

      // Get user data
      const userData = await readUserData(userId);
      if (!userData.success) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Create video data
      const videoData = {
        subjectId,
        subject,
        title,
        description: description || '',
        fileName: req.file.originalname,
        filePath: `/uploads/videos/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploaderId: userId,
        uploaderName: userData.data.firstName + ' ' + userData.data.lastName,
        uploaderEmail: email
      };

      const result = await createVideo(videoData);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          videoId: result.videoId,
          video: videoData
        });
      } else {
        // Delete uploaded file if database save failed
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Video upload error:', error);
      
      // Delete uploaded file if error occurred
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get videos by subject endpoint
  app.get('/subjects/:subjectId/videos', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const authHeader = req.headers['authorization'];
      let userRole = null;
      let userId = null;
      
      // Check if user is authenticated (optional for this endpoint)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.userId;
          
          // Check if user is admin
          const userData = await readUserData(userId);
          if (userData.success) {
            userRole = userData.data.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
          }
        } catch (jwtError) {
          // Invalid token, treat as public access
          console.log('Invalid or expired token, treating as public access');
        }
      }
      
      const result = await getVideosBySubject(subjectId, userRole, userId);
      
      if (result.success) {
        res.json({
          success: true,
          videos: result.videos,
          totalVideos: result.totalVideos,
          userRole: userRole,
          message: userRole === 'admin' ? 'Showing all videos (admin view)' : 
                  userRole === 'user' ? 'Showing approved videos + your pending videos' : 
                  'Showing approved videos only'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get videos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Download/Stream video endpoint (with approval system)
  app.get('/videos/:videoId/download', async (req, res) => {
    try {
      const { videoId } = req.params;
      const authHeader = req.headers['authorization'];
      let userRole = null;
      let userId = null;
      
      // Check if user is authenticated (optional)
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.userId;
          
          // Check if user is admin
          const userData = await readUserData(userId);
          if (userData.success) {
            userRole = userData.data.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
          }
        } catch (jwtError) {
          // Invalid token, treat as public access
        }
      }
      
      const videoDoc = await getDoc(doc(db, 'videos', videoId));
      
      if (!videoDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Video not found'
        });
      }
      
      const videoData = videoDoc.data();
      
      // Check access permissions
      const canAccess = 
        videoData.status === 'approved' || // Approved videos - public access
        userRole === 'admin' || // Admin can access all videos
        (userId && videoData.uploaderId === userId); // Uploader can access their own videos
      
      if (!canAccess) {
        return res.status(403).json({
          success: false,
          error: 'Video is pending approval and not accessible'
        });
      }
      
      const filePath = path.join(__dirname, '..', videoData.filePath.replace('/uploads/', 'uploads/'));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Video file not found on server'
        });
      }

      // Increment download count
      await incrementVideoDownloadCount(videoId);
      
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      if (range) {
        // Handle video streaming with range requests
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': videoData.mimeType,
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Send entire file
        const head = {
          'Content-Length': fileSize,
          'Content-Type': videoData.mimeType,
          'Content-Disposition': `attachment; filename="${videoData.fileName}"`,
        };
        
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
      
    } catch (error) {
      console.error('❌ Download video error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete video endpoint (admin and uploader only)
  app.delete('/videos/:videoId', authenticateToken, async (req, res) => {
    try {
      const { videoId } = req.params;
      const { userId } = req.user;
      
      // Get user data to check if admin
      const userData = await readUserData(userId);
      if (!userData.success) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const userRole = userData.data.email === 'i.asela016@gmail.com' ? 'admin' : 'user';
      
      const result = await deleteVideo(videoId, userRole, userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error.includes('Permission denied') ? 403 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Delete video error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // ===== ADMIN VIDEO MANAGEMENT ENDPOINTS =====

  // Get pending videos (admin only)
  app.get('/admin/videos/pending', authenticateToken, isAdmin, async (req, res) => {
    try {
      const result = await getPendingVideos();
      
      if (result.success) {
        res.json({
          success: true,
          videos: result.videos,
          totalPending: result.videos.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get pending videos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Approve video (admin only)
  app.put('/admin/videos/:id/approve', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      
      const result = await updateVideoStatus(id, 'approved', userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Approve video error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Reject video (admin only)
  app.put('/admin/videos/:id/reject', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      
      const result = await updateVideoStatus(id, 'rejected', userId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Reject video error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get all videos for admin management
  app.get('/admin/videos', authenticateToken, isAdmin, async (req, res) => {
    try {
      const result = await getAllVideos('admin');
      
      if (result.success) {
        res.json({
          success: true,
          videos: result.videos,
          totalVideos: result.videos.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get all videos error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

module.exports = {
  createVideo,
  getVideosBySubject,
  getVideoById,
  deleteVideo,
  updateVideoStatus,
  getPendingVideos,
  getAllVideos,
  incrementVideoViewCount,
  incrementVideoDownloadCount,
  setupVideoRoutes
};