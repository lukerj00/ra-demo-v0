/**
 * Table Manager Module
 * Handles risk table functionality including row creation, editing, deletion, and interactions
 */

import { getScoreColor, createCellContent } from './utils.js';

export class TableManager {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
    }

    /**
     * Add a risk row to the table
     * @param {Object} risk - Risk object to add
     */
    addRiskRow(risk) {
        const row = document.createElement('tr');
        row.className = 'table-row-new fade-in';
        row.dataset.id = risk.id;
        const overallScore = risk.impact * risk.likelihood;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-normal text-sm justification-icon-container" data-field="risk">
                ${createCellContent(risk.risk, 'Risk Description', risk.id)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm justification-icon-container" data-field="category">
                ${createCellContent(risk.category, 'Category', risk.id)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm justification-icon-container" data-field="impact">
                ${createCellContent(risk.impact, 'Impact', risk.id, true)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm justification-icon-container" data-field="likelihood">
                ${createCellContent(risk.likelihood, 'Likelihood', risk.id, true)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold justification-icon-container" data-field="overall-container">
                <div><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(overallScore)}" data-field="overall">${overallScore}</span></div>
                <span class="justification-plus-icon" data-field-name="Overall Score" data-risk-id="${risk.id}" title="View Justification">+</span>
            </td>
            <td class="px-6 py-4 whitespace-normal text-sm text-zinc-600 justification-icon-container" data-field="mitigation">
                ${createCellContent(risk.mitigation, 'Mitigations', risk.id)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                    <button class="text-green-600 hover:text-green-800 text-lg" data-action="accept" title="Accept">✔</button>
                    <button class="text-blue-600 hover:text-blue-800 text-lg" data-action="edit" title="Edit">✏️</button>
                    <button class="text-red-600 hover:text-red-800 text-lg" data-action="delete" title="Delete">🗑️</button>
                    <button class="hidden text-blue-600 hover:text-blue-800 text-lg" data-action="save" title="Save">💾</button>
                </div>
            </td>
        `;
        this.dom.riskTableBody.appendChild(row);
    }

    /**
     * Handle table row actions (accept, edit, delete, save)
     * @param {Event} event - Click event
     * @param {Function} onMetricsCheck - Callback to check and display metrics
     */
    async handleRowAction(event, onMetricsCheck) {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const row = button.closest('tr');
        const id = parseInt(row.dataset.id, 10);
        const riskData = this.state.getRiskData();
        const riskItem = riskData.find(r => r.id === id);
        
        if (action === 'accept') {
            row.classList.remove('table-row-new');
            row.classList.add('table-row-accepted');
            button.parentElement.innerHTML = '<span class="text-sm text-green-700 font-semibold">Accepted</span>';
            await onMetricsCheck();
        } else if (action === 'delete') {
            if (confirm('Are you sure you want to delete this risk?')) {
                row.remove();
                const updatedRiskData = riskData.filter(r => r.id !== id);
                this.state.setRiskData(updatedRiskData);
                await onMetricsCheck();
            }
        } else if (action === 'edit') {
            this.enableRowEditing(row);
        } else if (action === 'save') {
            this.saveRowEdits(row, riskItem, riskData);
        }
    }

    /**
     * Enable editing for a table row
     * @param {HTMLElement} row - Table row element
     */
    enableRowEditing(row) {
        row.querySelectorAll('[data-field]').forEach(cell => {
            if (['risk', 'category', 'impact', 'likelihood', 'mitigation'].includes(cell.dataset.field)) {
                cell.contentEditable = true;
                cell.classList.add('table-cell-editing');
            }
        });
        row.querySelector('[data-action="edit"]').classList.add('hidden');
        row.querySelector('[data-action="accept"]').classList.add('hidden');
        row.querySelector('[data-action="delete"]').classList.add('hidden');
        row.querySelector('[data-action="save"]').classList.remove('hidden');
    }

    /**
     * Save row edits
     * @param {HTMLElement} row - Table row element
     * @param {Object} riskItem - Risk item to update
     * @param {Array} riskData - Risk data array
     */
    saveRowEdits(row, riskItem, riskData) {
        row.querySelectorAll('[data-field]').forEach(cell => {
            cell.contentEditable = false;
            cell.classList.remove('table-cell-editing');
        });

        if (riskItem) {
            // Store old values to check what changed
            const oldValues = {
                risk: riskItem.risk,
                category: riskItem.category,
                impact: riskItem.impact,
                likelihood: riskItem.likelihood,
                mitigation: riskItem.mitigation
            };

            // Update with new values
            riskItem.risk = row.querySelector('[data-field="risk"]').textContent;
            riskItem.category = row.querySelector('[data-field="category"]').textContent;
            riskItem.impact = parseInt(row.querySelector('[data-field="impact"]').textContent, 10) || riskItem.impact;
            riskItem.likelihood = parseInt(row.querySelector('[data-field="likelihood"]').textContent, 10) || riskItem.likelihood;
            riskItem.mitigation = row.querySelector('[data-field="mitigation"]').textContent;

            // Clear stored justifications for changed fields
            const fieldMappings = {
                'risk': { old: oldValues.risk, new: riskItem.risk },
                'category': { old: oldValues.category, new: riskItem.category },
                'impact': { old: oldValues.impact, new: riskItem.impact },
                'likelihood': { old: oldValues.likelihood, new: riskItem.likelihood },
                'mitigation': { old: oldValues.mitigation, new: riskItem.mitigation }
            };

            // Clear justifications for fields that changed
            Object.entries(fieldMappings).forEach(([fieldKey, values]) => {
                if (values.old !== values.new && riskItem.justifications) {
                    riskItem.justifications[fieldKey] = null;
                    console.log(`🗑️ Cleared justification for changed field: ${fieldKey}`);
                }
            });

            // Also clear Overall Score justification since it's calculated
            const oldOverall = oldValues.impact * oldValues.likelihood;
            const newOverall = riskItem.impact * riskItem.likelihood;
            if (oldOverall !== newOverall && riskItem.justifications) {
                riskItem.justifications.overall = null;
                console.log(`🗑️ Cleared justification for changed Overall Score`);
            }

            // Update the overall score display
            const overallCell = row.querySelector('[data-field="overall"]');
            overallCell.textContent = newOverall;
            overallCell.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(newOverall)}`;
        }

        row.querySelector('[data-action="edit"]').classList.remove('hidden');
        row.querySelector('[data-action="accept"]').classList.remove('hidden');
        row.querySelector('[data-action="delete"]').classList.remove('hidden');
        row.querySelector('[data-action="save"]').classList.add('hidden');
    }

    /**
     * Accept all risks in the table
     * @param {Function} onMetricsCheck - Callback to check and display metrics
     */
    async acceptAllRisks(onMetricsCheck) {
        const rows = this.dom.riskTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const actionsCell = row.cells[row.cells.length - 1]; // Last cell is Actions
            if (!actionsCell.querySelector('span.text-green-700')) {
                row.classList.remove('table-row-new');
                row.classList.add('table-row-accepted');
                actionsCell.innerHTML = '<span class="text-sm text-green-700 font-semibold">Accepted</span>';
            }
        });
        this.dom.acceptAllBtn.disabled = true;
        await onMetricsCheck();
    }

    /**
     * Check if all risks are accepted and display metrics if so
     * @param {Function} displayMetricsCallback - Callback to display metrics
     */
    async checkAndDisplayMetrics(displayMetricsCallback) {
        const totalRisks = this.dom.riskTableBody.querySelectorAll('tr').length;
        const acceptedRisks = this.dom.riskTableBody.querySelectorAll('.table-row-accepted').length;

        if (totalRisks > 0 && totalRisks === acceptedRisks) {
            await displayMetricsCallback();
        } else {
            const rekonMetricsSection = document.getElementById('rekonMetricsSection');
            if (rekonMetricsSection) {
                rekonMetricsSection.classList.add('hidden');
            }
        }
    }

    /**
     * Get field value from risk data for justification
     * @param {Object} currentRisk - Current risk object
     * @param {string} fieldName - Field name
     * @returns {string} Field value
     */
    getFieldValueForJustification(currentRisk, fieldName) {
        if (fieldName === 'Risk Description') return currentRisk.risk;
        else if (fieldName === 'Category') return currentRisk.category;
        else if (fieldName === 'Impact') return currentRisk.impact.toString();
        else if (fieldName === 'Likelihood') return currentRisk.likelihood.toString();
        else if (fieldName === 'Mitigations') return currentRisk.mitigation;
        else if (fieldName === 'Overall Score') return (currentRisk.impact * currentRisk.likelihood).toString();
        return 'N/A';
    }

    /**
     * Handle justification icon click
     * @param {Event} event - Click event
     * @param {Function} onJustificationRequest - Callback for justification request
     */
    handleJustificationClick(event, onJustificationRequest) {
        const justificationIcon = event.target.closest('.justification-plus-icon');
        if (!justificationIcon) return false;

        const fieldName = justificationIcon.dataset.fieldName;
        const riskId = parseInt(justificationIcon.dataset.riskId, 10);
        const riskData = this.state.getRiskData();
        const currentRisk = riskData.find(r => r.id === riskId);
        
        let fieldValue = 'N/A'; 
        let reasoning;
        let sources;

        // Attempt to get fieldValue from the DOM element first
        const contentWrapper = justificationIcon.previousElementSibling;
        if (contentWrapper) {
            fieldValue = (contentWrapper.textContent || contentWrapper.innerText || 'N/A').trim();
        }

        if (currentRisk) {
            if (fieldName === 'Overall Score') {
                const overall = (currentRisk.impact * currentRisk.likelihood);
                fieldValue = overall.toString();
                reasoning = `The Overall Score (${overall}) is calculated by multiplying Impact (${currentRisk.impact}) by Likelihood (${currentRisk.likelihood}).`;
                sources = ['Risk Scoring Matrix', 'Internal Calculation Logic'];
                onJustificationRequest(fieldName, fieldValue, reasoning, sources, null);
            } else {
                // For other fields, get fieldValue from currentRisk
                fieldValue = this.getFieldValueForJustification(currentRisk, fieldName);
                // Generate AI justification for this field
                onJustificationRequest(fieldName, fieldValue, null, null, currentRisk);
            }
        } else {
            // Fallback if currentRisk is not found
            reasoning = `Justification for "${fieldName}" (risk ID: ${riskId}) could not be fully determined as the specific risk data was not found.`;
            sources = ['UI Display Data'];
            onJustificationRequest(fieldName, fieldValue, reasoning, sources, null);
        }

        return true;
    }
}
