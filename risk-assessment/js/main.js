/**
 * aiRekon Risk Assessment Tool - Modular Main Entry Point (Test Version)
 */

console.log('🎯 aiRekon Risk Assessment Tool - Testing Modular Architecture');

// Test basic module loading
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Starting module tests...');

        // Test DOM Elements
        const { DOMElements } = await import('./modules/dom-elements.js');
        const domElements = new DOMElements();
        console.log('✅ DOM Elements module loaded successfully');

        // Test State Management
        const { StateManager } = await import('./modules/state-management.js');
        const stateManager = new StateManager();
        console.log('✅ State Management module loaded successfully');

        // Test Form Validation
        const { FormValidator } = await import('./modules/form-validation.js');
        const formValidator = new FormValidator(domElements);
        console.log('✅ Form Validation module loaded successfully');

        console.log('🎉 Basic modules loaded successfully! The modular architecture is working.');

        // Enable the generate button to show the form is ready
        if (domElements.generateBtn) {
            domElements.generateBtn.disabled = false;
            domElements.generateBtn.textContent = 'Modules Loaded Successfully';
        }

    } catch (error) {
        console.error('❌ Module loading failed:', error);
        alert('Module loading failed: ' + error.message);
    }
});
