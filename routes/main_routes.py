"""
Main routes for aiRekon Risk Assessment Tool
"""

from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Serve the main application"""
    from flask import current_app
    return current_app.send_static_file('index.html')

@main_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "aiRekon Risk Assessment API is running"})
