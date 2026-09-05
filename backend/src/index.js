const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables before importing configuration
dotenv.config();

const logger = require('./utils/logger');
const { pool, testConnection } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ==========================================
// 1. Security & HTTP Middlewares
// ==========================================
app.use(helmet());

// CORS configuration supporting single or comma-separated allowed origins
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy error: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging via Morgan piped to Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// ==========================================
// 2. Core Diagnostic & Health Check Endpoints
// ==========================================
app.get('/health', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS live');
    return res.status(200).json({
      success: true,
      service: 'PeoplePay360 API',
      status: 'healthy',
      database: rows && rows.length > 0 ? 'connected' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      service: 'PeoplePay360 API',
      status: 'degraded',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Root Index
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to PeoplePay360 Enterprise API Gateway',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Route Imports
const employeeRoutes = require('./routes/employeeRoutes');
const contractRoutes = require('./routes/contractRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const timeOffRoutes = require('./routes/timeOffRoutes');
const payrunRoutes = require('./routes/payrunRoutes');
const payslipRoutes = require('./routes/payslipRoutes');
const intelligenceRoutes = require('./routes/intelligenceRoutes');

// ==========================================
// 3. Application Routes (Phase 2, 3, 4 & 5)
// ==========================================
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/time-off', timeOffRoutes);
app.use('/api/payruns', payrunRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/intelligence', intelligenceRoutes);

// ==========================================
// 4. Global Error Handling Middlewares
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

// ==========================================
// 5. Server Initialization & Graceful Teardown
// ==========================================
let server;

const startServer = async () => {
  try {
    // Attempt database pool connection test on startup
    await testConnection().catch((err) => {
      logger.warn('Initial database connection test failed. Server will continue starting:', {
        error: err.message,
      });
    });

    server = app.listen(PORT, () => {
      logger.info(`🚀 PeoplePay360 API Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  } catch (err) {
    logger.error('Fatal error during application startup:', { error: err.message });
    process.exit(1);
  }
};

startServer();

// Graceful termination handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Gracefully terminating HTTP server and database pool...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await pool.end();
        logger.info('Database connection pool drained.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during pool teardown:', { error: err.message });
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, startServer };
