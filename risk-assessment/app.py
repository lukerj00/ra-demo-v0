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
from flask import Flask, request, jsonify, render_template, render_template_string, send_from_directory
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

        # Extract return URL - the integration client puts it in the event data
        return_url = data.get("return_url")  # Check top level first
        if not return_url:
            return_url = data.get("return_url")  # It should be in the main data since that's what the integration sends

        sessions[session_id] = {
            "session_id": session_id,
            "event_data": data,
            "return_url": return_url,  # Store return URL if provided
            "status": "started",
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        }

        # Debug logging
        logger.info(f"Session {session_id} created with return_url: {return_url}")
        logger.info(f"Request data keys: {list(data.keys())}")
        
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

# === RISK GENERATION ENDPOINTS ===

@app.route("/api/ai/generate-risks", methods=["POST"])
def generate_risks():
    """
    Generate risks using AI for the Risk Assessment tool.
    This endpoint is called by the AI tool's frontend.
    Returns risks categorized into three tables: terrorism, security, health_safety.
    """
    try:
        data = request.get_json()
        logger.info(f"🎯 STANDALONE APP: /api/ai/generate-risks endpoint called with data: {data}")
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Extract event details
        event_title = data.get('eventTitle', '')
        event_type = data.get('eventType', '')
        venue_type = data.get('venueType', '')
        location = data.get('location', '')
        attendance = data.get('attendance', 0)
        description = data.get('description', '')
        
        logger.info(f"🎯 STANDALONE APP: Processing event_type={event_type}, attendance={attendance}")

        # Generate risks based on event details - now returns three categories
        risk_data = _generate_risks_for_event(event_title, event_type, venue_type, location, attendance, description)

        total_risks = len(risk_data['terrorism_risks']) + len(risk_data['security_risks']) + len(risk_data['health_safety_risks'])

        response_data = {
            "success": True,
            "risk_data": risk_data,  # New three-table format
            "risks": risk_data['security_risks'],  # Legacy compatibility - return security risks as main list
            "message": f"Generated {total_risks} risks across 3 categories for {event_title}",
            "statistics": {
                "terrorism_count": len(risk_data['terrorism_risks']),
                "security_count": len(risk_data['security_risks']),
                "health_safety_count": len(risk_data['health_safety_risks']),
                "total_count": total_risks
            }
        }
        
        logger.info(f"🎯 STANDALONE APP: Returning response with keys: {list(response_data.keys())}")
        logger.info(f"🎯 STANDALONE APP: Terrorism risks count: {len(risk_data['terrorism_risks'])}")
        
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error generating risks: {str(e)}")
        return jsonify({"success": False, "error": "Failed to generate risks"}), 500

