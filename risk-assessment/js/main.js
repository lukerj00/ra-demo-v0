const { jsPDF } = window.jspdf;

        document.addEventListener('DOMContentLoaded', () => {
            // --- DOM Elements ---
            const screen1 = document.getElementById('screen1');
            const screen2 = document.getElementById('screen2');
            const setupForm = document.getElementById('setupForm');
            const eventTitleInput = document.getElementById('eventTitle');
            const eventDateInput = document.getElementById('eventDate');
            const locationInput = document.getElementById('location');
            const attendanceInput = document.getElementById('attendance');
            const eventTypeInput = document.getElementById('eventType');
            const venueTypeInput = document.getElementById('venueType');
            const riskLevelInput = document.getElementById('riskLevel');
            const descriptionInput = document.getElementById('description');
            const generateBtn = document.getElementById('generateBtn');
            
            const reportScreenTitle = document.getElementById('reportScreenTitle');
            const reportTitle = document.getElementById('reportTitle');
            const aiStatus = document.getElementById('aiStatus');
            const progressBar = document.getElementById('progressBar');
            const goBackBtn = document.getElementById('goBackBtn');

            // Event Card Elements
            const eventCard = document.getElementById('eventCard');
            const cardEventTitle = document.getElementById('cardEventTitle');
            const cardEventDate = document.getElementById('cardEventDate');
            const cardLocation = document.getElementById('cardLocation');
            const cardAttendance = document.getElementById('cardAttendance');
            const cardEventType = document.getElementById('cardEventType');
            const cardVenueType = document.getElementById('cardVenueType');
            const cardRiskLevel = document.getElementById('cardRiskLevel');
            const cardDescription = document.getElementById('cardDescription');
            
            const reportContainer = document.getElementById('reportContainer');
            const summaryLoader = document.getElementById('summaryLoader');
            const summaryLoaderText = document.getElementById('summaryLoaderText');
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
            const generateMoreBtn = document.getElementById('generateMoreBtn');
            const addCustomRiskBtn = document.getElementById('addCustomRiskBtn');
            const customRiskModal = document.getElementById('customRiskModal');
            const closeCustomRiskModal = document.getElementById('closeCustomRiskModal');
            const cancelCustomRisk = document.getElementById('cancelCustomRisk');
            const customRiskForm = document.getElementById('customRiskForm');
            const rekonComplianceDescription = document.getElementById('rekonComplianceDescription');
            const rekonComplianceIcon = document.getElementById('rekonComplianceIcon');

            // --- RekonContext Elements ---
            const rekonContextSection = document.getElementById('rekonContextSection');
            const rekonContextScore = document.getElementById('rekonContextScore');
            const rekonContextSlash = document.getElementById('rekonContextSlash');
            const rekonContextLevel = document.getElementById('rekonContextLevel');
            const rekonContextDescription = document.getElementById('rekonContextDescription');
            const rekonContextLoader = document.getElementById('rekonContextLoader');

            // --- RekonMetrics Loader Elements ---
            const rekonRiskLoader = document.getElementById('rekonRiskLoader');
            const rekonComplianceLoader = document.getElementById('rekonComplianceLoader');

            // --- Help Pane Elements ---
            const helpIconBtn = document.getElementById('helpIconBtn');
            const helpPane = document.getElementById('helpPane');
            const closeHelpPaneBtn = document.getElementById('closeHelpPaneBtn');

            // --- State ---
            let riskData = [];
            let currentProjectName = "";
            let aiRekonLogoBase64 = null; // To store the base64 logo for PDF
            let currentConversationId = null; // Store conversation ID for additional risks

            // --- Simple State Management ---
            let applicationState = {
                currentStep: 'setup', // 'setup', 'generating', 'review', 'complete'
                eventData: {},
                summaryGenerated: false,
                risksGenerated: false,
                summaryJustification: null, // Store contextual summary justification here
                lastModified: null
            };

            // State management utilities
            const updateApplicationState = (updates) => {
                Object.assign(applicationState, updates);
                applicationState.lastModified = new Date().toISOString();
                console.log('🔄 Application state updated:', applicationState);
            };

            // Debug function to inspect current state
            const debugState = () => {
                console.log('📊 Current Application State:', {
                    applicationState,
                    riskDataCount: riskData.length,
                    riskDataSample: riskData.length > 0 ? riskData[0] : null
                });
            };

            // Make debug function available globally for testing
            window.debugRiskAssessment = debugState;

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



            // --- Form & File Upload Logic ---
            const validateForm = () => {
                const requiredFields = [
                    eventTitleInput.value.trim(),
                    eventDateInput.value,
                    locationInput.value.trim(),
                    attendanceInput.value,
                    eventTypeInput.value
                ];

                // Only require venue type if event type is selected and venue options are available
                if (eventTypeInput.value && venueTypeInput.options.length > 1) {
                    requiredFields.push(venueTypeInput.value);
                }

                generateBtn.disabled = !requiredFields.every(field => field);
            };

            eventTitleInput.addEventListener('input', validateForm);
            eventDateInput.addEventListener('input', validateForm);
            locationInput.addEventListener('input', validateForm);
            attendanceInput.addEventListener('input', validateForm);
            eventTypeInput.addEventListener('input', validateForm);
            venueTypeInput.addEventListener('input', validateForm);

            // Event Type change handler to populate Venue Type dropdown
            eventTypeInput.addEventListener('change', (e) => {
                const selectedEventType = e.target.value;

                venueTypeInput.innerHTML = '';

                if (selectedEventType && typeOptions[selectedEventType]) {
                    const defaultOption = document.createElement('option');
                    defaultOption.textContent = 'Select Venue Type';
                    defaultOption.value = '';
                    venueTypeInput.appendChild(defaultOption);

                    typeOptions[selectedEventType].forEach(type => {
                        const option = document.createElement('option');
                        option.textContent = type;
                        option.value = type;
                        venueTypeInput.appendChild(option);
                    });
                } else {
                    const defaultOption = document.createElement('option');
                    defaultOption.textContent = 'Select Event Type first';
                    defaultOption.value = '';
                    venueTypeInput.appendChild(defaultOption);
                }

                // Re-validate form after venue type options change
                validateForm();
            });

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

                // Reset application state
                updateApplicationState({
                    currentStep: 'setup',
                    eventData: {},
                    summaryGenerated: false,
                    risksGenerated: false,
                    summaryJustification: null
                });

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
                rekonContextSection.classList.add('hidden');

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
                aiStatus.textContent = `AI is analyzing risks...`;

                try {
                    progressBar.style.width = '40%';

                    // Prepare event data for AI risk generation
                    const eventData = {
                        eventTitle: eventTitleInput.value.trim(),
                        eventDate: eventDateInput.value,
                        location: locationInput.value.trim(),
                        attendance: attendanceInput.value,
                        eventType: eventTypeInput.value,
                        venueType: venueTypeInput.value,
                        description: descriptionInput.value.trim()
                    };

                    aiStatus.textContent = "AI is analyzing event for critical risks...";

                    try {
                        // Start a conversation with the AI for importance-based risk generation
                        const conversationId = await aiService.startRiskConversation(eventData);
                        currentConversationId = conversationId; // Store for additional risks
                        console.log(`🤖 Started risk conversation: ${conversationId}`);

                        // Generate risks progressively in order of importance
                        const totalRisks = 6;

                        for (let i = 1; i <= totalRisks; i++) {
                            const progress = 30 + (i / totalRisks) * 60; // 30% to 90%
                            progressBar.style.width = `${progress}%`;
                            aiStatus.textContent = `AI is identifying risks...`;

                            // Update table loader text to show current risk being generated
                            const tableLoaderText = document.querySelector('#tableLoader p');
                            if (tableLoaderText) {
                                tableLoaderText.textContent = `AI is identifying risks...`;
                            }

                            try {
                                // Generate next risk in conversation for diversity
                                const risk = await aiService.generateNextRisk(conversationId, i);

                                // Add the risk to the table immediately
                                addRiskRow(risk);

                                // Add to risk data with justification fields
                                const riskWithJustifications = {
                                    ...risk,
                                    justifications: {
                                        risk: null,
                                        category: null,
                                        impact: null,
                                        likelihood: null,
                                        mitigation: null,
                                        overall: null
                                    }
                                };
                                riskData.push(riskWithJustifications);

                                // Pre-generate justifications in background (don't wait)
                                preGenerateJustifications(riskWithJustifications, eventData);

                                // Brief pause to let user see the new row
                                await sleep(400);

                            } catch (error) {
                                console.error(`Error generating risk ${i}:`, error);
                                // Continue with next risk even if one fails
                            }
                        }
                    } catch (error) {
                        console.error('Error starting risk conversation:', error);
                        // Fallback to legacy method if conversation fails
                        aiStatus.textContent = "Falling back to standard risk generation...";

                        const totalRisks = 6;
                        for (let i = 1; i <= totalRisks; i++) {
                            try {
                                const risk = await aiService.generateSingleRisk(eventData, i, totalRisks);
                                addRiskRow(risk);
                                riskData.push({
                                    ...risk,
                                    justifications: {
                                        risk: null,
                                        category: null,
                                        impact: null,
                                        likelihood: null,
                                        mitigation: null,
                                        overall: null
                                    }
                                });
                                await sleep(400);
                            } catch (riskError) {
                                console.error(`Error generating fallback risk ${i}:`, riskError);
                            }
                        }
                    }

                    tableLoader.classList.add('hidden');

                    // Update state to indicate risks are generated
                    updateApplicationState({
                        risksGenerated: true,
                        currentStep: 'review'
                    });

                    progressBar.style.width = '90%';
                    aiStatus.textContent = "AI risk analysis complete. Please review and accept risks.";
                    exportBtn.disabled = true;

                    if (riskData.length > 0) {
                        acceptAllContainer.classList.remove('hidden');
                        acceptAllContainer.classList.add('fade-in');
                    }

                } catch (error) {
                    console.error('Error generating AI risks:', error);
                    tableLoader.classList.add('hidden');
                    aiStatus.textContent = "Error generating risks. Please try again.";
                    alert('Failed to generate AI risk assessment: ' + error.message);
                }
            };

            const populateEventCard = () => {
                // Populate event card with form data
                cardEventTitle.textContent = eventTitleInput.value.trim() || 'N/A';
                cardEventDate.textContent = eventDateInput.value ?
                    new Date(eventDateInput.value).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }) : 'N/A';
                cardLocation.textContent = locationInput.value.trim() || 'N/A';
                cardAttendance.textContent = attendanceInput.value ?
                    `${parseInt(attendanceInput.value).toLocaleString()} people` : 'N/A';

                cardEventType.textContent = eventTypeInput.value || 'N/A';

                cardVenueType.textContent = venueTypeInput.value || 'N/A';

                const riskLevelValue = riskLevelInput.value;
                if (riskLevelValue) {
                    const riskLevelText = riskLevelInput.options[riskLevelInput.selectedIndex].text;
                    cardRiskLevel.textContent = riskLevelText;
                    cardRiskLevel.className = `text-sm font-semibold mt-1 ${getRiskLevelColor(riskLevelValue)}`;
                } else {
                    cardRiskLevel.textContent = 'Not assessed';
                    cardRiskLevel.className = 'text-sm font-semibold mt-1 text-zinc-500';
                }

                cardDescription.textContent = descriptionInput.value.trim() || 'No description provided';

                // Show the event card
                eventCard.classList.remove('hidden');
                eventCard.classList.add('fade-in');
            };

            const getRiskLevelColor = (level) => {
                switch(level) {
                    case '1': return 'text-green-600';
                    case '2': return 'text-green-500';
                    case '3': return 'text-yellow-600';
                    case '4': return 'text-orange-600';
                    case '5': return 'text-red-600';
                    default: return 'text-zinc-500';
                }
            };

            const startGeneration = async () => {
                currentProjectName = eventTitleInput.value.trim();
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

                // Update application state with event data
                const eventData = {
                    eventTitle: eventTitleInput.value.trim(),
                    eventDate: eventDateFormatted,
                    location: locationInput.value.trim(),
                    attendance: attendanceInput.value,
                    eventType: eventTypeInput.value,
                    venueType: venueTypeInput.value,
                    description: descriptionInput.value.trim()
                };

                updateApplicationState({
                    currentStep: 'generating',
                    eventData: eventData
                });

                // Populate Event Card
                populateEventCard();

                screen2.classList.remove('hidden');
                resetScreen2();

                try {
                    aiStatus.textContent = "AI is generating contextual summary...";
                    progressBar.style.width = '10%';

                    // Prepare event data for AI
                    const eventData = {
                        eventTitle: eventTitleInput.value.trim(),
                        eventDate: eventDateInput.value,
                        location: locationInput.value.trim(),
                        attendance: attendanceInput.value,
                        eventType: eventTypeInput.value,
                        venueType: venueTypeInput.value,
                        description: descriptionInput.value.trim()
                    };

                    // Show summary section with loading indicator in content area
                    summarySection.classList.remove('hidden');
                    summarySection.classList.add('fade-in');
                    summaryContent.innerHTML = `
                        <div class="flex justify-center items-center py-4">
                            <div class="loader"></div>
                            <p class="ml-4 text-zinc-500">AI is generating overview...</p>
                        </div>
                    `;

                    // Update status for first paragraph
                    aiStatus.textContent = "AI is generating overview...";
                    progressBar.style.width = '15%';

                    // Generate and display first paragraph
                    const paragraph1 = await aiService.generateOverviewParagraph(eventData);
                    summaryContent.innerHTML = `<p>${paragraph1}</p>`;

                    // Brief pause to let user see first paragraph
                    await sleep(800);

                    // Update status and content for second paragraph with loading indicator
                    aiStatus.textContent = "AI is generating operational considerations...";
                    summaryContent.innerHTML = `
                        <p>${paragraph1}</p>
                        <div class="flex justify-center items-center py-4">
                            <div class="loader"></div>
                            <p class="ml-4 text-zinc-500">AI is generating operational considerations...</p>
                        </div>
                    `;
                    progressBar.style.width = '25%';

                    // Generate and add second paragraph
                    const paragraph2 = await aiService.generateOperationalParagraph(eventData);
                    summaryContent.innerHTML = `<p>${paragraph1}</p>\n<p>${paragraph2}</p>`;

                    // Update state to indicate summary is generated
                    updateApplicationState({ summaryGenerated: true });

                    // Pre-generate summary justification in background
                    preGenerateSummaryJustification(eventData);

                    // Show actions
                    summaryActions.classList.remove('hidden');
                    await displayRekonContext();
                    progressBar.style.width = '30%';

                    aiStatus.textContent = "Contextual summary generated. Awaiting review...";
                } catch (error) {
                    console.error('Error generating AI summary:', error);
                    // Show error message in content area with consistent styling
                    summaryContent.innerHTML = `
                        <div class="flex justify-center items-center py-4">
                            <div class="text-red-500 text-2xl">❌</div>
                            <p class="ml-4 text-red-500">Error generating summary. Please check your API key and try again.</p>
                        </div>
                    `;
                    aiStatus.textContent = "Error generating summary. Please check your API key and try again.";
                    alert('Failed to generate AI summary: ' + error.message);
                    return;
                }
                

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
                // Clear stored justification since summary was edited
                applicationState.summaryJustification = null;

                summaryContent.contentEditable = false;
                summaryContent.classList.remove('table-cell-editing');
                editSummaryBtn.classList.remove('hidden');
                saveSummaryBtn.classList.add('hidden');
            });

            // --- Accept All Risks ---
            acceptAllBtn.addEventListener('click', async () => {
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
                await checkAndDisplayMetrics();
            });

            // --- Generate More Risks ---
            generateMoreBtn.addEventListener('click', async () => {
                if (!currentConversationId) {
                    alert('No active conversation found. Please generate initial risks first.');
                    return;
                }

                generateMoreBtn.disabled = true;
                generateMoreBtn.textContent = 'Generating...';

                // Show status for importance-based additional risks
                const currentRiskCount = riskData.length;

                console.log(`🔄 Generating additional risks starting from #${currentRiskCount + 1} (continuing importance ranking)`);

                try {
                    const additionalRisks = await aiService.generateAdditionalRisks(
                        currentConversationId,
                        riskData,
                        3
                    );

                    // Add each additional risk to the table
                    for (const risk of additionalRisks) {
                        addRiskRow(risk);
                        const riskWithJustifications = {
                            ...risk,
                            justifications: {
                                risk: null,
                                category: null,
                                impact: null,
                                likelihood: null,
                                mitigation: null,
                                overall: null
                            }
                        };
                        riskData.push(riskWithJustifications);

                        // Pre-generate justifications for additional risk
                        const eventData = {
                            eventTitle: eventTitleInput.value.trim(),
                            eventType: eventTypeInput.value,
                            venueType: venueTypeInput.value,
                            attendance: attendanceInput.value,
                            location: locationInput.value.trim()
                        };
                        preGenerateJustifications(riskWithJustifications, eventData);

                        await sleep(300); // Brief pause between additions
                    }

                    console.log(`✅ Added ${additionalRisks.length} additional risks (continuing importance ranking from #${currentRiskCount + 1})`);
                } catch (error) {
                    console.error('Error generating additional risks:', error);
                    alert('Failed to generate additional risks. Please try again.');
                } finally {
                    generateMoreBtn.disabled = false;
                    generateMoreBtn.textContent = '+ Generate More Risks';
                }
            });

            // --- Add Custom Risk ---
            addCustomRiskBtn.addEventListener('click', () => {
                customRiskModal.classList.remove('hidden');
            });

            closeCustomRiskModal.addEventListener('click', () => {
                customRiskModal.classList.add('hidden');
                customRiskForm.reset();
            });

            cancelCustomRisk.addEventListener('click', () => {
                customRiskModal.classList.add('hidden');
                customRiskForm.reset();
            });

            customRiskForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const customRisk = {
                    id: riskData.length + 1,
                    risk: document.getElementById('customRiskDescription').value.trim(),
                    category: document.getElementById('customRiskCategory').value,
                    impact: parseInt(document.getElementById('customRiskImpact').value),
                    likelihood: parseInt(document.getElementById('customRiskLikelihood').value),
                    mitigation: document.getElementById('customRiskMitigation').value.trim()
                };

                // Add the custom risk to the table
                addRiskRow(customRisk);
                const customRiskWithJustifications = {
                    ...customRisk,
                    justifications: {
                        risk: null,
                        category: null,
                        impact: null,
                        likelihood: null,
                        mitigation: null,
                        overall: null
                    }
                };
                riskData.push(customRiskWithJustifications);

                // Pre-generate justifications for custom risk
                const eventData = {
                    eventTitle: eventTitleInput.value.trim(),
                    eventType: eventTypeInput.value,
                    venueType: venueTypeInput.value,
                    attendance: attendanceInput.value,
                    location: locationInput.value.trim()
                };
                preGenerateJustifications(customRiskWithJustifications, eventData);

                // Close modal and reset form
                customRiskModal.classList.add('hidden');
                customRiskForm.reset();

                console.log('✅ Added custom risk:', customRisk.risk);
            });

            // Close modal when clicking outside
            customRiskModal.addEventListener('click', (e) => {
                if (e.target === customRiskModal) {
                    customRiskModal.classList.add('hidden');
                    customRiskForm.reset();
                }
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
            
            riskTableBody.addEventListener('click', async (e) => {
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
                            fieldValue = overall.toString();
                            reasoning = `The Overall Score (${overall}) is calculated by multiplying Impact (${currentRisk.impact}) by Likelihood (${currentRisk.likelihood}).`;
                            sources = ['Risk Scoring Matrix', 'Internal Calculation Logic'];
                            openJustificationPane(fieldName, fieldValue, reasoning, sources);
                        } else {
                            // For other fields, get fieldValue from currentRisk
                            if (fieldName === 'Risk Description') fieldValue = currentRisk.risk;
                            else if (fieldName === 'Category') fieldValue = currentRisk.category;
                            else if (fieldName === 'Impact') fieldValue = currentRisk.impact.toString();
                            else if (fieldName === 'Likelihood') fieldValue = currentRisk.likelihood.toString();
                            else if (fieldName === 'Mitigations') fieldValue = currentRisk.mitigation;

                            // Generate AI justification for this field
                            generateRiskJustification(fieldName, fieldValue, currentRisk);
                        }
                    } else {
                        // Fallback if currentRisk is not found
                        reasoning = `Justification for "${fieldName}" (risk ID: ${riskId}) could not be fully determined as the specific risk data was not found.`;
                        sources = ['UI Display Data'];
                        openJustificationPane(fieldName, fieldValue, reasoning, sources);
                    }
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
                    await checkAndDisplayMetrics();
                } else if (action === 'delete') {
                    if (confirm('Are you sure you want to delete this risk?')) {
                        row.remove();
                        riskData = riskData.filter(r => r.id !== id);
                        await checkAndDisplayMetrics();
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
            });

            const checkAndDisplayMetrics = async () => {
                const totalRisks = riskTableBody.querySelectorAll('tr').length;
                const acceptedRisks = riskTableBody.querySelectorAll('.table-row-accepted').length;

                if (totalRisks > 0 && totalRisks === acceptedRisks) {
                    await displayRekonMetrics();
                } else {
                    rekonMetricsSection.classList.add('hidden');
                }
            };

            const REKON_RISK_LEVELS = {
                1: { level: 'Negligible', details: ['Risks identified are procedural or minor in nature.', 'Impact on objectives is highly unlikely and would be insignificant.', 'Standard operational controls are sufficient for management.'] },
                2: { level: 'Very Low', details: ['Identified risks have a low probability of occurring.', 'Potential impact is minor and could be easily absorbed.', 'Existing mitigation strategies require minimal active management.'] },
                3: { level: 'Low', details: ['Risks are unlikely to occur but warrant monitoring.', 'Impact would be localized and have a limited effect on overall objectives.', 'Specific mitigation plans should be in place and reviewed periodically.'] },
                4: { level: 'Moderate', details: ['Risks have a reasonable chance of occurring if not managed.', 'Potential impact could cause noticeable disruption and may require dedicated resources.', 'Active monitoring and defined mitigation actions are required.'] },
                5: { level: 'High', details: ['Risks are likely to materialize without proactive intervention.', 'Impact could be significant, affecting key project outcomes or reputation.', 'Robust mitigation strategies must be implemented and closely tracked.'] },
                6: { level: 'Very High', details: ['Risks are very likely to occur and could have a severe impact.', 'Potential for major disruption, financial loss, or harm is substantial.', 'Requires senior management attention and intensive mitigation efforts.'] },
                7: { level: 'Critical', details: ['Risks are imminent or have an almost certain chance of occurring.', 'Impact would be critical, threatening project viability or causing extreme harm.', 'Immediate, comprehensive action and contingency planning are essential.'] }
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

            const getComplianceIconBase64 = (status) => {
                return new Promise((resolve) => {
                    const svgString = COMPLIANCE_ICONS[status];
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
                            color = '#DC2626'; // Tailwind red-500
                        } else if (colorName === 'green') {
                            color = '#16A34A'; // This was the green color used in the original code
                        }
                    }

                    // Prepare SVG for canvas conversion
                    // 1. Add xmlns namespace
                    // 2. Remove tailwind classes
                    // 3. Set width and height explicitly
                    // 4. Set stroke color explicitly, replacing currentColor
                    let preparedSvgString = svgString.replace(/class="[^"]*"/, '');
                    preparedSvgString = preparedSvgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"');
                    preparedSvgString = preparedSvgString.replace(/stroke="currentColor"/g, `stroke="${color}"`);
            
                    const img = new Image();
                    // Using a base64 data URL is often more reliable than blob URLs for this purpose.
                    const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(preparedSvgString);

                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        // Render at a higher resolution for better quality in the PDF
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

            const getRekonCompliance = (risks) => {
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
            };

            const displayRekonMetrics = async () => {
                const score = getRekonRiskScore(riskData);
                const compliance = getRekonCompliance(riskData);
                const levelInfo = REKON_RISK_LEVELS[score];

                // Show section but hide scores/status until AI content is ready
                rekonMetricsSection.classList.remove('hidden');
                rekonMetricsSection.classList.add('fade-in');

                // Clear scores/status initially
                rekonRiskScore.textContent = '';
                rekonRiskLevel.textContent = '';
                rekonComplianceStatus.textContent = '';
                rekonComplianceIcon.innerHTML = '';

                // Prepare event data for AI
                const eventData = {
                    eventTitle: eventTitleInput.value.trim(),
                    eventDate: eventDateInput.value,
                    location: locationInput.value.trim(),
                    attendance: attendanceInput.value,
                    eventType: eventTypeInput.value,
                    venueType: venueTypeInput.value,
                    description: descriptionInput.value.trim()
                };

                // Generate AI content for RekonRisk details
                try {
                    aiStatus.textContent = 'AI is generating risk analysis...';
                    progressBar.style.width = '95%';

                    rekonRiskLoader.classList.remove('hidden');
                    rekonRiskDescription.innerHTML = '';

                    const aiRiskDetails = await aiService.generateRekonRiskDetails(eventData, riskData, score, levelInfo.level);

                    // Display score/level with AI content simultaneously
                    rekonRiskLoader.classList.add('hidden');
                    rekonRiskScore.textContent = score;
                    rekonRiskScore.className = `text-5xl font-bold ${getRekonRiskColorClass(score)}`;
                    rekonRiskLevel.textContent = levelInfo.level;

                    const riskDescHtml = `
                        <ul class="list-disc list-inside space-y-1 mt-2">
                            ${aiRiskDetails.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    `;
                    rekonRiskDescription.innerHTML = riskDescHtml;

                } catch (error) {
                    console.error('Error generating RekonRisk details:', error);
                    rekonRiskLoader.classList.add('hidden');
                    rekonRiskScore.textContent = score;
                    rekonRiskScore.className = `text-5xl font-bold ${getRekonRiskColorClass(score)}`;
                    rekonRiskLevel.textContent = levelInfo.level;

                    const riskDescHtml = `
                        <ul class="list-disc list-inside space-y-1 mt-2">
                            ${levelInfo.details.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    `;
                    rekonRiskDescription.innerHTML = riskDescHtml;
                }

                // Generate AI content for RekonCompliance details
                try {
                    aiStatus.textContent = 'AI is generating compliance analysis...';
                    progressBar.style.width = '98%';

                    rekonComplianceLoader.classList.remove('hidden');
                    rekonComplianceDescription.innerHTML = '';

                    const aiComplianceDetails = await aiService.generateRekonComplianceDetails(eventData, riskData, compliance.status);

                    // Display status/icon with AI content simultaneously
                    rekonComplianceLoader.classList.add('hidden');
                    rekonComplianceStatus.textContent = compliance.status;
                    rekonComplianceIcon.innerHTML = COMPLIANCE_ICONS[compliance.status] || '';
                    rekonComplianceStatus.className = 'text-2xl font-bold';

                    const complianceDescHtml = `
                        <ul class="list-disc list-inside space-y-1 mt-2">
                            ${aiComplianceDetails.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    `;
                    rekonComplianceDescription.innerHTML = complianceDescHtml;

                } catch (error) {
                    console.error('Error generating RekonCompliance details:', error);
                    rekonComplianceLoader.classList.add('hidden');
                    rekonComplianceStatus.textContent = compliance.status;
                    rekonComplianceIcon.innerHTML = COMPLIANCE_ICONS[compliance.status] || '';
                    rekonComplianceStatus.className = 'text-2xl font-bold';

                    const complianceDescHtml = `
                        <ul class="list-disc list-inside space-y-1 mt-2">
                            ${compliance.details.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    `;
                    rekonComplianceDescription.innerHTML = complianceDescHtml;
                }

                // Finalize progress and enable export
                progressBar.style.width = '100%';
                aiStatus.textContent = 'Generation Complete. Review & Export.';
                exportBtn.disabled = false;
            };

            // Generate AI justification for risk fields
            const generateRiskJustification = async (fieldName, fieldValue, riskData) => {
                // Map field names to justification keys
                const fieldMap = {
                    'Risk Description': 'risk',
                    'Category': 'category',
                    'Impact': 'impact',
                    'Likelihood': 'likelihood',
                    'Mitigations': 'mitigation',
                    'Overall Score': 'overall'
                };

                const justificationKey = fieldMap[fieldName];

                // Check if we already have this justification stored
                if (riskData.justifications && riskData.justifications[justificationKey]) {
                    const stored = riskData.justifications[justificationKey];
                    console.log(`📋 Retrieved stored justification for: ${fieldName} = "${fieldValue}"`);
                    openJustificationPane(fieldName, fieldValue, stored.reasoning, stored.sources);
                    return;
                }

                // Open panel immediately with loading state
                openJustificationPane(
                    fieldName,
                    fieldValue,
                    "AI is generating justification...",
                    ["Loading..."]
                );

                try {
                    const context = {
                        eventTitle: eventTitleInput.value.trim(),
                        eventType: eventTypeInput.value,
                        venueType: venueTypeInput.value,
                        attendance: attendanceInput.value,
                        location: locationInput.value.trim(),
                        riskDescription: riskData.risk,
                        riskCategory: riskData.category,
                        riskImpact: riskData.impact,
                        riskLikelihood: riskData.likelihood,
                        riskMitigation: riskData.mitigation
                    };

                    const justification = await aiService.generateJustification(
                        fieldName,
                        fieldValue,
                        context
                    );

                    // Store the justification in the risk data
                    if (!riskData.justifications) {
                        riskData.justifications = {};
                    }
                    riskData.justifications[justificationKey] = {
                        reasoning: justification.reasoning,
                        sources: justification.sources
                    };
                    console.log(`💾 Stored justification for: ${fieldName} = "${fieldValue}"`);

                    // Update panel with AI-generated content
                    updateJustificationContent(justification.reasoning, justification.sources);

                } catch (error) {
                    console.error('Error generating AI justification:', error);
                    // Update with fallback content
                    const fallbackReasoning = `This assessment was determined through AI analysis considering the event type, scale, venue characteristics, and industry best practices.`;
                    const fallbackSources = ['AI Risk Analysis', 'Industry Standards'];

                    // Store the fallback content too
                    if (!riskData.justifications) {
                        riskData.justifications = {};
                    }
                    riskData.justifications[justificationKey] = {
                        reasoning: fallbackReasoning,
                        sources: fallbackSources
                    };

                    updateJustificationContent(fallbackReasoning, fallbackSources);
                }
            };

            // Pre-generate justifications for all fields of a risk in background
            const preGenerateJustifications = async (riskData, eventData) => {
                const fieldMap = {
                    'Risk Description': 'risk',
                    'Category': 'category',
                    'Impact': 'impact',
                    'Likelihood': 'likelihood',
                    'Mitigations': 'mitigation',
                    'Overall Score': 'overall'
                };

                const context = {
                    eventTitle: eventData.eventTitle,
                    eventType: eventData.eventType,
                    venueType: eventData.venueType,
                    attendance: eventData.attendance,
                    location: eventData.location,
                    riskDescription: riskData.risk,
                    riskCategory: riskData.category,
                    riskImpact: riskData.impact,
                    riskLikelihood: riskData.likelihood,
                    riskMitigation: riskData.mitigation
                };

                // Generate justifications for key fields in background
                const fieldsToPreGenerate = [
                    { name: 'Risk Description', value: riskData.risk, key: 'risk' },
                    { name: 'Impact', value: riskData.impact.toString(), key: 'impact' },
                    { name: 'Likelihood', value: riskData.likelihood.toString(), key: 'likelihood' },
                    { name: 'Overall Score', value: (riskData.impact * riskData.likelihood).toString(), key: 'overall' }
                ];

                // Generate justifications asynchronously without blocking UI
                fieldsToPreGenerate.forEach(async (field) => {
                    try {
                        const justification = await aiService.generateJustification(
                            field.name,
                            field.value,
                            context
                        );

                        // Store the justification
                        if (!riskData.justifications) {
                            riskData.justifications = {};
                        }
                        riskData.justifications[field.key] = {
                            reasoning: justification.reasoning,
                            sources: justification.sources
                        };

                        console.log(`🔄 Pre-generated justification for ${field.name} = "${field.value}"`);
                    } catch (error) {
                        console.error(`Error pre-generating justification for ${field.name}:`, error);
                    }
                });
            };

            // Pre-generate summary justification in background
            const preGenerateSummaryJustification = async (eventData) => {
                try {
                    const justification = await aiService.generateJustification(
                        'Contextual Summary',
                        summaryContent.innerHTML,
                        eventData
                    );

                    // Store the justification in application state
                    applicationState.summaryJustification = {
                        reasoning: justification.reasoning,
                        sources: justification.sources
                    };

                    console.log('🔄 Pre-generated justification for Contextual Summary');
                } catch (error) {
                    console.error('Error pre-generating summary justification:', error);
                }
            };

            // Update justification content without reopening panel
            const updateJustificationContent = (reasoning, sources) => {
                justificationReasoning.textContent = reasoning;

                justificationSources.innerHTML = '';
                sources.forEach(source => {
                    const li = document.createElement('li');
                    li.textContent = source;
                    justificationSources.appendChild(li);
                });
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

            summaryJustificationIcon.addEventListener('click', async () => {
                // Check if we already have this justification stored
                if (applicationState.summaryJustification) {
                    console.log(`📋 Retrieved stored justification for: Contextual Summary`);
                    openJustificationPane('Contextual Summary', summaryContent.innerHTML,
                        applicationState.summaryJustification.reasoning,
                        applicationState.summaryJustification.sources);
                    return;
                }

                // Open panel immediately with loading state
                openJustificationPane(
                    'Contextual Summary',
                    summaryContent.innerHTML,
                    'AI is generating justification...',
                    ['Loading...']
                );

                try {
                    const eventData = {
                        eventTitle: eventTitleInput.value.trim(),
                        eventType: eventTypeInput.value,
                        venueType: venueTypeInput.value,
                        attendance: attendanceInput.value,
                        location: locationInput.value.trim(),
                        eventDate: eventDateInput.value,
                        description: descriptionInput.value.trim()
                    };

                    const justification = await aiService.generateJustification(
                        'Contextual Summary',
                        summaryContent.innerHTML,
                        eventData
                    );

                    // Store the justification in application state
                    applicationState.summaryJustification = {
                        reasoning: justification.reasoning,
                        sources: justification.sources
                    };
                    console.log(`💾 Stored justification for: Contextual Summary`);

                    // Update panel with AI-generated content
                    updateJustificationContent(justification.reasoning, justification.sources);

                } catch (error) {
                    console.error('Error generating justification:', error);
                    // Update with fallback content
                    const fallbackReasoning = 'The summary was generated using AI analysis based on the event details provided, considering event type, scale, location, and industry best practices.';
                    const fallbackSources = ['AI Analysis', 'Event Details', 'Industry Best Practices'];

                    // Store the fallback content too
                    applicationState.summaryJustification = {
                        reasoning: fallbackReasoning,
                        sources: fallbackSources
                    };

                    updateJustificationContent(fallbackReasoning, fallbackSources);
                }
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
                    `Event Title: ${eventTitleInput.value.trim() || 'N/A'}`,
                    `Event Date: ${eventDateInput.value ? new Date(eventDateInput.value).toLocaleDateString('en-GB') : 'N/A'}`,
                    `Location: ${locationInput.value.trim() || 'N/A'}`,
                    `Attendance: ${attendanceInput.value ? parseInt(attendanceInput.value).toLocaleString() + ' people' : 'N/A'}`,
                    `Event Type: ${eventTypeInput.value || 'N/A'}`,
                    `Venue Type: ${venueTypeInput.value || 'N/A'}`,
                    `Risk Level: ${riskLevelInput.value ? riskLevelInput.options[riskLevelInput.selectedIndex].text : 'Not assessed'}`
                ];
                projectInfo.forEach(detail => {
                    checkPageBreak(5);
                    pdf.text(detail, marginLeft, currentY);
                    currentY += 5;
                });
        
                // Contextual Summary & RekonContext
                checkPageBreak(15);
                currentY += 5;

                const col1Width = contentWidth * 0.65;
                const gap = contentWidth * 0.05;
                const col2Width = contentWidth * 0.3;
                const col2X = marginLeft + col1Width + gap;
                
                let initialY = currentY;

                // Column 1: Contextual Summary
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(13);
                pdf.setFont(undefined, 'bold');
                pdf.text('Contextual Summary', marginLeft, currentY);
                currentY += 6;

                const summaryParagraphs = Array.from(summaryContent.querySelectorAll('p')).map(p => p.innerText);
                const summaryText = summaryParagraphs.join('\n\n');
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(51, 65, 85);
                const summaryLines = pdf.splitTextToSize(summaryText, col1Width);
                summaryLines.forEach(line => {
                    checkPageBreak(5);
                    pdf.text(line, marginLeft, currentY);
                    currentY += 5;
                });
                const summaryFinalY = currentY;

                // Column 2: RekonContext
                let contextY = initialY;
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(13);
                pdf.setFont(undefined, 'bold');
                pdf.text('RekonContext Index:', col2X, contextY);
                contextY += 10;

                const contextScore = getRekonContext(eventTypeInput.value, venueTypeInput.value, attendanceInput.value);
                const contextInfo = REKON_CONTEXT_LEVELS[contextScore];
                
                // Draw score with color
                const contextColor = getRekonRiskColorClass(contextScore);
                if (contextColor === 'text-red-600') pdf.setTextColor(220, 38, 38);
                else if (contextColor === 'text-yellow-600') pdf.setTextColor(202, 138, 4);
                else pdf.setTextColor(22, 163, 74);
                pdf.setFontSize(22);
                pdf.setFont(undefined, 'bold');
                pdf.text(String(contextScore), col2X, contextY);

                // Draw '/7' and level
                let scoreWidth = pdf.getTextWidth(String(contextScore));
                pdf.setTextColor(100, 116, 139);
                pdf.setFontSize(22);
                pdf.text('/7', col2X + scoreWidth + 1, contextY);
                let slash7Width = pdf.getTextWidth('/7');

                pdf.setFontSize(11);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(0,0,0);
                pdf.text(`(${contextInfo.level})`, col2X + scoreWidth + slash7Width + 3, contextY);
                contextY += 7;

                // Draw description bullet points
                const contextText = contextInfo.details.map(d => `• ${d}`).join('\n');
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(51, 65, 85);
                const contextLines = pdf.splitTextToSize(contextText, col2Width);
                contextLines.forEach(line => {
                    checkPageBreak(5);
                    pdf.text(line, col2X, contextY);
                    contextY += 5;
                });
                const contextFinalY = contextY;

                // Update currentY to the bottom of the taller column
                currentY = Math.max(summaryFinalY, contextFinalY) + 8;
        
                // Detailed Risk Assessment Table
                if (riskData.length > 0) {
                    checkPageBreak(20); 
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(13);
                    pdf.setFont(undefined, 'bold');
                    pdf.text('Detailed Risk Table', marginLeft, currentY);
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
                    pdf.text('RekonRisk Index:', marginLeft, currentY);
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
                    const riskDescText = rekonRiskInfo.details.map(d => `• ${d}`).join('\n');
                    const riskDescLines = pdf.splitTextToSize(riskDescText, contentWidth);
                    riskDescLines.forEach(line => { checkPageBreak(5); pdf.text(line, marginLeft, currentY); currentY += 5; });
                    currentY += 8;
        
                    checkPageBreak(30);
                    const rekonComplianceInfo = getRekonCompliance(riskData);
                    pdf.setFontSize(11);
                    pdf.setFont(undefined, 'bold');
                    pdf.setTextColor(0,0,0);
                    const statusLabel = 'RekonCompliance Status:';
                    pdf.text(statusLabel, marginLeft, currentY);

                    const statusLabelWidth = pdf.getTextWidth(statusLabel);
                    let currentX = marginLeft + statusLabelWidth + 3; // Start after label
        
                    const iconBase64 = await getComplianceIconBase64(rekonComplianceInfo.status);
                    const iconSize = 8;
                    if (iconBase64) {
                        pdf.addImage(iconBase64, 'PNG', currentX, currentY - (iconSize / 2) - 1, iconSize, iconSize);
                        currentX += iconSize + 2;
                    }
        
                    pdf.setFontSize(10);
                    pdf.setFont(undefined, 'bold');
        
                    if (rekonComplianceInfo.status === 'Compliant' || rekonComplianceInfo.status === 'Exceeds Compliance') {
                        pdf.setTextColor(22, 163, 74);
                    } else {
                        pdf.setTextColor(220, 38, 38);
                    }
        
                    pdf.text(rekonComplianceInfo.status, currentX, currentY);
                    currentY += 10; // Move down for the description
        
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(9);
                    pdf.setFont(undefined, 'normal');
        
                    const complianceDescText = rekonComplianceInfo.details.map(d => `• ${d}`).join('\n');
                    const complianceDescLines = pdf.splitTextToSize(complianceDescText, contentWidth);
                    complianceDescLines.forEach(line => {
                        checkPageBreak(5);
                        pdf.text(line, marginLeft, currentY);
                        currentY += 5;
                    });
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

            const displayRekonContext = async () => {
                const eventType = eventTypeInput.value;
                const venueType = venueTypeInput.value;
                const attendance = attendanceInput.value;

                const score = getRekonContext(eventType, venueType, attendance);
                const levelInfo = REKON_CONTEXT_LEVELS[score];

                // Show section but hide score/level/slash until AI content is ready
                rekonContextSection.classList.remove('hidden');
                rekonContextScore.textContent = '';
                rekonContextSlash.style.visibility = 'hidden';
                rekonContextLevel.textContent = '';

                // Show loading indicator and generate AI content
                rekonContextLoader.classList.remove('hidden');
                rekonContextDescription.innerHTML = '';

                try {
                    // Prepare event data for AI
                    const eventData = {
                        eventTitle: eventTitleInput.value.trim(),
                        eventDate: eventDateInput.value,
                        location: locationInput.value.trim(),
                        attendance: attendanceInput.value,
                        eventType: eventTypeInput.value,
                        venueType: venueTypeInput.value,
                        description: descriptionInput.value.trim()
                    };

                    // Generate AI content for the context details
                    const aiDetails = await aiService.generateRekonContextDetails(eventData, score, levelInfo.level);

                    // Hide loader and display score/level/slash with AI-generated content simultaneously
                    rekonContextLoader.classList.add('hidden');
                    rekonContextScore.textContent = score;
                    rekonContextScore.className = `text-5xl font-bold ${getRekonRiskColorClass(score)}`;
                    rekonContextSlash.style.visibility = 'visible';
                    rekonContextLevel.textContent = levelInfo.level;

                    const descriptionHtml = `
                        <ul class="list-disc list-inside space-y-1 mt-2">
                            ${aiDetails.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    `;
                    rekonContextDescription.innerHTML = descriptionHtml;

                } catch (error) {
                    console.error('Error generating RekonContext details:', error);
                    // Hide loader and fall back to hardcoded content with score/level/slash
                    rekonContextLoader.classList.add('hidden');
                    rekonContextScore.textContent = score;
                    rekonContextScore.className = `text-5xl font-bold ${getRekonRiskColorClass(score)}`;
                    rekonContextSlash.style.visibility = 'visible';
                    rekonContextLevel.textContent = levelInfo.level;

                    const descriptionHtml = `
                        <ul class="list-disc list-inside space-y-1 mt-2">
                            ${levelInfo.details.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    `;
                    rekonContextDescription.innerHTML = descriptionHtml;
                }
            };

            const REKON_CONTEXT_LEVELS = {
                1: { level: 'Routine', details: ['Small-scale, localized event with straightforward logistics.', 'Low public profile with minimal media interest or social sensitivity.', 'Follows established, routine procedures with low regulatory oversight.'] },
                2: { level: 'Elevated', details: ['Moderate scale, potentially involving multiple areas or a larger audience.', 'Some local media interest or a moderately sensitive theme/audience.', 'Standard event type requiring thorough planning and adherence to best practices.'] },
                3: { level: 'Sensitive', details: ['Large or complex event requiring detailed coordination of resources and personnel.', 'High local profile or involves a known sensitive group, topic, or location.', 'Likely to be subject to specific stakeholder interest and requires clear communication strategies.'] },
                4: { level: 'Significant', details: ['Very large-scale event with significant logistical challenges (e.g., transport, access).', 'Significant regional media attention and high potential for public or political sensitivity.', 'Carries historical or social importance; planning will be closely monitored by stakeholders.'] },
                5: { level: 'Major', details: ['Major event with extensive logistical and resource demands, potentially impacting city services.', 'High-profile event attracting national media and public attention; may involve VIPs.', 'Sets a precedent for future events; subject to intense scrutiny from regulators and the public.'] },
                6: { level: 'Critical', details: ['Critical infrastructure-level complexity, requiring multi-agency planning and city-wide integration.', 'Event of national importance with guaranteed, intense media coverage and high political sensitivity.', 'Involves matters of state or national security; planning subject to governmental-level oversight.'] },
                7: { level: 'Extraordinary', details: ['Unprecedented scale and complexity, requiring novel solutions and extensive, exceptional resources.', 'Unique, historic event of global interest and significance; extreme sensitivity.', 'No direct precedent exists; involves exceptional circumstances demanding the highest level of planning and scrutiny.'] }
            };

            const getRekonContext = (industry, type, attendees) => {
                let score = 1;
                const numAttendees = parseInt(attendees, 10) || 0;
        
                // Score by industry
                switch (industry) {
                    case 'State': score += 3; break;
                    case 'Sport': score += 2; break;
                    case 'Music': score += 1; break;
                    case 'Community': score += 1; break;
                }
        
                // Score by attendees
                if (numAttendees > 50000) score += 3;
                else if (numAttendees > 10000) score += 2;
                else if (numAttendees > 1000) score += 1;
        
                // Score by type
                const highSensitivityTypes = ['VIP Visit / Dignitary Protection', 'Public Rally / Protest', 'Official Public Ceremony', 'State Funeral'];
                if (highSensitivityTypes.includes(type)) {
                    score += 2;
                }
                
                return Math.min(score, 7); // Cap score at 7
            };
        });