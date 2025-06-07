# Railway Deployment Guide

This guide will help you deploy your Diabetes Management API to Railway.com.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Your code pushed to a Git repository (GitHub, GitLab, etc.)
3. MongoDB Atlas database (already configured in your project)

## Deployment Steps

### 1. Create a New Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In your Railway project dashboard, go to the "Variables" tab and add these environment variables:

**Required Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://swiftChallenge:%2313swiftChallengePass%232025@cluster0.khix41i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=70a6632680d41eabf88f48f7a18166c728b927b5b345b222d8813487d4eb71b5815991ef1939d09032391fd579cc526fdd7841a3bf88ca673d6ebef73067510e
JWT_EXPIRE=7d
FRONTEND_URL=*
```

**Important Notes:**
- The `MONGODB_URI` is already configured for your MongoDB Atlas cluster
- The `JWT_SECRET` is your existing secret (consider generating a new one for production)
- `FRONTEND_URL=*` allows all origins (update this to your frontend domain for better security)
- Railway automatically provides the `PORT` variable, so you don't need to set it

### 3. Deploy

1. Railway will automatically deploy when you push to your main branch
2. The deployment process will:
   - Install dependencies (`npm install`)
   - Run the build command (`npm run build`)
   - Start the application (`npm start`)

### 4. Monitor Deployment

1. Check the "Deployments" tab to see the build progress
2. View logs in the "Logs" tab
3. Once deployed, Railway will provide a public URL

### 5. Test Your Deployment

Your API will be available at the Railway-provided URL. Test these endpoints:

- `GET /health` - Health check
- `GET /` - API information
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Configuration Files

The following files have been configured for Railway deployment:

### `railway.toml`
- Configures Railway-specific settings
- Sets up health checks on `/health` endpoint
- Configures restart policy

### `package.json`
- Updated with build script for Railway
- Start script configured for production

### `server.js`
- Configured to listen on `0.0.0.0` for Railway compatibility
- Uses `process.env.PORT` for dynamic port assignment

## Database Configuration

Your MongoDB Atlas database is already configured and will work seamlessly with Railway:

- **Development**: Uses local MongoDB or Atlas (as configured in `.env`)
- **Production**: Uses MongoDB Atlas connection string from environment variables
- **Connection**: Automatic failover and retry logic built-in

## Security Considerations

For production deployment, consider:

1. **JWT Secret**: Generate a new, secure JWT secret for production
2. **CORS**: Update `FRONTEND_URL` to your specific frontend domain
3. **Environment Variables**: Never commit sensitive data to your repository
4. **Database**: Your MongoDB Atlas cluster is already secured with authentication

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Verify `MONGODB_URI` is correctly set in Railway environment variables
   - Check MongoDB Atlas network access settings (allow all IPs: 0.0.0.0/0)

2. **Application Won't Start**
   - Check Railway logs for specific error messages
   - Verify all required environment variables are set

3. **Health Check Failing**
   - Ensure `/health` endpoint is accessible
   - Check if the application is binding to the correct port

### Useful Railway Commands:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# View logs
railway logs

# Open your deployed app
railway open
```

## Local Development

Your local development setup remains unchanged:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will run on http://localhost:3000
```

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- MongoDB Atlas Documentation: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
