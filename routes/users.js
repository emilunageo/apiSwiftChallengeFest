const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  getUserStats
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', updateProfile);

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', changePassword);

// @route   DELETE /api/users/profile
// @desc    Deactivate user account
// @access  Private
router.delete('/profile', deactivateAccount);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', getUserStats);

module.exports = router;
