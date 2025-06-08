const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Food = require('./models/Food');

// Load environment variables
dotenv.config();

async function testFoodSearch() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diabetes_api');
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if any foods exist
    const totalFoods = await Food.countDocuments();
    console.log(`📊 Total foods in database: ${totalFoods}`);

    if (totalFoods === 0) {
      console.log('⚠️ No foods found in database. Running seeder...');
      const { seedDatabase } = require('./seed-data');
      await seedDatabase();
      return;
    }

    // Test 2: Search for "Aguacate" specifically
    console.log('\n🔍 Searching for "Aguacate"...');
    
    // Text search
    const textSearchResults = await Food.find({ $text: { $search: "Aguacate" } });
    console.log(`📋 Text search results: ${textSearchResults.length}`);
    textSearchResults.forEach(food => {
      console.log(`   - ${food.nombre} (ID: ${food._id})`);
      console.log(`     Calories: ${food.calorias_por_100g || 'Not set'}`);
      console.log(`     Carbs: ${food.carbohidratos_totales}g`);
      console.log(`     Protein: ${food.proteinas}g`);
      console.log(`     Fat: ${food.grasas}g`);
      console.log(`     Fiber: ${food.fibra}g`);
      console.log(`     GI: ${food.indice_glucemico}`);
    });

    // Regex search
    const regexSearchResults = await Food.find({ nombre: { $regex: "Aguacate", $options: 'i' } });
    console.log(`📋 Regex search results: ${regexSearchResults.length}`);
    regexSearchResults.forEach(food => {
      console.log(`   - ${food.nombre} (ID: ${food._id})`);
    });

    // Test 3: List all foods
    console.log('\n📋 All foods in database:');
    const allFoods = await Food.find({}).limit(20);
    allFoods.forEach((food, index) => {
      console.log(`${index + 1}. ${food.nombre} - Calories: ${food.calorias_por_100g || 'Not set'}`);
    });

    // Test 4: Test the exact search logic from the API
    console.log('\n🔍 Testing API search logic...');
    const searchQuery = "Aguacate";
    const apiSearchResults = await Food.find({
      $or: [
        { $text: { $search: searchQuery } },
        { nombre: { $regex: searchQuery, $options: 'i' } }
      ]
    }).limit(5);

    console.log(`📋 API search results for "${searchQuery}": ${apiSearchResults.length}`);
    apiSearchResults.forEach(food => {
      console.log(`   - ${food.nombre} (ID: ${food._id})`);
      console.log(`     Full data:`, {
        calorias_por_100g: food.calorias_por_100g,
        carbohidratos_totales: food.carbohidratos_totales,
        proteinas: food.proteinas,
        grasas: food.grasas,
        fibra: food.fibra,
        indice_glucemico: food.indice_glucemico
      });
    });

  } catch (error) {
    console.error('❌ Error testing food search:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testFoodSearch();
}

module.exports = { testFoodSearch };
