# PeoplePay360

PeoplePay360 is an integrated Human Resource and Payroll operations platform that goes beyond traditional passive record-keeping. While standard systems process raw HR inputs, PeoplePay360 introduces an active intelligence layer that audits payroll data, connects attendance and leave directly to financial impacts, predicts future budget overruns, and explains anomalies before payments are disbursed.

---

## 🏗️ Architectural Overview

PeoplePay360 is built on a clean, scalable monorepo structure separating a stateless Node.js/Express backend from a cohesive React.js frontend interface, backed by a robust relational MySQL database.

```text
peoplepay360/
├── README.md                 # System documentation & engineering journal
├── backend/                  # Node.js, Express, MySQL API & Intelligence Layer
│   ├── src/
│   │   ├── controllers/      # HTTP request handling logic
│   │   ├── services/         # Business logic, salary rules, & AI/anomaly engines
│   │   ├── routes/           # Modular endpoint routing
│   │   └── middleware/       # RBAC, security validation, & error handling
│   ├── database/             # Relational schema initialization scripts
│   └── package.json
└── frontend/                 # React.js Single Page Application
    ├── src/
    │   ├── components/       # Reusable UI components & navigation shells
    │   ├── views/            # Employee hubs, payrun wizards, & dashboards
    │   └── App.jsx
    └── package.json

```

---

## 💡 Core USPs & Intelligence Layer

1. **AI Payroll Anomaly & Fraud Detection:** Automatically flags unusual salary spikes, unexpected bonus surges, or irregular payment jumps by comparing current values against historical 3-month rolling averages.


2. **Attendance + Leave Payroll Intelligence:** Dynamically bridges day-to-day attendance exceptions and approved/unapproved leave balances directly into live pre-computation wage deductions.


3. **Payroll Cost Prediction & Budget Risk:** Aggregates active contracts, expected overtime trends, and historical increments to forecast next month's total expenditure and alert management to potential budget overruns.


4. **Explainable Payroll Auditor:** Translates algorithmic risk scores into plain-English audit justifications so human resources officers can review exact triggers before finalizing a payrun.



---

## 🗄️ Relational Database Schema (MySQL)

Designed with strict relational integrity, ACID transactions, and period-specific contract tracking:

* **`employees`**: Centralized master profiles mapping department, job position, and manager relationships.


* **`contracts`**: Historical wage logs ensuring payroll calculations bind exclusively to the active period contract.


* **`working_schedules` & `attendance**`: Tracks weekly time patterns, check-ins, check-outs, and manual exception corrections.


* **`time_off_allocations` & `time_off_requests**`: Manages leave balances, types, approval workflows, and automated balance deductions.


* **`salary_structures` & `salary_rules**`: Sequenced calculation rules (Basic $\rightarrow$ Allowances $\rightarrow$ Deductions $\rightarrow$ Gross $\rightarrow$ Net) driving computation logic.


* **`payruns` & `payslips**`: Batch processing containers linking calculated outputs to employees with anomaly risk scores and PDF export support.



---

## 🔒 Security & Engineering Best Practices

* **Parameterized Queries:** Complete protection against SQL injection via strict MySQL driver configurations.
* **Stateless Authentication:** Secure JSON Web Token (JWT) architecture paired with Role-Based Access Control (RBAC) supporting Employee, HR Manager, HR Payroll User, HR Payroll Manager, and Admin tiers.


* **Connection Pooling:** Optimized database resource utilization ensuring smooth execution during high-concurrency bulk payrun generations.
* **Structured Observability:** Standardized server-side logging and predictable JSON response structures for fast debugging during high-pressure environments.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* MySQL Server (v8.0+)

### Backend Setup

```bash
cd backend
npm install
# Configure your .env file with MySQL credentials
npm run dev

```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev

```