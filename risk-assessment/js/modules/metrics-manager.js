/**
 * Metrics Manager Module
 * Handles RekonRisk, RekonCompliance, and RekonContext calculation and display logic
 */

import { REKON_RISK_LEVELS, REKON_CONTEXT_LEVELS, COMPLIANCE_ICONS, RISK_SCORE_THRESHOLDS } from './constants.js';
import { getRekonRiskColorClass } from './utils.js';

export class MetricsManager {
    constructor(domElements, stateManager, uiManager) {
        this.dom = domElements;
        this.state = stateManager;
        this.ui = uiManager;
        this.aiService = window.aiService; // Use global AI service
    }

    /**
     * Calculate RekonRisk score based on risk data
     * @param {Array} risks - Array of risk objects
     * @returns {number} RekonRisk score (1-7)
     */
    getRekonRiskScore(risks) {
        if (!risks || risks.length === 0) {
            return 1; // Default to negligible if no risks
        }
        const maxScore = risks.reduce((max, r) => {
            const score = r.impact * r.likelihood;
            return score > max ? score : max;
        }, 0);

        if (maxScore >= RISK_SCORE_THRESHOLDS.CRITICAL) return 7; // Critical
        if (maxScore >= RISK_SCORE_THRESHOLDS.VERY_HIGH) return 6; // Very High
        if (maxScore >= RISK_SCORE_THRESHOLDS.HIGH) return 5; // High
        if (maxScore >= RISK_SCORE_THRESHOLDS.MODERATE) return 4; // Moderate
        if (maxScore >= RISK_SCORE_THRESHOLDS.LOW) return 3;  // Low
        if (maxScore >= RISK_SCORE_THRESHOLDS.VERY_LOW) return 2;  // Very Low
        return 1; // Negligible
    }

    /**
     * Calculate RekonCompliance status based on risk data
     * @param {Array} risks - Array of risk objects
     * @returns {Object} Compliance status and details
     */
    getRekonCompliance(risks) {
        const securityRisks = risks.filter(r => r.category === 'Security');
        const highImpactSecurityRisks = securityRisks.filter(r => r.impact >= 4);

        if (highImpactSecurityRisks.length > 1) {
            return {
                status: 'Exceeds Compliance',
                details: [
                    "Demonstrates a robust, multi-layered approach aligning with Martyn's Law.",
                    "Integrates advanced threat intelligence in line with ProtectUK guidance.",
                    "Proactively addresses information security with comprehensive controls (ISO 27001)."
                ]
            };
        }
        if (highImpactSecurityRisks.length > 0) {
             return {
                status: 'Compliant',
                details: [
                    "Assessment considers terrorist threats and proposes proportionate mitigations (Martyn's Law).",
                    "Aligns with national guidance on threat detection and public safety (ProtectUK).",
                    "Identifies key information-related risks as a basis for security controls (ISO 27001)."
                ]
            };
        }
        if (securityRisks.length > 0) {
            return {
                status: 'Compliant',
                details: [
                    "Basic principles of public safety and security are considered (Martyn's Law).",
                    "Some general security guidance has been acknowledged (ProtectUK).",
                    "Initial steps taken to identify general risks, touching on information security (ISO 27001)."
                ]
            };
        }
        return {
            status: 'Non-Compliant',
            details: [
                "Key principles of terrorism risk assessment are not addressed (Martyn's Law).",
                "Fails to incorporate guidance on recognising and responding to threats (ProtectUK).",
                "Information security risks associated with the event are not considered (ISO 27001)."
            ]
        };
    }

    /**
     * Calculate RekonContext score based on event data
     * @param {string} eventType - Event type
     * @param {string} venueType - Venue type
     * @param {string|number} attendance - Attendance number
     * @returns {number} RekonContext score (1-7)
     */
    getRekonContext(eventType, venueType, attendance) {
        let score = 1;
        const attendanceNum = parseInt(attendance) || 0;

        // Base score from event type
        const eventTypeScores = {
            'Music': 3,
            'Community': 2,
            'State': 6,
            'Sport': 4,
            'Other': 2
        };
        score = eventTypeScores[eventType] || 2;

        // Adjust based on attendance
        if (attendanceNum > 50000) score += 2;
        else if (attendanceNum > 10000) score += 1;
        else if (attendanceNum > 1000) score += 0;
        else score -= 1;

        // Venue type adjustments
        const highRiskVenues = ['Stadium', 'Arena', 'Outdoor Festival Ground', 'Public Rally / Protest'];
        if (venueType && highRiskVenues.some(venue => venueType.includes(venue))) {
            score += 1;
        }

        // Ensure score is within bounds
        return Math.max(1, Math.min(7, score));
    }

