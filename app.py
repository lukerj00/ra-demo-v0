"""
Flask Backend for AIREKON Risk Assessment Tool
Handles OpenAI API requests securely on the server side
"""

import os
import json
import logging
import argparse
import socket
from flask import Flask, request, jsonify
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

# Initialize Flask app with static file serving
app = Flask(__name__, static_folder='risk-assessment', static_url_path='')

# Configure CORS to allow requests from the frontend
# Allow all origins in development - restrict in production
CORS(app, origins=["*"], supports_credentials=True)

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

@app.route('/')
def index():
    """Serve the main application"""
    return app.send_static_file('index.html')

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "AIREKON Risk Assessment API is running"})

@app.route('/api/ai/generate-overview', methods=['POST'])
def generate_overview():
    """Generate overview paragraph for risk assessment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Build the prompt for overview paragraph
        prompt = build_overview_prompt(data)
        
        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate a single paragraph about event overview and context. Return only the paragraph text without any HTML tags, markdown, or formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        content = response.choices[0].message.content.strip()
        # logger.info(f"Generated overview paragraph: {len(content)} characters")

        return jsonify({"content": content})
        
    except Exception as e:
        logger.error(f"Error generating overview: {str(e)}")
        return jsonify({"error": f"Failed to generate overview: {str(e)}"}), 500

@app.route('/api/ai/generate-operational', methods=['POST'])
def generate_operational():
    """Generate operational considerations paragraph for risk assessment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Build the prompt for operational paragraph
        prompt = build_operational_prompt(data)
        
        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate a single paragraph about operational considerations and risk factors. Return only the paragraph text without any HTML tags, markdown, or formatting."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=400
        )
        
        content = response.choices[0].message.content.strip()
        # logger.info(f"Generated operational paragraph: {len(content)} characters")

        return jsonify({"content": content})
        
    except Exception as e:
        logger.error(f"Error generating operational paragraph: {str(e)}")
        return jsonify({"error": f"Failed to generate operational paragraph: {str(e)}"}), 500

@app.route('/api/ai/generate-risks', methods=['POST'])
def generate_risks():
    """Generate risk assessment table"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Build the prompt for risk assessment
        prompt = build_risk_assessment_prompt(data)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate detailed risk assessments in JSON format. Each risk should have: id, risk (description), category, impact (1-5), likelihood (1-5), and mitigation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )

        content = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            risks = json.loads(content)
            validated_risks = validate_and_format_risks(risks)
            logger.info(f"Generated {len(validated_risks)} risks")
            return jsonify({"risks": validated_risks})
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse risk assessment JSON: {e}")
            return jsonify({"error": "Invalid risk assessment format received from AI"}), 500

    except Exception as e:
        logger.error(f"Error generating risks: {str(e)}")
        return jsonify({"error": f"Failed to generate risks: {str(e)}"}), 500

@app.route('/api/ai/start-risk-conversation', methods=['POST'])
def start_risk_conversation():
    """Start a new risk assessment conversation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Generate a unique conversation ID
        import uuid
        conversation_id = str(uuid.uuid4())

        # Initialize conversation with system prompt and event context
        system_prompt = build_risk_conversation_system_prompt()
        event_context = build_event_context_message(data)

        risk_conversations[conversation_id] = {
            'messages': [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": event_context}
            ],
            'generated_risks': [],
            'event_data': data
        }

        logger.info(f"Started risk conversation {conversation_id}")
        return jsonify({"conversation_id": conversation_id})

    except Exception as e:
        logger.error(f"Error starting risk conversation: {str(e)}")
        return jsonify({"error": f"Failed to start risk conversation: {str(e)}"}), 500

