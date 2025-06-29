#!/usr/bin/env python3
"""
AIREKON Risk Assessment Tool - Standalone Flask Server
This server provides the API endpoints for the Risk Assessment tool integration.
"""

import os
import sys
import uuid
import json
import argparse
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# In-memory session storage (use Redis/database in production)
sessions = {}

# Configuration
app.secret_key = os.environ.get("RA_SECRET_KEY", "ra-tool-secret-key")

@app.route("/")
def index():
    """Serve the main Risk Assessment tool interface"""
    session_id = request.args.get('session')
    if session_id and session_id in sessions:
        # API mode - load with session data
        return send_from_directory('.', 'index.html')
    else:
        # Show API-only message
        return render_template_string("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>AIREKON Risk Assessment Tool</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                .alert { background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px; }
                .code { background: #f1f3f4; padding: 10px; border-radius: 3px; font-family: monospace; }
            </style>
        </head>
        <body>
            <h1>🤖 AIREKON Risk Assessment Tool</h1>
            <div class="alert">
                <h3>API-Only Mode</h3>
                <p>This tool is designed for integration with main applications via API.</p>
                <p>To use this tool:</p>
                <ol>
                    <li>Start this server: <code class="code">python app.py --port=7001</code></li>
                    <li>Send event data via API to start an assessment</li>
                    <li>Access the tool with a session ID: <code class="code">/?session=your-session-id</code></li>
                </ol>
                <p><strong>Server Status:</strong> ✅ Running on port {{ port }}</p>
            </div>
        </body>
        </html>
        """, port=request.environ.get('SERVER_PORT', '7001'))

@app.route("/health")
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "AIREKON Risk Assessment Tool is operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })

@app.route("/api/start-assessment", methods=["POST"])
def start_assessment():
    """Start a new risk assessment session"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ['eventTitle', 'eventDate', 'location', 'attendance', 'eventType']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {missing_fields}"}), 400
        
        # Create new session
        session_id = str(uuid.uuid4())
        sessions[session_id] = {
            "session_id": session_id,
            "event_data": data,
            "return_url": data.get("return_url"),  # Store return URL if provided
            "status": "started",
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Started assessment session {session_id} for event: {data.get('eventTitle')}")
        
        return jsonify({
            "session_id": session_id,
            "redirect_url": f"/?session={session_id}",
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Error starting assessment: {str(e)}")
        return jsonify({"error": "Failed to start assessment"}), 500

@app.route("/api/session/<session_id>")
def get_session(session_id):
    """Get session data"""
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404
    
    session_data = sessions[session_id]
    return jsonify(session_data)

@app.route("/api/session/<session_id>/complete", methods=["POST"])
def complete_session(session_id):
    """Mark session as complete with results"""
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Update session with results
        sessions[session_id].update({
            "status": "completed",
            "assessment_results": data,
            "completed_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Completed assessment session {session_id}")
        
        return jsonify({
            "status": "success",
            "message": "Assessment completed successfully",
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"Error completing session {session_id}: {str(e)}")
        return jsonify({"error": "Failed to complete assessment"}), 500

@app.route("/api/session/<session_id>/results")
def get_session_results(session_id):
    """Get completed session results"""
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404
    
    session_data = sessions[session_id]
    
    if session_data["status"] != "completed":
        return jsonify({"error": "Assessment not yet completed"}), 400
    
    # Calculate session duration
    created_at = datetime.fromisoformat(session_data["created_at"])
    completed_at = datetime.fromisoformat(session_data["completed_at"])
    duration_minutes = (completed_at - created_at).total_seconds() / 60
    
    # Prepare results
    results = {
        "session_id": session_id,
        "status": session_data["status"],
        "event_data": session_data["event_data"],
        "assessment_results": session_data.get("assessment_results", {}),
        "metadata": {
            "created_at": session_data["created_at"],
            "completed_at": session_data["completed_at"],
            "session_duration_minutes": round(duration_minutes, 2)
        }
    }
    
    return jsonify(results)

@app.route("/api/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    """Clean up session"""
    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404
    
    del sessions[session_id]
    logger.info(f"Cleaned up session {session_id}")
    
    return jsonify({
        "status": "success",
        "message": "Session cleaned up successfully"
    })

# Serve static files
@app.route("/<path:filename>")
def serve_static(filename):
    """Serve static files (HTML, CSS, JS)"""
    return send_from_directory('.', filename)

@app.route("/js/<path:filename>")
def serve_js(filename):
    """Serve JavaScript files"""
    return send_from_directory('js', filename)

@app.route("/css/<path:filename>")
def serve_css(filename):
    """Serve CSS files"""
    return send_from_directory('css', filename)

@app.route("/images/<path:filename>")
def serve_images(filename):
    """Serve image files"""
    return send_from_directory('images', filename)

# Session cleanup (run periodically in production)
def cleanup_old_sessions():
    """Remove sessions older than 24 hours"""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    to_remove = []
    
    for session_id, session_data in sessions.items():
        created_at = datetime.fromisoformat(session_data["created_at"])
        if created_at < cutoff:
            to_remove.append(session_id)
    
    for session_id in to_remove:
        del sessions[session_id]
        logger.info(f"Cleaned up expired session {session_id}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the AIREKON Risk Assessment Tool server")
    parser.add_argument('--port', type=int, default=7001, help='Port to run the server on (default: 7001)')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind to (default: 127.0.0.1)')
    args = parser.parse_args()
    
    try:
        logger.info(f"Starting AIREKON Risk Assessment Tool server on {args.host}:{args.port}")
        logger.info("API Endpoints:")
        logger.info("  POST /api/start-assessment - Start new assessment")
        logger.info("  GET  /api/session/<id> - Get session data")
        logger.info("  POST /api/session/<id>/complete - Complete assessment")
        logger.info("  GET  /api/session/<id>/results - Get results")
        logger.info("  DELETE /api/session/<id> - Cleanup session")
        logger.info("  GET  /health - Health check")
        
        app.run(host=args.host, port=args.port, debug=True, threaded=True)
        
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)
