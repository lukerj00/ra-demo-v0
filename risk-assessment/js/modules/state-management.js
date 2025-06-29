/**
 * State Management Module
 * Handles application state and data management
 */

export class StateManager {
    constructor() {
        this.initializeState();
        this.initializeVenueTypes();
    }

    initializeState() {
        // --- Application State ---
        this.applicationState = {
            currentStep: 'setup', // 'setup', 'generating', 'review', 'complete'
            eventData: {},
            summaryGenerated: false,
            risksGenerated: false,
            summaryJustification: null,
            riskJustifications: {}
        };

        // --- Risk Data ---
        this.riskData = [];
        this.currentProjectName = "";
        this.aiRekonLogoBase64 = null; // To store the base64 logo for PDF
        this.currentConversationId = null; // Store conversation ID for additional risks
    }

    initializeVenueTypes() {
        // --- Venue Type Mapping ---
        this.venueTypesByEventType = {
            'Music': ['Outdoor Festival', 'Indoor Concert', 'Nightclub Event', 'Arena Tour', 'Album Launch Party'],
            'Community': ['Street Fair / Fete', 'Charity Fundraiser', 'Local Market', 'Public Rally / Protest', 'Cultural Festival'],
            'State': ['Official Public Ceremony', 'VIP Visit / Dignitary Protection', 'Political Conference', 'National Day Parade', 'State Funeral'],
            'Sport': ['Stadium Match (e.g., Football, Rugby)', 'Marathon / Running Event', 'Motorsport Race', 'Combat Sports Night (e.g., Boxing, MMA)', 'Golf Tournament'],
            'Other': ['Corporate Conference', 'Private Party / Wedding', 'Film Premiere', 'Exhibition / Trade Show', 'Product Launch']
        };
    }

    /**
     * Update application state
     * @param {Object} updates - State updates to apply
     */
    updateApplicationState(updates) {
        Object.assign(this.applicationState, updates);
        this.notifyStateChange();
    }

    /**
     * Get current application state
     * @returns {Object} Current application state
     */
    getApplicationState() {
        return { ...this.applicationState };
    }

    /**
     * Set event data
     * @param {Object} eventData - Event data to store
     */
    setEventData(eventData) {
        this.applicationState.eventData = { ...eventData };
        this.notifyStateChange();
    }

    /**
     * Get event data
     * @returns {Object} Current event data
     */
    getEventData() {
        return { ...this.applicationState.eventData };
    }

    /**
     * Add risk to risk data array
     * @param {Object} risk - Risk object to add
     */
    addRisk(risk) {
        this.riskData.push(risk);
        this.notifyStateChange();
    }

    /**
     * Set all risk data
     * @param {Array} risks - Array of risk objects
     */
    setRiskData(risks) {
        this.riskData = [...risks];
        this.notifyStateChange();
    }

    /**
     * Get all risk data
     * @returns {Array} Array of risk objects
     */
    getRiskData() {
        return [...this.riskData];
    }

    /**
     * Set current conversation ID
     * @param {string} conversationId - Conversation ID for risk generation
     */
    setConversationId(conversationId) {
        this.currentConversationId = conversationId;
    }

    /**
     * Get current conversation ID
     * @returns {string} Current conversation ID
     */
    getConversationId() {
        return this.currentConversationId;
    }

    /**
     * Set project name
     * @param {string} name - Project name
     */
    setProjectName(name) {
        this.currentProjectName = name;
    }

    /**
     * Get project name
     * @returns {string} Current project name
     */
    getProjectName() {
        return this.currentProjectName;
    }

    /**
     * Set logo base64 data
     * @param {string} logoData - Base64 encoded logo data
     */
    setLogoBase64(logoData) {
        this.aiRekonLogoBase64 = logoData;
    }

    /**
     * Get logo base64 data
     * @returns {string} Base64 encoded logo data
     */
    getLogoBase64() {
        return this.aiRekonLogoBase64;
    }

    /**
     * Get venue types for a specific event type
     * @param {string} eventType - Event type
     * @returns {Array} Array of venue types
     */
    getVenueTypesForEventType(eventType) {
        return this.venueTypesByEventType[eventType] || [];
    }

    /**
     * Store justification for a field
     * @param {string} fieldKey - Field identifier
     * @param {Object} justification - Justification data
     */
    setJustification(fieldKey, justification) {
        if (fieldKey === 'summary') {
            this.applicationState.summaryJustification = justification;
        } else {
            this.applicationState.riskJustifications[fieldKey] = justification;
        }
        this.notifyStateChange();
    }

    /**
     * Get justification for a field
     * @param {string} fieldKey - Field identifier
     * @returns {Object|null} Justification data or null
     */
    getJustification(fieldKey) {
        if (fieldKey === 'summary') {
            return this.applicationState.summaryJustification;
        }
        return this.applicationState.riskJustifications[fieldKey] || null;
    }

    /**
     * Reset application state
     */
    reset() {
        this.initializeState();
        this.notifyStateChange();
    }

    /**
     * Notify state change (for future event system)
     */
    notifyStateChange() {
        // Future: Emit state change events for reactive updates
        // For now, this is a placeholder for potential event system
    }

    /**
     * Export current state for debugging
     * @returns {Object} Complete application state
     */
    exportState() {
        return {
            applicationState: this.applicationState,
            riskData: this.riskData,
            currentProjectName: this.currentProjectName,
            currentConversationId: this.currentConversationId,
            hasLogo: !!this.aiRekonLogoBase64
        };
    }
}