@app.route('/api/ai/generate-next-risk', methods=['POST'])
def generate_next_risk():
    """Generate the next risk in an ongoing conversation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        conversation_id = data.get('conversation_id')
        risk_number = data.get('risk_number', 1)

        if not conversation_id or conversation_id not in risk_conversations:
            return jsonify({"error": "Invalid or expired conversation ID"}), 400

        conversation = risk_conversations[conversation_id]

        # Build prompt for next risk that avoids previous ones
        next_risk_prompt = build_next_risk_prompt(conversation['generated_risks'], risk_number)

        # Add the request to conversation
        conversation['messages'].append({
            "role": "user",
            "content": next_risk_prompt
        })

        # Make request to OpenAI with full conversation context
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=conversation['messages'],
            temperature=0.8,  # Higher temperature for more variety
            max_tokens=400
        )

        content = response.choices[0].message.content.strip()

        # Add AI response to conversation
        conversation['messages'].append({
            "role": "assistant",
            "content": content
        })

        # Parse JSON response
        try:
            risk = json.loads(content)
            validated_risk = validate_and_format_single_risk(risk, risk_number)

            # Store the generated risk in conversation context
            conversation['generated_risks'].append(validated_risk)

            # logger.info(f"Generated risk {risk_number} in conversation {conversation_id}: {validated_risk['risk'][:50]}...")
            return jsonify({"risk": validated_risk})

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse risk JSON: {e}")
            return jsonify({"error": "Invalid risk format received from AI"}), 500

    except Exception as e:
        logger.error(f"Error generating next risk: {str(e)}")
        return jsonify({"error": f"Failed to generate next risk: {str(e)}"}), 500

@app.route('/api/ai/generate-additional-risks', methods=['POST'])
def generate_additional_risks():
    """Generate additional risks for an existing assessment"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        conversation_id = data.get('conversation_id')
        existing_risks = data.get('existing_risks', [])
        num_additional = data.get('num_additional', 3)

        if not conversation_id or conversation_id not in risk_conversations:
            return jsonify({"error": "Invalid or expired conversation ID"}), 400

        conversation = risk_conversations[conversation_id]
        additional_risks = []

        # Generate additional risks
        for i in range(num_additional):
            risk_number = len(conversation['generated_risks']) + i + 1

            # Build prompt for additional risk that continues importance ranking
            additional_risk_prompt = build_additional_risk_prompt(
                conversation['generated_risks'] + additional_risks,
                risk_number
            )

            # Add context reminder about importance ranking
            importance_reminder = f"""Remember: You are continuing the importance-based risk assessment. The first 8 risks were the most critical. Now generate risk #{risk_number} which should be the next most important concern for this specific event."""

            # Add the request to conversation with importance context
            conversation['messages'].append({
                "role": "user",
                "content": f"{importance_reminder}\n\n{additional_risk_prompt}"
            })

            # Make request to OpenAI
            response = client.chat.completions.create(
                model="gpt-4o-mini-2024-07-18",
                messages=conversation['messages'],
                temperature=0.8,
                max_tokens=400
            )

            content = response.choices[0].message.content.strip()

            # Add AI response to conversation
            conversation['messages'].append({
                "role": "assistant",
                "content": content
            })

            try:
                risk = json.loads(content)
                validated_risk = validate_and_format_single_risk(risk, risk_number)
                additional_risks.append(validated_risk)
                conversation['generated_risks'].append(validated_risk)

                # logger.info(f"Generated additional risk {risk_number}: {validated_risk['risk'][:50]}...")

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse additional risk JSON: {e}")
                continue

        return jsonify({"risks": additional_risks})

    except Exception as e:
        logger.error(f"Error generating additional risks: {str(e)}")
        return jsonify({"error": f"Failed to generate additional risks: {str(e)}"}), 500

@app.route('/api/ai/generate-single-risk', methods=['POST'])
def generate_single_risk():
    """Generate a single risk for progressive loading (legacy endpoint)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        risk_number = data.get('riskNumber', 1)
        total_risks = data.get('totalRisks', 8)

        # Build the prompt for single risk generation
        prompt = build_single_risk_prompt(data, risk_number, total_risks)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate a single detailed risk in JSON format. The risk should have: id, risk (description), category, impact (1-5), likelihood (1-5), and mitigation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=400
        )

        content = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            risk = json.loads(content)
            validated_risk = validate_and_format_single_risk(risk, risk_number)
            # logger.info(f"Generated single risk {risk_number}: {validated_risk['risk'][:50]}...")
            return jsonify({"risk": validated_risk})
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse single risk JSON: {e}")
            return jsonify({"error": "Invalid risk format received from AI"}), 500

    except Exception as e:
        logger.error(f"Error generating single risk: {str(e)}")
        return jsonify({"error": f"Failed to generate single risk: {str(e)}"}), 500

@app.route('/api/ai/generate-justification', methods=['POST'])
def generate_justification():
    """Generate justification for a specific field"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        field_name = data.get('fieldName')
        field_value = data.get('fieldValue')
        context = data.get('context', {})

        if not field_name or not field_value:
            return jsonify({"error": "fieldName and fieldValue are required"}), 400

        # Build the prompt for justification
        prompt = build_justification_prompt(field_name, field_value, context)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Provide SPECIFIC, CONCISE justifications (1-2 sentences max). For sources, use bullet points (•) with 3-5 SPECIFIC, REAL documents/standards with full names and years (e.g., 'ISO 31000:2018 Risk Management Guidelines', 'NFPA 1600:2019 Standard on Continuity'). Mark each as [public] or [proprietary]. NO vague descriptors."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=300
        )

        content = response.choices[0].message.content.strip()
        justification = parse_justification_response(content)

        # logger.info(f"Generated justification for {field_name}: {field_value}")
        return jsonify(justification)

    except Exception as e:
        logger.error(f"Error generating justification: {str(e)}")
        return jsonify({"error": f"Failed to generate justification: {str(e)}"}), 500

