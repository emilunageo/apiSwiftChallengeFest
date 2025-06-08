const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze meal data and provide intelligent recommendations
   * @param {Object} mealData - The meal data to analyze
   * @param {Array} mealData.items - Array of food items in the meal
   * @param {number} baselineGlucose - Baseline glucose level (default: 80 mg/dL)
   * @param {Object} userProfile - User profile information
   * @returns {Object} Analysis results with recommendations
   */
  async analyzeMeal(mealData, baselineGlucose = 80, userProfile = {}) {
    try {
      console.log('🤖 Starting OpenAI meal analysis...');
      
      // Prepare the meal data for analysis
      const mealSummary = this.prepareMealSummary(mealData);
      
      // Create the prompt for OpenAI
      const prompt = this.createAnalysisPrompt(mealSummary, baselineGlucose, userProfile);
      
      console.log('📝 Sending request to OpenAI...');
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini which supports JSON mode
        messages: [
          {
            role: "system",
            content: "You are a diabetes management expert and nutritionist. You provide evidence-based recommendations for meal timing and glucose management. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, factual responses
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      console.log('✅ Received response from OpenAI');
      
      // Parse and validate the response
      const analysis = JSON.parse(response);
      
      // Add metadata
      analysis.metadata = {
        model: "gpt-4o-mini",
        timestamp: new Date().toISOString(),
        baselineGlucose,
        processingTime: Date.now()
      };
      
      return analysis;
      
    } catch (error) {
      console.error('❌ OpenAI analysis error:', error);
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  /**
   * Prepare meal summary for OpenAI analysis
   * @param {Object} mealData - Raw meal data
   * @returns {Object} Formatted meal summary
   */
  prepareMealSummary(mealData) {
    const items = mealData.items || [];
    
    return {
      mealType: mealData.mealType || 'unknown',
      totalItems: items.length,
      foods: items.map(item => ({
        name: item.name,
        portion: item.portion || { amount: 100, unit: 'grams' },
        nutritionalInfo: item.nutritionalInfo || {},
        hasCompleteNutrition: this.hasCompleteNutrition(item.nutritionalInfo)
      })),
      totalNutrition: this.calculateTotalNutrition(items)
    };
  }

  /**
   * Check if nutritional information is complete
   * @param {Object} nutrition - Nutritional information
   * @returns {boolean} Whether nutrition data is complete
   */
  hasCompleteNutrition(nutrition) {
    if (!nutrition) return false;
    
    const requiredFields = ['calories', 'carbohydrates', 'protein', 'fat'];
    return requiredFields.every(field => 
      nutrition[field] !== undefined && nutrition[field] !== null
    );
  }

  /**
   * Calculate total nutrition from meal items
   * @param {Array} items - Meal items
   * @returns {Object} Total nutritional values
   */
  calculateTotalNutrition(items) {
    const totals = {
      calories: 0,
      carbohydrates: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      glycemicLoad: 0
    };

    items.forEach(item => {
      if (item.nutritionalInfo) {
        Object.keys(totals).forEach(key => {
          totals[key] += item.nutritionalInfo[key] || 0;
        });
      }
    });

    return totals;
  }

  /**
   * Create the analysis prompt for OpenAI
   * @param {Object} mealSummary - Prepared meal summary
   * @param {number} baselineGlucose - Baseline glucose level
   * @param {Object} userProfile - User profile
   * @returns {string} Formatted prompt
   */
  createAnalysisPrompt(mealSummary, baselineGlucose, userProfile) {
    const diabetesType = userProfile.tipo_diabetes || 'type 2';
    const age = userProfile.edad || 'unknown';
    const weight = userProfile.peso || 'unknown';
    
    return `
Analyze this meal for a person with ${diabetesType} diabetes and provide recommendations in JSON format.

MEAL DATA:
${JSON.stringify(mealSummary, null, 2)}

BASELINE GLUCOSE: ${baselineGlucose} mg/dL
USER PROFILE: Age: ${age}, Weight: ${weight}kg, Diabetes: ${diabetesType}

INSTRUCTIONS:
1. For foods with missing nutritional data, estimate values based on the food name and typical portion sizes
2. Recommend the optimal eating order to minimize glucose spikes
3. Predict the new glucose level after consuming this meal
4. Provide clear reasoning for all recommendations

REQUIRED JSON RESPONSE FORMAT:
{
  "eatingOrder": [
    {
      "order": 1,
      "foodName": "string",
      "reason": "string explaining why this should be eaten first/second/etc"
    }
  ],
  "glucosePrediction": {
    "predictedPeakGlucose": number,
    "timeToReachPeak": number,
    "predictedGlucoseAfter2Hours": number,
    "riskLevel": "low|moderate|high"
  },
  "nutritionalEstimates": [
    {
      "foodName": "string",
      "estimatedNutrition": {
        "calories": number,
        "carbohydrates": number,
        "protein": number,
        "fat": number,
        "fiber": number,
        "glycemicIndex": number
      },
      "confidence": "high|medium|low",
      "reasoning": "string explaining the estimation"
    }
  ],
  "recommendations": [
    {
      "type": "eating_order|timing|portion|general",
      "message": "string with specific recommendation",
      "priority": "high|medium|low"
    }
  ],
  "reasoning": {
    "eatingOrderRationale": "string explaining the overall eating strategy",
    "glucosePredictionRationale": "string explaining how the glucose prediction was calculated",
    "keyFactors": ["array of key factors that influenced the recommendations"]
  }
}

Focus on evidence-based diabetes management principles:
- Fiber and protein first to slow glucose absorption
- Complex carbohydrates before simple sugars
- Consider glycemic index and load
- Account for meal timing and user's baseline glucose
- Provide practical, actionable advice
`;
  }

  /**
   * Estimate missing nutritional data for a food item
   * @param {string} foodName - Name of the food
   * @param {number} portionGrams - Portion size in grams
   * @returns {Object} Estimated nutritional data
   */
  async estimateNutrition(foodName, portionGrams = 100) {
    try {
      const prompt = `
Estimate the nutritional content for ${portionGrams}g of "${foodName}".

Provide the response in JSON format:
{
  "calories": number,
  "carbohydrates": number,
  "protein": number,
  "fat": number,
  "fiber": number,
  "glycemicIndex": number,
  "confidence": "high|medium|low",
  "reasoning": "brief explanation of the estimate"
}
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini which supports JSON mode
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert. Provide accurate nutritional estimates based on standard food databases. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
      
    } catch (error) {
      console.error('❌ Nutrition estimation error:', error);
      // Return default estimates if OpenAI fails
      return {
        calories: 100,
        carbohydrates: 15,
        protein: 5,
        fat: 3,
        fiber: 2,
        glycemicIndex: 50,
        confidence: "low",
        reasoning: "Default estimate due to API error"
      };
    }
  }
}

module.exports = new OpenAIService();
