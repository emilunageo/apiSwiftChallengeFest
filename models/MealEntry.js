const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  portion: {
    amount: {
      type: Number,
      required: false,
      min: 0,
      default: 100
    },
    unit: {
      type: String,
      enum: ['grams', 'ounces', 'cups', 'pieces', 'slices', 'tablespoons', 'teaspoons'],
      default: 'grams'
    }
  },
  nutritionalInfo: {
    calories: Number,
    carbohydrates: Number,
    protein: Number,
    fat: Number,
    fiber: Number,
    glycemicIndex: Number,
    glycemicLoad: Number
  },
  source: {
    type: String,
    enum: ['photo_detection', 'manual_entry', 'text_scan', 'database_search'],
    required: false,
    default: 'manual_entry'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

const mealEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: [true, 'Meal type is required']
  },
  items: [mealItemSchema],
  photos: [{
    url: String,
    caption: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  timing: {
    plannedTime: Date,
    actualTime: {
      type: Date,
      default: Date.now
    }
  },
  glucoseReadings: {
    before: {
      value: Number,
      timestamp: Date,
      source: {
        type: String,
        enum: ['manual', 'cgm', 'glucometer'],
        default: 'manual'
      }
    },
    after: [{
      value: Number,
      timestamp: Date,
      minutesAfterMeal: Number,
      source: {
        type: String,
        enum: ['manual', 'cgm', 'glucometer'],
        default: 'manual'
      }
    }]
  },
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodAnalysis'
  },
  totals: {
    calories: Number,
    carbohydrates: Number,
    protein: Number,
    fat: Number,
    fiber: Number,
    estimatedGlycemicLoad: Number
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'neutral', 'poor', 'terrible']
  },
  symptoms: [{
    type: String,
    enum: ['fatigue', 'headache', 'nausea', 'dizziness', 'hunger', 'thirst', 'none']
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    email: String,
    relationship: {
      type: String,
      enum: ['doctor', 'nutritionist', 'family', 'friend', 'caregiver']
    },
    permissions: {
      type: String,
      enum: ['view', 'comment'],
      default: 'view'
    }
  }],
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

// Virtual for meal duration (if after glucose readings exist)
mealEntrySchema.virtual('mealDuration').get(function() {
  if (!this.glucoseReadings.after || this.glucoseReadings.after.length === 0) {
    return null;
  }
  
  const lastReading = this.glucoseReadings.after[this.glucoseReadings.after.length - 1];
  return lastReading.minutesAfterMeal;
});

// Virtual for glucose response summary
mealEntrySchema.virtual('glucoseResponse').get(function() {
  if (!this.glucoseReadings.before || !this.glucoseReadings.after || this.glucoseReadings.after.length === 0) {
    return null;
  }
  
  const beforeValue = this.glucoseReadings.before.value;
  const afterValues = this.glucoseReadings.after.map(r => r.value);
  const maxAfter = Math.max(...afterValues);
  const peakReading = this.glucoseReadings.after.find(r => r.value === maxAfter);
  
  return {
    baseline: beforeValue,
    peak: maxAfter,
    peakTime: peakReading ? peakReading.minutesAfterMeal : null,
    increase: maxAfter - beforeValue,
    percentIncrease: ((maxAfter - beforeValue) / beforeValue * 100).toFixed(1)
  };
});

// Indexes for better query performance
mealEntrySchema.index({ userId: 1, 'timing.actualTime': -1 });
mealEntrySchema.index({ userId: 1, mealType: 1 });
mealEntrySchema.index({ 'timing.actualTime': 1 });

// Pre-save middleware to calculate totals
mealEntrySchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totals = {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      estimatedGlycemicLoad: 0
    };
    
    this.items.forEach(item => {
      if (item.nutritionalInfo) {
        this.totals.calories += item.nutritionalInfo.calories || 0;
        this.totals.carbohydrates += item.nutritionalInfo.carbohydrates || 0;
        this.totals.protein += item.nutritionalInfo.protein || 0;
        this.totals.fat += item.nutritionalInfo.fat || 0;
        this.totals.fiber += item.nutritionalInfo.fiber || 0;
        this.totals.estimatedGlycemicLoad += item.nutritionalInfo.glycemicLoad || 0;
      }
    });
  }
  next();
});

// Static method to get user's meal history
mealEntrySchema.statics.getUserMeals = function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  return this.find({
    userId,
    isActive: true
  })
  .populate('items.foodId', 'nombre id_tipo indice_glucemico')
  .populate('analysisId')
  .sort({ 'timing.actualTime': -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get meals by date range
mealEntrySchema.statics.getMealsByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    'timing.actualTime': { $gte: startDate, $lte: endDate },
    isActive: true
  })
  .populate('items.foodId', 'nombre id_tipo indice_glucemico')
  .sort({ 'timing.actualTime': -1 });
};

module.exports = mongoose.model('MealEntry', mealEntrySchema);