@app.route('/api/ai/generate-rekon-context', methods=['POST'])
def generate_rekon_context():
    """Generate RekonContext Index details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        score = data.get('score')
        level = data.get('level')

        if not score or not level:
            return jsonify({"error": "score and level are required"}), 400

        # Build the prompt for RekonContext details
        prompt = build_rekon_context_prompt(data, score, level)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate exactly 3 CONCISE bullet points for the RekonContext Index. Each bullet point should be 1 short sentence (10-15 words max) and highly specific to the event details provided. Return only a JSON array of strings."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=400
        )

        content = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            details = json.loads(content)
            if not isinstance(details, list) or len(details) != 3:
                raise ValueError("Expected array of 3 strings")

            # logger.info(f"Generated RekonContext details for level {level} (score {score})")
            return jsonify({"details": details})

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse RekonContext JSON: {e}")
            # Fallback to default structure
            fallback_details = [
                f"Event complexity requires {level.lower()} level planning and coordination.",
                f"Risk profile indicates {level.lower()} operational oversight needed.",
                f"Stakeholder engagement appropriate for {level.lower()} significance events."
            ]
            return jsonify({"details": fallback_details})

    except Exception as e:
        logger.error(f"Error generating RekonContext details: {str(e)}")
        return jsonify({"error": f"Failed to generate RekonContext details: {str(e)}"}), 500

@app.route('/api/ai/generate-rekon-risk', methods=['POST'])
def generate_rekon_risk():
    """Generate RekonRisk Index details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        event_data = data.get('eventData', {})
        risks = data.get('risks', [])
        score = data.get('score')
        level = data.get('level')

        if not score or not level:
            return jsonify({"error": "score and level are required"}), 400

        # Build the prompt for RekonRisk details
        prompt = build_rekon_risk_prompt(event_data, risks, score, level)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate exactly 3 CONCISE bullet points for the RekonRisk Index. Each bullet point should be 1 short sentence (10-15 words max) and specific to the actual risks identified. Return only a JSON array of strings."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=400
        )

        content = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            details = json.loads(content)
            if not isinstance(details, list) or len(details) != 3:
                raise ValueError("Expected array of 3 strings")

            # logger.info(f"Generated RekonRisk details for level {level} (score {score})")
            return jsonify({"details": details})

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse RekonRisk JSON: {e}")
            # Fallback to default structure
            fallback_details = [
                f"Risk assessment indicates {level.lower()} level threats requiring active management.",
                f"Impact potential suggests {level.lower()} priority mitigation strategies needed.",
                f"Overall risk profile demands {level.lower()} level monitoring and response capabilities."
            ]
            return jsonify({"details": fallback_details})

    except Exception as e:
        logger.error(f"Error generating RekonRisk details: {str(e)}")
        return jsonify({"error": f"Failed to generate RekonRisk details: {str(e)}"}), 500

@app.route('/api/ai/generate-rekon-compliance', methods=['POST'])
def generate_rekon_compliance():
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

        # Build the prompt for RekonCompliance details
        prompt = build_rekon_compliance_prompt(event_data, risks, status)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert risk assessment consultant. Generate exactly 3 CONCISE bullet points for the RekonCompliance Status. Each bullet point should be 1 short sentence (10-15 words max) about regulatory alignment (Martyn's Law, ProtectUK, ISO 27001). Return only a JSON array of strings."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=400
        )

        content = response.choices[0].message.content.strip()

        # Parse JSON response
        try:
            details = json.loads(content)
            if not isinstance(details, list) or len(details) != 3:
                raise ValueError("Expected array of 3 strings")

            # logger.info(f"Generated RekonCompliance details for status {status}")
            return jsonify({"details": details})

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse RekonCompliance JSON: {e}")
            # Fallback to default structure based on status
            if status == "Exceeds Compliance":
                fallback_details = [
                    "Assessment demonstrates comprehensive approach exceeding regulatory requirements.",
                    "Risk identification and mitigation strategies surpass industry standards.",
                    "Documentation and controls align with best practice frameworks."
                ]
            elif status == "Compliant":
                fallback_details = [
                    "Assessment meets essential regulatory requirements and standards.",
                    "Risk management approach aligns with compliance frameworks.",
                    "Basic security and safety considerations are appropriately addressed."
                ]
            else:  # Non-Compliant
                fallback_details = [
                    "Assessment lacks key elements required by regulatory frameworks.",
                    "Critical security and safety risks are not adequately addressed.",
                    "Additional risk identification and mitigation planning required."
                ]
            return jsonify({"details": fallback_details})

    except Exception as e:
        logger.error(f"Error generating RekonCompliance details: {str(e)}")
        return jsonify({"error": f"Failed to generate RekonCompliance details: {str(e)}"}), 500

