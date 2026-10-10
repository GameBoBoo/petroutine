import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import pg from 'pg';

const schema = `refinement_migration_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let client;
let adminConnected = false;
let schemaCreated = false;

before(async () => {
  await admin.connect();
  adminConnected = true;
  await admin.query(`CREATE SCHEMA ${schema}`);
  schemaCreated = true;
  client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema},public`,
  });
  await client.connect();

  for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql']) {
    const sql = await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8');
    await client.query(sql);
  }

  const user = await client.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ('Legacy owner', $1, 'hash') RETURNING id`,
    [`legacy-${crypto.randomUUID()}@example.com`],
  );
  const home = await client.query(
    `INSERT INTO households (name, owner_id, invite_code)
     VALUES ('Legacy home', $1, $2) RETURNING id`,
    [user.rows[0].id, crypto.randomBytes(6).toString('hex').toUpperCase()],
  );
  await client.query(
    `INSERT INTO household_members (household_id, user_id, role)
     VALUES ($1, $2, 'owner')`,
    [home.rows[0].id, user.rows[0].id],
  );
  const pet = await client.query(
    `INSERT INTO pets (household_id, name, species)
     VALUES ($1, 'Mochi', 'dog') RETURNING id`,
    [home.rows[0].id],
  );
  const weekly = await client.query(
    `INSERT INTO routines (pet_id, title, activity_type, schedule_value, assigned_user_id)
     VALUES ($1, 'Legacy breakfast', 'feeding', $2::jsonb, $3) RETURNING id`,
    [pet.rows[0].id, JSON.stringify({ time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] }), user.rows[0].id],
  );
  await client.query(
    `INSERT INTO routines (pet_id, title, activity_type, schedule_value)
     VALUES ($1, 'Legacy appointment', 'vet', $2::jsonb)`,
    [pet.rows[0].id, JSON.stringify({ type: 'once', date: '2026-10-10', time: '10:30' })],
  );
  await client.query(
    `INSERT INTO care_tasks (routine_id, scheduled_at, status, completed_by, completed_at, notes)
     VALUES ($1, '2026-10-10T08:00:00+07:00', 'completed', $2, NOW(), 'legacy completion')`,
    [weekly.rows[0].id, user.rows[0].id],
  );
});

after(async () => {
  if (client) await client.end();
  if (adminConnected) {
    try {
      if (schemaCreated) await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    } finally {
      await admin.end();
    }
  }
});

test('migration 004 is repeatable and preserves legacy routines and completion history', async () => {
  let sql;
  try {
    sql = await readFile(new URL('../db/migrations/004_product_refinement.sql', import.meta.url), 'utf8');
  } catch {
    assert.fail('migration 004_product_refinement.sql must exist');
  }

  await client.query(sql);
  await client.query(sql);

  assert.equal((await client.query('SELECT COUNT(*)::int AS count FROM routines')).rows[0].count, 2);
  const completed = await client.query(
    `SELECT status, notes, assigned_user_id, original_scheduled_at, mutation_version
     FROM care_tasks`,
  );
  assert.equal(completed.rowCount, 1);
  assert.equal(completed.rows[0].status, 'completed');
  assert.equal(completed.rows[0].notes, 'legacy completion');
  assert.ok(completed.rows[0].assigned_user_id);
  assert.equal(new Date(completed.rows[0].original_scheduled_at).toISOString(), '2026-10-10T01:00:00.000Z');
  assert.equal(completed.rows[0].mutation_version, 0);

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = ANY($2::text[])
     ORDER BY table_name`,
    [schema, ['activity_logs', 'care_entries', 'pet_health_records', 'idempotency_records']],
  );
  assert.deepEqual(
    tables.rows.map(row => row.table_name),
    ['activity_logs', 'care_entries', 'idempotency_records', 'pet_health_records'],
  );

  const columns = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'care_tasks'`,
    [schema],
  );
  const names = new Set(columns.rows.map(row => row.column_name));
  for (const name of ['assigned_user_id', 'original_scheduled_at', 'mutation_version', 'mutation_reason', 'skip_reason']) {
    assert.ok(names.has(name), `care_tasks.${name} must exist`);
  }

  const indexes = await client.query(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = $1 AND tablename = ANY($2::text[])`,
    [schema, ['activity_logs', 'care_entries', 'pet_health_records']],
  );
  assert.ok(indexes.rowCount >= 8, 'new records need filtering and active-row indexes');
});
