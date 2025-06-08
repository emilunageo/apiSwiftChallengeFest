const express = require('express');
const {
  createMealEntry,
  getMealEntries,
  getMealEntry,
  updateMealEntry,
  addGlucoseToMeal,
  deleteMealEntry
} = require('../controllers/mealController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/meals
// @desc    Create new meal entry
// @access  Private
router.post('/', auth, createMealEntry);

// @route   GET /api/meals
// @desc    Get user's meal entries
// @access  Private
router.get('/', auth, getMealEntries);

// @route   GET /api/meals/:id
// @desc    Get single meal entry
// @access  Private
router.get('/:id', auth, getMealEntry);

// @route   PUT /api/meals/:id
// @desc    Update meal entry
// @access  Private
router.put('/:id', auth, updateMealEntry);

// @route   POST /api/meals/:id/glucose
// @desc    Add glucose reading to meal
// @access  Private
router.post('/:id/glucose', auth, addGlucoseToMeal);

// @route   DELETE /api/meals/:id
// @desc    Delete meal entry (soft delete)
// @access  Private
router.delete('/:id', auth, deleteMealEntry);

module.exports = router;
