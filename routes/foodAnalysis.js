const express = require('express');
const {
  analyzeFoods,
  getAnalysisHistory,
  getAnalysis,
  updateAnalysisFeedback,
  shareAnalysis,
  getAnalysisStats
} = require('../controllers/foodAnalysisController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/food-analysis/analyze
// @desc    Analyze detected foods and provide recommendations
// @access  Private
router.post('/analyze', auth, analyzeFoods);

// @route   GET /api/food-analysis/history
// @desc    Get user's food analysis history
// @access  Private
router.get('/history', auth, getAnalysisHistory);

// @route   GET /api/food-analysis/stats
// @desc    Get analysis statistics
// @access  Private
router.get('/stats', auth, getAnalysisStats);

// @route   GET /api/food-analysis/:id
// @desc    Get single food analysis
// @access  Private
router.get('/:id', auth, getAnalysis);

// @route   PUT /api/food-analysis/:id/feedback
// @desc    Update analysis with user feedback
// @access  Private
router.put('/:id/feedback', auth, updateAnalysisFeedback);

// @route   POST /api/food-analysis/:id/share
// @desc    Share analysis with healthcare provider
// @access  Private
router.post('/:id/share', auth, shareAnalysis);

module.exports = router;
