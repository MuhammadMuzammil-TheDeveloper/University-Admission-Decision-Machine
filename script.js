const STATES = {
  S1: "Documentation Submission & Verification",
  S2: "Academic Evaluation (Percentage Based)",
  S3: "Extracurricular Activities Check",
  S4: "Interview Evaluation (Percentage)",
  S5: "Accepted / Accepted with Scholarship (Accept State)",
  S6: "Rejected (Reject State)",
};

let studentInfo = {};

// Student info form submission
document
  .getElementById("student-info-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    studentInfo = {
      name: document.getElementById("studentName").value,
      regNo: document.getElementById("regNo").value,
      program: document.getElementById("program").value,
    };

    document.getElementById("admission-panel").classList.remove("hidden");
    document.getElementById("student-info-panel").classList.add("hidden");

    currentState = "S1";
    updateUI();
  });

const THRESHOLDS = {
  ACADEMIC_PASS: 60,
  SCHOLARSHIP_TIER_3: 90,
  SCHOLARSHIP_TIER_2: 80,
  SCHOLARSHIP_TIER_1: 70,
  ACTIVITIES_MIN: 2,
  INTERVIEW_PASS: 50,
  MAX_SECOND_YEAR: 1100,
  MAX_ADMISSION_TEST: 100,
  TOTAL_MAX_SCORE: 1200,
  SCHOLARSHIP_FACTOR: 0.7,
};

let currentState = "S1";
let history = [];
let applicantData = {};
let finalScorePercentage = 0;
let scholarshipTier = 0;

const stageTitle = document.getElementById("stage-title");
const stageInstructions = document.getElementById("stage-instructions");
const admissionForm = document.getElementById("admission-form");
const transitionButton = document.getElementById("transition-button");
const historyLog = document.getElementById("history-log");
const currentStateDisplay = document.getElementById("current-state-display");
const resultDashboard = document.getElementById("result-dashboard");
const resetButton = document.getElementById("reset-button");

// DFA Transition Logic
function transition(current, inputs) {
  let nextState = "S6";
  let outcome = "Rejected";
  let condition = "Transition Failed";
  let score = 0;

  switch (current) {
    case "S1":
      if (inputs.documentsVerified) {
        nextState = "S2";
        outcome = "Documents Verified";
        condition = "All Mandatory Documents Validated";
      } else {
        condition = "Mandatory Document Failure";
      }
      break;

    case "S2":
      const marks2ndYear = inputs.marks2ndYear;
      const marksAdmissionTest = inputs.marksAdmissionTest;
      const totalMarks = marks2ndYear + marksAdmissionTest;
      score = (totalMarks / THRESHOLDS.TOTAL_MAX_SCORE) * 100;
      score = Math.round(score);

      if (score >= THRESHOLDS.ACADEMIC_PASS) {
        nextState = "S3";
        outcome = `Academic Pass (Score: ${score}%)`;

        if (score >= THRESHOLDS.SCHOLARSHIP_TIER_3) {
          scholarshipTier = 30;
        } else if (score >= THRESHOLDS.SCHOLARSHIP_TIER_2) {
          scholarshipTier = 20;
        } else if (score >= THRESHOLDS.SCHOLARSHIP_TIER_1) {
          scholarshipTier = 10;
        }

        condition = `Combined Percentage ${score}% ≥ ${THRESHOLDS.ACADEMIC_PASS}%`;
      } else {
        condition = `Combined Percentage ${score}% < ${THRESHOLDS.ACADEMIC_PASS}%`;
      }
      break;

    case "S3":
      const activityCount = inputs.activityCount;
      nextState = "S4";
      outcome = `Activities Recorded (Count: ${activityCount})`;

      if (scholarshipTier > 0 && activityCount > 0) {
        const bonus = activityCount * 5;
        scholarshipTier = Math.min(scholarshipTier + bonus, 30);
        outcome += ` | Scholarship adjusted to ${scholarshipTier}%`;
      }

      score = 100;
      break;

    case "S4":
      score = inputs.interviewPercentage;

      if (score >= THRESHOLDS.INTERVIEW_PASS) {
        const academicPercentage =
          history.find((h) => h.from === "S2")?.stageScore || 0;

        if (scholarshipTier > 0) {
          if (score >= 70 && academicPercentage >= THRESHOLDS.SCHOLARSHIP_TIER_1) {
            nextState = "S5";
            outcome = `Accepted with ${scholarshipTier}% Scholarship`;
          } else {
            nextState = "S5";
            outcome = "Accepted Regular (Scholarship Revoked)";
            scholarshipTier = 0;
          }
        } else {
          nextState = "S5";
          outcome = "Accepted Regular";
        }
      } else {
        condition = `Interview Score ${score}% < ${THRESHOLDS.INTERVIEW_PASS}%`;
      }
      break;
  }

  return { nextState, outcome, condition, stageScore: score };
}

