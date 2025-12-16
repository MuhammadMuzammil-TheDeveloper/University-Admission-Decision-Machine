
// --- 1. DFA Definitions & WEIGHTING ---
const STATES = {
    S0: 'Form Submitted (Initial State)',
    S1: 'Documentation Submission & Verification',
    S2: 'Academic Evaluation (Percentage Based)',
    S3: 'Extracurricular Activities Check',
    S4: 'Interview Evaluation (Percentage)',
    S5: 'Accepted / Accepted with Scholarship (Accept State)',
    S6: 'Rejected (Reject State)',
};

const THRESHOLDS = {
    // S2 Acceptance and Scholarship Tiers
    ACADEMIC_PASS: 60,  // Minimum percentage for acceptance
    SCHOLARSHIP_TIER_3: 90, // 30% Scholarship (if met at S2)
    SCHOLARSHIP_TIER_2: 80, // 20% Scholarship (if met at S2)
    SCHOLARSHIP_TIER_1: 70, // 10% Scholarship (if met at S2)

    // S3: Minimum required activities
    ACTIVITIES_MIN: 2, 

    // S4: Interview Thresholds
    INTERVIEW_PASS: 50, // Minimum percentage for S4 pass
    
    // Total Maximum Scores
    MAX_SECOND_YEAR: 1100, // Example max marks for 2nd year
    MAX_ADMISSION_TEST: 100, // Example max marks for Admission Test
    TOTAL_MAX_SCORE: 1200, // S2 Total Max

    // Scholarship calculation factor (used for final decision)
    SCHOLARSHIP_FACTOR: 0.70 // Must achieve 70% in all stages combined to finalize scholarship
};

// --- 2. State Variables ---
let currentState = 'S0';
let history = [];
let applicantData = {};
let finalScorePercentage = 0; // New variable to track the final percentage
let scholarshipTier = 0; // 0=None, 10, 20, 30

// --- 3. DOM Elements (Same as previous revision) ---
const stageTitle = document.getElementById('stage-title');
const stageInstructions = document.getElementById('stage-instructions');
const admissionForm = document.getElementById('admission-form');
const transitionButton = document.getElementById('transition-button');
const historyLog = document.getElementById('history-log');
const currentStateDisplay = document.getElementById('current-state-display');
const resultDashboard = document.getElementById('result-dashboard');
const resetButton = document.getElementById('reset-button');

// ADMIN PANEL
const adminPanel = document.getElementById('admin-panel');
const runTestButton = document.getElementById('run-test-button');
const testLog = document.getElementById('test-log');


// --- 4. Core Logic: Transition Function (Enhanced) ---

/**
 * Calculates the next state based on the current state and applicant inputs.
 */
