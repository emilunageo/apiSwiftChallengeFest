const OpenAIAnalysis = require('../models/OpenAIAnalysis');
const MealEntry = require('../models/MealEntry');
const Food = require('../models/Food');
const openaiService = require('../services/openaiService');

// @desc    Analyze meal with OpenAI
// @route   POST /api/openai/analyze-meal
// @access  Public
const analyzeMeal = async (req, res) => {
  try {
    console.log('🤖 Starting OpenAI meal analysis...');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const {
      mealEntryId,
      mealData,
      baselineGlucose = 80,
      forceReanalysis = false,
      userProfile = {}
    } = req.body;

    // Validate input
    if (!mealEntryId && !mealData) {
      return res.status(400).json({
        success: false,
        message: 'Either mealEntryId or mealData is required'
      });
    }

    let mealEntry = null;
    let analysisData = null;

    // If mealEntryId is provided, fetch the meal entry
    if (mealEntryId) {
      mealEntry = await MealEntry.findOne({
        _id: mealEntryId,
        isActive: true
      }).populate('items.foodId');

      if (!mealEntry) {
        return res.status(404).json({
          success: false,
          message: 'Meal entry not found'
        });
      }

      // Check if analysis already exists and forceReanalysis is false
      if (!forceReanalysis) {
        const existingAnalysis = await OpenAIAnalysis.findOne({
          mealEntryId,
          isActive: true
        });

        if (existingAnalysis) {
          return res.json({
            success: true,
            message: 'Analysis already exists',
            data: existingAnalysis,
            cached: true
          });
        }
      }

      analysisData = {
        mealType: mealEntry.mealType,
        items: mealEntry.items.map(item => ({
          name: item.name,
          portion: item.portion,
          nutritionalInfo: item.nutritionalInfo,
          foodId: item.foodId
        }))
      };
    } else {
      // Use provided mealData
      analysisData = mealData;
    }

    // Enrich meal data with database information if needed
    const enrichedMealData = await enrichMealData(analysisData);

    // Use provided user profile or defaults
    const defaultUserProfile = {
      tipo_diabetes: 'type 2',
      edad: 35,
      peso: 70,
      altura: 1.70,
      glucosa_basal: 100
    };

    const finalUserProfile = { ...defaultUserProfile, ...userProfile };

    console.log('🔍 Enriched meal data:', JSON.stringify(enrichedMealData, null, 2));

    // Call OpenAI service
    const startTime = Date.now();
    const aiAnalysis = await openaiService.analyzeMeal(
      enrichedMealData,
      baselineGlucose,
      finalUserProfile
    );
    const processingTime = Date.now() - startTime;

    console.log('✅ OpenAI analysis completed in', processingTime, 'ms');

    // Save analysis to database (without userId for public access)
    const openAIAnalysis = new OpenAIAnalysis({
      userId: null, // No user association for public access
      mealEntryId: mealEntryId || null,
      baselineGlucose,
      eatingOrder: aiAnalysis.eatingOrder || [],
      glucosePrediction: aiAnalysis.glucosePrediction,
      nutritionalEstimates: aiAnalysis.nutritionalEstimates || [],
      recommendations: aiAnalysis.recommendations || [],
      reasoning: aiAnalysis.reasoning,
      metadata: {
        ...aiAnalysis.metadata,
        processingTime,
        requestTimestamp: new Date()
      }
    });

    await openAIAnalysis.save();

    console.log('💾 Analysis saved to database with ID:', openAIAnalysis._id);

    res.status(201).json({
      success: true,
      message: 'Meal analysis completed successfully',
      data: openAIAnalysis,
      cached: false
    });

  } catch (error) {
    console.error('❌ OpenAI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get OpenAI analysis history
// @route   GET /api/openai/history
// @access  Public
const getAnalysisHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, riskLevel, mealEntryId } = req.query;

    let query = {
      isActive: true
    };

    if (riskLevel) {
      query['glucosePrediction.riskLevel'] = riskLevel;
    }

    if (mealEntryId) {
      query['mealEntryId'] = mealEntryId;
    }

    const analyses = await OpenAIAnalysis.find(query)
      .populate('mealEntryId', 'mealType timing.actualTime items.name')
      .sort({ 'metadata.requestTimestamp': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await OpenAIAnalysis.countDocuments(query);

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analysis history'
    });
  }
};