def build_rekon_context_prompt(event_data, score, level):
    """Build prompt for RekonContext Index details"""
    return f"""Generate 3 specific bullet points explaining the contextual complexity for this RekonContext Index assessment:

Event Details:
- Title: {event_data.get('eventTitle', 'N/A')}
- Date: {event_data.get('eventDate', 'N/A')}
- Location: {event_data.get('location', 'N/A')}
- Attendance: {event_data.get('attendance', 'N/A')} people
- Event Type: {event_data.get('eventType', 'N/A')}
- Venue Type: {event_data.get('venueType', 'N/A')}
- Description: {event_data.get('description', 'Not provided')}

RekonContext Assessment:
- Score: {score}/7
- Level: {level}

Generate exactly 3 CONCISE bullet points that explain:
1. The scale and logistical complexity specific to this event
2. The public profile and stakeholder sensitivity for this event type
3. The regulatory oversight and planning requirements for this specific event

Each bullet point should be 1 SHORT sentence (10-15 words maximum) and highly specific to the actual event details provided.

Return only a JSON array of 3 strings (no bullet point symbols, just the text)."""

def build_rekon_risk_prompt(event_data, risks, score, level):
    """Build prompt for RekonRisk Index details"""
    risk_summary = "\n".join([f"- {risk.get('risk', 'N/A')} (Category: {risk.get('category', 'N/A')}, Impact: {risk.get('impact', 'N/A')}, Likelihood: {risk.get('likelihood', 'N/A')})" for risk in risks[:8]])  # Limit to first 8 for brevity

    return f"""Generate 3 specific bullet points explaining the overall risk profile for this RekonRisk Index assessment:

Event Details:
- Title: {event_data.get('eventTitle', 'N/A')}
- Event Type: {event_data.get('eventType', 'N/A')}
- Venue Type: {event_data.get('venueType', 'N/A')}
- Attendance: {event_data.get('attendance', 'N/A')} people

Identified Risks:
{risk_summary}

RekonRisk Assessment:
- Score: {score}/7
- Level: {level}

Generate exactly 3 CONCISE bullet points that explain:
1. The nature and severity of risks identified for this specific event
2. The impact potential and likelihood patterns across the risk categories
3. The management and monitoring requirements based on the risk profile

Each bullet point should be 1 SHORT sentence (10-15 words maximum) and reference the actual risks identified, not generic statements.

Return only a JSON array of 3 strings (no bullet point symbols, just the text)."""

def build_rekon_compliance_prompt(event_data, risks, status):
    """Build prompt for RekonCompliance Status details"""
    security_risks = [risk for risk in risks if risk.get('category') == 'Security']
    risk_categories = list(set([risk.get('category', 'Unknown') for risk in risks]))

    return f"""Generate 3 specific bullet points explaining the compliance status for this RekonCompliance assessment:

Event Details:
- Title: {event_data.get('eventTitle', 'N/A')}
- Event Type: {event_data.get('eventType', 'N/A')}
- Venue Type: {event_data.get('venueType', 'N/A')}
- Attendance: {event_data.get('attendance', 'N/A')} people

Risk Assessment Summary:
- Total Risks Identified: {len(risks)}
- Security Risks: {len(security_risks)}
- Risk Categories Covered: {', '.join(risk_categories)}

RekonCompliance Status: {status}

Generate exactly 3 CONCISE bullet points that explain how this assessment aligns with:
1. Martyn's Law (terrorism risk assessment and public safety)
2. ProtectUK guidance (threat detection and security measures)
3. ISO 27001 (information security risk management)

Each bullet point should be 1 SHORT sentence (10-15 words maximum) and specific to the actual risks identified and the compliance status achieved.

Return only a JSON array of 3 strings (no bullet point symbols, just the text)."""

