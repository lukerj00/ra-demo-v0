/**
 * UI Manager Module
 * Handles UI transitions, loading states, and visual updates
 */

import { formatDate, formatAttendance, getRiskLevelColor, sleep } from './utils.js';

export class UIManager {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
    }

    /**
     * Show screen 2 and hide screen 1
     */
    showScreen2() {
        this.dom.screen1.classList.add('hidden');
        this.dom.screen2.classList.remove('hidden');
    }

    /**
     * Show screen 1 and hide screen 2
     */
    showScreen1() {
        this.dom.screen2.classList.add('hidden');
        this.dom.screen1.classList.remove('hidden');
    }

    /**
     * Reset screen 2 to initial state
     */
    resetScreen2() {
        // Reset application state
        this.state.updateApplicationState({
            currentStep: 'setup',
            eventData: {},
            summaryGenerated: false,
            risksGenerated: false,
            summaryJustification: null
        });

        // Reset summary section
        this.dom.summaryContent.textContent = '';
        this.dom.summarySection.classList.add('hidden');
        this.dom.summaryActions.classList.add('hidden');
        this.dom.acceptSummaryBtn.innerHTML = '✔ Accept';
        this.dom.acceptSummaryBtn.disabled = false;
        this.dom.editSummaryBtn.classList.remove('hidden');
        this.dom.saveSummaryBtn.classList.add('hidden');
        this.dom.summaryContent.contentEditable = false;
        this.dom.summaryContent.classList.remove('table-cell-editing');

        // Reset risk table
        this.dom.riskTableBody.innerHTML = '';
        this.dom.riskTableSection.classList.add('hidden');
        this.dom.rekonContextSection.classList.add('hidden');

        // Reset metrics section
        const rekonMetricsSection = document.getElementById('rekonMetricsSection');
        if (rekonMetricsSection) {
            rekonMetricsSection.classList.add('hidden');
        }

        // Reset progress and status
        this.dom.progressBar.style.width = '0%';
        this.dom.aiStatus.textContent = 'Initializing...';
        this.dom.exportBtn.disabled = true;
        
        const acceptAllContainer = document.getElementById('acceptAllContainer');
        if (acceptAllContainer) {
            acceptAllContainer.classList.add('hidden');
            this.dom.acceptAllBtn.disabled = false;
        }
    }

    /**
     * Set report title
     * @param {string} title - Report title
     */
    setReportTitle(title) {
        this.dom.reportScreenTitle.textContent = `aiRekon Automated Risk Assessment`;
        this.dom.reportTitle.textContent = title;
    }

    /**
     * Update progress bar
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgress(percentage) {
        this.dom.progressBar.style.width = `${percentage}%`;
    }

    /**
     * Update AI status text
     * @param {string} status - Status message
     */
    updateStatus(status) {
        this.dom.aiStatus.textContent = status;
    }

    /**
     * Show summary section with loading state
     */
    showSummaryLoading() {
        this.dom.summarySection.classList.remove('hidden');
        this.dom.summarySection.classList.add('fade-in');
        this.dom.summaryContent.innerHTML = `
            <div class="flex justify-center items-center py-4">
                <div class="loader"></div>
                <p class="ml-4 text-zinc-500">AI is generating overview...</p>
            </div>
        `;
    }

    /**
     * Update summary content with first paragraph
     * @param {string} paragraph1 - First paragraph content
     */
    updateSummaryFirstParagraph(paragraph1) {
        this.dom.summaryContent.innerHTML = `<p>${paragraph1}</p>`;
    }

    /**
     * Show loading for second paragraph
     * @param {string} paragraph1 - First paragraph content
     */
    showSecondParagraphLoading(paragraph1) {
        this.dom.summaryContent.innerHTML = `
            <p>${paragraph1}</p>
            <div class="flex justify-center items-center py-4">
                <div class="loader"></div>
                <p class="ml-4 text-zinc-500">AI is generating operational considerations...</p>
            </div>
        `;
    }

    /**
     * Update summary content with both paragraphs
     * @param {string} paragraph1 - First paragraph content
     * @param {string} paragraph2 - Second paragraph content
     */
    updateSummaryBothParagraphs(paragraph1, paragraph2) {
        this.dom.summaryContent.innerHTML = `<p>${paragraph1}</p>\n<p>${paragraph2}</p>`;
    }

    /**
     * Show summary actions
     */
    showSummaryActions() {
        this.dom.summaryActions.classList.remove('hidden');
    }

    /**
     * Show risk table section
     */
    showRiskTableSection() {
        this.dom.riskTableSection.classList.remove('hidden');
        this.dom.riskTableSection.classList.add('fade-in');
        this.dom.tableLoader.classList.remove('hidden');
    }

    /**
     * Hide risk table loader
     */
    hideRiskTableLoader() {
        this.dom.tableLoader.classList.add('hidden');
    }

    /**
     * Show accept all container
     */
    showAcceptAllContainer() {
        const acceptAllContainer = document.getElementById('acceptAllContainer');
        if (acceptAllContainer) {
            acceptAllContainer.classList.remove('hidden');
            acceptAllContainer.classList.add('fade-in');
        }
    }

    /**
     * Populate event card with form data
     * @param {Object} eventData - Event data to display
     */
    populateEventCard(eventData) {
        const cardElements = this.dom.getEventCardElements();
        
        cardElements.title.textContent = eventData.eventTitle || 'N/A';
        cardElements.date.textContent = formatDate(eventData.eventDate);
        cardElements.location.textContent = eventData.location || 'N/A';
        cardElements.attendance.textContent = formatAttendance(eventData.attendance);
        cardElements.eventType.textContent = eventData.eventType || 'N/A';
        cardElements.venueType.textContent = eventData.venueType || 'N/A';
        
        // Handle risk level with color
        if (eventData.riskLevel) {
            const riskLevelInput = document.getElementById('riskLevel');
            const riskLevelText = riskLevelInput ? 
                riskLevelInput.options[riskLevelInput.selectedIndex]?.text || eventData.riskLevel : 
                eventData.riskLevel;
            cardElements.riskLevel.textContent = riskLevelText;
            cardElements.riskLevel.className = `text-sm font-semibold mt-1 ${getRiskLevelColor(eventData.riskLevel)}`;
        } else {
            cardElements.riskLevel.textContent = 'Not assessed';
            cardElements.riskLevel.className = 'text-sm font-semibold mt-1 text-zinc-500';
        }

        cardElements.description.textContent = eventData.description || 'No description provided';

        // Show the event card
        cardElements.card.classList.remove('hidden');
        cardElements.card.classList.add('fade-in');
    }

    /**
     * Show RekonContext section
     */
    showRekonContextSection() {
        this.dom.rekonContextSection.classList.remove('hidden');
    }

    /**
     * Show RekonContext loading state
     */
    showRekonContextLoading() {
        this.dom.rekonContextScore.textContent = '';
        this.dom.rekonContextSlash.style.visibility = 'hidden';
        this.dom.rekonContextLevel.textContent = '';
        this.dom.rekonContextLoader.classList.remove('hidden');
        this.dom.rekonContextDescription.innerHTML = '';
    }

    /**
     * Update RekonContext display
     * @param {number} score - Context score
     * @param {string} level - Context level
     * @param {string} colorClass - CSS color class
     * @param {Array} details - Context details
     */
    updateRekonContextDisplay(score, level, colorClass, details) {
        this.dom.rekonContextLoader.classList.add('hidden');
        this.dom.rekonContextScore.textContent = score;
        this.dom.rekonContextScore.className = `text-5xl font-bold ${colorClass}`;
        this.dom.rekonContextSlash.style.visibility = 'visible';
        this.dom.rekonContextLevel.textContent = level;

        const descriptionHtml = `
            <ul class="list-disc list-inside space-y-1 mt-2">
                ${details.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
        this.dom.rekonContextDescription.innerHTML = descriptionHtml;
    }

    /**
     * Show RekonMetrics section
     */
    showRekonMetricsSection() {
        const rekonMetricsSection = document.getElementById('rekonMetricsSection');
        if (rekonMetricsSection) {
            rekonMetricsSection.classList.remove('hidden');
            rekonMetricsSection.classList.add('fade-in');
        }
    }

    /**
     * Show RekonRisk loading state
     */
    showRekonRiskLoading() {
        const rekonRiskLoader = document.getElementById('rekonRiskLoader');
        const rekonRiskScore = document.getElementById('rekonRiskScore');
        const rekonRiskLevel = document.getElementById('rekonRiskLevel');
        const rekonRiskDescription = document.getElementById('rekonRiskDescription');
        
        if (rekonRiskLoader) rekonRiskLoader.classList.remove('hidden');
        if (rekonRiskScore) rekonRiskScore.textContent = '';
        if (rekonRiskLevel) rekonRiskLevel.textContent = '';
        if (rekonRiskDescription) rekonRiskDescription.innerHTML = '';
    }

    /**
     * Update RekonRisk display
     * @param {number} score - Risk score
     * @param {string} level - Risk level
     * @param {string} colorClass - CSS color class
     * @param {Array} details - Risk details
     */
    updateRekonRiskDisplay(score, level, colorClass, details) {
        const rekonRiskLoader = document.getElementById('rekonRiskLoader');
        const rekonRiskScore = document.getElementById('rekonRiskScore');
        const rekonRiskLevel = document.getElementById('rekonRiskLevel');
        const rekonRiskDescription = document.getElementById('rekonRiskDescription');
        
        if (rekonRiskLoader) rekonRiskLoader.classList.add('hidden');
        if (rekonRiskScore) {
            rekonRiskScore.textContent = score;
            rekonRiskScore.className = `text-5xl font-bold ${colorClass}`;
        }
        if (rekonRiskLevel) rekonRiskLevel.textContent = level;

        if (rekonRiskDescription) {
            const riskDescHtml = `
                <ul class="list-disc list-inside space-y-1 mt-2">
                    ${details.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
            rekonRiskDescription.innerHTML = riskDescHtml;
        }
    }

    /**
     * Show RekonCompliance loading state
     */
    showRekonComplianceLoading() {
        const rekonComplianceLoader = document.getElementById('rekonComplianceLoader');
        const rekonComplianceStatus = document.getElementById('rekonComplianceStatus');
        const rekonComplianceDescription = document.getElementById('rekonComplianceDescription');
        
        if (rekonComplianceLoader) rekonComplianceLoader.classList.remove('hidden');
        if (rekonComplianceStatus) rekonComplianceStatus.textContent = '';
        if (rekonComplianceDescription) rekonComplianceDescription.innerHTML = '';
    }

    /**
     * Update RekonCompliance display
     * @param {string} status - Compliance status
     * @param {string} icon - Compliance icon HTML
     * @param {Array} details - Compliance details
     */
    updateRekonComplianceDisplay(status, icon, details) {
        const rekonComplianceLoader = document.getElementById('rekonComplianceLoader');
        const rekonComplianceStatus = document.getElementById('rekonComplianceStatus');
        const rekonComplianceIcon = document.getElementById('rekonComplianceIcon');
        const rekonComplianceDescription = document.getElementById('rekonComplianceDescription');
        
        if (rekonComplianceLoader) rekonComplianceLoader.classList.add('hidden');
        if (rekonComplianceStatus) {
            rekonComplianceStatus.textContent = status;
            rekonComplianceStatus.className = 'text-2xl font-bold';
        }
        if (rekonComplianceIcon) rekonComplianceIcon.innerHTML = icon || '';

        if (rekonComplianceDescription) {
            const complianceDescHtml = `
                <ul class="list-disc list-inside space-y-1 mt-2">
                    ${details.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
            rekonComplianceDescription.innerHTML = complianceDescHtml;
        }
    }

    /**
     * Enable export button
     */
    enableExportButton() {
        this.dom.exportBtn.disabled = false;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Show error in summary content area with consistent styling
        this.dom.summaryContent.innerHTML = `
            <div class="flex justify-center items-center py-4">
                <div class="text-red-500 text-2xl">❌</div>
                <p class="ml-4 text-red-500">${message}</p>
            </div>
        `;
        this.updateStatus(message);
    }
}
