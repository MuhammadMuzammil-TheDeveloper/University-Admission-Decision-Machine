
const States = {
  S1: "Documentation Submission & Verification",
  S2: "Academic Evaluation",
  S3: "Extracurricular Activities Check",
  S4: "Interview Evaluation (Percentage)",
  S5: "Accepted (Accept State)",
  S6: "Rejected (Reject State)",
};

let studentInfo = {};
let currentState = "S1";
let history = [];
let applicantData = {};

const THRESHOLDS = {
  ACADEMIC_PASS: 60,
  INTERVIEW_PASS: 50,
  MAX_SECOND_YEAR: 1100,
  MAX_ADMISSION_TEST: 100,
  TOTAL_MAX_SCORE: 1200,
};

const stateTitle = document.getElementById("stage-title");
const admissionForm = document.getElementById("admission-form");
const transitionButton = document.getElementById("transition-button");
const historyLog = document.getElementById("history-log");
const currentStateDisplay = document.getElementById("current-state-display");
const resultDashboard = document.getElementById("result-dashboard");
const resetButton = document.getElementById("reset-button");

// Transitional Log:
function transition(current, inputs) {
  let nextState = "S6"; // default reject
  let outcome = "Rejected";
  let condition = "";
  let score = 0;

  switch (current) {
    case "S1":
      if (inputs.documentsVerified) {
        nextState = "S2";
        outcome = "Documents Verified";
        condition = "Mandatory documents verified";
      } else {
        condition = "Mandatory documents missing";
      }
      break;

    case "S2":
      const marks2ndYear = inputs.marks2ndYear;
      const marksAdmissionTest = inputs.marksAdmissionTest;

      score = Math.round(
        ((marks2ndYear + marksAdmissionTest) /
          THRESHOLDS.TOTAL_MAX_SCORE) *
          100
      );

      if (score >= THRESHOLDS.ACADEMIC_PASS) {
        nextState = "S3";
        outcome = `Academic Pass (${score}%)`;
        condition = `Academic score ≥ ${THRESHOLDS.ACADEMIC_PASS}%`;
      } else {
        condition = `Academic score < ${THRESHOLDS.ACADEMIC_PASS}%`;
      }
      break;

    case "S3":
      if (inputs.activityCount >= 1) {
        nextState = "S4";
        outcome = "Extracurricular Requirement Met";
        condition = "At least 1 extracurricular activity";
        score = 100;
      } else {
        condition = "No extracurricular activities";
      }
      break;

    case "S4":
      score = inputs.interviewPercentage;
      if (score >= THRESHOLDS.INTERVIEW_PASS) {
        nextState = "S5";
        outcome = "Accepted";
        condition = `Interview score ≥ ${THRESHOLDS.INTERVIEW_PASS}%`;
      } else {
        condition = `Interview score < ${THRESHOLDS.INTERVIEW_PASS}%`;
      }
      break;
  }

  return { nextState, outcome, condition, stageScore: score };
}


// Render Form for Each Stage: 
function renderForm(state) {
  let html = "";
  let buttonText =
    state === "S4"
      ? "Final Evaluation and Decision"
      : "Submit and Evaluate Stage";
  transitionButton.textContent = buttonText;

  switch (state) {
    case "S1":
      html = `<label>
                <input type="checkbox" name="documentsVerified" id="documentsVerified" required>
                I confirm that all submitted documents have been reviewed and verified by the admission office.
              </label>`;
      break;

    case "S2":
      html = `
        <label for="marks2ndYear">2nd Year Marks (Max ${THRESHOLDS.MAX_SECOND_YEAR}):</label>
        <input type="number" id="marks2ndYear" name="marks2ndYear" min="0" max="${THRESHOLDS.MAX_SECOND_YEAR}" required value="750">
        <label for="marksAdmissionTest">Admission Test Score (Max ${THRESHOLDS.MAX_ADMISSION_TEST}):</label>
        <input type="number" id="marksAdmissionTest" name="marksAdmissionTest" min="0" max="${THRESHOLDS.MAX_ADMISSION_TEST}" required value="70">
      `;
      break;

    case "S3":
      html = `
        <div class="activity-checkboxes">
          <label><input type="checkbox" name="activity_sports" value="1"> Competitive Sports Participation</label>
          <label><input type="checkbox" name="activity_certificate" value="1"> Advanced Skill Certificate</label>
          <label><input type="checkbox" name="activity_volunteer" value="1"> Volunteer/Community Service</label>
        </div>
        <input type="hidden" id="activityCount" name="activityCount" value="0">
      `;

      setTimeout(() => {
        const formEl = document.getElementById("admission-form");
        const updateCount = () => {
          let count = 0;
          formEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
            if (cb.checked) count++;
          });
          document.getElementById("activityCount").value = count;
        };
        formEl
          .querySelectorAll('input[type="checkbox"]')
          .forEach((cb) => cb.addEventListener("change", updateCount));
      }, 0);
      break;

    case "S4":
      html = `
        <label for="interviewPercentage">Interview Evaluation Score (0-100):</label>
        <input type="number" id="interviewPercentage" name="interviewPercentage" min="0" max="100" required value="75">
      `;
      break;
  }

  admissionForm.innerHTML = html;
}

