-- =====================================================================
-- PeoplePay360 Enterprise HR & Payroll Platform
-- Phase 1 Relational Database Initialization Script (MySQL 8.0+)
-- Storage Engine: InnoDB (Full ACID Support & Foreign Key Enforcement)
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO,STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS `peoplepay360_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `peoplepay360_db`;

-- ---------------------------------------------------------------------
-- 1. Table: employees
-- Master record for all personnel in the organization.
-- Supports organizational hierarchy with self-referencing manager_id.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `manager_id` INT UNSIGNED NULL,
    `job_position` VARCHAR(100) NOT NULL,
    `status` ENUM('Active', 'On Leave', 'Terminated') NOT NULL DEFAULT 'Active',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employees_email` (`email`),
    INDEX `idx_employees_department` (`department`),
    INDEX `idx_employees_status` (`status`),
    INDEX `idx_employees_manager_id` (`manager_id`),
    CONSTRAINT `fk_employees_manager` 
        FOREIGN KEY (`manager_id`) 
        REFERENCES `employees` (`id`) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: working_schedules
-- Configurable shifts and work-hour profiles for attendance tracking.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `working_schedules` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('Standard_40h', 'Shift_Rotating', 'Part_Time', 'Flexible') NOT NULL DEFAULT 'Standard_40h',
    `weekly_hours` DECIMAL(5, 2) NOT NULL DEFAULT 40.00,
    `schedule_details_json` JSON NOT NULL COMMENT 'Structured daily hours, core hours, and shift breaks',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_working_schedules_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: salary_structures
-- Groups salary rules into logical packages (e.g., Executive, Standard Full-Time, Hourly).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `salary_structures` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_salary_structures_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: contracts
-- Period-specific employment agreements binding compensation and salary structure.
-- Ensures strict period temporal matching for historic wage fidelity.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contracts` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INT UNSIGNED NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NULL,
    `wage` DECIMAL(12, 2) NOT NULL COMMENT 'Base wage amount bound to pay period',
    `salary_structure_id` INT UNSIGNED NOT NULL,
    `status` ENUM('Draft', 'Active', 'Expired', 'Terminated') NOT NULL DEFAULT 'Draft',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_contracts_employee_status` (`employee_id`, `status`),
    INDEX `idx_contracts_period` (`start_date`, `end_date`),
    INDEX `idx_contracts_salary_structure` (`salary_structure_id`),
    CONSTRAINT `fk_contracts_employee` 
        FOREIGN KEY (`employee_id`) 
        REFERENCES `employees` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_contracts_salary_structure` 
        FOREIGN KEY (`salary_structure_id`) 
        REFERENCES `salary_structures` (`id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: attendance
-- Clock-in/out records with worked hours calculation and anomaly flags.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INT UNSIGNED NOT NULL,
    `check_in` DATETIME NOT NULL,
    `check_out` DATETIME NULL,
    `worked_hours` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `status` ENUM('Present', 'Late', 'Early_Departure', 'Overtime', 'Absent', 'Half_Day') NOT NULL DEFAULT 'Present',
    `exception_flag` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Flags missing checkout or schedule mismatch',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_attendance_employee_date` (`employee_id`, `check_in`),
    INDEX `idx_attendance_exception` (`exception_flag`),
    INDEX `idx_attendance_status` (`status`),
    CONSTRAINT `fk_attendance_employee` 
        FOREIGN KEY (`employee_id`) 
        REFERENCES `employees` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: time_off_types
-- Master category of leave (Paid Leave, Sick Leave, Unpaid Leave, etc.).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `time_off_types` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `unit` ENUM('Days', 'Hours') NOT NULL DEFAULT 'Days',
    `requires_allocation` BOOLEAN NOT NULL DEFAULT TRUE,
    `approval_workflow` ENUM('Manager_Only', 'HR_Only', 'Manager_Then_HR', 'No_Validation') NOT NULL DEFAULT 'Manager_Then_HR',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_time_off_types_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Table: time_off_allocations
-- Employee-specific leave balance allowances per validity cycle.
-- Uses virtual/generated columns for remaining_days ACID consistency.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `time_off_allocations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INT UNSIGNED NOT NULL,
    `leave_type_id` INT UNSIGNED NOT NULL,
    `total_days` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `taken_days` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `remaining_days` DECIMAL(5, 2) GENERATED ALWAYS AS (`total_days` - `taken_days`) STORED,
    `validity_start` DATE NOT NULL,
    `validity_end` DATE NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_allocations_employee_type` (`employee_id`, `leave_type_id`),
    INDEX `idx_allocations_validity` (`validity_start`, `validity_end`),
    CONSTRAINT `fk_allocations_employee` 
        FOREIGN KEY (`employee_id`) 
        REFERENCES `employees` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_allocations_leave_type` 
        FOREIGN KEY (`leave_type_id`) 
        REFERENCES `time_off_types` (`id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Table: time_off_requests
