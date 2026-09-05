const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { generateToken, authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Demo user accounts matching frontend seed credentials
const DEMO_USERS = [
  { id: 1, email: 'admin@peoplepay360.com', role: 'Admin', firstName: 'Sarah', lastName: 'Connor', department: 'Management' },
  { id: 2, email: 'hr@peoplepay360.com', role: 'HR Manager', firstName: 'John', lastName: 'Smith', department: 'Human Resources' },
  { id: 3, email: 'payroll@peoplepay360.com', role: 'HR Payroll Manager', firstName: 'Alice', lastName: 'Johnson', department: 'Finance' },
  { id: 4, email: 'employee@peoplepay360.com', role: 'Employee', firstName: 'Jane', lastName: 'Doe', department: 'Engineering' },
];

/**
 * POST /api/auth/login
 * Standardized authentication endpoint issuing signed JWTs
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

    let authenticatedUser = null;

    // 1. Check demo/seed accounts
    const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (demo) {
      authenticatedUser = demo;
    } else {
      // 2. Query MySQL database for employee record
      const [rows] = await pool.query(
        'SELECT id, first_name, last_name, email, department, job_position, status FROM employees WHERE email = ?',
        [email]
      );

      if (rows.length > 0) {
        const emp = rows[0];
        let role = 'Employee';
        if (emp.department === 'Management' || emp.job_position.includes('Director')) {
          role = 'Admin';
        } else if (emp.department.includes('HR') || emp.job_position.includes('HR')) {
          role = 'HR Manager';
        }

        authenticatedUser = {
          id: emp.id,
          email: emp.email,
          role,
          firstName: emp.first_name,
          lastName: emp.last_name,
          department: emp.department,
          job_position: emp.job_position,
        };
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. User not found.',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      department: authenticatedUser.department,
    });

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
 * GET /api/auth/me
 * Protected endpoint returning current authenticated identity
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, department, job_position, status FROM employees WHERE id = ?',
      [req.user.id]
    );

    let userData = req.user;
    if (rows.length > 0) {
      const emp = rows[0];
      userData = {
        ...req.user,
        firstName: emp.first_name,
        lastName: emp.last_name,
        department: emp.department,
        job_position: emp.job_position,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        user: userData,
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
