const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_enterprise_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user payload
 * @param {Object} payload - { id, email, role, department }
 * @param {string} expiresIn - Expiration window (e.g. '24h')
 */
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Middleware: Authenticates HTTP request via Bearer JWT token in header or query param
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else {
      return res.status(401).json({
        success: false,
        error: 'Malformed authorization header. Expected format: "Bearer <token>"',
      });
    }
  } else if (req.query && req.query.token) {
    // Fallback for direct browser asset streaming (e.g. PDF view/download)
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authorization token missing. Expected "Authorization: Bearer <token>" header or "?token=<token>" query parameter',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('JWT verification failed:', {
      error: err.message,
      name: err.name,
      ip: req.ip,
      url: req.originalUrl,
    });

    const isExpired = err.name === 'TokenExpiredError';
    return res.status(403).json({
      success: false,
      error: isExpired ? 'Authentication token has expired' : 'Invalid authentication token',
    });
  }
};

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Restricts access to one or more allowed user roles.
 * @param  {...string} allowedRoles - E.g. 'Admin', 'HR_Manager', 'HR_Payroll_Manager', 'Employee'
 */
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication context not found',
      });
    }

    const userRole = req.user.role;

    // Allow Admin super-role or explicit wildcard
    if (userRole === 'Admin' || allowedRoles.includes('*') || allowedRoles.includes(userRole)) {
      return next();
    }

    logger.warn('RBAC Access Denied:', {
      user: req.user.email,
      role: userRole,
      required: allowedRoles,
      endpoint: req.originalUrl,
    });

    return res.status(403).json({
      success: false,
      error: `Forbidden: Access restricted to authorized roles [${allowedRoles.join(', ')}]. Current role: "${userRole}"`,
    });
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  generateToken,
};
