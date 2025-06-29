/**
 * Event Handlers Module
 * Handles event listener setup and management
 */

import { VENUE_TYPE_OPTIONS } from './constants.js';
import { sleep } from './utils.js';

export class EventHandlers {
    constructor(domElements, stateManager, uiManager, formValidator, riskGenerator, tableManager, justificationManager, metricsManager, pdfExporter) {
        this.dom = domElements;
        this.state = stateManager;
        this.ui = uiManager;
        this.formValidator = formValidator;
        this.riskGenerator = riskGenerator;
        this.tableManager = tableManager;
        this.justificationManager = justificationManager;
        this.metricsManager = metricsManager;
        this.pdfExporter = pdfExporter;
    }

    /**
     * Initialize all event handlers
     */
    initializeEventHandlers() {
        this.setupFormValidation();
        this.setupFormSubmission();
        this.setupNavigationHandlers();
        this.setupSummaryHandlers();
        this.setupRiskTableHandlers();
        this.setupJustificationHandlers();
        this.setupModalHandlers();
        this.setupFileUploadHandlers();
        this.setupHelpPaneHandlers();
        this.setupExportHandler();
    }

    /**
     * Setup form validation handlers
     */
    setupFormValidation() {
        const inputs = this.dom.getFormInputs();

        // Add validation listeners to all form inputs
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('change', () => this.validateForm());
        });

        // Event type change handler for venue type population
        inputs.eventType.addEventListener('change', (e) => {
            this.handleEventTypeChange(e.target.value);
        });
    }

    /**
     * Validate form and update generate button state
     */
    validateForm() {
        const inputs = this.dom.getFormInputs();
        
        const requiredFields = [
            inputs.eventTitle.value.trim(),
            inputs.eventDate.value,
            inputs.location.value.trim(),
            inputs.attendance.value,
            inputs.eventType.value
        ];

        // Only require venue type if event type is selected and venue options are available
        if (inputs.eventType.value && inputs.venueType.options.length > 1) {
            requiredFields.push(inputs.venueType.value);
        }

        this.dom.generateBtn.disabled = !requiredFields.every(field => field);
    }

    /**
     * Handle event type change
     * @param {string} selectedEventType - Selected event type
     */
    handleEventTypeChange(selectedEventType) {
        const venueTypeInput = this.dom.venueTypeInput;

        venueTypeInput.innerHTML = '';

        if (selectedEventType && VENUE_TYPE_OPTIONS[selectedEventType]) {
            const defaultOption = document.createElement('option');
            defaultOption.textContent = 'Select Venue Type';
            defaultOption.value = '';
            venueTypeInput.appendChild(defaultOption);

            VENUE_TYPE_OPTIONS[selectedEventType].forEach(type => {
                const option = document.createElement('option');
                option.textContent = type;
                option.value = type;
                venueTypeInput.appendChild(option);
            });
        } else {
            const defaultOption = document.createElement('option');
            defaultOption.textContent = 'Select Event Type first';
            defaultOption.value = '';
            venueTypeInput.appendChild(defaultOption);
        }

        // Re-validate form after venue type options change
        this.validateForm();
    }

    /**
     * Setup form submission handler
     */
    setupFormSubmission() {
        this.dom.generateBtn.addEventListener('click', async () => {
            if (!this.formValidator.validateForm()) {
                return;
            }

            const eventData = this.formValidator.getFormData();
            console.log('🔍 Form data collected:', eventData);
            await this.startGeneration(eventData);
        });
    }

    /**
     * Start the risk assessment generation process
     * @param {Object} eventData - Event data from form
     */
    async startGeneration(eventData) {
        try {
            // Set project name and update UI
            this.state.setProjectName(eventData.eventTitle);
            this.ui.showScreen2();
            
            const eventDateFormatted = eventData.eventDate ? 
                new Date(eventData.eventDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) : 'N/A';
            
            this.ui.setReportTitle(`Risk Assessment Report for: ${eventData.eventTitle} on ${eventDateFormatted}`);
            
            // Update state
            this.state.updateApplicationState({
                currentStep: 'generating',
                eventData: { ...eventData, eventDate: eventDateFormatted }
            });

            // Populate event card
            this.ui.populateEventCard({ ...eventData, eventDate: eventDateFormatted });
            this.ui.resetScreen2();

            // Start generation process
            await this.generateSummary(eventData);
            
        } catch (error) {
            console.error('Error in generation process:', error);
            this.ui.showError('Failed to generate risk assessment. Please try again.');
        }
    }

    /**
     * Generate contextual summary
     * @param {Object} eventData - Event data
     */
    async generateSummary(eventData) {
        try {
            console.log('🔍 Event data being sent to AI service:', eventData);

            // Check if AI service is available
            if (!window.aiService) {
                throw new Error('AI service not available on window object');
            }

            if (!window.aiService.isConfigured()) {
                throw new Error('AI service not configured');
            }

            this.ui.updateStatus("AI is generating contextual summary...");
            this.ui.updateProgress(10);

            // Show summary section with loading
            this.ui.showSummaryLoading();
            this.ui.updateStatus("AI is generating overview...");
            this.ui.updateProgress(15);

            // Generate first paragraph
            const paragraph1 = await window.aiService.generateOverviewParagraph(eventData);
            this.ui.updateSummaryFirstParagraph(paragraph1);

            await sleep(800);

            // Generate second paragraph
            this.ui.updateStatus("AI is generating operational considerations...");
            this.ui.showSecondParagraphLoading(paragraph1);
            this.ui.updateProgress(25);

            const paragraph2 = await window.aiService.generateOperationalParagraph(eventData);
            this.ui.updateSummaryBothParagraphs(paragraph1, paragraph2);

            // Update state and show actions
            this.state.updateApplicationState({ summaryGenerated: true });
            this.ui.showSummaryActions();

            // Display RekonContext
            await this.metricsManager.displayRekonContext();
            this.ui.updateProgress(30);
            this.ui.updateStatus("Contextual summary generated. Awaiting review...");

        } catch (error) {
            console.error('Error generating summary:', error);
            this.ui.showError('Failed to generate summary. Please check your API key and try again.');
        }
    }

    /**
     * Setup navigation handlers
     */
    setupNavigationHandlers() {
        this.dom.goBackBtn.addEventListener('click', () => {
            this.ui.showScreen1();
            this.ui.resetScreen2();
        });
    }

    /**
     * Setup summary action handlers
     */
    setupSummaryHandlers() {
        this.dom.acceptSummaryBtn.addEventListener('click', async () => {
            this.dom.summaryContent.classList.remove('table-cell-editing');
            this.dom.summaryContent.contentEditable = false;
            this.dom.acceptSummaryBtn.innerHTML = '✔ Accepted';
            this.dom.acceptSummaryBtn.disabled = true;
            this.dom.editSummaryBtn.classList.add('hidden');
            this.dom.saveSummaryBtn.classList.add('hidden');

            await this.proceedToRiskGeneration();
        });

        this.dom.editSummaryBtn.addEventListener('click', () => {
            this.dom.summaryContent.contentEditable = true;
            this.dom.summaryContent.classList.add('table-cell-editing');
            this.dom.summaryContent.focus();
            this.dom.editSummaryBtn.classList.add('hidden');
            this.dom.saveSummaryBtn.classList.remove('hidden');
        });

        this.dom.saveSummaryBtn.addEventListener('click', () => {
            // Clear stored justification since summary was edited
            this.state.updateApplicationState({ summaryJustification: null });

            this.dom.summaryContent.contentEditable = false;
            this.dom.summaryContent.classList.remove('table-cell-editing');
            this.dom.editSummaryBtn.classList.remove('hidden');
            this.dom.saveSummaryBtn.classList.add('hidden');
        });
    }

    /**
     * Proceed to risk generation phase
     */
    async proceedToRiskGeneration() {
        this.ui.showRiskTableSection();
        this.ui.updateStatus("AI is analyzing risks...");

        try {
            this.ui.updateProgress(40);
            const eventData = this.state.getEventData();

            // Start risk conversation
            this.ui.updateStatus("AI is analyzing event for critical risks...");
            const conversationId = await window.aiService.startRiskConversation(eventData);
            this.state.setConversationId(conversationId);
            console.log(`🤖 Started risk conversation: ${conversationId}`);

            // Generate risks progressively
            const totalRisks = 6;
            for (let i = 1; i <= totalRisks; i++) {
                const progress = 30 + (i / totalRisks) * 60; // 30% to 90%
                this.ui.updateProgress(progress);
                this.ui.updateStatus(`AI is identifying risks...`);

                try {
                    const risk = await window.aiService.generateNextRisk(conversationId, i);
                    
                    // Add risk with justification placeholders
                    const riskWithJustifications = {
                        ...risk,
                        justifications: {
                            risk: null,
                            category: null,
                            impact: null,
                            likelihood: null,
                            mitigation: null,
                            overall: null
                        }
                    };
                    
                    this.state.addRisk(riskWithJustifications);
                    this.tableManager.addRiskRow(riskWithJustifications);

                    await sleep(400);

                } catch (error) {
                    console.error(`Error generating risk ${i}:`, error);
                }
            }

            this.ui.hideRiskTableLoader();
            this.state.updateApplicationState({
                risksGenerated: true,
                currentStep: 'review'
            });

            this.ui.updateProgress(90);
            this.ui.updateStatus("AI risk analysis complete. Please review and accept risks.");
            this.dom.exportBtn.disabled = true;

            if (this.state.getRiskData().length > 0) {
                this.ui.showAcceptAllContainer();
            }

        } catch (error) {
            console.error('Error generating AI risks:', error);
            this.ui.hideRiskTableLoader();
            this.ui.updateStatus("Error generating risks. Please try again.");
            alert('Failed to generate AI risk assessment: ' + error.message);
        }
    }

    /**
     * Setup risk table handlers
     */
    setupRiskTableHandlers() {
        // Table row actions
        this.dom.riskTableBody.addEventListener('click', async (e) => {
            // Handle justification icon clicks
            const justificationHandled = this.tableManager.handleJustificationClick(e, 
                (fieldName, fieldValue, reasoning, sources, riskData) => {
                    this.justificationManager.handleJustificationRequest(fieldName, fieldValue, reasoning, sources, riskData);
                });

            if (justificationHandled) return;

            // Handle row actions
            await this.tableManager.handleRowAction(e, () => this.checkAndDisplayMetrics());
        });

        // Accept all risks
        this.dom.acceptAllBtn.addEventListener('click', async () => {
            await this.tableManager.acceptAllRisks(() => this.checkAndDisplayMetrics());
        });

        // Generate more risks
        this.dom.generateMoreBtn.addEventListener('click', async () => {
            await this.generateMoreRisks();
        });

        // Add custom risk
        this.dom.addCustomRiskBtn.addEventListener('click', () => {
            this.dom.customRiskModal.classList.remove('hidden');
        });
    }

    /**
     * Generate additional risks
     */
    async generateMoreRisks() {
        const conversationId = this.state.getConversationId();
        if (!conversationId) {
            alert('No active conversation found. Please generate initial risks first.');
            return;
        }

        this.dom.generateMoreBtn.disabled = true;
        this.dom.generateMoreBtn.textContent = 'Generating...';

        try {
            const eventData = this.state.getEventData();
            const existingRisks = this.state.getRiskData();

            const additionalRisks = await window.aiService.generateAdditionalRisks(
                conversationId,
                existingRisks,
                3
            );

            for (const risk of additionalRisks) {
                const riskWithJustifications = {
                    ...risk,
                    justifications: {
                        risk: null,
                        category: null,
                        impact: null,
                        likelihood: null,
                        mitigation: null,
                        overall: null
                    }
                };
                
                this.state.addRisk(riskWithJustifications);
                this.tableManager.addRiskRow(riskWithJustifications);
                await sleep(300);
            }

            console.log(`✅ Added ${additionalRisks.length} additional risks`);
        } catch (error) {
            console.error('Error generating additional risks:', error);
            alert('Failed to generate additional risks. Please try again.');
        } finally {
            this.dom.generateMoreBtn.disabled = false;
            this.dom.generateMoreBtn.textContent = '+ Generate More Risks';
        }
    }

    /**
     * Check if all risks are accepted and display metrics
     */
    async checkAndDisplayMetrics() {
        await this.tableManager.checkAndDisplayMetrics(() => this.metricsManager.displayRekonMetrics());
    }

    /**
     * Setup justification handlers
     */
    setupJustificationHandlers() {
        // Summary justification icon
        this.dom.summaryJustificationIcon.addEventListener('click', async () => {
            await this.justificationManager.generateSummaryJustification();
        });

        // Close justification pane
        if (this.dom.closeJustificationPaneBtn) {
            this.dom.closeJustificationPaneBtn.addEventListener('click', () => {
                this.justificationManager.hideJustificationPane();
            });
        }
    }

    /**
     * Setup modal handlers
     */
    setupModalHandlers() {
        // Custom risk modal
        this.dom.closeCustomRiskModal.addEventListener('click', () => {
            this.dom.customRiskModal.classList.add('hidden');
            this.dom.customRiskForm.reset();
        });

        this.dom.cancelCustomRisk.addEventListener('click', () => {
            this.dom.customRiskModal.classList.add('hidden');
            this.dom.customRiskForm.reset();
        });

        this.dom.customRiskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!this.formValidator.validateCustomRiskForm()) {
                return;
            }

            const customRiskData = this.formValidator.getCustomRiskData();
            const currentRiskCount = this.state.getRiskData().length;
            
            const customRisk = {
                id: currentRiskCount + 1,
                ...customRiskData,
                justifications: {
                    risk: null,
                    category: null,
                    impact: null,
                    likelihood: null,
                    mitigation: null,
                    overall: null
                }
            };

            this.state.addRisk(customRisk);
            this.tableManager.addRiskRow(customRisk);

            this.dom.customRiskModal.classList.add('hidden');
            this.dom.customRiskForm.reset();

            console.log('✅ Added custom risk:', customRisk.risk);
        });

        // Close modal when clicking outside
        this.dom.customRiskModal.addEventListener('click', (e) => {
            if (e.target === this.dom.customRiskModal) {
                this.dom.customRiskModal.classList.add('hidden');
                this.dom.customRiskForm.reset();
            }
        });
    }

    /**
     * Setup file upload handlers
     */
    setupFileUploadHandlers() {
        const dropZone = this.dom.dropZone;
        const fileUpload = this.dom.fileUpload;
        const fileList = this.dom.fileList;

        const handleFiles = (files) => {
            fileList.innerHTML = '';
            for (const file of files) {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'flex items-center justify-between bg-zinc-100 p-2 rounded-md text-sm';
                fileDiv.innerHTML = `
                    <span>${file.name}</span>
                    <button class="text-red-500 hover:text-red-700">&times;</button>
                `;
                fileDiv.querySelector('button').onclick = () => fileDiv.remove();
                fileList.appendChild(fileDiv);
            }
        };

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { 
                e.preventDefault(); 
                dropZone.classList.add('border-blue-500', 'bg-blue-50'); 
            });
            dropZone.addEventListener('dragleave', (e) => { 
                e.preventDefault(); 
                dropZone.classList.remove('border-blue-500', 'bg-blue-50'); 
            });
            dropZone.addEventListener('drop', (e) => { 
                e.preventDefault(); 
                dropZone.classList.remove('border-blue-500', 'bg-blue-50'); 
                handleFiles(e.dataTransfer.files); 
            });
        }

        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => handleFiles(e.target.files));
        }
    }

    /**
     * Setup help pane handlers
     */
    setupHelpPaneHandlers() {
        if (this.dom.helpIconBtn) {
            this.dom.helpIconBtn.addEventListener('click', () => {
                this.dom.helpPane.classList.remove('hidden');
                setTimeout(() => {
                    this.dom.helpPane.style.transform = 'translateX(0)';
                }, 10);
            });
        }

        if (this.dom.closeHelpPaneBtn) {
            this.dom.closeHelpPaneBtn.addEventListener('click', () => {
                this.dom.helpPane.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    this.dom.helpPane.classList.add('hidden');
                }, 300);
            });
        }
    }

    /**
     * Setup export handler
     */
    setupExportHandler() {
        this.dom.exportBtn.addEventListener('click', async () => {
            await this.pdfExporter.exportToPDF();
        });
    }
}
