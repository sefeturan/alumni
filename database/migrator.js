const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Ensures the migrations tracking table exists.
 */
async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Runs all pending database migrations in sequential order.
 */
async function up() {
  console.log('🚀 Running database migrations...');

  const isConnected = await db.isDbAvailable();
  if (!isConnected) {
    throw new Error('Database is unreachable. Please verify PostgreSQL connection settings in .env.');
  }

  await ensureMigrationsTable();

  // Get already executed migrations
  const { rows } = await db.query('SELECT name FROM migrations ORDER BY id ASC');
  const executed = new Set(rows.map(r => r.name));

  // Read SQL files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (!executed.has(file)) {
      console.log(`  Applying migration: ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute within transaction
      const client = await db.getPool().connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  ✅ Applied: ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Failed applying: ${file}`, err.message);
        throw err;
      } finally {
        client.release();
      }
    }
  }

  if (count === 0) {
    console.log('✨ All migrations are already up to date.');
  } else {
    console.log(`🎉 Successfully applied ${count} migration(s).`);
  }
}

/**
 * Resets the database by dropping tables and re-executing migrations.
 */
async function reset() {
  console.log('⚠️  Resetting database...');
  const isConnected = await db.isDbAvailable();
  if (!isConnected) {
    throw new Error('Database is unreachable.');
  }

  await db.query('DROP TABLE IF EXISTS announcements, users, migrations CASCADE;');
  console.log('  Dropped existing tables.');
  await up();
}

// Allow CLI execution directly
if (require.main === module) {
  const command = process.argv[2] || 'up';
  const runner = command === 'reset' ? reset : up;

  runner()
    .then(() => {
      db.closePool();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration error:', err.message);
      db.closePool();
      process.exit(1);
    });
}

module.exports = { up, reset };