def _generate_risks_for_event(event_title, event_type, venue_type, location, attendance, description):
    """Generate risks based on event characteristics, categorized into three tables"""
    
    # Convert attendance to int for processing
    try:
        attendance_num = int(attendance) if attendance else 0
    except (ValueError, TypeError):
        attendance_num = 0
    
    # Initialize risk categories
    terrorism_risks = []
    security_risks = []
    health_safety_risks = []
    
    # === TERRORISM RISKS (NPSA-compliant categories) ===
    
    # Base terrorism risks for high-profile events
    terrorism_condition = attendance_num > 5000 or event_type in ['Music', 'Sport', 'Political']
    
    if terrorism_condition:
        # Core terrorism risks for high-profile events
        terrorism_risks.extend([
            {
                "risk": "Potential for marauding terrorist attack targeting high-density crowd areas",
                "category": "Marauding Attack",
                "subcategory": "Multi-Actor Armed Assault",
                "impact": 5,
                "likelihood": 2,
                "mitigation": "Deploy armed police response teams, establish layered security perimeter, implement advanced screening and real-time intelligence monitoring"
            },
            {
                "risk": "Vehicle-borne improvised explosive device (VBIED) targeting venue entrance or perimeter",
                "category": "Vehicle as Weapon",
                "subcategory": "Large Vehicle-Borne IED",
                "impact": 5,
                "likelihood": 1,
                "mitigation": "Install hostile vehicle mitigation barriers, establish vehicle exclusion zones, deploy explosive detection equipment at checkpoints"
            },
            {
                "risk": "Person-borne improvised explosive device (suicide bomber) infiltrating crowd areas",
                "category": "IEDs",
                "subcategory": "Person-Borne IED (PBIED)",
                "impact": 5,
                "likelihood": 2,
                "mitigation": "Implement multi-layer screening, deploy explosive detection technology, train staff in suspicious behavior recognition"
            },
            {
                "risk": "Coordinated vehicle ramming attack followed by armed assault",
                "category": "Vehicle as Weapon", 
                "subcategory": "Vehicle-Weapon Combined Attack",
                "impact": 5,
                "likelihood": 1,
                "mitigation": "Deploy anti-ram barriers, position armed response teams, create rapid lockdown procedures"
            },
            {
                "risk": "Improvised explosive device placement in high-traffic areas or emergency exits",
                "category": "IEDs",
                "subcategory": "Concealed Area-Denial Device",
                "impact": 4,
                "likelihood": 2,
                "mitigation": "Conduct systematic explosive ordnance disposal sweeps, secure all potential concealment areas, monitor unattended items"
            }
        ])
    
    # Event type specific terrorism risks
    if event_type == 'Music':
        terrorism_risks.extend([
            {
                "risk": "Coordinated multi-location attack during peak performance periods",
                "category": "Marauding Attack", 
                "subcategory": "Synchronized Multi-Site Attack",
                "impact": 5,
                "likelihood": 1,
                "mitigation": "Establish central command coordination, deploy rapid response teams across all locations, implement real-time communication systems"
            },
            {
                "risk": "Chemical dispersal attack targeting air circulation systems or crowd areas",
                "category": "Chemical, Biological, Radiological",
                "subcategory": "Chemical Agent Dispersal",
                "impact": 4,
                "likelihood": 1,
                "mitigation": "Install chemical detection systems, prepare decontamination protocols, coordinate with hazmat response teams"
            }
        ])
        if attendance_num > 15000:
            terrorism_risks.append({
                "risk": "Mass casualty attack using explosive-laden drone or aerial device",
                "category": "IEDs",
                "subcategory": "Aerial-Delivered Device",
                "impact": 4,
                "likelihood": 1,
                "mitigation": "Deploy counter-drone technology, establish no-fly enforcement zone, coordinate with air traffic control"
            })
    
    if event_type == 'Sport':
        terrorism_risks.extend([
            {
                "risk": "Symbolic attack targeting national or international sporting event",
                "category": "Marauding Attack",
                "subcategory": "High-Profile Symbolic Target",
                "impact": 5,
                "likelihood": 2,
                "mitigation": "Enhance protective security around VIP areas, coordinate with national security agencies, implement elevated threat protocols"
            },
            {
                "risk": "Stadium structural attack using vehicle-borne explosive device",
                "category": "Vehicle as Weapon",
                "subcategory": "Structural Damage VBIED",
                "impact": 5,
                "likelihood": 1,
                "mitigation": "Establish expanded vehicle exclusion perimeter, conduct structural vulnerability assessment, deploy heavy vehicle barriers"
            }
        ])
    
    if event_type == 'Political':
        terrorism_risks.extend([
            {
                "risk": "Assassination attempt against high-profile political figures",
                "category": "Marauding Attack",
                "subcategory": "Targeted Individual Attack",
                "impact": 5,
                "likelihood": 2,
                "mitigation": "Deploy specialist protection teams, implement close protection protocols, establish secure corridors and safe rooms"
            },
            {
                "risk": "Mass disruption attack to undermine democratic process",
                "category": "IEDs",
                "subcategory": "Disruption-Focused Device",
                "impact": 4,
                "likelihood": 2,
                "mitigation": "Establish backup venue protocols, coordinate with election security teams, implement rapid evacuation procedures"
            }
        ])
    
    if 'Outdoor' in venue_type:
        terrorism_risks.extend([
            {
                "risk": "Long-range sniper attack from elevated positions targeting crowd or VIPs",
                "category": "Marauding Attack",
                "subcategory": "Standoff Weapon Attack",
                "impact": 4,
                "likelihood": 1,
                "mitigation": "Conduct overwatch security from elevated positions, establish counter-sniper teams, secure all sight lines"
            },
            {
                "risk": "Mortar or rocket attack from outside security perimeter",
                "category": "IEDs", 
                "subcategory": "Indirect Fire Device",
                "impact": 4,
                "likelihood": 1,
                "mitigation": "Establish extended security perimeter, deploy counter-mortar detection systems, coordinate with military EOD teams"
            }
        ])
    
    # Additional risks for very large events
    if attendance_num > 20000:
        terrorism_risks.append({
            "risk": "Cyber attack targeting critical event infrastructure and safety systems",
            "category": "Cyber Attack",
            "subcategory": "Critical Infrastructure Disruption",
            "impact": 4,
            "likelihood": 2,
            "mitigation": "Implement air-gapped backup systems, deploy cybersecurity monitoring, establish manual override procedures"
        })
    
    # === SECURITY RISKS ===
    
    # Base security risks for all events
    security_risks.extend([
        {
            "risk": "Unauthorized access to restricted areas including backstage, VIP, and operational zones",
            "category": "Physical Security",
            "subcategory": "Access Control Failure",
            "impact": 3,
            "likelihood": 3,
            "mitigation": "Deploy biometric access control systems, position security at access points, implement zone-based security clearances"
        },
        {
            "risk": "Theft of personal belongings, equipment, or merchandise during event operations",
            "category": "Physical Security",
            "subcategory": "Property Crime",
            "impact": 2,
            "likelihood": 4,
            "mitigation": "Install comprehensive CCTV coverage, provide secure storage lockers, deploy plainclothes security in high-risk areas"
        }
    ])
    
    # === HEALTH & SAFETY RISKS ===
    
    # Base health and safety risks for all events
    health_safety_risks.extend([
        {
            "risk": "Cardiac emergencies and life-threatening medical conditions requiring immediate response",
            "category": "Medical Emergency",
            "subcategory": "Acute Life-Threatening Emergency",
            "impact": 5,
            "likelihood": 3,
            "mitigation": "Deploy qualified paramedics with defibrillation capability, establish direct emergency services hotline, maintain emergency medication stocks"
        },
        {
            "risk": "Slip, trip and fall incidents on wet surfaces, steps, and uneven terrain",
            "category": "Environmental Hazards",
            "subcategory": "Ground Surface Hazards", 
            "impact": 3,
            "likelihood": 4,
            "mitigation": "Install anti-slip surfaces, maintain clear sight lines, deploy safety signage and barrier marking"
        }
    ])
    
    # Calculate overall scores for each risk
    for risk_list in [terrorism_risks, security_risks, health_safety_risks]:
        for risk in risk_list:
            risk['overall'] = risk['impact'] * risk['likelihood']
    
    return {
        "terrorism_risks": terrorism_risks,
        "security_risks": security_risks, 
        "health_safety_risks": health_safety_risks
    }

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
