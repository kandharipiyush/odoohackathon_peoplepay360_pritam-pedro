/**
 * PeoplePay360 Database Seed Utility
 * 
 * Seeds 10 realistic users across organizational roles with:
 * - Employees (master records)
 * - Users (auth credentials with bcrypt-hashed passwords)
 * - Contracts (linked to salary structure 1)
 * - Time-off allocations
 * - Attendance records (sample data)
 * 
 * Usage: node src/utils/seed.js
 */

const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('../config/db');
const logger = require('./logger');

// =====================================================================
// Seed Data Definition — 10 Users
// =====================================================================
const SEED_USERS = [
  {
    firstName: 'Sarah', lastName: 'Connor',
    email: 'admin@peoplepay360.com', password: 'Admin@123',
    role: 'Admin', department: 'Management', jobPosition: 'Chief Executive Officer',
    wage: 150000.00
  },
  {
    firstName: 'John', lastName: 'Smith',
    email: 'hr@peoplepay360.com', password: 'HrPass@123',
    role: 'HR_Manager', department: 'Human Resources', jobPosition: 'HR Director',
    wage: 95000.00
  },
  {
    firstName: 'Alice', lastName: 'Johnson',
    email: 'payroll@peoplepay360.com', password: 'Payroll@123',
    role: 'HR_Payroll_Manager', department: 'Finance', jobPosition: 'Payroll Manager',
    wage: 88000.00
  },
  {
    firstName: 'Robert', lastName: 'Williams',
    email: 'auditor@peoplepay360.com', password: 'Audit@123',
    role: 'Finance_Auditor', department: 'Finance', jobPosition: 'Senior Auditor',
    wage: 82000.00
  },
  {
    firstName: 'Jane', lastName: 'Doe',
    email: 'jane.doe@peoplepay360.com', password: 'Employee@123',
    role: 'Employee', department: 'Engineering', jobPosition: 'Software Engineer',
    wage: 75000.00
  },
  {
    firstName: 'Michael', lastName: 'Brown',
    email: 'michael.brown@peoplepay360.com', password: 'Employee@123',
    role: 'Employee', department: 'Engineering', jobPosition: 'Frontend Developer',
    wage: 70000.00
  },
  {
    firstName: 'Emily', lastName: 'Davis',
    email: 'emily.davis@peoplepay360.com', password: 'Employee@123',
    role: 'Employee', department: 'Marketing', jobPosition: 'Marketing Specialist',
    wage: 65000.00
  },
  {
    firstName: 'David', lastName: 'Wilson',
    email: 'david.wilson@peoplepay360.com', password: 'Employee@123',
    role: 'Employee', department: 'Operations', jobPosition: 'Operations Analyst',
    wage: 68000.00
  },
  {
    firstName: 'Priya', lastName: 'Sharma',
    email: 'priya.sharma@peoplepay360.com', password: 'Employee@123',
    role: 'Employee', department: 'Engineering', jobPosition: 'QA Engineer',
    wage: 72000.00
  },
  {
    firstName: 'Carlos', lastName: 'Garcia',
    email: 'carlos.garcia@peoplepay360.com', password: 'Employee@123',
    role: 'Employee', department: 'Sales', jobPosition: 'Sales Executive',
    wage: 60000.00
  },
];