def build_overview_prompt(event_data):
    """Build prompt for overview paragraph"""
    return f"""Write a professional overview paragraph for a risk assessment of this event:

Event Title: {event_data.get('eventTitle', 'N/A')}
Event Date: {event_data.get('eventDate', 'N/A')}
Location: {event_data.get('location', 'N/A')}
Attendance: {event_data.get('attendance', 'N/A')} people
Event Type: {event_data.get('eventType', 'N/A')}
Venue Type: {event_data.get('venueType', 'N/A')}
Description: {event_data.get('description', 'Not provided')}

Write exactly ONE paragraph (3-4 short sentences) covering:
- Event description and its purpose
- Scale and significance of the event
- Location context and venue characteristics
- Target audience and community impact

Return only the paragraph text, no HTML tags, no formatting."""

def build_operational_prompt(event_data):
    """Build prompt for operational considerations paragraph"""
    return f"""Write a professional operational considerations paragraph for a risk assessment of this event:

Event Title: {event_data.get('eventTitle', 'N/A')}
Event Date: {event_data.get('eventDate', 'N/A')}
Location: {event_data.get('location', 'N/A')}
Attendance: {event_data.get('attendance', 'N/A')} people
Event Type: {event_data.get('eventType', 'N/A')}
Venue Type: {event_data.get('venueType', 'N/A')}
Description: {event_data.get('description', 'Not provided')}

Write exactly ONE paragraph (3-4 short sentences) covering:
- Key risk factors and safety considerations
- Logistical challenges and operational requirements
- Industry-specific considerations for this event type
- Regulatory and compliance factors

Return only the paragraph text, no HTML tags, no formatting."""

def build_risk_assessment_prompt(event_data):
    """Build prompt for risk assessment generation"""
    return f"""Generate a comprehensive risk assessment for the following event. Return ONLY valid JSON array format.

Event Details:
- Title: {event_data.get('eventTitle', 'N/A')}
- Date: {event_data.get('eventDate', 'N/A')}
- Location: {event_data.get('location', 'N/A')}
- Attendance: {event_data.get('attendance', 'N/A')} people
- Event Type: {event_data.get('eventType', 'N/A')}
- Venue Type: {event_data.get('venueType', 'N/A')}
- Description: {event_data.get('description', 'Not provided')}

Generate 8 specific risks relevant to this event. Each risk must have:
- id: sequential number starting from 1
- risk: detailed description of the specific risk
- category: one of "Crowd Safety", "Environmental", "Security", "Medical", "Operational", "Logistics"
- impact: number 1-5 (1=minimal, 5=catastrophic)
- likelihood: number 1-5 (1=rare, 5=almost certain)
- mitigation: specific, actionable mitigation strategy

Return only the JSON array, no additional text or formatting."""

def build_risk_conversation_system_prompt():
    """Build system prompt for risk conversation"""
    return """You are an expert risk assessment consultant conducting a comprehensive risk analysis. Your task is to generate risks in ORDER OF IMPORTANCE - starting with the MOST CRITICAL risks first.

CRITICAL GUIDELINES:
1. Generate risks in DESCENDING ORDER OF IMPORTANCE (most critical → least critical)
2. Each risk must be HIGHLY SPECIFIC to the actual event type, venue, and circumstances
3. Consider the REAL-WORLD implications of this specific event
4. Risk #1 = HIGHEST PRIORITY (most likely to cause serious harm/disruption)
5. Risk #2 = SECOND HIGHEST PRIORITY, and so on
6. Ensure DIVERSITY across categories: Crowd Safety, Environmental, Security, Medical, Operational, Logistics
7. Impact and likelihood should reflect REALISTIC assessment for this specific event
8. Mitigation strategies must be ACTIONABLE and event-specific

IMPORTANCE RANKING CRITERIA:
- Potential for serious injury/death
- Likelihood of occurrence for THIS event type
- Scale of potential disruption
- Legal/regulatory consequences
- Financial impact
- Reputational damage

Return ONLY valid JSON format: {"id": number, "risk": "description", "category": "category", "impact": number, "likelihood": number, "mitigation": "strategy"}

You will generate risks one by one, with each being the NEXT MOST IMPORTANT risk for this specific event."""

