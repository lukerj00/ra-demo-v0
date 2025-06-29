/**
 * Event Handlers Module
 * Centralizes all event listeners and UI interactions
 */

export class EventHandlers {
    constructor(domElements, stateManager, formValidator, riskGenerator, tableManager, pdfExporter, justificationPane, helpPane) {
        this.dom = domElements;
        this.state = stateManager;
        this.formValidator = formValidator;
        this.riskGenerator = riskGenerator;
        this.tableManager = tableManager;
        this.pdfExporter = pdfExporter;
        this.justificationPane = justificationPane;
        this.helpPane = helpPane;
    }

    /**
     * Setup all event listeners
     */
    setupAllEventListeners() {
        this.setupFormEventListeners();
        this.setupNavigationEventListeners();
        this.setupSummaryEventListeners();
        this.setupRiskTableEventListeners();
        this.setupCustomRiskModalEventListeners();
        this.setupModuleEventListeners();
    }

    /**
     * Setup form event listeners
     */
    setupFormEventListeners() {
        // Generate button
        if (this.dom.generateBtn) {
            this.dom.generateBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleGenerateRiskAssessment();
            });
        }

        // Form submission
        if (this.dom.setupForm) {
            this.dom.setupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleGenerateRiskAssessment();
            });
        }

        // Event type change handler
        this.formValidator.setupEventTypeChangeHandler((eventType) => {
            const venueTypes = this.state.getVenueTypesForEventType(eventType);
            this.formValidator.updateVenueTypeOptions(eventType, venueTypes);
        });
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigationEventListeners() {
        // Go back button
        if (this.dom.goBackBtn) {
            this.dom.goBackBtn.addEventListener('click', () => {
                this.handleGoBack();
            });
        }
    }

    /**
     * Setup summary section event listeners
     */
    setupSummaryEventListeners() {
        // Accept summary button
        this.dom.acceptSummaryBtn.addEventListener('click', () => {
            this.handleAcceptSummary();
        });

        // Edit summary button
        this.dom.editSummaryBtn.addEventListener('click', () => {
            this.handleEditSummary();
        });

        // Save summary button
        this.dom.saveSummaryBtn.addEventListener('click', () => {
            this.handleSaveSummary();
        });
    }

    /**
     * Setup risk table event listeners
     */
    setupRiskTableEventListeners() {
        // Generate more risks button
        this.dom.generateMoreBtn.addEventListener('click', async () => {
            await this.handleGenerateMoreRisks();
        });

        // Add custom risk button
        this.dom.addCustomRiskBtn.addEventListener('click', () => {
            this.handleAddCustomRisk();
        });
    }

    /**
     * Setup custom risk modal event listeners
     */
    setupCustomRiskModalEventListeners() {
        // Close modal button
        this.dom.closeCustomRiskModal.addEventListener('click', () => {
            this.handleCloseCustomRiskModal();
        });

        // Cancel button
        this.dom.cancelCustomRisk.addEventListener('click', () => {
            this.handleCloseCustomRiskModal();
        });

        // Form submission
        this.dom.customRiskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmitCustomRisk();
        });

        // Close on backdrop click
        this.dom.customRiskModal.addEventListener('click', (e) => {
            if (e.target === this.dom.customRiskModal) {
                this.handleCloseCustomRiskModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.dom.customRiskModal.classList.contains('hidden')) {
                this.handleCloseCustomRiskModal();
            }
        });
    }

    /**
     * Setup module-specific event listeners
     */
    setupModuleEventListeners() {
        // Table manager events
        this.tableManager.setupEventListeners();

        // PDF exporter events
        this.pdfExporter.setupEventListeners();

        // Justification pane events
        this.justificationPane.setupEventListeners();

        // Help pane events
        this.helpPane.setupEventListeners();
    }

    /**
     * Handle generate risk assessment
     */
    async handleGenerateRiskAssessment() {
        if (!this.formValidator.validateForm()) {
            return;
        }

        this.formValidator.hideValidationError();
        const eventData = this.formValidator.getFormData();
        
        // Populate event card
        this.formValidator.populateEventCard(eventData);

        // Start risk generation
        await this.riskGenerator.startGeneration(eventData);
    }

    /**
     * Handle go back to form
     */
    handleGoBack() {
        // Show screen 1, hide screen 2
        this.dom.screen2.classList.add('hidden');
        this.dom.screen1.classList.remove('hidden');

        // Reset state
        this.state.reset();
        this.tableManager.clearTable();
        this.justificationPane.clearJustifications();

        // Reset form
        this.formValidator.resetForm();

        // Reset progress
        this.dom.progressBar.style.width = '0%';
        this.dom.aiStatus.textContent = '';
    }

    /**
     * Handle accept summary
     */
    handleAcceptSummary() {
        this.dom.acceptSummaryBtn.style.display = 'none';
        this.dom.editSummaryBtn.style.display = 'inline-block';
        this.dom.summaryContent.classList.add('accepted');
    }

    /**
     * Handle edit summary
     */
    handleEditSummary() {
        this.dom.summaryContent.contentEditable = true;
        this.dom.summaryContent.focus();
        this.dom.editSummaryBtn.style.display = 'none';
        this.dom.saveSummaryBtn.style.display = 'inline-block';
        this.dom.summaryContent.classList.add('editing');
    }

    /**
     * Handle save summary
     */
    handleSaveSummary() {
        this.dom.summaryContent.contentEditable = false;
        this.dom.saveSummaryBtn.style.display = 'none';
        this.dom.editSummaryBtn.style.display = 'inline-block';
        this.dom.summaryContent.classList.remove('editing');
        this.dom.summaryContent.classList.add('accepted');
    }

    /**
     * Handle generate more risks
     */
    async handleGenerateMoreRisks() {
        await this.riskGenerator.generateAdditionalRisks(3);
    }

    /**
     * Handle add custom risk
     */
    handleAddCustomRisk() {
        this.dom.customRiskModal.classList.remove('hidden');
        this.formValidator.resetCustomRiskForm();
    }

    /**
     * Handle close custom risk modal
     */
    handleCloseCustomRiskModal() {
        this.dom.customRiskModal.classList.add('hidden');
        this.formValidator.resetCustomRiskForm();
    }

    /**
     * Handle submit custom risk
     */
    handleSubmitCustomRisk() {
        if (!this.formValidator.validateCustomRiskForm()) {
            return;
        }

        const customRiskData = this.formValidator.getCustomRiskData();
        this.riskGenerator.addCustomRisk(customRiskData);
        this.handleCloseCustomRiskModal();
    }

    /**
     * Setup global keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to generate (when on form)
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !this.dom.screen1.classList.contains('hidden')) {
                e.preventDefault();
                this.handleGenerateRiskAssessment();
            }

            // Ctrl/Cmd + E to export PDF (when on results screen)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !this.dom.screen2.classList.contains('hidden')) {
                e.preventDefault();
                this.pdfExporter.exportToPDF();
            }

            // Ctrl/Cmd + B to go back (when on results screen)
            if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !this.dom.screen2.classList.contains('hidden')) {
                e.preventDefault();
                this.handleGoBack();
            }
        });
    }

    /**
     * Setup window event listeners
     */
    setupWindowEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            // Handle responsive adjustments if needed
        });

        // Handle before unload (warn about unsaved changes)
        window.addEventListener('beforeunload', (e) => {
            const hasUnsavedData = this.state.getRiskData().length > 0;
            if (hasUnsavedData) {
                e.preventDefault();
                e.returnValue = 'You have unsaved risk assessment data. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Initialize all event listeners
     */
    initialize() {
        this.setupAllEventListeners();
        this.setupKeyboardShortcuts();
        this.setupWindowEventListeners();
    }
}
