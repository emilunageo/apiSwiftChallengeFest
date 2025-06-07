# Diabetes Management API

A simple REST API for diabetes management built for hackathon projects. This API provides user authentication and food management with diabetes-specific features.

## 🚀 Features

- **User Management**: Registration, login, profile management
- **JWT Authentication**: Secure token-based authentication
- **Food Database**: CRUD operations for food items with diabetes-specific data
- **Diabetes-Specific**: Glycemic index, glycemic load, and food recommendations
- **Search & Filtering**: Advanced food search and filtering capabilities
- **BMI Calculation**: Automatic BMI calculation and classification
- **Soft Deletes**: Safe data deletion with recovery options

## 📋 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/diabetes_api
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB** (if using local MongoDB)
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Test the API**
   ```bash
   curl http://localhost:3000/health
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "edad": 35,
  "peso": 75.5,
  "altura": 1.75,
  "tipo_diabetes": "tipo 2",
  "glucosa_basal": 110,
  "preferencias_alimenticias": ["vegetariano"]
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your-jwt-token>
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <your-jwt-token>
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "peso": 74.0,
  "glucosa_basal": 105
}
```

#### Get User Statistics
```http
GET /api/users/stats
Authorization: Bearer <your-jwt-token>
```

### Food Endpoints

#### Get All Foods
```http
GET /api/foods?page=1&limit=20&search=arroz&tipo=cereales&recomendado_diabetes=true
```

#### Get Single Food
```http
GET /api/foods/:id
```

#### Create Food
```http
POST /api/foods
Content-Type: application/json

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

#### Update Food
```http
PUT /api/foods/:id
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "indice_glucemico": 48
}
```

#### Delete Food
```http
DELETE /api/foods/:id
Authorization: Bearer <your-jwt-token>
```

#### Get Recommended Foods
```http
GET /api/foods/recommended
```

## 🚀 Deployment

### VPS Deployment

1. **Prepare your VPS**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install MongoDB
   sudo apt install mongodb -y
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

2. **Deploy your application**
   ```bash
   # Clone your repository
   git clone <your-repo-url>
   cd api
   
   # Install dependencies
   npm install --production
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with production values
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Start the application
   pm2 start server.js --name "diabetes-api"
   pm2 startup
   pm2 save
   ```

3. **Set up reverse proxy (optional)**
   ```bash
   # Install Nginx
   sudo apt install nginx -y
   
   # Configure Nginx (create /etc/nginx/sites-available/diabetes-api)
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   
   # Enable the site
   sudo ln -s /etc/nginx/sites-available/diabetes-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🧪 Testing

Test the API endpoints using curl, Postman, or any HTTP client:

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test User","email":"test@example.com","password":"password123","edad":30,"peso":70,"altura":1.70,"tipo_diabetes":"tipo 2"}'

# Get foods
curl http://localhost:3000/api/foods
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/diabetes_api` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `*` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For hackathon support, check the API health endpoint and logs:

```bash
# Check API status
curl http://localhost:3000/health

# Check logs with PM2
pm2 logs diabetes-api

# Check MongoDB status
sudo systemctl status mongodb
```
