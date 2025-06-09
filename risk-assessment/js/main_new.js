const { jsPDF } = window.jspdf;

        document.addEventListener('DOMContentLoaded', () => {
            // --- DOM Elements ---
            const screen1 = document.getElementById('screen1');
            const screen2 = document.getElementById('screen2');
            const setupForm = document.getElementById('setupForm');
            const projectNameInput = document.getElementById('projectName');
            const responsiblePersonInput = document.getElementById('responsiblePerson');
            const eventDateInput = document.getElementById('eventDate');
            const attendeesInput = document.getElementById('attendees');
            const industryInput = document.getElementById('industry');
            const typeContainer = document.getElementById('type-container');
            const typeInput = document.getElementById('type');
            const generateBtn = document.getElementById('generateBtn');
            
            const reportScreenTitle = document.getElementById('reportScreenTitle');
            const reportTitle = document.getElementById('reportTitle');
            const aiStatus = document.getElementById('aiStatus');
            const progressBar = document.getElementById('progressBar');
            const goBackBtn = document.getElementById('goBackBtn');
            
            const reportContainer = document.getElementById('reportContainer');
            const summarySection = document.getElementById('summarySection');
            const summaryContentWrapper = document.getElementById('summaryContentWrapper');
            const summaryContent = document.getElementById('summaryContent');
            const summaryActions = document.getElementById('summaryActions');
            const acceptSummaryBtn = document.getElementById('acceptSummaryBtn');
            const editSummaryBtn = document.getElementById('editSummaryBtn');
            const saveSummaryBtn = document.getElementById('saveSummaryBtn');
            const summaryJustificationIcon = document.getElementById('summaryJustificationIcon');

            const riskTableSection = document.getElementById('riskTableSection');
            const tableLoader = document.getElementById('tableLoader');
            const riskTableBody = document.getElementById('riskTableBody');
            
            const exportBtn = document.getElementById('exportBtn');
            const acceptAllContainer = document.getElementById('acceptAllContainer');
            const acceptAllBtn = document.getElementById('acceptAllBtn');

            const dropZone = document.getElementById('dropZone');
            const fileUpload = document.getElementById('fileUpload');
            const fileList = document.getElementById('fileList');

            const justificationPane = document.getElementById('justificationPane');
            const closeJustificationPane = document.getElementById('closeJustificationPaneBtn');
            const justificationFieldName = document.getElementById('justificationFieldName');
            const justificationFieldValue = document.getElementById('justificationFieldValue');
            const justificationReasoning = document.getElementById('justificationReasoning');
            const justificationSources = document.getElementById('justificationSources');
            const closeJustificationPaneBtn = document.getElementById('closeJustificationPaneBtn');

            const rekonMetricsSection = document.getElementById('rekonMetricsSection');
            const rekonRiskScore = document.getElementById('rekonRiskScore');
            const rekonRiskLevel = document.getElementById('rekonRiskLevel');
            const rekonRiskDescription = document.getElementById('rekonRiskDescription');
            const rekonComplianceStatus = document.getElementById('rekonComplianceStatus');
            const rekonComplianceDescription = document.getElementById('rekonComplianceDescription');
            const rekonComplianceIcon = document.getElementById('rekonComplianceIcon');

            // --- Help Pane Elements ---
            const helpIconBtn = document.getElementById('helpIconBtn');
            const helpPane = document.getElementById('helpPane');
            const closeHelpPaneBtn = document.getElementById('closeHelpPaneBtn');

            // --- State ---
            let riskData = [];
            let currentProjectName = "";
            let aiRekonLogoBase64 = null; // To store the base64 logo for PDF

            const typeOptions = {
                'Music': ['Outdoor Festival', 'Indoor Concert', 'Nightclub Event', 'Arena Tour', 'Album Launch Party'],
                'Community': ['Street Fair / Fete', 'Charity Fundraiser', 'Local Market', 'Public Rally / Protest', 'Cultural Festival'],
                'State': ['Official Public Ceremony', 'VIP Visit / Dignitary Protection', 'Political Conference', 'National Day Parade', 'State Funeral'],
                'Sport': ['Stadium Match (e.g., Football, Rugby)', 'Marathon / Running Event', 'Motorsport Race', 'Combat Sports Night (e.g., Boxing, MMA)', 'Golf Tournament'],
                'Other': ['Corporate Conference', 'Private Party / Wedding', 'Film Premiere', 'Exhibition / Trade Show', 'Product Launch']
            };

            // --- Preload logo for PDF ---
            const preloadLogo = () => {
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
                                // Changed to image/png for .png file
                                const base64 = canvas.toDataURL('image/png'); 
                                console.log('Logo converted to base64 (PNG), length:', base64.length);
                                aiRekonLogoBase64 = base64;
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

            // Alternative: Embed logo as base64 directly (fallback if canvas method fails)
            // You can convert your logo to base64 using an online tool and paste it here
            const FALLBACK_LOGO_BASE64 = null; // Set this if needed
            
            // Attempt to preload the logo when the script loads, but don't block anything.
            // The actual export will ensure it waits.
            preloadLogo().catch(err => console.warn("Initial logo preload failed, will retry on export:", err));

            industryInput.addEventListener('change', (e) => {
                const selectedIndustry = e.target.value;
                
                typeInput.innerHTML = '';
            
                if (selectedIndustry && typeOptions[selectedIndustry]) {
                    typeContainer.classList.remove('hidden');
                    
                    const defaultOption = document.createElement('option');
                    defaultOption.textContent = 'Select a Type';
                    defaultOption.value = '';
                    typeInput.appendChild(defaultOption);
            
                    typeOptions[selectedIndustry].forEach(type => {
                        const option = document.createElement('option');
                        option.textContent = type;
                        option.value = type;
                        typeInput.appendChild(option);
                    });
                } else {
                    typeContainer.classList.add('hidden');
                }
            });

            // --- Form & File Upload Logic ---
            const validateForm = () => {
                generateBtn.disabled = !projectNameInput.value.trim() || !eventDateInput.value;
            };

            projectNameInput.addEventListener('input', validateForm);
            eventDateInput.addEventListener('input', validateForm);

            const handleFiles = (files) => {
                fileList.innerHTML = '';
                for (const file of files) {
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'flex items-center justify-between bg-zinc-100 p-2 rounded-md text-sm';
                    fileDiv.innerHTML = `
                        <span>${file.name}</span>
                        <button class="text-red-500 hover:text-red-700">&times;</button>
                    `;
                    fileDiv.querySelector('button').onclick = () => fileDiv.remove();
                    fileList.appendChild(fileDiv);
                }
            };
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-blue-500', 'bg-blue-50'); });
            dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('border-blue-500', 'bg-blue-50'); });
            dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('border-blue-500', 'bg-blue-50'); handleFiles(e.dataTransfer.files); });
            fileUpload.addEventListener('change', (e) => handleFiles(e.target.files));

            const resetScreen2 = () => {
                riskData = [];
                
                summaryContent.textContent = '';
                summarySection.classList.add('hidden');
                summaryActions.classList.add('hidden');
                acceptSummaryBtn.innerHTML = '✔ Accept';
                acceptSummaryBtn.disabled = false;
                editSummaryBtn.classList.remove('hidden');
                saveSummaryBtn.classList.add('hidden');
                summaryContent.contentEditable = false;
                summaryContent.classList.remove('table-cell-editing');

                riskTableBody.innerHTML = '';
                riskTableSection.classList.add('hidden');
                
                rekonMetricsSection.classList.add('hidden');

                progressBar.style.width = '0%';
                aiStatus.textContent = 'Initializing...';
                exportBtn.disabled = true;
                acceptAllContainer.classList.add('hidden');
                acceptAllBtn.disabled = false;
            };

            goBackBtn.addEventListener('click', () => {
                screen2.classList.add('hidden');
                screen1.classList.remove('hidden');
                resetScreen2();
            });

            // --- Simulation Logic ---
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            const proceedToRiskGeneration = async () => {
                riskTableSection.classList.remove('hidden');
                riskTableSection.classList.add('fade-in');
                tableLoader.classList.remove('hidden');
                aiStatus.textContent = `Analyzing risks...`;
                
                let currentProgress = parseFloat(progressBar.style.width) || 20;
                const totalRisks = MOCK_RISKS.length;
                const progressForRisks = 80;
                const progressIncrement = totalRisks > 0 ? (progressForRisks / totalRisks) : progressForRisks;

                for (let i = 0; i < totalRisks; i++) {
                    const risk = MOCK_RISKS[i];
                    currentProgress += progressIncrement;
                    progressBar.style.width = `${Math.min(currentProgress, 100)}%`;
                    aiStatus.textContent = `Generating Risk Item ${i + 1} of ${totalRisks}`;
                    await sleep(800);
                    addRiskRow(risk);
                    riskData.push({...risk});
                }
                
                tableLoader.classList.add('hidden');
                
                progressBar.style.width = '100%';
                aiStatus.textContent = "Generation Complete. Review & Export.";
                exportBtn.disabled = false;
                if (riskData.length > 0) {
                    acceptAllContainer.classList.remove('hidden');
                    acceptAllContainer.classList.add('fade-in');
                }
            };

            const startGeneration = async () => {
                currentProjectName = projectNameInput.value.trim();
                screen1.classList.add('hidden');
                reportScreenTitle.textContent = `aiRekon Automated Risk Assessment`;

                let eventDateFormatted = 'N/A';
                if (eventDateInput.value) {
                    const dateParts = eventDateInput.value.split('-'); // YYYY-MM-DD
                    if (dateParts.length === 3) {
                        eventDateFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0].slice(-2)}`;
                    }
                }
                reportTitle.textContent = `Risk Assessment Report for: ${currentProjectName} on ${eventDateFormatted}`;
                screen2.classList.remove('hidden');
                resetScreen2();

                aiStatus.textContent = "Generating Initial Summary...";
                progressBar.style.width = '10%';
                await sleep(1000);
                
                const eventDateValue = eventDateInput.value ? new Date(eventDateInput.value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'an unspecified date';
                const industryValue = document.getElementById('industry').value || 'general';
                const typeValue = document.getElementById('type').value;
                const scopeValue = document.getElementById('projectScope').value.trim();
                const attendeesNumValue = attendeesInput.value;

                let attendeesString = "";
                if (attendeesNumValue && parseInt(attendeesNumValue) > 0) {
                    attendeesString = `It is anticipated to involve approximately ${attendeesNumValue} attendees. `;
                } else {
                    attendeesString = "The scale of attendance is not specified. ";
                }

                const projectScopeString = scopeValue ? scopeValue : "achieving its stated goals as outlined in the project documentation";
                const projectNatureString = scopeValue ? `the specifics of '${scopeValue.substring(0, 50)}${scopeValue.length > 50 ? '...' : ''}' and the context of the ${industryValue} sector` : `its general operational requirements and the context of the ${industryValue} sector`;
                const projectTypeString = (typeValue && typeValue !== '') ? `${typeValue}` : `${industryValue} initiative`;

                let dynamicSummary = MOCK_SUMMARY_TEMPLATE
                    .replace(/{projectName}/g, currentProjectName)
                    .replace(/{projectType}/g, projectTypeString)
                    .replace(/{eventDate}/g, eventDateValue)
                    .replace(/{attendeesInfo}/g, attendeesString)
                    .replace(/{projectScopeInfo}/g, projectScopeString)
                    .replace(/{projectNature}/g, projectNatureString);

                summarySection.classList.remove('hidden');
                summarySection.classList.add('fade-in');
                summaryContent.innerHTML = dynamicSummary;
                summaryActions.classList.remove('hidden');
                progressBar.style.width = '20%';

                aiStatus.textContent = "Awaiting summary review...";
            };

            generateBtn.addEventListener('click', startGeneration);

            // --- Summary Actions ---
            acceptSummaryBtn.addEventListener('click', async () => {
                summaryContent.classList.remove('table-cell-editing');
                summaryContent.contentEditable = false;
                acceptSummaryBtn.innerHTML = '✔ Accepted';
                acceptSummaryBtn.disabled = true;
                editSummaryBtn.classList.add('hidden');
                saveSummaryBtn.classList.add('hidden');

                await proceedToRiskGeneration();
            });

            editSummaryBtn.addEventListener('click', () => {
                summaryContent.contentEditable = true;
                summaryContent.classList.add('table-cell-editing');
                summaryContent.focus();
                editSummaryBtn.classList.add('hidden');
                saveSummaryBtn.classList.remove('hidden');
            });

            saveSummaryBtn.addEventListener('click', () => {
                summaryContent.contentEditable = false;
                summaryContent.classList.remove('table-cell-editing');
                editSummaryBtn.classList.remove('hidden');
                saveSummaryBtn.classList.add('hidden');
            });

            // --- Accept All Risks ---
            acceptAllBtn.addEventListener('click', () => {
                const rows = riskTableBody.querySelectorAll('tr');
                rows.forEach(row => {
                    const actionsCell = row.cells[row.cells.length - 1]; // Last cell is Actions
                    if (!actionsCell.querySelector('span.text-green-700')) {
                        row.classList.remove('table-row-new');
                        row.classList.add('table-row-accepted');
                        actionsCell.innerHTML = '<span class="text-sm text-green-700 font-semibold">Accepted</span>';
                    }
                });
                acceptAllBtn.disabled = true;
                checkAndDisplayMetrics();
            });            

            // --- Table & Chart Logic ---
            const getScoreColor = (score) => {
                if (score >= 15) return 'bg-red-100 text-red-800';
                if (score >= 8) return 'bg-yellow-100 text-yellow-800';
                return 'bg-green-100 text-green-800';
            };

            const addRiskRow = (risk) => {
                const row = document.createElement('tr');
                row.className = 'table-row-new fade-in';
                row.dataset.id = risk.id;
                const overallScore = risk.impact * risk.likelihood;

                // Helper to create content with justification icon
                const createCellContent = (content, fieldName, riskId, isNumeric = false) => {
                    let displayContent = content;
                    // Ensure N/A is used for undefined/null/empty numeric fields, otherwise convert numbers to string
                    if (isNumeric) {
                        displayContent = (content === undefined || content === null || content.toString().trim() === '') ? 'N/A' : content.toString();
                    } else if (content === undefined || content === null) {
                        displayContent = ''; // Default to empty string for non-numeric if undefined/null
                    }

                    return `<div>${displayContent}</div><span class="justification-plus-icon" data-field-name="${fieldName}" data-risk-id="${riskId}" title="View Justification">+</span>`;
                };

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
                riskTableBody.appendChild(row);
            };
            
            riskTableBody.addEventListener('click', (e) => {
                const button = e.target.closest('button');
                const justificationIcon = e.target.closest('.justification-plus-icon');

                if (justificationIcon) {
                    const fieldName = justificationIcon.dataset.fieldName;
                    const riskId = parseInt(justificationIcon.dataset.riskId, 10);
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
                            fieldValue = overall.toString(); // Ensure fieldValue is accurate for display
                            reasoning = `The Overall Score (${overall}) is calculated by multiplying Impact (${currentRisk.impact}) by Likelihood (${currentRisk.likelihood}).`;
                            sources = ['Risk Scoring Matrix', 'Internal Calculation Logic'];
                        } else {
                            // For other fields, get fieldValue from currentRisk if not already found or to ensure accuracy
                            if (fieldName === 'Risk Description') fieldValue = currentRisk.risk;
                            else if (fieldName === 'Category') fieldValue = currentRisk.category;
                            else if (fieldName === 'Impact') fieldValue = currentRisk.impact.toString();
                            else if (fieldName === 'Likelihood') fieldValue = currentRisk.likelihood.toString();
                            else if (fieldName === 'Mitigations') fieldValue = currentRisk.mitigation;
                            // else fieldValue remains what was grabbed from contentWrapper or default 'N/A'

                            // Set detailed placeholder reasoning and sources for these other fields
                            reasoning = `The value for "${fieldName}" (risk ID: ${riskId}) was determined based on an algorithmic assessment of the input documents and established risk ontologies for this sector. Specific keywords and contextual phrases related to potential threats and vulnerabilities were identified and scored. For numeric values, this involved a quantitative model considering frequency and potential severity. For textual descriptions, generative models summarized identified risk factors and proposed standard mitigation techniques.`;
                            sources = ['Uploaded Document Example.pdf', 'Risk Analysis Model v3.1 Output', 'General Industry Best Practices'];
                        }
                    } else {
                        // Fallback if currentRisk is not found (e.g. if data is somehow corrupt or ID is wrong)
                        reasoning = `Justification for "${fieldName}" (risk ID: ${riskId}) could not be fully determined as the specific risk data was not found. This value is based on general UI display.`;
                        sources = ['UI Display Data'];
                    }

                    openJustificationPane(fieldName, fieldValue, reasoning, sources);
                    return; 
                }

                if (!button) return;

                const action = button.dataset.action;
                const row = button.closest('tr');
                const id = parseInt(row.dataset.id, 10);
                const riskItem = riskData.find(r => r.id === id);
                
                if (action === 'accept') {
                    row.classList.remove('table-row-new');
                    row.classList.add('table-row-accepted');
                    button.parentElement.innerHTML = '<span class="text-sm text-green-700 font-semibold">Accepted</span>';
                    checkAndDisplayMetrics();
                } else if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this risk?')) {
                        row.remove();
                        riskData = riskData.filter(r => r.id !== id);
                        checkAndDisplayMetrics();
                    }
                } else if (action === 'edit') {
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
                } else if (action === 'save') {
                    row.querySelectorAll('[data-field]').forEach(cell => {
                        cell.contentEditable = false;
                        cell.classList.remove('table-cell-editing');
                    });
                    
                    if (riskItem) {
                         riskItem.risk = row.querySelector('[data-field="risk"]').textContent;
                         riskItem.category = row.querySelector('[data-field="category"]').textContent;
                         riskItem.impact = parseInt(row.querySelector('[data-field="impact"]').textContent, 10) || riskItem.impact;
                         riskItem.likelihood = parseInt(row.querySelector('[data-field="likelihood"]').textContent, 10) || riskItem.likelihood;
                         riskItem.mitigation = row.querySelector('[data-field="mitigation"]').textContent;
                         
                         const newOverall = riskItem.impact * riskItem.likelihood;
                         const overallCell = row.querySelector('[data-field="overall"]');
                         overallCell.textContent = newOverall;
                         overallCell.className = `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getScoreColor(newOverall)}`;
                    }

                    row.querySelector('[data-action="edit"]').classList.remove('hidden');
                    row.querySelector('[data-action="accept"]').classList.remove('hidden');
                    row.querySelector('[data-action="delete"]').classList.remove('hidden');
                    row.querySelector('[data-action="save"]').classList.add('hidden');
                }
            });

            const checkAndDisplayMetrics = () => {
                const totalRisks = riskTableBody.querySelectorAll('tr').length;
                const acceptedRisks = riskTableBody.querySelectorAll('.table-row-accepted').length;
            
                if (totalRisks > 0 && totalRisks === acceptedRisks) {
                    displayRekonMetrics();
                } else {
                    rekonMetricsSection.classList.add('hidden');
                }
            };

            const REKON_RISK_LEVELS = {
                1: { level: 'Negligible', description: 'Event poses minimal threat. No disruption expected. No action required beyond routine monitoring.' },
                2: { level: 'Very Low', description: 'Minor risk exposure. Unlikely to cause disruption or require dedicated resources. Some mitigations advised.' },
                3: { level: 'Low', description: 'Low-level risk profile. Limited potential for disruption. Some mitigations required, and active monitoring advised.' },
                4: { level: 'Moderate', description: 'Moderate risk exposure. Potential for localized or short-term disruption. Mitigations and active monitoring required.' },
                5: { level: 'High', description: 'Significant risk exposure. May disrupt operations or impact outcomes. Robust mitigations and active monitoring required.' },
                6: { level: 'Very High', description: 'Severe risk profile. High likelihood of serious disruption or harm. Heavy mitigations and careful active monitoring required.' },
                7: { level: 'Critical', description: 'Extreme risk exposure. Immediate or ongoing threat with major consequences. Extensive mitigations and careful active monitoring required.' }
            };

            const COMPLIANCE_ICONS = {
                'Non-Compliant': `<svg class="w-full h-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
                'Compliant': `<svg class="w-full h-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
                'Exceeds Compliance': `<svg class="w-full h-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15L15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.25 9.75L16.5 12l-2.25 2.25" /></svg>`
            };

            const getRekonRiskScore = (risks) => {
                if (!risks || risks.length === 0) {
                    return 1; // Default to negligible if no risks
                }
                const maxScore = risks.reduce((max, r) => {
                    const score = r.impact * r.likelihood;
                    return score > max ? score : max;
                }, 0);

                if (maxScore >= 23) return 7; // Critical
                if (maxScore >= 20) return 6; // Very High
                if (maxScore >= 15) return 5; // High
                if (maxScore >= 10) return 4; // Moderate
                if (maxScore >= 7) return 3;  // Low
                if (maxScore >= 4) return 2;  // Very Low
                return 1; // Negligible
            };

            const getRekonRiskColorClass = (score) => {
                if (score >= 5) return 'text-red-600'; // High, Very High, Critical
                if (score === 4) return 'text-yellow-600'; // Moderate
                return 'text-green-600'; // Low, Very Low, Negligible
            }

            const getRekonCompliance = (risks) => {
                const hasSecurityRisks = risks.some(r => r.category === 'Security');
                const hasHighImpactSecurityRisk = risks.some(r => r.category === 'Security' && r.impact >= 4);

                if (hasHighImpactSecurityRisk) {
                    return {
                        status: 'Compliant',
                        description: "The assessment identifies significant security risks in line with regulatory expectations (e.g., Martyn's Law). The proposed mitigations, such as comprehensive screening and emergency service liaison, satisfy core compliance requirements for an event of this scale."
                    };
                }
                if (hasSecurityRisks) {
                    return {
                        status: 'Compliant',
                        description: "Security risks have been identified and mitigated. The assessment is broadly in line with standard compliance requirements for public events."
                    };
                }
                return {
                    status: 'Non-Compliant',
                    description: "The assessment fails to identify or mitigate key security risks, potentially falling short of regulatory requirements like Martyn's Law. A full review of security planning is urgently required."
                };
            };

            const displayRekonMetrics = () => {
                const score = getRekonRiskScore(riskData);
                const compliance = getRekonCompliance(riskData);
                const levelInfo = REKON_RISK_LEVELS[score];

                rekonRiskScore.textContent = score;
                rekonRiskScore.className = `text-5xl font-bold ${getRekonRiskColorClass(score)}`;
                rekonRiskLevel.textContent = levelInfo.level;
                rekonRiskDescription.textContent = levelInfo.description;

                rekonComplianceStatus.textContent = compliance.status;
                rekonComplianceDescription.textContent = compliance.description;
                rekonComplianceIcon.innerHTML = COMPLIANCE_ICONS[compliance.status] || '';

                rekonComplianceStatus.className = 'text-2xl font-bold'; // Reset color class

                rekonMetricsSection.classList.remove('hidden');
                rekonMetricsSection.classList.add('fade-in');
            };

            // --- Justification Pane Logic ---
            const openJustificationPane = (fieldName, fieldValue, reasoning, sources) => {
                justificationFieldName.textContent = fieldName;

                if (fieldName === 'Contextual Summary') {
                    justificationFieldValue.innerHTML = ''; // Clear content
                    justificationFieldValue.style.display = 'none'; // Hide the element
                } else {
                    justificationFieldValue.textContent = fieldValue; // Set text for other fields
                    justificationFieldValue.style.display = ''; // Ensure element is visible and reset display property
                }

                justificationReasoning.textContent = reasoning;
                justificationSources.innerHTML = '';
                if (sources && sources.length > 0) {
                    sources.forEach(src => {
                        const li = document.createElement('li');
                        li.textContent = src;
                        justificationSources.appendChild(li);
                    });
                } else {
                    justificationSources.innerHTML = '<li>No specific documents cited.</li>';
                }
                justificationPane.classList.remove('hidden');
                setTimeout(() => {
                    justificationPane.style.transform = 'translateX(0)';
                }, 10); 
            };

            const hideJustificationPaneAndResetTransform = () => {
                justificationPane.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    justificationPane.classList.add('hidden');
                }, 300); // Matches transition duration
            };

            if (closeJustificationPaneBtn) {
                console.log("Close Justification Pane button (id='closeJustificationPaneBtn') found, attaching listener."); // Diagnostic log
                closeJustificationPaneBtn.addEventListener('click', hideJustificationPaneAndResetTransform);
            } else {
                console.error("Error: Close Justification Pane button with id='closeJustificationPaneBtn' NOT found. Please check the button ID in your HTML."); // Diagnostic log
            }

            summaryJustificationIcon.addEventListener('click', () => {
                openJustificationPane(
                    'Contextual Summary',
                    summaryContent.innerHTML,
                    'The summary was generated based on the project details provided and a comprehensive analysis of similar initiatives in the industry. It provides an overview of the event characteristics and historical context, highlighting key considerations for the current project.',
                    ['Project Details', 'Industry Best Practices', 'Historical Data']
                );
            });

            // --- PDF Export Logic ---
            const exportToPDF = async () => {
                exportBtn.disabled = true;
                exportBtn.textContent = 'Generating PDF...';
        
                let localLogoBase64 = aiRekonLogoBase64;
                if (!localLogoBase64) {
                    try {
                        localLogoBase64 = await preloadLogo();
                    } catch (error) {
                        console.error('Failed to load logo for PDF export:', error);
                    }
                }
        
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const marginLeft = 15;
                const marginRight = 15;
                const marginTop = 15;
                const footerHeight = 20;
                const contentWidth = pageWidth - marginLeft - marginRight;
                let currentY = marginTop;
        
                const addHeader = () => {
                    if (localLogoBase64) {
                        pdf.addImage(localLogoBase64, 'PNG', marginLeft, marginTop, 40, 15);
                    } else {
                        pdf.setFontSize(10);
                        pdf.setTextColor(150, 150, 150);
                        pdf.text("aiRekon", marginLeft, marginTop + 5);
                    }
                    pdf.setFontSize(16);
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFont(undefined, 'bold');
                    pdf.text("Risk Assessment Report", pageWidth / 2, marginTop + 10, { align: 'center' });
                    
                    const currentDate = new Date();
                    const createdDateFormatted = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getFullYear()).slice(-2)}`;
                    const projectNameSanitized = currentProjectName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 5);
                    const raNumber = `${projectNameSanitized}-${String(currentDate.getFullYear()).slice(-2)}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getSeconds()).padStart(2, '0')}`;
                    
                    pdf.setFontSize(9);
                    pdf.setTextColor(100, 100, 100);
                    pdf.setFont(undefined, 'normal');
                    pdf.text(`Date: ${createdDateFormatted}`, pageWidth - marginRight, marginTop + 5, { align: 'right' });
                    pdf.text(`RA Number: ${raNumber}`, pageWidth - marginRight, marginTop + 10, { align: 'right' });
                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(marginLeft, marginTop + 20, pageWidth - marginRight, marginTop + 20);
                    currentY = marginTop + 30;
                };
        
                const addFooter = () => {
                    const pageCount = pdf.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(9);
                        pdf.setTextColor(128);
                        pdf.text(`Page ${i} of ${pageCount} | aiRekon Automated Risk Assessment`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
                    }
                };
        
                const checkPageBreak = (requiredSpace) => {
                    if (currentY + requiredSpace > pdf.internal.pageSize.getHeight() - footerHeight - marginTop) {
                        pdf.addPage();
                        addHeader();
                    }
                };
        
                addHeader();
        
                // Project Details
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(13);
                pdf.setFont(undefined, 'bold');
                pdf.text('Project Details', marginLeft, currentY);
                currentY += 8;
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'normal');
                const projectInfo = [
                    `Project Name: ${currentProjectName || 'N/A'}`,
                    `Responsible Person: ${responsiblePersonInput.value.trim() || 'N/A'}`,
                    `Date of Event: ${eventDateInput.value ? new Date(eventDateInput.value).toLocaleDateString('en-GB') : 'N/A'}`,
                    `Number of Attendees: ${attendeesInput.value || 'N/A'}`,
                    `Industry/Sector: ${document.getElementById('industry').value || 'N/A'}`,
                    `Type: ${document.getElementById('type').value || 'N/A'}`
                ];
                projectInfo.forEach(detail => {
                    checkPageBreak(5);
                    pdf.text(detail, marginLeft, currentY);
                    currentY += 5;
                });
        
                // Contextual Summary
                checkPageBreak(15);
                currentY += 5;
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(13);
                pdf.setFont(undefined, 'bold');
                pdf.text('Contextual Summary', marginLeft, currentY);
                currentY += 8;
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'normal');
                const summaryLines = pdf.splitTextToSize(summaryContent.textContent, contentWidth);
                summaryLines.forEach(line => {
                    checkPageBreak(6);
                    pdf.text(line, marginLeft, currentY);
                    currentY += 6;
                });
                currentY += 8;
        
                // Detailed Risk Assessment Table
                if (riskData.length > 0) {
                    checkPageBreak(20); 
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('Detailed Risk Assessment', marginLeft, currentY);
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
                            0: { cellWidth: 'auto', minCellWidth: 40 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' },
                            3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 18, halign: 'center' }, 5: { cellWidth: 'auto', minCellWidth: 45 }
                        },
                        didParseCell: function(data) {
                            if (data.column.index === 4 && data.row.section === 'body') {
                                const score = parseInt(data.cell.raw.toString());
                                if (score >= 15) { data.cell.styles.fillColor = [254, 226, 226]; data.cell.styles.textColor = [153, 27, 27]; }
                                else if (score >= 8) { data.cell.styles.fillColor = [254, 243, 199]; data.cell.styles.textColor = [146, 64, 14]; }
                                else { data.cell.styles.fillColor = [220, 252, 231]; data.cell.styles.textColor = [22, 101, 52]; }
                                data.cell.styles.fontStyle = 'bold';
                            }
                        },
                        margin: { left: marginLeft, right: marginRight },
                        didDrawPage: (data) => { if (data.pageNumber > 1 && data.cursor.y < marginTop + 30) addHeader(); }
                    });
                    currentY = pdf.lastAutoTable.finalY + 10;
                }
        
                // Overall Assessment Section
                if (rekonMetricsSection && !rekonMetricsSection.classList.contains('hidden')) {
                    checkPageBreak(80);
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('Overall Assessment', marginLeft, currentY);
                    currentY += 10;
                    
                    const rekonRiskVal = getRekonRiskScore(riskData);
                    const rekonRiskInfo = REKON_RISK_LEVELS[rekonRiskVal];
                    pdf.setFontSize(11);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('RekonRisk Index', marginLeft, currentY);
                    pdf.setFontSize(22);
                    pdf.setFont(undefined, 'bold');
                    const riskColor = getRekonRiskColorClass(rekonRiskVal);
                    if (riskColor === 'text-red-600') pdf.setTextColor(220, 38, 38);
                    else if (riskColor === 'text-yellow-600') pdf.setTextColor(202, 138, 4);
                    else pdf.setTextColor(22, 163, 74);
                    pdf.text(String(rekonRiskVal), marginLeft + 45, currentY);
                    pdf.setTextColor(100, 116, 139);
                    pdf.text('/7', marginLeft + 52, currentY);
                    pdf.setFontSize(11);
                    pdf.setTextColor(0,0,0);
                    pdf.setFont(undefined, 'bold');
                    pdf.text(`(${rekonRiskInfo.level})`, marginLeft + 62, currentY);
                    currentY += 7;
                    pdf.setFontSize(9);
                    pdf.setFont(undefined, 'normal');
                    const riskDescLines = pdf.splitTextToSize(rekonRiskInfo.description, contentWidth);
                    riskDescLines.forEach(line => { checkPageBreak(5); pdf.text(line, marginLeft, currentY); currentY += 5; });
                    currentY += 8;
        
                    checkPageBreak(30);
                    const rekonComplianceInfo = getRekonCompliance(riskData);
                    pdf.setFontSize(11);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('RekonCompliance Status', marginLeft, currentY);
                    currentY += 7;
                    pdf.setFontSize(10);
                    pdf.setFont(undefined, 'bold');
                    if (rekonComplianceInfo.status === 'Compliant' || rekonComplianceInfo.status === 'Exceeds Compliance') pdf.setTextColor(22, 163, 74);
                    else pdf.setTextColor(220, 38, 38);
                    let statusText = '';
                    if (rekonComplianceInfo.status === 'Non-Compliant') statusText = '[X] ';
                    if (rekonComplianceInfo.status === 'Compliant') statusText = '[✓] ';
                    if (rekonComplianceInfo.status === 'Exceeds Compliance') statusText = '[✓✓] ';
                    statusText += rekonComplianceInfo.status;
                    pdf.text(statusText, marginLeft, currentY);
                    currentY += 7;
                    pdf.setTextColor(0,0,0);
                    pdf.setFontSize(9);
                    pdf.setFont(undefined, 'normal');
                    const complianceDescLines = pdf.splitTextToSize(rekonComplianceInfo.description, contentWidth);
                    complianceDescLines.forEach(line => { checkPageBreak(5); pdf.text(line, marginLeft, currentY); currentY += 5; });
                }
        
                addFooter();
                pdf.save(`${currentProjectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_risk_assessment.pdf`);
                exportBtn.disabled = false;
                exportBtn.textContent = 'Export to PDF';
            };
        
            exportBtn.addEventListener('click', exportToPDF);

            // --- Help Pane Logic ---
            const openHelpPane = () => {
                helpPane.classList.remove('hidden');
                setTimeout(() => {
                    helpPane.style.transform = 'translateX(0)';
                }, 10);
            };

            const hideHelpPaneAndResetTransform = () => {
                helpPane.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    helpPane.classList.add('hidden');
                }, 300); // Matches transition duration
            };

            if (helpIconBtn) {
                helpIconBtn.addEventListener('click', openHelpPane);
            } else {
                console.error("Help Icon Button (expected id 'helpIconBtn') not found.");
            }

            if (closeHelpPaneBtn) {
                closeHelpPaneBtn.addEventListener('click', hideHelpPaneAndResetTransform);
            } else {
                console.error("Close Help Pane Button (expected id 'closeHelpPaneBtn') not found.");
            }
        }); 