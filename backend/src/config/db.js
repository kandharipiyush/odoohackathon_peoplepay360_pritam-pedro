const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

// Create MySQL connection pool with production-ready concurrency settings
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'peoplepay360_db',
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS !== 'false',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0', 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00',
  dateStrings: true,
});

/**
 * Validates database connectivity by acquiring and releasing a pooled connection
 */
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1 + 1 AS health_check, NOW() as server_time');
    try {
      await connection.query("ALTER TABLE employees MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Active'");
      await connection.query("ALTER TABLE time_off_requests MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Submitted'");
    } catch {
      // already altered or ignore
    }
    logger.info('MySQL Database connected successfully to pool.', {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'peoplepay360_db',
      serverTime: result[0]?.server_time,
    });
    return true;
  } catch (error) {
    logger.error('Failed to establish MySQL connection pool:', {
      message: error.message,
      code: error.code,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Execute a transaction safely with automatic rollback on error
 * @param {Function} callback - Async callback receiving the leased connection
 */
const executeTransaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction rolled back due to error:', { message: error.message });
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  testConnection,
  executeTransaction,
};
