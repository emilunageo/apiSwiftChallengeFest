const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  nombre: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  edad: 30,
  peso: 70,
  altura: 1.75,
  tipo_diabetes: 'tipo 2'
};

const testGlucoseReading = {
  value: 120,
  unit: 'mg/dL',
  readingType: 'random',
  mealContext: 'none',
  notes: 'Test reading'
};

const testFoodAnalysis = {
  detectedFoods: [
    {
      name: 'Apple',
      confidence: 85.5,
      portion: 150
    },
    {
      name: 'Banana',
      confidence: 92.3,
      portion: 120
    }
  ],
  mealType: 'snack',
  currentGlucose: 120,
  photoUrl: null
};

let authToken = '';

async function testAPI() {
  try {
    console.log('🧪 Testing Food Analysis API...\n');

    // 1. Register user
    console.log('1. Registering test user...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ User registered successfully');
      authToken = registerResponse.data.data.token;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('ya existe')) {
        console.log('ℹ️ User already exists, logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        authToken = loginResponse.data.data.token;
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    const headers = { Authorization: `Bearer ${authToken}` };

    // 2. Test glucose reading creation
    console.log('\n2. Creating glucose reading...');
    const glucoseResponse = await axios.post(`${BASE_URL}/glucose/reading`, testGlucoseReading, { headers });
    console.log('✅ Glucose reading created:', glucoseResponse.data.data.reading.value, 'mg/dL');

    // 3. Test current glucose reading
    console.log('\n3. Getting current glucose reading...');
    const currentGlucoseResponse = await axios.get(`${BASE_URL}/glucose/current`, { headers });
    console.log('✅ Current glucose:', currentGlucoseResponse.data.data.reading.value, 'mg/dL');

    // 4. Test food analysis
    console.log('\n4. Analyzing foods...');
    const analysisResponse = await axios.post(`${BASE_URL}/food-analysis/analyze`, testFoodAnalysis, { headers });
    const analysis = analysisResponse.data.data.analysis;
    console.log('✅ Food analysis completed:');
    console.log('   - Risk Level:', analysis.glucosePrediction.riskLevel);
    console.log('   - Peak Glucose:', analysis.glucosePrediction.peakValue, 'mg/dL');
    console.log('   - Peak Time:', analysis.glucosePrediction.peakTime, 'minutes');
    console.log('   - Total Calories:', analysis.analysis.totalCalories);
    console.log('   - Total Carbs:', analysis.analysis.totalCarbs, 'g');
    console.log('   - Recommendations:', analysis.recommendations.length);

    // 5. Test analysis history
    console.log('\n5. Getting analysis history...');
    const historyResponse = await axios.get(`${BASE_URL}/food-analysis/history`, { headers });
    console.log('✅ Analysis history retrieved:', historyResponse.data.data.analyses.length, 'analyses');

    // 6. Test feedback submission
    console.log('\n6. Submitting feedback...');
    const feedbackResponse = await axios.put(`${BASE_URL}/food-analysis/${analysis.id}/feedback`, {
      rating: 5,
      helpful: true,
      comments: 'Great analysis!'
    }, { headers });
    console.log('✅ Feedback submitted successfully');

    // 7. Test glucose statistics
    console.log('\n7. Getting glucose statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/glucose/stats?days=7`, { headers });
    console.log('✅ Glucose stats retrieved:', statsResponse.data.data.stats);

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run tests
testAPI();