function transition(current, inputs) {
    let nextState = 'S6'; // Default fail state
    let outcome = 'Rejected';
    let condition = 'Transition Failed: Criteria not met.';
    let score = 0; // Score generated at this stage

    // Reset scholarship tier before S2 transition
    if (current === 'S0') scholarshipTier = 0; 
    
    switch (current) {
        case 'S0':
            nextState = 'S1';
            outcome = 'Process Started';
            condition = 'Begin Admission Process clicked';
            break;

        case 'S1':
            // Document Verification
            if (inputs.documentsVerified) {
                nextState = 'S2';
                outcome = 'Documents Verified';
                condition = 'All Mandatory Documents Validated';
            } else {
                condition = 'Mandatory Document Failure';
            }
            break;

        case 'S2':
            // Academic Evaluation (Percentage Based)
            const marks2ndYear = inputs.marks2ndYear;
            const marksAdmissionTest = inputs.marksAdmissionTest;
            const totalMarks = marks2ndYear + marksAdmissionTest;
            
            // Formula: (Achieved Score / Total Max Score) * 100
            score = (totalMarks / THRESHOLDS.TOTAL_MAX_SCORE) * 100;
            score = Math.round(score); // Percentage

            if (score >= THRESHOLDS.ACADEMIC_PASS) {
                nextState = 'S3';
                outcome = `Academic Pass (Score: ${score}%)`;
                
                // Determine Scholarship Tier based on S2 score
                if (score >= THRESHOLDS.SCHOLARSHIP_TIER_3) {
                    scholarshipTier = 30;
                } else if (score >= THRESHOLDS.SCHOLARSHIP_TIER_2) {
                    scholarshipTier = 20;
                } else if (score >= THRESHOLDS.SCHOLARSHIP_TIER_1) {
                    scholarshipTier = 10;
                }
                
                condition = `Combined Percentage ${score}% ≥ ${THRESHOLDS.ACADEMIC_PASS}% (Scholarship Tentative: ${scholarshipTier}%)`;
            } else {
                condition = `Combined Percentage ${score}% < ${THRESHOLDS.ACADEMIC_PASS}%`;
            }
            break;

        case 'S3':
            // Extracurricular Activities Check (Counting Checkboxes)
            const activityCount = inputs.activityCount;

            if (activityCount >= THRESHOLDS.ACTIVITIES_MIN) {
                nextState = 'S4';
                outcome = `Activities Pass (Count: ${activityCount})`;
                condition = `Activities Count ${activityCount} ≥ ${THRESHOLDS.ACTIVITIES_MIN}`;
                // Score is simply a pass/fail indicator for this stage, normalized to 100 for tracking
                score = 100;
            } else {
                condition = `Activities Count ${activityCount} < ${THRESHOLDS.ACTIVITIES_MIN}`;
            }
            break;

        case 'S4':
            // Interview Evaluation (Percentage)
            score = inputs.interviewPercentage;

            if (score >= THRESHOLDS.INTERVIEW_PASS) {
                // S4 Pass. Now calculate final acceptance/scholarship.
                
                // Final Check: Interview score must be high enough, and previous academic performance must support scholarship.
                
                // Academic Score (Percentage) from S2 is the main factor
                const academicPercentage = history.find(h => h.from === 'S2')?.stageScore || 0;
                
                if (scholarshipTier > 0) {
                    // Final Scholarship Check: Ensure interview is also strong enough (e.g., > 70%)
                    if (score >= 70 && academicPercentage >= THRESHOLDS.SCHOLARSHIP_TIER_1) { 
                         // Maintain or potentially upgrade/downgrade based on the specific academic tier
                        nextState = 'S5';
                        outcome = `Accepted with ${scholarshipTier}% Scholarship`;
                        condition = `Interview Pass (${score}%) and Scholarship Confirmed.`;
                    } else {
                        // Scholarship revoked/downgraded due to weak interview
                        nextState = 'S5'; 
                        outcome = 'Accepted Regular (Scholarship Revoked)';
                        condition = `Interview Pass (${score}%), but Scholarship criteria not maintained.`;
                        scholarshipTier = 0;
                    }
                } else {
                    // Regular Acceptance
                    nextState = 'S5'; 
                    outcome = 'Accepted Regular';
                    condition = `Interview Pass (${score}%) and Regular Acceptance Granted.`;
                }

            } else {
                condition = `Interview Score ${score}% < ${THRESHOLDS.INTERVIEW_PASS}%`;
            }
            break;
    }

    return { nextState, outcome, condition, stageScore: score };
}


// --- 5. DOM Rendering & UI Updates ---

