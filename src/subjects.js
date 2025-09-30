const { db, doc, setDoc, getDoc, query, collection, where, getDocs, deleteDoc, addDoc, updateDoc, orderBy, limit } = require('./database');
const { authenticateToken, isAdmin } = require('./auth');

// ========================================
// SUBJECT MANAGEMENT FUNCTIONS
// ========================================

async function getAllSubjects() {
  try {
    const subjectsRef = collection(db, 'subjects');
    const querySnapshot = await getDocs(subjectsRef);
    const subjects = [];
    
    querySnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
      });
    });
    
    // Sort by creation date (newest first)
    subjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { success: true, subjects };
  } catch (error) {
    console.error('❌ Error getting all subjects:', error);
    return { success: false, error: error.message };
  }
}

async function getSubjectById(subjectId) {
  try {
    const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
    
    if (!subjectDoc.exists()) {
      return { success: false, error: 'Subject not found' };
    }
    
    const subjectData = subjectDoc.data();
    return {
      success: true,
      subject: {
        id: subjectDoc.id,
        ...subjectData,
        createdAt: subjectData.createdAt?.toDate ? subjectData.createdAt.toDate() : subjectData.createdAt,
        updatedAt: subjectData.updatedAt?.toDate ? subjectData.updatedAt.toDate() : subjectData.updatedAt
      }
    };
  } catch (error) {
    console.error('❌ Error getting subject by ID:', error);
    return { success: false, error: error.message };
  }
}

async function createSubject(subjectData, createdBy) {
  try {
    const newSubject = {
      name: subjectData.name,
      description: subjectData.description || '',
      category: subjectData.category || 'General',
      difficulty: subjectData.difficulty || 'Beginner',
      tags: subjectData.tags || [],
      imageUrl: subjectData.imageUrl || '',
      isActive: true,
      createdBy: createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      enrollmentCount: 0,
      paperCount: 0,
      videoCount: 0,
      noteCount: 0
    };
    
    const docRef = await addDoc(collection(db, 'subjects'), newSubject);
    
    return {
      success: true,
      subjectId: docRef.id,
      subject: { id: docRef.id, ...newSubject }
    };
  } catch (error) {
    console.error('❌ Error creating subject:', error);
    return { success: false, error: error.message };
  }
}

async function updateSubject(subjectId, updateData) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      return { success: false, error: 'Subject not found' };
    }
    
    const updatedData = {
      ...updateData,
      updatedAt: new Date()
    };
    
    await updateDoc(subjectRef, updatedData);
    
    const updatedDoc = await getDoc(subjectRef);
    const updatedSubject = updatedDoc.data();
    
    return {
      success: true,
      subject: {
        id: subjectId,
        ...updatedSubject,
        createdAt: updatedSubject.createdAt?.toDate ? updatedSubject.createdAt.toDate() : updatedSubject.createdAt,
        updatedAt: updatedSubject.updatedAt?.toDate ? updatedSubject.updatedAt.toDate() : updatedSubject.updatedAt
      }
    };
  } catch (error) {
    console.error('❌ Error updating subject:', error);
    return { success: false, error: error.message };
  }
}

async function deleteSubject(subjectId) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      return { success: false, error: 'Subject not found' };
    }
    
    // Soft delete by marking as inactive
    await updateDoc(subjectRef, {
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date()
    });
    
    return { success: true, message: 'Subject deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting subject:', error);
    return { success: false, error: error.message };
  }
}

