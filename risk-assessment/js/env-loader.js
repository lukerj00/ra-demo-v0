/**
 * Environment Variable Loader for Frontend
 * Loads environment variables from .env file or prompts user
 */

class EnvLoader {
    constructor() {
        this.env = {};
        this.loaded = false;
    }

    /**
     * Load environment variables from .env file
     * @returns {Promise<Object>}
     */
    async load() {
        console.log('🔍 EnvLoader: Starting to load environment variables...');

        if (this.loaded) {
            console.log('🔍 EnvLoader: Already loaded, returning cached env:', this.env);
            return this.env;
        }

        try {
            // Try multiple possible paths for .env file
            let response;
            let successfulPath = null;
            const possiblePaths = ['../.env', '.env', '/.env'];

            console.log('🔍 EnvLoader: Trying paths:', possiblePaths);

            for (const path of possiblePaths) {
                try {
                    console.log(`🔍 EnvLoader: Attempting to fetch: ${path}`);
                    response = await fetch(path);
                    console.log(`🔍 EnvLoader: Response for ${path}:`, {
                        ok: response.ok,
                        status: response.status,
                        statusText: response.statusText
                    });

                    if (response.ok) {
                        successfulPath = path;
                        break;
                    }
                } catch (e) {
                    console.log(`🔍 EnvLoader: Error fetching ${path}:`, e.message);
                    continue;
                }
            }

            if (!response || !response.ok) {
                console.warn('❌ EnvLoader: Cannot load .env file via HTTP (CORS restriction)');
                console.warn('🔍 EnvLoader: Prompting user for API key...');

                // Prompt user for API key as fallback
                const apiKey = prompt(
                    'Please enter your OpenAI API key:\n\n' +
                    'This is needed because browsers block direct file access.\n' +
                    'Your key will only be stored in memory for this session.\n\n' +
                    'API Key:'
                );

                if (apiKey && apiKey.trim() && apiKey.startsWith('sk-')) {
                    this.env.OPENAI_API_KEY = apiKey.trim();
                    console.log('✅ EnvLoader: API key provided via prompt');
                } else {
                    console.warn('❌ EnvLoader: No valid API key provided');
                }

                this.loaded = true;
                return this.env;
            }

            console.log(`✅ EnvLoader: Successfully loaded from: ${successfulPath}`);
            const envText = await response.text();
            console.log('🔍 EnvLoader: Raw .env content:', envText);

            this.parseEnvText(envText);
            this.loaded = true;

            console.log('✅ EnvLoader: Parsed environment variables:', this.env);
            console.log('🔍 EnvLoader: API key found:', this.env.OPENAI_API_KEY ? 'YES' : 'NO');

            return this.env;

        } catch (error) {
            console.error('❌ EnvLoader: Failed to load .env file:', error);
            console.warn('💡 This is expected when opening HTML files directly in browser');
            this.loaded = true;
            return this.env;
        }
    }

    /**
     * Parse .env file content
     * @param {string} envText 
     */
    parseEnvText(envText) {
        const lines = envText.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            // Parse KEY=VALUE format
            const equalIndex = trimmedLine.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmedLine.substring(0, equalIndex).trim();
                let value = trimmedLine.substring(equalIndex + 1).trim();
                
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                this.env[key] = value;
            }
        }
    }

    /**
     * Get environment variable
     * @param {string} key 
     * @param {string} defaultValue 
     * @returns {string}
     */
    get(key, defaultValue = '') {
        return this.env[key] || defaultValue;
    }

    /**
     * Check if environment variables are loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded;
    }
}

// Create global instance
window.envLoader = new EnvLoader();