function renderForm(state) {
    let html = '';
    
    // Set button text
    let buttonText = 'Submit and Evaluate Stage';
    if (state === 'S0') buttonText = 'Begin Admission Process';
    else if (state === 'S4') buttonText = 'Final Evaluation and Decision';
    transitionButton.textContent = buttonText;

    switch (state) {
        case 'S0':
            html = '';
            break;

        case 'S1':
            html = `
                <label>
                    <input type="checkbox" name="documentsVerified" id="documentsVerified" required>
                    I confirm successful upload and verification of all mandatory documents.
                </label>
            `;
            break;

        case 'S2':
            html = `
                <p>Formula: ((2nd Year Marks + Admission Score) / ${THRESHOLDS.TOTAL_MAX_SCORE}) * 100. Min Pass: ${THRESHOLDS.ACADEMIC_PASS}%. Scholarship Tiers: 70%, 80%, 90%.</p>
                <label for="marks2ndYear">2nd Year Marks (Max ${THRESHOLDS.MAX_SECOND_YEAR}):</label>
                <input type="number" id="marks2ndYear" name="marks2ndYear" min="0" max="${THRESHOLDS.MAX_SECOND_YEAR}" required value="750">
                
                <label for="marksAdmissionTest">Admission Test Score (Max ${THRESHOLDS.MAX_ADMISSION_TEST}):</label>
                <input type="number" id="marksAdmissionTest" name="marksAdmissionTest" min="0" max="${THRESHOLDS.MAX_ADMISSION_TEST}" required value="70">
            `;
            break;

        case 'S3':
            html = `
                <p>Select activities. Minimum required for pass: <strong>${THRESHOLDS.ACTIVITIES_MIN}</strong>.</p>
                <div class="activity-checkboxes">
                    <label>
                        <input type="checkbox" name="activity_sports" value="1"> Competitive Sports Participation
                    </label>
                    <label>
                        <input type="checkbox" name="activity_certificate" value="1"> Advanced Skill Certificate (e.g., Coding, Language)
                    </label>
                    <label>
                        <input type="checkbox" name="activity_volunteer" value="1"> Significant Volunteer/Community Service
                    </label>
                    <label>
                        <input type="checkbox" name="activity_leadership" value="1"> Leadership Role (Club President, Team Captain)
                    </label>
                </div>
                <input type="hidden" id="activityCount" name="activityCount" value="0">
            `;
            // Add listener to update hidden activityCount field
            setTimeout(() => {
                const formEl = document.getElementById('admission-form');
                const updateCount = () => {
                    let count = 0;
                    formEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        if (cb.checked) count++;
                    });
                    document.getElementById('activityCount').value = count;
                };
                formEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.addEventListener('change', updateCount);
                });
            }, 0);
            break;

        case 'S4':
            html = `
                <p>Minimum required percentage for pass: <strong>${THRESHOLDS.INTERVIEW_PASS}%</strong>.</p>
                <label for="interviewPercentage">Interview Evaluation Score (Percentage 0-100):</label>
                <input type="number" id="interviewPercentage" name="interviewPercentage" min="0" max="100" required value="75">
                
                <p class="note">Current Academic Tier: <strong>${scholarshipTier}% Scholarship Tentative</strong>.</p>
                <p class="note">Final Scholarship will be confirmed if Interview score is also strong (e.g., > 70%).</p>
            `;
            break;
    }

    admissionForm.innerHTML = html;
}

function updateUI() {
    stageTitle.textContent = `${currentState}: ${STATES[currentState]}`;
    currentStateDisplay.textContent = currentState;
    
    // Update state tag color
    currentStateDisplay.className = `state-tag s${currentState.slice(1)}`;

    if (currentState === 'S5' || currentState === 'S6') {
        transitionButton.classList.add('hidden');
        admissionForm.classList.add('hidden');
        renderResultDashboard();
    } else {
        transitionButton.classList.remove('hidden');
        admissionForm.classList.remove('hidden');
        resultDashboard.classList.add('hidden');
        renderForm(currentState);
    }
}

function updateLog(fromState, toState, outcome, condition, score) {
    const listItem = document.createElement('li');
    listItem.classList.add(toState === 'S6' ? 'log-fail' : 'log-pass');
    
    let scoreDisplay = score > 0 && fromState !== 'S3' ? ` (Score: ${score}${fromState === 'S4' || fromState === 'S2' ? '%' : ''})` : '';

    listItem.innerHTML = `
        <span class="state-tag s${fromState.slice(1)}">${fromState}</span>
        $\to$ 
        <span class="state-tag s${toState.slice(1)}">${toState}</span>
        <strong>${outcome}</strong>${scoreDisplay}
        <br>
        <small>Condition Met: ${condition}</small>
    `;
    historyLog.prepend(listItem);
}

