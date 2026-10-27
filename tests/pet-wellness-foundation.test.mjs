import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `wellness_foundation_${crypto.randomBytes(8).toString('hex')}`;
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
    for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql']) {
      await setup.query(await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8'));
    }
    const migration = await readFile(new URL('../db/migrations/006_pet_wellness_foundation.sql', import.meta.url), 'utf8');
    await setup.query(migration);
    await setup.query(migration);
    await setup.query(await readFile(new URL('../db/migrations/007_daily_wellness_log.sql', import.meta.url), 'utf8'));
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
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `well-owner-${nonce}@example.com`, password: 'testing123' });
  const creator = await call('POST', 'auth/register', null, { name: 'Creator', email: `well-creator-${nonce}@example.com`, password: 'testing123' });
  const reader = await call('POST', 'auth/register', null, { name: 'Reader', email: `well-reader-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `well-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Wellness Home' });
  await call('POST', 'households/join', creator.body.token, { invite_code: home.body.household.invite_code });
  await call('POST', 'households/join', reader.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, {
    name: 'Mochi', species: 'dog', breed: 'Golden Retriever', sex: 'male', neuter_status: 'neutered',
    baseline_weight_kg: 24.5, baseline_weight_recorded_on: '2026-10-11',
  });
  return { owner, creator, reader, outsider, home: home.body.household, pet: pet.body.pet };
}

test('migration 006 is repeatable and provides optional profile and passport storage', async () => {
  const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'pets'");
  const names = new Set(columns.rows.map(row => row.column_name));
  for (const name of ['breed', 'sex', 'neuter_status', 'baseline_weight_kg', 'baseline_weight_recorded_on']) assert.ok(names.has(name), name);
  assert.equal((await pool.query("SELECT to_regclass(current_schema() || '.pet_passport_entries') AS name")).rows[0].name.endsWith('pet_passport_entries'), true);
});

test('Phase 5 profile and passport APIs enforce validation, permissions, activity, timeline, and trash isolation', async () => {
  const { owner, creator, reader, outsider, home, pet } = await fixture();
  assert.equal(pet.breed, 'Golden Retriever');
  assert.equal(pet.baseline_weight_kg, '24.500');
  const changed = await call('PATCH', `pets/${pet.id}`, creator.body.token, { breed: 'Retriever', sex: 'male', neuter_status: 'neutered', baseline_weight_kg: 25.1, baseline_weight_recorded_on: '2026-10-12' });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.pet.breed, 'Retriever');
  assert.equal((await call('PATCH', `pets/${pet.id}`, owner.body.token, { baseline_weight_kg: -1 })).status, 400);

  const types = ['allergy', 'condition', 'medication', 'vaccination', 'appointment'];
  const entries = [];
  for (const entryType of types) {
    const response = await call('POST', `pets/${pet.id}/passport`, creator.body.token, {
      entry_type: entryType, title: `${entryType} entry`, details: 'ข้อมูลที่ผู้ใช้กรอกเอง',
      start_date: '2026-10-01', end_date: '2026-10-10', next_due_date: '2027-10-01',
      ...(entryType === 'medication' ? { numeric_value: 5, unit: 'mg' } : {}),
    });
    assert.equal(response.status, 201, entryType);
    entries.push(response.body.entry);
  }
  const list = await call('GET', `pets/${pet.id}/passport`, reader.body.token);
  assert.equal(list.status, 200);
  assert.equal(list.body.items.length, 5);
  assert.equal((await call('GET', `pets/${pet.id}/passport`, outsider.body.token)).status, 403);
  assert.equal((await call('POST', `pets/${pet.id}/passport`, creator.body.token, { entry_type: 'condition', title: 'Bad dates', start_date: '2026-10-10', end_date: '2026-10-01' })).status, 400);
  assert.equal((await call('POST', `pets/${pet.id}/passport`, creator.body.token, { entry_type: 'medication', title: 'Missing unit', numeric_value: 5 })).status, 400);
  assert.equal((await call('PATCH', `passport/${entries[0].id}`, reader.body.token, { details: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `passport/${entries[0].id}`, creator.body.token, { details: 'แก้โดยผู้สร้าง' })).status, 200);
  assert.equal((await call('POST', `passport/${entries[0].id}/archive`, owner.body.token, {})).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/passport`, reader.body.token)).body.items.length, 4);

  const timeline = await call('GET', `pets/${pet.id}/timeline?source_type=passport_entry`, reader.body.token);
  assert.equal(timeline.status, 200);
  assert.ok(timeline.body.items.some(item => item.source_type === 'passport_entry'));
  const logs = await pool.query("SELECT action, after_data FROM activity_logs WHERE entity_type = 'passport_entry' AND entity_id = $1 ORDER BY created_at", [entries[0].id]);
  assert.deepEqual(logs.rows.map(row => row.action), ['create', 'update', 'archive']);
  assert.equal(logs.rows[0].after_data.entry_type, 'allergy');

  assert.equal((await call('POST', `households/${home.id}/archive`, owner.body.token, { confirmation_name: home.name })).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/passport`, reader.body.token)).status, 403);
});
