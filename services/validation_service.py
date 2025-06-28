"""
Validation service for aiRekon Risk Assessment Tool
"""

def validate_and_format_risks(risks):
    """Validate and format risks from AI response"""
    if not isinstance(risks, list):
        return []

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
