# PeoplePay360 — Intelligent HR & Payroll Operations Platform

PeoplePay360 is an integrated enterprise Human Resource and Payroll operations platform that goes beyond traditional passive record-keeping. While standard systems process raw HR inputs, PeoplePay360 introduces an **active intelligence layer** that audits payroll data, connects attendance and leaves directly to financial adjustments, predicts future budget overruns, and explains anomalies with clear justifications before disbursements are executed.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Key Features & Intelligence Modules](#-key-features--intelligence-modules)
- [Technology Stack](#-technology-stack)
- [Database Schema (MySQL 8.0+)](#-database-schema-mysql-80)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
- [Project Directory Structure](#-project-directory-structure)
- [API Reference](#-api-reference)
- [Setup & Installation](#-setup--installation)

---

## 🏗️ Architectural Overview

PeoplePay360 is engineered as a decoupled monorepo combining a high-throughput Node.js/Express REST backend with an interactive React single-page application, powered by a relational MySQL database enforcing strict referential integrity.

```
                    ┌─────────────────────────┐
                    │    React 19 + Vite      │
                    │   Tailwind + Lucide UI  │
                    └───────────┬─────────────┘
                                │ HTTP / REST (JWT)
                                ▼
                    ┌─────────────────────────┐
                    │   Express.js API Layer  │
                    │   RBAC + Auth Guards    │
                    └───────────┬─────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Attendance Hooks │  │ AI Anomaly Engine│  │ PDF Generation   │
│ & Leave Bridge   │  │ & Fraud Auditor  │  │ (PDFKit Engine)  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
                    ┌─────────────────────────┐
                    │    MySQL 8.0 Database   │
                    │ InnoDB, ACID, Pool Conn │
                    └─────────────────────────┘
```

---

## 💡 Key Features & Intelligence Modules

### 1. 🤖 AI Payroll Anomaly & Fraud Detection Engine
* **Rolling Historical Variance:** Evaluates employee earnings against a 3-month rolling baseline to flag wage spikes ($>25\%$), critical surges ($>50\%$), or unexpected drops ($<-35\%$).
* **Contract Ceiling Safeguards:** Catches discrepancies where gross earnings exceed contractual baselines by $>60\%$.
* **Impossible Shift & Overtime Flags:** Detects non-human or erratic shifts ($>14$ consecutive hours), unclosed clock-out sessions, and midnight punches ($00:00$–$04:00$).
* **Ghost Employee Detection:** Audits duplicate email addresses or payroll banking destinations across identities.
* **Audit Resolution Hub:** Interactive dashboard enabling HR Auditors to investigate risk scores, review plain-text explanations, and mark logs as *Reviewed*, *Dismissed*, or *Resolved*.

### 2. ⏱️ Dynamic Attendance & Leave-to-Payroll Bridge
* **Automated Penalty Computations:** Automatically calculates financial deductions for unapproved absences and late check-ins exceeding the 15-minute grace threshold.
* **Overtime Accrual:** Accrues $1.5\times$ base hourly rate for authorized overtime hours.
* **Leave-Type Sensitivity:** Differentiates between paid allocations (Vacation, Sick Leave) and unpaid leaves, automatically reducing standard payable days during payrun generation.
* **Company Health Metrics:** Aggregates real-time timesheet discrepancies, attendance health scores, and estimated payroll impacts.

### 3. 📊 Predictive Budgeting & Cost Forecasting
* **Next-Month Expenditure Forecast:** Evaluates active contracts, standard inflation buffers, and historical trends to forecast upcoming payroll overhead.
* **Departmental Variance:** Analyzes department-by-department payroll distribution (Engineering, HR, Finance, Operations, Sales, Marketing) to spot rising labor costs.

### 4. 📝 Core HR & Contract Management
* **Employee Directory:** Centralized employee records with department, job title, contact details, status flags, and hierarchical manager links.
* **Period-Specific Contracts:** Multi-contract lifecycle tracking (`Draft`, `Active`, `Expired`, `Cancelled`) tied to salary structures, standard hours, and base wages.
* **Working Schedules:** Configurable shift patterns defining standard working days and expected shift hours.

### 5. 💰 Payrun Processing & Branded PDF Payslips
* **Batch Payrun Wizard:** Create, calculate, audit, approve, and execute organization-wide payruns.
* **Granular Salary Breakdowns:** Itemized payslip lines detailing Basic Pay, Allowances, Gross Pay, Deductions, and Net Take-Home.
* **Direct PDF Streaming:** In-browser preview and download of official, branded company payslips rendered using PDFKit.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router v7, Lucide React, Tailwind CSS / Custom Variables, Axios |
| **Backend** | Node.js (v18+), Express 4, MySQL2 (Connection Pool), JWT, BcryptJS, PDFKit, Winston Logger |
| **Database** | MySQL 8.0+ (InnoDB Engine, utf8mb4 collation, ACID compliant) |
| **Tooling & DX**| Nodemon, Dotenv, Morgan, Helmet, CORS |

---

## 🗄️ Database Schema (MySQL 8.0+)

The database comprises normalized relational tables designed for full transactional consistency:

* **`users`**: Authentication credentials, password hashes, linked `employee_id`, active status, and RBAC roles.
* **`employees`**: Master personnel directory with manager hierarchy (`manager_id` foreign key).
* **`contracts`**: Employment contracts mapping wages, status, and active dates to employees.
* **`working_schedules`**: Shift schedules defining weekly patterns and target daily hours.
* **`attendance`**: Daily clock-in/out records with worked hours, overtime, and exception flags.
* **`time_off_types`**: Leave classification master (e.g., Paid Vacation, Sick Leave, Unpaid Leave).
* **`time_off_allocations`**: Annual employee leave balance allowances.
* **`time_off_requests`**: Leave applications with multi-step status workflows (`Pending`, `Approved`, `Rejected`).
* **`salary_structures` & `salary_rules`**: Computation rules driving statutory deductions and allowances.
* **`payruns`**: Batch payroll containers tracking pay periods, aggregate payouts, and run states.
* **`payslips`**: Itemized employee payout vouchers with risk scores and JSON audit logs.
* **`anomaly_logs`**: Recorded fraud and audit flags with severity levels, descriptions, and resolution histories.

---

## 🔐 Role-Based Access Control (RBAC)

The system enforces strict permission gates across frontend views and backend REST controllers:

| Role | Dashboard | Employees | Contracts | Attendance | Time Off | Payroll & Runs | Audit & Reports |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin** | Full | Full CRUD | Full CRUD | View & Exceptions | Approve / Reject | Full Processing | Full Access |
| **HR Manager** | Full | Full CRUD | Full CRUD | View & Exceptions | Approve / Reject | View Only | Full Access |
| **HR Payroll Manager** | Full | View / Edit | Full CRUD | View & Exceptions | Approve / Reject | Full Processing | Full Access |
| **Finance Auditor** | Full | View Only | View Only | View Only | View Only | View / Audit | Full Access |
| **Employee** | Self View | Directory | Own Contract | Clock In / Out | Request & Balances | Own Payslips | No Access |

---

## 👥 Pre-Configured Demo Accounts

Run `npm run seed` in the `backend/` directory to populate the database with these 10 verified test profiles:

| Name | Role | Email | Password | Department | Base Wage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sarah Connor** | `Admin` | `admin@peoplepay360.com` | `Admin@123` | Management | $150,000 |
| **John Smith** | `HR_Manager` | `hr@peoplepay360.com` | `HrPass@123` | Human Resources | $95,000 |
| **Alice Johnson** | `HR_Payroll_Manager` | `payroll@peoplepay360.com` | `Payroll@123` | Finance | $88,000 |
| **Robert Williams** | `Finance_Auditor` | `auditor@peoplepay360.com` | `Audit@123` | Finance | $82,000 |
| **Jane Doe** | `Employee` | `jane.doe@peoplepay360.com` | `Employee@123` | Engineering | $75,000 |
| **Michael Brown** | `Employee` | `michael.brown@peoplepay360.com` | `Employee@123` | Engineering | $70,000 |
| **Emily Davis** | `Employee` | `emily.davis@peoplepay360.com` | `Employee@123` | Marketing | $65,000 |
| **David Wilson** | `Employee` | `david.wilson@peoplepay360.com` | `Employee@123` | Operations | $68,000 |
| **Priya Sharma** | `Employee` | `priya.sharma@peoplepay360.com` | `Employee@123` | Engineering | $72,000 |
| **Carlos Garcia** | `Employee` | `carlos.garcia@peoplepay360.com` | `Employee@123` | Sales | $60,000 |

---

## 📁 Project Directory Structure

```text
odoohackathon_peoplepay360_pritam-pedro/
├── readme.md                           # System documentation
├── backend/                            # Express.js REST API & Engine
│   ├── database/
│   │   └── schema.sql                  # MySQL database initialization script
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # MySQL2 connection pool setup
│   │   ├── controllers/                # Request validation and dispatchers
│   │   │   ├── attendanceController.js
│   │   │   ├── authController.js
│   │   │   ├── contractController.js
│   │   │   ├── employeeController.js
│   │   │   ├── intelligenceController.js
│   │   │   ├── payrunController.js
│   │   │   ├── payslipController.js
│   │   │   ├── scheduleController.js
│   │   │   └── timeOffController.js
│   │   ├── middleware/
│   │   │   ├── auth.js                 # JWT verification & RBAC authorization
│   │   │   └── errorHandler.js         # Centralized error handler
│   │   ├── routes/                     # Modular API route definitions
│   │   ├── services/                   # Core business logic & intelligence
│   │   │   ├── anomalyService.js       # Statistical fraud & anomaly detection
│   │   │   ├── attendanceHookService.js# Attendance-to-payroll calculations
│   │   │   ├── attendanceService.js
│   │   │   ├── contractService.js
│   │   │   ├── employeeService.js
│   │   │   ├── payrunService.js        # Salary computation & payrun lifecycle
│   │   │   ├── pdfService.js           # PDFKit payslip streaming
│   │   │   └── timeOffService.js
│   │   └── utils/
│   │       ├── logger.js               # Winston logging utility
│   │       └── seed.js                 # Database seeder (10 users + demo data)
│   ├── .env.example
│   └── package.json
└── frontend/                           # Vite + React Single Page App
    ├── src/
    │   ├── components/
    │   │   ├── attendance/             # Clock widget & timesheet reviews
    │   │   ├── common/                 # Button, Card, Modal, RoleGuard, etc.
    │   │   ├── layout/                 # Sidebar, Navbar, MainLayout
    │   │   └── payrun/                 # Payrun wizard steps
    │   ├── context/
    │   │   └── AuthContext.jsx         # Global user auth & session state
    │   ├── services/                   # Axios API service wrappers
    │   │   ├── api.js                  # Axios instance with JWT interceptors
    │   │   ├── attendanceApi.js
    │   │   ├── authApi.js
    │   │   ├── contractApi.js
    │   │   ├── employeeApi.js
    │   │   ├── intelligenceApi.js
    │   │   ├── payrollApi.js
    │   │   └── timeOffApi.js
    │   ├── views/                      # Application views
    │   │   ├── Attendance.jsx
    │   │   ├── Contracts.jsx & ContractForm.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Employees.jsx & EmployeeForm.jsx
    │   │   ├── Login.jsx & Register.jsx
    │   │   ├── Payroll.jsx & PayrollAnalytics.jsx
    │   │   ├── Reports.jsx
    │   │   ├── TimeOff.jsx & TimeOffAllocations.jsx
    │   │   └── payroll/                # Payrun creation & payslip inspectors
    │   ├── App.jsx                     # Route registry with RoleGuard
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## 📡 API Reference

All protected endpoints require the `Authorization: Bearer <JWT>` header.

### Authentication (`/api/auth`)
* `POST /api/auth/login` — Authenticate user and receive JWT.
* `POST /api/auth/register` — Register a new account and linked employee record.
* `GET  /api/auth/me` — Retrieve active session identity and permissions.
* `POST /api/auth/logout` — Invalidate user session.

### Employees & Contracts (`/api/employees`, `/api/contracts`)
* `GET    /api/employees` — List employees with department/status filters.
* `POST   /api/employees` — Create an employee.
* `GET    /api/employees/:id` — Retrieve full employee profile.
* `PUT    /api/employees/:id` — Update employee details.
* `DELETE /api/employees/:id` — Archive/delete employee.
* `GET    /api/contracts` — List employment contracts.
* `POST   /api/contracts` — Create a contract with wage & schedule.
* `PUT    /api/contracts/:id` — Update contract or transition status.

### Attendance & Leaves (`/api/attendance`, `/api/time-off`)
* `POST   /api/attendance/check-in` — Clock in for the day.
* `POST   /api/attendance/check-out` — Clock out and compute worked hours.
* `GET    /api/attendance/employee/:id` — Retrieve attendance history.
* `GET    /api/time-off/balances/:employeeId` — Get remaining leave allocations.
* `POST   /api/time-off/request` — Submit leave request.
* `PATCH  /api/time-off/approve/:id` — Approve leave request.
* `PATCH  /api/time-off/reject/:id` — Reject leave request.

### Payroll & Payslips (`/api/payruns`, `/api/payslips`)
* `GET    /api/payruns` — List historical and active payruns.
* `POST   /api/payruns` — Create new payrun batch.
* `POST   /api/payruns/:id/compute` — Compute salaries for all active contract employees.
* `POST   /api/payruns/:id/confirm` — Lock and confirm payrun.
* `POST   /api/payruns/:id/pay` — Mark batch as disbursed/paid.
* `GET    /api/payslips` — List payslips (filtered by payrun or employee).
* `GET    /api/payslips/:id` — Retrieve itemized payslip.
* `GET    /api/payslips/:id/pdf` — Stream official PDF payslip.

### Intelligence & Auditing (`/api/intelligence`)
* `POST   /api/intelligence/anomalies/scan/:payrunId` — Execute fraud & anomaly scan on a payrun.
* `GET    /api/intelligence/anomalies` — List logged anomalies.
* `PATCH  /api/intelligence/anomalies/:id` — Reconcile or dismiss flagged anomaly.
* `GET    /api/intelligence/attendance-hooks/company` — Organization-wide attendance payroll impact.
* `GET    /api/intelligence/budget/forecast` — Next-month payroll forecast & department budget risk.
* `GET    /api/intelligence/audit/payrun/:payrunId` — Full audit trail report for a payrun.

---

## 🚀 Setup & Installation

### Prerequisites
* **Node.js** v18.0.0 or higher
* **MySQL Server** v8.0 or higher
* **npm** or **yarn**

### 1. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE peoplepay360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env` (or copy from `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=peoplepay360_db
   JWT_SECRET=peoplepay360_enterprise_super_secret_jwt_key_2026
   JWT_EXPIRES_IN=24h
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   ```
4. Seed the database with schemas, tables, and test accounts:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The API will be available at `http://localhost:5000`.*

### 3. Frontend Configuration
1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web client will be available at `http://localhost:5173`.*

### 4. Sign In & Explore
Visit `http://localhost:5173` and log in with any demo account (e.g. `admin@peoplepay360.com` / `Admin@123`).