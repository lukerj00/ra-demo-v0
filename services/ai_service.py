"""
AI service for aiRekon Risk Assessment Tool
Handles all OpenAI API interactions
"""

import json
import logging
from config import get_openai_client, get_risk_conversations
from utils.prompt_builders import (
    build_overview_prompt, build_operational_prompt, build_risk_assessment_prompt,
    build_risk_conversation_system_prompt, build_event_context_message,
    build_next_risk_prompt, build_additional_risk_prompt, build_single_risk_prompt,
    build_rekon_context_prompt, build_rekon_risk_prompt, build_rekon_compliance_prompt
)
from utils.response_parsers import parse_justification_response
from services.validation_service import validate_and_format_risks, validate_and_format_single_risk

logger = logging.getLogger(__name__)

def generate_overview(event_data):
    """Generate overview paragraph for risk assessment"""
    client = get_openai_client()
    prompt = build_overview_prompt(event_data)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Generate a professional overview paragraph for the risk assessment."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=300
    )
    
    return response.choices[0].message.content.strip()

def generate_operational(event_data):
    """Generate operational considerations paragraph for risk assessment"""
    client = get_openai_client()
    prompt = build_operational_prompt(event_data)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Generate a professional operational considerations paragraph for the risk assessment."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=300
    )
    
    return response.choices[0].message.content.strip()

def generate_risks(event_data):
    """Generate risk assessment table"""
    client = get_openai_client()
    prompt = build_risk_assessment_prompt(event_data)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Generate a comprehensive risk assessment in JSON format."
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
        return validate_and_format_risks(risks)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse risks JSON: {e}")
        return []

def start_risk_conversation(event_data):
    """Start a new risk assessment conversation"""
    client = get_openai_client()
    risk_conversations = get_risk_conversations()
    
    conversation_id = f"event_{hash(str(event_data))}"
    
    # Initialize conversation with system prompt and event context
    system_prompt = build_risk_conversation_system_prompt()
    event_context = build_event_context_message(event_data)
    
    conversation = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": event_context}
    ]
    
    # Store conversation
    risk_conversations[conversation_id] = {
        'messages': conversation,
        'event_data': event_data,
        'generated_risks': []
    }
    
    return conversation_id

def generate_next_risk(conversation_id, risk_number):
    """Generate the next risk in an ongoing conversation"""
    client = get_openai_client()
    risk_conversations = get_risk_conversations()
    
    if conversation_id not in risk_conversations:
        raise ValueError("Conversation not found")
    
    conversation_data = risk_conversations[conversation_id]
    previous_risks = conversation_data['generated_risks']
    
    # Build prompt for next risk
    next_risk_prompt = build_next_risk_prompt(previous_risks, risk_number)
    
    # Add to conversation
    conversation_data['messages'].append({"role": "user", "content": next_risk_prompt})
    
    # Make request to OpenAI
    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=conversation_data['messages'],
        temperature=0.7,
        max_tokens=500
    )
    
    content = response.choices[0].message.content.strip()
    
    # Add AI response to conversation
    conversation_data['messages'].append({"role": "assistant", "content": content})
    
    # Parse and validate the risk
    try:
        risk_data = json.loads(content)
        formatted_risk = validate_and_format_single_risk(risk_data, risk_number)
        
        # Store the generated risk
        conversation_data['generated_risks'].append(formatted_risk)
        
        return formatted_risk
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse risk JSON: {e}")
        return None

def generate_additional_risks(event_data, existing_risks, num_risks=3):
    """Generate additional risks for an existing assessment"""
    client = get_openai_client()

    generated_risks = []
    for i in range(num_risks):
        risk_number = len(existing_risks) + len(generated_risks) + 1

        # Build prompt for additional risk
        prompt = build_additional_risk_prompt(existing_risks + generated_risks, risk_number)

        # Make request to OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=[
                {
                    "role": "system",
                    "content": build_risk_conversation_system_prompt()
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=500
        )

        content = response.choices[0].message.content.strip()

        # Parse and validate the risk
        try:
            risk_data = json.loads(content)
            formatted_risk = validate_and_format_single_risk(risk_data, risk_number)
            generated_risks.append(formatted_risk)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse additional risk JSON: {e}")
            continue

    return generated_risks

def generate_single_risk(event_data, risk_number, total_risks):
    """Generate a single risk for progressive loading (legacy endpoint)"""
    client = get_openai_client()
    prompt = build_single_risk_prompt(event_data, risk_number, total_risks)

    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Generate a single risk in JSON format."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=500
    )

    content = response.choices[0].message.content.strip()

    # Parse and validate the risk
    try:
        risk_data = json.loads(content)
        return validate_and_format_single_risk(risk_data, risk_number)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse single risk JSON: {e}")
        return None

