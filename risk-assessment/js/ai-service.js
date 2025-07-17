/**
 * AI Service Layer for Backend API Integration
 * Handles all communication with Flask backend API
 */

class AIService {
    constructor() {
        // Use main app backend URL which has the enhanced risk generation
        this.backendURL = 'http://localhost:8085';
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
                console.log(`🔧 AI Service makeRequest response for ${endpoint}:`, responseData);
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
     * @returns {Promise<Object>} - Full response with risk_data and legacy risks
     */
    async generateRiskAssessment(eventData) {
        const response = await this.makeRequest('/api/ai/generate-risks', eventData);
        console.log('🔧 AI Service received response:', response);
        return response; // Return full response instead of just response.risks
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
    async generateSingleRisk(eventData, riskNumber, totalRisks = 8) {
        const requestData = {
            ...eventData,
            riskNumber,
            totalRisks
        };
        const response = await this.makeRequest('/api/ai/generate-single-risk', requestData);
        return response.risk;
    }

    /**
     * Generate additional risks for an existing assessment
     * @param {string} conversationId - Conversation ID
     * @param {Array} existingRisks - Array of existing risks
     * @param {number} numAdditional - Number of additional risks to generate
     * @returns {Promise<Array>}
     */
    async generateAdditionalRisks(conversationId, existingRisks, numAdditional = 3) {
        const requestData = {
            conversation_id: conversationId,
            existing_risks: existingRisks,
            num_additional: numAdditional
        };
        const response = await this.makeRequest('/api/ai/generate-additional-risks', requestData);
        return response.risks;
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
    /**
     * Generate RekonContext Index details
     * @param {Object} eventData - Event information
     * @param {number} score - Calculated context score (1-7)
     * @param {string} level - Context level name
     * @returns {Promise<Array>} - Array of bullet point strings
     */
    async generateRekonContextDetails(eventData, score, level) {
        const requestData = {
            ...eventData,
            score,
            level
        };
        const response = await this.makeRequest('/api/ai/generate-rekon-context', requestData);
        return response.details;
    }

    /**
     * Generate RekonRisk Index details
     * @param {Object} eventData - Event information
     * @param {Array} risks - Array of risk objects
     * @param {number} score - Calculated risk score (1-7)
     * @param {string} level - Risk level name
     * @returns {Promise<Array>} - Array of bullet point strings
     */
    async generateRekonRiskDetails(eventData, risks, score, level) {
        const requestData = {
            eventData,
            risks,
            score,
            level
        };
        const response = await this.makeRequest('/api/ai/generate-rekon-risk', requestData);
        return response.details;
    }

    /**
     * Generate RekonCompliance Status details
     * @param {Object} eventData - Event information
     * @param {Array} risks - Array of risk objects
     * @param {string} status - Compliance status
     * @returns {Promise<Array>} - Array of bullet point strings
     */
    async generateRekonComplianceDetails(eventData, risks, status) {
        const requestData = {
            eventData,
            risks,
            status
        };
        const response = await this.makeRequest('/api/ai/generate-rekon-compliance', requestData);
        return response.details;
    }






}

// Create global instance
window.aiService = new AIService();
