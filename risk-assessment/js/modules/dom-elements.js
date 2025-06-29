/**
 * DOM Elements Module
 * Centralizes all DOM element references for the Risk Assessment application
 */

export class DOMElements {
    constructor() {
        this.initializeElements();
    }

    initializeElements() {
        // --- Main Screen Elements ---
        this.screen1 = document.getElementById('screen1');
        this.screen2 = document.getElementById('screen2');
        this.setupForm = document.getElementById('setupForm');
        
        // --- Form Input Elements ---
        this.eventTitleInput = document.getElementById('eventTitle');
        this.eventDateInput = document.getElementById('eventDate');
        this.locationInput = document.getElementById('location');
        this.attendanceInput = document.getElementById('attendance');
        this.eventTypeInput = document.getElementById('eventType');
        this.venueTypeInput = document.getElementById('venueType');
        this.riskLevelInput = document.getElementById('riskLevel');
        this.descriptionInput = document.getElementById('description');
        this.generateBtn = document.getElementById('generateBtn');
        
        // --- Report Screen Elements ---
        this.reportScreenTitle = document.getElementById('reportScreenTitle');
        this.reportTitle = document.getElementById('reportTitle');
        this.aiStatus = document.getElementById('aiStatus');
        this.progressBar = document.getElementById('progressBar');
        this.goBackBtn = document.getElementById('goBackBtn');

        // --- Event Card Elements ---
        this.eventCard = document.getElementById('eventCard');
        this.cardEventTitle = document.getElementById('cardEventTitle');
        this.cardEventDate = document.getElementById('cardEventDate');
        this.cardLocation = document.getElementById('cardLocation');
        this.cardAttendance = document.getElementById('cardAttendance');
        this.cardEventType = document.getElementById('cardEventType');
        this.cardVenueType = document.getElementById('cardVenueType');
        this.cardRiskLevel = document.getElementById('cardRiskLevel');
        this.cardDescription = document.getElementById('cardDescription');
        
        // --- Summary Section Elements ---
        this.reportContainer = document.getElementById('reportContainer');
        this.summaryLoader = document.getElementById('summaryLoader');
        this.summaryLoaderText = document.getElementById('summaryLoaderText');
        this.summarySection = document.getElementById('summarySection');
        this.summaryContentWrapper = document.getElementById('summaryContentWrapper');
        this.summaryContent = document.getElementById('summaryContent');
        this.summaryActions = document.getElementById('summaryActions');
        this.acceptSummaryBtn = document.getElementById('acceptSummaryBtn');
        this.editSummaryBtn = document.getElementById('editSummaryBtn');
        this.saveSummaryBtn = document.getElementById('saveSummaryBtn');
        this.summaryJustificationIcon = document.getElementById('summaryJustificationIcon');

        // --- Risk Table Elements ---
        this.riskTableSection = document.getElementById('riskTableSection');
        this.tableLoader = document.getElementById('tableLoader');
        this.riskTableBody = document.getElementById('riskTableBody');
        this.acceptAllBtn = document.getElementById('acceptAllBtn');
        this.generateMoreBtn = document.getElementById('generateMoreBtn');
        this.addCustomRiskBtn = document.getElementById('addCustomRiskBtn');
        this.exportBtn = document.getElementById('exportBtn');

        // --- Justification Pane Elements ---
        this.justificationPane = document.getElementById('justificationPane');
        this.justificationFieldName = document.getElementById('justificationFieldName');
        this.justificationFieldValue = document.getElementById('justificationFieldValue');
        this.justificationReasoning = document.getElementById('justificationReasoning');
        this.justificationSources = document.getElementById('justificationSources');
        this.closeJustificationPaneBtn = document.getElementById('closeJustificationPaneBtn');

        // --- Custom Risk Modal Elements ---
        this.customRiskModal = document.getElementById('customRiskModal');
        this.closeCustomRiskModal = document.getElementById('closeCustomRiskModal');
        this.submitCustomRisk = document.getElementById('submitCustomRisk');
        this.cancelCustomRisk = document.getElementById('cancelCustomRisk');
        this.customRiskForm = document.getElementById('customRiskForm');
        
        // --- RekonCompliance Elements ---
        this.rekonComplianceDescription = document.getElementById('rekonComplianceDescription');
        this.rekonComplianceIcon = document.getElementById('rekonComplianceIcon');

        // --- RekonContext Elements ---
        this.rekonContextSection = document.getElementById('rekonContextSection');
        this.rekonContextScore = document.getElementById('rekonContextScore');
        this.rekonContextSlash = document.getElementById('rekonContextSlash');
        this.rekonContextLevel = document.getElementById('rekonContextLevel');
        this.rekonContextDescription = document.getElementById('rekonContextDescription');
        this.rekonContextLoader = document.getElementById('rekonContextLoader');

        // --- RekonMetrics Elements ---
        this.rekonMetricsSection = document.getElementById('rekonMetricsSection');
        this.rekonRiskScore = document.getElementById('rekonRiskScore');
        this.rekonRiskLevel = document.getElementById('rekonRiskLevel');
        this.rekonRiskDescription = document.getElementById('rekonRiskDescription');
        this.rekonComplianceStatus = document.getElementById('rekonComplianceStatus');
        this.rekonRiskLoader = document.getElementById('rekonRiskLoader');
        this.rekonComplianceLoader = document.getElementById('rekonComplianceLoader');

        // --- File Upload Elements ---
        this.dropZone = document.getElementById('dropZone');
        this.fileUpload = document.getElementById('fileUpload');
        this.fileList = document.getElementById('fileList');

        // --- Help Pane Elements ---
        this.helpIconBtn = document.getElementById('helpIconBtn');
        this.helpPane = document.getElementById('helpPane');
        this.closeHelpPaneBtn = document.getElementById('closeHelpPaneBtn');
    }

    /**
     * Get all form input elements
     * @returns {Object} Object containing all form inputs
     */
    getFormInputs() {
        return {
            eventTitle: this.eventTitleInput,
            eventDate: this.eventDateInput,
            location: this.locationInput,
            attendance: this.attendanceInput,
            eventType: this.eventTypeInput,
            venueType: this.venueTypeInput,
            riskLevel: this.riskLevelInput,
            description: this.descriptionInput
        };
    }

    /**
     * Get all event card elements
     * @returns {Object} Object containing all event card elements
     */
    getEventCardElements() {
        return {
            card: this.eventCard,
            title: this.cardEventTitle,
            date: this.cardEventDate,
            location: this.cardLocation,
            attendance: this.cardAttendance,
            eventType: this.cardEventType,
            venueType: this.cardVenueType,
            riskLevel: this.cardRiskLevel,
            description: this.cardDescription
        };
    }

    /**
     * Get all summary section elements
     * @returns {Object} Object containing all summary elements
     */
    getSummaryElements() {
        return {
            section: this.summarySection,
            content: this.summaryContent,
            actions: this.summaryActions,
            acceptBtn: this.acceptSummaryBtn,
            editBtn: this.editSummaryBtn,
            saveBtn: this.saveSummaryBtn,
            justificationIcon: this.summaryJustificationIcon
        };
    }

    /**
     * Get all risk table elements
     * @returns {Object} Object containing all risk table elements
     */
    getRiskTableElements() {
        return {
            section: this.riskTableSection,
            body: this.riskTableBody,
            loader: this.tableLoader,
            acceptAllBtn: this.acceptAllBtn,
            generateMoreBtn: this.generateMoreBtn,
            addCustomRiskBtn: this.addCustomRiskBtn,
            exportBtn: this.exportBtn
        };
    }
}
