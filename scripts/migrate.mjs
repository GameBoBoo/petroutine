import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  await applyMigrations(pool);
  console.log('Database migration completed');
} catch (error) {
  console.error('Database migration failed', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
