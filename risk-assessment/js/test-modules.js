/**
 * Test script to verify modular architecture is working
 */

// Test DOM Elements
try {
    const { DOMElements } = await import('./modules/dom-elements.js');
    const domElements = new DOMElements();
    console.log('✅ DOM Elements module loaded successfully');
} catch (error) {
    console.error('❌ DOM Elements module failed:', error);
}

// Test State Management
try {
    const { StateManager } = await import('./modules/state-management.js');
    const stateManager = new StateManager();
    console.log('✅ State Management module loaded successfully');
} catch (error) {
    console.error('❌ State Management module failed:', error);
}

// Test Form Validation
try {
    const { FormValidator } = await import('./modules/form-validation.js');
    const { DOMElements } = await import('./modules/dom-elements.js');
    const domElements = new DOMElements();
    const formValidator = new FormValidator(domElements);
    console.log('✅ Form Validation module loaded successfully');
} catch (error) {
    console.error('❌ Form Validation module failed:', error);
}

console.log('🧪 Module testing complete');
