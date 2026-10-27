import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `daily_wellness_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let pool;
let handlers;
let connected = false;
let created = false;

before(async () => {
  await admin.connect(); connected = true;
  await admin.query(`CREATE SCHEMA ${schema}`); created = true;
  const setup = new pg.Client({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` });
  await setup.connect();
  try {
    for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql', '006_pet_wellness_foundation.sql']) {
      await setup.query(await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8'));
    }
    const migration = await readFile(new URL('../db/migrations/007_daily_wellness_log.sql', import.meta.url), 'utf8');
    await setup.query(migration);
    await setup.query(migration);
    await setup.query(await readFile(new URL('../db/migrations/008_wellness_alerts.sql', import.meta.url), 'utf8'));
    await setup.query(await readFile(new URL('../db/migrations/009_reminders_shared_monitoring.sql', import.meta.url), 'utf8'));
  } finally { await setup.end(); }
  const migrationClient = new pg.Client({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` });
  await migrationClient.connect();
  try { await migrationClient.query(await readFile(new URL('../db/migrations/016_care_experience.sql', import.meta.url), 'utf8')); } finally { await migrationClient.end(); }
  process.env.PGOPTIONS = `-c search_path=${schema},public`;
  handlers = await import('../app/api/v1/[...path]/route.js');
  ({ pool } = await import('../lib/db.js'));
});

after(async () => {
  if (pool) await pool.end();
  if (connected) {
    try { if (created) await admin.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await admin.end(); }
  }
});

async function call(method, path, token, body) {
  const request = new Request(`http://localhost/api/v1/${path}`, {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = await handlers[method](request, { params: Promise.resolve({ path: new URL(request.url).pathname.replace('/api/v1/', '').split('/') }) });
  return { status: response.status, body: await response.json() };
}

async function fixture() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `daily-owner-${nonce}@example.com`, password: 'testing123' });
  const creator = await call('POST', 'auth/register', null, { name: 'Creator', email: `daily-creator-${nonce}@example.com`, password: 'testing123' });
  const reader = await call('POST', 'auth/register', null, { name: 'Reader', email: `daily-reader-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `daily-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Daily Home' });
  await call('POST', 'households/join', creator.body.token, { invite_code: home.body.household.invite_code });
  await call('POST', 'households/join', reader.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, creator, reader, outsider, home: home.body.household, pet: pet.body.pet };
}

test('migration 007 is repeatable and keeps every wellness metric optional', async () => {
  const columns = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'pet_wellness_logs'");
  const names = new Map(columns.rows.map(row => [row.column_name, row.is_nullable]));
  for (const name of ['food_intake', 'water_intake', 'activity_level', 'sleep_amount', 'stool_condition', 'mood', 'weight_kg', 'notes']) {
    assert.equal(names.get(name), 'YES', name);
  }
});

test('Daily Wellness supports partial backfill, multiple logs, permissions, activity, timeline, and trash isolation', async () => {
  const { owner, creator, reader, outsider, home, pet } = await fixture();
  const first = await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, {
    recorded_at: '2026-10-10T01:00:00.000Z', food_intake: 'low', notes: 'กินเหลือเล็กน้อย',
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.log.water_intake, null);
  const second = await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, {
    recorded_at: '2026-10-10T10:00:00.000Z', mood: 'bright', weight_kg: 24.75,
  });
  assert.equal(second.status, 201);

  assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, { recorded_at: '2026-10-10T12:00:00.000Z' })).status, 400);
  assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, { recorded_at: '2026-10-10T12:00:00.000Z', mood: 'diagnosed' })).status, 400);
  assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, { recorded_at: '2999-01-01T00:00:00.000Z', notes: 'future' })).status, 400);
  assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, { recorded_at: '2026-10-10T12:00:00.000Z', weight_kg: 0 })).status, 400);

  const list = await call('GET', `pets/${pet.id}/wellness-logs?from=2026-10-10&to=2026-10-10`, reader.body.token);
  assert.equal(list.status, 200);
  assert.equal(list.body.items.length, 2);
  assert.equal(list.body.items[0].can_edit, false);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-logs`, outsider.body.token)).status, 403);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-logs?from=2026-10-11&to=2026-10-10`, reader.body.token)).status, 400);

  assert.equal((await call('PATCH', `wellness-logs/${first.body.log.id}`, reader.body.token, { notes: 'ห้ามแก้' })).status, 403);
  const changed = await call('PATCH', `wellness-logs/${first.body.log.id}`, creator.body.token, { food_intake: null, activity_level: 'usual', notes: 'เดินเล่นตามปกติ' });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.log.food_intake, null);
  assert.equal(changed.body.log.activity_level, 'usual');
  assert.equal((await call('POST', `wellness-logs/${second.body.log.id}/archive`, owner.body.token, {})).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-logs`, reader.body.token)).body.items.length, 1);

  const timeline = await call('GET', `pets/${pet.id}/timeline?source_type=wellness_log`, reader.body.token);
  assert.equal(timeline.status, 200);
  assert.equal(timeline.body.items.filter(item => item.source_type === 'wellness_log').length, 2);
  const activity = await call('GET', `households/${home.id}/activity?pet_id=${pet.id}`, reader.body.token);
  assert.ok(activity.body.items.some(item => item.entity_type === 'wellness_log'));
  const snapshots = await pool.query("SELECT action, after_data FROM activity_logs WHERE entity_type = 'wellness_log' AND entity_id = $1 ORDER BY created_at", [first.body.log.id]);
  assert.deepEqual(snapshots.rows.map(row => row.action), ['create', 'update']);
  assert.equal(snapshots.rows[0].after_data.food_intake, 'low');
  assert.equal(snapshots.rows[0].after_data.created_by, undefined);

  assert.equal((await call('POST', `households/${home.id}/archive`, owner.body.token, { confirmation_name: home.name })).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-logs`, reader.body.token)).status, 403);
});
