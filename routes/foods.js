const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const {
  getFoods,
  getFood,
  createFood,
  updateFood,
  deleteFood,
  getRecommendedFoods
} = require('../controllers/foodController');

const router = express.Router();

// @route   GET /api/foods/recommended
// @desc    Get recommended foods for diabetes
// @access  Public
router.get('/recommended', getRecommendedFoods);

// @route   GET /api/foods
// @desc    Get all foods with filtering and pagination
// @access  Public
router.get('/', getFoods);

// @route   GET /api/foods/:id
// @desc    Get single food
// @access  Public
router.get('/:id', getFood);

// @route   POST /api/foods
// @desc    Create new food
// @access  Private (for hackathon, could be public)
router.post('/', optionalAuth, createFood);

// @route   PUT /api/foods/:id
// @desc    Update food
// @access  Private
router.put('/:id', auth, updateFood);

// @route   DELETE /api/foods/:id
// @desc    Delete food (soft delete)
// @access  Private
router.delete('/:id', auth, deleteFood);

module.exports = router;
