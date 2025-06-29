/**
 * Justification Manager Module
 * Handles justification pane logic, AI justification generation, and justification storage
 */

import { FIELD_MAPPINGS } from './constants.js';

export class JustificationManager {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
        this.aiService = window.aiService; // Use global AI service
    }

    /**
     * Open justification pane
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {string} reasoning - Justification reasoning
     * @param {Array} sources - Justification sources
     */
    openJustificationPane(fieldName, fieldValue, reasoning, sources) {
        this.dom.justificationFieldName.textContent = fieldName;

        if (fieldName === 'Contextual Summary') {
            this.dom.justificationFieldValue.innerHTML = ''; // Clear content
            this.dom.justificationFieldValue.style.display = 'none'; // Hide the element
        } else {
            this.dom.justificationFieldValue.textContent = fieldValue; // Set text for other fields
            this.dom.justificationFieldValue.style.display = ''; // Ensure element is visible and reset display property
        }

        this.dom.justificationReasoning.textContent = reasoning;
        this.dom.justificationSources.innerHTML = '';
        if (sources && sources.length > 0) {
            sources.forEach(src => {
                const li = document.createElement('li');
                li.textContent = src;
                this.dom.justificationSources.appendChild(li);
            });
        } else {
            this.dom.justificationSources.innerHTML = '<li>No specific documents cited.</li>';
        }
        this.dom.justificationPane.classList.remove('hidden');
        setTimeout(() => {
            this.dom.justificationPane.style.transform = 'translateX(0)';
        }, 10); 
    }

    /**
     * Hide justification pane
     */
    hideJustificationPane() {
        this.dom.justificationPane.style.transform = 'translateX(100%)';
        setTimeout(() => {
            this.dom.justificationPane.classList.add('hidden');
        }, 300); // Matches transition duration
    }

    /**
     * Update justification content without reopening panel
     * @param {string} reasoning - Updated reasoning
     * @param {Array} sources - Updated sources
     */
    updateJustificationContent(reasoning, sources) {
        this.dom.justificationReasoning.textContent = reasoning;

        this.dom.justificationSources.innerHTML = '';
        sources.forEach(source => {
            const li = document.createElement('li');
            li.textContent = source;
            this.dom.justificationSources.appendChild(li);
        });
    }

    /**
     * Generate AI justification for risk fields
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {Object} riskData - Risk data object
     */
    async generateRiskJustification(fieldName, fieldValue, riskData) {
        const justificationKey = FIELD_MAPPINGS[fieldName];

        // Check if we already have this justification stored
        if (riskData.justifications && riskData.justifications[justificationKey]) {
            const stored = riskData.justifications[justificationKey];
            console.log(`📋 Retrieved stored justification for: ${fieldName} = "${fieldValue}"`);
            this.openJustificationPane(fieldName, fieldValue, stored.reasoning, stored.sources);
            return;
        }

        // Open panel immediately with loading state
        this.openJustificationPane(
            fieldName,
            fieldValue,
            "AI is generating justification...",
            ["Loading..."]
        );

        try {
            const eventData = this.state.getEventData();
            const context = {
                eventTitle: eventData.eventTitle,
                eventType: eventData.eventType,
                venueType: eventData.venueType,
                attendance: eventData.attendance,
                location: eventData.location,
                riskDescription: riskData.risk,
                riskCategory: riskData.category,
                riskImpact: riskData.impact,
                riskLikelihood: riskData.likelihood,
                riskMitigation: riskData.mitigation
            };

            const justification = await this.aiService.generateJustification(
                fieldName,
                fieldValue,
                context
            );

            // Store the justification in the risk data
            if (!riskData.justifications) {
                riskData.justifications = {};
            }
            riskData.justifications[justificationKey] = {
                reasoning: justification.reasoning,
                sources: justification.sources
            };
            console.log(`💾 Stored justification for: ${fieldName} = "${fieldValue}"`);

            // Update panel with AI-generated content
            this.updateJustificationContent(justification.reasoning, justification.sources);

        } catch (error) {
            console.error('Error generating AI justification:', error);
            // Update with fallback content
            const fallbackReasoning = `This assessment was determined through AI analysis considering the event type, scale, venue characteristics, and industry best practices.`;
            const fallbackSources = ['AI Risk Analysis', 'Industry Standards'];

            // Store the fallback content too
            if (!riskData.justifications) {
                riskData.justifications = {};
            }
            riskData.justifications[justificationKey] = {
                reasoning: fallbackReasoning,
                sources: fallbackSources
            };

            this.updateJustificationContent(fallbackReasoning, fallbackSources);
        }
    }

    /**
     * Generate AI justification for summary
     */
    async generateSummaryJustification() {
        const applicationState = this.state.getApplicationState();
        
        // Check if we already have this justification stored
        if (applicationState.summaryJustification) {
            console.log(`📋 Retrieved stored justification for: Contextual Summary`);
            this.openJustificationPane('Contextual Summary', this.dom.summaryContent.innerHTML,
                applicationState.summaryJustification.reasoning,
                applicationState.summaryJustification.sources);
            return;
        }

        // Open panel immediately with loading state
        this.openJustificationPane(
            'Contextual Summary',
            this.dom.summaryContent.innerHTML,
            'AI is generating justification...',
            ['Loading...']
        );

        try {
            const eventData = this.state.getEventData();

            const justification = await this.aiService.generateJustification(
                'Contextual Summary',
                this.dom.summaryContent.innerHTML,
                eventData
            );

            // Store the justification in application state
            this.state.updateApplicationState({
                summaryJustification: {
                    reasoning: justification.reasoning,
                    sources: justification.sources
                }
            });
            console.log(`💾 Stored justification for: Contextual Summary`);

            // Update panel with AI-generated content
            this.updateJustificationContent(justification.reasoning, justification.sources);

        } catch (error) {
            console.error('Error generating justification:', error);
            // Update with fallback content
            const fallbackReasoning = 'The summary was generated using AI analysis based on the event details provided, considering event type, scale, location, and industry best practices.';
            const fallbackSources = ['AI Analysis', 'Event Details', 'Industry Best Practices'];

            // Store the fallback content too
            this.state.updateApplicationState({
                summaryJustification: {
                    reasoning: fallbackReasoning,
                    sources: fallbackSources
                }
            });

            this.updateJustificationContent(fallbackReasoning, fallbackSources);
        }
    }

    /**
     * Pre-generate justifications for all fields of a risk in background
     * @param {Object} riskData - Risk data object
     * @param {Object} eventData - Event data object
     */
    async preGenerateJustifications(riskData, eventData) {
        const context = {
            eventTitle: eventData.eventTitle,
            eventType: eventData.eventType,
            venueType: eventData.venueType,
            attendance: eventData.attendance,
            location: eventData.location,
            riskDescription: riskData.risk,
            riskCategory: riskData.category,
            riskImpact: riskData.impact,
            riskLikelihood: riskData.likelihood,
            riskMitigation: riskData.mitigation
        };

        // Generate justifications for key fields in background
        const fieldsToPreGenerate = [
            { name: 'Risk Description', value: riskData.risk, key: 'risk' },
            { name: 'Impact', value: riskData.impact.toString(), key: 'impact' },
            { name: 'Likelihood', value: riskData.likelihood.toString(), key: 'likelihood' },
            { name: 'Overall Score', value: (riskData.impact * riskData.likelihood).toString(), key: 'overall' }
        ];

        // Generate justifications asynchronously without blocking UI
        fieldsToPreGenerate.forEach(async (field) => {
            try {
                const justification = await this.aiService.generateJustification(
                    field.name,
                    field.value,
                    context
                );

                // Store the justification
                if (!riskData.justifications) {
                    riskData.justifications = {};
                }
                riskData.justifications[field.key] = {
                    reasoning: justification.reasoning,
                    sources: justification.sources
                };

                console.log(`🔄 Pre-generated justification for ${field.name} = "${field.value}"`);
            } catch (error) {
                console.error(`Error pre-generating justification for ${field.name}:`, error);
            }
        });
    }

    /**
     * Pre-generate summary justification in background
     * @param {Object} eventData - Event data object
     */
    async preGenerateSummaryJustification(eventData) {
        try {
            const justification = await this.aiService.generateJustification(
                'Contextual Summary',
                this.dom.summaryContent.innerHTML,
                eventData
            );

            // Store the justification in application state
            this.state.updateApplicationState({
                summaryJustification: {
                    reasoning: justification.reasoning,
                    sources: justification.sources
                }
            });

            console.log('🔄 Pre-generated justification for Contextual Summary');
        } catch (error) {
            console.error('Error pre-generating summary justification:', error);
        }
    }

    /**
     * Handle justification request
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {string|null} reasoning - Pre-calculated reasoning (for Overall Score)
     * @param {Array|null} sources - Pre-calculated sources (for Overall Score)
     * @param {Object|null} riskData - Risk data for AI generation
     */
    async handleJustificationRequest(fieldName, fieldValue, reasoning, sources, riskData) {
        if (reasoning && sources) {
            // Use pre-calculated justification (e.g., for Overall Score)
            this.openJustificationPane(fieldName, fieldValue, reasoning, sources);
        } else if (riskData) {
            // Generate AI justification for risk field
            await this.generateRiskJustification(fieldName, fieldValue, riskData);
        } else {
            // Fallback justification
            this.openJustificationPane(fieldName, fieldValue, reasoning || 'No justification available', sources || []);
        }
    }
}
