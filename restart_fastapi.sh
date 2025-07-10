#!/bin/bash
cd ~/app

# Kill existing FastAPI process
pkill -f 'python.*lesson_generator'

# Wait a moment
sleep 2

# Activate virtual environment and start FastAPI
source venv/bin/activate
nohup python lesson_generator_api.py > fastapi.log 2>&1 &

echo "FastAPI restarted successfully"
echo "FastAPI PID: $(pgrep -f 'python.*lesson_generator')" 