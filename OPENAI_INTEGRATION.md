# OpenAI Integration for Diabetes Management API

## Overview

The OpenAI integration provides intelligent meal analysis and recommendations for diabetes management. It analyzes meal data, predicts glucose responses, and provides personalized eating recommendations to help minimize glucose spikes.

**🔓 Public Access**: All OpenAI endpoints are publicly accessible without authentication to simplify integration and testing.

## Features

### 🤖 Intelligent Meal Analysis
- **Optimal Eating Order**: Recommends the best sequence to consume foods in a meal
- **Glucose Prediction**: Predicts peak glucose levels and 2-hour post-meal glucose
- **Risk Assessment**: Classifies meals as low, moderate, or high risk
- **Missing Data Estimation**: Uses AI to estimate nutritional values for foods without complete data

### 📊 Personalized Recommendations
- Evidence-based diabetes management principles
- Considers user's diabetes type, age, weight, and baseline glucose
- Provides actionable advice for meal timing and portion control
- Explains reasoning behind recommendations

### 📈 Analytics and Tracking
- Analysis history with filtering by risk level
- User statistics and trends
- Feedback collection for continuous improvement
- Integration with existing meal tracking

## API Endpoints

### Core Analysis Endpoints

#### Analyze Meal
```http
POST /api/openai/analyze-meal
Content-Type: application/json

{
  "mealData": {
    "mealType": "lunch",
    "items": [
      {
        "name": "Arroz integral",
        "portion": { "amount": 150, "unit": "grams" },
        "nutritionalInfo": {
          "calories": 165,
          "carbohydrates": 33,
          "protein": 3,
          "fat": 1,
          "fiber": 2,
          "glycemicIndex": 50
        }
      },
      {
        "name": "Ensalada verde",
        "portion": { "amount": 100, "unit": "grams" }
        // Missing nutritional info - will be estimated by AI
      }
    ]
  },
  "baselineGlucose": 80,
  "forceReanalysis": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meal analysis completed successfully",
  "data": {
    "eatingOrder": [
      {
        "order": 1,
        "foodName": "Ensalada verde",
        "reason": "High fiber content helps slow glucose absorption"
      },
      {
        "order": 2,
        "foodName": "Arroz integral",
        "reason": "Complex carbohydrates should be consumed after fiber"
      }
    ],
    "glucosePrediction": {
      "predictedPeakGlucose": 145,
      "timeToReachPeak": 90,
      "predictedGlucoseAfter2Hours": 110,
      "riskLevel": "moderate"
    },
    "nutritionalEstimates": [
      {
        "foodName": "Ensalada verde",
        "estimatedNutrition": {
          "calories": 20,
          "carbohydrates": 4,
          "protein": 2,
          "fat": 0,
          "fiber": 3,
          "glycemicIndex": 15
        },
        "confidence": "high",
        "reasoning": "Standard mixed green salad nutritional profile"
      }
    ],
    "recommendations": [
      {
        "type": "eating_order",
        "message": "Start with the salad to create a fiber barrier",
        "priority": "high"
      }
    ],
    "reasoning": {
      "eatingOrderRationale": "Fiber-first approach to minimize glucose spikes",
      "glucosePredictionRationale": "Based on glycemic load and user baseline",
      "keyFactors": ["fiber content", "glycemic index", "meal composition"]
    }
  },
  "cached": false
}
```

#### Get Analysis History
```http
GET /api/openai/history?page=1&limit=20&riskLevel=high
```

#### Get Single Analysis
```http
GET /api/openai/analysis/:id
```

#### Submit Feedback
```http
PUT /api/openai/analysis/:id/feedback
Content-Type: application/json

{
  "rating": 5,
  "helpful": true,
  "comments": "Very accurate predictions",
  "actualGlucoseResponse": {
    "peakValue": 142,
    "peakTime": 85,
    "notes": "Close to prediction"
  }
}
```

#### Get Statistics
```http
GET /api/openai/stats?days=30
```

### Meal Integration Endpoints

#### Create Meal with Analysis
```http
POST /api/meals
Authorization: Bearer <token>
Content-Type: application/json

{
  "mealType": "breakfast",
  "items": [...],
  "triggerOpenAIAnalysis": true
}
```

#### Analyze Existing Meal
```http
POST /api/meals/:id/analyze
Content-Type: application/json

{
  "baselineGlucose": 85,
  "forceReanalysis": false
}
```

## Configuration

### Environment Variables

