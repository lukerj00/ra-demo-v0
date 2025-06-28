/**
 * API Configuration
 * Loads OpenAI API key from .env file
 */

// Auto-initialize AI service when this file loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load environment variables
        await window.envLoader.load();

        // Get API key from environment
        const apiKey = window.envLoader.get('OPENAI_API_KEY');

        if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
            if (window.aiService) {
                window.aiService.initialize(apiKey);
                console.log('AI Service initialized with API key from .env file');
            }
        } else {
            console.warn('Please set your OpenAI API key in .env file');
        }
    } catch (error) {
        console.error('Failed to load API configuration:', error);
        console.warn('Please ensure .env file exists');
    }
});
