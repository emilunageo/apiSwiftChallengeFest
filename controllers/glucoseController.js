const GlucoseReading = require('../models/GlucoseReading');

// @desc    Create new glucose reading
// @route   POST /api/glucose/reading
// @access  Private
const createGlucoseReading = async (req, res) => {
  try {
    const {
      value,
      unit = 'mg/dL',
      readingType,
      mealContext = 'none',
      notes
    } = req.body;

    // Validate required fields
    if (!value || !readingType) {
      return res.status(400).json({
        success: false,
        message: 'Glucose value and reading type are required'
      });
    }

    // Create glucose reading
    const glucoseReading = new GlucoseReading({
      userId: req.user._id,
      value,
      unit,
      readingType,
      mealContext,
      notes
    });

    await glucoseReading.save();

    res.status(201).json({
      success: true,
      message: 'Glucose reading recorded successfully',
      data: {
        reading: glucoseReading
      }
    });

  } catch (error) {
    console.error('Create glucose reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current/latest glucose reading
// @route   GET /api/glucose/current
// @access  Private
const getCurrentGlucoseReading = async (req, res) => {
  try {
    const reading = await GlucoseReading.getLatestForUser(req.user._id);

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'No glucose readings found'
      });
    }

    res.json({
      success: true,
      data: {
        reading
      }
    });

  } catch (error) {
    console.error('Get current glucose reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get glucose readings history
// @route   GET /api/glucose/history
// @access  Private
const getGlucoseHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      readingType
    } = req.query;

    let query = {
      userId: req.user._id,
      isActive: true
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Add reading type filter if provided
    if (readingType) {
      query.readingType = readingType;
    }

    const skip = (page - 1) * limit;
    const readings = await GlucoseReading.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GlucoseReading.countDocuments(query);

    res.json({
      success: true,
      data: {
        readings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get glucose history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get glucose statistics
// @route   GET /api/glucose/stats
// @access  Private
const getGlucoseStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const stats = await GlucoseReading.getAverageForPeriod(req.user._id, parseInt(days));

    if (!stats || stats.length === 0) {
      return res.json({
        success: true,
        data: {
          stats: {
            averageGlucose: null,
            count: 0,
            minValue: null,
            maxValue: null,
            period: `${days} days`
          }
        }
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          ...stats[0],
          period: `${days} days`
        }
      }
    });

  } catch (error) {
    console.error('Get glucose stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Update glucose reading
// @route   PUT /api/glucose/reading/:id
// @access  Private
const updateGlucoseReading = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      value,
      unit,
      readingType,
      mealContext,
      notes
    } = req.body;

    const reading = await GlucoseReading.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found'
      });
    }

    // Update fields if provided
    if (value !== undefined) reading.value = value;
    if (unit !== undefined) reading.unit = unit;
    if (readingType !== undefined) reading.readingType = readingType;
    if (mealContext !== undefined) reading.mealContext = mealContext;
    if (notes !== undefined) reading.notes = notes;

    await reading.save();

    res.json({
      success: true,
      message: 'Glucose reading updated successfully',
      data: {
        reading
      }
    });

  } catch (error) {
    console.error('Update glucose reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Delete glucose reading (soft delete)
// @route   DELETE /api/glucose/reading/:id
// @access  Private
const deleteGlucoseReading = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await GlucoseReading.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Glucose reading not found'
      });
    }

    reading.isActive = false;
    await reading.save();

    res.json({
      success: true,
      message: 'Glucose reading deleted successfully'
    });

  } catch (error) {
    console.error('Delete glucose reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createGlucoseReading,
  getCurrentGlucoseReading,
  getGlucoseHistory,
  getGlucoseStats,
  updateGlucoseReading,
  deleteGlucoseReading
};
