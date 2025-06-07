#!/bin/bash

# Diabetes Management API Deployment Script
# This script helps deploy the API to a VPS server

echo "🚀 Diabetes Management API Deployment Script"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're on the server or local machine
if [ "$1" = "server" ]; then
    echo "📦 Setting up server environment..."
    
    # Update system
    print_status "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install MongoDB
    print_status "Installing MongoDB..."
    sudo apt install mongodb -y
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    
    # Install PM2
    print_status "Installing PM2..."
    sudo npm install -g pm2
    
    # Install Nginx (optional)
    read -p "Do you want to install Nginx for reverse proxy? (y/n): " install_nginx
    if [ "$install_nginx" = "y" ]; then
        print_status "Installing Nginx..."
        sudo apt install nginx -y
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi
    
    print_status "Server setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Clone your repository"
    echo "2. Run: ./deploy.sh app"
    
elif [ "$1" = "app" ]; then
    echo "🔧 Deploying application..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install --production
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        echo ""
        print_warning "Please edit .env file with your production values:"
        echo "- Set a strong JWT_SECRET"
        echo "- Configure MONGODB_URI if using remote MongoDB"
        echo "- Set NODE_ENV=production"
        echo ""
        read -p "Press enter when you've configured .env file..."
    fi
    
    # Seed database with sample data
    read -p "Do you want to seed the database with sample food data? (y/n): " seed_db
    if [ "$seed_db" = "y" ]; then
        print_status "Seeding database..."
        node seed-data.js
    fi
    
    # Start application with PM2
    print_status "Starting application with PM2..."
    pm2 stop diabetes-api 2>/dev/null || true
    pm2 delete diabetes-api 2>/dev/null || true
    pm2 start server.js --name "diabetes-api"
    pm2 startup
    pm2 save
    
    # Show status
    pm2 status
    
    print_status "Application deployed successfully!"
    echo ""
    echo "🌐 Your API is running on:"
    echo "- Health check: http://your-server-ip:3000/health"
    echo "- API docs: http://your-server-ip:3000/"
    echo ""
    echo "📊 Useful commands:"
    echo "- View logs: pm2 logs diabetes-api"
    echo "- Restart app: pm2 restart diabetes-api"
    echo "- Stop app: pm2 stop diabetes-api"
    
elif [ "$1" = "nginx" ]; then
    echo "🌐 Configuring Nginx reverse proxy..."
    
    read -p "Enter your domain name (or server IP): " domain_name
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/diabetes-api > /dev/null <<EOF
server {
    listen 80;
    server_name $domain_name;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/diabetes-api /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    
    print_status "Nginx configured successfully!"
    echo "Your API is now available at: http://$domain_name"
    
elif [ "$1" = "test" ]; then
    echo "🧪 Testing API endpoints..."
    
    # Check if server is running
    if ! curl -s http://localhost:3000/health > /dev/null; then
        print_error "Server is not running on port 3000"
        exit 1
    fi
    
    # Install axios for testing
    npm install axios --no-save
    
    # Run test script
    node test-api.js
    
else
    echo "Usage: $0 [server|app|nginx|test]"
    echo ""
    echo "Commands:"
    echo "  server  - Set up server environment (Node.js, MongoDB, PM2)"
    echo "  app     - Deploy the application"
    echo "  nginx   - Configure Nginx reverse proxy"
    echo "  test    - Test API endpoints"
    echo ""
    echo "Example deployment workflow:"
    echo "1. On your VPS: ./deploy.sh server"
    echo "2. Clone your repo and cd into it"
    echo "3. ./deploy.sh app"
    echo "4. (Optional) ./deploy.sh nginx"
    echo "5. ./deploy.sh test"
fi
