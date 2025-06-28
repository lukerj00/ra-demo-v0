"""
Flask Backend for aiRekon Risk Assessment Tool
Handles OpenAI API requests securely on the server side
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

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

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "aiRekon Risk Assessment API is running"})

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
        logger.info(f"Generated overview paragraph: {len(content)} characters")
        
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
        logger.info(f"Generated operational paragraph: {len(content)} characters")
        
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
        
        logger.info(f"Generated justification for {field_name}: {field_value}")
        return jsonify(justification)
        
    except Exception as e:
        logger.error(f"Error generating justification: {str(e)}")
        return jsonify({"error": f"Failed to generate justification: {str(e)}"}), 500

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

Write exactly ONE paragraph (3-4 sentences) covering:
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

Write exactly ONE paragraph (3-4 sentences) covering:
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

Generate 6-8 specific risks relevant to this event. Each risk must have:
- id: sequential number starting from 1
- risk: detailed description of the specific risk
- category: one of "Crowd Safety", "Environmental", "Security", "Medical", "Operational", "Logistics"
- impact: number 1-5 (1=minimal, 5=catastrophic)
- likelihood: number 1-5 (1=rare, 5=almost certain)
- mitigation: specific, actionable mitigation strategy

Return only the JSON array, no additional text or formatting."""

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
