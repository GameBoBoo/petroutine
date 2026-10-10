import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import pg from 'pg';

test('migration 005 adds repeatable household trash metadata without removing household data', async () => {
  const schema = `household_trash_migration_${crypto.randomBytes(8).toString('hex')}`;
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET search_path TO ${schema}, public`);
    for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql']) {
      await client.query(await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8'));
    }

    let sql;
    try {
      sql = await readFile(new URL('../db/migrations/005_household_trash.sql', import.meta.url), 'utf8');
    } catch {
      assert.fail('migration 005_household_trash.sql must exist');
    }
    await client.query(sql);
    await client.query(sql);

    const columns = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'households'
         AND column_name IN ('archived_at', 'archived_by')
       ORDER BY column_name`,
      [schema],
    );
    assert.deepEqual(columns.rows.map(row => row.column_name), ['archived_at', 'archived_by']);

    const owner = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ('Owner', $1, 'hash') RETURNING id`,
      [`trash-migration-${crypto.randomBytes(4).toString('hex')}@example.com`],
    );
    const household = await client.query(
      `INSERT INTO households (name, owner_id, invite_code, archived_at, archived_by)
       VALUES ('Saved home', $1, $2, NOW(), $1) RETURNING id`,
      [owner.rows[0].id, crypto.randomBytes(6).toString('hex').toUpperCase()],
    );
    assert.equal((await client.query('SELECT name FROM households WHERE id = $1', [household.rows[0].id])).rows[0].name, 'Saved home');
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await client.end();
  }
});
