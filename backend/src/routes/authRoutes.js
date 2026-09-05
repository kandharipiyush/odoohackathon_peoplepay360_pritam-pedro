const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { generateToken, authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * POST /api/auth/login
 * Authenticate user via email + bcrypt password verification against the users table
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Query users table joined with employees for profile data
    const [rows] = await pool.query(
      `SELECT 
        u.id AS user_id, u.email, u.password_hash, u.role, u.is_active,
        u.employee_id,
        e.first_name, e.last_name, e.department, e.job_position, e.status AS emp_status
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.email = ?`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Contact your administrator.',
      });
    }

    // Verify password against bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Incorrect password.',
      });
    }

    // Map DB role enum to frontend-friendly role string
    const roleMap = {
      'Admin': 'Admin',
      'HR_Manager': 'HR Manager',
      'HR_Payroll_Manager': 'HR Payroll Manager',
      'Finance_Auditor': 'Finance Auditor',
      'Employee': 'Employee',
    };
    const friendlyRole = roleMap[user.role] || user.role;

    // Generate JWT token
    const token = generateToken({
      id: user.user_id,
      employee_id: user.employee_id,
      email: user.email,
      role: friendlyRole,
      department: user.department || 'Unassigned',
    });

    const authenticatedUser = {
      id: user.user_id,
      employee_id: user.employee_id,
      email: user.email,
      role: friendlyRole,
      firstName: user.first_name || 'User',
      lastName: user.last_name || '',
      department: user.department || 'Unassigned',
      job_position: user.job_position || '',
    };

    logger.info('User successfully authenticated:', {
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: authenticatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register
 * Register a new user with bcrypt-hashed password
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, department, job_position, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      debugger;
      return res.status(400).json({
        success: false,
        error: 'email, password, firstName, and lastName are required',
      });
    }

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email is already registered',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create employee record first
    const [empResult] = await pool.query(
      `INSERT INTO employees (first_name, last_name, email, department, job_position, status)
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      [firstName, lastName, email, department || 'Unassigned', job_position || 'Staff']
    );

    // Create user record linked to employee
    const userRole = role || 'Employee';
    const [userResult] = await pool.query(
      `INSERT INTO users (employee_id, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      [empResult.insertId, email, password_hash, userRole]
    );

    logger.info('New user registered:', { email, role: userRole });

    return res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful',
        userId: userResult.insertId,
        employeeId: empResult.insertId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Protected endpoint returning current authenticated identity
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        u.id AS user_id, u.email, u.role, u.employee_id,
        e.first_name, e.last_name, e.department, e.job_position, e.status
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const u = rows[0];
    const roleMap = {
      'Admin': 'Admin',
      'HR_Manager': 'HR Manager',
      'HR_Payroll_Manager': 'HR Payroll Manager',
      'Finance_Auditor': 'Finance Auditor',
      'Employee': 'Employee',
    };

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: u.user_id,
          employee_id: u.employee_id,
          email: u.email,
          role: roleMap[u.role] || u.role,
          firstName: u.first_name || 'User',
          lastName: u.last_name || '',
          department: u.department || 'Unassigned',
          job_position: u.job_position || '',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
