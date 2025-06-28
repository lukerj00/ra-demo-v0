"""
Response parsing utilities for aiRekon Risk Assessment Tool
"""

import re

def parse_justification_response(response):
    """Parse justification response"""
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