def generate_justification(event_data, field_type, field_value):
    """Generate justification for a specific field"""
    client = get_openai_client()

    # Build justification prompt based on field type
    if field_type == 'overview':
        prompt = f"""Provide a detailed justification for this overview assessment:

Event: {event_data.get('eventTitle', 'N/A')}
Overview: {field_value}

REASONING:
Explain in 2-3 concise sentences why this overview accurately captures the event's key characteristics and risk context.

SOURCES:
List 3-5 specific sources that support this assessment:"""

    elif field_type == 'operational':
        prompt = f"""Provide a detailed justification for this operational considerations assessment:

Event: {event_data.get('eventTitle', 'N/A')}
Operational Considerations: {field_value}

REASONING:
Explain in 2-3 concise sentences why these operational considerations are appropriate for this event type and context.

SOURCES:
List 3-5 specific sources that support this assessment:"""

    else:
        prompt = f"""Provide a detailed justification for this {field_type} assessment:

Event: {event_data.get('eventTitle', 'N/A')}
Assessment: {field_value}

REASONING:
Explain in 2-3 concise sentences why this assessment is appropriate and accurate.

SOURCES:
List 3-5 specific sources that support this assessment:"""

    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Provide specific justifications with credible sources."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=600
    )

    content = response.choices[0].message.content.strip()
    return parse_justification_response(content)

def generate_rekon_context(event_data, score, level):
    """Generate RekonContext Index details"""
    client = get_openai_client()
    prompt = build_rekon_context_prompt(event_data, score, level)

    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Generate exactly 3 CONCISE bullet points for the RekonContext Index. Each bullet point should be 1 short sentence (10-15 words max) about contextual complexity. Return only a JSON array of strings."
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
        return details
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse RekonContext JSON: {e}")
        # Fallback to default structure based on level
        if level == "High":
            return [
                "Large-scale event requiring extensive coordination and security planning.",
                "High public visibility with significant stakeholder and media attention.",
                "Complex regulatory requirements and multi-agency oversight needed."
            ]
        elif level == "Medium":
            return [
                "Moderate-scale event with standard planning and coordination requirements.",
                "Some public attention requiring appropriate security and safety measures.",
                "Standard regulatory compliance and local authority coordination needed."
            ]
        else:  # Low
            return [
                "Small-scale event with basic planning and minimal coordination requirements.",
                "Limited public exposure with standard safety and security considerations.",
                "Basic regulatory compliance and routine local authority notification."
            ]

def generate_rekon_risk(event_data, risks, score, level):
    """Generate RekonRisk Index details"""
    client = get_openai_client()
    prompt = build_rekon_risk_prompt(event_data, risks, score, level)

    response = client.chat.completions.create(
        model="gpt-4o-mini-2024-07-18",
        messages=[
            {
                "role": "system",
                "content": "You are an expert risk assessment consultant. Generate exactly 3 CONCISE bullet points for the RekonRisk Index. Each bullet point should be 1 short sentence (10-15 words max) about risk profile. Return only a JSON array of strings."
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
        return details
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse RekonRisk JSON: {e}")
        # Fallback to default structure based on level
        if level == "High":
            return [
                "Multiple high-impact risks identified across critical operational areas.",
                "Significant likelihood of incidents requiring comprehensive mitigation strategies.",
                "Intensive monitoring and emergency response capabilities essential for safety."
            ]
        elif level == "Medium":
            return [
                "Moderate risks identified requiring standard mitigation and monitoring approaches.",
                "Some potential for incidents with manageable impact through proper planning.",
                "Regular monitoring and standard emergency procedures adequate for management."
            ]
        else:  # Low
            return [
                "Limited risks identified with low impact potential and likelihood.",
                "Minimal incident probability with standard safety measures sufficient.",
                "Basic monitoring and routine safety procedures appropriate for risk level."
            ]

def generate_rekon_compliance(event_data, risks, status):
    """Generate RekonCompliance Status details"""
    client = get_openai_client()
    prompt = build_rekon_compliance_prompt(event_data, risks, status)

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
        return details
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"Failed to parse RekonCompliance JSON: {e}")
        # Fallback to default structure based on status
        if status == "Exceeds Compliance":
            return [
                "Assessment demonstrates comprehensive approach exceeding regulatory requirements.",
                "Risk identification and mitigation strategies surpass industry standards.",
                "Documentation and controls align with best practice frameworks."
            ]
        elif status == "Compliant":
            return [
                "Assessment meets essential regulatory requirements and standards.",
                "Risk management approach aligns with compliance frameworks.",
                "Basic security and safety considerations are appropriately addressed."
            ]
        else:  # Non-Compliant
            return [
                "Assessment lacks key elements required by regulatory frameworks.",
                "Critical security and safety risks are not adequately addressed.",
                "Additional risk identification and mitigation planning required."
            ]
