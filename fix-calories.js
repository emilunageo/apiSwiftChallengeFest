const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Food = require('./models/Food');

// Load environment variables
dotenv.config();

async function fixCalories() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diabetes_api');
    console.log('✅ Connected to MongoDB');

    // Find all foods without calories
    const foodsWithoutCalories = await Food.find({ 
      $or: [
        { calorias_por_100g: { $exists: false } },
        { calorias_por_100g: null },
        { calorias_por_100g: 0 }
      ]
    });

    console.log(`📊 Found ${foodsWithoutCalories.length} foods without calories`);

    for (const food of foodsWithoutCalories) {
      // Calculate calories: 4 cal/g carbs, 4 cal/g protein, 9 cal/g fat
      const calculatedCalories = Math.round(
        (food.carbohidratos_totales * 4) + 
        (food.proteinas * 4) + 
        (food.grasas * 9)
      );

      console.log(`🔧 Fixing ${food.nombre}: ${calculatedCalories} calories`);
      
      // Update the food
      await Food.findByIdAndUpdate(food._id, {
        calorias_por_100g: calculatedCalories
      });
    }

    // Verify the fix
    console.log('\n📋 Updated foods:');
    const updatedFoods = await Food.find({});
    updatedFoods.forEach(food => {
      console.log(`   - ${food.nombre}: ${food.calorias_por_100g} calories`);
    });

    console.log('\n✅ Calories fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing calories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
if (require.main === module) {
  fixCalories();
}

module.exports = { fixCalories };
