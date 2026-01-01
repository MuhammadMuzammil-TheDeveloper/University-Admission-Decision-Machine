

# 🎓 University Admission Decision System

### *(Automata Theory – Semester Project)*

## 📌 Project Overview

The **University Admission Decision System** is a **Deterministic Finite Automaton (DFA) based web application** that simulates the complete admission decision process of a university.

This project is developed as a **semester project for Automata Theory**, where real-world admission rules are modeled using **states, transitions, input symbols, and accept/reject states**.

The system processes a student’s application step-by-step and finally **accepts or rejects** the applicant based on predefined conditions.

---

## 🎯 Objectives

* To **apply Automata Theory concepts** in a real-life system
* To design a **Deterministic Finite Automaton (DFA)** for admission decision making
* To show how **states and transitions** control system behavior
* To visualize the **DFA execution path**
* To demonstrate how theory maps to practical software systems

---

## 🧠 Automata Theory Concept Used

This project is **entirely based on DFA (Deterministic Finite Automaton)**.

### Formal DFA Representation

**DFA = (Q, Σ, δ, q₀, F)**

* **Q (States)**

  * S1 – Documentation Submission & Verification
  * S2 – Academic Evaluation
  * S3 – Extracurricular Activities Check
  * S4 – Interview Evaluation
  * S5 – Accepted *(Accept State)*
  * S6 – Rejected *(Reject State)*

* **Σ (Input Alphabet)**

  * Document verification (Yes / No)
  * Academic scores
  * Extracurricular activity count
  * Interview percentage

* **δ (Transition Function)**

  * Defined using logical conditions (thresholds & validations)

* **q₀ (Start State)**

  * S1 (Documentation Verification)

* **F (Final States)**

  * S5 → Accepted
  * S6 → Rejected

---

## 🔄 State Transition Flow

```
S1 → S2 → S3 → S4 → S5 (Accepted)
         ↘      ↘
          S6      S6 (Rejected)
```

Each transition depends on **clear deterministic rules**, ensuring **no ambiguity**, which makes DFA the most suitable automaton for this system.

---

## 🧩 State-wise Explanation

### 🔹 S1: Documentation Verification

* Checks if mandatory documents are verified
* If verified → move to S2
* If not → move to S6 (Rejected)

---

### 🔹 S2: Academic Evaluation

* Evaluates:

  * 2nd Year Marks
  * Admission Test Score
* Calculates percentage score
* If score ≥ 60% → move to S3
* Else → move to S6

---

### 🔹 S3: Extracurricular Activities Check

* Minimum **1 activity required**
* If requirement met → move to S4
* Else → move to S6

---

### 🔹 S4: Interview Evaluation

* Interview score evaluated
* If score ≥ 50% → move to S5
* Else → move to S6

---

### 🔹 S5: Accepted (Final Accept State)

* Applicant successfully admitted

---

### 🔹 S6: Rejected (Final Reject State)

* Applicant rejected at some evaluation stage

---

## 📊 DFA Visualization

The system dynamically generates a **graphical DFA execution path** using SVG:

* States are shown as nodes
* Transitions are shown as arrows
* Conditions are displayed on transitions
* Accepted state (Green)
* Rejected state (Red)

This visualization helps in **understanding DFA traversal clearly**.

---

## 💡 Why DFA and Not PDA or TM?

| Automaton      | Reason                                                              |
| -------------- | ------------------------------------------------------------------- |
| **DFA**        | Best choice because rules are fixed, deterministic, and memory-less |
| PDA            | Not required because no stack or nested structure is involved       |
| Turing Machine | Overkill for a rule-based decision system                           |

✔ **Admission decisions depend only on current input, not history**, which perfectly matches DFA behavior.

---

## 🛠 Technologies Used

* **HTML** – User Interface
* **CSS** – Styling & Visualization
* **JavaScript (Vanilla)** – DFA logic & transitions
* **SVG** – DFA graph rendering

---

## 🚀 Features

* Step-by-step DFA simulation
* Real-time transition logging
* Dynamic state rendering
* Admission decision dashboard
* DFA execution path visualization
* Reset and re-simulation support

---

## ▶️ How to Run the Project

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/admission-dfa-system.git
   ```
2. Open `index.html` in any modern browser
3. Enter student information
4. Move through DFA states using form inputs
5. View final decision and DFA path

---

## 📚 Academic Relevance

* Strong example of **theory → practical implementation**
* Suitable for:

  * Automata Theory Semester Project
  * Viva / Lab Demonstration
  * DFA Concept Presentation
* Demonstrates:

  * States
  * Transitions
  * Accept/Reject conditions
  * Deterministic behavior

---

## 👨‍🎓 Developed By

**Muhammad Muzammil**
BS Computer Science
Semester Project – Automata Theory

---

## 📄 License

This project is developed **for educational purposes only**.

