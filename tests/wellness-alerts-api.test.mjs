import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `wellness_alerts_${crypto.randomBytes(8).toString('hex')}`;
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
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `alert-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `alert-member-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `alert-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Alert Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, member, outsider, home: home.body.household, pet: pet.body.pet };
}

const dateAfter = (start, offset) => {
  const value = new Date(`${start}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10);
};

test('change detection, access, lifecycle, activity, timeline and automatic resolution work end to end', async () => {
  const { owner, member, outsider, home, pet } = await fixture();
  for (let index = 0; index < 14; index += 1) {
    const response = await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
      recorded_at: `${dateAfter('2026-09-20', index)}T08:00:00+07:00`, activity_level: 'usual',
    });
    assert.equal(response.status, 201);
  }
  for (let index = 0; index < 2; index += 1) {
    assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
      recorded_at: `${dateAfter('2026-10-04', index)}T08:00:00+07:00`, activity_level: 'low',
    })).status, 201);
    assert.equal((await call('GET', `pets/${pet.id}/wellness-alerts`, member.body.token)).body.items.length, 0);
  }
  const third = await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, {
    recorded_at: '2026-10-06T08:00:00+07:00', activity_level: 'low',
  });
  assert.equal(third.status, 201);

  const active = await call('GET', `pets/${pet.id}/wellness-alerts?status=active`, member.body.token);
  assert.equal(active.status, 200);
  assert.equal(active.body.items.length, 1);
  const alert = active.body.items[0];
  assert.equal(alert.metric, 'activity_level');
  assert.equal(alert.status, 'new');
  assert.equal(alert.observation_start, '2026-10-04');
  assert.equal(alert.observation_end, '2026-10-06');
  assert.equal(alert.source_log_ids.length, 17);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-alerts`, outsider.body.token)).status, 403);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-alerts?status=bad`, owner.body.token)).status, 400);

  const acknowledged = await call('POST', `wellness-alerts/${alert.id}/acknowledge`, member.body.token, {});
  assert.equal(acknowledged.status, 200);
  assert.equal(acknowledged.body.alert.status, 'acknowledged');
  const monitoring = await call('POST', `wellness-alerts/${alert.id}/monitor`, owner.body.token, {});
  assert.equal(monitoring.status, 200);
  assert.equal(monitoring.body.alert.status, 'monitoring');

  const timeline = await call('GET', `pets/${pet.id}/timeline?source_type=wellness_alert`, member.body.token);
  assert.equal(timeline.status, 200);
  assert.equal(timeline.body.items.length, 1);
  assert.equal(timeline.body.items[0].source_type, 'wellness_alert');
  const activity = await call('GET', `households/${home.id}/activity?pet_id=${pet.id}`, member.body.token);
  const alertActions = activity.body.items.filter(item => item.entity_type === 'wellness_alert').map(item => item.action);
  assert.ok(alertActions.includes('create'));
  assert.ok(alertActions.includes('acknowledge'));
  assert.ok(alertActions.includes('monitor'));

  for (const date of ['2026-10-07', '2026-10-08']) {
    assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, { recorded_at: `${date}T08:00:00+07:00`, activity_level: 'usual' })).status, 201);
  }
  assert.equal((await call('GET', `pets/${pet.id}/wellness-alerts?status=active`, member.body.token)).body.items.length, 0);
  const resolved = await call('GET', `pets/${pet.id}/wellness-alerts?status=resolved`, member.body.token);
  assert.equal(resolved.body.items.length, 1);
  assert.equal(resolved.body.items[0].status, 'resolved');
  assert.equal(resolved.body.items[0].resolution_reason, 'returned_to_baseline');
  assert.equal((await call('POST', `wellness-alerts/${alert.id}/monitor`, owner.body.token, {})).status, 409);

  assert.equal((await call('POST', `households/${home.id}/archive`, owner.body.token, { confirmation_name: home.name })).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/wellness-alerts?status=all`, member.body.token)).status, 403);
});