def build_event_context_message(event_data):
    """Build initial event context message"""
    return f"""I need a comprehensive risk assessment for the following event, with risks ranked by IMPORTANCE:

Event Details:
- Title: {event_data.get('eventTitle', 'N/A')}
- Date: {event_data.get('eventDate', 'N/A')}
- Location: {event_data.get('location', 'N/A')}
- Attendance: {event_data.get('attendance', 'N/A')} people
- Event Type: {event_data.get('eventType', 'N/A')}
- Venue Type: {event_data.get('venueType', 'N/A')}
- Description: {event_data.get('description', 'Not provided')}

CRITICAL REQUIREMENTS:
1. Generate risks in ORDER OF IMPORTANCE (most critical first)
2. Each risk must be HIGHLY SPECIFIC to this exact event type and circumstances
3. Consider what would ACTUALLY be the biggest concerns for event organizers
4. Think about real-world scenarios that could occur at THIS specific event
5. Ensure each risk is ACTIONABLE and REALISTIC

I will ask you to generate 8 risks, starting with the MOST CRITICAL and working down to less critical but still important risks. Each should represent what would genuinely be the next biggest concern for this specific event."""

def build_next_risk_prompt(previous_risks, risk_number):
    """Build prompt for next risk in order of importance"""
    if not previous_risks:
        return f"""Generate the MOST CRITICAL risk (#1) for this specific event.

This should be the HIGHEST PRIORITY risk that:
- Has the greatest potential for serious harm or major disruption
- Is most likely to occur given this event type and circumstances
- Would have the most severe consequences if it happened

Consider the specific event details (type, venue, attendance, location) to identify what poses the greatest actual threat.

Return only valid JSON format."""

    # Build context of what's already been covered
    covered_categories = [risk['category'] for risk in previous_risks]
    covered_themes = [risk['risk'][:50] + "..." for risk in previous_risks]

    importance_guidance = {
        1: "MOST CRITICAL - The single highest priority risk",
        2: "SECOND MOST CRITICAL - Next highest priority after #1",
        3: "THIRD MOST CRITICAL - Major concern but less critical than #1-2",
        4: "FOURTH MOST CRITICAL - Significant risk requiring attention",
        5: "FIFTH MOST CRITICAL - Important but lower priority",
        6: "SIXTH MOST CRITICAL - Additional risk to consider",
        7: "SEVENTH MOST CRITICAL - Lower priority but still relevant",
        8: "EIGHTH MOST CRITICAL - Lowest priority but still a risk to consider"
    }

    return f"""Generate the {importance_guidance.get(risk_number, 'NEXT MOST CRITICAL')} risk (#{risk_number}) for this specific event.

PREVIOUS RISKS ALREADY IDENTIFIED:
{chr(10).join([f"#{i+1}: {risk['risk'][:80]}... (Category: {risk['category']}, Impact: {risk['impact']}, Likelihood: {risk['likelihood']})" for i, risk in enumerate(previous_risks)])}

For risk #{risk_number}, identify the NEXT MOST IMPORTANT risk that:
1. Is DIFFERENT from all previous risks (avoid similar themes/categories if possible)
2. Is HIGHLY SPECIFIC to this event type and circumstances
3. Represents a REALISTIC and SIGNIFICANT threat
4. Would rank as the #{risk_number} most important concern for event organizers
5. Has appropriate impact/likelihood scores for its importance level

Focus on what would ACTUALLY be the next biggest concern for this specific event after the risks already identified.

Return only valid JSON format."""

def build_additional_risk_prompt(existing_risks, risk_number):
    """Build prompt for generating additional risks in order of importance"""

    # Determine importance level based on risk number
    if risk_number <= 8:
        importance_level = f"{risk_number}th most critical"
    elif risk_number == 9:
        importance_level = "9th most critical (first secondary priority)"
    elif risk_number == 10:
        importance_level = "10th most critical (second secondary priority)"
    elif risk_number == 11:
        importance_level = "11th most critical (third secondary priority)"
    else:
        importance_level = f"{risk_number}th most critical (lower priority but still relevant)"

    return f"""Generate the {importance_level} risk (#{risk_number}) for this event, continuing the importance-based ranking.

EXISTING RISKS ALREADY IDENTIFIED (in order of importance):
{chr(10).join([f"#{i+1}: {risk['risk'][:80]}... (Category: {risk['category']}, Impact: {risk['impact']}, Likelihood: {risk['likelihood']})" for i, risk in enumerate(existing_risks)])}

For risk #{risk_number}, identify the NEXT MOST IMPORTANT risk that:
1. Continues the DESCENDING ORDER OF IMPORTANCE from the existing risks
2. Is COMPLETELY DIFFERENT from all existing risks (avoid similar themes/categories)
3. Represents what would ACTUALLY be the #{risk_number} most important concern for this specific event
4. Is still RELEVANT and REALISTIC for this event type and circumstances
5. Has appropriate impact/likelihood scores reflecting its importance level
6. Uses a different category if possible to ensure comprehensive coverage

IMPORTANCE RANKING CRITERIA (same as initial risks):
- Potential for serious injury/death
- Likelihood of occurrence for THIS event type
- Scale of potential disruption
- Legal/regulatory consequences
- Financial impact
- Reputational damage

This should be the NEXT most important risk after the existing {len(existing_risks)} risks, not just any secondary risk.

Return only valid JSON format."""

