/**
 * API Configuration Example
 * Copy this file to api-config.local.js and add your actual API key
 */

// IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual OpenAI API key
const API_CONFIG = {
    OPENAI_API_KEY: 'YOUR_API_KEY_HERE'
};

// Auto-initialize AI service when this file loads
document.addEventListener('DOMContentLoaded', () => {
    if (API_CONFIG.OPENAI_API_KEY && API_CONFIG.OPENAI_API_KEY !== 'YOUR_API_KEY_HERE') {
        if (window.aiService) {
            window.aiService.initialize(API_CONFIG.OPENAI_API_KEY);
            console.log('AI Service initialized with API key');
        }
    } else {
        console.warn('Please set your OpenAI API key in js/api-config.local.js');
    }
});