// Render forms for each state (unchanged)
function renderForm(state) {
  let html = "";

  let buttonText = "Submit and Evaluate Stage";
  if (state === "S4") buttonText = "Final Evaluation and Decision";
  transitionButton.textContent = buttonText;

  switch (state) {
    case "S1":
      html = `<label>
                <input type="checkbox" name="documentsVerified" id="documentsVerified" required>
                I confirm that all submitted documents have been reviewed and verified by the admission office.
              </label>`;
      break;

    case "S2":
      html = `<p>Formula: ((2nd Year Marks + Admission Score) / ${THRESHOLDS.TOTAL_MAX_SCORE}) * 100. Min Pass: ${THRESHOLDS.ACADEMIC_PASS}%. Scholarship Tiers: 70%, 80%, 90%.</p>
              <label for="marks2ndYear">2nd Year Marks (Max ${THRESHOLDS.MAX_SECOND_YEAR}):</label>
              <input type="number" id="marks2ndYear" name="marks2ndYear" min="0" max="${THRESHOLDS.MAX_SECOND_YEAR}" required value="750">
              <label for="marksAdmissionTest">Admission Test Score (Max ${THRESHOLDS.MAX_ADMISSION_TEST}):</label>
              <input type="number" id="marksAdmissionTest" name="marksAdmissionTest" min="0" max="${THRESHOLDS.MAX_ADMISSION_TEST}" required value="70">`;
      break;

    case "S3":
      const activityCount = inputs.activityCount;

      // Always go to S4, no rejection
      nextState = "S4";
      outcome = `Activities Recorded (Count: ${activityCount})`;

      // Add bonus to scholarship only if user selected any activity
      if (activityCount > 0 && scholarshipTier > 0) {
        const bonus = activityCount * 5; // 5% per activity
        scholarshipTier = Math.min(scholarshipTier + bonus, 30); // Cap at 30%
        outcome += ` | Scholarship adjusted to ${scholarshipTier}%`;
      }

      score = 100; // mark as "passed" stage for logging
      condition = ""; // remove condition text
      break;

    case "S4":
      html = `<p>Minimum required percentage for pass: <strong>${THRESHOLDS.INTERVIEW_PASS}%</strong>.</p>
              <label for="interviewPercentage">Interview Evaluation Score (Percentage 0-100):</label>
              <input type="number" id="interviewPercentage" name="interviewPercentage" min="0" max="100" required value="75">
              <p class="note">Current Academic Tier: <strong>${scholarshipTier}% Scholarship Tentative</strong>.</p>
              <p class="note">Final Scholarship will be confirmed if Interview score is also strong (e.g., > 70%).</p>`;
      break;
  }
  admissionForm.innerHTML = html;
}

function updateUI() {
  stageTitle.textContent = `${currentState}: ${STATES[currentState]}`;
  currentStateDisplay.textContent = currentState;
  currentStateDisplay.className = `state-tag s${currentState.slice(1)}`;

  if (currentState === "S5" || currentState === "S6") {
    transitionButton.classList.add("hidden");
    admissionForm.classList.add("hidden");
    renderResultDashboard();
    renderDFA();
  } else {
    transitionButton.classList.remove("hidden");
    admissionForm.classList.remove("hidden");
    resultDashboard.classList.add("hidden");
    renderForm(currentState);
  }
}

// Updated Log Function: only state tags and outcome, no condition text
function updateLog(fromState, toState, outcome, condition, score) {
  if (fromState === "S0") return;

  const listItem = document.createElement("li");
  listItem.classList.add(toState === "S6" ? "log-fail" : "log-pass");

  let scoreDisplay =
    score > 0 && fromState !== "S3"
      ? ` (Score: ${score}${fromState === "S4" || fromState === "S2" ? "%" : ""})`
      : "";

  listItem.innerHTML = `
        <span class="state-tag s${fromState.slice(1)}">${fromState}</span>
        → 
        <span class="state-tag s${toState.slice(1)}">${toState}</span>
        <strong>${outcome}</strong>${scoreDisplay}
    `;
  historyLog.prepend(listItem);
}

// Updated result dashboard: removed print report button
function renderResultDashboard() {
  const lastTransition = history[history.length - 1];
  const isAccepted = lastTransition.to === "S5";
  const decisionText = lastTransition.outcome;

  resultDashboard.classList.remove("hidden");
  resultDashboard.className = isAccepted
    ? "result-accepted"
    : "result-rejected";

  const academicStep = history.find((h) => h.from === "S2");
  const academicPercentage = academicStep ? academicStep.stageScore : "N/A";

  let studentInfoHTML = `
    <h2>🎓 Admission Decision Report</h2>
    <div class="student-info-card">
      <p><strong>Student Name:</strong> ${studentInfo.name || "-"}</p>
      <p><strong>Registration No:</strong> ${studentInfo.regNo || "-"}</p>
      <p><strong>Program:</strong> ${studentInfo.program || "-"}</p>
    </div>
    <hr>
  `;

  let html = `
  ${studentInfoHTML}
  <h2>${isAccepted ? "FINAL DECISION: " + decisionText : "FINAL DECISION: Rejected"}</h2>
  <div class="decision-card ${isAccepted ? 'decision-accepted' : 'decision-rejected'}">
    <p class="outcome-text">
      <strong>Decision:</strong> ${decisionText}
    </p>
  </div>
  <h3>Evaluation Summary</h3>
  `;

  if (isAccepted) {
    html += `<p>Congratulations! You successfully passed all required stages of the evaluation process. ${scholarshipTier > 0 && decisionText.includes("Scholarship")
        ? `A ${scholarshipTier}% scholarship has been awarded based on performance.`
        : "No scholarship was granted."
      }</p>`;
  } else {
    const failureStep = history.find((step) => step.to === "S6");
    html += `<p>The application was rejected at <strong>${failureStep.from}: ${STATES[failureStep.from]}</strong>.</p>`;
  }

  resultDashboard.innerHTML = html;
}

