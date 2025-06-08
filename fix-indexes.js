const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Food = require('./models/Food');

// Load environment variables
dotenv.config();

async function fixIndexes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diabetes_api');
    console.log('✅ Connected to MongoDB');

    // Drop existing indexes (except _id)
    console.log('🗑️ Dropping existing indexes...');
    try {
      await Food.collection.dropIndexes();
      console.log('✅ Existing indexes dropped');
    } catch (error) {
      console.log('⚠️ No indexes to drop or error dropping:', error.message);
    }

    // Create new indexes
    console.log('🔧 Creating new indexes...');
    
    // Create text index for search
    await Food.collection.createIndex({ nombre: 'text' });
    console.log('✅ Text index created for nombre');
    
    // Create regular index for nombre (for regex searches)
    await Food.collection.createIndex({ nombre: 1 });
    console.log('✅ Regular index created for nombre');
    
    // Create other useful indexes
    await Food.collection.createIndex({ id_tipo: 1 });
    console.log('✅ Index created for id_tipo');
    
    await Food.collection.createIndex({ indice_glucemico: 1 });
    console.log('✅ Index created for indice_glucemico');
    
    await Food.collection.createIndex({ es_recomendado_diabetes: 1 });
    console.log('✅ Index created for es_recomendado_diabetes');

    // List all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await Food.collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Indexes fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
if (require.main === module) {
  fixIndexes();
}

module.exports = { fixIndexes };
