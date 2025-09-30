const fs = require('fs');
const path = require('path');
const { db, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, updateDoc, orderBy } = require('./database');
const { authenticateToken, isAdmin, readUserData } = require('./auth');
const { uploadNotes, handleMulterError } = require('./config');

// ========================================
// NOTE MANAGEMENT FUNCTIONS
// ========================================

async function createNote(noteData) {
  try {
    const newNote = {
      subjectId: noteData.subjectId,
      type: noteData.type, // 'book' or 'short_note'
      subject: noteData.subject,
      lessonName: noteData.lessonName,
      description: noteData.description || '',
      fileName: noteData.fileName,
      filePath: noteData.filePath,
      fileSize: noteData.fileSize,
      mimeType: noteData.mimeType,
      uploaderId: noteData.uploaderId,
      uploaderName: noteData.uploaderName,
      uploaderEmail: noteData.uploaderEmail,
      uploadedAt: new Date(),
      downloadCount: 0,
      isActive: true
    };

    // Add specific fields based on note type
    if (noteData.type === 'book') {
      newNote.bookName = noteData.bookName;
    } else if (noteData.type === 'short_note') {
      newNote.title = noteData.title;
    }

    const docRef = await addDoc(collection(db, 'notes'), newNote);
    
    return {
      success: true,
      noteId: docRef.id,
      message: `${noteData.type === 'book' ? 'Book' : 'Short note'} uploaded successfully`,
      note: { id: docRef.id, ...newNote }
    };
  } catch (error) {
    console.error('❌ Error creating note:', error);
    return { success: false, error: error.message };
  }
}

async function getNotesBySubject(subjectId) {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('subjectId', '==', subjectId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const allNotes = [];

    querySnapshot.forEach((doc) => {
      allNotes.push({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : doc.data().uploadedAt
      });
    });

    // Separate books and short notes
    const books = allNotes.filter(note => note.type === 'book');
    const shortNotes = allNotes.filter(note => note.type === 'short_note');

    // Sort each category by upload date (newest first)
    books.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    shortNotes.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return { 
      success: true, 
      books, 
      shortNotes, 
      totalNotes: allNotes.length 
    };
  } catch (error) {
    console.error('❌ Error getting notes by subject:', error);
    return { success: false, error: error.message };
  }
}

async function getNoteById(noteId) {
  try {
    const noteDoc = await getDoc(doc(db, 'notes', noteId));
    
    if (!noteDoc.exists()) {
      return { success: false, error: 'Note not found' };
    }

    const noteData = noteDoc.data();
    return {
      success: true,
      data: {
        id: noteDoc.id,
        ...noteData,
        uploadedAt: noteData.uploadedAt?.toDate ? noteData.uploadedAt.toDate() : noteData.uploadedAt
      }
    };
  } catch (error) {
    console.error('❌ Error getting note by ID:', error);
    return { success: false, error: error.message };
  }
}

async function deleteNote(noteId, userRole, userId) {
  try {
    const noteDoc = await getDoc(doc(db, 'notes', noteId));
    
    if (!noteDoc.exists()) {
      return { success: false, error: 'Note not found' };
    }

    const noteData = noteDoc.data();
    
    // Check permissions: admin or uploader can delete
    if (userRole !== 'admin' && noteData.uploaderId !== userId) {
      return { success: false, error: 'Permission denied. You can only delete your own notes.' };
    }

    const noteFilePath = path.join(__dirname, '..', noteData.filePath.replace('/uploads/', 'uploads/'));

    // Delete from database (soft delete)
    await updateDoc(doc(db, 'notes', noteId), {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: userId
    });

    // Delete physical file
    if (fs.existsSync(noteFilePath)) {
      fs.unlinkSync(noteFilePath);
    }

    return { success: true, message: 'Note deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    return { success: false, error: error.message };
  }
}

async function incrementNoteDownloadCount(noteId) {
  try {
    const noteRef = doc(db, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      return { success: false, error: 'Note not found' };
    }

    const currentCount = noteDoc.data().downloadCount || 0;
    await updateDoc(noteRef, {
      downloadCount: currentCount + 1,
      lastDownloaded: new Date()
    });

    return { success: true, downloadCount: currentCount + 1 };
  } catch (error) {
    console.error('❌ Error incrementing note download count:', error);
    return { success: false, error: error.message };
  }
}

async function getNotesByType(subjectId, type) {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('subjectId', '==', subjectId),
      where('type', '==', type),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const notes = [];

    querySnapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate ? doc.data().uploadedAt.toDate() : doc.data().uploadedAt
      });
    });

    // Sort by upload date (newest first)
    notes.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return { success: true, notes };
  } catch (error) {
    console.error(`❌ Error getting ${type} notes:`, error);
    return { success: false, error: error.message };
  }
}

