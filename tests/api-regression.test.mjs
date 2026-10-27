import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `api_regression_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let pool;
let handlers;

before(async () => {
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
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
  try { await admin.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await admin.end(); }
});

async function call(method, path, token, body, headers = {}) {
  const request = new Request(`http://localhost/api/v1/${path}`, {
    method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  });
  const response = await handlers[method](request, { params: Promise.resolve({ path: new URL(request.url).pathname.replace('/api/v1/', '').split('/') }) });
  return { status: response.status, body: await response.json() };
}

async function fixture() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `reg-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `reg-member-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  const routine = await call('POST', `pets/${pet.body.pet.id}/routines`, owner.body.token, { title: 'อาหาร', activity_type: 'feeding', time: '00:00', days: [0, 1, 2, 3, 4, 5, 6] });
  const task = (await call('GET', `households/${home.body.household.id}/tasks/today`, owner.body.token)).body.tasks.find(item => item.routine_id === routine.body.routine.id);
  return { owner, member, home: home.body.household, task };
}

test('task HTTP mutations expose fields, idempotency, conflict, patch, and undo envelopes', async () => {
  const { owner, member, task } = await fixture();
  const missingReason = await call('POST', `tasks/${task.id}/skip`, member.body.token, { expected_version: task.mutation_version }, { 'idempotency-key': crypto.randomUUID() });
  assert.equal(missingReason.status, 400);
  assert.ok(missingReason.body.error.fields.skip_reason);

  const key = crypto.randomUUID();
  const complete = await call('POST', `tasks/${task.id}/complete`, member.body.token, { expected_version: task.mutation_version, notes: 'เรียบร้อย' }, { 'idempotency-key': key });
  assert.equal(complete.status, 200);
  const replay = await call('POST', `tasks/${task.id}/complete`, member.body.token, { expected_version: task.mutation_version, notes: 'เรียบร้อย' }, { 'idempotency-key': key });
  assert.equal(replay.body.activity.id, complete.body.activity.id);
  const conflict = await call('POST', `tasks/${task.id}/complete`, owner.body.token, { expected_version: task.mutation_version }, { 'idempotency-key': crypto.randomUUID() });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.error.code, 'STALE_TASK');
  const undone = await call('POST', `activity/${complete.body.activity.id}/undo`, member.body.token, {});
  assert.equal(undone.status, 200);
  const patched = await call('PATCH', `tasks/${task.id}`, member.body.token, { expected_version: undone.body.task.mutation_version, assigned_user_id: owner.body.user.id });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.task.assigned_user_id, owner.body.user.id);
});

test('legacy API envelopes retain unauthorized, not-found, validation, and invalid JSON behavior', async () => {
  assert.equal((await call('GET', 'households', null)).body.error.code, 'UNAUTHENTICATED');
  assert.equal((await call('GET', 'does-not-exist', 'bad-token')).status, 401);
  const invalidJson = await call('POST', 'auth/register', null, '{not-json');
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidJson.body.error.code, 'INVALID_INPUT');
  const unknown = await call('GET', 'does-not-exist', (await fixture()).owner.body.token);
  assert.equal(unknown.status, 404);
  assert.deepEqual(Object.keys(unknown.body), ['error']);
});