Add to your `.env` file:
```env
OPENAI_API_KEY=your-openai-api-key-here
```

### OpenAI Model Configuration

The integration uses:
- **GPT-4** for comprehensive meal analysis (higher accuracy)
- **GPT-3.5-turbo** for nutritional estimation (faster, cost-effective)
- **JSON mode** for structured responses
- **Low temperature** (0.2-0.3) for consistent, factual responses

## Usage Examples

### Swift Integration

```swift
// Analyze a meal after creation
func analyzeMeal(mealId: String, baselineGlucose: Int = 80) async throws -> OpenAIAnalysis {
    let url = URL(string: "\(baseURL)/api/meals/\(mealId)/analyze")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = [
        "baselineGlucose": baselineGlucose,
        "forceReanalysis": false
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(OpenAIAnalysisResponse.self, from: data)
    return response.data
}

// Create meal with automatic analysis
func createMealWithAnalysis(_ mealData: MealData) async throws -> (MealEntry, OpenAIAnalysis?) {
    var mealRequest = mealData
    mealRequest.triggerOpenAIAnalysis = true
    
    // ... create meal request
}
```

### JavaScript/Node.js Integration

```javascript
// Analyze meal data
const analyzeMeal = async (mealData, baselineGlucose = 80) => {
  const response = await fetch('/api/openai/analyze-meal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mealData,
      baselineGlucose
    })
  });
  
  return await response.json();
};
```

## Data Models

### OpenAI Analysis Schema

```javascript
{
  userId: ObjectId,
  mealEntryId: ObjectId, // Optional - links to existing meal
  baselineGlucose: Number, // Default: 80 mg/dL
  eatingOrder: [{
    order: Number,
    foodName: String,
    reason: String
  }],
  glucosePrediction: {
    predictedPeakGlucose: Number,
    timeToReachPeak: Number, // minutes
    predictedGlucoseAfter2Hours: Number,
    riskLevel: "low|moderate|high"
  },
  nutritionalEstimates: [{
    foodName: String,
    estimatedNutrition: {
      calories: Number,
      carbohydrates: Number,
      protein: Number,
      fat: Number,
      fiber: Number,
      glycemicIndex: Number
    },
    confidence: "high|medium|low",
    reasoning: String
  }],
  recommendations: [{
    type: "eating_order|timing|portion|general",
    message: String,
    priority: "high|medium|low"
  }],
  reasoning: {
    eatingOrderRationale: String,
    glucosePredictionRationale: String,
    keyFactors: [String]
  },
  userFeedback: {
    rating: Number, // 1-5
    helpful: Boolean,
    comments: String,
    actualGlucoseResponse: {
      peakValue: Number,
      peakTime: Number,
      notes: String
    }
  }
}
```

## Testing

Run the integration test:
```bash
cd api
node test-openai-integration.js
```

The test will:
1. Create a test meal with OpenAI analysis
2. Perform direct meal analysis
3. Retrieve analysis history
4. Get user statistics

## Error Handling

The integration includes robust error handling:

- **Missing API Key**: Graceful degradation with clear error messages
- **API Rate Limits**: Retry logic with exponential backoff
- **Invalid Responses**: Fallback to default estimates
- **Network Issues**: Timeout handling and error reporting

## Best Practices

### For Developers

1. **Always handle missing nutritional data** - The AI will estimate, but database lookups are preferred
2. **Cache analysis results** - Avoid re-analyzing the same meal unnecessarily
3. **Collect user feedback** - Use ratings to improve recommendations
4. **Monitor API usage** - Track costs and optimize prompts

### For Users

1. **Provide accurate portion sizes** - Better input leads to better predictions
2. **Include pre-meal glucose readings** - Improves prediction accuracy
3. **Submit feedback** - Help improve the AI recommendations
4. **Follow eating order suggestions** - Evidence-based approach to glucose management

## Cost Optimization

- Use GPT-3.5-turbo for simple nutritional estimates
- Cache frequently requested food nutritional data
- Implement request batching for multiple foods
- Monitor token usage and optimize prompts

## Security Considerations

- API keys are stored securely in environment variables
- All requests require user authentication
- Analysis data is linked to specific users
- No sensitive health data is sent to OpenAI beyond meal composition

## Future Enhancements

- Integration with continuous glucose monitors (CGM)
- Personalized model training based on user feedback
- Multi-language support for food names
- Integration with fitness tracking for activity-adjusted predictions
- Meal planning suggestions based on glucose targets
