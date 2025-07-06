#!/bin/bash

echo "Starting Mira AI Services..."

# Function to cleanup background processes on exit
cleanup() {
    echo "Shutting down services..."
    pkill -f "lesson_generator_api.py"
    pkill -f "npm run dev"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "You can install it by running: nix-env -iA nixpkgs.nodejs"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm first."
    echo "You can install it by running: nix-env -iA nixpkgs.nodePackages.npm"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install Python dependencies if needed
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Start FastAPI lesson generator service in background
echo "Starting FastAPI lesson generator service on port 8001..."
./venv/bin/python lesson_generator_api.py &
FASTAPI_PID=$!

# Wait a moment for FastAPI to start
sleep 3

# Check if FastAPI started successfully
if curl -s http://0.0.0.0:8001/ > /dev/null; then
    echo "✅ FastAPI service is running on port 8001"
else
    echo "❌ FastAPI service failed to start"
    cleanup
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start main Node.js server
echo "Starting main server on port 3000..."
npm run dev &
NODE_PID=$!

# Wait for both processes
wait $FASTAPI_PID $NODE_PID 