#!/bin/bash

# Manual deployment script for testing
# Run this step by step to deploy to EC2

EC2_HOST="ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"

echo "🚀 Manual Deployment Script"
echo "=========================="
echo "0. Setting up server dependencies..."
./setup_server.sh

echo "1. Building project..."
npm run build

echo "2. Syncing to server..."
rsync -avz --exclude 'node_modules' --exclude 'deployment' --exclude '.git' --exclude '.env' --exclude 'venv' \
    -e "ssh -i $SSH_KEY" . $EC2_USER@$EC2_HOST:~/app

echo "3. Installing dependencies on server..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
    cd ~/app
    npm install --production
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install pypdf
EOF

echo "4. Starting services..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
    cd ~/app
    
    # Kill existing processes
    pkill -f "lesson_generator_api.py" || true
    pkill -f "node.*dist/index.js" || true
    
    # Start FastAPI
    source venv/bin/activate
    nohup python lesson_generator_api.py > fastapi.log 2>&1 &
    
    # Start Node.js
    nohup npm start > node.log 2>&1 &
    
    echo "Services started!"
EOF

echo "5. Testing services..."
echo "Testing FastAPI..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:8001/health"

echo "Testing Node.js..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:3000/ | head -20"

echo "✅ Deployment complete!" 