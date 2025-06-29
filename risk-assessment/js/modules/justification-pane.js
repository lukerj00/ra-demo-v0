/**
 * Justification Pane Module
 * Handles justification panel display and interactions
 */

export class JustificationPane {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
        this.aiService = window.aiService; // Use global AI service
        this.currentJustificationKey = null;
    }

    /**
     * Open justification pane
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {string|Object} context - Context data (risk ID or event data)
     */
    async openJustificationPane(fieldName, fieldValue, context = {}) {
        try {
            // Set current justification key
            this.currentJustificationKey = typeof context === 'string' ? 
                `risk_${context}_${fieldName.toLowerCase().replace(/\s+/g, '_')}` : 
                'summary';

            // Update pane content
            this.dom.justificationFieldName.textContent = fieldName;
            this.dom.justificationFieldValue.textContent = fieldValue;

            // Check if justification already exists
            const existingJustification = this.state.getJustification(this.currentJustificationKey);
            
            if (existingJustification) {
                // Display existing justification
                this.displayJustification(existingJustification);
            } else {
                // Show loading state and generate new justification
                this.showLoadingState();
                await this.generateJustification(fieldName, fieldValue, context);
            }

            // Show the pane
            this.dom.justificationPane.classList.remove('hidden');
            this.dom.justificationPane.classList.add('slide-in-right');

        } catch (error) {
            console.error('Error opening justification pane:', error);
            this.showError('Failed to load justification. Please try again.');
        }
    }

    /**
     * Generate justification for a field
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {string|Object} context - Context data
     */
    async generateJustification(fieldName, fieldValue, context) {
        try {
            let contextData;
            
            if (typeof context === 'string') {
                // Risk-specific justification
                contextData = {
                    ...this.state.getEventData(),
                    riskId: context,
                    risks: this.state.getRiskData()
                };
            } else {
                // Summary justification
                contextData = this.state.getEventData();
            }

            const justification = await this.aiService.generateJustification(
                fieldName, 
                fieldValue, 
                contextData
            );

            // Store justification
            this.state.setJustification(this.currentJustificationKey, justification);

            // Display justification
            this.displayJustification(justification);

        } catch (error) {
            console.error('Error generating justification:', error);
            this.showError('Failed to generate justification. Please try again.');
        }
    }

    /**
     * Display justification content
     * @param {Object} justification - Justification data
     */
    displayJustification(justification) {
        // Display reasoning
        this.dom.justificationReasoning.innerHTML = `
            <h4 class="font-semibold text-zinc-900 mb-2">Reasoning</h4>
            <p class="text-zinc-700 leading-relaxed">${justification.reasoning}</p>
        `;

        // Display sources
        const sourcesList = justification.sources.map(source => 
            `<li class="text-zinc-700">${source}</li>`
        ).join('');

        this.dom.justificationSources.innerHTML = `
            <h4 class="font-semibold text-zinc-900 mb-2">Sources</h4>
            <ul class="list-disc list-inside space-y-1">
                ${sourcesList}
            </ul>
        `;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.dom.justificationReasoning.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="loader"></div>
                <p class="ml-4 text-zinc-500">AI is generating justification...</p>
            </div>
        `;

        this.dom.justificationSources.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="loader"></div>
                <p class="ml-4 text-zinc-500">Loading sources...</p>
            </div>
        `;
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showError(message) {
        this.dom.justificationReasoning.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-800">${message}</p>
                    </div>
                </div>
            </div>
        `;

        this.dom.justificationSources.innerHTML = '';
    }

    /**
     * Close justification pane
     */
    closeJustificationPane() {
        this.dom.justificationPane.classList.add('slide-out-right');
        
        setTimeout(() => {
            this.dom.justificationPane.classList.add('hidden');
            this.dom.justificationPane.classList.remove('slide-in-right', 'slide-out-right');
            this.currentJustificationKey = null;
        }, 300);
    }

    /**
     * Pre-generate justifications for risks
     * @param {Object} risk - Risk object
     * @param {Object} eventData - Event data
     */
    async preGenerateJustifications(risk, eventData) {
        const justificationFields = [
            { field: 'Risk Description', value: risk.risk },
            { field: 'Impact', value: risk.impact.toString() },
            { field: 'Likelihood', value: risk.likelihood.toString() },
            { field: 'Overall Score', value: (risk.impact * risk.likelihood).toString() }
        ];

        // Generate justifications in background (don't wait)
        justificationFields.forEach(async ({ field, value }) => {
            try {
                const justificationKey = `risk_${risk.id}_${field.toLowerCase().replace(/\s+/g, '_')}`;
                
                // Skip if already exists
                if (this.state.getJustification(justificationKey)) {
                    return;
                }

                const contextData = {
                    ...eventData,
                    riskId: risk.id,
                    risks: this.state.getRiskData()
                };

                const justification = await this.aiService.generateJustification(
                    field, 
                    value, 
                    contextData
                );

                this.state.setJustification(justificationKey, justification);
                
            } catch (error) {
                console.error(`Error pre-generating justification for ${field}:`, error);
            }
        });
    }

    /**
     * Pre-generate summary justification
     * @param {Object} eventData - Event data
     */
    async preGenerateSummaryJustification(eventData) {
        try {
            const summaryContent = this.dom.summaryContent.textContent;
            
            if (!summaryContent || this.state.getJustification('summary')) {
                return;
            }

            const justification = await this.aiService.generateJustification(
                'Executive Summary',
                summaryContent,
                eventData
            );

            this.state.setJustification('summary', justification);
            
        } catch (error) {
            console.error('Error pre-generating summary justification:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.dom.closeJustificationPaneBtn.addEventListener('click', () => {
            this.closeJustificationPane();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.dom.justificationPane.classList.contains('hidden')) {
                this.closeJustificationPane();
            }
        });

        // Close on backdrop click
        this.dom.justificationPane.addEventListener('click', (e) => {
            if (e.target === this.dom.justificationPane) {
                this.closeJustificationPane();
            }
        });

        // Summary justification icon
        if (this.dom.summaryJustificationIcon) {
            this.dom.summaryJustificationIcon.addEventListener('click', () => {
                const summaryContent = this.dom.summaryContent.textContent;
                this.openJustificationPane('Executive Summary', summaryContent, this.state.getEventData());
            });
        }
    }

    /**
     * Check if justification exists for a field
     * @param {string} fieldKey - Field key
     * @returns {boolean} True if justification exists
     */
    hasJustification(fieldKey) {
        return !!this.state.getJustification(fieldKey);
    }

    /**
     * Get all justifications for export
     * @returns {Object} All justifications
     */
    getAllJustifications() {
        const state = this.state.getApplicationState();
        return {
            summary: state.summaryJustification,
            risks: state.riskJustifications
        };
    }

    /**
     * Clear all justifications
     */
    clearJustifications() {
        this.state.updateApplicationState({
            summaryJustification: null,
            riskJustifications: {}
        });
    }
}
