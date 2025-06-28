"""
Prompt building utilities for aiRekon Risk Assessment Tool
"""

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

Return only the JSON object, no additional text or formatting."""
