const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

async function testSimpleOpenAI() {
  try {
    console.log('🧪 Simple OpenAI Test...\n');

    // Check if OpenAI API key is configured
    console.log('🔑 Checking OpenAI API key...');
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY not found in environment variables');
      console.log('📝 Please add your OpenAI API key to the .env file:');
      console.log('   OPENAI_API_KEY=sk-your-key-here\n');
      return;
    } else {
      console.log('✅ OpenAI API key found');
      console.log(`🔍 Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
    }

    // Test very simple meal data
    console.log('\n🍎 Testing with simple meal data...');
    
    const simpleMealData = {
      mealData: {
        mealType: 'snack',
        items: [
          {
            name: 'Manzana',
            portion: { amount: 150, unit: 'grams' },
            nutritionalInfo: {
              calories: 78,
              carbohydrates: 21,
              protein: 0.4,
              fat: 0.2,
              fiber: 2.4,
              glycemicIndex: 36
            }
          }
        ]
      },
      baselineGlucose: 80,
      userProfile: {
        tipo_diabetes: 'type 2',
        edad: 30,
        peso: 70
      }
    };

    console.log('📤 Sending request to OpenAI endpoint...');
    console.log('🔗 URL:', `${BASE_URL}/openai/analyze-meal`);
    
    try {
      const response = await axios.post(`${BASE_URL}/openai/analyze-meal`, simpleMealData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('✅ OpenAI analysis successful!');
      console.log('📊 Response status:', response.status);
      console.log('📋 Analysis ID:', response.data.data._id);
      
      if (response.data.data.eatingOrder) {
        console.log('\n🍽️ Eating Order:');
        response.data.data.eatingOrder.forEach((item, index) => {
          console.log(`   ${item.order}. ${item.foodName} - ${item.reason}`);
        });
      }
      
      if (response.data.data.glucosePrediction) {
        console.log('\n📈 Glucose Prediction:');
        console.log(`   Peak: ${response.data.data.glucosePrediction.predictedPeakGlucose} mg/dL`);
        console.log(`   Risk: ${response.data.data.glucosePrediction.riskLevel}`);
      }

    } catch (error) {
      console.log('❌ Request failed');
      console.log('📊 Status:', error.response?.status);
      console.log('📝 Error message:', error.response?.data?.message || error.message);
      console.log('🔍 Full error:', error.response?.data || error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Server is not running. Please start the server with:');
        console.log('   npm start');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test OpenAI service directly
async function testOpenAIServiceDirect() {
  try {
    console.log('\n🔧 Testing OpenAI service directly...');
    
    const openaiService = require('./services/openaiService');
    
    const testMeal = {
      mealType: 'snack',
      items: [
        {
          name: 'Manzana',
          portion: { amount: 150, unit: 'grams' },
          nutritionalInfo: {
            calories: 78,
            carbohydrates: 21,
            protein: 0.4,
            fat: 0.2,
            fiber: 2.4,
            glycemicIndex: 36
          }
        }
      ]
    };

    const userProfile = {
      tipo_diabetes: 'type 2',
      edad: 30,
      peso: 70
    };

    console.log('📤 Calling OpenAI service...');
    const result = await openaiService.analyzeMeal(testMeal, 80, userProfile);
    
    console.log('✅ Direct service call successful!');
    console.log('📋 Result keys:', Object.keys(result));
    
  } catch (error) {
    console.log('❌ Direct service call failed:', error.message);
    
    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('💡 API key issue detected');
    } else if (error.message.includes('network')) {
      console.log('💡 Network connectivity issue');
    } else if (error.message.includes('rate limit')) {
      console.log('💡 OpenAI rate limit reached');
    }
  }
}

async function runTests() {
  await testSimpleOpenAI();
  await testOpenAIServiceDirect();
}

// Run the test
if (require.main === module) {
  runTests();
}

module.exports = { testSimpleOpenAI, testOpenAIServiceDirect };
