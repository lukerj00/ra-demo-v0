/**
 * Main Application Entry Point
 * Modularized Risk Assessment Application
 */

// Import all modules
import { DOMElements } from './modules/dom-elements.js';
import { StateManager } from './modules/state-management.js';
import { FormValidator } from './modules/form-validation.js';
import { UIManager } from './modules/ui-manager.js';
import { TableManager } from './modules/table-manager.js';
import { JustificationManager } from './modules/justification-manager.js';
import { MetricsManager } from './modules/metrics-manager.js';
import { PDFExporter } from './modules/pdf-exporter.js';
import { EventHandlers } from './modules/event-handlers.js';
import { debugState, preloadLogo } from './modules/utils.js';

const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Main.js loaded - initializing modular application...');

    try {
        // Test if modules are available
        console.log('🔍 Testing module availability:', {
            DOMElements: typeof DOMElements,
            StateManager: typeof StateManager,
            FormValidator: typeof FormValidator,
            UIManager: typeof UIManager,
            TableManager: typeof TableManager,
            JustificationManager: typeof JustificationManager,
            MetricsManager: typeof MetricsManager,
            PDFExporter: typeof PDFExporter,
            EventHandlers: typeof EventHandlers
        });

        // Initialize all modules
        const domElements = new DOMElements();
        const stateManager = new StateManager();
        const formValidator = new FormValidator(domElements);
        const uiManager = new UIManager(domElements, stateManager);
        const tableManager = new TableManager(domElements, stateManager);
        const justificationManager = new JustificationManager(domElements, stateManager);
        const metricsManager = new MetricsManager(domElements, stateManager, uiManager);
        const pdfExporter = new PDFExporter(domElements, stateManager, metricsManager);

        console.log('✅ All modules initialized successfully');
    
    // Initialize event handlers with all dependencies
    const eventHandlers = new EventHandlers(
        domElements,
        stateManager,
        uiManager,
        formValidator,
        null, // riskGenerator - not needed in new structure
        tableManager,
        justificationManager,
        metricsManager,
        pdfExporter
    );

    // Setup all event handlers
    eventHandlers.initializeEventHandlers();

    // Make debug function available globally for testing
    window.debugRiskAssessment = () => debugState(stateManager.getApplicationState(), stateManager.getRiskData());

        // Preload logo for PDF export
        preloadLogo()
            .then(logoBase64 => {
                stateManager.setLogoBase64(logoBase64);
                console.log('✅ Logo preloaded successfully');
            })
            .catch(err => {
                console.warn("Initial logo preload failed, will retry on export:", err);
            });

    } catch (error) {
        console.error('❌ Error initializing modular application:', error);

        // Fallback: Set up basic venue type functionality
        console.log('🔄 Setting up fallback venue type functionality...');
        const eventTypeInput = document.getElementById('eventType');
        const venueTypeInput = document.getElementById('venueType');

        const venueTypeOptions = {
            'Music': ['Outdoor Festival', 'Indoor Concert', 'Nightclub Event', 'Arena Tour', 'Album Launch Party'],
            'Community': ['Street Fair / Fete', 'Charity Fundraiser', 'Local Market', 'Public Rally / Protest', 'Cultural Festival'],
            'State': ['Official Public Ceremony', 'VIP Visit / Dignitary Protection', 'Political Conference', 'National Day Parade', 'State Funeral'],
            'Sport': ['Stadium Match (e.g., Football, Rugby)', 'Marathon / Running Event', 'Motorsport Race', 'Combat Sports Night (e.g., Boxing, MMA)', 'Golf Tournament'],
            'Other': ['Corporate Conference', 'Private Party / Wedding', 'Film Premiere', 'Exhibition / Trade Show', 'Product Launch']
        };

        if (eventTypeInput && venueTypeInput) {
            eventTypeInput.addEventListener('change', (e) => {
                const selectedEventType = e.target.value;
                venueTypeInput.innerHTML = '';

                if (selectedEventType && venueTypeOptions[selectedEventType]) {
                    const defaultOption = document.createElement('option');
                    defaultOption.textContent = 'Select Venue Type';
                    defaultOption.value = '';
                    venueTypeInput.appendChild(defaultOption);

                    venueTypeOptions[selectedEventType].forEach(type => {
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
            });
            console.log('✅ Fallback venue type functionality set up');
        }

        // Fallback: Set up basic form submission
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                alert('⚠️ Modular application failed to load. Please refresh the page and try again.');
            });
        }
    }
});
