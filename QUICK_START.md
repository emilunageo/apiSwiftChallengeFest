# 🚀 Quick Start Guide - Diabetes Management API

## 📦 What's Included

Your hackathon-ready REST API includes:

- ✅ **User Authentication** (JWT-based)
- ✅ **User Management** (registration, login, profile)
- ✅ **Food Database** (CRUD operations with diabetes-specific data)
- ✅ **Diabetes Features** (glycemic index, recommendations)
- ✅ **Security** (CORS, Helmet, password hashing)
- ✅ **Production Ready** (error handling, validation)

## 🏃‍♂️ Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (MongoDB URI, JWT secret, etc.)
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) - just update MONGODB_URI in .env
```

### 4. Run the API
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Test the API
```bash
# Check if it's running
curl http://localhost:3000/health

# Or run the test script
node test-api.js
```

## 🌐 Quick Deploy to VPS

### 1. Server Setup
```bash
# On your VPS
./deploy.sh server
```

### 2. Deploy App
```bash
# Clone your repo and run
./deploy.sh app
```

### 3. (Optional) Set up Nginx
```bash
./deploy.sh nginx
```

## 📋 Essential API Endpoints

### Authentication
```bash
# Register
POST /api/auth/register
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "edad": 35,
  "peso": 75.5,
  "altura": 1.75,
  "tipo_diabetes": "tipo 2"
}

# Login
POST /api/auth/login
{
  "email": "juan@example.com",
  "password": "password123"
}
```

### Foods
```bash
# Get all foods
GET /api/foods

# Get recommended foods for diabetes
GET /api/foods/recommended

# Create food
POST /api/foods
{
  "nombre": "Arroz integral",
  "id_tipo": "cereales",
  "indice_glucemico": 50,
  "carga_glucemica": 16,
  "carbohidratos_totales": 23,
  "grasas": 0.9,
  "proteinas": 2.6,
  "fibra": 1.8,
  "tiempo_digestion_estimado": 120
}
```

### User Profile
```bash
# Get profile (requires auth token)
GET /api/users/profile
Authorization: Bearer <your-token>

# Update profile
PUT /api/users/profile
Authorization: Bearer <your-token>
{
  "peso": 74.0,
  "glucosa_basal": 105
}
```

## 🔧 Useful Commands

```bash
# Seed database with sample foods
node seed-data.js

# Test all endpoints
node test-api.js

# Check server status (if using PM2)
pm2 status

# View logs
pm2 logs diabetes-api

# Restart app
pm2 restart diabetes-api
```

## 🛠️ Customization for Your Hackathon

### Adding New Entities
1. Create model in `models/` folder
2. Create controller in `controllers/` folder
3. Create routes in `routes/` folder
4. Add routes to `server.js`

### Example: Adding Meals Entity
```javascript
// models/Meal.js
const mealSchema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  alimentos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
  fecha: { type: Date, default: Date.now },
  tipo_comida: { type: String, enum: ['desayuno', 'almuerzo', 'cena', 'snack'] }
});

// Add to server.js
app.use('/api/meals', require('./routes/meals'));
```

## 🔐 Security Notes

- JWT tokens expire in 7 days (configurable)
- Passwords are hashed with bcrypt
- CORS is enabled for all origins (configure for production)
- Input validation on all endpoints
- Soft deletes (data is not permanently removed)

## 📊 Database Schema

### User Fields
- `nombre`, `email`, `password`
- `edad`, `peso`, `altura`
- `tipo_diabetes` (tipo 1, tipo 2, prediabetes)
- `glucosa_basal`, `preferencias_alimenticias`

### Food Fields
- `nombre`, `id_tipo`
- `indice_glucemico`, `carga_glucemica`
- `carbohidratos_totales`, `grasas`, `proteinas`, `fibra`
- `tiempo_digestion_estimado`

## 🆘 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### API Not Responding
```bash
# Check server logs
pm2 logs diabetes-api

# Restart the application
pm2 restart diabetes-api
```

## 🎯 Ready for Hackathon!

Your API is now ready for your hackathon project. You can:

1. **Focus on your frontend** - the backend is complete
2. **Add new features** - easily extend with new entities
3. **Deploy quickly** - use the deployment scripts
4. **Scale up** - the architecture supports growth

Good luck with your hackathon! 🚀