function renderResultDashboard() {
    const isAccepted = history[history.length - 1].to === 'S5';
    const decisionText = history[history.length - 1].outcome;

    resultDashboard.classList.remove('hidden');
    resultDashboard.className = isAccepted ? 'result-accepted' : 'result-rejected';
    
    // Find the S2 score for display
    const academicStep = history.find(h => h.from === 'S2');
    const academicPercentage = academicStep ? academicStep.stageScore : 'N/A';

    let html = `
        <h2>${isAccepted ? '🎉 FINAL DECISION: ' + decisionText : '❌ FINAL DECISION: Rejected'}</h2>
        <p class="outcome-text">
            <strong>Decision: ${decisionText}</strong>
            <br>
            Academic Score (S2): ${academicPercentage}%
        </p>
        <h3>🔍 Evaluation Summary</h3>
    `;

    if (isAccepted) {
        html += `<p>Congratulations! You successfully passed all required stages of the evaluation process. ${(scholarshipTier > 0 && decisionText.includes('Scholarship')) ? `A ${scholarshipTier}% scholarship has been awarded based on performance.` : 'No scholarship was granted.'}</p>`;
    } else {
        const failureStep = history.find(step => step.to === 'S6');
        html += `<p>The application was **rejected at ${failureStep.from}: ${STATES[failureStep.from]}** because the condition "${failureStep.condition}" was not met.</p>`;
    }
    
    html += '<button onclick="window.print()" class="action-btn" style="background-color:#4CAF50; color:white; margin-top:20px;">🖨️ Print Simulation Report</button>';
    resultDashboard.innerHTML = html;
}

// --- 6. Event Handlers ---

function handleSubmit(event) {
    event.preventDefault();

    // 1. Gather Inputs
    const inputs = {};
    const formData = new FormData(admissionForm);
    
    // Special handling for S3 to count activities
    let activityCount = 0;
    
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('activity_')) {
            // Count checked activities for S3 logic
            if (value === '1') activityCount++;
            continue; 
        } else if (value === 'on') {
            inputs[key] = true;
        } else if (!isNaN(parseFloat(value))) {
            inputs[key] = parseFloat(value);
        } else {
            inputs[key] = value;
        }
    }
    inputs.activityCount = activityCount;
    
    if (currentState === 'S0') inputs.start = true;

    // 2. Run DFA Transition
    const result = transition(currentState, inputs);
    
    // 3. Update State
    const previousState = currentState;
    currentState = result.nextState;

    applicantData = { ...applicantData, ...inputs };
    history.push({
        from: previousState,
        to: currentState,
        outcome: result.outcome,
        condition: result.condition,
        stageScore: result.stageScore
    });

    // 4. Update UI
    updateLog(previousState, currentState, result.outcome, result.condition, result.stageScore);
    updateUI();
}

function resetSimulation() {
    currentState = 'S0';
    history = [];
    applicantData = {};
    scholarshipTier = 0;
    historyLog.innerHTML = '';
    testLog.textContent = 'Awaiting test run...';
    resultDashboard.classList.add('hidden');
    updateUI();
}

// --- 7. Admin Panel/Testing ---

