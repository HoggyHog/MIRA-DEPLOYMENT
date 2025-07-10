#!/bin/bash

# Setup script to install dependencies on EC2 server
EC2_HOST="ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"

echo "🔧 Setting up EC2 server dependencies..."
echo "======================================"

ssh -i $SSH_KEY $EC2_USER@$EC2_HOST << 'EOF'
    echo "Updating package list..."
    sudo apt update -y
    
    echo "Installing Node.js and npm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "Installing Python and pip..."
    sudo apt-get install -y python3 python3-pip python3-venv
    
    echo "Installing additional system dependencies..."
    sudo apt-get install -y curl wget git build-essential
    
    echo "Installing Python development tools..."
    sudo apt-get install -y python3-dev
    
    echo "Installing system libraries for Python packages..."
    sudo apt-get install -y libpq-dev libssl-dev libffi-dev
    
    echo "Verifying installations..."
    echo "Node.js version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo "Python version: $(python3 --version)"
    echo "pip version: $(pip3 --version)"
    
    echo "✅ Server setup completed!"
EOF

echo "✅ Server dependencies installed successfully!" 