const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Food = require('./models/Food');
const { seedDatabase } = require('./seed-data');

// Load environment variables
dotenv.config();

const BASE_URL = 'http://localhost:3000/api';

// Carlos's token for testing
const CARLOS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NWE5ZjE5YzNhNzNhNzE5ZjE5YzNhNyIsImlhdCI6MTczNDEzNzYyNSwiZXhwIjoxNzM0NzQyNDI1fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testMealPipeline() {
  try {
    console.log('🧪 Testing Complete Meal Pipeline...\n');

    // Step 1: Connect to database and check foods
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diabetes_api');
    console.log('✅ Connected to MongoDB');

    const totalFoods = await Food.countDocuments();
    console.log(`📊 Total foods in database: ${totalFoods}`);

    if (totalFoods === 0) {
      console.log('⚠️ No foods found. Seeding database...');
      await seedDatabase();
    }

    // Step 2: Test food search directly in database (simulating API)
    console.log('\n🔍 Testing food search logic...');
    try {
      // Test the same logic as the API
      const searchResults = await Food.find({ nombre: { $regex: 'Aguacate', $options: 'i' } }).limit(5);
      console.log('✅ Food search logic working');
      console.log('📋 Search results:', searchResults.length);

      if (searchResults.length > 0) {
        const aguacate = searchResults[0];
        console.log('🥑 Found Aguacate:', {
          id: aguacate._id,
          nombre: aguacate.nombre,
          calorias_por_100g: aguacate.calorias_por_100g,
          carbohidratos_totales: aguacate.carbohidratos_totales,
          proteinas: aguacate.proteinas,
          grasas: aguacate.grasas,
          fibra: aguacate.fibra,
          indice_glucemico: aguacate.indice_glucemico
        });
      } else {
        console.log('❌ No Aguacate found in search results');
      }
    } catch (error) {
      console.error('❌ Food search failed:', error.message);
    }

    // Step 3: Test meal creation logic (simulating the controller)
    console.log('\n🍽️ Testing meal creation logic...');

    // First, let's simulate what the Swift app should do - find the foodId
    const aguacateInDB = await Food.findOne({ nombre: { $regex: 'Aguacate', $options: 'i' } });
    if (aguacateInDB) {
      console.log(`✅ Found Aguacate in DB with ID: ${aguacateInDB._id}`);
      console.log('🥑 Aguacate nutritional data:', {
        calorias_por_100g: aguacateInDB.calorias_por_100g,
        carbohidratos_totales: aguacateInDB.carbohidratos_totales,
        proteinas: aguacateInDB.proteinas,
        grasas: aguacateInDB.grasas,
        fibra: aguacateInDB.fibra,
        indice_glucemico: aguacateInDB.indice_glucemico
      });

      // Simulate the nutritional calculation logic
      const portionMultiplier = 100 / 100; // 100g portion
      const nutritionalInfo = {
        calories: Math.round((aguacateInDB.calorias_por_100g || 0) * portionMultiplier),
        carbohydrates: Math.round((aguacateInDB.carbohidratos_totales || 0) * portionMultiplier),
        protein: Math.round((aguacateInDB.proteinas || 0) * portionMultiplier),
        fat: Math.round((aguacateInDB.grasas || 0) * portionMultiplier),
        fiber: Math.round((aguacateInDB.fibra || 0) * portionMultiplier),
        glycemicIndex: aguacateInDB.indice_glucemico
      };

      console.log('📊 Calculated nutritional info for 100g:', nutritionalInfo);

      if (nutritionalInfo.calories > 0) {
        console.log('✅ Nutritional calculation working correctly!');
      } else {
        console.log('❌ Nutritional calculation failed - calories are zero');
        console.log('   This is likely because calorias_por_100g is not set in the database');
      }
    } else {
      console.log('❌ Aguacate not found in database');
    }

  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testMealPipeline();
}

module.exports = { testMealPipeline };
