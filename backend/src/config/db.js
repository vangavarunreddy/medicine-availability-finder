import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString?.includes('neon.tech');
const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: (isNeon || isProduction) ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'medicine_finder',
      ssl: false
    };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

/**
 * Execute parameterized SQL query
 * @param {string} text - SQL Query String
 * @param {Array} params - Array of parameters
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Health check helper to test database connectivity
 */
export const checkDbConnection = async () => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW() as current_time, current_database() as db_name;');
    const duration = Date.now() - start;

    return {
      connected: true,
      message: 'Successfully connected to PostgreSQL database.',
      database: result.rows[0].db_name,
      serverTime: result.rows[0].current_time,
      latencyMs: duration
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection failed: ${error.message}`,
      error: error.message
    };
  }
};

export default pool;
