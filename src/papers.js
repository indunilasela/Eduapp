const fs = require('fs');
const path = require('path');
const { db, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, updateDoc, orderBy } = require('./database');
const { authenticateToken, isAdmin, readUserData } = require('./auth');
const { uploadPDF, uploadAnswer } = require('./config');

// ========================================
// PAPER MANAGEMENT FUNCTIONS
// ========================================

async function createPaper(paperData) {
  try {
    const newPaper = {
      subjectId: paperData.subjectId,
      type: paperData.type, // 'past paper' or 'model paper'
      name: paperData.name,
      year: paperData.year,
      title: paperData.title || null,
      fileName: paperData.fileName,
      originalName: paperData.originalName,
      filePath: paperData.filePath,
      fileSize: paperData.fileSize,
      uploaderId: paperData.uploaderId,
      uploaderEmail: paperData.uploaderEmail,
      uploaderUsername: paperData.uploaderUsername,
      uploadedAt: new Date(),
      downloadCount: 0,
      isActive: true,
      status: 'active'
    };

    const docRef = await addDoc(collection(db, 'papers'), newPaper);
    
    return {
      success: true,
      paperId: docRef.id,
      paper: { id: docRef.id, ...newPaper }
    };
  } catch (error) {
    console.error('❌ Error creating paper:', error);
    return { success: false, error: error.message };
  }
}

async function getPapers(subjectId, type = null) {
  try {
    const papersRef = collection(db, 'papers');
    let q;

    if (type) {
      q = query(
        papersRef,
        where('subjectId', '==', subjectId),
        where('type', '==', type.toLowerCase()),
        where('isActive', '==', true)
      );
    } else {
      q = query(
        papersRef,
        where('subjectId', '==', subjectId),
        where('isActive', '==', true)
      );
    }

    const querySnapshot = await getDocs(q);
    const papers = [];

    querySnapshot.forEach((doc) => {
      papers.push({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : doc.data().uploadedAt
      });
    });

    // Sort by year (newest first), then by upload date
    papers.sort((a, b) => {
      const yearDiff = parseInt(b.year) - parseInt(a.year);
      if (yearDiff !== 0) return yearDiff;
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });

    return { success: true, papers };
  } catch (error) {
    console.error('❌ Error getting papers:', error);
    return { success: false, error: error.message };
  }
}

async function getPaperById(paperId) {
  try {
    const paperDoc = await getDoc(doc(db, 'papers', paperId));
    
    if (!paperDoc.exists()) {
      return { success: false, error: 'Paper not found' };
    }

    const paperData = paperDoc.data();
    return {
      success: true,
      data: {
        id: paperDoc.id,
        ...paperData,
        uploadedAt: paperData.uploadedAt?.toDate ? paperData.uploadedAt.toDate() : paperData.uploadedAt
      }
    };
  } catch (error) {
    console.error('❌ Error getting paper by ID:', error);
    return { success: false, error: error.message };
  }
}

