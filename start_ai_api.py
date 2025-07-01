#!/usr/bin/env python3

import subprocess
import sys
import os

def main():
    # Start the FastAPI server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "ai_exam_api:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("API server stopped")
    except Exception as e:
        print(f"Error starting API server: {e}")

if __name__ == "__main__":
    main()