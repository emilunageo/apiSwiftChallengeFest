const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Diabetes Management API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test root endpoint
    console.log('2. Testing root endpoint...');
    const rootResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Root endpoint:', rootResponse.data);
    console.log('');

    // Test foods endpoint (should work without auth)
    console.log('3. Testing foods endpoint...');
    const foodsResponse = await axios.get(`${BASE_URL}/api/foods`);
    console.log('✅ Foods endpoint:', foodsResponse.data);
    console.log('');

    // Test user registration
    console.log('4. Testing user registration...');
    const userData = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      edad: 30,
      peso: 70,
      altura: 1.70,
      tipo_diabetes: 'tipo 2'
    };

    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, userData);
    console.log('✅ User registration:', registerResponse.data);
    console.log('');

    // Test user login
    console.log('5. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ User login:', loginResponse.data);
    
    const token = loginResponse.data.data.token;
    console.log('');

    // Test protected endpoint
    console.log('6. Testing protected endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ User profile:', profileResponse.data);
    console.log('');

    // Test food creation
    console.log('7. Testing food creation...');
    const foodData = {
      nombre: 'Arroz integral',
      id_tipo: 'cereales',
      indice_glucemico: 50,
      carga_glucemica: 16,
      carbohidratos_totales: 23,
      grasas: 0.9,
      proteinas: 2.6,
      fibra: 1.8,
      tiempo_digestion_estimado: 120
    };

    const createFoodResponse = await axios.post(`${BASE_URL}/api/foods`, foodData);
    console.log('✅ Food creation:', createFoodResponse.data);
    console.log('');

    console.log('🎉 All tests passed! API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Install axios if not present
const { exec } = require('child_process');
exec('npm list axios', (error) => {
  if (error) {
    console.log('Installing axios...');
    exec('npm install axios', (installError) => {
      if (installError) {
        console.error('Failed to install axios:', installError);
        return;
      }
      testAPI();
    });
  } else {
    testAPI();
  }
});