async function searchSubjects(searchQuery, category = null) {
  try {
    const subjectsRef = collection(db, 'subjects');
    let q;
    
    if (category) {
      q = query(
        subjectsRef,
        where('category', '==', category),
        where('isActive', '==', true)
      );
    } else {
      q = query(
        subjectsRef,
        where('isActive', '==', true)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const subjects = [];
    
    querySnapshot.forEach((doc) => {
      const subjectData = doc.data();
      
      // Simple text search in name and description
      const searchTerm = searchQuery.toLowerCase();
      const nameMatch = subjectData.name?.toLowerCase().includes(searchTerm);
      const descMatch = subjectData.description?.toLowerCase().includes(searchTerm);
      const tagMatch = subjectData.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
      
      if (nameMatch || descMatch || tagMatch) {
        subjects.push({
          id: doc.id,
          ...subjectData,
          createdAt: subjectData.createdAt?.toDate ? subjectData.createdAt.toDate() : subjectData.createdAt,
          updatedAt: subjectData.updatedAt?.toDate ? subjectData.updatedAt.toDate() : subjectData.updatedAt
        });
      }
    });
    
    // Sort by relevance (name matches first, then description, then tags)
    subjects.sort((a, b) => {
      const aNameMatch = a.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const bNameMatch = b.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    return { success: true, subjects };
  } catch (error) {
    console.error('❌ Error searching subjects:', error);
    return { success: false, error: error.message };
  }
}

async function getSubjectsByCategory(category) {
  try {
    const subjectsRef = collection(db, 'subjects');
    const q = query(
      subjectsRef,
      where('category', '==', category),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const subjects = [];
    
    querySnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt
      });
    });
    
    subjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { success: true, subjects };
  } catch (error) {
    console.error('❌ Error getting subjects by category:', error);
    return { success: false, error: error.message };
  }
}

async function incrementSubjectStats(subjectId, statType) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);
    
    if (!subjectDoc.exists()) {
      return { success: false, error: 'Subject not found' };
    }
    
    const currentData = subjectDoc.data();
    const updateData = { updatedAt: new Date() };
    
    switch (statType) {
      case 'enrollment':
        updateData.enrollmentCount = (currentData.enrollmentCount || 0) + 1;
        break;
      case 'paper':
        updateData.paperCount = (currentData.paperCount || 0) + 1;
        break;
      case 'video':
        updateData.videoCount = (currentData.videoCount || 0) + 1;
        break;
      case 'note':
        updateData.noteCount = (currentData.noteCount || 0) + 1;
        break;
      default:
        return { success: false, error: 'Invalid stat type' };
    }
    
    await updateDoc(subjectRef, updateData);
    
    return { success: true, message: `Subject ${statType} count updated` };
  } catch (error) {
    console.error(`❌ Error incrementing subject ${statType} count:`, error);
    return { success: false, error: error.message };
  }
}

// ========================================
// SUBJECT HTTP ENDPOINTS
// ========================================

function setupSubjectRoutes(app) {
  // Get all subjects (public endpoint)
  app.get('/subjects', async (req, res) => {
    try {
      const { category, search } = req.query;
      
      let result;
      
      if (search) {
        result = await searchSubjects(search, category);
      } else if (category) {
        result = await getSubjectsByCategory(category);
      } else {
        result = await getAllSubjects();
      }
      
      if (result.success) {
        res.json({
          success: true,
          subjects: result.subjects,
          totalCount: result.subjects.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get subjects error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get specific subject by ID (public endpoint)
  app.get('/subjects/:subjectId', async (req, res) => {
    try {
      const { subjectId } = req.params;
      
      const result = await getSubjectById(subjectId);
      
      if (result.success) {
        res.json({
          success: true,
          subject: result.subject
        });
      } else {
        const statusCode = result.error === 'Subject not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Get subject by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Create new subject (admin only)
  app.post('/subjects', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { name, description, category, difficulty, tags, imageUrl } = req.body;
      const userId = req.user.userId;
      
      // Validate required fields
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Subject name is required'
        });
      }
      
      const subjectData = {
        name: name.trim(),
        description: description?.trim() || '',
        category: category || 'General',
        difficulty: difficulty || 'Beginner',
        tags: Array.isArray(tags) ? tags : [],
        imageUrl: imageUrl || ''
      };
      
      const result = await createSubject(subjectData, userId);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          subjectId: result.subjectId,
          subject: result.subject,
          message: 'Subject created successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Create subject error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Update subject (admin only)
  app.put('/subjects/:subjectId', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { name, description, category, difficulty, tags, imageUrl, isActive } = req.body;
      
      const updateData = {};
      
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (category !== undefined) updateData.category = category;
      if (difficulty !== undefined) updateData.difficulty = difficulty;
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const result = await updateSubject(subjectId, updateData);
      
      if (result.success) {
        res.json({
          success: true,
          subject: result.subject,
          message: 'Subject updated successfully'
        });
      } else {
        const statusCode = result.error === 'Subject not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Update subject error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Delete subject (admin only)
  app.delete('/subjects/:subjectId', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { subjectId } = req.params;
      
      const result = await deleteSubject(subjectId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error === 'Subject not found' ? 404 : 500;
        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('❌ Delete subject error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Get subject categories (public endpoint)
  app.get('/subjects/categories/list', async (req, res) => {
    try {
      const subjectsRef = collection(db, 'subjects');
      const q = query(subjectsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const categoriesSet = new Set();
      
      querySnapshot.forEach((doc) => {
        const subject = doc.data();
        if (subject.category) {
          categoriesSet.add(subject.category);
        }
      });
      
      const categories = Array.from(categoriesSet).sort();
      
      res.json({
        success: true,
        categories,
        totalCategories: categories.length
      });
    } catch (error) {
      console.error('❌ Get subject categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  searchSubjects,
  getSubjectsByCategory,
  incrementSubjectStats,
  setupSubjectRoutes
};