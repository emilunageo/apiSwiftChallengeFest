const mongoose = require('mongoose');

const eatingOrderSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
    min: 1
  },
  foodName: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const glucosePredictionSchema = new mongoose.Schema({
  predictedPeakGlucose: {
    type: Number,
    required: true,
    min: 50,
    max: 600
  },
  timeToReachPeak: {
    type: Number,
    required: true,
    min: 15,
    max: 240 // minutes
  },
  predictedGlucoseAfter2Hours: {
    type: Number,
    required: true,
    min: 50,
    max: 600
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high'],
    required: true
  }
}, { _id: false });

const nutritionalEstimateSchema = new mongoose.Schema({
  foodName: {
    type: String,
    required: true,
    trim: true
  },
  estimatedNutrition: {
    calories: {
      type: Number,
      min: 0
    },
    carbohydrates: {
      type: Number,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    fat: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    glycemicIndex: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  confidence: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  },
  reasoning: {
    type: String,
    trim: true
  }
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['eating_order', 'timing', 'portion', 'general'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true
  }
}, { _id: false });

const reasoningSchema = new mongoose.Schema({
  eatingOrderRationale: {
    type: String,
    required: true,
    trim: true
  },
  glucosePredictionRationale: {
    type: String,
    required: true,
    trim: true
  },
  keyFactors: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const openAIAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional for public access
    index: true
  },
  mealEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealEntry'
  },
  baselineGlucose: {
    type: Number,
    required: true,
    min: 50,
    max: 600,
    default: 80
  },
  eatingOrder: [eatingOrderSchema],
  glucosePrediction: glucosePredictionSchema,
  nutritionalEstimates: [nutritionalEstimateSchema],
  recommendations: [recommendationSchema],
  reasoning: reasoningSchema,
  metadata: {
    model: {
      type: String,
      default: 'gpt-4o-mini'
    },
    processingTime: {
      type: Number, // milliseconds
      min: 0
    },
    apiVersion: {
      type: String,
      default: '1.0'
    },
    requestTimestamp: {
      type: Date,
      default: Date.now
    }
  },
  userFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    helpful: {
      type: Boolean
    },
    comments: {
      type: String,
      maxlength: 500,
      trim: true
    },
    actualGlucoseResponse: {
      peakValue: Number,
      peakTime: Number, // minutes after meal
      notes: String
    },
    submittedAt: Date
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

// Indexes for better query performance
openAIAnalysisSchema.index({ userId: 1, createdAt: -1 });
openAIAnalysisSchema.index({ mealEntryId: 1 });
openAIAnalysisSchema.index({ 'glucosePrediction.riskLevel': 1 });
openAIAnalysisSchema.index({ 'metadata.requestTimestamp': -1 });

// Virtual for analysis age
openAIAnalysisSchema.virtual('analysisAge').get(function() {
  return Date.now() - this.metadata.requestTimestamp;
});

// Static method to get user's analysis history
openAIAnalysisSchema.statics.getUserAnalyses = function(userId, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  return this.find({
    userId,
    isActive: true
  })
  .populate('mealEntryId', 'mealType timing.actualTime items.name')
  .sort({ 'metadata.requestTimestamp': -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get analyses by risk level
openAIAnalysisSchema.statics.getAnalysesByRisk = function(userId, riskLevel) {
  return this.find({
    userId,
    'glucosePrediction.riskLevel': riskLevel,
    isActive: true
  })
  .populate('mealEntryId', 'mealType timing.actualTime')
  .sort({ 'metadata.requestTimestamp': -1 });
};

// Static method to get analysis statistics
openAIAnalysisSchema.statics.getUserStats = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        'metadata.requestTimestamp': { $gte: startDate },
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
        moderateRiskMeals: {
          $sum: {
            $cond: [{ $eq: ['$glucosePrediction.riskLevel', 'moderate'] }, 1, 0]
          }
        },
        lowRiskMeals: {
          $sum: {
            $cond: [{ $eq: ['$glucosePrediction.riskLevel', 'low'] }, 1, 0]
          }
        },
        averageProcessingTime: { $avg: '$metadata.processingTime' },
        averagePredictedPeak: { $avg: '$glucosePrediction.predictedPeakGlucose' }
      }
    }
  ]);
};

// Pre-save middleware to validate data consistency
openAIAnalysisSchema.pre('save', function(next) {
  // Ensure eating order is sequential
  if (this.eatingOrder && this.eatingOrder.length > 0) {
    this.eatingOrder.sort((a, b) => a.order - b.order);
    
    // Validate sequential ordering
    for (let i = 0; i < this.eatingOrder.length; i++) {
      if (this.eatingOrder[i].order !== i + 1) {
        return next(new Error('Eating order must be sequential starting from 1'));
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('OpenAIAnalysis', openAIAnalysisSchema);
