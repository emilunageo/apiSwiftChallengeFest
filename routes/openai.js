const express = require('express');
const {
  analyzeMeal,
  getAnalysisHistory,
  getAnalysis,
  submitFeedback,
  getAnalysisStats
} = require('../controllers/openaiController');

const router = express.Router();

// @route   POST /api/openai/analyze-meal
// @desc    Analyze meal with OpenAI and provide recommendations
// @access  Public
router.post('/analyze-meal', analyzeMeal);

// @route   GET /api/openai/history
// @desc    Get OpenAI analysis history
// @access  Public
router.get('/history', getAnalysisHistory);

// @route   GET /api/openai/analysis/:id
// @desc    Get single OpenAI analysis
// @access  Public
router.get('/analysis/:id', getAnalysis);

// @route   PUT /api/openai/analysis/:id/feedback
// @desc    Submit feedback for OpenAI analysis
// @access  Public
router.put('/analysis/:id/feedback', submitFeedback);

// @route   GET /api/openai/stats
// @desc    Get OpenAI analysis statistics
// @access  Public
router.get('/stats', getAnalysisStats);

module.exports = router;
