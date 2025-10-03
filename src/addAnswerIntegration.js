// Add Answer Integration
// This file integrates the Add Answer functionality with your existing server
// Add this at the end of your index.js file or import and call setupAddAnswerIntegration(app)

const { setupAddAnswerRoutes } = require('./addAnswerBackend');

function setupAddAnswerIntegration(app) {
  console.log('🔧 Setting up Add Answer integration...');
  
  try {
    // Setup Add Answer routes
    setupAddAnswerRoutes(app);
    
    // Add health check endpoint for Add Answer system
    app.get('/api/add-answer/health', (req, res) => {
      res.json({
        success: true,
        message: 'Add Answer system is running',
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /api/papers/:paperId/answers - Create new answer',
          'GET /api/papers/:paperId/answers - Get answers for paper',
          'GET /api/answers/:answerId - Get specific answer',
          'POST /api/answers/:answerId/vote - Vote on answer',
          'DELETE /api/answers/:answerId - Delete answer',
          'POST /api/answers/:answerId/comments - Add comment to answer',
          'GET /api/answers/:answerId/comments - Get answer comments',
          'DELETE /api/comments/:commentId - Delete comment',
          'POST /api/comments/:commentId/vote - Vote on comment',
          'GET /api/attachments/:attachmentId/download - Download attachment'
        ]
      });
    });
    
    console.log('✅ Add Answer integration completed successfully');
    console.log('📝 Available endpoints:');
    console.log('   POST /api/papers/:paperId/answers');
    console.log('   GET /api/papers/:paperId/answers');
    console.log('   GET /api/answers/:answerId');
    console.log('   POST /api/answers/:answerId/vote');
    console.log('   DELETE /api/answers/:answerId');
    console.log('   POST /api/answers/:answerId/comments');
    console.log('   GET /api/answers/:answerId/comments');
    console.log('   DELETE /api/comments/:commentId');
    console.log('   POST /api/comments/:commentId/vote');
    console.log('   GET /api/attachments/:attachmentId/download');
    console.log('   GET /api/add-answer/health');
    
  } catch (error) {
    console.error('❌ Error setting up Add Answer integration:', error.message);
    console.warn('⚠️ Add Answer functionality may not be available');
  }
}

// Export the integration function
module.exports = { setupAddAnswerIntegration };