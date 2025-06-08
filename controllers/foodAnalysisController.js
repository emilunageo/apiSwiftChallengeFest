const FoodAnalysis = require('../models/FoodAnalysis');
const Food = require('../models/Food');
const GlucoseReading = require('../models/GlucoseReading');
const User = require('../models/User');

// Helper function to match detected foods with database
const matchFoodsWithDatabase = async (detectedFoods) => {
  const matchedFoods = [];
  
  for (const detected of detectedFoods) {
    // Try exact match first
    let matchedFood = await Food.findOne({
      nombre: new RegExp(detected.name, 'i'),
      isActive: true
    });
    
    // If no exact match, try partial match
    if (!matchedFood) {
      const searchTerms = detected.name.split(' ');
      for (const term of searchTerms) {
        if (term.length > 3) { // Only search meaningful terms
          matchedFood = await Food.findOne({
            $text: { $search: term },
            isActive: true
          });
          if (matchedFood) break;
        }
      }
    }
    
    const matchedItem = {
      name: detected.name,
      confidence: detected.confidence,
      matchedFoodId: matchedFood ? matchedFood._id : null,
      portion: {
        estimatedGrams: detected.portion || 100,
        userAdjusted: false
      }
    };
    
    // Add nutritional data if food was matched
    if (matchedFood) {
      const portionMultiplier = (detected.portion || 100) / 100;
      matchedItem.nutritionalData = {
        calories: Math.round((matchedFood.calorias_por_100g || 0) * portionMultiplier),
        carbohydrates: Math.round((matchedFood.carbohidratos_totales || 0) * portionMultiplier),
        protein: Math.round((matchedFood.proteinas || 0) * portionMultiplier),
        fat: Math.round((matchedFood.grasas || 0) * portionMultiplier),
        fiber: Math.round((matchedFood.fibra || 0) * portionMultiplier),
        glycemicIndex: matchedFood.indice_glucemico,
        glycemicLoad: Math.round((matchedFood.carga_glucemica || 0) * portionMultiplier)
      };
    }
    
    matchedFoods.push(matchedItem);
  }
  
  return matchedFoods;
};

// Helper function to generate glucose prediction
const generateGlucosePrediction = (analysis, currentGlucose, userProfile) => {
  const { totalCarbs, averageGlycemicIndex, totalGlycemicLoad } = analysis;
  
  // Base prediction on glycemic load and current glucose
  let peakIncrease = 0;
  let peakTime = 60; // Default 1 hour
  let duration = 120; // Default 2 hours
  
  // Calculate peak increase based on glycemic load
  if (totalGlycemicLoad <= 10) {
    peakIncrease = 20 + (totalGlycemicLoad * 2);
    peakTime = 45;
    duration = 90;
  } else if (totalGlycemicLoad <= 20) {
    peakIncrease = 40 + (totalGlycemicLoad * 3);
    peakTime = 60;
    duration = 120;
  } else {
    peakIncrease = 80 + (totalGlycemicLoad * 2);
    peakTime = 75;
    duration = 180;
  }
  
  // Adjust for user's diabetes type
  if (userProfile.tipo_diabetes === 'tipo 1') {
    peakIncrease *= 1.2; // Type 1 typically has higher spikes
    duration *= 1.1;
  } else if (userProfile.tipo_diabetes === 'prediabetes') {
    peakIncrease *= 0.8; // Prediabetes typically has lower spikes
  }
  
  const peakValue = currentGlucose + peakIncrease;
  
  // Determine risk level
  let riskLevel = 'low';
  if (peakValue > 180 || totalGlycemicLoad > 20) {
    riskLevel = 'high';
  } else if (peakValue > 140 || totalGlycemicLoad > 10) {
    riskLevel = 'medium';
  }
  
  // Confidence based on how well foods were matched
  const confidence = 75; // Base confidence, could be improved with ML
  
  return {
    peakTime,
    peakValue: Math.round(peakValue),
    duration,
    riskLevel,
    confidence
  };
};

// Helper function to generate recommendations
const generateRecommendations = (analysis, glucosePrediction, userProfile) => {
  const recommendations = [];
  
  // Consumption order recommendations
  if (analysis.totalFiber > 5) {
    recommendations.push({
      type: 'consumption_order',
      priority: 'high',
      message: 'Eat fiber-rich foods first to slow glucose absorption',
      reasoning: 'High fiber content detected'
    });
  }
  
  // High glycemic index warning
  if (analysis.averageGlycemicIndex > 70) {
    recommendations.push({
      type: 'timing',
      priority: 'high',
      message: 'Consider eating this meal after physical activity',
      reasoning: 'High glycemic index foods detected'
    });
  }
  
  // Portion adjustment
  if (glucosePrediction.riskLevel === 'high') {
    recommendations.push({
      type: 'portion_adjustment',
      priority: 'high',
      message: 'Consider reducing portion size by 25-30%',
      reasoning: 'Predicted high glucose spike'
    });
  }
  
  // Pairing suggestions
  if (analysis.totalProtein < 10) {
    recommendations.push({
      type: 'pairing',
      priority: 'medium',
      message: 'Add protein to help stabilize blood sugar',
      reasoning: 'Low protein content in current meal'
    });
  }
  
  return recommendations;
};

