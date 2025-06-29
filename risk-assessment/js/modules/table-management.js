/**
 * Table Management Module
 * Handles risk table display, interactions, and management
 */

export class TableManager {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
    }

    /**
     * Add a risk to the table
     * @param {Object} risk - Risk object to add
     */
    addRiskToTable(risk) {
        const tableBody = this.dom.riskTableBody;
        const row = document.createElement('tr');
        row.className = 'border-b border-zinc-200 hover:bg-zinc-50';
        row.dataset.riskId = risk.id;

        const overallScore = risk.impact * risk.likelihood;
        const scoreColor = this.getScoreColor(overallScore);

        row.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-zinc-900">${risk.id}</td>
            <td class="px-4 py-3 text-sm text-zinc-700 max-w-xs">
                <div class="flex items-center">
                    <span class="flex-1">${risk.risk}</span>
                    <button class="ml-2 text-zinc-400 hover:text-zinc-600 justification-icon" 
                            data-field="Risk Description" 
                            data-value="${this.escapeHtml(risk.risk)}"
                            data-risk-id="${risk.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-700">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${risk.category}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-700">
                <div class="flex items-center">
                    <span class="flex-1">${risk.impact}</span>
                    <button class="ml-2 text-zinc-400 hover:text-zinc-600 justification-icon" 
                            data-field="Impact" 
                            data-value="${risk.impact}"
                            data-risk-id="${risk.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-700">
                <div class="flex items-center">
                    <span class="flex-1">${risk.likelihood}</span>
                    <button class="ml-2 text-zinc-400 hover:text-zinc-600 justification-icon" 
                            data-field="Likelihood" 
                            data-value="${risk.likelihood}"
                            data-risk-id="${risk.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                </div>
            </td>
            <td class="px-4 py-3 text-sm">
                <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoreColor}">
                        ${overallScore}
                    </span>
                    <button class="ml-2 text-zinc-400 hover:text-zinc-600 justification-icon" 
                            data-field="Overall Score" 
                            data-value="${overallScore}"
                            data-risk-id="${risk.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-700 max-w-xs">${risk.mitigation}</td>
            <td class="px-4 py-3 text-sm text-zinc-700">
                <button class="text-green-600 hover:text-green-800 font-medium accept-risk-btn" data-risk-id="${risk.id}">
                    Accept
                </button>
            </td>
        `;

        tableBody.appendChild(row);

        // Add event listeners for this row
        this.addRowEventListeners(row, risk);

        // Hide table loader if this is the first risk
        if (tableBody.children.length === 1) {
            this.dom.tableLoader.classList.add('hidden');
        }
    }

    /**
     * Add event listeners to a table row
     * @param {HTMLElement} row - Table row element
     * @param {Object} risk - Risk object
     */
    addRowEventListeners(row, risk) {
        // Accept risk button
        const acceptBtn = row.querySelector('.accept-risk-btn');
        acceptBtn.addEventListener('click', () => {
            this.acceptRisk(risk.id, acceptBtn);
        });

        // Justification icons
        const justificationIcons = row.querySelectorAll('.justification-icon');
        justificationIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const fieldName = e.currentTarget.dataset.field;
                const fieldValue = e.currentTarget.dataset.value;
                const riskId = e.currentTarget.dataset.riskId;
                this.openJustificationPane(fieldName, fieldValue, riskId);
            });
        });
    }

    /**
     * Accept a risk
     * @param {number} riskId - Risk ID
     * @param {HTMLElement} button - Accept button element
     */
    acceptRisk(riskId, button) {
        button.innerHTML = '<span class="text-green-700">✔ Accepted</span>';
        button.disabled = true;
        button.classList.add('cursor-not-allowed');
    }

    /**
     * Accept all risks
     */
    acceptAllRisks() {
        const rows = this.dom.riskTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const acceptBtn = row.querySelector('.accept-risk-btn');
            if (acceptBtn && !acceptBtn.disabled) {
                const riskId = acceptBtn.dataset.riskId;
                this.acceptRisk(riskId, acceptBtn);
            }
        });
    }

    /**
     * Get score color class based on score value
     * @param {number} score - Risk score
     * @returns {string} CSS class for score color
     */
    getScoreColor(score) {
        if (score >= 15) return 'bg-red-100 text-red-800';
        if (score >= 8) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    }

    /**
     * Escape HTML characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all risks from table
     */
    clearTable() {
        this.dom.riskTableBody.innerHTML = '';
        this.dom.tableLoader.classList.remove('hidden');
    }

    /**
     * Get table data for export
     * @returns {Array} Array of risk data
     */
    getTableData() {
        const risks = this.state.getRiskData();
        return risks.map(risk => ({
            id: risk.id,
            risk: risk.risk,
            category: risk.category,
            impact: risk.impact,
            likelihood: risk.likelihood,
            score: risk.impact * risk.likelihood,
            mitigation: risk.mitigation
        }));
    }

    /**
     * Update table with new risk data
     * @param {Array} risks - Array of risk objects
     */
    updateTable(risks) {
        this.clearTable();
        risks.forEach(risk => {
            this.addRiskToTable(risk);
        });
    }

    /**
     * Get risk count
     * @returns {number} Number of risks in table
     */
    getRiskCount() {
        return this.dom.riskTableBody.children.length;
    }

    /**
     * Check if all risks are accepted
     * @returns {boolean} True if all risks are accepted
     */
    areAllRisksAccepted() {
        const acceptButtons = this.dom.riskTableBody.querySelectorAll('.accept-risk-btn');
        return Array.from(acceptButtons).every(btn => btn.disabled);
    }

    /**
     * Open justification pane (placeholder - will be implemented in justification module)
     * @param {string} fieldName - Field name
     * @param {string} fieldValue - Field value
     * @param {string} riskId - Risk ID
     */
    openJustificationPane(fieldName, fieldValue, riskId) {
        // This will be implemented in the justification module
        console.log('Opening justification pane:', { fieldName, fieldValue, riskId });
    }

    /**
     * Setup table event listeners
     */
    setupEventListeners() {
        // Accept all button
        this.dom.acceptAllBtn.addEventListener('click', () => {
            this.acceptAllRisks();
            this.dom.acceptAllBtn.disabled = true;
        });
    }

    /**
     * Show/hide action buttons based on table state
     */
    updateActionButtons() {
        const hasRisks = this.getRiskCount() > 0;
        const allAccepted = this.areAllRisksAccepted();

        // Show buttons if there are risks
        if (hasRisks) {
            this.dom.acceptAllBtn.style.display = allAccepted ? 'none' : 'inline-block';
            this.dom.generateMoreBtn.style.display = 'inline-block';
            this.dom.addCustomRiskBtn.style.display = 'inline-block';
            this.dom.exportBtn.style.display = 'inline-block';
        }
    }

    /**
     * Calculate risk statistics
     * @returns {Object} Risk statistics
     */
    calculateRiskStatistics() {
        const risks = this.state.getRiskData();
        
        if (risks.length === 0) {
            return {
                totalRisks: 0,
                averageScore: 0,
                highRisks: 0,
                mediumRisks: 0,
                lowRisks: 0,
                categories: {}
            };
        }

        const scores = risks.map(risk => risk.impact * risk.likelihood);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const averageScore = totalScore / scores.length;

        const highRisks = scores.filter(score => score >= 15).length;
        const mediumRisks = scores.filter(score => score >= 8 && score < 15).length;
        const lowRisks = scores.filter(score => score < 8).length;

        // Count by category
        const categories = {};
        risks.forEach(risk => {
            categories[risk.category] = (categories[risk.category] || 0) + 1;
        });

        return {
            totalRisks: risks.length,
            averageScore: Math.round(averageScore * 10) / 10,
            highRisks,
            mediumRisks,
            lowRisks,
            categories
        };
    }
}
