#!/usr/bin/env python3
"""
Startup script for AI Tutor Mira API
"""

def start_ai_tutor_api():
    """Start the AI Tutor FastAPI server"""
    import uvicorn
    from ai_tutor_agent import app
    
    print("Starting AI Tutor Mira API...")
    uvicorn.run(app, host="0.0.0.0", port=8001)

if __name__ == "__main__":
    start_ai_tutor_api()