async function seed() {
  const connection = await pool.getConnection();

  try {
    logger.info('🌱 Starting PeoplePay360 database seed...');

    await connection.beginTransaction();

    // ------------------------------------------------------------------
    // 0. Ensure prerequisite tables exist (users table may be new)
    // ------------------------------------------------------------------
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`employee_id\` INT UNSIGNED NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('Admin', 'HR_Manager', 'HR_Payroll_Manager', 'Finance_Auditor', 'Employee') NOT NULL DEFAULT 'Employee',
        \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_users_email\` (\`email\`),
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_employee_id\` (\`employee_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ------------------------------------------------------------------
    // 1. Clean existing seed data (reverse FK order)
    // ------------------------------------------------------------------
    logger.info('Cleaning existing seed data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DELETE FROM payslips WHERE employee_id <= 10');
    await connection.query('DELETE FROM time_off_requests WHERE employee_id <= 10');
    await connection.query('DELETE FROM time_off_allocations WHERE employee_id <= 10');
    await connection.query('DELETE FROM attendance WHERE employee_id <= 10');
    await connection.query('DELETE FROM contracts WHERE employee_id <= 10');
    await connection.query('DELETE FROM users WHERE employee_id <= 10 OR employee_id IS NULL');
    await connection.query('DELETE FROM employees WHERE id <= 10');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // ------------------------------------------------------------------
    // 2. Ensure prerequisite reference data exists
    // ------------------------------------------------------------------
    // Salary structure
    await connection.query(`
      INSERT IGNORE INTO salary_structures (id, name, description, is_active) 
      VALUES (1, 'Standard Corporate Salary Structure', 'Default structure for full-time regular salaried staff', TRUE)
    `);

    // Working schedule
    await connection.query(`
      INSERT IGNORE INTO working_schedules (id, name, type, weekly_hours, schedule_details_json) 
      VALUES (1, 'Standard 40-Hour Week (Mon-Fri)', 'Standard_40h', 40.00, 
        JSON_OBJECT(
          'monday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
          'tuesday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
          'wednesday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
          'thursday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60),
          'friday', JSON_OBJECT('start', '09:00', 'end', '17:00', 'break_minutes', 60)
        ))
    `);

    // Time-off types
    await connection.query(`
      INSERT IGNORE INTO time_off_types (id, name, unit, requires_allocation, approval_workflow) VALUES
      (1, 'Paid Annual Leave', 'Days', TRUE, 'Manager_Then_HR'),
      (2, 'Sick Leave', 'Days', TRUE, 'HR_Only'),
      (3, 'Unpaid Leave', 'Days', FALSE, 'Manager_Then_HR'),
      (4, 'Compensatory Off', 'Hours', TRUE, 'Manager_Only')
    `);

    // ------------------------------------------------------------------
    // 3. Insert Employees + Users + Contracts + Allocations
    // ------------------------------------------------------------------
    const SALT_ROUNDS = 10;
    const today = new Date();
    const contractStart = '2024-01-01';
    const allocStart = '2026-01-01';
    const allocEnd = '2026-12-31';

    for (let i = 0; i < SEED_USERS.length; i++) {
      const u = SEED_USERS[i];
      const empId = i + 1;

      // Manager hierarchy: CEO(1) manages HR(2), Payroll(3), Auditor(4)
      // HR(2) manages employees 5-10
      let managerId = null;
      if (empId >= 2 && empId <= 4) managerId = 1; // Reports to CEO
      if (empId >= 5) managerId = 2; // Reports to HR Director

      // Insert employee
      await connection.query(
        `INSERT INTO employees (id, first_name, last_name, email, department, manager_id, job_position, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [empId, u.firstName, u.lastName, u.email, u.department, managerId, u.jobPosition]
      );

      // Hash password and insert user
      const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
      await connection.query(
        `INSERT INTO users (employee_id, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, TRUE)`,
        [empId, u.email, passwordHash, u.role]
      );

      // Insert active contract
      await connection.query(
        `INSERT INTO contracts (employee_id, start_date, end_date, wage, salary_structure_id, status)
         VALUES (?, ?, NULL, ?, 1, 'Active')`,
        [empId, contractStart, u.wage]
      );

      // Insert time-off allocations (Annual Leave + Sick Leave)
      await connection.query(
        `INSERT INTO time_off_allocations (employee_id, leave_type_id, total_days, taken_days, validity_start, validity_end)
         VALUES (?, 1, 20.00, 0.00, ?, ?),
                (?, 2, 10.00, 0.00, ?, ?)`,
        [empId, allocStart, allocEnd, empId, allocStart, allocEnd]
      );

      logger.info(`  ✅ Seeded: ${u.firstName} ${u.lastName} (${u.role}) — ${u.email}`);
    }

    // ------------------------------------------------------------------
    // 4. Insert sample attendance records (last 5 working days for employees 5-10)
    // ------------------------------------------------------------------
    logger.info('Seeding sample attendance records...');
    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().split('T')[0];

      for (let empId = 5; empId <= 10; empId++) {
        const checkInHour = 8 + Math.floor(Math.random() * 2); // 8 or 9
        const checkInMin = Math.floor(Math.random() * 30);
        const workedHours = 7.5 + Math.random() * 1.5; // 7.5 to 9.0 hours

        const checkIn = `${dateStr} ${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}:00`;
        const checkOutHour = checkInHour + Math.floor(workedHours);
        const checkOutMin = Math.floor((workedHours % 1) * 60);
        const checkOut = `${dateStr} ${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}:00`;

        const status = checkInHour >= 9 && checkInMin > 15 ? 'Late' : 'Present';

        await connection.query(
          `INSERT INTO attendance (employee_id, check_in, check_out, worked_hours, status, exception_flag)
           VALUES (?, ?, ?, ?, ?, FALSE)`,
          [empId, checkIn, checkOut, workedHours.toFixed(2), status]
        );
      }
    }

    await connection.commit();

    logger.info('');
    logger.info('🎉 Database seed completed successfully!');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('  LOGIN CREDENTIALS (for testing)');
    logger.info('═══════════════════════════════════════════════════════════════');
    logger.info('');

    const colWidths = { role: 22, email: 38, pass: 15 };
    logger.info(`  ${'Role'.padEnd(colWidths.role)} ${'Email'.padEnd(colWidths.email)} ${'Password'.padEnd(colWidths.pass)}`);
    logger.info(`  ${'─'.repeat(colWidths.role)} ${'─'.repeat(colWidths.email)} ${'─'.repeat(colWidths.pass)}`);

    for (const u of SEED_USERS) {
      const roleMap = {
        'Admin': 'Admin',
        'HR_Manager': 'HR Manager',
        'HR_Payroll_Manager': 'HR Payroll Manager',
        'Finance_Auditor': 'Finance Auditor',
        'Employee': 'Employee',
      };
      const role = (roleMap[u.role] || u.role).padEnd(colWidths.role);
      const email = u.email.padEnd(colWidths.email);
      const pass = u.password.padEnd(colWidths.pass);
      logger.info(`  ${role} ${email} ${pass}`);
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    await connection.rollback();
    logger.error('❌ Seed failed:', { message: error.message, code: error.code });
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
