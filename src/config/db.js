const { Pool } = require('pg');
require('dotenv').config();

let pool = null;
let connectionTested = false;
let isConnected = false;

/**
 * Returns the singleton PostgreSQL pool instance.
 */
function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const config = connectionString
      ? { connectionString }
      : {
          host: process.env.POSTGRES_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 5432),
          user: process.env.POSTGRES_USER || 'user',
          password: process.env.POSTGRES_PASSWORD || 'password',
          database: process.env.POSTGRES_DB || 'alumni_db'
        };

    pool = new Pool({
      ...config,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 10000,
      max: 10
    });

    pool.on('error', (err) => {
      console.warn('PostgreSQL idle client warning:', err.message);
    });
  }
  return pool;
}

/**
 * Checks whether PostgreSQL is actively reachable.
 * Caches the positive result; re-tests on failure after backoff.
 */
async function isDbAvailable() {
  try {
    const p = getPool();
    const client = await p.connect();
    client.release();
    isConnected = true;
    connectionTested = true;
    return true;
  } catch (err) {
    isConnected = false;
    connectionTested = true;
    return false;
  }
}

/**
 * Executes a SQL query with parameters against PostgreSQL.
 * @param {string} text - SQL query string
 * @param {Array} [params] - Query parameter array
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

/**
 * Closes all connections in the pool gracefully.
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    connectionTested = false;
    isConnected = false;
  }
}

module.exports = {
  getPool,
  query,
  isDbAvailable,
  closePool
};
