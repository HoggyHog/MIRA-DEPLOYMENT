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

# Start FastAPI lesson generator service in background
echo "Starting FastAPI lesson generator service on port 8001..."
./venv/bin/python lesson_generator_api.py &
FASTAPI_PID=$!

# Wait a moment for FastAPI to start
sleep 3

# Check if FastAPI started successfully
if curl -s http://localhost:8001/ > /dev/null; then
    echo "✅ FastAPI service is running on port 8001"
else
    echo "❌ FastAPI service failed to start"
    cleanup
fi

# Start main Node.js server
echo "Starting main server on port 3000..."
npm run dev &
NODE_PID=$!

# Wait for both processes
wait $FASTAPI_PID $NODE_PID 