-- Leave applications submitted by employees tied to approval pipelines.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `time_off_requests` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INT UNSIGNED NOT NULL,
    `leave_type_id` INT UNSIGNED NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('Draft', 'Submitted', 'Approved', 'Refused', 'Cancelled') NOT NULL DEFAULT 'Submitted',
    `reason` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_requests_employee_status` (`employee_id`, `status`),
    INDEX `idx_requests_dates` (`start_date`, `end_date`),
    INDEX `idx_requests_leave_type` (`leave_type_id`),
    CONSTRAINT `fk_requests_employee` 
        FOREIGN KEY (`employee_id`) 
        REFERENCES `employees` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_requests_leave_type` 
        FOREIGN KEY (`leave_type_id`) 
        REFERENCES `time_off_types` (`id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Table: salary_rules
-- Calculation engine components executed in sequence per salary structure.
-- Sequence order drives: Basic -> Allowance -> Deduction -> Gross -> Net.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `salary_rules` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `structure_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `category` ENUM('Basic', 'Allowance', 'Deduction', 'Gross', 'Net') NOT NULL,
    `sequence` INT UNSIGNED NOT NULL DEFAULT 100,
    `computation_type` ENUM('Fixed', 'Percentage', 'Python_Code', 'SQL_Formula', 'Formula') NOT NULL DEFAULT 'Fixed',
    `computation_value` TEXT NOT NULL COMMENT 'Value, percentage factor, or formula definition',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_structure_rule_code` (`structure_id`, `code`),
    INDEX `idx_salary_rules_structure_seq` (`structure_id`, `sequence`),
    INDEX `idx_salary_rules_category` (`category`),
    CONSTRAINT `fk_salary_rules_structure` 
        FOREIGN KEY (`structure_id`) 
        REFERENCES `salary_structures` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Table: payruns
-- Batch payroll execution runs for a specified payroll period.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payruns` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `structure_id` INT UNSIGNED NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `status` ENUM('Draft', 'Computed', 'Validated', 'Paid') NOT NULL DEFAULT 'Draft',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_payruns_period` (`period_start`, `period_end`),
    INDEX `idx_payruns_status` (`status`),
    INDEX `idx_payruns_structure` (`structure_id`),
    CONSTRAINT `fk_payruns_salary_structure` 
        FOREIGN KEY (`structure_id`) 
        REFERENCES `salary_structures` (`id`) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Table: payslips
-- Individual calculated pay slip per employee within a payrun batch.
-- Stores worked metrics, financial outcomes, AI anomaly scores, and audit justifications.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payslips` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `payrun_id` INT UNSIGNED NOT NULL,
    `employee_id` INT UNSIGNED NOT NULL,
    `contract_id` INT UNSIGNED NOT NULL,
    `worked_days` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `gross_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `net_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `risk_score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT '0.00 to 100.00 AI anomaly risk assessment',
    `audit_reasons_json` JSON NULL COMMENT 'Explainable AI plain-English anomaly reasons',
    `status` ENUM('Draft', 'Computed', 'Audited', 'Confirmed', 'Paid', 'Rejected') NOT NULL DEFAULT 'Draft',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_payslips_payrun_employee` (`payrun_id`, `employee_id`),
    INDEX `idx_payslips_payrun` (`payrun_id`),
    INDEX `idx_payslips_employee` (`employee_id`),
    INDEX `idx_payslips_contract` (`contract_id`),
    INDEX `idx_payslips_status` (`status`),
    INDEX `idx_payslips_risk` (`risk_score`),
    CONSTRAINT `fk_payslips_payrun` 
        FOREIGN KEY (`payrun_id`) 
        REFERENCES `payruns` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_payslips_employee` 
        FOREIGN KEY (`employee_id`) 
        REFERENCES `employees` (`id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_payslips_contract` 
        FOREIGN KEY (`contract_id`) 
        REFERENCES `contracts` (`id`) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- Phase 1 Foundation Seed Data (Standard Structures & Types)
-- =====================================================================

INSERT IGNORE INTO `working_schedules` (`id`, `name`, `type`, `weekly_hours`, `schedule_details_json`) VALUES
(1, 'Standard 40-Hour Week (Mon-Fri)', 'Standard_40h', 40.00, 
 JSON_OBJECT(
   'monday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
   'tuesday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
   'wednesday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
   'thursday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
   'friday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60)
 ));

INSERT IGNORE INTO `time_off_types` (`id`, `name`, `unit`, `requires_allocation`, `approval_workflow`) VALUES
(1, 'Paid Annual Leave', 'Days', TRUE, 'Manager_Then_HR'),
(2, 'Sick Leave', 'Days', TRUE, 'HR_Only'),
(3, 'Unpaid Leave', 'Days', FALSE, 'Manager_Then_HR'),
(4, 'Compensatory Off', 'Hours', TRUE, 'Manager_Only');

INSERT IGNORE INTO `salary_structures` (`id`, `name`, `description`, `is_active`) VALUES
(1, 'Standard Corporate Salary Structure', 'Default structure for full-time regular salaried staff', TRUE);

INSERT IGNORE INTO `salary_rules` (`structure_id`, `name`, `code`, `category`, `sequence`, `computation_type`, `computation_value`) VALUES
(1, 'Basic Salary', 'BASIC', 'Basic', 10, 'Percentage', '100.00% of Contract Wage'),
(1, 'Housing Allowance', 'HRA', 'Allowance', 20, 'Percentage', '40.00% of BASIC'),
(1, 'Transport Allowance', 'TRANS', 'Allowance', 30, 'Fixed', '2500.00'),
(1, 'Provident Fund / Pension', 'PF', 'Deduction', 40, 'Percentage', '12.00% of BASIC'),
(1, 'Income Tax / TDS', 'TAX', 'Deduction', 50, 'SQL_Formula', 'STANDARD_BRACKET_CALC'),
(1, 'Gross Salary', 'GROSS', 'Gross', 60, 'Formula', 'BASIC + HRA + TRANS'),
(1, 'Net Salary', 'NET', 'Net', 100, 'Formula', 'GROSS - PF - TAX');
