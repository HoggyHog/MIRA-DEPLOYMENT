#!/usr/bin/env python3
"""
Startup script for AI Practice Playground API
"""

import subprocess
import sys
import os

def start_practice_api():
    """Start the Practice Playground FastAPI server"""
    try:
        print("Starting AI Practice Playground API on port 8003...")
        
        # Change to the directory where the script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        # Start the FastAPI server
        result = subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "practice_playground_api:app", 
            "--host", "0.0.0.0", 
            "--port", "8003",
            "--reload"
        ], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"Error starting Practice Playground API: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down Practice Playground API...")
        sys.exit(0)

if __name__ == "__main__":
    start_practice_api()