// --- Event Handlers ---
function handleSubmit(event) {
  event.preventDefault();

  const inputs = {};
  const formData = new FormData(admissionForm);

  let activityCount = 0;

  for (let [key, value] of formData.entries()) {
    if (key.startsWith("activity_")) {
      if (value === "1") activityCount++;
      continue;
    } else if (value === "on") {
      inputs[key] = true;
    } else if (!isNaN(parseFloat(value))) {
      inputs[key] = parseFloat(value);
    } else {
      inputs[key] = value;
    }
  }
  inputs.activityCount = activityCount;

  const result = transition(currentState, inputs);

  const previousState = currentState;
  currentState = result.nextState;

  applicantData = { ...applicantData, ...inputs };
  history.push({
    from: previousState,
    to: currentState,
    outcome: result.outcome,
    condition: result.condition,
    stageScore: result.stageScore,
  });

  updateLog(
    previousState,
    currentState,
    result.outcome,
    result.condition,
    result.stageScore
  );
  updateUI();
}

function resetSimulation() {
  currentState = "S1";
  history = [];
  applicantData = {};
  scholarshipTier = 0;
  historyLog.innerHTML = "";
  resultDashboard.classList.add("hidden");
  document.getElementById("admission-panel").classList.add("hidden");
  document.getElementById('student-info-panel').classList.remove('hidden');
  updateUI();
}

// DFA rendering function (unchanged)
function renderDFA() {
  if (!history.length) return;
  const old = document.getElementById("dfa-container");
  if (old) old.remove();

  const svgWidth = 1000;
  const svgHeight = 280;
  const centerY = svgHeight / 2;

  const states = [];
  history.forEach(step => {
    if (!states.includes(step.from)) states.push(step.from);
    if (!states.includes(step.to)) states.push(step.to);
  });

  const spacing = svgWidth / (states.length + 1);
  const pos = {};
  states.forEach((s, i) => {
    pos[s] = { x: spacing * (i + 1), y: centerY };
  });

  let nodes = "";
  states.forEach(state => {
    let fill = "#607d8b";
    if (state === "S5") fill = "#4CAF50";
    if (state === "S6") fill = "#f44336";

    nodes += `
      <g>
        <circle cx="${pos[state].x}" cy="${pos[state].y}" r="30"
                fill="${fill}" stroke="#000" stroke-width="2"/>
        ${state === "S5" ? `<circle cx="${pos[state].x}" cy="${pos[state].y}" r="36" fill="none" stroke="#000" stroke-width="2"/>` : ""}
        <text x="${pos[state].x}" y="${pos[state].y + 5}"
              text-anchor="middle" font-size="14"
              font-weight="bold" fill="#fff">${state}</text>
      </g>
    `;
  });

  let arrows = "";
  history.forEach(step => {
    const from = pos[step.from];
    const to = pos[step.to];
    arrows += `
      <line x1="${from.x + 30}" y1="${from.y}"
            x2="${to.x - 30}" y2="${to.y}"
            stroke="#ff5722" stroke-width="3"
            marker-end="url(#arrowhead)" />
    `;
  });

  const start = states[0];
  const startArrow = `
    <line x1="${pos[start].x - 70}" y1="${pos[start].y}"
          x2="${pos[start].x - 30}" y2="${pos[start].y}"
          stroke="#000" stroke-width="3"
          marker-end="url(#arrowhead)" />
  `;

  const svg = `
    <div id="dfa-container" style="margin-top:25px">
      <h3 style="text-align:center;margin-bottom:10px;">DFA Execution Path</h3>
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="auto"
           style="background:#fafafa;border-radius:10px;box-shadow:0 8px 20px rgba(0,0,0,0.1)">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10"
                  refX="6" refY="5" orient="auto">
            <path d="M0,0 L0,10 L10,5 Z" fill="#000"/>
          </marker>
        </defs>
        ${startArrow}
        ${arrows}
        ${nodes}
      </svg>
    </div>
  `;

  resultDashboard.insertAdjacentHTML("beforeend", svg);
}

document.addEventListener("DOMContentLoaded", () => {
  transitionButton.addEventListener("click", handleSubmit);
  admissionForm.addEventListener("submit", handleSubmit);
  resetButton.addEventListener("click", resetSimulation);
  updateUI();
});

