const mongoose = require('mongoose');

const detectedFoodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  matchedFoodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  },
  portion: {
    estimatedGrams: {
      type: Number,
      min: 0,
      default: 100
    },
    userAdjusted: {
      type: Boolean,
      default: false
    }
  },
  nutritionalData: {
    calories: Number,
    carbohydrates: Number,
    protein: Number,
    fat: Number,
    fiber: Number,
    glycemicIndex: Number,
    glycemicLoad: Number
  }
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['consumption_order', 'portion_adjustment', 'timing', 'pairing', 'avoidance'],
    required: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  reasoning: {
    type: String,
    maxlength: 300
  }
}, { _id: false });

const glucosePredictionSchema = new mongoose.Schema({
  peakTime: {
    type: Number, // minutes after consumption
    min: 15,
    max: 240
  },
  peakValue: {
    type: Number, // predicted mg/dL
    min: 70,
    max: 400
  },
  duration: {
    type: Number, // minutes
    min: 30,
    max: 360
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  }
}, { _id: false });

const foodAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  photoUrl: {
    type: String,
    trim: true
  },
  detectedFoods: [detectedFoodSchema],
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  currentGlucose: {
    value: {
      type: Number,
      min: 30,
      max: 600
    },
    timestamp: Date,
    source: {
      type: String,
      enum: ['manual', 'cgm', 'glucometer'],
      default: 'manual'
    }
  },
  analysis: {
    totalCalories: Number,
    totalCarbs: Number,
    totalProtein: Number,
    totalFat: Number,
    totalFiber: Number,
    averageGlycemicIndex: Number,
    totalGlycemicLoad: Number,
    estimatedDigestionTime: Number // minutes
  },
  glucosePrediction: glucosePredictionSchema,
  recommendations: [recommendationSchema],
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    helpful: Boolean,
    comments: {
      type: String,
      maxlength: 500
    },
    actualGlucoseResponse: {
      peakValue: Number,
      peakTime: Number,
      notes: String
    }
  },
  processingTime: {
    type: Number, // milliseconds
    min: 0
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: String, // email addresses
    trim: true
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

// Virtual for overall risk assessment
foodAnalysisSchema.virtual('overallRisk').get(function() {
  if (!this.analysis || !this.glucosePrediction) return 'unknown';
  
  const highGI = this.analysis.averageGlycemicIndex > 70;
  const highGL = this.analysis.totalGlycemicLoad > 20;
  const highRisk = this.glucosePrediction.riskLevel === 'high';
  
  if (highRisk || (highGI && highGL)) return 'high';
  if (this.glucosePrediction.riskLevel === 'medium' || highGI || highGL) return 'medium';
  return 'low';
});

// Indexes for better query performance
foodAnalysisSchema.index({ userId: 1, timestamp: -1 });
foodAnalysisSchema.index({ userId: 1, mealType: 1 });
foodAnalysisSchema.index({ 'glucosePrediction.riskLevel': 1 });

// Static method to get user's analysis history
foodAnalysisSchema.statics.getUserHistory = function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  return this.find({
    userId,
    isActive: true
  })
  .populate('detectedFoods.matchedFoodId', 'nombre id_tipo indice_glucemico')
  .sort({ timestamp: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get analysis statistics
foodAnalysisSchema.statics.getUserStats = function(userId, days = 30) {
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
        totalAnalyses: { $sum: 1 },
        averageRating: { $avg: '$userFeedback.rating' },
        highRiskMeals: {
          $sum: {
            $cond: [{ $eq: ['$glucosePrediction.riskLevel', 'high'] }, 1, 0]
          }
        },
        averageCalories: { $avg: '$analysis.totalCalories' },
        averageCarbs: { $avg: '$analysis.totalCarbs' }
      }
    }
  ]);
};

module.exports = mongoose.model('FoodAnalysis', foodAnalysisSchema);
