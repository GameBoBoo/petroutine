import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `wellness_baseline_${crypto.randomBytes(8).toString('hex')}`;
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
    await applyMigrations(setup);
  } finally { await setup.end(); }
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
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `baseline-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `baseline-member-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `baseline-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Baseline Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, member, outsider, home: home.body.household, pet: pet.body.pet };
}

test('baseline API learns per metric, recomputes edits and archives, and isolates household data', async () => {
  const { owner, member, outsider, home, pet } = await fixture();
  const logs = [];
  for (let index = 0; index < 14; index += 1) {
    const date = new Date(Date.UTC(2026, 8, 27 + index)).toISOString().slice(0, 10);
    const response = await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
      recorded_at: `${date}T08:00:00+07:00`,
      food_intake: index < 7 ? 'low' : 'usual',
      water_intake: index < 13 ? 'usual' : null,
      weight_kg: 10 + index,
    });
    assert.equal(response.status, 201);
    logs.push(response.body.log);
  }
  await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
    recorded_at: '2026-10-10T18:00:00+07:00', mood: 'bright',
  });
  await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
    recorded_at: '2026-10-10T20:00:00+07:00', mood: 'quiet',
  });

  const learned = await call('GET', `pets/${pet.id}/wellness-baseline?as_of=2026-10-10`, member.body.token);
  assert.equal(learned.status, 200);
  assert.equal(learned.body.baseline.window_start, '2026-09-27');
  const food = learned.body.baseline.metrics.find(metric => metric.key === 'food_intake');
  const water = learned.body.baseline.metrics.find(metric => metric.key === 'water_intake');
  const weight = learned.body.baseline.metrics.find(metric => metric.key === 'weight_kg');
  const mood = learned.body.baseline.metrics.find(metric => metric.key === 'mood');
  assert.equal(food.status, 'ready');
  assert.equal(food.baseline.typical_value, 'low');
  assert.equal(food.source_log_ids.length, 14);
  assert.equal(water.status, 'learning');
  assert.equal(water.remaining_days, 1);
  assert.equal(water.baseline, null);
  assert.equal(weight.baseline.typical_value, 16.5);
  assert.equal(mood.observed_days, 1);
  assert.deepEqual(mood.source_dates, ['2026-10-10']);

  assert.equal((await call('PATCH', `wellness-logs/${logs[0].id}`, owner.body.token, { food_intake: 'usual' })).status, 200);
  const recomputed = await call('GET', `pets/${pet.id}/wellness-baseline?as_of=2026-10-10`, member.body.token);
  assert.equal(recomputed.body.baseline.metrics.find(metric => metric.key === 'food_intake').baseline.typical_value, 'usual');

  assert.equal((await call('POST', `wellness-logs/${logs[0].id}/archive`, owner.body.token, {})).status, 200);
  const afterArchive = await call('GET', `pets/${pet.id}/wellness-baseline?as_of=2026-10-10`, member.body.token);
  const archivedFood = afterArchive.body.baseline.metrics.find(metric => metric.key === 'food_intake');
  assert.equal(archivedFood.status, 'learning');
  assert.equal(archivedFood.observed_days, 13);
  assert.equal(archivedFood.baseline, null);

  assert.equal((await call('GET', `pets/${pet.id}/wellness-baseline?as_of=bad-date`, member.body.token)).status, 400);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-baseline?as_of=2999-01-01`, member.body.token)).status, 400);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-baseline?as_of=2026-10-10`, outsider.body.token)).status, 403);
  assert.equal((await call('POST', `households/${home.id}/archive`, owner.body.token, { confirmation_name: home.name })).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-baseline?as_of=2026-10-10`, member.body.token)).status, 403);
});