async function searchNotes(subjectId, searchQuery) {
  try {
    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('subjectId', '==', subjectId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const notes = [];

    querySnapshot.forEach((doc) => {
      const noteData = doc.data();
      
      // Simple text search in relevant fields
      const searchTerm = searchQuery.toLowerCase();
      const titleMatch = noteData.title?.toLowerCase().includes(searchTerm);
      const bookNameMatch = noteData.bookName?.toLowerCase().includes(searchTerm);
      const lessonMatch = noteData.lessonName?.toLowerCase().includes(searchTerm);
      const descMatch = noteData.description?.toLowerCase().includes(searchTerm);
      const subjectMatch = noteData.subject?.toLowerCase().includes(searchTerm);
      
      if (titleMatch || bookNameMatch || lessonMatch || descMatch || subjectMatch) {
        notes.push({
          id: doc.id,
          ...noteData,
          uploadedAt: noteData.uploadedAt?.toDate ? noteData.uploadedAt.toDate() : noteData.uploadedAt
        });
      }
    });

    // Sort by relevance and then by date
    notes.sort((a, b) => {
      const aRelevance = (a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                        (a.bookName?.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                        (a.lessonName?.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0);
      const bRelevance = (b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                        (b.bookName?.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                        (b.lessonName?.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0);
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
      
      return new Date(b.uploadedAt) - new Date(a.uploadedAt);
    });

    const books = notes.filter(note => note.type === 'book');
    const shortNotes = notes.filter(note => note.type === 'short_note');

    return { success: true, books, shortNotes, totalNotes: notes.length };
  } catch (error) {
    console.error('❌ Error searching notes:', error);
    return { success: false, error: error.message };
  }
}

// ========================================
// NOTE HTTP ENDPOINTS
// ========================================

function setupNoteRoutes(app) {
  // Upload notes endpoint (Book or Short Notes)
  app.post('/subjects/:subjectId/notes/upload', authenticateToken, (req, res, next) => {
    // Check content-type before processing
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type must be multipart/form-data'
      });
    }
    next();
  }, handleMulterError(uploadNotes.single('noteFile')), async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { noteType, subject, lessonName, bookName, title, description } = req.body;
      const { userId, email } = req.user;

      // Log request details for debugging
      console.log('📝 Note upload request:', {
        subjectId,
        noteType,
        subject,
        lessonName,
        hasFile: !!req.file,
        contentType: req.headers['content-type']
      });

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Please select a file to upload'
        });
      }

      // Validate required fields based on note type
      if (!noteType || !subject || !lessonName) {
        return res.status(400).json({
          success: false,
          error: 'Note type, subject, and lesson name are required'
        });
      }

      if (noteType === 'book' && !bookName) {
        return res.status(400).json({
          success: false,
          error: 'Book name is required for book notes'
        });
      }

      if (noteType === 'short_note' && !title) {
        return res.status(400).json({
          success: false,
          error: 'Title is required for short notes'
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

      // Create note data
      const noteData = {
        subjectId,
        type: noteType, // 'book' or 'short_note'
        subject,
        lessonName,
        description: description || '',
        fileName: req.file.originalname,
        filePath: `/uploads/notes/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploaderId: userId,
        uploaderName: userData.data.firstName + ' ' + userData.data.lastName,
        uploaderEmail: email
      };

      // Add specific fields based on note type
      if (noteType === 'book') {
        noteData.bookName = bookName;
      } else if (noteType === 'short_note') {
        noteData.title = title;
      }

      const result = await createNote(noteData);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          noteId: result.noteId,
          note: noteData
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
      console.error('❌ Note upload error:', error);
      
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

  // Get notes by subject endpoint
  app.get('/subjects/:subjectId/notes', async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { search, type } = req.query;
      
      let result;
      
      if (search) {
        result = await searchNotes(subjectId, search);
      } else if (type) {
        const typeResult = await getNotesByType(subjectId, type);
        if (typeResult.success) {
          // Format to match the expected response structure
          result = {
            success: true,
            books: type === 'book' ? typeResult.notes : [],
            shortNotes: type === 'short_note' ? typeResult.notes : [],
            totalNotes: typeResult.notes.length
          };
        } else {
          result = typeResult;
        }
      } else {
        result = await getNotesBySubject(subjectId);
      }
      
      if (result.success) {
        res.json({
          success: true,
          books: result.books,
          shortNotes: result.shortNotes,
          totalNotes: result.totalNotes
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get notes error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get books only endpoint
  app.get('/subjects/:subjectId/notes/books', async (req, res) => {
    try {
      const { subjectId } = req.params;
      
      const result = await getNotesByType(subjectId, 'book');
      
      if (result.success) {
        res.json({
          success: true,
          books: result.notes,
          totalBooks: result.notes.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get books error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get short notes only endpoint
  app.get('/subjects/:subjectId/notes/short', async (req, res) => {
    try {
      const { subjectId } = req.params;
      
      const result = await getNotesByType(subjectId, 'short_note');
      
      if (result.success) {
        res.json({
          success: true,
          shortNotes: result.notes,
          totalShortNotes: result.notes.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get short notes error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Download note endpoint (accessible to all users)
  app.get('/notes/:noteId/download', async (req, res) => {
    try {
      const { noteId } = req.params;
      
      const noteDoc = await getDoc(doc(db, 'notes', noteId));
      
      if (!noteDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      
      const noteData = noteDoc.data();
      const filePath = path.join(__dirname, '..', noteData.filePath.replace('/uploads/', 'uploads/'));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found on server'
        });
      }

      // Increment download count
      await incrementNoteDownloadCount(noteId);
      
      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${noteData.fileName}"`);
      res.setHeader('Content-Type', noteData.mimeType);
      
      // Send file
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('❌ Download note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // View note endpoint (for inline viewing)
  app.get('/notes/:noteId/view', async (req, res) => {
    try {
      const { noteId } = req.params;
      
      const noteDoc = await getDoc(doc(db, 'notes', noteId));
      
      if (!noteDoc.exists()) {
        return res.status(404).json({
          success: false,
          error: 'Note not found'
        });
      }
      
      const noteData = noteDoc.data();
      const filePath = path.join(__dirname, '..', noteData.filePath.replace('/uploads/', 'uploads/'));
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          error: 'File not found on server'
        });
      }
      
      // Set appropriate headers for inline viewing
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Type', noteData.mimeType);
      
      // Send file
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('❌ View note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete note endpoint (admin and uploader only)
  app.delete('/notes/:noteId', authenticateToken, async (req, res) => {
    try {
      const { noteId } = req.params;
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
      
      const result = await deleteNote(noteId, userRole, userId);
      
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
      console.error('❌ Delete note error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

module.exports = {
  createNote,
  getNotesBySubject,
  getNoteById,
  deleteNote,
  incrementNoteDownloadCount,
  getNotesByType,
  searchNotes,
  setupNoteRoutes
};