// Update UI:
function updateUI() {
  stateTitle.textContent = `${currentState}: ${States[currentState]}`;
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

// Log update:
function updateLog(fromState, toState, outcome, condition, score) {
  if (fromState === "S0") return;

  const listItem = document.createElement("li");
  listItem.classList.add(toState === "S6" ? "log-fail" : "log-pass");

  let scoreDisplay =
    score > 0 && fromState !== "S3" ? ` (Score: ${score}%)` : "";

  listItem.innerHTML = `
    <span class="state-tag s${fromState.slice(1)}">${fromState}</span> → 
    <span class="state-tag s${toState.slice(1)}">${toState}</span>
    <strong>${outcome}</strong>${scoreDisplay}
  `;
  historyLog.prepend(listItem);
}

// Result dashboard:
function renderResultDashboard() {
  const lastTransition = history[history.length - 1];
  const isAccepted = lastTransition.to === "S5";
  const decisionText = lastTransition.outcome;

  resultDashboard.classList.remove("hidden");
  resultDashboard.className = isAccepted
    ? "result-accepted"
    : "result-rejected";

  let studentInfoHTML = `
    <h2>🎓 Admission Decision Report</h2>
    <div class="student-info-card">
      <p><strong>Student Name:</strong> ${Info.name || "-"}</p>
      <p><strong>Registration No:</strong> ${Info.regNum || "-"}</p>
      <p><strong>Program:</strong> ${Info.program || "-"}</p>
    </div>
    <hr>
  `;

  let html = `
    ${studentInfoHTML}
    <h2>FINAL DECISION: ${isAccepted ? decisionText : "Rejected"}</h2>
    <div class="decision-card ${
      isAccepted ? "decision-accepted" : "decision-rejected"
    }">
      <p class="outcome-text"><strong>Decision:</strong> ${decisionText}</p>
    </div>
  `;

  if (!isAccepted) {
    const failureStep = history.find((step) => step.to === "S6");
    html += `<p>The application was rejected at <strong>${failureStep.from}: ${
      States[failureStep.from]
    }</strong>.</p>`;
  }

  resultDashboard.innerHTML = html;
}

// Form handling:
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

// Reset process:
function resetSimulation() {
  currentState = "S1";
  history = [];
  applicantData = {};
  historyLog.innerHTML = "";
  resultDashboard.classList.add("hidden");
  document.getElementById("admission-panel").classList.add("hidden");
  document.getElementById("studentInfo-panel").classList.remove("hidden");
  updateUI();
}

// DFA:
function renderDFA() {
  if (!history.length) return;
  const old = document.getElementById("dfa-container");
  if (old) old.remove();

  const svgWidth = 1000;
  const svgHeight = 280;
  const centerY = svgHeight / 2;
  const states = [];
  history.forEach((step) => {
    if (!states.includes(step.from)) states.push(step.from);
    if (!states.includes(step.to)) states.push(step.to);
  });
  const spacing = svgWidth / (states.length + 1);
  const pos = {};
  states.forEach((s, i) => (pos[s] = { x: spacing * (i + 1), y: centerY }));

  let nodes = "";
  states.forEach((state) => {
    let fill = "#607d8b";
    if (state === "S5") fill = "#4CAF50";
    if (state === "S6") fill = "#f44336";

    nodes += `
      <g>
        <circle cx="${pos[state].x}" cy="${
      pos[state].y
    }" r="30" fill="${fill}" stroke="#000" stroke-width="2"/>
        <text x="${pos[state].x}" y="${
      pos[state].y + 5
    }" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">${state}</text>
      </g>
    `;
  });
let arrows = "";
let labels = "";

history.forEach((step) => {
  const from = pos[step.from];
  const to = pos[step.to];

  const midX = (from.x + to.x) / 2;
  const midY = from.y - 40;

  arrows += `
    <line x1="${from.x + 30}" y1="${from.y}"
          x2="${to.x - 30}" y2="${to.y}"
          stroke="#ff5722" stroke-width="3"
          marker-end="url(#arrowhead)" />
  `;

  labels += `
  <g>
    <rect x="${midX - 90}" y="${midY - 14}"
          width="180" height="22"
          rx="5" ry="5"
          fill="#ffffff" stroke="#ccc"/>
    <text x="${midX}" y="${midY}"
          text-anchor="middle"
          font-size="12"
          font-weight="600"
          fill="#000">
      ${step.condition}
    </text>
  </g>
`;
});


  const startArrow = `<line x1="${pos[states[0]].x - 70}" y1="${centerY}" x2="${
    pos[states[0]].x - 30
  }" y2="${centerY}" stroke="#000" stroke-width="3" marker-end="url(#arrowhead)" />`;

  const svg = `
    <div id="dfa-container" style="margin-top:25px">
      <h3 style="text-align:center;margin-bottom:10px;">DFA Execution Path</h3>
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="auto"
           style="background:#fafafa;border-radius:10px;box-shadow:0 8px 20px rgba(0,0,0,0.1)">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M0,0 L0,10 L10,5 Z" fill="#000"/>
          </marker>
        </defs>
        ${startArrow}${arrows}${labels}${nodes}

      </svg>
    </div>
  `;
  resultDashboard.insertAdjacentHTML("beforeend", svg);
}

// Initial setup:
document.addEventListener("DOMContentLoaded", () => {
  transitionButton.addEventListener("click", handleSubmit);
  admissionForm.addEventListener("submit", handleSubmit);
  resetButton.addEventListener("click", resetSimulation);
  updateUI();
});

// Student info form:
const studentInfoForm = document.querySelector('#studentInfo-form');
studentInfoForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.querySelector('#studentName');
  const regNum = document.querySelector('#regNum');
  const program = document.querySelector('#program');
  Info = {
    name: name.value,
    regNum: regNum.value,
    program: program.value
  }
    document.querySelector("#admission-panel").classList.remove("hidden");
    document.querySelector("#studentInfo-panel").classList.add("hidden");
    currentState = "S1";
    updateUI();
})
