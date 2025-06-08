const express = require('express');
const {
  createGlucoseReading,
  getCurrentGlucoseReading,
  getGlucoseHistory,
  getGlucoseStats,
  updateGlucoseReading,
  deleteGlucoseReading
} = require('../controllers/glucoseController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/glucose/reading
// @desc    Create new glucose reading
// @access  Private
router.post('/reading', auth, createGlucoseReading);

// @route   GET /api/glucose/current
// @desc    Get current/latest glucose reading
// @access  Private
router.get('/current', auth, getCurrentGlucoseReading);

// @route   GET /api/glucose/history
// @desc    Get glucose readings history
// @access  Private
router.get('/history', auth, getGlucoseHistory);

// @route   GET /api/glucose/stats
// @desc    Get glucose statistics
// @access  Private
router.get('/stats', auth, getGlucoseStats);

// @route   PUT /api/glucose/reading/:id
// @desc    Update glucose reading
// @access  Private
router.put('/reading/:id', auth, updateGlucoseReading);

// @route   DELETE /api/glucose/reading/:id
// @desc    Delete glucose reading (soft delete)
// @access  Private
router.delete('/reading/:id', auth, deleteGlucoseReading);

module.exports = router;
