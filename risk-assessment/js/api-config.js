/**
 * API Configuration
 * Initializes AI service to use backend API
 */

// Auto-initialize AI service when this file loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 API Config: Starting backend initialization...');

    try {
        if (window.aiService) {
            console.log('🔧 API Config: aiService found, initializing for backend...');
            window.aiService.initialize();
            console.log('✅ AI Service initialized for backend communication');

            // Verify it's actually configured
            if (window.aiService.isConfigured()) {
                console.log('✅ AI Service configuration verified');
            } else {
                console.error('❌ AI Service failed to configure properly');
            }
        } else {
            console.error('❌ API Config: aiService not found on window object');
        }
    } catch (error) {
        console.error('❌ API Config: Failed to initialize AI service:', error);
    }
});