// @desc    Analyze detected foods and provide recommendations
// @route   POST /api/food-analysis/analyze
// @access  Private
const analyzeFoods = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      detectedFoods,
      mealType,
      currentGlucose,
      photoUrl
    } = req.body;

    // Validate required fields
    if (!detectedFoods || !Array.isArray(detectedFoods) || detectedFoods.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Detected foods array is required'
      });
    }

    if (!mealType) {
      return res.status(400).json({
        success: false,
        message: 'Meal type is required'
      });
    }

    // Get user profile for personalized recommendations
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get current glucose if not provided
    let glucoseValue = currentGlucose;
    if (!glucoseValue) {
      const latestReading = await GlucoseReading.getLatestForUser(req.user._id);
      glucoseValue = latestReading ? latestReading.value : 100; // Default to 100 if no reading
    }

    // Match detected foods with database
    const matchedFoods = await matchFoodsWithDatabase(detectedFoods);

    // Calculate nutritional analysis
    const analysis = {
      totalCalories: 0,
      totalCarbs: 0,
      totalProtein: 0,
      totalFat: 0,
      totalFiber: 0,
      totalGlycemicLoad: 0,
      estimatedDigestionTime: 0
    };

    let glycemicIndexSum = 0;
    let glycemicIndexCount = 0;

    matchedFoods.forEach(food => {
      if (food.nutritionalData) {
        analysis.totalCalories += food.nutritionalData.calories || 0;
        analysis.totalCarbs += food.nutritionalData.carbohydrates || 0;
        analysis.totalProtein += food.nutritionalData.protein || 0;
        analysis.totalFat += food.nutritionalData.fat || 0;
        analysis.totalFiber += food.nutritionalData.fiber || 0;
        analysis.totalGlycemicLoad += food.nutritionalData.glycemicLoad || 0;
        
        if (food.nutritionalData.glycemicIndex) {
          glycemicIndexSum += food.nutritionalData.glycemicIndex;
          glycemicIndexCount++;
        }
      }
    });

    analysis.averageGlycemicIndex = glycemicIndexCount > 0 ? 
      Math.round(glycemicIndexSum / glycemicIndexCount) : 0;
    
    // Estimate digestion time based on macronutrients
    analysis.estimatedDigestionTime = Math.round(
      60 + (analysis.totalFat * 2) + (analysis.totalProtein * 1.5) + (analysis.totalFiber * 3)
    );

    // Generate glucose prediction
    const glucosePrediction = generateGlucosePrediction(analysis, glucoseValue, user);

    // Generate recommendations
    const recommendations = generateRecommendations(analysis, glucosePrediction, user);

    // Create food analysis record
    const foodAnalysis = new FoodAnalysis({
      userId: req.user._id,
      photoUrl,
      detectedFoods: matchedFoods,
      mealType,
      currentGlucose: {
        value: glucoseValue,
        timestamp: new Date(),
        source: currentGlucose ? 'manual' : 'latest_reading'
      },
      analysis,
      glucosePrediction,
      recommendations,
      processingTime: Date.now() - startTime
    });

    await foodAnalysis.save();

    res.status(201).json({
      success: true,
      message: 'Food analysis completed successfully',
      data: {
        analysis: foodAnalysis
      }
    });

  } catch (error) {
    console.error('Food analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's food analysis history
// @route   GET /api/food-analysis/history
// @access  Private
const getAnalysisHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      mealType,
      riskLevel,
      startDate,
      endDate
    } = req.query;

    let query = {
      userId: req.user._id,
      isActive: true
    };

    // Add filters
    if (mealType) query.mealType = mealType;
    if (riskLevel) query['glucosePrediction.riskLevel'] = riskLevel;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const analyses = await FoodAnalysis.getUserHistory(req.user._id, parseInt(limit), parseInt(page));
    const total = await FoodAnalysis.countDocuments(query);

    res.json({
      success: true,
      data: {
        analyses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get single food analysis
// @route   GET /api/food-analysis/:id
// @access  Private
const getAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await FoodAnalysis.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    }).populate('detectedFoods.matchedFoodId', 'nombre id_tipo indice_glucemico');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: {
        analysis
      }
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Update analysis with user feedback
// @route   PUT /api/food-analysis/:id/feedback
// @access  Private
const updateAnalysisFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      rating,
      helpful,
      comments,
      actualGlucoseResponse
    } = req.body;

    const analysis = await FoodAnalysis.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    // Update feedback
    if (rating !== undefined) analysis.userFeedback.rating = rating;
    if (helpful !== undefined) analysis.userFeedback.helpful = helpful;
    if (comments !== undefined) analysis.userFeedback.comments = comments;
    if (actualGlucoseResponse) analysis.userFeedback.actualGlucoseResponse = actualGlucoseResponse;

    await analysis.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: {
        analysis
      }
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Share analysis with healthcare provider
// @route   POST /api/food-analysis/:id/share
// @access  Private
const shareAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email addresses are required'
      });
    }

    const analysis = await FoodAnalysis.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    analysis.isShared = true;
    analysis.sharedWith = emails;
    await analysis.save();

    res.json({
      success: true,
      message: 'Analysis shared successfully',
      data: {
        sharedWith: emails
      }
    });

  } catch (error) {
    console.error('Share analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get analysis statistics
// @route   GET /api/food-analysis/stats
// @access  Private
const getAnalysisStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await FoodAnalysis.getUserStats(req.user._id, parseInt(days));

    res.json({
      success: true,
      data: {
        stats: stats.length > 0 ? stats[0] : {
          totalAnalyses: 0,
          averageRating: null,
          highRiskMeals: 0,
          averageCalories: null,
          averageCarbs: null
        },
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Get analysis stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  analyzeFoods,
  getAnalysisHistory,
  getAnalysis,
  updateAnalysisFeedback,
  shareAnalysis,
  getAnalysisStats
};
