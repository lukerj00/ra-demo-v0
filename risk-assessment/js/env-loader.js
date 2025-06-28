/**
 * Environment Variable Loader for Frontend
 * Loads environment variables from .env file
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
        if (this.loaded) {
            return this.env;
        }

        try {
            // Try to fetch .env file from root directory
            const response = await fetch('../.env');
            
            if (!response.ok) {
                console.warn('No .env file found, using default configuration');
                return this.env;
            }

            const envText = await response.text();
            this.parseEnvText(envText);
            this.loaded = true;
            
            console.log('Environment variables loaded from .env file');
            return this.env;
            
        } catch (error) {
            console.warn('Failed to load .env file:', error.message);
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
