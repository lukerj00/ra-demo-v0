/**
 * PDF Exporter Module
 * Handles PDF generation functionality
 */

import { PDF_CONFIG } from './constants.js';
import { 
    preloadLogo, 
    sanitizeFilename, 
    generateRANumber, 
    getCurrentDateFormatted, 
    formatDateForPDF,
    getComplianceIconBase64
} from './utils.js';

export class PDFExporter {
    constructor(domElements, stateManager, metricsManager) {
        this.dom = domElements;
        this.state = stateManager;
        this.metrics = metricsManager;
    }

    /**
     * Export risk assessment to PDF
     */
    async exportToPDF() {
        this.dom.exportBtn.disabled = true;
        this.dom.exportBtn.textContent = 'Generating PDF...';

        try {
            // Preload logo
            let logoBase64 = this.state.getLogoBase64();
            if (!logoBase64) {
                try {
                    logoBase64 = await preloadLogo();
                    this.state.setLogoBase64(logoBase64);
                } catch (error) {
                    console.error('Failed to load logo for PDF export:', error);
                }
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ 
                orientation: PDF_CONFIG.ORIENTATION, 
                unit: PDF_CONFIG.UNIT, 
                format: PDF_CONFIG.FORMAT 
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const contentWidth = pageWidth - PDF_CONFIG.MARGIN_LEFT - PDF_CONFIG.MARGIN_RIGHT;
            let currentY = PDF_CONFIG.MARGIN_TOP;

            // Add header and content
            this.addHeader(pdf, logoBase64, pageWidth, currentY);
            currentY = PDF_CONFIG.MARGIN_TOP + 30;

            currentY = this.addProjectDetails(pdf, currentY, contentWidth);
            currentY = this.addSummaryAndContext(pdf, currentY, pageWidth, contentWidth);
            currentY = this.addRiskTable(pdf, currentY, contentWidth);
            this.addOverallAssessment(pdf, currentY, contentWidth);

            this.addFooter(pdf, pageWidth);

            // Save PDF
            const projectName = this.state.getProjectName();
            const filename = `${sanitizeFilename(projectName)}_risk_assessment.pdf`;
            pdf.save(filename);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            this.dom.exportBtn.disabled = false;
            this.dom.exportBtn.textContent = 'Export to PDF';
        }
    }

    /**
     * Add header to PDF
     * @param {Object} pdf - jsPDF instance
     * @param {string} logoBase64 - Base64 encoded logo
     * @param {number} pageWidth - Page width
     * @param {number} currentY - Current Y position
     */
    addHeader(pdf, logoBase64, pageWidth, currentY) {
        if (logoBase64) {
            pdf.addImage(logoBase64, 'PNG', PDF_CONFIG.MARGIN_LEFT, PDF_CONFIG.MARGIN_TOP, 40, 15);
        } else {
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text("aiRekon", PDF_CONFIG.MARGIN_LEFT, PDF_CONFIG.MARGIN_TOP + 5);
        }
        
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        pdf.text("Risk Assessment Report", pageWidth / 2, PDF_CONFIG.MARGIN_TOP + 10, { align: 'center' });
        
        const createdDateFormatted = getCurrentDateFormatted();
        const projectName = this.state.getProjectName();
        const raNumber = generateRANumber(projectName);
        
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Date: ${createdDateFormatted}`, pageWidth - PDF_CONFIG.MARGIN_RIGHT, PDF_CONFIG.MARGIN_TOP + 5, { align: 'right' });
        pdf.text(`RA Number: ${raNumber}`, pageWidth - PDF_CONFIG.MARGIN_RIGHT, PDF_CONFIG.MARGIN_TOP + 10, { align: 'right' });
        pdf.setDrawColor(200, 200, 200);
        pdf.line(PDF_CONFIG.MARGIN_LEFT, PDF_CONFIG.MARGIN_TOP + 20, pageWidth - PDF_CONFIG.MARGIN_RIGHT, PDF_CONFIG.MARGIN_TOP + 20);
    }

    /**
     * Add project details section
     * @param {Object} pdf - jsPDF instance
     * @param {number} currentY - Current Y position
     * @param {number} contentWidth - Content width
     * @returns {number} Updated Y position
     */
    addProjectDetails(pdf, currentY, contentWidth) {
        const eventData = this.state.getEventData();
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.text('Project Details', PDF_CONFIG.MARGIN_LEFT, currentY);
        currentY += 8;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        
        const projectInfo = [
            `Event Title: ${eventData.eventTitle || 'N/A'}`,
            `Event Date: ${formatDateForPDF(eventData.eventDate)}`,
            `Location: ${eventData.location || 'N/A'}`,
            `Attendance: ${eventData.attendance ? parseInt(eventData.attendance).toLocaleString() + ' people' : 'N/A'}`,
            `Event Type: ${eventData.eventType || 'N/A'}`,
            `Venue Type: ${eventData.venueType || 'N/A'}`,
            `Risk Level: ${eventData.riskLevel || 'Not assessed'}`
        ];
        
        projectInfo.forEach(detail => {
            this.checkPageBreak(pdf, currentY, 5);
            pdf.text(detail, PDF_CONFIG.MARGIN_LEFT, currentY);
            currentY += 5;
        });
        
        return currentY + 5;
    }

    /**
     * Add summary and context section
     * @param {Object} pdf - jsPDF instance
     * @param {number} currentY - Current Y position
     * @param {number} pageWidth - Page width
     * @param {number} contentWidth - Content width
     * @returns {number} Updated Y position
     */
    addSummaryAndContext(pdf, currentY, pageWidth, contentWidth) {
        this.checkPageBreak(pdf, currentY, 15);
        
        const col1Width = contentWidth * 0.65;
        const gap = contentWidth * 0.05;
        const col2Width = contentWidth * 0.3;
        const col2X = PDF_CONFIG.MARGIN_LEFT + col1Width + gap;
        
        let initialY = currentY;

        // Column 1: Contextual Summary
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.text('Contextual Summary', PDF_CONFIG.MARGIN_LEFT, currentY);
        currentY += 6;

        const summaryParagraphs = Array.from(this.dom.summaryContent.querySelectorAll('p')).map(p => p.innerText);
        const summaryText = summaryParagraphs.join('\n\n');
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(51, 65, 85);
        const summaryLines = pdf.splitTextToSize(summaryText, col1Width);
        summaryLines.forEach(line => {
            this.checkPageBreak(pdf, currentY, 5);
            pdf.text(line, PDF_CONFIG.MARGIN_LEFT, currentY);
            currentY += 5;
        });
        const summaryFinalY = currentY;

        // Column 2: RekonContext
        const eventData = this.state.getEventData();
        const contextData = this.metrics.getRekonContextDataForPDF(eventData);
        
        let contextY = initialY;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.text('RekonContext Index:', col2X, contextY);
        contextY += 10;

        // Draw score with color
        this.setColorFromClass(pdf, contextData.colorClass);
        pdf.setFontSize(22);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(contextData.score), col2X, contextY);

        // Draw '/7' and level
        let scoreWidth = pdf.getTextWidth(String(contextData.score));
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(22);
        pdf.text('/7', col2X + scoreWidth + 1, contextY);
        let slash7Width = pdf.getTextWidth('/7');

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0,0,0);
        pdf.text(`(${contextData.level})`, col2X + scoreWidth + slash7Width + 3, contextY);
        contextY += 7;

        // Draw description bullet points
        const contextText = contextData.details.map(d => `• ${d}`).join('\n');
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(51, 65, 85);
        const contextLines = pdf.splitTextToSize(contextText, col2Width);
        contextLines.forEach(line => {
            this.checkPageBreak(pdf, contextY, 5);
            pdf.text(line, col2X, contextY);
            contextY += 5;
        });
        const contextFinalY = contextY;

        // Update currentY to the bottom of the taller column
        return Math.max(summaryFinalY, contextFinalY) + 8;
    }

    /**
     * Add risk table section
     * @param {Object} pdf - jsPDF instance
     * @param {number} currentY - Current Y position
     * @param {number} contentWidth - Content width
     * @returns {number} Updated Y position
     */
    addRiskTable(pdf, currentY, contentWidth) {
        const riskData = this.state.getRiskData();
        
        if (riskData.length === 0) {
            return currentY;
        }

        this.checkPageBreak(pdf, currentY, 20);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.text('Detailed Risk Table', PDF_CONFIG.MARGIN_LEFT, currentY);
        currentY += 7;

        const tableBodyData = riskData.map(risk => [
            risk.risk,
            risk.category,
            risk.impact.toString(),
            risk.likelihood.toString(),
            (risk.impact * risk.likelihood).toString(),
            risk.mitigation
        ]);

        pdf.autoTable({
            startY: currentY,
            head: [['Risk Description', 'Category', 'Impact', 'Likelihood', 'Overall Score', 'Mitigations']],
            body: tableBodyData,
            theme: 'grid',
            headStyles: { fillColor: [22, 78, 99], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
            bodyStyles: { fontSize: 8, cellPadding: 2, textColor: [0,0,0] },
            columnStyles: {
                0: { cellWidth: 'auto', minCellWidth: 40 }, 
                1: { cellWidth: 20, halign: 'center' }, 
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' }, 
                4: { cellWidth: 18, halign: 'center' }, 
                5: { cellWidth: 'auto', minCellWidth: 45 }
            },
            didParseCell: function(data) {
                if (data.column.index === 4 && data.row.section === 'body') {
                    const score = parseInt(data.cell.raw.toString());
                    if (score >= 15) { 
                        data.cell.styles.fillColor = [254, 226, 226]; 
                        data.cell.styles.textColor = [153, 27, 27]; 
                    } else if (score >= 8) { 
                        data.cell.styles.fillColor = [254, 243, 199]; 
                        data.cell.styles.textColor = [146, 64, 14]; 
                    } else { 
                        data.cell.styles.fillColor = [220, 252, 231]; 
                        data.cell.styles.textColor = [22, 101, 52]; 
                    }
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            margin: { left: PDF_CONFIG.MARGIN_LEFT, right: PDF_CONFIG.MARGIN_RIGHT },
            didDrawPage: (data) => { 
                if (data.pageNumber > 1 && data.cursor.y < PDF_CONFIG.MARGIN_TOP + 30) {
                    this.addHeader(pdf, this.state.getLogoBase64(), pdf.internal.pageSize.getWidth(), PDF_CONFIG.MARGIN_TOP);
                }
            }
        });
        
        return pdf.lastAutoTable.finalY + 10;
    }

    /**
     * Add overall assessment section
     * @param {Object} pdf - jsPDF instance
     * @param {number} currentY - Current Y position
     * @param {number} contentWidth - Content width
     */
    async addOverallAssessment(pdf, currentY, contentWidth) {
        const riskData = this.state.getRiskData();
        const rekonMetricsSection = document.getElementById('rekonMetricsSection');
        
        if (!rekonMetricsSection || rekonMetricsSection.classList.contains('hidden')) {
            return;
        }

        this.checkPageBreak(pdf, currentY, 80);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont(undefined, 'bold');
        pdf.text('Overall Assessment', PDF_CONFIG.MARGIN_LEFT, currentY);
        currentY += 10;
        
        // RekonRisk section
        const riskData_metrics = this.metrics.getRekonRiskDataForPDF(riskData);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('RekonRisk Index:', PDF_CONFIG.MARGIN_LEFT, currentY);
        pdf.setFontSize(22);
        pdf.setFont(undefined, 'bold');
        this.setColorFromClass(pdf, riskData_metrics.colorClass);
        pdf.text(String(riskData_metrics.score), PDF_CONFIG.MARGIN_LEFT + 45, currentY);
        pdf.setTextColor(100, 116, 139);
        pdf.text('/7', PDF_CONFIG.MARGIN_LEFT + 52, currentY);
        pdf.setFontSize(11);
        pdf.setTextColor(0,0,0);
        pdf.setFont(undefined, 'bold');
        pdf.text(`(${riskData_metrics.level})`, PDF_CONFIG.MARGIN_LEFT + 62, currentY);
        currentY += 7;
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        const riskDescText = riskData_metrics.details.map(d => `• ${d}`).join('\n');
        const riskDescLines = pdf.splitTextToSize(riskDescText, contentWidth);
        riskDescLines.forEach(line => { 
            this.checkPageBreak(pdf, currentY, 5); 
            pdf.text(line, PDF_CONFIG.MARGIN_LEFT, currentY); 
            currentY += 5; 
        });
        currentY += 8;

        // RekonCompliance section
        this.checkPageBreak(pdf, currentY, 30);
        const complianceData = this.metrics.getRekonComplianceDataForPDF(riskData);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0,0,0);
        const statusLabel = 'RekonCompliance Status:';
        pdf.text(statusLabel, PDF_CONFIG.MARGIN_LEFT, currentY);

        const statusLabelWidth = pdf.getTextWidth(statusLabel);
        let currentX = PDF_CONFIG.MARGIN_LEFT + statusLabelWidth + 3;

        // Add compliance icon
        const iconBase64 = await getComplianceIconBase64(complianceData.status, { [complianceData.status]: complianceData.icon });
        const iconSize = 8;
        if (iconBase64) {
            pdf.addImage(iconBase64, 'PNG', currentX, currentY - (iconSize / 2) - 1, iconSize, iconSize);
            currentX += iconSize + 2;
        }

        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');

        if (complianceData.status === 'Compliant' || complianceData.status === 'Exceeds Compliance') {
            pdf.setTextColor(22, 163, 74);
        } else {
            pdf.setTextColor(220, 38, 38);
        }

        pdf.text(complianceData.status, currentX, currentY);
        currentY += 10;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');

        const complianceDescText = complianceData.details.map(d => `• ${d}`).join('\n');
        const complianceDescLines = pdf.splitTextToSize(complianceDescText, contentWidth);
        complianceDescLines.forEach(line => {
            this.checkPageBreak(pdf, currentY, 5);
            pdf.text(line, PDF_CONFIG.MARGIN_LEFT, currentY);
            currentY += 5;
        });
    }

    /**
     * Add footer to all pages
     * @param {Object} pdf - jsPDF instance
     * @param {number} pageWidth - Page width
     */
    addFooter(pdf, pageWidth) {
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(128);
            pdf.text(`Page ${i} of ${pageCount} | aiRekon Automated Risk Assessment`, 
                pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    }

    /**
     * Check if page break is needed and add new page if necessary
     * @param {Object} pdf - jsPDF instance
     * @param {number} currentY - Current Y position
     * @param {number} requiredSpace - Required space
     */
    checkPageBreak(pdf, currentY, requiredSpace) {
        if (currentY + requiredSpace > pdf.internal.pageSize.getHeight() - PDF_CONFIG.FOOTER_HEIGHT - PDF_CONFIG.MARGIN_TOP) {
            pdf.addPage();
            this.addHeader(pdf, this.state.getLogoBase64(), pdf.internal.pageSize.getWidth(), PDF_CONFIG.MARGIN_TOP);
        }
    }

    /**
     * Set PDF color from CSS class
     * @param {Object} pdf - jsPDF instance
     * @param {string} colorClass - CSS color class
     */
    setColorFromClass(pdf, colorClass) {
        if (colorClass === 'text-red-600') pdf.setTextColor(220, 38, 38);
        else if (colorClass === 'text-yellow-600') pdf.setTextColor(202, 138, 4);
        else pdf.setTextColor(22, 163, 74);
    }
}
