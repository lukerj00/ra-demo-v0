"""
Configuration module for aiRekon Risk Assessment Tool
"""

import os
import logging
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# Reduce verbosity of external libraries
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logging.getLogger('openai').setLevel(logging.WARNING)

# Initialize OpenAI client
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    logger.error("OPENAI_API_KEY not found in environment variables")
    raise ValueError("OPENAI_API_KEY must be set in .env file")

try:
    client = OpenAI(api_key=openai_api_key)
    logger.info("OpenAI client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}")
    raise

# Store conversation contexts for progressive risk generation
risk_conversations = {}

def configure_app(app):
    """Configure Flask application"""
    # Configure CORS to allow requests from the frontend
    # Allow all origins in development - restrict in production
    CORS(app, origins=["*"], supports_credentials=True)
    
    return app

def get_openai_client():
    """Get the OpenAI client instance"""
    return client

def get_risk_conversations():
    """Get the risk conversations storage"""
    return risk_conversations
