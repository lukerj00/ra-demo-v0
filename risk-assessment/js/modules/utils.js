/**
 * Utils Module
 * Contains utility functions used throughout the application
 */

import { RISK_SCORE_THRESHOLDS, COLORS } from './constants.js';

/**
 * Sleep utility function for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get color class for risk scores
 * @param {number} score - Risk score
 * @returns {string} CSS color class
 */
export const getScoreColor = (score) => {
    if (score >= RISK_SCORE_THRESHOLDS.HIGH) return 'bg-red-100 text-red-800';
    if (score >= RISK_SCORE_THRESHOLDS.LOW) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
};

/**
 * Get color class for RekonRisk scores
 * @param {number} score - RekonRisk score
 * @returns {string} CSS color class
 */
export const getRekonRiskColorClass = (score) => {
    if (score >= 5) return 'text-red-600'; // High, Very High, Critical
    if (score === 4) return 'text-yellow-600'; // Moderate
    return 'text-green-600'; // Low, Very Low, Negligible
};

/**
 * Get color class for risk levels
 * @param {string} level - Risk level
 * @returns {string} CSS color class
 */
export const getRiskLevelColor = (level) => {
    switch(level) {
        case '1': return 'text-green-600';
        case '2': return 'text-green-500';
        case '3': return 'text-yellow-600';
        case '4': return 'text-orange-600';
        case '5': return 'text-red-600';
        default: return 'text-zinc-500';
    }
};

/**
 * Format date for display
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Format date for PDF display
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDateForPDF = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
};

/**
 * Format attendance number
 * @param {string|number} attendance - Attendance value
 * @returns {string} Formatted attendance string
 */
export const formatAttendance = (attendance) => {
    if (!attendance) return 'N/A';
    
    const num = parseInt(attendance);
    if (isNaN(num)) return 'N/A';
    
    return `${num.toLocaleString()} people`;
};

/**
 * Sanitize filename for PDF export
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Generate RA number for PDF
 * @param {string} projectName - Project name
 * @returns {string} Generated RA number
 */
export const generateRANumber = (projectName) => {
    const currentDate = new Date();
    const projectNameSanitized = projectName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
    const year = String(currentDate.getFullYear()).slice(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    
    return `${projectNameSanitized}-${year}${month}${day}-${seconds}`;
};

/**
 * Get current date formatted for PDF
 * @returns {string} Formatted current date
 */
export const getCurrentDateFormatted = () => {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = String(currentDate.getFullYear()).slice(-2);
    
    return `${day}/${month}/${year}`;
};

/**
 * Convert SVG compliance icon to base64 for PDF
 * @param {string} status - Compliance status
 * @param {Object} complianceIcons - Compliance icons object
 * @returns {Promise<string|null>} Base64 encoded image or null
 */
export const getComplianceIconBase64 = (status, complianceIcons) => {
    return new Promise((resolve) => {
        const svgString = complianceIcons[status];
        if (!svgString) {
            resolve(null);
            return;
        }

        // Use a more robust regex to find the text color class
        const colorMatch = svgString.match(/text-(red|green)-500/);
        let color = '#000000'; // Default to black
        if (colorMatch) {
            const colorName = colorMatch[1];
            if (colorName === 'red') {
                color = COLORS.TAILWIND.RED_500;
            } else if (colorName === 'green') {
                color = COLORS.TAILWIND.GREEN_500;
            }
        }

        // Prepare SVG for canvas conversion
        let preparedSvgString = svgString.replace(/class="[^"]*"/, '');
        preparedSvgString = preparedSvgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"');
        preparedSvgString = preparedSvgString.replace(/stroke="currentColor"/g, `stroke="${color}"`);

        const img = new Image();
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(preparedSvgString);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; 
            canvas.width = 24 * scale;
            canvas.height = 24 * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const pngBase64 = canvas.toDataURL('image/png');
            resolve(pngBase64);
        };

        img.onerror = (e) => {
            console.error("Failed to load SVG image for PDF conversion. SVG content:", preparedSvgString);
            resolve(null);
        };

        img.src = svgDataUrl;
    });
};

/**
 * Preload logo image and convert to base64
 * @returns {Promise<string>} Base64 encoded logo
 */
export const preloadLogo = () => {
    return new Promise((resolve, reject) => {
        try {
            console.log('Attempting to load logo: assets/images/airekon.png');
            
            const img = new Image();
            img.crossOrigin = 'anonymous'; 
            
            img.onload = function() {
                console.log('Logo loaded successfully, converting to base64...');
                
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                try {
                    const base64 = canvas.toDataURL('image/png'); 
                    console.log('Logo converted to base64 (PNG), length:', base64.length);
                    resolve(base64);
                } catch (e) {
                    console.error('Error converting image to base64:', e);
                    reject('Failed to convert image to base64');
                }
            };
            
            img.onerror = function() {
                console.error('Failed to load logo image from assets/images/airekon.png');
                reject('Failed to load logo image');
            };
            
            img.src = 'assets/images/airekon.png';
            
        } catch (error) {
            console.error('Error in preloadLogo function:', error);
            reject('Error in preloadLogo function');
        }
    });
};

/**
 * Create cell content with justification icon
 * @param {string} content - Cell content
 * @param {string} fieldName - Field name for justification
 * @param {number} riskId - Risk ID
 * @param {boolean} isNumeric - Whether the field is numeric
 * @returns {string} HTML string with content and justification icon
 */
export const createCellContent = (content, fieldName, riskId, isNumeric = false) => {
    let displayContent = content;
    // Ensure N/A is used for undefined/null/empty numeric fields, otherwise convert numbers to string
    if (isNumeric) {
        displayContent = (content === undefined || content === null || content.toString().trim() === '') ? 'N/A' : content.toString();
    } else if (content === undefined || content === null) {
        displayContent = ''; // Default to empty string for non-numeric if undefined/null
    }

    return `<div>${displayContent}</div><span class="justification-plus-icon" data-field-name="${fieldName}" data-risk-id="${riskId}" title="View Justification">+</span>`;
};

/**
 * Debug function to inspect current state
 * @param {Object} applicationState - Application state
 * @param {Array} riskData - Risk data array
 */
export const debugState = (applicationState, riskData) => {
    console.log('📊 Current Application State:', {
        applicationState,
        riskDataCount: riskData.length,
        riskDataSample: riskData.length > 0 ? riskData[0] : null
    });
};
