/**
 * Form Validation Module
 * Handles form validation and input processing
 */

export class FormValidator {
    constructor(domElements) {
        this.dom = domElements;
    }

    /**
     * Validate the main event form
     * @returns {boolean} True if form is valid
     */
    validateForm() {
        const inputs = this.dom.getFormInputs();
        
        const requiredFields = [
            inputs.eventTitle.value.trim(),
            inputs.eventDate.value,
            inputs.location.value.trim(),
            inputs.attendance.value,
            inputs.eventType.value,
            inputs.venueType.value,
            inputs.riskLevel.value
        ];

        const isValid = requiredFields.every(field => field !== '');
        
        if (!isValid) {
            this.showValidationError('Please fill in all required fields.');
            return false;
        }

        // Validate attendance is a positive number
        const attendance = parseInt(inputs.attendance.value);
        if (isNaN(attendance) || attendance <= 0) {
            this.showValidationError('Please enter a valid attendance number.');
            return false;
        }

        // Validate date is not in the past
        const eventDate = new Date(inputs.eventDate.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate < today) {
            this.showValidationError('Event date cannot be in the past.');
            return false;
        }

        return true;
    }

    /**
     * Validate custom risk form
     * @returns {boolean} True if custom risk form is valid
     */
    validateCustomRiskForm() {
        const form = this.dom.customRiskForm;
        const formData = new FormData(form);
        
        const risk = formData.get('risk')?.trim();
        const category = formData.get('category');
        const impact = formData.get('impact');
        const likelihood = formData.get('likelihood');
        const mitigation = formData.get('mitigation')?.trim();

        if (!risk || !category || !impact || !likelihood || !mitigation) {
            this.showValidationError('Please fill in all fields for the custom risk.');
            return false;
        }

        // Validate impact and likelihood are valid numbers
        const impactNum = parseInt(impact);
        const likelihoodNum = parseInt(likelihood);
        
        if (isNaN(impactNum) || impactNum < 1 || impactNum > 5) {
            this.showValidationError('Impact must be a number between 1 and 5.');
            return false;
        }
        
        if (isNaN(likelihoodNum) || likelihoodNum < 1 || likelihoodNum > 5) {
            this.showValidationError('Likelihood must be a number between 1 and 5.');
            return false;
        }

        return true;
    }

    /**
     * Get form data as an object
     * @returns {Object} Form data object
     */
    getFormData() {
        const inputs = this.dom.getFormInputs();
        
        return {
            eventTitle: inputs.eventTitle.value.trim(),
            eventDate: inputs.eventDate.value,
            location: inputs.location.value.trim(),
            attendance: parseInt(inputs.attendance.value),
            eventType: inputs.eventType.value,
            venueType: inputs.venueType.value,
            riskLevel: inputs.riskLevel.value,
            description: inputs.description.value.trim()
        };
    }

    /**
     * Get custom risk form data
     * @returns {Object} Custom risk data object
     */
    getCustomRiskData() {
        const form = this.dom.customRiskForm;
        const formData = new FormData(form);
        
        return {
            risk: formData.get('risk')?.trim(),
            category: formData.get('category'),
            impact: parseInt(formData.get('impact')),
            likelihood: parseInt(formData.get('likelihood')),
            mitigation: formData.get('mitigation')?.trim()
        };
    }

    /**
     * Populate event card with form data
     * @param {Object} eventData - Event data to display
     */
    populateEventCard(eventData) {
        const cardElements = this.dom.getEventCardElements();
        
        cardElements.title.textContent = eventData.eventTitle;
        cardElements.date.textContent = this.formatDate(eventData.eventDate);
        cardElements.location.textContent = eventData.location;
        cardElements.attendance.textContent = `${eventData.attendance.toLocaleString()} attendees`;
        cardElements.eventType.textContent = eventData.eventType;
        cardElements.venueType.textContent = eventData.venueType;
        cardElements.riskLevel.textContent = eventData.riskLevel;
        cardElements.description.textContent = eventData.description || 'No description provided';
    }

    /**
     * Update venue type options based on selected event type
     * @param {string} eventType - Selected event type
     * @param {Array} venueTypes - Available venue types for the event type
     */
    updateVenueTypeOptions(eventType, venueTypes) {
        const venueSelect = this.dom.venueTypeInput;
        
        // Clear existing options except the first one
        venueSelect.innerHTML = '<option value="">Select venue type</option>';
        
        // Add venue types for the selected event type
        venueTypes.forEach(venue => {
            const option = document.createElement('option');
            option.value = venue;
            option.textContent = venue;
            venueSelect.appendChild(option);
        });
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        const inputs = this.dom.getFormInputs();
        
        Object.values(inputs).forEach(input => {
            if (input.type === 'select-one') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
        });
    }

    /**
     * Reset custom risk form
     */
    resetCustomRiskForm() {
        this.dom.customRiskForm.reset();
    }

    /**
     * Show validation error message
     * @param {string} message - Error message to display
     */
    showValidationError(message) {
        // Create or update error message element
        let errorElement = document.getElementById('validation-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'validation-error';
            errorElement.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
            
            // Insert before the generate button
            this.dom.generateBtn.parentNode.insertBefore(errorElement, this.dom.generateBtn);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }

    /**
     * Hide validation error message
     */
    hideValidationError() {
        const errorElement = document.getElementById('validation-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @returns {string} Formatted date string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Set up event type change handler
     * @param {Function} callback - Callback function to handle event type changes
     */
    setupEventTypeChangeHandler(callback) {
        this.dom.eventTypeInput.addEventListener('change', (e) => {
            callback(e.target.value);
        });
    }
}