    /**
     * Display RekonContext section with AI-generated content
     */
    async displayRekonContext() {
        const eventData = this.state.getEventData();
        const score = this.getRekonContext(eventData.eventType, eventData.venueType, eventData.attendance);
        const levelInfo = REKON_CONTEXT_LEVELS[score];

        // Show section and loading state
        this.ui.showRekonContextSection();
        this.ui.showRekonContextLoading();

        try {
            // Generate AI content for the context details
            const aiDetails = await this.aiService.generateRekonContextDetails(eventData, score, levelInfo.level);

            // Display score/level/slash with AI-generated content simultaneously
            const colorClass = getRekonRiskColorClass(score);
            this.ui.updateRekonContextDisplay(score, levelInfo.level, colorClass, aiDetails);

        } catch (error) {
            console.error('Error generating RekonContext details:', error);
            // Fall back to hardcoded content
            const colorClass = getRekonRiskColorClass(score);
            this.ui.updateRekonContextDisplay(score, levelInfo.level, colorClass, levelInfo.details);
        }
    }

    /**
     * Display RekonMetrics section with AI-generated content
     */
    async displayRekonMetrics() {
        const riskData = this.state.getRiskData();
        const riskScore = this.getRekonRiskScore(riskData);
        const compliance = this.getRekonCompliance(riskData);
        const riskLevelInfo = REKON_RISK_LEVELS[riskScore];

        // Show section
        this.ui.showRekonMetricsSection();

        // Generate AI content for RekonRisk details
        try {
            const eventData = this.state.getEventData();
            this.ui.updateStatus('AI is generating risk analysis...');
            this.ui.updateProgress(95);

            this.ui.showRekonRiskLoading();

            const aiRiskDetails = await this.aiService.generateRekonRiskDetails(eventData, riskData, riskScore, riskLevelInfo.level);

            // Display score/level with AI content simultaneously
            const riskColorClass = getRekonRiskColorClass(riskScore);
            this.ui.updateRekonRiskDisplay(riskScore, riskLevelInfo.level, riskColorClass, aiRiskDetails);

        } catch (error) {
            console.error('Error generating RekonRisk details:', error);
            const riskColorClass = getRekonRiskColorClass(riskScore);
            this.ui.updateRekonRiskDisplay(riskScore, riskLevelInfo.level, riskColorClass, riskLevelInfo.details);
        }

        // Generate AI content for RekonCompliance details
        try {
            const eventData = this.state.getEventData();
            this.ui.updateStatus('AI is generating compliance analysis...');
            this.ui.updateProgress(98);

            this.ui.showRekonComplianceLoading();

            const aiComplianceDetails = await this.aiService.generateRekonComplianceDetails(eventData, riskData, compliance.status);

            // Display status/icon with AI content simultaneously
            this.ui.updateRekonComplianceDisplay(compliance.status, COMPLIANCE_ICONS[compliance.status] || '', aiComplianceDetails);

        } catch (error) {
            console.error('Error generating RekonCompliance details:', error);
            this.ui.updateRekonComplianceDisplay(compliance.status, COMPLIANCE_ICONS[compliance.status] || '', compliance.details);
        }

        // Finalize progress and enable export
        this.ui.updateProgress(100);
        this.ui.updateStatus('Generation Complete. Review & Export.');
        this.ui.enableExportButton();
    }

    /**
     * Get RekonRisk data for PDF export
     * @param {Array} riskData - Risk data array
     * @returns {Object} RekonRisk data
     */
    getRekonRiskDataForPDF(riskData) {
        const score = this.getRekonRiskScore(riskData);
        const levelInfo = REKON_RISK_LEVELS[score];
        const colorClass = getRekonRiskColorClass(score);
        
        return {
            score,
            level: levelInfo.level,
            details: levelInfo.details,
            colorClass
        };
    }

    /**
     * Get RekonCompliance data for PDF export
     * @param {Array} riskData - Risk data array
     * @returns {Object} RekonCompliance data
     */
    getRekonComplianceDataForPDF(riskData) {
        const compliance = this.getRekonCompliance(riskData);
        
        return {
            status: compliance.status,
            details: compliance.details,
            icon: COMPLIANCE_ICONS[compliance.status] || ''
        };
    }

    /**
     * Get RekonContext data for PDF export
     * @param {Object} eventData - Event data
     * @returns {Object} RekonContext data
     */
    getRekonContextDataForPDF(eventData) {
        const score = this.getRekonContext(eventData.eventType, eventData.venueType, eventData.attendance);
        const levelInfo = REKON_CONTEXT_LEVELS[score];
        const colorClass = getRekonRiskColorClass(score);
        
        return {
            score,
            level: levelInfo.level,
            details: levelInfo.details,
            colorClass
        };
    }
}
