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

            logger.info(f"Generated risk {risk_number} in conversation {conversation_id}: {validated_risk['risk'][:50]}...")
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
            importance_reminder = f"""Remember: You are continuing the importance-based risk assessment. The first 6 risks were the most critical. Now generate risk #{risk_number} which should be the next most important concern for this specific event."""

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

                logger.info(f"Generated additional risk {risk_number}: {validated_risk['risk'][:50]}...")

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
        total_risks = data.get('totalRisks', 6)

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
            logger.info(f"Generated single risk {risk_number}: {validated_risk['risk'][:50]}...")
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

I will ask you to generate 6 risks, starting with the MOST CRITICAL and working down to less critical but still important risks. Each should represent what would genuinely be the next biggest concern for this specific event."""

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
        6: "SIXTH MOST CRITICAL - Additional risk to consider"
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
    if risk_number <= 6:
        importance_level = f"{risk_number}th most critical"
    elif risk_number == 7:
        importance_level = "7th most critical (first secondary priority)"
    elif risk_number == 8:
        importance_level = "8th most critical (second secondary priority)"
    elif risk_number == 9:
        importance_level = "9th most critical (third secondary priority)"
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
