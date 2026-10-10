import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql']) {
    const sql = await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8');
    await pool.query(sql);
  }
  console.log('Database migration completed');
} catch (error) {
  console.error('Database migration failed', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
