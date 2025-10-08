const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const jwt = require('jsonwebtoken');
const { db, doc, setDoc, getDoc, query, collection, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy } = require('./database');

// ========================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ========================================

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/answers');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      console.error('❌ Error creating upload directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const extension = path.extname(file.originalname);
    const filename = `answer_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', 'application/x-zip-compressed',
    'text/x-python-script', 'application/javascript', 'text/html', 'text/css'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get user's vote status for an answer
async function getUserAnswerVote(answerId, userId) {
  if (!userId) return null;
  
  try {
    const voteId = `vote_${answerId}_${userId}`;
    const voteDoc = await getDoc(doc(db, 'answerVotes', voteId));
    
    if (voteDoc.exists()) {
      return voteDoc.data().voteType;
    }
    return null;
  } catch (error) {
    console.error('Error getting user answer vote:', error);
    return null;
  }
}

// Get user's vote status for a comment
async function getUserCommentVote(commentId, userId) {
  if (!userId) return null;
  
  try {
    const voteId = `vote_comment_${commentId}_${userId}`;
    const voteDoc = await getDoc(doc(db, 'commentVotes', voteId));
    
    if (voteDoc.exists()) {
      return voteDoc.data().voteType;
    }
    return null;
  } catch (error) {
    console.error('Error getting user comment vote:', error);
    return null;
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get user's vote status for an answer
async function getUserAnswerVote(answerId, userId) {
  if (!userId) return null;
  
  try {
    const voteId = `vote_${answerId}_${userId}`;
    const voteDoc = await getDoc(doc(db, 'answerVotes', voteId));
    
    if (voteDoc.exists()) {
      return voteDoc.data().voteType;
    }
    return null;
  } catch (error) {
    console.error('Error getting user answer vote:', error);
    return null;
  }
}

// Get user's vote status for a comment
async function getUserCommentVote(commentId, userId) {
  if (!userId) return null;
  
  try {
    const voteId = `vote_comment_${commentId}_${userId}`;
    const voteDoc = await getDoc(doc(db, 'commentVotes', voteId));
    
    if (voteDoc.exists()) {
      return voteDoc.data().voteType;
    }
    return null;
  } catch (error) {
    console.error('Error getting user comment vote:', error);
    return null;
  }
}

// ========================================
// ADD ANSWER FUNCTIONS
// ========================================

async function createPaperAnswer(paperId, answerData, userId, userName, attachments = []) {
  try {
    const answerId = `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process tags (convert comma-separated string to array)
    let tags = [];
    if (answerData.tags) {
      tags = answerData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      tags = tags.slice(0, 5); // Maximum 5 tags
    }

    // Process attachments
    let processedAttachments = [];
    if (attachments && attachments.length > 0) {
      processedAttachments = attachments.map(file => ({
        id: `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      }));
    }

    const answer = {
      id: answerId,
      paperId: paperId,
      userId: userId,
      userName: userName,
      title: answerData.title,
      content: answerData.content,
      tags: tags,
      attachments: processedAttachments,
      upvotes: 0,
      downvotes: 0,
      totalVotes: 0,
      isAccepted: false,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };

    await setDoc(doc(db, 'paperAnswers', answerId), answer);
    
    console.log(`✅ Paper answer created: ${answerId} for paper ${paperId}`);
    return { success: true, answerId, answer };
  } catch (error) {
    console.error('❌ Error creating paper answer:', error);
    return { success: false, error: error.message };
  }
}

async function getPaperAnswers(paperId, sortBy = 'votes', page = 1, limit = 10, userId = null) {
  try {
    // Simple query to avoid composite index requirement
    const q = query(
      collection(db, 'paperAnswers'),
      where('paperId', '==', paperId)
    );

    const querySnapshot = await getDocs(q);
    
    // Get all vote statuses in parallel for better performance
    const answerPromises = [];
    
    querySnapshot.forEach((docSnap) => {
      const answerData = docSnap.data();
      
      // Filter out deleted answers
      if (answerData.isDeleted === true) {
        return;
      }
      
      const answerPromise = (async () => {
        const userVote = await getUserAnswerVote(docSnap.id, userId);
        
        return {
          id: docSnap.id,
          answerId: answerData.id || docSnap.id,
          paperId: answerData.paperId,
          userId: answerData.userId,
          userName: answerData.userName || 'Unknown User',
          title: answerData.title,
          content: answerData.content,
          tags: answerData.tags || [],
          attachments: answerData.attachments || [],
          upvotes: answerData.upvotes || 0,
          downvotes: answerData.downvotes || 0,
          totalVotes: answerData.totalVotes || 0,
          isAccepted: answerData.isAccepted || false,
          commentsCount: answerData.commentsCount || 0,
          userVote: userVote, // null, 'upvote', or 'downvote'
          createdAt: answerData.createdAt?.toDate ? answerData.createdAt.toDate().toISOString() : answerData.createdAt,
          updatedAt: answerData.updatedAt?.toDate ? answerData.updatedAt.toDate().toISOString() : answerData.updatedAt
        };
      })();
      
      answerPromises.push(answerPromise);
    });
    
    const answers = await Promise.all(answerPromises);

    // Sort in memory to avoid Firebase index requirements
    answers.sort((a, b) => {
      // Always show accepted answers first
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;
      
      // Then sort by the requested criteria
      if (sortBy === 'votes') {
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else { // 'newest' or default
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedAnswers = answers.slice(startIndex, startIndex + limit);
    
    console.log(`✅ Retrieved ${paginatedAnswers.length} answers for paper ${paperId}`);
    return { 
      success: true, 
      answers: paginatedAnswers, 
      totalAnswers: answers.length,
      currentPage: page,
      totalPages: Math.ceil(answers.length / limit),
      hasNextPage: startIndex + limit < answers.length,
      hasPrevPage: page > 1
    };
  } catch (error) {
    console.error('❌ Error getting paper answers:', error);
    return { success: false, error: error.message };
  }
}

async function getAnswerById(answerId) {
  try {
    const answerDoc = await getDoc(doc(db, 'paperAnswers', answerId));
    
    if (!answerDoc.exists()) {
      return { success: false, error: 'Answer not found' };
    }

    const answerData = answerDoc.data();
    
    if (answerData.isDeleted) {
      return { success: false, error: 'Answer has been deleted' };
    }

    const answer = {
      id: answerDoc.id,
      answerId: answerData.id || answerDoc.id,
      paperId: answerData.paperId,
      userId: answerData.userId,
      userName: answerData.userName || 'Unknown User',
      title: answerData.title,
      content: answerData.content,
      tags: answerData.tags || [],
      attachments: answerData.attachments || [],
      upvotes: answerData.upvotes || 0,
      downvotes: answerData.downvotes || 0,
      totalVotes: answerData.totalVotes || 0,
      isAccepted: answerData.isAccepted || false,
      commentsCount: answerData.commentsCount || 0,
      createdAt: answerData.createdAt?.toDate ? answerData.createdAt.toDate().toISOString() : answerData.createdAt,
      updatedAt: answerData.updatedAt?.toDate ? answerData.updatedAt.toDate().toISOString() : answerData.updatedAt
    };

    console.log(`✅ Retrieved answer: ${answerId}`);
    return { success: true, answer };
  } catch (error) {
    console.error('❌ Error getting answer by ID:', error);
    return { success: false, error: error.message };
  }
}

async function voteOnAnswer(answerId, userId, voteType) {
  try {
    const voteId = `vote_${answerId}_${userId}`;
    
    // Check if user already voted
    const existingVoteDoc = await getDoc(doc(db, 'answerVotes', voteId));
    const answerDoc = await getDoc(doc(db, 'paperAnswers', answerId));
    
    if (!answerDoc.exists()) {
      return { success: false, error: 'Answer not found' };
    }

    const answerData = answerDoc.data();
    let upvotes = answerData.upvotes || 0;
    let downvotes = answerData.downvotes || 0;

    if (existingVoteDoc.exists()) {
      // User already voted
      const existingVote = existingVoteDoc.data();
      
      if (existingVote.voteType === voteType) {
        // User is trying to vote the same way again - ignore it
        return {
          success: true,
          message: `Answer already ${voteType}d`,
          voteType: voteType,
          upvotes: upvotes,
          downvotes: downvotes,
          totalVotes: upvotes - downvotes,
          alreadyVoted: true
        };
      }
      
      // User is changing their vote - remove old vote first
      if (existingVote.voteType === 'upvote') {
        upvotes = Math.max(0, upvotes - 1);
      } else {
        downvotes = Math.max(0, downvotes - 1);
      }
    }

    // Add new vote
    if (voteType === 'upvote') {
      upvotes++;
    } else if (voteType === 'downvote') {
      downvotes++;
    }

    const totalVotes = upvotes - downvotes;

    // Update vote record
    await setDoc(doc(db, 'answerVotes', voteId), {
      id: voteId,
      answerId: answerId,
      userId: userId,
      voteType: voteType,
      createdAt: new Date()
    });

    // Update answer vote counts
    await updateDoc(doc(db, 'paperAnswers', answerId), {
      upvotes: upvotes,
      downvotes: downvotes,
      totalVotes: totalVotes,
      updatedAt: new Date()
    });

    console.log(`✅ Vote recorded: ${voteType} on answer ${answerId} by user ${userId}`);
    return { 
      success: true, 
      voteType,
      upvotes: upvotes,
      downvotes: downvotes,
      totalVotes: totalVotes
    };
  } catch (error) {
    console.error('❌ Error voting on answer:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// ADD ANSWER HTTP ENDPOINTS
// ========================================

function setupAddAnswerRoutes(app) {
  
  // Middleware to get user info from JWT token and fetch username from database
  const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      try {
        // Fetch username from database using userId
        const userDoc = await getDoc(doc(db, 'users', user.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          req.user = {
            ...user,
            username: userData.username || 'Unknown User'
          };
        } else {
          req.user = {
            ...user,
            username: 'Unknown User'
          };
        }
        
        next();
      } catch (error) {
        console.error('Error fetching user data:', error);
        req.user = {
          ...user,
          username: 'Unknown User'
        };
        next();
      }
    });
  };

  // Create a new answer for a paper
  app.post('/api/papers/:paperId/answers', authenticateToken, upload.array('attachments', 10), async (req, res) => {
    try {
      const { paperId } = req.params;
      const { title, content, tags } = req.body;
      const userId = req.user.userId;
      const userName = req.user.username;
      const attachments = req.files || [];

      // Validation
      if (!title || title.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Answer title must be at least 5 characters long'
        });
      }

      if (!content || content.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: 'Answer content must be at least 50 characters long'
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Answer title must not exceed 200 characters'
        });
      }

      // Create the answer
      const result = await createPaperAnswer(paperId, { title, content, tags }, userId, userName, attachments);
      
      if (!result.success) {
        // Clean up uploaded files if database operation failed
        for (const file of attachments) {
          try {
            await fs.unlink(file.path);
          } catch (error) {
            console.warn(`⚠️ Warning: Could not clean up file: ${file.path}`);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: result.error
        });
      }

      res.status(201).json({
        success: true,
        data: result.answer,
        message: 'Answer created successfully'
      });

    } catch (error) {
      console.error('❌ Error creating answer:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (cleanupError) {
            console.warn(`⚠️ Warning: Could not clean up file: ${file.path}`);
          }
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create answer'
      });
    }
  });

  // Get all answers for a paper
  app.get('/api/papers/:paperId/answers', async (req, res) => {
    try {
      const { paperId } = req.params;
      const { sortBy = 'votes', page = 1, limit = 10 } = req.query;
      
      // Get user ID from token if authenticated
      let userId = null;
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (error) {
          // Token invalid or missing, continue without user context
        }
      }

      const result = await getPaperAnswers(paperId, sortBy, parseInt(page), parseInt(limit), userId);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        data: {
          answers: result.answers,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalAnswers: result.totalAnswers,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting paper answers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve answers'
      });
    }
  });

  // Get specific answer by ID
  app.get('/api/answers/:answerId', async (req, res) => {
    try {
      const { answerId } = req.params;

      const result = await getAnswerById(answerId);
      
      if (!result.success) {
        const statusCode = result.error.includes('not found') ? 404 : 500;
        return res.status(statusCode).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        data: result.answer
      });

    } catch (error) {
      console.error('❌ Error getting answer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve answer'
      });
    }
  });

  // Vote on an answer
  app.post('/api/answers/:answerId/vote', authenticateToken, async (req, res) => {
    try {
      const { answerId } = req.params;
      const { voteType } = req.body; // 'upvote' or 'downvote'
      const userId = req.user.userId;

      if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Vote type must be "upvote" or "downvote"'
        });
      }

      // Check if user is trying to vote on their own answer
      const answerDoc = await getDoc(doc(db, 'paperAnswers', answerId));
      if (!answerDoc.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      const answerData = answerDoc.data();
      if (answerData.userId === userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot vote on your own answer'
        });
      }

      const result = await voteOnAnswer(answerId, userId, voteType);
      
      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.error
        });
      }

      res.json({
        success: true,
        data: {
          voteType: result.voteType,
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          totalVotes: result.totalVotes
        },
        message: `Answer ${voteType}d successfully`
      });

    } catch (error) {
      console.error('❌ Error voting on answer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to vote on answer'
      });
    }
  });

  // Download attachment
  app.get('/api/attachments/:attachmentId/download', async (req, res) => {
    try {
      const { attachmentId } = req.params;
      
      // Find the attachment in any answer
      const answersQuery = query(collection(db, 'paperAnswers'));
      const answersSnapshot = await getDocs(answersQuery);
      
      let attachmentInfo = null;
      
      for (const answerDoc of answersSnapshot.docs) {
        const answerData = answerDoc.data();
        if (answerData.attachments) {
          const attachment = answerData.attachments.find(att => att.id === attachmentId);
          if (attachment) {
            attachmentInfo = attachment;
            break;
          }
        }
      }
      
      if (!attachmentInfo) {
        return res.status(404).json({
          success: false,
          message: 'Attachment not found'
        });
      }

      // Check if file exists
      try {
        await fs.access(attachmentInfo.filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${attachmentInfo.fileName}"`);
      res.setHeader('Content-Type', attachmentInfo.mimeType);
      
      // Send file
      res.sendFile(path.resolve(attachmentInfo.filePath));

    } catch (error) {
      console.error('❌ Error downloading attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download attachment'
      });
    }
  });

  // Delete answer (answer creator or admin only)
  app.delete('/api/answers/:answerId', authenticateToken, async (req, res) => {
    try {
      const { answerId } = req.params;
      const userId = req.user.userId;
      const userEmail = req.user.email;

      // Check if answer exists
      const answerDoc = await getDoc(doc(db, 'paperAnswers', answerId));
      if (!answerDoc.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      const answerData = answerDoc.data();

      // Check if user is the answer creator or admin
      const isAnswerCreator = answerData.userId === userId;
      const isAdmin = userEmail && (userEmail.toLowerCase() === 'i.asela016@gmail.com' || userEmail.toLowerCase().includes('admin'));

      if (!isAnswerCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own answers or you must be an admin.'
        });
      }
      
      console.log(`🗑️ Answer deletion authorized - User: ${userEmail}, IsCreator: ${isAnswerCreator}, IsAdmin: ${isAdmin}`);

      // Soft delete: Mark as deleted instead of actually removing
      await updateDoc(doc(db, 'paperAnswers', answerId), {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date()
      });

      // Delete associated votes
      try {
        const votesQuery = query(
          collection(db, 'answerVotes'),
          where('answerId', '==', answerId)
        );
        const votesSnapshot = await getDocs(votesQuery);
        
        const deletePromises = votesSnapshot.docs.map(voteDoc => 
          deleteDoc(doc(db, 'answerVotes', voteDoc.id))
        );
        
        await Promise.all(deletePromises);
        console.log(`🗑️ Deleted ${votesSnapshot.docs.length} votes for answer ${answerId}`);
      } catch (voteError) {
        console.error('⚠️ Error deleting votes:', voteError);
        // Continue even if vote deletion fails
      }

      // Clean up attachment files
      if (answerData.attachments && answerData.attachments.length > 0) {
        try {
          const fs = require('fs');
          for (const attachment of answerData.attachments) {
            if (fs.existsSync(attachment.filePath)) {
              fs.unlinkSync(attachment.filePath);
              console.log(`🗑️ Deleted file: ${attachment.fileName}`);
            }
          }
        } catch (fileError) {
          console.error('⚠️ Error deleting attachment files:', fileError);
          // Continue even if file deletion fails
        }
      }

      res.json({
        success: true,
        message: 'Answer deleted successfully',
        data: {
          answerId: answerId,
          deletedBy: isAdmin ? 'admin' : 'creator',
          deletedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error deleting answer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete answer'
      });
    }
  });

  // ========================================
  // COMMENT MANAGEMENT ENDPOINTS
  // ========================================

  // Add comment to an answer
  app.post('/api/answers/:answerId/comments', authenticateToken, async (req, res) => {
    try {
      const { answerId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;
      const userName = req.user.username;

      // Validate input
      if (!content || content.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Comment must be at least 5 characters long'
        });
      }

      if (content.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot exceed 500 characters'
        });
      }

      // Check if answer exists and is not deleted
      const answerDoc = await getDoc(doc(db, 'paperAnswers', answerId));
      if (!answerDoc.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      const answerData = answerDoc.data();
      if (answerData.isDeleted === true) {
        return res.status(404).json({
          success: false,
          message: 'Cannot comment on deleted answer'
        });
      }

      // Create comment
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const commentData = {
        id: commentId,
        answerId: answerId,
        userId: userId,
        userName: userName,
        content: content.trim(),
        upvotes: 0,
        downvotes: 0,
        totalVotes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      };

      // Save comment to database
      await setDoc(doc(db, 'answerComments', commentId), commentData);

      // Update answer's comment count
      await updateDoc(doc(db, 'paperAnswers', answerId), {
        commentsCount: (answerData.commentsCount || 0) + 1,
        updatedAt: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: {
          ...commentData,
          createdAt: commentData.createdAt.toISOString(),
          updatedAt: commentData.updatedAt.toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  });

  // Get comments for an answer
  app.get('/api/answers/:answerId/comments', async (req, res) => {
    try {
      const { answerId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      // Get user ID from token if authenticated
      let userId = null;
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (error) {
          // Token invalid or missing, continue without user context
        }
      }

      // Check if answer exists
      const answerDoc = await getDoc(doc(db, 'paperAnswers', answerId));
      if (!answerDoc.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Get comments for this answer
      const commentsQuery = query(
        collection(db, 'answerComments'),
        where('answerId', '==', answerId)
      );

      const commentsSnapshot = await getDocs(commentsQuery);
      let comments = [];
      
      // Get all comment vote statuses in parallel for better performance
      const commentPromises = [];

      commentsSnapshot.forEach((docSnap) => {
        const commentData = docSnap.data();
        
        // Filter out deleted comments
        if (commentData.isDeleted === true) {
          return;
        }
        
        const commentPromise = (async () => {
          const userVote = await getUserCommentVote(docSnap.id, userId);
          
          return {
            id: docSnap.id,
            commentId: commentData.id || docSnap.id,
            answerId: commentData.answerId,
            userId: commentData.userId,
            userName: commentData.userName || 'Unknown User',
            content: commentData.content,
            upvotes: commentData.upvotes || 0,
            downvotes: commentData.downvotes || 0,
            totalVotes: commentData.totalVotes || 0,
            userVote: userVote, // null, 'upvote', or 'downvote'
            createdAt: commentData.createdAt?.toDate ? commentData.createdAt.toDate().toISOString() : commentData.createdAt,
            updatedAt: commentData.updatedAt?.toDate ? commentData.updatedAt.toDate().toISOString() : commentData.updatedAt
          };
        })();
        
        commentPromises.push(commentPromise);
      });
      
      comments = await Promise.all(commentPromises);

      // Sort comments by creation date (newest first)
      comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Implement pagination
      const totalComments = comments.length;
      const totalPages = Math.ceil(totalComments / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedComments = comments.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          comments: paginatedComments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: totalPages,
            totalComments: totalComments,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments'
      });
    }
  });

  // Delete comment (comment creator or admin only)
  app.delete('/api/comments/:commentId', authenticateToken, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;
      const userEmail = req.user.email;

      // Check if comment exists
      const commentDoc = await getDoc(doc(db, 'answerComments', commentId));
      if (!commentDoc.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const commentData = commentDoc.data();

      // Check if user is the comment creator or admin  
      const isCommentCreator = commentData.userId === userId;
      const isAdmin = userEmail && (userEmail.toLowerCase() === 'i.asela016@gmail.com' || userEmail.toLowerCase().includes('admin'));

      if (!isCommentCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own comments or you must be an admin.'
        });
      }
      
      console.log(`🗑️ Comment deletion authorized - User: ${userEmail}, IsCreator: ${isCommentCreator}, IsAdmin: ${isAdmin}`);

      // Soft delete: Mark as deleted
      await updateDoc(doc(db, 'answerComments', commentId), {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date()
      });

      // Update answer's comment count
      try {
        const answerDoc = await getDoc(doc(db, 'paperAnswers', commentData.answerId));
        if (answerDoc.exists()) {
          const answerData = answerDoc.data();
          const newCount = Math.max((answerData.commentsCount || 1) - 1, 0);
          await updateDoc(doc(db, 'paperAnswers', commentData.answerId), {
            commentsCount: newCount,
            updatedAt: new Date()
          });
        }
      } catch (updateError) {
        console.error('⚠️ Error updating comment count:', updateError);
        // Continue even if count update fails
      }

      res.json({
        success: true,
        message: 'Comment deleted successfully',
        data: {
          commentId: commentId,
          deletedBy: isAdmin ? 'admin' : 'creator',
          deletedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete comment'
      });
    }
  });

  // Vote on comment
  app.post('/api/comments/:commentId/vote', authenticateToken, async (req, res) => {
    try {
      const { commentId } = req.params;
      const { voteType } = req.body; // 'upvote' or 'downvote'
      const userId = req.user.userId;

      if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Vote type must be "upvote" or "downvote"'
        });
      }

      // Check if comment exists and is not deleted
      const commentDoc = await getDoc(doc(db, 'answerComments', commentId));
      if (!commentDoc.exists()) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      const commentData = commentDoc.data();
      if (commentData.isDeleted === true) {
        return res.status(404).json({
          success: false,
          message: 'Cannot vote on deleted comment'
        });
      }

      // Check if user is trying to vote on their own comment
      if (commentData.userId === userId) {
        return res.status(400).json({
          success: false,
          message: 'You cannot vote on your own comment'
        });
      }

      // Check if user has already voted
      const voteId = `vote_comment_${commentId}_${userId}`;
      const existingVoteDoc = await getDoc(doc(db, 'commentVotes', voteId));

      let upvotes = commentData.upvotes || 0;
      let downvotes = commentData.downvotes || 0;

      if (existingVoteDoc.exists()) {
        const existingVote = existingVoteDoc.data();
        
        if (existingVote.voteType === voteType) {
          // User is trying to vote the same way again - ignore it (no change)
          return res.json({
            success: true,
            message: `Comment already ${voteType}d`,
            data: {
              voteType: voteType,
              upvotes: upvotes,
              downvotes: downvotes,
              totalVotes: upvotes - downvotes,
              alreadyVoted: true
            }
          });
        } else {
          // User is changing their vote
          await updateDoc(doc(db, 'commentVotes', voteId), {
            voteType: voteType,
            updatedAt: new Date()
          });
          
          // Remove old vote first
          if (existingVote.voteType === 'upvote') {
            upvotes = Math.max(upvotes - 1, 0);
          } else {
            downvotes = Math.max(downvotes - 1, 0);
          }
          
          // Add new vote
          if (voteType === 'upvote') {
            upvotes += 1;
          } else {
            downvotes += 1;
          }
        }
      } else {
        // New vote
        await setDoc(doc(db, 'commentVotes', voteId), {
          commentId: commentId,
          userId: userId,
          voteType: voteType,
          createdAt: new Date()
        });
        
        if (voteType === 'upvote') {
          upvotes += 1;
        } else {
          downvotes += 1;
        }
      }

      // Update comment vote counts
      const totalVotes = upvotes - downvotes;
      await updateDoc(doc(db, 'answerComments', commentId), {
        upvotes: upvotes,
        downvotes: downvotes,
        totalVotes: totalVotes,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: `Comment ${voteType}d successfully`,
        data: {
          voteType: voteType,
          upvotes: upvotes,
          downvotes: downvotes,
          totalVotes: totalVotes
        }
      });

    } catch (error) {
      console.error('❌ Error voting on comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to vote on comment'
      });
    }
  });

  console.log('✅ Add Answer routes initialized');
}

module.exports = {
  createPaperAnswer,
  getPaperAnswers,
  getAnswerById,
  voteOnAnswer,
  setupAddAnswerRoutes
};