def build_single_risk_prompt(event_data, risk_number, total_risks):
    """Build prompt for single risk generation (legacy)"""
    return f"""Generate risk #{risk_number} of {total_risks} for the following event. Return ONLY valid JSON object format.

Event Details:
- Title: {event_data.get('eventTitle', 'N/A')}
- Date: {event_data.get('eventDate', 'N/A')}
- Location: {event_data.get('location', 'N/A')}
- Attendance: {event_data.get('attendance', 'N/A')} people
- Event Type: {event_data.get('eventType', 'N/A')}
- Venue Type: {event_data.get('venueType', 'N/A')}
- Description: {event_data.get('description', 'Not provided')}

Generate 1 specific risk relevant to this event. The risk must have:
- id: {risk_number}
- risk: detailed description of the specific risk
- category: one of "Crowd Safety", "Environmental", "Security", "Medical", "Operational", "Logistics"
- impact: number 1-5 (1=minimal, 5=catastrophic)
- likelihood: number 1-5 (1=rare, 5=almost certain)
- mitigation: specific, actionable mitigation strategy

Focus on risk #{risk_number} being a {'high priority' if risk_number <= 2 else 'medium priority' if risk_number <= 4 else 'standard'} risk for this type of event.

Return only the JSON object, no additional text or formatting."""

def build_justification_prompt(field_name, field_value, context):
    """Build prompt for justification generation"""
    # Special handling for contextual summary
    if field_name == 'Contextual Summary':
        return f"""Explain why this specific contextual summary was generated for this event:

Event: {context.get('eventTitle', 'N/A')}
Date: {context.get('eventDate', 'N/A')}
Location: {context.get('location', 'N/A')}
Type: {context.get('eventType', 'N/A')}
Venue: {context.get('venueType', 'N/A')}
Attendance: {context.get('attendance', 'N/A')}

Provide a brief explanation (1-2 sentences) of why these specific themes were chosen for THIS event.

Format as:
REASONING: [Brief explanation of why these themes were chosen]
SOURCES:
• [Specific document/standard name] [public]
• [Specific document/standard name] [public]
• [Specific document/standard name] [proprietary]
• [Specific document/standard name] [public]

Use 3-5 bullet points with SPECIFIC, REAL documents/standards such as:
- ISO 31000:2018 Risk Management Guidelines
- NFPA 1600:2019 Standard on Continuity, Emergency, and Risk Management
- HSE HSG65 Managing for Health and Safety
- BS 31100:2011 Code of Practice for Risk Management
- Purple Guide to Health, Safety and Welfare at Music and Other Events
- Event Safety Alliance Event Safety Guide
Mark each as [public] or [proprietary]."""

    # For risk assessment fields
    return f"""Provide a specific justification for why this exact value was chosen:

Field: {field_name}
Specific Value: "{field_value}"
Event: {context.get('eventTitle', 'N/A')}
Event Type: {context.get('eventType', 'N/A')}
Venue Type: {context.get('venueType', 'N/A')}
Attendance: {context.get('attendance', 'N/A')}
Location: {context.get('location', 'N/A')}
Risk: {context.get('riskDescription', 'N/A')}

Explain why THIS SPECIFIC VALUE ("{field_value}") is correct for this risk and event. Be concise.

Give a brief explanation (1-2 sentences) that directly addresses this exact value.

Format as:
REASONING: [Concise explanation for why "{field_value}" is correct]
SOURCES:
• [Specific document/standard name] [public]
• [Specific document/standard name] [public]
• [Specific document/standard name] [proprietary]
• [Specific document/standard name] [public]

Use 3-5 bullet points with SPECIFIC, REAL documents/standards such as:
- ISO 31000:2018 Risk Management Guidelines
- NFPA 1600:2019 Standard on Continuity, Emergency, and Risk Management
- HSE HSG65 Managing for Health and Safety
- BS 31100:2011 Code of Practice for Risk Management
- Purple Guide to Health, Safety and Welfare at Music and Other Events
- Event Safety Alliance Event Safety Guide
- NFPA 101:2021 Life Safety Code
- ISO 45001:2018 Occupational Health and Safety Management Systems
Mark each as [public] or [proprietary]."""

