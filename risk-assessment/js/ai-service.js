/**
 * AI Service Layer for OpenAI Integration
 * Handles all communication with OpenAI GPT-4 API
 */

class AIService {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://api.openai.com/v1/chat/completions';
        this.model = 'gpt-4o-mini-2024-07-18'; 
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Initialize the AI service with API key
     * @param {string} apiKey - OpenAI API key
     */
    initialize(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Check if AI service is properly configured
     * @returns {boolean}
     */
    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Make a request to OpenAI API with retry logic
     * @param {Array} messages - Chat messages for the API
     * @param {Object} options - Additional options
     * @returns {Promise<string>}
     */
    async makeRequest(messages, options = {}) {
        if (!this.isConfigured()) {
            throw new Error('AI service not configured. Please provide an API key.');
        }

        const requestBody = {
            model: this.model,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || options.maxTokens || 2000,
            ...options
        };

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(this.baseURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                return data.choices[0].message.content;

            } catch (error) {
                console.error(`AI request attempt ${attempt} failed:`, error);
                
                if (attempt === this.maxRetries) {
                    throw error;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    /**
     * Generate contextual summary for the event using two separate prompts
     * @param {Object} eventData - Event information
     * @returns {Promise<string>}
     */
    async generateContextualSummary(eventData) {
        try {
            // Generate first paragraph
            const paragraph1 = await this.generateOverviewParagraph(eventData);

            // Generate second paragraph
            const paragraph2 = await this.generateOperationalParagraph(eventData);

            // Combine both paragraphs
            return `<p>${paragraph1}</p>\n<p>${paragraph2}</p>`;

        } catch (error) {
            console.error('Error generating contextual summary:', error);
            throw error;
        }
    }

    /**
     * Generate the first paragraph - Event overview and context
     * @param {Object} eventData - Event information
     * @returns {Promise<string>}
     */
    async generateOverviewParagraph(eventData) {
        const prompt = this.buildOverviewPrompt(eventData);

        const messages = [
            {
                role: "system",
                content: "You are an expert risk assessment consultant. Generate a single paragraph about event overview and context. Return only the paragraph text without any HTML tags, markdown, or formatting."
            },
            {
                role: "user",
                content: prompt
            }
        ];

        const response = await this.makeRequest(messages, { max_tokens: 400 });
        return response.trim();
    }

    /**
     * Generate the second paragraph - Operational considerations
     * @param {Object} eventData - Event information
     * @returns {Promise<string>}
     */
    async generateOperationalParagraph(eventData) {
        const prompt = this.buildOperationalPrompt(eventData);

        const messages = [
            {
                role: "system",
                content: "You are an expert risk assessment consultant. Generate a single paragraph about operational considerations and risk factors. Return only the paragraph text without any HTML tags, markdown, or formatting."
            },
            {
                role: "user",
                content: prompt
            }
        ];

        const response = await this.makeRequest(messages, { max_tokens: 400 });
        return response.trim();
    }

    /**
     * Generate risk assessment table
     * @param {Object} eventData - Event information
     * @returns {Promise<Array>}
     */
    async generateRiskAssessment(eventData) {
        const prompt = this.buildRiskAssessmentPrompt(eventData);
        
        const messages = [
            {
                role: "system",
                content: "You are an expert risk assessment consultant. Generate detailed risk assessments in JSON format. Each risk should have: id, risk (description), category, impact (1-5), likelihood (1-5), and mitigation."
            },
            {
                role: "user",
                content: prompt
            }
        ];

        const response = await this.makeRequest(messages, { max_tokens: 2000 });
        
        try {
            // Parse JSON response and validate structure
            const risks = JSON.parse(response);
            return this.validateAndFormatRisks(risks);
        } catch (error) {
            console.error('Failed to parse risk assessment JSON:', error);
            throw new Error('Invalid risk assessment format received from AI');
        }
    }

    /**
     * Generate justification for a specific field
     * @param {string} fieldName - Name of the field
     * @param {string} fieldValue - Value of the field
     * @param {Object} context - Additional context
     * @returns {Promise<Object>}
     */
    async generateJustification(fieldName, fieldValue, context = {}) {
        const prompt = this.buildJustificationPrompt(fieldName, fieldValue, context);
        
        const messages = [
            {
                role: "system",
                content: "You are an expert risk assessment consultant. Provide SPECIFIC, CONCISE justifications (1-2 sentences max). For sources, use bullet points (•) with 3-5 SPECIFIC, REAL documents/standards with full names and years (e.g., 'ISO 31000:2018 Risk Management Guidelines', 'NFPA 1600:2019 Standard on Continuity'). Mark each as [public] or [proprietary]. NO vague descriptors."
            },
            {
                role: "user",
                content: prompt
            }
        ];

        const response = await this.makeRequest(messages, { max_tokens: 300 });
        
        return this.parseJustificationResponse(response);
    }

    /**
     * Build prompt for overview paragraph (first paragraph)
     * @param {Object} eventData - Event information
     * @returns {string}
     */
    buildOverviewPrompt(eventData) {
        return `Write a professional overview paragraph for a risk assessment of this event:

Event Title: ${eventData.eventTitle}
Event Date: ${eventData.eventDate}
Location: ${eventData.location}
Attendance: ${eventData.attendance} people
Event Type: ${eventData.eventType}
Venue Type: ${eventData.venueType}
Description: ${eventData.description || 'Not provided'}

Write exactly ONE paragraph (3-4 sentences) covering:
- Event description and its purpose
- Scale and significance of the event
- Location context and venue characteristics
- Target audience and community impact

Return only the paragraph text, no HTML tags, no formatting.`;
    }

    /**
     * Build prompt for operational considerations paragraph (second paragraph)
     * @param {Object} eventData - Event information
     * @returns {string}
     */
    buildOperationalPrompt(eventData) {
        return `Write a professional operational considerations paragraph for a risk assessment of this event:

Event Title: ${eventData.eventTitle}
Event Date: ${eventData.eventDate}
Location: ${eventData.location}
Attendance: ${eventData.attendance} people
Event Type: ${eventData.eventType}
Venue Type: ${eventData.venueType}
Description: ${eventData.description || 'Not provided'}

Write exactly ONE paragraph (3-4 sentences) covering:
- Key risk factors and safety considerations
- Logistical challenges and operational requirements
- Industry-specific considerations for this event type
- Regulatory and compliance factors

Return only the paragraph text, no HTML tags, no formatting.`;
    }

    /**
     * Build prompt for risk assessment generation
     * @param {Object} eventData - Event information
     * @returns {string}
     */
    buildRiskAssessmentPrompt(eventData) {
        return `Generate a comprehensive risk assessment for the following event. Return ONLY valid JSON array format.

Event Details:
- Title: ${eventData.eventTitle}
- Date: ${eventData.eventDate}
- Location: ${eventData.location}
- Attendance: ${eventData.attendance} people
- Event Type: ${eventData.eventType}
- Venue Type: ${eventData.venueType}
- Description: ${eventData.description || 'Not provided'}

Generate 6-8 specific risks relevant to this event. Each risk must have:
- id: sequential number starting from 1
- risk: detailed description of the specific risk
- category: one of "Crowd Safety", "Environmental", "Security", "Medical", "Operational", "Logistics"
- impact: number 1-5 (1=minimal, 5=catastrophic)
- likelihood: number 1-5 (1=rare, 5=almost certain)
- mitigation: specific, actionable mitigation strategy

Return only the JSON array, no additional text or formatting.`;
    }

    /**
     * Build prompt for justification generation
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {Object} context - Additional context
     * @returns {string}
     */
    buildJustificationPrompt(fieldName, fieldValue, context) {
        // Special handling for contextual summary
        if (fieldName === 'Contextual Summary') {
            return `Explain why this specific contextual summary was generated for this event:

Event: ${context.eventTitle || 'N/A'}
Date: ${context.eventDate || 'N/A'}
Location: ${context.location || 'N/A'}
Type: ${context.eventType || 'N/A'}
Venue: ${context.venueType || 'N/A'}
Attendance: ${context.attendance || 'N/A'}

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
Mark each as [public] or [proprietary].`;
        }

        // For risk assessment fields
        return `Provide a specific justification for why this exact value was chosen:

Field: ${fieldName}
Specific Value: "${fieldValue}"
Event: ${context.eventTitle || 'N/A'}
Event Type: ${context.eventType || 'N/A'}
Venue Type: ${context.venueType || 'N/A'}
Attendance: ${context.attendance || 'N/A'}
Location: ${context.location || 'N/A'}
Risk: ${context.riskDescription || 'N/A'}

Explain why THIS SPECIFIC VALUE ("${fieldValue}") is correct for this risk and event. Be concise.

Give a brief explanation (1-2 sentences) that directly addresses this exact value.

Format as:
REASONING: [Concise explanation for why "${fieldValue}" is correct]
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
Mark each as [public] or [proprietary].`;
    }

    /**
     * Validate and format risks from AI response
     * @param {Array} risks - Raw risks from AI
     * @returns {Array}
     */
    validateAndFormatRisks(risks) {
        if (!Array.isArray(risks)) {
            throw new Error('Risks must be an array');
        }

        return risks.map((risk, index) => {
            return {
                id: risk.id || (index + 1),
                risk: risk.risk || 'Risk description not provided',
                category: this.validateCategory(risk.category),
                impact: this.validateScore(risk.impact),
                likelihood: this.validateScore(risk.likelihood),
                mitigation: risk.mitigation || 'Mitigation strategy not provided'
            };
        });
    }

    /**
     * Validate risk category
     * @param {string} category - Risk category
     * @returns {string}
     */
    validateCategory(category) {
        const validCategories = ['Crowd Safety', 'Environmental', 'Security', 'Medical', 'Operational', 'Logistics'];
        return validCategories.includes(category) ? category : 'Operational';
    }

    /**
     * Validate risk score (1-5)
     * @param {number} score - Risk score
     * @returns {number}
     */
    validateScore(score) {
        const numScore = parseInt(score);
        return (numScore >= 1 && numScore <= 5) ? numScore : 3;
    }

    /**
     * Clean summary response from potential markdown formatting
     * @param {string} response - AI response
     * @returns {string}
     */
    cleanSummaryResponse(response) {
        console.log('Raw AI response:', response); // Debug log

        let cleaned = response.trim();

        // Remove markdown code blocks
        cleaned = cleaned.replace(/```html\s*/gi, '');
        cleaned = cleaned.replace(/```\s*/g, '');

        // Remove any leading/trailing backticks
        cleaned = cleaned.replace(/^`+|`+$/g, '');

        // Ensure proper paragraph spacing
        cleaned = cleaned.replace(/<\/p>\s*<p>/g, '</p>\n<p>');

        // If response doesn't start with <p>, wrap it
        if (!cleaned.startsWith('<p>')) {
            // Split by double line breaks and wrap each part in <p> tags
            const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length > 0) {
                cleaned = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
            }
        }

        // Count paragraphs to ensure we have exactly 2
        const paragraphCount = (cleaned.match(/<p>/g) || []).length;
        console.log('Paragraph count:', paragraphCount); // Debug log

        // If we don't have exactly 2 paragraphs, try to fix it
        if (paragraphCount !== 2) {
            console.warn('Expected 2 paragraphs, got:', paragraphCount);

            // If we have 1 long paragraph, try to split it
            if (paragraphCount === 1) {
                const content = cleaned.replace(/<\/?p>/g, '').trim();
                const sentences = content.split(/\.\s+/).filter(s => s.trim());

                if (sentences.length >= 4) {
                    const midPoint = Math.ceil(sentences.length / 2);
                    const firstParagraph = sentences.slice(0, midPoint).join('. ') + '.';
                    const secondParagraph = sentences.slice(midPoint).join('. ') + '.';
                    cleaned = `<p>${firstParagraph}</p>\n<p>${secondParagraph}</p>`;
                    console.log('Split single paragraph into two');
                }
            }
        }

        console.log('Final cleaned response:', cleaned); // Debug log
        return cleaned;
    }

    /**
     * Parse justification response
     * @param {string} response - AI response
     * @returns {Object}
     */
    parseJustificationResponse(response) {
        const reasoningMatch = response.match(/REASONING:\s*(.*?)(?=SOURCES:|$)/s);
        const sourcesMatch = response.match(/SOURCES:\s*(.*?)$/s);

        let sources = [
            'ISO 31000:2018 Risk Management Guidelines [public]',
            'NFPA 1600:2019 Standard on Continuity, Emergency, and Risk Management [public]',
            'HSE HSG65 Managing for Health and Safety [public]',
            'BS 31100:2011 Code of Practice for Risk Management [public]'
        ];

        if (sourcesMatch) {
            const sourcesText = sourcesMatch[1].trim();
            // Extract bullet points (• or -)
            const bulletPoints = sourcesText.split(/\n/).map(s => s.trim()).filter(s => s && (s.startsWith('•') || s.startsWith('-')));
            if (bulletPoints.length > 0) {
                sources = bulletPoints.map(s => s.replace(/^[•-]\s*/, '').trim());
            }
        }

        return {
            reasoning: reasoningMatch ? reasoningMatch[1].trim() : response,
            sources: sources
        };
    }
}

// Create global instance
window.aiService = new AIService();
