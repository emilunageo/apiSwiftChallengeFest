const mongoose = require('mongoose');

const glucoseReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  value: {
    type: Number,
    required: [true, 'Glucose value is required'],
    min: [30, 'Glucose value must be at least 30 mg/dL'],
    max: [600, 'Glucose value must be less than 600 mg/dL']
  },
  unit: {
    type: String,
    enum: ['mg/dL', 'mmol/L'],
    default: 'mg/dL'
  },
  readingType: {
    type: String,
    enum: ['fasting', 'postprandial', 'random', 'bedtime', 'pre_meal', 'post_meal'],
    required: [true, 'Reading type is required']
  },
  mealContext: {
    type: String,
    enum: ['before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 
           'before_dinner', 'after_dinner', 'before_snack', 'after_snack', 'none'],
    default: 'none'
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for glucose level classification
glucoseReadingSchema.virtual('classification').get(function() {
  const value = this.unit === 'mmol/L' ? this.value * 18 : this.value; // Convert to mg/dL
  
  if (this.readingType === 'fasting') {
    if (value < 70) return 'low';
    if (value <= 100) return 'normal';
    if (value <= 125) return 'prediabetic';
    return 'diabetic';
  } else if (this.readingType === 'postprandial' || this.readingType === 'post_meal') {
    if (value < 70) return 'low';
    if (value <= 140) return 'normal';
    if (value <= 199) return 'prediabetic';
    return 'diabetic';
  } else {
    if (value < 70) return 'low';
    if (value <= 140) return 'normal';
    if (value <= 199) return 'elevated';
    return 'high';
  }
});

// Virtual for risk level
glucoseReadingSchema.virtual('riskLevel').get(function() {
  const classification = this.classification;
  switch (classification) {
    case 'low': return 'high';
    case 'normal': return 'low';
    case 'prediabetic':
    case 'elevated': return 'medium';
    case 'diabetic':
    case 'high': return 'high';
    default: return 'medium';
  }
});

// Indexes for better query performance
glucoseReadingSchema.index({ userId: 1, timestamp: -1 });
glucoseReadingSchema.index({ userId: 1, readingType: 1 });

// Static method to get latest reading for user
glucoseReadingSchema.statics.getLatestForUser = function(userId) {
  return this.findOne({
    userId,
    isActive: true
  }).sort({ timestamp: -1 });
};

// Static method to get readings in date range
glucoseReadingSchema.statics.getReadingsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: { $gte: startDate, $lte: endDate },
    isActive: true
  }).sort({ timestamp: -1 });
};

// Static method to get average glucose for period
glucoseReadingSchema.statics.getAverageForPeriod = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        averageGlucose: { $avg: '$value' },
        count: { $sum: 1 },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' }
      }
    }
  ]);
};

module.exports = mongoose.model('GlucoseReading', glucoseReadingSchema);
