/**
 * PDF Export Module
 * Handles PDF generation and export functionality
 */

export class PDFExporter {
    constructor(domElements, stateManager) {
        this.dom = domElements;
        this.state = stateManager;
        this.jsPDF = window.jspdf.jsPDF;
    }

    /**
     * Export risk assessment to PDF
     */
    async exportToPDF() {
        this.dom.exportBtn.disabled = true;
        this.dom.exportBtn.textContent = 'Generating PDF...';

        try {
            let localLogoBase64 = this.state.getLogoBase64();

            // Try to load logo if not already loaded
            if (!localLogoBase64) {
                try {
                    localLogoBase64 = await this.preloadLogo();
                    this.state.setLogoBase64(localLogoBase64);
                } catch (logoError) {
                    console.warn("Could not load logo for PDF:", logoError);
                }
            }

            const doc = new this.jsPDF();
            const eventData = this.state.getEventData();
            const risks = this.state.getRiskData();

            // Add logo if available
            if (localLogoBase64) {
                try {
                    doc.addImage(localLogoBase64, 'PNG', 15, 15, 30, 15);
                } catch (logoError) {
                    console.warn("Could not add logo to PDF:", logoError);
                }
            }

            // Title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Risk Assessment Report', 15, localLogoBase64 ? 45 : 25);

            // Event details
            let yPos = localLogoBase64 ? 60 : 40;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Event Details', 15, yPos);

            yPos += 10;
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');

            const eventDetails = [
                `Event: ${eventData.eventTitle}`,
                `Date: ${this.formatDate(eventData.eventDate)}`,
                `Location: ${eventData.location}`,
                `Attendance: ${eventData.attendance?.toLocaleString()} people`,
                `Event Type: ${eventData.eventType}`,
                `Venue Type: ${eventData.venueType}`,
                `Risk Level: ${eventData.riskLevel}`
            ];

            eventDetails.forEach(detail => {
                doc.text(detail, 15, yPos);
                yPos += 6;
            });

            if (eventData.description) {
                yPos += 5;
                doc.text('Description:', 15, yPos);
                yPos += 6;
                const descriptionLines = doc.splitTextToSize(eventData.description, 180);
                doc.text(descriptionLines, 15, yPos);
                yPos += descriptionLines.length * 6;
            }

            // Summary section
            yPos += 15;
            if (yPos > 250) {
                doc.addPage();
                yPos = 25;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Executive Summary', 15, yPos);

            yPos += 10;
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');

            const summaryText = this.dom.summaryContent.textContent || 'Summary not available';
            const summaryLines = doc.splitTextToSize(summaryText, 180);
            doc.text(summaryLines, 15, yPos);
            yPos += summaryLines.length * 6;

            // Risk assessment table
            yPos += 15;
            if (yPos > 200) {
                doc.addPage();
                yPos = 25;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Risk Assessment', 15, yPos);

            yPos += 15;

            // Table headers
            const headers = ['ID', 'Risk Description', 'Category', 'Impact', 'Likelihood', 'Score', 'Mitigation'];
            const colWidths = [10, 50, 25, 15, 20, 15, 55];
            let xPos = 15;

            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');

            headers.forEach((header, index) => {
                doc.text(header, xPos, yPos);
                xPos += colWidths[index];
            });

            yPos += 8;

            // Table rows
            doc.setFont(undefined, 'normal');
            risks.forEach((risk, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 25;
                    
                    // Repeat headers on new page
                    xPos = 15;
                    doc.setFont(undefined, 'bold');
                    headers.forEach((header, headerIndex) => {
                        doc.text(header, xPos, yPos);
                        xPos += colWidths[headerIndex];
                    });
                    yPos += 8;
                    doc.setFont(undefined, 'normal');
                }

                xPos = 15;
                const rowData = [
                    risk.id.toString(),
                    risk.risk,
                    risk.category,
                    risk.impact.toString(),
                    risk.likelihood.toString(),
                    (risk.impact * risk.likelihood).toString(),
                    risk.mitigation
                ];

                rowData.forEach((data, colIndex) => {
                    if (colIndex === 1 || colIndex === 6) { // Risk description and mitigation
                        const lines = doc.splitTextToSize(data, colWidths[colIndex] - 2);
                        doc.text(lines, xPos, yPos);
                        if (lines.length > 1) {
                            yPos += (lines.length - 1) * 4;
                        }
                    } else {
                        doc.text(data, xPos, yPos);
                    }
                    xPos += colWidths[colIndex];
                });

                yPos += 8;
            });

            // Risk statistics
            yPos += 15;
            if (yPos > 250) {
                doc.addPage();
                yPos = 25;
            }

            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('Risk Statistics', 15, yPos);

            yPos += 10;
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');

            const stats = this.calculateRiskStatistics(risks);
            const statsText = [
                `Total Risks Identified: ${stats.totalRisks}`,
                `Average Risk Score: ${stats.averageScore}`,
                `High Risk (≥15): ${stats.highRisks}`,
                `Medium Risk (8-14): ${stats.mediumRisks}`,
                `Low Risk (<8): ${stats.lowRisks}`
            ];

            statsText.forEach(stat => {
                doc.text(stat, 15, yPos);
                yPos += 6;
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text(`Generated by aiRekon - Page ${i} of ${pageCount}`, 15, 285);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 150, 285);
            }

            // Save the PDF
            const fileName = `Risk_Assessment_${eventData.eventTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            console.log('✅ PDF exported successfully');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            this.dom.exportBtn.disabled = false;
            this.dom.exportBtn.textContent = 'Export to PDF';
        }
    }

    /**
     * Preload logo for PDF
     * @returns {Promise<string>} Base64 encoded logo
     */
    preloadLogo() {
        return new Promise((resolve, reject) => {
            try {
                console.log('Attempting to load logo: assets/images/airekon.png');
                
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        ctx.drawImage(img, 0, 0);
                        const base64 = canvas.toDataURL('image/png');
                        
                        console.log('✅ Logo loaded successfully for PDF');
                        resolve(base64);
                    } catch (canvasError) {
                        console.warn('Canvas processing failed:', canvasError);
                        reject(canvasError);
                    }
                };
                
                img.onerror = (error) => {
                    console.warn('Logo image failed to load:', error);
                    reject(error);
                };
                
                img.src = 'assets/images/airekon.png';
                
            } catch (error) {
                console.warn('Logo preload setup failed:', error);
                reject(error);
            }
        });
    }

    /**
     * Calculate risk statistics
     * @param {Array} risks - Array of risk objects
     * @returns {Object} Risk statistics
     */
    calculateRiskStatistics(risks) {
        if (risks.length === 0) {
            return {
                totalRisks: 0,
                averageScore: 0,
                highRisks: 0,
                mediumRisks: 0,
                lowRisks: 0
            };
        }

        const scores = risks.map(risk => risk.impact * risk.likelihood);
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const averageScore = totalScore / scores.length;

        const highRisks = scores.filter(score => score >= 15).length;
        const mediumRisks = scores.filter(score => score >= 8 && score < 15).length;
        const lowRisks = scores.filter(score => score < 8).length;

        return {
            totalRisks: risks.length,
            averageScore: Math.round(averageScore * 10) / 10,
            highRisks,
            mediumRisks,
            lowRisks
        };
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
     * Setup PDF export event listeners
     */
    setupEventListeners() {
        this.dom.exportBtn.addEventListener('click', () => {
            this.exportToPDF();
        });
    }
}
