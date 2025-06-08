const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('🔍 Configuration Check\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
console.log('📁 Checking .env file...');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  
  // Read .env content (safely)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('📋 Environment variables in .env:');
  lines.forEach(line => {
    const [key] = line.split('=');
    if (key) {
      console.log(`   ${key}`);
    }
  });
} else {
  console.log('❌ .env file not found');
  console.log('💡 Create it with: touch .env');
}

console.log('\n🔑 OpenAI Configuration...');
if (process.env.OPENAI_API_KEY) {
  console.log('✅ OPENAI_API_KEY is set');
  console.log(`🔍 Key format: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
  console.log(`📏 Key length: ${process.env.OPENAI_API_KEY.length} characters`);
  
  // Basic validation
  if (process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('✅ Key format looks correct (starts with sk-)');
  } else {
    console.log('⚠️ Key format might be incorrect (should start with sk-)');
  }
  
  if (process.env.OPENAI_API_KEY.length >= 50) {
    console.log('✅ Key length looks reasonable');
  } else {
    console.log('⚠️ Key might be too short');
  }
} else {
  console.log('❌ OPENAI_API_KEY is not set');
  console.log('💡 Add it to .env file:');
  console.log('   OPENAI_API_KEY=sk-your-openai-key-here');
}

console.log('\n🗄️ Database Configuration...');
if (process.env.MONGODB_URI) {
  console.log('✅ MONGODB_URI is set');
  // Don't show the full URI for security
  console.log(`🔍 URI starts with: ${process.env.MONGODB_URI.substring(0, 20)}...`);
} else {
  console.log('⚠️ MONGODB_URI not set, using default');
}

console.log('\n🌐 Server Configuration...');
console.log(`📡 PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`🏗️ NODE_ENV: ${process.env.NODE_ENV || 'development (default)'}`);

console.log('\n📦 Dependencies Check...');
try {
  const packageJson = require('./package.json');
  const requiredDeps = ['openai', 'axios', 'mongoose', 'express', 'dotenv'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: not found`);
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

console.log('\n🔧 Quick Fix Commands:');
console.log('If OPENAI_API_KEY is missing:');
console.log('  echo "OPENAI_API_KEY=sk-your-key-here" >> .env');
console.log('\nIf openai package is missing:');
console.log('  npm install openai');
console.log('\nTo restart server:');
console.log('  npm run dev');
