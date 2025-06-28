#!/usr/bin/env python3
"""
Startup script for aiRekon Risk Assessment Backend
"""

import os
import sys
import subprocess
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    try:
        import flask
        import flask_cors
        import openai
        import dotenv
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("💡 Please install requirements: pip install -r requirements.txt")
        return False

def check_env_file():
    """Check if .env file exists and has API key"""
    env_path = Path('.env')
    if not env_path.exists():
        print("❌ .env file not found")
        print("💡 Please create .env file with your OpenAI API key")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
        if 'OPENAI_API_KEY=' not in content or 'YOUR_API_KEY_HERE' in content:
            print("❌ OpenAI API key not properly configured in .env file")
            print("💡 Please set OPENAI_API_KEY=your-actual-api-key in .env file")
            return False
    
    print("✅ .env file configured properly")
    return True

def main():
    """Main startup function"""
    print("🚀 Starting aiRekon Risk Assessment Backend...")
    print("=" * 50)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Check environment
    if not check_env_file():
        sys.exit(1)
    
    print("✅ All checks passed!")
    print("🌐 Starting Flask server on http://localhost:5000")
    print("📝 API endpoints available:")
    print("   - GET  /health")
    print("   - POST /api/ai/generate-overview")
    print("   - POST /api/ai/generate-operational")
    print("   - POST /api/ai/generate-risks")
    print("   - POST /api/ai/generate-justification")
    print("=" * 50)
    
    # Start the Flask app
    try:
        from app import app
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\n👋 Backend server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
