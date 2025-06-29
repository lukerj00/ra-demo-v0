/**
 * Risk Generation Module
 * Handles AI-powered risk assessment generation and management
 */

export class RiskGenerator {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
        this.aiService = window.aiService; // Use global AI service
    }

    /**
     * Start the complete risk generation process
     * @param {Object} eventData - Event data for risk assessment
     */
    async startGeneration(eventData) {
        try {
            this.state.setEventData(eventData);
            this.state.updateApplicationState({ currentStep: 'generating' });

            // Show screen 2 and hide screen 1
            this.dom.screen1.classList.add('hidden');
            this.dom.screen2.classList.remove('hidden');

            // Set report title
            this.dom.reportTitle.textContent = `Risk Assessment: ${eventData.eventTitle}`;
            this.state.setProjectName(eventData.eventTitle);

            // Start the generation process
            await this.generateSummary(eventData);
            await this.generateRisks(eventData);

        } catch (error) {
            console.error('Error in risk generation:', error);
            this.showError('Failed to generate risk assessment. Please try again.');
        }
    }

    /**
     * Generate contextual summary
     * @param {Object} eventData - Event data
     */
    async generateSummary(eventData) {
        try {
            // Show summary section with loading state
            this.dom.summarySection.classList.remove('hidden');
            this.dom.summarySection.classList.add('fade-in');
            this.dom.summaryContent.innerHTML = `
                <div class="flex justify-center items-center py-4">
                    <div class="loader"></div>
                    <p class="ml-4 text-zinc-500">AI is generating overview...</p>
                </div>
            `;

            // Update status for first paragraph
            this.dom.aiStatus.textContent = "AI is generating overview...";
            this.dom.progressBar.style.width = '15%';

            // Generate and display first paragraph
            const paragraph1 = await this.aiService.generateOverviewParagraph(eventData);
            this.dom.summaryContent.innerHTML = `<p>${paragraph1}</p>`;

            // Brief pause to let user see first paragraph
            await this.sleep(800);

            // Update status for second paragraph
            this.dom.aiStatus.textContent = "AI is generating operational considerations...";
            this.dom.progressBar.style.width = '25%';

            // Generate and display second paragraph
            const paragraph2 = await this.aiService.generateOperationalParagraph(eventData);
            this.dom.summaryContent.innerHTML = `<p>${paragraph1}</p><p class="mt-4">${paragraph2}</p>`;

            // Update state to indicate summary is generated
            this.state.updateApplicationState({ summaryGenerated: true });

            // Show actions
            this.dom.summaryActions.classList.remove('hidden');
            await this.displayRekonContext();
            this.dom.progressBar.style.width = '30%';

        } catch (error) {
            console.error('Error generating summary:', error);
            this.showError('Failed to generate summary. Please try again.');
        }
    }

    /**
     * Generate risks using progressive conversation approach
     * @param {Object} eventData - Event data
     */
    async generateRisks(eventData) {
        try {
            await this.proceedToRiskGeneration();

            // Start risk conversation
            this.dom.aiStatus.textContent = "AI is starting risk assessment conversation...";
            const conversationId = await this.aiService.startRiskConversation(eventData);
            this.state.setConversationId(conversationId);

            // Generate risks progressively
            for (let i = 1; i <= 8; i++) {
                this.dom.aiStatus.textContent = `AI is identifying risks (${i}/8)...`;
                this.dom.progressBar.style.width = `${30 + (i * 7)}%`;

                try {
                    const risk = await this.aiService.generateNextRisk(conversationId, i);
                    
                    if (risk) {
                        // Create risk with justification placeholders
                        const riskWithJustifications = {
                            ...risk,
                            justifications: {
                                risk: { reasoning: '', sources: [] },
                                impact: { reasoning: '', sources: [] },
                                likelihood: { reasoning: '', sources: [] },
                                overall: { reasoning: '', sources: [] }
                            }
                        };
                        this.state.addRisk(riskWithJustifications);

                        // Add to table
                        this.addRiskToTable(riskWithJustifications);

                        // Brief pause to let user see the new row
                        await this.sleep(400);
                    }

                } catch (error) {
                    console.error(`Error generating risk ${i}:`, error);
                    // Continue with next risk instead of failing completely
                }
            }

            // Update final status
            this.dom.aiStatus.textContent = "Risk assessment complete!";
            this.dom.progressBar.style.width = '100%';
            this.state.updateApplicationState({ risksGenerated: true });

            // Show action buttons
            this.showRiskActionButtons();

        } catch (error) {
            console.error('Error generating risks:', error);
            this.showError('Failed to generate risks. Please try again.');
        }
    }

    /**
     * Generate additional risks
     * @param {number} numRisks - Number of additional risks to generate
     */
    async generateAdditionalRisks(numRisks = 3) {
        try {
            const eventData = this.state.getEventData();
            const existingRisks = this.state.getRiskData();
            const currentRiskCount = existingRisks.length;

            this.dom.generateMoreBtn.disabled = true;
            this.dom.generateMoreBtn.textContent = 'Generating...';

            // Generate additional risks
            const additionalRisks = await this.aiService.generateAdditionalRisks(
                eventData, 
                existingRisks, 
                numRisks
            );

            // Add each additional risk to the table
            for (const [index, risk] of additionalRisks.entries()) {
                const riskWithJustifications = {
                    ...risk,
                    id: currentRiskCount + index + 1,
                    justifications: {
                        risk: { reasoning: '', sources: [] },
                        impact: { reasoning: '', sources: [] },
                        likelihood: { reasoning: '', sources: [] },
                        overall: { reasoning: '', sources: [] }
                    }
                };
                
                this.state.addRisk(riskWithJustifications);
                this.addRiskToTable(riskWithJustifications);

                await this.sleep(300); // Brief pause between additions
            }

            console.log(`✅ Added ${additionalRisks.length} additional risks (continuing importance ranking from #${currentRiskCount + 1})`);

        } catch (error) {
            console.error('Error generating additional risks:', error);
            this.showError('Failed to generate additional risks. Please try again.');
        } finally {
            this.dom.generateMoreBtn.disabled = false;
            this.dom.generateMoreBtn.textContent = '+ Generate More Risks';
        }
    }

    /**
     * Add a custom risk
     * @param {Object} customRiskData - Custom risk data
     */
    addCustomRisk(customRiskData) {
        const currentRiskCount = this.state.getRiskData().length;
        
        const customRiskWithJustifications = {
            id: currentRiskCount + 1,
            risk: customRiskData.risk,
            category: customRiskData.category,
            impact: customRiskData.impact,
            likelihood: customRiskData.likelihood,
            mitigation: customRiskData.mitigation,
            justifications: {
                risk: { reasoning: '', sources: [] },
                impact: { reasoning: '', sources: [] },
                likelihood: { reasoning: '', sources: [] },
                overall: { reasoning: '', sources: [] }
            }
        };

        this.state.addRisk(customRiskWithJustifications);
        this.addRiskToTable(customRiskWithJustifications);
    }

    /**
     * Proceed to risk generation phase
     */
    async proceedToRiskGeneration() {
        this.dom.riskTableSection.classList.remove('hidden');
        this.dom.riskTableSection.classList.add('fade-in');
        this.dom.tableLoader.classList.remove('hidden');
        await this.sleep(500);
    }

    /**
     * Display RekonContext section
     */
    async displayRekonContext() {
        // Implementation for RekonContext display
        // This would include the logic for calculating and displaying context metrics
        this.dom.rekonContextSection.classList.remove('hidden');
    }

    /**
     * Show risk action buttons
     */
    showRiskActionButtons() {
        this.dom.acceptAllBtn.style.display = 'inline-block';
        this.dom.generateMoreBtn.style.display = 'inline-block';
        this.dom.addCustomRiskBtn.style.display = 'inline-block';
        this.dom.exportBtn.style.display = 'inline-block';
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        // Implementation for showing error messages
        console.error(message);
        alert(message); // Temporary - should be replaced with proper UI
    }

    /**
     * Add risk to table (placeholder - will be implemented in table management module)
     * @param {Object} risk - Risk object to add
     */
    addRiskToTable(risk) {
        // This will be implemented in the table management module
        console.log('Adding risk to table:', risk);
    }
}
