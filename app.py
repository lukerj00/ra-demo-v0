"""
Flask Backend for aiRekon Risk Assessment Tool
Handles OpenAI API requests securely on the server side
"""

import os
from flask import Flask
from config import configure_app
from routes.main_routes import main_bp
from routes.ai_routes import ai_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__, static_folder='risk-assessment', static_url_path='')
    
    # Configure the app
    configure_app(app)
    
    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
