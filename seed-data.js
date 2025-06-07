const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Food = require('./models/Food');

// Load environment variables
dotenv.config();

// Sample food data
const sampleFoods = [
  {
    nombre: 'Arroz integral',
    id_tipo: 'cereales',
    indice_glucemico: 50,
    carga_glucemica: 16,
    carbohidratos_totales: 23,
    grasas: 0.9,
    proteinas: 2.6,
    fibra: 1.8,
    tiempo_digestion_estimado: 120,
    descripcion: 'Arroz integral rico en fibra y nutrientes'
  },
  {
    nombre: 'Manzana',
    id_tipo: 'frutas',
    indice_glucemico: 36,
    carga_glucemica: 5,
    carbohidratos_totales: 14,
    grasas: 0.2,
    proteinas: 0.3,
    fibra: 2.4,
    tiempo_digestion_estimado: 60,
    descripcion: 'Fruta fresca rica en fibra y antioxidantes'
  },
  {
    nombre: 'Brócoli',
    id_tipo: 'verduras',
    indice_glucemico: 10,
    carga_glucemica: 1,
    carbohidratos_totales: 7,
    grasas: 0.4,
    proteinas: 3,
    fibra: 2.6,
    tiempo_digestion_estimado: 90,
    descripcion: 'Verdura crucífera rica en vitaminas y minerales'
  },
  {
    nombre: 'Lentejas',
    id_tipo: 'legumbres',
    indice_glucemico: 32,
    carga_glucemica: 7,
    carbohidratos_totales: 20,
    grasas: 0.4,
    proteinas: 9,
    fibra: 7.9,
    tiempo_digestion_estimado: 180,
    descripcion: 'Legumbre rica en proteínas y fibra'
  },
  {
    nombre: 'Pechuga de pollo',
    id_tipo: 'carnes',
    indice_glucemico: 0,
    carga_glucemica: 0,
    carbohidratos_totales: 0,
    grasas: 3.6,
    proteinas: 31,
    fibra: 0,
    tiempo_digestion_estimado: 240,
    descripcion: 'Carne magra alta en proteínas'
  },
  {
    nombre: 'Salmón',
    id_tipo: 'pescados',
    indice_glucemico: 0,
    carga_glucemica: 0,
    carbohidratos_totales: 0,
    grasas: 13,
    proteinas: 25,
    fibra: 0,
    tiempo_digestion_estimado: 180,
    descripcion: 'Pescado rico en omega-3 y proteínas'
  },
  {
    nombre: 'Yogur griego natural',
    id_tipo: 'lacteos',
    indice_glucemico: 11,
    carga_glucemica: 1,
    carbohidratos_totales: 4,
    grasas: 0.4,
    proteinas: 10,
    fibra: 0,
    tiempo_digestion_estimado: 120,
    descripcion: 'Lácteo fermentado rico en probióticos'
  },
  {
    nombre: 'Aguacate',
    id_tipo: 'grasas',
    indice_glucemico: 15,
    carga_glucemica: 1,
    carbohidratos_totales: 9,
    grasas: 15,
    proteinas: 2,
    fibra: 7,
    tiempo_digestion_estimado: 150,
    descripcion: 'Fruto rico en grasas saludables'
  },
  {
    nombre: 'Almendras',
    id_tipo: 'frutos_secos',
    indice_glucemico: 15,
    carga_glucemica: 1,
    carbohidratos_totales: 6,
    grasas: 49,
    proteinas: 21,
    fibra: 12,
    tiempo_digestion_estimado: 180,
    descripcion: 'Fruto seco rico en grasas saludables y proteínas'
  },
  {
    nombre: 'Quinoa',
    id_tipo: 'cereales',
    indice_glucemico: 53,
    carga_glucemica: 13,
    carbohidratos_totales: 22,
    grasas: 1.9,
    proteinas: 4.4,
    fibra: 2.8,
    tiempo_digestion_estimado: 120,
    descripcion: 'Pseudocereal rico en proteínas completas'
  }
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/diabetes_api');
    console.log('✅ Connected to MongoDB');

    // Clear existing foods
    await Food.deleteMany({});
    console.log('🗑️ Cleared existing foods');

    // Insert sample foods
    const insertedFoods = await Food.insertMany(sampleFoods);
    console.log(`✅ Inserted ${insertedFoods.length} sample foods`);

    // Display inserted foods
    console.log('\n📋 Sample foods added:');
    insertedFoods.forEach((food, index) => {
      console.log(`${index + 1}. ${food.nombre} (${food.id_tipo}) - IG: ${food.indice_glucemico}`);
    });

    console.log('\n🎉 Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleFoods };
