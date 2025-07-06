#!/bin/bash

echo "Starting Mira AI Python Services..."

# Function to cleanup background processes on exit
cleanup() {
    echo "Shutting down services..."
    pkill -f "lesson_generator_api.py"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

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

# Start FastAPI lesson generator service
echo "Starting FastAPI lesson generator service on port 8001..."
echo "Service will be available at: http://0.0.0.0:8001"
echo "Health check: http://0.0.0.0:8001/health"
echo "Lesson generation: http://0.0.0.0:8001/api/generate-lesson"
echo ""
echo "Press Ctrl+C to stop the service"

# Run the FastAPI service in foreground
./venv/bin/python lesson_generator_api.py 