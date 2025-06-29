/**
 * Constants Module
 * Contains all static data, configuration objects, and constants used throughout the application
 */

export const VENUE_TYPE_OPTIONS = {
    'Music': ['Outdoor Festival', 'Indoor Concert', 'Nightclub Event', 'Arena Tour', 'Album Launch Party'],
    'Community': ['Street Fair / Fete', 'Charity Fundraiser', 'Local Market', 'Public Rally / Protest', 'Cultural Festival'],
    'State': ['Official Public Ceremony', 'VIP Visit / Dignitary Protection', 'Political Conference', 'National Day Parade', 'State Funeral'],
    'Sport': ['Stadium Match (e.g., Football, Rugby)', 'Marathon / Running Event', 'Motorsport Race', 'Combat Sports Night (e.g., Boxing, MMA)', 'Golf Tournament'],
    'Other': ['Corporate Conference', 'Private Party / Wedding', 'Film Premiere', 'Exhibition / Trade Show', 'Product Launch']
};

export const REKON_RISK_LEVELS = {
    1: { level: 'Negligible', details: ['Risks identified are procedural or minor in nature.', 'Impact on objectives is highly unlikely and would be insignificant.', 'Standard operational controls are sufficient for management.'] },
    2: { level: 'Very Low', details: ['Identified risks have a low probability of occurring.', 'Potential impact is minor and could be easily absorbed.', 'Existing mitigation strategies require minimal active management.'] },
    3: { level: 'Low', details: ['Risks are unlikely to occur but warrant monitoring.', 'Impact would be localized and have a limited effect on overall objectives.', 'Specific mitigation plans should be in place and reviewed periodically.'] },
    4: { level: 'Moderate', details: ['Risks have a reasonable chance of occurring if not managed.', 'Potential impact could cause noticeable disruption and may require dedicated resources.', 'Active monitoring and defined mitigation actions are required.'] },
    5: { level: 'High', details: ['Risks are likely to materialize without proactive intervention.', 'Impact could be significant, affecting key project outcomes or reputation.', 'Robust mitigation strategies must be implemented and closely tracked.'] },
    6: { level: 'Very High', details: ['Risks are very likely to occur and could have a severe impact.', 'Potential for major disruption, financial loss, or harm is substantial.', 'Requires senior management attention and intensive mitigation efforts.'] },
    7: { level: 'Critical', details: ['Risks are imminent or have an almost certain chance of occurring.', 'Impact would be critical, threatening project viability or causing extreme harm.', 'Immediate, comprehensive action and contingency planning are essential.'] }
};

export const COMPLIANCE_ICONS = {
    'Non-Compliant': `<svg class="w-full h-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'Compliant': `<svg class="w-full h-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'Exceeds Compliance': `<svg class="w-full h-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15L15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.25 9.75L16.5 12l-2.25 2.25" /></svg>`
};

export const REKON_CONTEXT_LEVELS = {
    1: { level: 'Routine', details: ['Small-scale, localized event with straightforward logistics.', 'Low public profile with minimal media interest or social sensitivity.', 'Follows established, routine procedures with low regulatory oversight.'] },
    2: { level: 'Standard', details: ['Medium-scale event with moderate complexity and coordination requirements.', 'Some public interest but manageable media attention and stakeholder engagement.', 'Standard regulatory compliance with well-defined approval processes.'] },
    3: { level: 'Elevated', details: ['Large-scale event requiring significant coordination across multiple agencies.', 'High public profile with substantial media coverage and stakeholder interest.', 'Enhanced regulatory oversight with multiple approval layers and compliance requirements.'] },
    4: { level: 'Complex', details: ['Multi-faceted event with intricate logistics and extensive stakeholder management.', 'Very high public profile with intense media scrutiny and political sensitivity.', 'Complex regulatory environment requiring specialized expertise and extensive documentation.'] },
    5: { level: 'Critical', details: ['High-stakes event with national or international significance and complex security requirements.', 'Extreme public and media attention with potential for widespread social and political impact.', 'Stringent regulatory compliance with multiple jurisdictions and specialized security protocols.'] },
    6: { level: 'Strategic', details: ['Mission-critical event with far-reaching implications for organizational reputation and objectives.', 'Global media attention and high-level political or diplomatic significance.', 'Multi-layered regulatory framework requiring coordination with national and international authorities.'] },
    7: { level: 'Exceptional', details: ['Unprecedented event requiring extraordinary measures and resources.', 'Worldwide attention with potential to influence international relations or global markets.', 'Exceptional regulatory requirements involving the highest levels of government and security agencies.'] }
};

export const FIELD_MAPPINGS = {
    'Risk Description': 'risk',
    'Category': 'category',
    'Impact': 'impact',
    'Likelihood': 'likelihood',
    'Mitigations': 'mitigation',
    'Overall Score': 'overall'
};

export const RISK_SCORE_THRESHOLDS = {
    CRITICAL: 23,
    VERY_HIGH: 20,
    HIGH: 15,
    MODERATE: 10,
    LOW: 7,
    VERY_LOW: 4
};

export const FALLBACK_LOGO_BASE64 = null; // Set this if needed

export const PDF_CONFIG = {
    ORIENTATION: 'portrait',
    UNIT: 'mm',
    FORMAT: 'a4',
    MARGIN_LEFT: 15,
    MARGIN_RIGHT: 15,
    MARGIN_TOP: 15,
    FOOTER_HEIGHT: 20
};

export const COLORS = {
    TAILWIND: {
        RED_500: '#DC2626',
        GREEN_500: '#16A34A',
        YELLOW_500: '#EAB308',
        BLUE_500: '#3B82F6',
        GRAY_500: '#6B7280'
    }
};
