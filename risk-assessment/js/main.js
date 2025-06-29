/**
 * aiRekon Risk Assessment Tool - Modular Main Entry Point
 *
 * This file loads the modular application architecture.
 * The original monolithic main.js has been refactored into focused modules:
 *
 * - dom-elements.js: DOM element references
 * - state-management.js: Application state management
 * - form-validation.js: Form validation and input handling
 * - risk-generation.js: AI-powered risk generation
 * - table-management.js: Risk table display and interactions
 * - pdf-export.js: PDF generation functionality
 * - justification-pane.js: Justification panel logic
 * - help-pane.js: Help panel functionality
 * - event-handlers.js: Event listeners and UI interactions
 * - main-app.js: Application coordination and initialization
 */

// Import the main application module
import RiskAssessmentApp from './modules/main-app.js';

// The application will be automatically initialized when the DOM is ready
// via the DOMContentLoaded event listener in main-app.js

console.log('🎯 aiRekon Risk Assessment Tool - Modular Architecture Loaded');
console.log('📦 Modules: DOM Elements, State Management, Form Validation, Risk Generation, Table Management, PDF Export, Justification Pane, Help Pane, Event Handlers');
console.log('🔄 Refactored from monolithic 1931-line file to focused, maintainable modules');

// Export for potential external usage
export default RiskAssessmentApp;