def validate_and_format_risks(risks):
    """Validate and format risks from AI response"""
    if not isinstance(risks, list):
        raise ValueError('Risks must be an array')

    valid_categories = ['Crowd Safety', 'Environmental', 'Security', 'Medical', 'Operational', 'Logistics']

    formatted_risks = []
    for index, risk in enumerate(risks):
        formatted_risk = {
            'id': risk.get('id', index + 1),
            'risk': risk.get('risk', 'Risk description not provided'),
            'category': risk.get('category') if risk.get('category') in valid_categories else 'Operational',
            'impact': validate_score(risk.get('impact')),
            'likelihood': validate_score(risk.get('likelihood')),
            'mitigation': risk.get('mitigation', 'Mitigation strategy not provided')
        }
        formatted_risks.append(formatted_risk)

    return formatted_risks

def validate_and_format_single_risk(risk, risk_id):
    """Validate and format a single risk from AI response"""
    valid_categories = ['Crowd Safety', 'Environmental', 'Security', 'Medical', 'Operational', 'Logistics']

    formatted_risk = {
        'id': risk.get('id', risk_id),
        'risk': risk.get('risk', 'Risk description not provided'),
        'category': risk.get('category') if risk.get('category') in valid_categories else 'Operational',
        'impact': validate_score(risk.get('impact')),
        'likelihood': validate_score(risk.get('likelihood')),
        'mitigation': risk.get('mitigation', 'Mitigation strategy not provided')
    }

    return formatted_risk

def validate_score(score):
    """Validate risk score (1-5)"""
    try:
        num_score = int(score)
        return num_score if 1 <= num_score <= 5 else 3
    except (ValueError, TypeError):
        return 3

def parse_justification_response(response):
    """Parse justification response"""
    import re

    reasoning_match = re.search(r'REASONING:\s*(.*?)(?=SOURCES:|$)', response, re.DOTALL)
    sources_match = re.search(r'SOURCES:\s*(.*?)$', response, re.DOTALL)

    # Default sources if parsing fails
    default_sources = [
        'ISO 31000:2018 Risk Management Guidelines [public]',
        'NFPA 1600:2019 Standard on Continuity, Emergency, and Risk Management [public]',
        'HSE HSG65 Managing for Health and Safety [public]',
        'BS 31100:2011 Code of Practice for Risk Management [public]'
    ]

    sources = default_sources
    if sources_match:
        sources_text = sources_match.group(1).strip()
        # Extract bullet points (• or -)
        bullet_points = [s.strip() for s in sources_text.split('\n') if s.strip() and (s.strip().startswith('•') or s.strip().startswith('-'))]
        if bullet_points:
            sources = [s.replace('•', '').replace('-', '').strip() for s in bullet_points]

    return {
        'reasoning': reasoning_match.group(1).strip() if reasoning_match else response,
        'sources': sources
    }

def get_local_ip():
    """Get the local IP address of the machine"""
    try:
        # Connect to a remote address to determine local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

def display_server_info(host, port):
    """Display server information with local and remote URLs"""
    local_ip = get_local_ip()

    print(f"\n🚀 AIREKON Risk Assessment API Server")
    print(f"   Local:  http://localhost:{port}")
    print(f"   Remote: http://{local_ip}:{port}")
    print(f"   Press Ctrl+C to stop\n")

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='AIREKON Risk Assessment API Server')
    parser.add_argument('--port', '-p', type=int, default=5001,
                       help='Port to run the server on (default: 5001)')
    parser.add_argument('--host', default='0.0.0.0',
                       help='Host to bind to (default: 0.0.0.0)')
    parser.add_argument('--debug', action='store_true', default=True,
                       help='Run in debug mode (default: True)')

    args = parser.parse_args()

    # Override with environment variable if set
    port = int(os.environ.get('PORT', args.port))
    host = args.host

    # Display server information only in main process (not in Flask reloader)
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        display_server_info(host, port)

    # Start the Flask application
    try:
        app.run(host=host, port=port, debug=args.debug)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        print("💡 Try using a different port with --port=<port_number>")
