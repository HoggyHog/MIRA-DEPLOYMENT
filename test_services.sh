#!/bin/bash

# Test script to check deployed services
EC2_HOST="ec2-51-20-191-105.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
SSH_KEY="~/.ssh/mira_v2_key.pem"

echo "🧪 Testing Deployed Services"
echo "============================"

echo "1. Testing FastAPI service..."
FASTAPI_RESPONSE=$(ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:8001/health")
echo "FastAPI Health: $FASTAPI_RESPONSE"

echo "2. Testing FastAPI root endpoint..."
FASTAPI_ROOT=$(ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:8001/")
echo "FastAPI Root: $FASTAPI_ROOT"

echo "3. Testing Node.js service..."
NODE_RESPONSE=$(ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "curl -s http://localhost:3000/ | head -10")
echo "Node.js Response: $NODE_RESPONSE"

echo "4. Checking service processes..."
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "ps aux | grep -E '(lesson_generator|node.*dist)' | grep -v grep"

echo "5. Checking service logs..."
echo "FastAPI logs (last 10 lines):"
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "cd ~/app && tail -10 fastapi.log"

echo "Node.js logs (last 10 lines):"
ssh -i $SSH_KEY $EC2_USER@$EC2_HOST "cd ~/app && tail -10 node.log"

echo "✅ Service testing complete!" 