#!/usr/bin/env node

/**
 * Railway Deployment Readiness Check
 * This script verifies that your project is ready for Railway deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Railway Deployment Readiness Check');
console.log('=====================================\n');

const checks = [];

// Check 1: package.json exists and has required scripts
function checkPackageJson() {
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.start) {
      checks.push({ name: 'package.json start script', status: '✅', message: 'Found start script' });
    } else {
      checks.push({ name: 'package.json start script', status: '❌', message: 'Missing start script' });
    }
    
    if (packageJson.main) {
      checks.push({ name: 'package.json main entry', status: '✅', message: `Main entry: ${packageJson.main}` });
    } else {
      checks.push({ name: 'package.json main entry', status: '⚠️', message: 'No main entry specified' });
    }
    
  } catch (error) {
    checks.push({ name: 'package.json', status: '❌', message: 'package.json not found or invalid' });
  }
}

// Check 2: Railway configuration file
function checkRailwayConfig() {
  const railwayTomlPath = path.join(__dirname, 'railway.toml');
  if (fs.existsSync(railwayTomlPath)) {
    checks.push({ name: 'railway.toml', status: '✅', message: 'Railway configuration found' });
  } else {
    checks.push({ name: 'railway.toml', status: '⚠️', message: 'No railway.toml (optional but recommended)' });
  }
}

// Check 3: Environment variables template
function checkEnvExample() {
  const envExamplePath = path.join(__dirname, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    checks.push({ name: '.env.example', status: '✅', message: 'Environment template found' });
  } else {
    checks.push({ name: '.env.example', status: '⚠️', message: 'No .env.example file' });
  }
}

// Check 4: Server configuration
function checkServerConfig() {
  try {
    const serverPath = path.join(__dirname, 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    if (serverContent.includes('process.env.PORT')) {
      checks.push({ name: 'Dynamic port configuration', status: '✅', message: 'Uses process.env.PORT' });
    } else {
      checks.push({ name: 'Dynamic port configuration', status: '❌', message: 'Not using process.env.PORT' });
    }
    
    if (serverContent.includes('/health')) {
      checks.push({ name: 'Health check endpoint', status: '✅', message: 'Health check endpoint found' });
    } else {
      checks.push({ name: 'Health check endpoint', status: '⚠️', message: 'No health check endpoint' });
    }
    
  } catch (error) {
    checks.push({ name: 'Server configuration', status: '❌', message: 'server.js not found' });
  }
}

// Check 5: Database configuration
function checkDatabaseConfig() {
  try {
    const dbPath = path.join(__dirname, 'config/database.js');
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    
    if (dbContent.includes('process.env.MONGODB_URI')) {
      checks.push({ name: 'Database configuration', status: '✅', message: 'Uses environment variable for DB connection' });
    } else {
      checks.push({ name: 'Database configuration', status: '❌', message: 'Not using environment variable for DB' });
    }
    
  } catch (error) {
    checks.push({ name: 'Database configuration', status: '❌', message: 'Database config not found' });
  }
}

// Check 6: Dependencies
function checkDependencies() {
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = ['express', 'mongoose', 'dotenv'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
      checks.push({ name: 'Required dependencies', status: '✅', message: 'All required dependencies found' });
    } else {
      checks.push({ name: 'Required dependencies', status: '❌', message: `Missing: ${missingDeps.join(', ')}` });
    }
    
  } catch (error) {
    checks.push({ name: 'Dependencies check', status: '❌', message: 'Could not check dependencies' });
  }
}

// Run all checks
checkPackageJson();
checkRailwayConfig();
checkEnvExample();
checkServerConfig();
checkDatabaseConfig();
checkDependencies();

// Display results
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.message}`);
});

console.log('\n📋 Summary:');
const passed = checks.filter(c => c.status === '✅').length;
const warnings = checks.filter(c => c.status === '⚠️').length;
const failed = checks.filter(c => c.status === '❌').length;

console.log(`✅ Passed: ${passed}`);
console.log(`⚠️ Warnings: ${warnings}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 Your project is ready for Railway deployment!');
  console.log('\nNext steps:');
  console.log('1. Push your code to GitHub/GitLab');
  console.log('2. Create a new Railway project');
  console.log('3. Connect your repository');
  console.log('4. Set environment variables in Railway dashboard');
  console.log('5. Deploy!');
  console.log('\nSee RAILWAY_DEPLOYMENT.md for detailed instructions.');
} else {
  console.log('\n⚠️ Please fix the failed checks before deploying to Railway.');
}
