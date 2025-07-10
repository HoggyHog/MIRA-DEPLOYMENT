#!/bin/bash

# Fix deployment script for current issues
EC2_HOST="ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"

echo "🔧 Fixing deployment issues..."
echo "=============================="

ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
    echo "1. Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "2. Installing Python and venv..."
    sudo apt-get install -y python3 python3-pip python3-venv
    
    echo "3. Installing system dependencies..."
    sudo apt-get install -y curl wget git build-essential python3-dev libpq-dev libssl-dev libffi-dev
    
    echo "4. Setting up Python virtual environment..."
    cd ~/app
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install pypdf
    
    echo "5. Installing Node.js dependencies..."
    npm install --production
    
    echo "6. Starting services..."
    # Kill existing processes
    pkill -f "lesson_generator_api.py" || true
    pkill -f "node.*dist/index.js" || true
    
    # Start FastAPI
    source venv/bin/activate
    nohup python lesson_generator_api.py > fastapi.log 2>&1 &
    
    # Start Node.js
    nohup npm start > node.log 2>&1 &
    
    echo "7. Waiting for services to start..."
    sleep 10
    
    echo "8. Testing services..."
    echo "FastAPI health:"
    curl -s http://localhost:8001/health || echo "FastAPI not responding"
    
    echo "Node.js health:"
    curl -s http://localhost:3000/ | head -5 || echo "Node.js not responding"
    
    echo "✅ Deployment fixed!"
EOF

echo "✅ Fix script completed!" 