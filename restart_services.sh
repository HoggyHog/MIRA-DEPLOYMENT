#!/bin/bash
cd ~/app

# Kill existing processes
pkill -f 'node.*index.js'
pkill -f 'python.*lesson_generator'

# Wait a moment
sleep 2

# Start Node.js server
nohup node dist/index.js > node.log 2>&1 &

# Start FastAPI server
nohup python3 lesson_generator_api.py > fastapi.log 2>&1 &

echo "Services restarted successfully"
echo "Node.js PID: $(pgrep -f 'node.*index.js')"
echo "FastAPI PID: $(pgrep -f 'python.*lesson_generator')" 