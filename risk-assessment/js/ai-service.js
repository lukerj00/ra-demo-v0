/**
 * AI Service Layer for Backend API Integration
 * Handles all communication with Flask backend API
 */

class AIService {
    constructor() {
        this.backendURL = 'http://localhost:5001';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.initialized = false;
    }

    /**
     * Initialize the AI service (no API key needed - handled by backend)
     */
    initialize() {
        console.log('🤖 AI Service: Initializing backend connection...');
        this.initialized = true;
        console.log('✅ AI Service: Successfully initialized for backend communication');
    }

    /**
     * Check if AI service is properly configured
     * @returns {boolean}
     */
    isConfigured() {
        return this.initialized;
    }

    /**
     * Make a request to backend API with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise<Object>}
     */
    async makeRequest(endpoint, data) {
        if (!this.isConfigured()) {
            throw new Error('AI service not configured. Please initialize first.');
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.backendURL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Backend request failed: ${response.status} - ${errorData.error || response.statusText}`);
                }

                const responseData = await response.json();
                return responseData;

            } catch (error) {
                console.error(`Backend request attempt ${attempt} failed:`, error);

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
        const response = await this.makeRequest('/api/ai/generate-overview', eventData);
        return response.content.trim();
    }

    /**
     * Generate the second paragraph - Operational considerations
     * @param {Object} eventData - Event information
     * @returns {Promise<string>}
     */
    async generateOperationalParagraph(eventData) {
        const response = await this.makeRequest('/api/ai/generate-operational', eventData);
        return response.content.trim();
    }

    /**
     * Generate risk assessment table
     * @param {Object} eventData - Event information
     * @returns {Promise<Array>}
     */
    async generateRiskAssessment(eventData) {
        const response = await this.makeRequest('/api/ai/generate-risks', eventData);
        return response.risks;
    }

    /**
     * Start a new risk assessment conversation
     * @param {Object} eventData - Event information
     * @returns {Promise<string>} - Conversation ID
     */
    async startRiskConversation(eventData) {
        const response = await this.makeRequest('/api/ai/start-risk-conversation', eventData);
        return response.conversation_id;
    }

    /**
     * Generate the next risk in an ongoing conversation
     * @param {string} conversationId - Conversation ID
     * @param {number} riskNumber - Which risk number to generate (1-based)
     * @returns {Promise<Object>}
     */
    async generateNextRisk(conversationId, riskNumber) {
        const requestData = {
            conversation_id: conversationId,
            risk_number: riskNumber
        };
        const response = await this.makeRequest('/api/ai/generate-next-risk', requestData);
        return response.risk;
    }

    /**
     * Generate a single risk for progressive loading (legacy method)
     * @param {Object} eventData - Event information
     * @param {number} riskNumber - Which risk number to generate (1-based)
     * @param {number} totalRisks - Total number of risks to generate
     * @returns {Promise<Object>}
     */
    async generateSingleRisk(eventData, riskNumber, totalRisks = 6) {
        const requestData = {
            ...eventData,
            riskNumber,
            totalRisks
        };
        const response = await this.makeRequest('/api/ai/generate-single-risk', requestData);
        return response.risk;
    }

    /**
     * Generate justification for a specific field
     * @param {string} fieldName - Name of the field
     * @param {string} fieldValue - Value of the field
     * @param {Object} context - Additional context
     * @returns {Promise<Object>}
     */
    async generateJustification(fieldName, fieldValue, context = {}) {
        const requestData = {
            fieldName,
            fieldValue,
            context
        };

        const response = await this.makeRequest('/api/ai/generate-justification', requestData);
        return response;
    }






}

// Create global instance
window.aiService = new AIService();
