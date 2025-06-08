const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MealEntry = require('./models/MealEntry');
const OpenAIAnalysis = require('./models/OpenAIAnalysis');
const Food = require('./models/Food');

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

async function testOpenAIIntegration() {
  try {
    console.log('🤖 Testing OpenAI Integration...\n');

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OPENAI_API_KEY not found in environment variables');
      console.log('📝 Please add your OpenAI API key to the .env file:');
      console.log('   OPENAI_API_KEY=your-openai-api-key-here\n');
      return;
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diabetes_api');
    console.log('✅ Connected to MongoDB');

    // Test 1: Skip meal creation test (requires authentication)
    console.log('\n🍽️ Step 1: Skipping meal creation test (requires authentication)...');
    console.log('   Note: The meal creation endpoint still requires authentication.');
    console.log('   We will test the direct OpenAI analysis instead.');

    // Test 2: Direct OpenAI analysis with meal data
    console.log('\n🧠 Step 2: Testing direct OpenAI analysis...');
    
    const analysisData = {
      mealData: {
        mealType: 'breakfast',
        items: [
          {
            name: 'Avena',
            portion: { amount: 50, unit: 'grams' }
            // Missing nutritional info - OpenAI should estimate
          },
          {
            name: 'Plátano',
            portion: { amount: 120, unit: 'grams' }
            // Missing nutritional info - OpenAI should estimate
          },
          {
            name: 'Leche descremada',
            portion: { amount: 200, unit: 'grams' }
            // Missing nutritional info - OpenAI should estimate
          }
        ]
      },
      baselineGlucose: 85
    };

    try {
      const analysisResponse = await axios.post(`${BASE_URL}/openai/analyze-meal`, analysisData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ OpenAI analysis completed successfully');
      const analysis = analysisResponse.data.data;
      
      console.log('\n📊 Analysis Results:');
      console.log('🍽️ Eating Order:');
      analysis.eatingOrder?.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.foodName} - ${item.reason}`);
      });
      
      console.log('\n📈 Glucose Prediction:');
      console.log(`   Peak Glucose: ${analysis.glucosePrediction?.predictedPeakGlucose} mg/dL`);
      console.log(`   Time to Peak: ${analysis.glucosePrediction?.timeToReachPeak} minutes`);
      console.log(`   After 2 Hours: ${analysis.glucosePrediction?.predictedGlucoseAfter2Hours} mg/dL`);
      console.log(`   Risk Level: ${analysis.glucosePrediction?.riskLevel}`);
      
      console.log('\n💡 Recommendations:');
      analysis.recommendations?.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });

      console.log('\n🧮 Nutritional Estimates:');
      analysis.nutritionalEstimates?.forEach((est) => {
        console.log(`   ${est.foodName}:`);
        console.log(`     Calories: ${est.estimatedNutrition.calories}`);
        console.log(`     Carbs: ${est.estimatedNutrition.carbohydrates}g`);
        console.log(`     Confidence: ${est.confidence}`);
      });

    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error.response?.data || error.message);
      
      if (error.response?.status === 500) {
        console.log('💡 This might be due to:');
        console.log('   - Missing or invalid OpenAI API key');
        console.log('   - OpenAI API rate limits');
        console.log('   - Network connectivity issues');
      }
    }

    // Test 3: Get analysis history
    console.log('\n📚 Step 3: Testing analysis history...');
    
    try {
      const historyResponse = await axios.get(`${BASE_URL}/openai/history?limit=5`);

      console.log('✅ Analysis history retrieved successfully');
      console.log(`📊 Total analyses: ${historyResponse.data.data.analyses.length}`);
      
      historyResponse.data.data.analyses.forEach((analysis, index) => {
        console.log(`   ${index + 1}. ${analysis.glucosePrediction?.riskLevel} risk - ${new Date(analysis.createdAt).toLocaleDateString()}`);
      });

    } catch (error) {
      console.error('❌ Failed to get analysis history:', error.response?.data || error.message);
    }

    // Test 4: Get analysis statistics
    console.log('\n📈 Step 4: Testing analysis statistics...');
    
    try {
      const statsResponse = await axios.get(`${BASE_URL}/openai/stats`);

      console.log('✅ Analysis statistics retrieved successfully');
      const stats = statsResponse.data.data.stats;
      console.log(`📊 Statistics (last 30 days):`);
      console.log(`   Total Analyses: ${stats.totalAnalyses}`);
      console.log(`   High Risk Meals: ${stats.highRiskMeals}`);
      console.log(`   Moderate Risk Meals: ${stats.moderateRiskMeals}`);
      console.log(`   Low Risk Meals: ${stats.lowRiskMeals}`);
      console.log(`   Average Processing Time: ${stats.averageProcessingTime}ms`);

    } catch (error) {
      console.error('❌ Failed to get analysis statistics:', error.response?.data || error.message);
    }

    console.log('\n🎉 OpenAI Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testOpenAIIntegration();
}

module.exports = { testOpenAIIntegration };