const TEST_CASES = [
    { name: "Scholarship T3 (90%+ Academics)", 
      inputs: {
        S1: { documentsVerified: true },
        S2: { marks2ndYear: 1000, marksAdmissionTest: 80 }, // 1080/1200 = 90% (Tier 3)
        S3: { activity_sports: 1, activity_certificate: 1, activity_volunteer: 1 }, // Count 3 (Pass)
        S4: { interviewPercentage: 90 } // Strong Interview (Scholarship confirmed)
      } 
    },
    { name: "Regular Acceptance (65% Academics)", 
      inputs: {
        S1: { documentsVerified: true },
        S2: { marks2ndYear: 700, marksAdmissionTest: 80 }, // 780/1200 = 65% (Pass, No Tier)
        S3: { activity_sports: 1, activity_certificate: 1 }, // Count 2 (Pass)
        S4: { interviewPercentage: 60 } // Interview Pass
      } 
    },
    { name: "Scholarship Revoked (Weak Interview)", 
      inputs: {
        S1: { documentsVerified: true },
        S2: { marks2ndYear: 900, marksAdmissionTest: 80 }, // 980/1200 = 82% (Tier 2)
        S3: { activity_sports: 1, activity_certificate: 1, activity_volunteer: 1 }, // Count 3 (Pass)
        S4: { interviewPercentage: 40 } // Weak Interview (Revoked, but accepted/rejected depending on logic)
      } 
    },
    { name: "Academic Rejection (50% Academics)", 
      inputs: {
        S1: { documentsVerified: true },
        S2: { marks2ndYear: 500, marksAdmissionTest: 100 }, // 600/1200 = 50% (Fail)
      } 
    },
    { name: "Activity Rejection", 
      inputs: {
        S1: { documentsVerified: true },
        S2: { marks2ndYear: 750, marksAdmissionTest: 80 }, // 830/1200 = 69% (Pass)
        S3: { activity_sports: 1 }, // Count 1 (Fail)
      } 
    },
];

function runTestCases() {
    let log = "--- Running Automated Test Suite ---\n";
    let overallPass = true;

    TEST_CASES.forEach(test => {
        let current = 'S0';
        let testHistory = [];
        scholarshipTier = 0; // Reset tier for each test

        log += `\n[TEST START] ${test.name}\n`;
        
        for (let i = 0; i < 5; i++) {
            const nextStateID = 'S' + (i + 1);
            if (current === 'S5' || current === 'S6') break;

            const inputs = test.inputs[nextStateID] || {};
            
            // Special handling for S3 activity count in test inputs
            if (nextStateID === 'S3') {
                let count = 0;
                for (const key in inputs) {
                    if (key.startsWith('activity_') && inputs[key] === 1) count++;
                }
                inputs.activityCount = count;
            }

            const result = transition(current, inputs);
            
            testHistory.push(result);
            current = result.nextState;
            
            log += `  ${result.from} -> ${result.nextState} | Condition: ${result.condition}`;
            if (result.stageScore > 0) log += ` (Score: ${result.stageScore}${current === 'S5' || current === 'S6' ? '' : '%'})`;
            log += '\n';

            if (current === 'S6') break;
        }

        const actualResult = current === 'S5' ? testHistory[testHistory.length - 1].outcome : 'Rejected';
        const expectedOutcome = test.name.includes('Scholarship') ? 'Accepted with' : test.name.includes('Acceptance') ? 'Accepted Regular' : 'Rejected';

        log += `[FINAL] Decision: ${actualResult} (Final State: ${current})\n`;
        
        // Simple comparison: does the actual outcome match the expected category?
        const testPassed = (expectedOutcome === 'Rejected' && actualResult === 'Rejected') || 
                           (expectedOutcome !== 'Rejected' && actualResult.includes('Accepted'));

        if (testPassed) {
            log += `[RESULT] PASS\n`;
        } else {
            log += `[RESULT] FAIL (Expected: ${expectedOutcome}, Got: ${actualResult})\n`;
            overallPass = false;
        }
    });

    log += `\n--- Overall Test Suite ${overallPass ? 'PASSED' : 'FAILED'} ---\n`;
    testLog.textContent = log;
}

// --- 8. Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    transitionButton.addEventListener('click', handleSubmit);
    admissionForm.addEventListener('submit', handleSubmit);
    resetButton.addEventListener('click', resetSimulation);
    runTestButton.addEventListener('click', runTestCases);
    
    updateUI();
});