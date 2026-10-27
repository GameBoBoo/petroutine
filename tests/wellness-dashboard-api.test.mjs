import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `wellness_dashboard_${crypto.randomBytes(8).toString('hex')}`;
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
    method, headers: token ? { authorization: `Bearer ${token}` } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = await handlers[method](request, { params: Promise.resolve({ path: new URL(request.url).pathname.replace('/api/v1/', '').split('/') }) });
  return { status: response.status, body: await response.json() };
}

async function fixture() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `dashboard-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `dashboard-member-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `dashboard-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Dashboard Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, member, outsider, home: home.body.household, pet: pet.body.pet };
}

const dateAfter = (start, offset) => {
  const value = new Date(`${start}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10);
};

test('dashboard API aggregates ranges, baseline, trends, active alerts and access rules', async () => {
  const { owner, member, outsider, home, pet } = await fixture();
  for (let index = 0; index < 14; index += 1) {
    assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
      recorded_at: `${dateAfter('2026-09-20', index)}T08:00:00+07:00`, activity_level: 'usual', weight_kg: 10,
    })).status, 201);
  }
  for (const date of ['2026-10-04', '2026-10-05', '2026-10-06']) {
    assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, { recorded_at: `${date}T08:00:00+07:00`, activity_level: 'low', weight_kg: 10 })).status, 201);
  }

  const seven = await call('GET', `pets/${pet.id}/wellness-dashboard?range=7&as_of=2026-10-06`, member.body.token);
  assert.equal(seven.status, 200);
  assert.equal(seven.body.dashboard.status, 'changes_detected');
  assert.equal(seven.body.dashboard.range_days, 7);
  assert.equal(seven.body.dashboard.window_start, '2026-09-30');
  assert.equal(seven.body.dashboard.observed_days, 7);
  assert.equal(seven.body.dashboard.ready_metrics, 2);
  assert.equal(seven.body.dashboard.active_alert_count, 1);
  const activity = seven.body.dashboard.metrics.find(metric => metric.key === 'activity_level');
  assert.equal(activity.status, 'changes_detected');
  assert.equal(activity.points.length, 7);
  assert.equal(activity.points.at(-1).value, 'low');
  assert.equal(activity.baseline_band.typical_value, 'usual');
  assert.equal(activity.active_alert.observation_start, '2026-10-04');

  for (const range of [14, 30, 90]) {
    const response = await call('GET', `pets/${pet.id}/wellness-dashboard?range=${range}&as_of=2026-10-06`, owner.body.token);
    assert.equal(response.status, 200);
    assert.equal(response.body.dashboard.range_days, range);
  }
  assert.equal((await call('GET', `pets/${pet.id}/wellness-dashboard?range=10`, owner.body.token)).status, 400);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-dashboard?as_of=bad`, owner.body.token)).status, 400);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-dashboard`, outsider.body.token)).status, 403);
  assert.equal((await call('POST', `households/${home.id}/archive`, owner.body.token, { confirmation_name: home.name })).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-dashboard`, member.body.token)).status, 403);
});