// @desc    Get single OpenAI analysis
// @route   GET /api/openai/analysis/:id
// @access  Public
const getAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await OpenAIAnalysis.findOne({
      _id: id,
      isActive: true
    }).populate('mealEntryId');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analysis'
    });
  }
};

// @desc    Submit feedback for OpenAI analysis
// @route   PUT /api/openai/analysis/:id/feedback
// @access  Public
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, helpful, comments, actualGlucoseResponse } = req.body;

    const analysis = await OpenAIAnalysis.findOne({
      _id: id,
      isActive: true
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Update feedback
    analysis.userFeedback = {
      rating,
      helpful,
      comments,
      actualGlucoseResponse,
      submittedAt: new Date()
    };

    await analysis.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: analysis
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    });
  }
};

// @desc    Get OpenAI analysis statistics
// @route   GET /api/openai/stats
// @access  Public
const getAnalysisStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get general statistics for all analyses (not user-specific)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const stats = await OpenAIAnalysis.aggregate([
      {
        $match: {
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

    res.json({
      success: true,
      data: {
        stats: stats.length > 0 ? stats[0] : {
          totalAnalyses: 0,
          averageRating: null,
          highRiskMeals: 0,
          moderateRiskMeals: 0,
          lowRiskMeals: 0,
          averageProcessingTime: null,
          averagePredictedPeak: null
        },
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Get analysis stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analysis statistics'
    });
  }
};

/**
 * Enrich meal data with database information
 * @param {Object} mealData - Raw meal data
 * @returns {Object} Enriched meal data
 */
async function enrichMealData(mealData) {
  const enrichedItems = [];

  for (const item of mealData.items || []) {
    let enrichedItem = { ...item };

    // If nutritional info is missing or incomplete, try to get from database
    if (!item.nutritionalInfo || !hasCompleteNutrition(item.nutritionalInfo)) {
      if (item.foodId) {
        // Get from database using foodId
        const food = await Food.findById(item.foodId);
        if (food) {
          enrichedItem.nutritionalInfo = calculateNutritionFromFood(food, item.portion);
        }
      } else {
        // Try to find food by name
        const food = await Food.findOne({
          nombre: { $regex: item.name, $options: 'i' },
          isActive: true
        });
        
        if (food) {
          enrichedItem.foodId = food._id;
          enrichedItem.nutritionalInfo = calculateNutritionFromFood(food, item.portion);
        }
      }
    }

    enrichedItems.push(enrichedItem);
  }

  return {
    ...mealData,
    items: enrichedItems
  };
}

/**
 * Check if nutritional information is complete
 */
function hasCompleteNutrition(nutrition) {
  if (!nutrition) return false;
  const requiredFields = ['calories', 'carbohydrates', 'protein', 'fat'];
  return requiredFields.every(field => 
    nutrition[field] !== undefined && nutrition[field] !== null
  );
}

/**
 * Calculate nutrition from food database entry
 */
function calculateNutritionFromFood(food, portion) {
  const portionMultiplier = (portion?.amount || 100) / 100;
  
  return {
    calories: Math.round((food.calorias_por_100g || 0) * portionMultiplier),
    carbohydrates: Math.round((food.carbohidratos_totales || 0) * portionMultiplier),
    protein: Math.round((food.proteinas || 0) * portionMultiplier),
    fat: Math.round((food.grasas || 0) * portionMultiplier),
    fiber: Math.round((food.fibra || 0) * portionMultiplier),
    glycemicIndex: food.indice_glucemico,
    glycemicLoad: Math.round(((food.carbohidratos_totales || 0) * (food.indice_glucemico || 0) / 100) * portionMultiplier)
  };
}

module.exports = {
  analyzeMeal,
  getAnalysisHistory,
  getAnalysis,
  submitFeedback,
  getAnalysisStats
};
