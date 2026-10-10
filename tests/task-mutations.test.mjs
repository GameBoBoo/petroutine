import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import pg from 'pg';

const schema = `task_mutations_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let setup;
let pool;
let mutateTask;
let undoActivity;
let writeActivity;
let sanitizeActivitySnapshot;
let owner;
let member;
let outsider;
let household;
let pet;
let routine;
let taskSequence = 0;

function bangkokDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

before(async () => {
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
  setup = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema},public`,
  });
  await setup.connect();
  for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql']) {
    await setup.query(await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8'));
  }

  const createUser = async name => (await setup.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, 'hash') RETURNING id, name`,
    [name, `${name.toLowerCase()}-${crypto.randomUUID()}@example.com`],
  )).rows[0];
  owner = await createUser('Owner');
  member = await createUser('Member');
  outsider = await createUser('Outsider');
  household = (await setup.query(
    `INSERT INTO households (name, owner_id, invite_code)
     VALUES ('Home', $1, $2) RETURNING id`,
    [owner.id, crypto.randomBytes(6).toString('hex').toUpperCase()],
  )).rows[0];
  await setup.query(
    `INSERT INTO household_members (household_id, user_id, role)
     VALUES ($1, $2, 'owner'), ($1, $3, 'member')`,
    [household.id, owner.id, member.id],
  );
  pet = (await setup.query(
    `INSERT INTO pets (household_id, name, species)
     VALUES ($1, 'Mochi', 'dog') RETURNING id`,
    [household.id],
  )).rows[0];
  routine = (await setup.query(
    `INSERT INTO routines (pet_id, title, activity_type, schedule_value, assigned_user_id)
     VALUES ($1, 'Breakfast', 'feeding', $2::jsonb, $3)
     RETURNING id, assigned_user_id, schedule_value`,
    [pet.id, JSON.stringify({ time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] }), owner.id],
  )).rows[0];

  process.env.PGOPTIONS = `-c search_path=${schema},public`;
  let services;
  try {
    services = await Promise.all([
      import('../lib/services/task-service.js'),
      import('../lib/services/activity-service.js'),
      import('../lib/db.js'),
    ]);
  } catch {
    assert.fail('task and activity services must exist');
  }
  ({ mutateTask, undoActivity } = services[0]);
  ({ writeActivity, sanitizeActivitySnapshot } = services[1]);
  ({ pool } = services[2]);
});

after(async () => {
  if (pool) await pool.end();
  if (setup) await setup.end();
  try {
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  } finally {
    await admin.end();
  }
});

async function createTask() {
  taskSequence += 1;
  const minute = String(taskSequence % 60).padStart(2, '0');
  return (await setup.query(
    `INSERT INTO care_tasks
       (routine_id, scheduled_at, original_scheduled_at, assigned_user_id)
     VALUES ($1, $2, $2, $3)
     RETURNING *`,
    [routine.id, `${bangkokDate()}T12:${minute}:00+07:00`, owner.id],
  )).rows[0];
}

test('activity snapshots allowlist task fields and never retain credentials', async () => {
  assert.equal(typeof sanitizeActivitySnapshot, 'function');
  assert.equal(typeof writeActivity, 'function');
  const snapshot = sanitizeActivitySnapshot('care_task', {
    id: crypto.randomUUID(),
    status: 'pending',
    notes: 'visible',
    password_hash: 'never',
    token: 'never',
    authorization: 'never',
    arbitrary: 'never',
  });
  assert.deepEqual(Object.keys(snapshot).sort(), ['id', 'notes', 'status']);

  const entityId = snapshot.id;
  const activity = await writeActivity(setup, {
    householdId: household.id,
    actorId: owner.id,
    action: 'update',
    entityType: 'care_task',
    entityId,
    beforeData: { ...snapshot, secret: 'hidden' },
    afterData: { ...snapshot, status: 'completed', authorization: 'hidden' },
  });
  assert.equal(activity.entity_id, entityId);
  assert.equal(activity.before_data.secret, undefined);
  assert.equal(activity.after_data.authorization, undefined);
});

test('complete is idempotent, accepts an optional note, and rejects key reuse with another payload', async () => {
  const task = await createTask();
  const requestKey = crypto.randomUUID();
  const input = {
    taskId: task.id,
    actorId: member.id,
    expectedVersion: 0,
    action: 'complete',
    payload: { notes: 'กินหมดแล้ว' },
    requestKey,
  };
  const first = await mutateTask(input);
  const replay = await mutateTask(input);

  assert.equal(first.task.status, 'completed');
  assert.equal(first.task.notes, 'กินหมดแล้ว');
  assert.equal(first.task.completed_by, member.id);
  assert.equal(first.task.mutation_version, 1);
  assert.equal(replay.activity.id, first.activity.id);
  assert.equal(
    (await pool.query("SELECT COUNT(*)::int AS count FROM activity_logs WHERE entity_id = $1 AND action = 'complete'", [task.id])).rows[0].count,
    1,
  );

  await assert.rejects(
    mutateTask({ ...input, payload: { notes: 'different note' } }),
    error => error?.status === 409 && error.code === 'IDEMPOTENCY_KEY_REUSED',
  );
});

test('skip requires a reason and stores it with a reversible activity', async () => {
  const task = await createTask();
  await assert.rejects(
    mutateTask({
      taskId: task.id, actorId: owner.id, expectedVersion: 0,
      action: 'skip', payload: {}, requestKey: crypto.randomUUID(),
    }),
    error => Boolean(error?.code === 'INVALID_INPUT' && error.fields?.skip_reason),
  );
  const result = await mutateTask({
    taskId: task.id,
    actorId: owner.id,
    expectedVersion: 0,
    action: 'skip',
    payload: { skip_reason: 'สัตว์ไม่สบาย', notes: 'ติดต่อคลินิกแล้ว' },
    requestKey: crypto.randomUUID(),
  });
  assert.equal(result.task.status, 'skipped');
  assert.equal(result.task.skip_reason, 'สัตว์ไม่สบาย');
  assert.equal(result.task.notes, 'ติดต่อคลินิกแล้ว');
  assert.ok(new Date(result.activity.reversible_until) > new Date());
});

test('a member can reschedule and reassign one task while the parent routine stays unchanged', async () => {
  const task = await createTask();
  const nextTime = `${bangkokDate()}T16:45:00+07:00`;
  const rescheduled = await mutateTask({
    taskId: task.id,
    actorId: member.id,
    expectedVersion: 0,
    action: 'reschedule',
    payload: { scheduled_at: nextTime, reason: 'กลับบ้านช้า' },
    requestKey: crypto.randomUUID(),
  });
  assert.equal(new Date(rescheduled.task.scheduled_at).toISOString(), new Date(nextTime).toISOString());
  assert.equal(new Date(rescheduled.task.original_scheduled_at).toISOString(), new Date(task.original_scheduled_at).toISOString());
  assert.equal(rescheduled.task.mutation_reason, 'กลับบ้านช้า');

  const reassigned = await mutateTask({
    taskId: task.id,
    actorId: member.id,
    expectedVersion: 1,
    action: 'reassign',
    payload: { assigned_user_id: member.id },
    requestKey: crypto.randomUUID(),
  });
  assert.equal(reassigned.task.assigned_user_id, member.id);
  assert.equal((await pool.query('SELECT assigned_user_id FROM routines WHERE id = $1', [routine.id])).rows[0].assigned_user_id, owner.id);

  await assert.rejects(
    mutateTask({
      taskId: task.id,
      actorId: member.id,
      expectedVersion: 2,
      action: 'reassign',
      payload: { assigned_user_id: outsider.id },
      requestKey: crypto.randomUUID(),
    }),
    error => error?.code === 'INVALID_ASSIGNEE',
  );
  await assert.rejects(
    mutateTask({
      taskId: task.id,
      actorId: member.id,
      expectedVersion: 0,
      action: 'reassign',
      payload: { assigned_user_id: null },
      requestKey: crypto.randomUUID(),
    }),
    error => error?.status === 409 && error.code === 'STALE_TASK',
  );
});

test('an outsider cannot mutate a household task', async () => {
  const task = await createTask();
  await assert.rejects(
    mutateTask({
      taskId: task.id,
      actorId: outsider.id,
      expectedVersion: 0,
      action: 'complete',
      payload: {},
      requestKey: crypto.randomUUID(),
    }),
    error => error?.status === 403 && error.code === 'FORBIDDEN',
  );
});

test('Undo restores a task once and rejects expiration or a later concurrent change', async () => {
  const completedTask = await createTask();
  const completed = await mutateTask({
    taskId: completedTask.id,
    actorId: member.id,
    expectedVersion: 0,
    action: 'complete',
    payload: {},
    requestKey: crypto.randomUUID(),
  });
  const undone = await undoActivity({ activityId: completed.activity.id, actorId: member.id });
  assert.equal(undone.task.status, 'pending');
  assert.equal(undone.task.completed_by, null);
  assert.equal(undone.task.mutation_version, 2);
  assert.equal(undone.activity.action, 'undo');
  await assert.rejects(
    undoActivity({ activityId: completed.activity.id, actorId: member.id }),
    error => error?.status === 409 && error.code === 'UNDO_UNAVAILABLE',
  );

  const expiredTask = await createTask();
  const expired = await mutateTask({
    taskId: expiredTask.id,
    actorId: owner.id,
    expectedVersion: 0,
    action: 'complete',
    payload: {},
    requestKey: crypto.randomUUID(),
  });
  await pool.query("UPDATE activity_logs SET reversible_until = NOW() - INTERVAL '1 second' WHERE id = $1", [expired.activity.id]);
  await assert.rejects(
    undoActivity({ activityId: expired.activity.id, actorId: owner.id }),
    error => error?.status === 409 && error.code === 'UNDO_EXPIRED',
  );

  const changedTask = await createTask();
  const changed = await mutateTask({
    taskId: changedTask.id,
    actorId: member.id,
    expectedVersion: 0,
    action: 'reassign',
    payload: { assigned_user_id: member.id },
    requestKey: crypto.randomUUID(),
  });
  await mutateTask({
    taskId: changedTask.id,
    actorId: owner.id,
    expectedVersion: 1,
    action: 'reschedule',
    payload: { scheduled_at: `${bangkokDate()}T18:00:00+07:00` },
    requestKey: crypto.randomUUID(),
  });
  await assert.rejects(
    undoActivity({ activityId: changed.activity.id, actorId: member.id }),
    error => error?.status === 409 && error.code === 'UNDO_CONFLICT',
  );
});
