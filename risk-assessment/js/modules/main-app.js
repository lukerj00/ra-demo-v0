/**
 * Main Application Module
 * Coordinates all modules and initializes the application
 */

import { DOMElements } from './dom-elements.js';
import { StateManager } from './state-management.js';
import { FormValidator } from './form-validation.js';
import { RiskGenerator } from './risk-generation.js';
import { TableManager } from './table-management.js';
import { PDFExporter } from './pdf-export.js';
import { JustificationPane } from './justification-pane.js';
import { HelpPane } from './help-pane.js';
import { EventHandlers } from './event-handlers.js';

export class RiskAssessmentApp {
    constructor() {
        this.modules = {};
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('🚀 Initializing aiRekon Risk Assessment Application...');

            // Initialize modules in dependency order
            await this.initializeModules();
            
            // Setup cross-module connections
            this.setupModuleConnections();
            
            // Initialize event handlers
            this.modules.eventHandlers.initialize();
            
            // Setup initial UI state
            this.setupInitialState();
            
            this.initialized = true;
            console.log('✅ Application initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        // Core modules (no dependencies)
        this.modules.domElements = new DOMElements();
        this.modules.stateManager = new StateManager();

        // Dependent modules
        this.modules.formValidator = new FormValidator(this.modules.domElements);
        this.modules.riskGenerator = new RiskGenerator(this.modules.domElements, this.modules.stateManager);
        this.modules.tableManager = new TableManager(this.modules.domElements, this.modules.stateManager);
        this.modules.pdfExporter = new PDFExporter(this.modules.domElements, this.modules.stateManager);
        this.modules.justificationPane = new JustificationPane(this.modules.domElements, this.modules.stateManager);
        this.modules.helpPane = new HelpPane(this.modules.domElements);

        // Event handlers (depends on all other modules)
        this.modules.eventHandlers = new EventHandlers(
            this.modules.domElements,
            this.modules.stateManager,
            this.modules.formValidator,
            this.modules.riskGenerator,
            this.modules.tableManager,
            this.modules.pdfExporter,
            this.modules.justificationPane,
            this.modules.helpPane
        );
    }

    /**
     * Setup connections between modules
     */
    setupModuleConnections() {
        // Connect risk generator to table manager
        this.modules.riskGenerator.addRiskToTable = (risk) => {
            this.modules.tableManager.addRiskToTable(risk);
        };

        // Connect table manager to justification pane
        this.modules.tableManager.openJustificationPane = (fieldName, fieldValue, riskId) => {
            this.modules.justificationPane.openJustificationPane(fieldName, fieldValue, riskId);
        };

        // Connect risk generator to justification pane for pre-generation
        this.modules.riskGenerator.preGenerateJustifications = (risk, eventData) => {
            // Temporarily disabled for refactoring
            // this.modules.justificationPane.preGenerateJustifications(risk, eventData);
        };
    }

    /**
     * Setup initial UI state
     */
    setupInitialState() {
        // Ensure screen 1 is visible, screen 2 is hidden
        this.modules.domElements.screen1.classList.remove('hidden');
        this.modules.domElements.screen2.classList.add('hidden');

        // Hide all secondary sections
        this.modules.domElements.summarySection.classList.add('hidden');
        this.modules.domElements.riskTableSection.classList.add('hidden');
        this.modules.domElements.justificationPane.classList.add('hidden');
        this.modules.domElements.helpPane.classList.add('hidden');
        this.modules.domElements.customRiskModal.classList.add('hidden');

        // Set initial progress
        this.modules.domElements.progressBar.style.width = '0%';
        this.modules.domElements.aiStatus.textContent = '';

        // Set up venue type functionality
        this.modules.formValidator.setupEventTypeChangeHandler((eventType) => {
            const venueTypes = this.modules.stateManager.getVenueTypesForEventType(eventType);
            this.modules.formValidator.updateVenueTypeOptions(eventType, venueTypes);
        });

        // Initialize venue types for default event type
        const defaultEventType = this.modules.domElements.eventTypeInput?.value;
        if (defaultEventType) {
            const venueTypes = this.modules.stateManager.getVenueTypesForEventType(defaultEventType);
            this.modules.formValidator.updateVenueTypeOptions(defaultEventType, venueTypes);
        }

        // Enable the generate button
        if (this.modules.domElements.generateBtn) {
            this.modules.domElements.generateBtn.disabled = false;
        }
    }

    /**
     * Show initialization error
     * @param {Error} error - Initialization error
     */
    showInitializationError(error) {
        const errorMessage = `
            <div class="fixed inset-0 bg-red-50 flex items-center justify-center z-50">
                <div class="bg-white p-8 rounded-lg shadow-lg max-w-md mx-4">
                    <div class="flex items-center mb-4">
                        <svg class="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h2 class="text-xl font-bold text-red-800">Initialization Error</h2>
                    </div>
                    <p class="text-red-700 mb-4">
                        Failed to initialize the Risk Assessment application. Please refresh the page and try again.
                    </p>
                    <p class="text-sm text-red-600 mb-4">
                        Error: ${error.message}
                    </p>
                    <button onclick="window.location.reload()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorMessage);
    }

    /**
     * Get module instance
     * @param {string} moduleName - Name of the module
     * @returns {Object} Module instance
     */
    getModule(moduleName) {
        return this.modules[moduleName];
    }

    /**
     * Check if application is initialized
     * @returns {boolean} True if initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get application state for debugging
     * @returns {Object} Application state
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            modules: Object.keys(this.modules),
            state: this.modules.stateManager?.exportState(),
            domElementsCount: Object.keys(this.modules.domElements || {}).length
        };
    }

    /**
     * Cleanup application (for testing or reinitialization)
     */
    cleanup() {
        // Reset state
        if (this.modules.stateManager) {
            this.modules.stateManager.reset();
        }

        // Clear table
        if (this.modules.tableManager) {
            this.modules.tableManager.clearTable();
        }

        // Close panes
        if (this.modules.justificationPane) {
            this.modules.justificationPane.closeJustificationPane();
        }
        
        if (this.modules.helpPane) {
            this.modules.helpPane.closeHelpPane();
        }

        // Reset form
        if (this.modules.formValidator) {
            this.modules.formValidator.resetForm();
        }

        // Reset UI state
        this.setupInitialState();

        console.log('🧹 Application cleaned up');
    }

    /**
     * Restart application
     */
    async restart() {
        this.cleanup();
        await this.initialize();
    }
}

// Global application instance
window.riskAssessmentApp = null;

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for AI service to be available
        let attempts = 0;
        while (!window.aiService && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.aiService) {
            throw new Error('AI Service not available');
        }

        // Create and initialize the application
        window.riskAssessmentApp = new RiskAssessmentApp();
        await window.riskAssessmentApp.initialize();

        // Make it available for debugging
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🔧 Debug mode: window.riskAssessmentApp available for debugging');
            console.log('📊 Debug info:', window.riskAssessmentApp.getDebugInfo());
        }

    } catch (error) {
        console.error('❌ Failed to start application:', error);
    }
});

// Export for module usage
export default RiskAssessmentApp;
