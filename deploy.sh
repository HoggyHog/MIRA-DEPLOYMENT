#!/bin/bash

# Deployment script for Mira AI application
set -e

# Configuration
EC2_HOST="ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"
REMOTE_APP_DIR="~/app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Mira AI Deployment...${NC}"

# Step 0: Setup server dependencies (if needed)
echo -e "${YELLOW}🔧 Checking server dependencies...${NC}"
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "which node && which python3 && which pip3" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
    ./setup_server.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Server setup failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Server dependencies already installed${NC}"
fi

# Step 1: Build the project
echo -e "${YELLOW}📦 Building the project...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 2: Sync code to EC2 server
echo -e "${YELLOW}📤 Syncing code to EC2 server...${NC}"
rsync -avz --exclude 'node_modules' --exclude 'deployment' --exclude '.git' --exclude '.env' --exclude 'venv' \
    -e "ssh -i $SSH_KEY" . $EC2_USER@$EC2_HOST:$REMOTE_APP_DIR

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code synced successfully${NC}"
else
    echo -e "${RED}❌ Code sync failed${NC}"
    exit 1
fi

# Step 3: Install dependencies and setup on server
echo -e "${YELLOW}🔧 Setting up dependencies on server...${NC}"
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
    cd ~/app
    
    # Install Node.js dependencies
    echo "Installing Node.js dependencies..."
    npm install --production
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Install additional dependencies that might be missing
    pip install pypdf
    
    echo "Dependencies installed successfully"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Dependency installation failed${NC}"
    exit 1
fi

# Step 4: Start services on server
echo -e "${YELLOW}🚀 Starting services on server...${NC}"
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
    cd ~/app
    
    # Kill any existing processes
    echo "Stopping existing services..."
    pkill -f "lesson_generator_api.py" || true
    pkill -f "node.*dist/index.js" || true
    pkill -f "npm.*dev" || true
    
    sleep 2
    
    # Start FastAPI service
    echo "Starting FastAPI service on port 8001..."
    source venv/bin/activate
    nohup python lesson_generator_api.py > fastapi.log 2>&1 &
    FASTAPI_PID=$!
    
    # Wait for FastAPI to start
    sleep 5
    
    # Check if FastAPI is running
    if curl -s http://localhost:8001/ > /dev/null; then
        echo "✅ FastAPI service is running on port 8001"
    else
        echo "❌ FastAPI service failed to start"
        exit 1
    fi
    
    # Start Node.js server
    echo "Starting Node.js server on port 3000..."
    npm install vite http-proxy-middleware
    nohup npm start > node.log 2>&1 &
    NODE_PID=$!
    
    # Wait for Node.js to start
    sleep 5
    
    # Check if Node.js is running
    if curl -s http://localhost:3000/ > /dev/null; then
        echo "✅ Node.js server is running on port 3000"
    else
        echo "❌ Node.js server failed to start"
        exit 1
    fi
    
    echo "Services started successfully!"
    echo "FastAPI PID: $FASTAPI_PID"
    echo "Node.js PID: $NODE_PID"
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Services started successfully${NC}"
else
    echo -e "${RED}❌ Service startup failed${NC}"
    exit 1
fi

# Step 5: Health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check FastAPI health
echo "Checking FastAPI health..."
FASTAPI_HEALTH=$(ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:8001/health")
if [[ $FASTAPI_HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✅ FastAPI is healthy${NC}"
else
    echo -e "${RED}❌ FastAPI health check failed${NC}"
fi

# Check Node.js health
echo "Checking Node.js server health..."
NODE_HEALTH=$(ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:3000/")
if [[ $NODE_HEALTH == *"Mira"* ]] || [[ $NODE_HEALTH == *"html"* ]]; then
    echo -e "${GREEN}✅ Node.js server is healthy${NC}"
else
    echo -e "${RED}❌ Node.js health check failed${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Service Status:${NC}"
echo -e "   FastAPI: http://$EC2_HOST:8001"
echo -e "   Node.js: http://$EC2_HOST:3000"
echo -e "${YELLOW}💡 To check logs:${NC}"
echo -e "   ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'cd ~/app && tail -f fastapi.log'"
echo -e "   ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'cd ~/app && tail -f node.log'" 