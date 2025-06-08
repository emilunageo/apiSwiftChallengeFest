const MealEntry = require('../models/MealEntry');
const FoodAnalysis = require('../models/FoodAnalysis');
const Food = require('../models/Food');
const openaiService = require('../services/openaiService');
const OpenAIAnalysis = require('../models/OpenAIAnalysis');

// @desc    Create new meal entry
// @route   POST /api/meals
// @access  Private
const createMealEntry = async (req, res) => {
  try {
    console.log('🍽️ Creating meal entry...');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

    const {
      mealType,
      items,
      photos,
      location,
      timing,
      glucoseReadings,
      analysisId,
      notes,
      mood,
      symptoms,
      tags
    } = req.body;

    // Validate required fields
    if (!mealType || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Meal type and items are required'
      });
    }

    // Populate nutritional info for items that reference foods
    const populatedItems = await Promise.all(
      items.map(async (item) => {
        // Set default values for missing fields
        if (!item.source) {
          item.source = 'manual_entry';
        }
        if (!item.portion) {
          item.portion = { amount: 100, unit: 'grams' };
        } else if (!item.portion.amount) {
          item.portion.amount = 100;
        }

        if (item.foodId) {
          console.log(`🔍 Looking up food with ID: ${item.foodId}`);
          const food = await Food.findById(item.foodId);
          if (food) {
            console.log(`✅ Found food: ${food.nombre}`);
            console.log(`📊 Food data:`, {
              calorias_por_100g: food.calorias_por_100g,
              carbohidratos_totales: food.carbohidratos_totales,
              proteinas: food.proteinas,
              grasas: food.grasas,
              fibra: food.fibra,
              indice_glucemico: food.indice_glucemico
            });

            const portionMultiplier = (item.portion?.amount || 100) / 100; // Assuming base is per 100g
            console.log(`🥄 Portion multiplier: ${portionMultiplier} (${item.portion?.amount || 100}g)`);

            item.nutritionalInfo = {
              calories: Math.round((food.calorias_por_100g || 0) * portionMultiplier),
              carbohydrates: Math.round((food.carbohidratos_totales || 0) * portionMultiplier),
              protein: Math.round((food.proteinas || 0) * portionMultiplier),
              fat: Math.round((food.grasas || 0) * portionMultiplier),
              fiber: Math.round((food.fibra || 0) * portionMultiplier),
              glycemicIndex: food.indice_glucemico,
              glycemicLoad: Math.round((food.carga_glucemica || 0) * portionMultiplier)
            };

            console.log(`📈 Calculated nutritional info:`, item.nutritionalInfo);
          } else {
            console.log(`❌ Food not found for ID: ${item.foodId}`);
          }
        } else {
          console.log(`⚠️ No foodId provided for item: ${item.name}`);
        }
        return item;
      })
    );

    // Calculate nutritional totals
    const nutritionalTotals = populatedItems.reduce((totals, item) => {
      if (item.nutritionalInfo) {
        totals.calories += item.nutritionalInfo.calories || 0;
        totals.carbohydrates += item.nutritionalInfo.carbohydrates || 0;
        totals.protein += item.nutritionalInfo.protein || 0;
        totals.fat += item.nutritionalInfo.fat || 0;
        totals.fiber += item.nutritionalInfo.fiber || 0;

        // Calculate average glycemic index (weighted by carbs)
        if (item.nutritionalInfo.glycemicIndex && item.nutritionalInfo.carbohydrates > 0) {
          totals.totalGlycemicLoad += (item.nutritionalInfo.glycemicIndex * item.nutritionalInfo.carbohydrates);
          totals.totalCarbs += item.nutritionalInfo.carbohydrates;
        }
      }
      return totals;
    }, {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      totalGlycemicLoad: 0,
      totalCarbs: 0
    });

    // Calculate estimated glycemic load
    nutritionalTotals.estimatedGlycemicLoad = nutritionalTotals.totalCarbs > 0
      ? Math.round(nutritionalTotals.totalGlycemicLoad / nutritionalTotals.totalCarbs)
      : 0;

    // Remove helper properties
    delete nutritionalTotals.totalGlycemicLoad;
    delete nutritionalTotals.totalCarbs;

    console.log(`📊 Calculated nutritional totals:`, nutritionalTotals);

    // Create meal entry
    const mealEntry = new MealEntry({
      userId: req.user._id,
      mealType,
      items: populatedItems,
      nutritionalTotals,
      photos,
      location,
      timing: {
        plannedTime: timing?.plannedTime,
        actualTime: timing?.actualTime || new Date()
      },
      glucoseReadings,
      analysisId,
      notes,
      mood,
      symptoms,
      tags
    });

    console.log('💾 Saving meal entry with data:', {
      mealType,
      itemsCount: populatedItems.length,
      nutritionalTotals,
      items: populatedItems.map(item => ({
        name: item.name,
        foodId: item.foodId,
        hasNutritionalInfo: !!item.nutritionalInfo
      }))
    });

    await mealEntry.save();

    // Populate references for response
    await mealEntry.populate('items.foodId', 'nombre id_tipo indice_glucemico');
    if (analysisId) {
      await mealEntry.populate('analysisId');
    }

    // Trigger OpenAI analysis if requested
    let openaiAnalysis = null;
    if (req.body.triggerOpenAIAnalysis) {
      try {
        openaiAnalysis = await triggerOpenAIAnalysis(mealEntry, req.user);
        console.log('✅ OpenAI analysis triggered successfully');
      } catch (error) {
        console.error('⚠️ OpenAI analysis failed but meal was saved:', error.message);
        // Don't fail the meal creation if OpenAI analysis fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Meal entry created successfully',
      data: {
        meal: mealEntry,
        openaiAnalysis
      }
    });

  } catch (error) {
    console.error('Create meal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's meal entries
// @route   GET /api/meals
// @access  Private
const getMealEntries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      mealType,
      startDate,
      endDate
    } = req.query;

    let query = {
      userId: req.user._id,
      isActive: true
    };

    // Add filters
    if (mealType) query.mealType = mealType;
    
    if (startDate || endDate) {
      query['timing.actualTime'] = {};
      if (startDate) query['timing.actualTime'].$gte = new Date(startDate);
      if (endDate) query['timing.actualTime'].$lte = new Date(endDate);
    }

    const meals = await MealEntry.getUserMeals(req.user._id, parseInt(limit), parseInt(page));
    const total = await MealEntry.countDocuments(query);

    res.json({
      success: true,
      data: {
        meals,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get meal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Get single meal entry
// @route   GET /api/meals/:id
// @access  Private
const getMealEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const meal = await MealEntry.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    })
    .populate('items.foodId', 'nombre id_tipo indice_glucemico')
    .populate('analysisId');

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    res.json({
      success: true,
      data: {
        meal
      }
    });

  } catch (error) {
    console.error('Get meal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Update meal entry
// @route   PUT /api/meals/:id
// @access  Private
const updateMealEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const meal = await MealEntry.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'items', 'photos', 'location', 'timing', 'glucoseReadings',
      'notes', 'mood', 'symptoms', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        meal[field] = updates[field];
      }
    });

    await meal.save();

    // Populate references for response
    await meal.populate('items.foodId', 'nombre id_tipo indice_glucemico');
    await meal.populate('analysisId');

    res.json({
      success: true,
      message: 'Meal entry updated successfully',
      data: {
        meal
      }
    });

  } catch (error) {
    console.error('Update meal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Add glucose reading to meal
// @route   POST /api/meals/:id/glucose
// @access  Private
const addGlucoseToMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, value, timestamp, minutesAfterMeal, source = 'manual' } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: 'Type and value are required'
      });
    }

    const meal = await MealEntry.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    if (type === 'before') {
      meal.glucoseReadings.before = {
        value,
        timestamp: timestamp || new Date(),
        source
      };
    } else if (type === 'after') {
      if (!minutesAfterMeal) {
        return res.status(400).json({
          success: false,
          message: 'Minutes after meal is required for after readings'
        });
      }

      meal.glucoseReadings.after.push({
        value,
        timestamp: timestamp || new Date(),
        minutesAfterMeal,
        source
      });

      // Sort after readings by time
      meal.glucoseReadings.after.sort((a, b) => a.minutesAfterMeal - b.minutesAfterMeal);
    }

    await meal.save();

    res.json({
      success: true,
      message: 'Glucose reading added successfully',
      data: {
        glucoseReadings: meal.glucoseReadings
      }
    });

  } catch (error) {
    console.error('Add glucose to meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Delete meal entry (soft delete)
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMealEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const meal = await MealEntry.findOne({
      _id: id,
      userId: req.user._id,
      isActive: true
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    meal.isActive = false;
    await meal.save();

    res.json({
      success: true,
      message: 'Meal entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete meal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// @desc    Trigger OpenAI analysis for existing meal
// @route   POST /api/meals/:id/analyze
// @access  Public
const analyzeMealWithOpenAI = async (req, res) => {
  try {
    const { id } = req.params;
    const { baselineGlucose = 80, forceReanalysis = false, userProfile = {} } = req.body;

    const meal = await MealEntry.findOne({
      _id: id,
      isActive: true
    }).populate('items.foodId');

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal entry not found'
      });
    }

    // Check if analysis already exists
    if (!forceReanalysis) {
      const existingAnalysis = await OpenAIAnalysis.findOne({
        mealEntryId: id,
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

    // Use default user profile if not provided
    const defaultUserProfile = {
      tipo_diabetes: 'type 2',
      edad: 35,
      peso: 70,
      altura: 1.70,
      glucosa_basal: 100
    };

    const finalUserProfile = { ...defaultUserProfile, ...userProfile };
    const analysis = await triggerOpenAIAnalysisPublic(meal, finalUserProfile, baselineGlucose);

    res.status(201).json({
      success: true,
      message: 'OpenAI analysis completed successfully',
      data: analysis,
      cached: false
    });

  } catch (error) {
    console.error('Analyze meal with OpenAI error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing meal with OpenAI',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Helper function to trigger OpenAI analysis for a meal (with user authentication)
 * @param {Object} mealEntry - The meal entry to analyze
 * @param {Object} user - The user object
 * @param {number} baselineGlucose - Baseline glucose level
 * @returns {Object} OpenAI analysis result
 */
async function triggerOpenAIAnalysis(mealEntry, user, baselineGlucose = 80) {
  try {
    // Prepare meal data for analysis
    const mealData = {
      mealType: mealEntry.mealType,
      items: mealEntry.items.map(item => ({
        name: item.name,
        portion: item.portion,
        nutritionalInfo: item.nutritionalInfo,
        foodId: item.foodId
      }))
    };

    // Get user profile
    const userProfile = {
      tipo_diabetes: user.tipo_diabetes,
      edad: user.edad,
      peso: user.peso,
      altura: user.altura,
      glucosa_basal: user.glucosa_basal
    };

    // Call OpenAI service
    const startTime = Date.now();
    const aiAnalysis = await openaiService.analyzeMeal(mealData, baselineGlucose, userProfile);
    const processingTime = Date.now() - startTime;

    // Save analysis to database
    const openAIAnalysis = new OpenAIAnalysis({
      userId: user._id,
      mealEntryId: mealEntry._id,
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
    return openAIAnalysis;

  } catch (error) {
    console.error('❌ Trigger OpenAI analysis error:', error);
    throw error;
  }
}

/**
 * Helper function to trigger OpenAI analysis for a meal (public access)
 * @param {Object} mealEntry - The meal entry to analyze
 * @param {Object} userProfile - The user profile object
 * @param {number} baselineGlucose - Baseline glucose level
 * @returns {Object} OpenAI analysis result
 */
async function triggerOpenAIAnalysisPublic(mealEntry, userProfile, baselineGlucose = 80) {
  try {
    // Prepare meal data for analysis
    const mealData = {
      mealType: mealEntry.mealType,
      items: mealEntry.items.map(item => ({
        name: item.name,
        portion: item.portion,
        nutritionalInfo: item.nutritionalInfo,
        foodId: item.foodId
      }))
    };

    // Call OpenAI service
    const startTime = Date.now();
    const aiAnalysis = await openaiService.analyzeMeal(mealData, baselineGlucose, userProfile);
    const processingTime = Date.now() - startTime;

    // Save analysis to database (without userId for public access)
    const openAIAnalysis = new OpenAIAnalysis({
      userId: null, // No user association for public access
      mealEntryId: mealEntry._id,
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
    return openAIAnalysis;

  } catch (error) {
    console.error('❌ Trigger OpenAI analysis error:', error);
    throw error;
  }
}

module.exports = {
  createMealEntry,
  getMealEntries,
  getMealEntry,
  updateMealEntry,
  addGlucoseToMeal,
  deleteMealEntry,
  analyzeMealWithOpenAI
};