async function deletePaper(paperId, userId, userRole) {
  try {
    const paperDoc = await getDoc(doc(db, 'papers', paperId));
    
    if (!paperDoc.exists()) {
      return { success: false, error: 'Paper not found' };
    }

    const paperData = paperData.data();
    
    // Check permissions: admin or uploader can delete
    if (userRole !== 'admin' && paperData.uploaderId !== userId) {
      return { success: false, error: 'Permission denied. You can only delete your own papers.' };
    }

    const paperFilePath = path.join(__dirname, '..', paperData.filePath);

    // Delete from database (soft delete)
    await updateDoc(doc(db, 'papers', paperId), {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Delete physical file
    if (fs.existsSync(paperFilePath)) {
      fs.unlinkSync(paperFilePath);
    }

    return { success: true, message: 'Paper deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting paper:', error);
    return { success: false, error: error.message };
  }
}

async function incrementDownloadCount(paperId) {
  try {
    const paperRef = doc(db, 'papers', paperId);
    const paperDoc = await getDoc(paperRef);
    
    if (!paperDoc.exists()) {
      return { success: false, error: 'Paper not found' };
    }

    const currentCount = paperDoc.data().downloadCount || 0;
    await updateDoc(paperRef, {
      downloadCount: currentCount + 1,
      lastDownloaded: new Date()
    });

    return { success: true, downloadCount: currentCount + 1 };
  } catch (error) {
    console.error('❌ Error incrementing download count:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// ANSWER MANAGEMENT FUNCTIONS
// ========================================

async function addAnswer(answerData) {
  try {
    const newAnswer = {
      paperId: answerData.paperId,
      title: answerData.title,
      description: answerData.description || '',
      fileName: answerData.fileName,
      originalFileName: answerData.originalFileName,
      filePath: answerData.filePath,
      fileSize: answerData.fileSize,
      uploadedBy: answerData.uploadedBy,
      uploaderName: answerData.uploaderName,
      uploaderEmail: answerData.uploaderEmail,
      uploadedAt: answerData.uploadedAt,
      downloadCount: 0,
      isActive: true
    };

    const docRef = await addDoc(collection(db, 'answers'), newAnswer);
    
    return {
      success: true,
      id: docRef.id,
      answer: { id: docRef.id, ...newAnswer }
    };
  } catch (error) {
    console.error('❌ Error adding answer:', error);
    return { success: false, error: error.message };
  }
}

async function getAnswersByPaper(paperId) {
  try {
    const answersRef = collection(db, 'answers');
    const q = query(
      answersRef,
      where('paperId', '==', paperId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const answers = [];

    querySnapshot.forEach((doc) => {
      answers.push({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : doc.data().uploadedAt
      });
    });

    // Sort by upload date (newest first)
    answers.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return { success: true, data: answers };
  } catch (error) {
    console.error('❌ Error getting answers by paper:', error);
    return { success: false, error: error.message };
  }
}

async function getAnswerById(answerId) {
  try {
    const answerDoc = await getDoc(doc(db, 'answers', answerId));
    
    if (!answerDoc.exists()) {
      return { success: false, error: 'Answer not found' };
    }

    const answerData = answerDoc.data();
    return {
      success: true,
      data: {
        id: answerDoc.id,
        ...answerData,
        uploadedAt: answerData.uploadedAt?.toDate ? answerData.uploadedAt.toDate() : answerData.uploadedAt
      }
    };
  } catch (error) {
    console.error('❌ Error getting answer by ID:', error);
    return { success: false, error: error.message };
  }
}

async function deleteAnswer(answerId, userId, userRole) {
  try {
    const answerDoc = await getDoc(doc(db, 'answers', answerId));
    
    if (!answerDoc.exists()) {
      return { success: false, error: 'Answer not found' };
    }

    const answerData = answerDoc.data();
    
    // Check permissions: admin or uploader can delete
    if (userRole !== 'admin' && answerData.uploadedBy !== userId) {
      return { success: false, error: 'Permission denied. You can only delete your own answers.' };
    }

    const answerFilePath = path.resolve(answerData.filePath);

    // Delete from database (soft delete)
    await updateDoc(doc(db, 'answers', answerId), {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Delete physical file
    if (fs.existsSync(answerFilePath)) {
      fs.unlinkSync(answerFilePath);
    }

    return { success: true, message: 'Answer deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting answer:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// PAPER HTTP ENDPOINTS
// ========================================

function setupPaperRoutes(app) {
  // Upload Paper endpoint
  app.post('/subjects/:subjectId/papers/upload', authenticateToken, uploadPDF.single('paperFile'), async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { type, name, year, title } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!type || !name || !year) {
        return res.status(400).json({
          success: false,
          error: 'Type, name, and year are required'
        });
      }

      if (!['past paper', 'model paper'].includes(type.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Type must be either "past paper" or "model paper"'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'PDF file is required'
        });
      }

      // Get user data for uploader info
      const userData = await readUserData(userId);
      if (!userData.success) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Verify subject exists
      const subjectData = await getDoc(doc(db, 'subjects', subjectId));
      if (!subjectData.exists()) {
        // Delete uploaded file if subject doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          error: 'Subject not found'
        });
      }

      const paperData = {
        subjectId: subjectId,
        type: type.toLowerCase(),
        name: name.trim(),
        year: year.trim(),
        title: title ? title.trim() : null,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: `/uploads/papers/${req.file.filename}`,
        fileSize: req.file.size,
        uploaderId: userId,
        uploaderEmail: userData.data.email,
        uploaderUsername: userData.data.username || userData.data.email
      };

      const result = await createPaper(paperData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Paper uploaded successfully',
          paperId: result.paperId,
          data: {
            ...paperData,
            id: result.paperId
          }
        });
      } else {
        // Delete uploaded file if database save failed
        fs.unlinkSync(req.file.path);
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      // Delete uploaded file if any error occurs
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('❌ Upload paper error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get Papers for Subject endpoint
  app.get('/subjects/:subjectId/papers', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { type } = req.query; // Optional filter by type

      const result = await getPapers(subjectId, type);

      if (result.success) {
        res.json({
          success: true,
          papers: result.papers,
          count: result.papers.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get papers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get Past Papers for Subject endpoint
  app.get('/subjects/:subjectId/papers/past', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const result = await getPapers(subjectId, 'past paper');

      if (result.success) {
        res.json({
          success: true,
          papers: result.papers,
          count: result.papers.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get past papers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get Model Papers for Subject endpoint
  app.get('/subjects/:subjectId/papers/model', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const result = await getPapers(subjectId, 'model paper');

      if (result.success) {
        res.json({
          success: true,
          papers: result.papers,
          count: result.papers.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get model papers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Download Paper endpoint
  app.get('/papers/:paperId/download', async (req, res) => {
    try {
      const { paperId } = req.params;
      
      const paperResult = await getPaperById(paperId);
      if (!paperResult.success) {
        return res.status(404).json({
          success: false,
          error: 'Paper not found'
        });
      }

      const paper = paperResult.data;
      const filePath = path.join(__dirname, '..', paper.filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Increment download count
      await incrementDownloadCount(paperId);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${paper.originalName}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (err) => {
        console.error('❌ Error streaming paper file:', err);
        res.status(500).json({
          success: false,
          error: 'Error downloading file'
        });
      });

    } catch (error) {
      console.error('❌ Download paper error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // View Paper endpoint (for viewing without downloading)
  app.get('/papers/:paperId/view', async (req, res) => {
    try {
      const { paperId } = req.params;
      
      const paperResult = await getPaperById(paperId);
      if (!paperResult.success) {
        return res.status(404).json({
          success: false,
          error: 'Paper not found'
        });
      }

      const paper = paperResult.data;
      const filePath = path.join(__dirname, '..', paper.filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }

      // Set headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (err) => {
        console.error('❌ Error streaming paper file for viewing:', err);
        res.status(500).json({
          success: false,
          error: 'Error viewing file'
        });
      });

    } catch (error) {
      console.error('❌ View paper error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete Paper endpoint
  app.delete('/papers/:paperId', authenticateToken, async (req, res) => {
    try {
      const { paperId } = req.params;
      const userId = req.user.userId;
      const userEmail = req.user.email;
      const userRole = userEmail === 'i.asela016@gmail.com' ? 'admin' : 'user';

      const result = await deletePaper(paperId, userId, userRole);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error.includes('Permission denied') ? 403 : 
                          result.error === 'Paper not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Delete paper error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Upload Answer for Paper endpoint
  app.post('/papers/:paperId/answers/upload', authenticateToken, uploadAnswer.single('answerFile'), async (req, res) => {
    try {
      const { paperId } = req.params;
      const { title, description } = req.body;
      const userId = req.user.userId;

      // Validation
      if (!title || !req.file) {
        return res.status(400).json({
          success: false,
          error: 'Title and answer file are required'
        });
      }

      // Verify the paper exists
      const paperCheck = await getPaperById(paperId);
      if (!paperCheck.success) {
        // Delete uploaded file if paper doesn't exist
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
        return res.status(404).json({
          success: false,
          error: 'Paper not found'
        });
      }

      // Get user data for uploader info
      const userData = await readUserData(userId);
      if (!userData.success) {
        return res.status(400).json({
          success: false,
          error: 'Unable to fetch user data'
        });
      }

      const answerData = {
        paperId: paperId,
        title: title.trim(),
        description: description ? description.trim() : '',
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: req.file.path.replace(/\\/g, '/'),
        fileSize: req.file.size,
        uploadedBy: userId,
        uploaderName: userData.data.fullName || 'Unknown',
        uploaderEmail: userData.data.email || 'unknown@example.com',
        uploadedAt: new Date()
      };

      const result = await addAnswer(answerData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Answer uploaded successfully',
          data: {
            id: result.id,
            paperId: paperId,
            title: answerData.title,
            description: answerData.description,
            fileName: answerData.fileName,
            originalFileName: answerData.originalFileName,
            uploadedBy: answerData.uploaderName,
            uploadedAt: answerData.uploadedAt
          }
        });
      } else {
        // Delete uploaded file on database error
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
        res.status(500).json({
          success: false,
          error: 'Failed to save answer data'
        });
      }
    } catch (error) {
      console.error('❌ Error uploading answer:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get Answers by Paper endpoint
  app.get('/papers/:paperId/answers', async (req, res) => {
    try {
      const { paperId } = req.params;

      // Verify the paper exists
      const paperCheck = await getPaperById(paperId);
      if (!paperCheck.success) {
        return res.status(404).json({
          success: false,
          error: 'Paper not found'
        });
      }

      const result = await getAnswersByPaper(paperId);

      if (result.success) {
        // Format response data
        const formattedAnswers = result.data.map(answer => ({
          id: answer.id,
          paperId: answer.paperId,
          title: answer.title,
          description: answer.description || '',
          originalFileName: answer.originalFileName,
          fileSize: answer.fileSize,
          uploadedBy: answer.uploaderName,
          uploadedAt: answer.uploadedAt
        }));

        res.json({
          success: true,
          data: formattedAnswers,
          total: formattedAnswers.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to retrieve answers'
        });
      }
    } catch (error) {
      console.error('❌ Error retrieving answers:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Download Answer endpoint
  app.get('/answers/:answerId/download', async (req, res) => {
    try {
      const { answerId } = req.params;

      const result = await getAnswerById(answerId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: 'Answer not found'
        });
      }

      const answer = result.data;
      const filePath = path.resolve(answer.filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'Answer file not found on server'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${answer.originalFileName}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (err) => {
        console.error('❌ Error streaming answer file:', err);
        res.status(500).json({
          success: false,
          error: 'Error downloading answer file'
        });
      });

    } catch (error) {
      console.error('❌ Error downloading answer:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete Answer endpoint
  app.delete('/answers/:answerId', authenticateToken, async (req, res) => {
    try {
      const { answerId } = req.params;
      const userId = req.user.userId;
      const userEmail = req.user.email;
      const userRole = userEmail === 'i.asela016@gmail.com' ? 'admin' : 'user';

      const result = await deleteAnswer(answerId, userId, userRole);

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error.includes('Permission denied') ? 403 : 
                          result.error === 'Answer not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Delete answer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

module.exports = {
  createPaper,
  getPapers,
  getPaperById,
  deletePaper,
  incrementDownloadCount,
  addAnswer,
  getAnswersByPaper,
  getAnswerById,
  deleteAnswer,
  setupPaperRoutes
};