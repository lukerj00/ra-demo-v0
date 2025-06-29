"""
AI routes for aiRekon Risk Assessment Tool
"""

import logging
from flask import Blueprint, request, jsonify
from services.ai_service import (
    generate_overview, generate_operational, generate_risks,
    start_risk_conversation, generate_next_risk, generate_additional_risks,
    generate_single_risk, generate_justification, generate_rekon_context,
    generate_rekon_risk, generate_rekon_compliance
)

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/generate-overview', methods=['POST'])
def generate_overview_route():
    """Generate overview paragraph for risk assessment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        if not event_data:
            return jsonify({"error": "eventData is required"}), 400

        # Generate overview using AI service
        overview = generate_overview(event_data)
        
        return jsonify({"overview": overview})
        
    except Exception as e:
        logger.error(f"Error generating overview: {str(e)}")
        return jsonify({"error": f"Failed to generate overview: {str(e)}"}), 500

@ai_bp.route('/generate-operational', methods=['POST'])
def generate_operational_route():
    """Generate operational considerations paragraph for risk assessment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        if not event_data:
            return jsonify({"error": "eventData is required"}), 400

        # Generate operational considerations using AI service
        operational = generate_operational(event_data)
        
        return jsonify({"operational": operational})
        
    except Exception as e:
        logger.error(f"Error generating operational paragraph: {str(e)}")
        return jsonify({"error": f"Failed to generate operational paragraph: {str(e)}"}), 500

@ai_bp.route('/generate-risks', methods=['POST'])
def generate_risks_route():
    """Generate risk assessment table"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        if not event_data:
            return jsonify({"error": "eventData is required"}), 400

        # Generate risks using AI service
        risks = generate_risks(event_data)
        
        return jsonify({"risks": risks})

    except Exception as e:
        logger.error(f"Error generating risks: {str(e)}")
        return jsonify({"error": f"Failed to generate risks: {str(e)}"}), 500

@ai_bp.route('/start-risk-conversation', methods=['POST'])
def start_risk_conversation_route():
    """Start a new risk assessment conversation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        if not event_data:
            return jsonify({"error": "eventData is required"}), 400

        # Start conversation using AI service
        conversation_id = start_risk_conversation(event_data)
        
        return jsonify({"conversationId": conversation_id})

    except Exception as e:
        logger.error(f"Error starting risk conversation: {str(e)}")
        return jsonify({"error": f"Failed to start risk conversation: {str(e)}"}), 500

@ai_bp.route('/generate-next-risk', methods=['POST'])
def generate_next_risk_route():
    """Generate the next risk in an ongoing conversation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        conversation_id = data.get('conversationId')
        risk_number = data.get('riskNumber')

        if not conversation_id:
            return jsonify({"error": "conversationId is required"}), 400
        if not risk_number:
            return jsonify({"error": "riskNumber is required"}), 400

        # Generate next risk using AI service
        risk = generate_next_risk(conversation_id, risk_number)
        
        if risk is None:
            return jsonify({"error": "Failed to generate risk"}), 500
            
        return jsonify({"risk": risk})

    except ValueError as e:
        logger.error(f"Conversation error: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error generating next risk: {str(e)}")
        return jsonify({"error": f"Failed to generate next risk: {str(e)}"}), 500

@ai_bp.route('/generate-additional-risks', methods=['POST'])
def generate_additional_risks_route():
    """Generate additional risks for an existing assessment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        existing_risks = data.get('existingRisks', [])
        num_risks = data.get('numRisks', 3)

        if not event_data:
            return jsonify({"error": "eventData is required"}), 400

        # Generate additional risks using AI service
        additional_risks = generate_additional_risks(event_data, existing_risks, num_risks)

        return jsonify({"risks": additional_risks})

    except Exception as e:
        logger.error(f"Error generating additional risks: {str(e)}")
        return jsonify({"error": f"Failed to generate additional risks: {str(e)}"}), 500

@ai_bp.route('/generate-single-risk', methods=['POST'])
def generate_single_risk_route():
    """Generate a single risk for progressive loading (legacy endpoint)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        risk_number = data.get('riskNumber', 1)
        total_risks = data.get('totalRisks', 8)

        if not event_data:
            return jsonify({"error": "eventData is required"}), 400

        # Generate single risk using AI service
        risk = generate_single_risk(event_data, risk_number, total_risks)

        if risk is None:
            return jsonify({"error": "Failed to generate risk"}), 500

        return jsonify({"risk": risk})

    except Exception as e:
        logger.error(f"Error generating single risk: {str(e)}")
        return jsonify({"error": f"Failed to generate single risk: {str(e)}"}), 500

@ai_bp.route('/generate-justification', methods=['POST'])
def generate_justification_route():
    """Generate justification for a specific field"""
    try:
        data = request.get_json()
        logger.info(f"Justification request - data type: {type(data)}, data: {data}")
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        field_type = data.get('fieldType')
        field_value = data.get('fieldValue')

        # Debug: log the types and values
        logger.info(f"Justification request - eventData type: {type(event_data)}, fieldType: {field_type}")

        if not event_data:
            return jsonify({"error": "eventData is required"}), 400
        if not field_type:
            return jsonify({"error": "fieldType is required"}), 400
        if not field_value:
            return jsonify({"error": "fieldValue is required"}), 400

        # Generate justification using AI service
        justification = generate_justification(event_data, field_type, field_value)

        return jsonify(justification)

    except Exception as e:
        logger.error(f"Error generating justification: {str(e)}")
        return jsonify({"error": f"Failed to generate justification: {str(e)}"}), 500

@ai_bp.route('/generate-rekon-context', methods=['POST'])
def generate_rekon_context_route():
    """Generate RekonContext Index details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        score = data.get('score')
        level = data.get('level')

        if not score:
            return jsonify({"error": "score is required"}), 400
        if not level:
            return jsonify({"error": "level is required"}), 400

        # Generate RekonContext details using AI service
        details = generate_rekon_context(event_data, score, level)

        return jsonify({"details": details})

    except Exception as e:
        logger.error(f"Error generating RekonContext details: {str(e)}")
        return jsonify({"error": f"Failed to generate RekonContext details: {str(e)}"}), 500

@ai_bp.route('/generate-rekon-risk', methods=['POST'])
def generate_rekon_risk_route():
    """Generate RekonRisk Index details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        risks = data.get('risks', [])
        score = data.get('score')
        level = data.get('level')

        if not score:
            return jsonify({"error": "score is required"}), 400
        if not level:
            return jsonify({"error": "level is required"}), 400

        # Generate RekonRisk details using AI service
        details = generate_rekon_risk(event_data, risks, score, level)

        return jsonify({"details": details})

    except Exception as e:
        logger.error(f"Error generating RekonRisk details: {str(e)}")
        return jsonify({"error": f"Failed to generate RekonRisk details: {str(e)}"}), 500

@ai_bp.route('/generate-rekon-compliance', methods=['POST'])
def generate_rekon_compliance_route():
    """Generate RekonCompliance Status details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        risks = data.get('risks', [])
        status = data.get('status')

        if not status:
            return jsonify({"error": "status is required"}), 400

        # Generate RekonCompliance details using AI service
        details = generate_rekon_compliance(event_data, risks, status)

        return jsonify({"details": details})

    except Exception as e:
        logger.error(f"Error generating RekonCompliance details: {str(e)}")
        return jsonify({"error": f"Failed to generate RekonCompliance details: {str(e)}"}), 500
