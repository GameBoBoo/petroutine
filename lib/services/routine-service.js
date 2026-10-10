import { pool } from '../db.js';
import { bangkokDate } from '../calendar.js';
import { normalizeSchedule, scheduleOccursAt } from '../schedule.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

const ACTIVITY_TYPES = new Set(['feeding', 'water', 'walk', 'grooming', 'medication', 'vet', 'other']);

function cleanText(value, field, maximum, { required = false } = {}) {
  if (value == null && !required) return null;
  if (typeof value !== 'string') throw new ServiceError('INVALID_INPUT', 'ข้อมูลกิจวัตรไม่ถูกต้อง', 400, { [field]: 'รูปแบบไม่ถูกต้อง' });
  const result = value.trim();
  if ((required && !result) || result.length > maximum) {
    throw new ServiceError('INVALID_INPUT', 'ข้อมูลกิจวัตรไม่ถูกต้อง', 400, { [field]: `ต้องมีความยาวไม่เกิน ${maximum} ตัวอักษร` });
  }
  return result || null;
}

function scheduleInput(input, previous = null) {
  if (input.schedule !== undefined) return input.schedule;
  const hasLegacyFields = ['schedule_type', 'time', 'times', 'days', 'date', 'start_date', 'end_date', 'interval_days', 'pauses'].some(key => input[key] !== undefined);
  if (!hasLegacyFields && previous) return previous;
  const base = previous || {};
  return {
    type: input.schedule_type ?? base.type ?? 'weekly',
    time: input.time ?? base.time,
    times: input.times !== undefined ? input.times : (input.time !== undefined ? undefined : base.times),
    days: input.days ?? base.days,
    date: input.date ?? base.date,
    start_date: input.start_date ?? base.start_date,
    end_date: input.end_date ?? base.end_date,
    interval_days: input.interval_days ?? base.interval_days,
    pauses: input.pauses ?? base.pauses,
  };
}

async function ownerPet(client, petId, actorId) {
  const result = await client.query(
    `SELECT p.*, hm.role
     FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     FOR SHARE OF h`,
    [petId, actorId],
  );
  if (!result.rowCount || result.rows[0].role !== 'owner') {
    throw new ServiceError('FORBIDDEN', 'เฉพาะเจ้าของบ้านที่จัดการกิจวัตรได้', 403);
  }
  return result.rows[0];
}

async function ensureAssignee(client, householdId, assigneeId) {
  if (!assigneeId) return null;
  const result = await client.query(
    'SELECT 1 FROM household_members WHERE household_id = $1 AND user_id = $2',
    [householdId, assigneeId],
  );
  if (!result.rowCount) throw new ServiceError('INVALID_ASSIGNEE', 'ผู้รับผิดชอบต้องอยู่ในบ้านเดียวกัน', 400, { assigned_user_id: 'ไม่พบสมาชิกในบ้าน' });
  return assigneeId;
}

function routineValues(input, previous = null) {
  const title = cleanText(input.title ?? previous?.title, 'title', 160, { required: true });
  const activityType = input.activity_type ?? previous?.activity_type;
  if (!ACTIVITY_TYPES.has(activityType)) throw new ServiceError('INVALID_INPUT', 'ข้อมูลกิจวัตรไม่ถูกต้อง', 400, { activity_type: 'ประเภทกิจกรรมไม่ถูกต้อง' });
  const instructions = input.instructions === undefined ? (previous?.instructions ?? null) : cleanText(input.instructions, 'instructions', 2000);
  const active = input.active ?? previous?.active ?? true;
  if (typeof active !== 'boolean') throw new ServiceError('INVALID_INPUT', 'ข้อมูลกิจวัตรไม่ถูกต้อง', 400, { active: 'สถานะไม่ถูกต้อง' });
  return { title, activityType, instructions, active };
}

export async function createRoutine({ petId, actorId, input }) {
  return withTransaction(async client => {
    const pet = await ownerPet(client, petId, actorId);
    const values = routineValues(input);
    const schedule = normalizeSchedule(scheduleInput(input));
    const assignee = await ensureAssignee(client, pet.household_id, input.assigned_user_id || null);
    const result = await client.query(
      `INSERT INTO routines (pet_id, title, activity_type, schedule_value, assigned_user_id, instructions, active)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) RETURNING *`,
      [petId, values.title, values.activityType, JSON.stringify(schedule), assignee, values.instructions, values.active],
    );
    const routine = result.rows[0];
    await writeActivity(client, {
      householdId: pet.household_id, actorId, action: 'create', entityType: 'routine',
      entityId: routine.id, afterData: routine,
    });
    return { routine };
  });
}

export async function updateRoutine({ routineId, actorId, input }) {
  return withTransaction(async client => {
    const access = await client.query(
      `SELECT r.*, p.household_id, hm.role
       FROM routines r JOIN pets p ON p.id = r.pet_id
       JOIN households h ON h.id = p.household_id
       JOIN household_members hm ON hm.household_id = p.household_id
       WHERE r.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL AND r.archived_at IS NULL
       FOR UPDATE OF r FOR SHARE OF h`,
      [routineId, actorId],
    );
    if (!access.rowCount || access.rows[0].role !== 'owner') {
      throw new ServiceError('FORBIDDEN', 'เฉพาะเจ้าของบ้านที่จัดการกิจวัตรได้', 403);
    }
    const previous = access.rows[0];
    const values = routineValues(input, previous);
    const schedule = normalizeSchedule(scheduleInput(input, previous.schedule_value));
    const assignee = input.assigned_user_id === undefined
      ? previous.assigned_user_id
      : await ensureAssignee(client, previous.household_id, input.assigned_user_id || null);
    const changedSchedule = JSON.stringify(schedule) !== JSON.stringify(normalizeSchedule(previous.schedule_value));
    const result = await client.query(
      `UPDATE routines SET title = $1, activity_type = $2, schedule_value = $3::jsonb,
         assigned_user_id = $4, instructions = $5, active = $6
       WHERE id = $7 RETURNING *`,
      [values.title, values.activityType, JSON.stringify(schedule), assignee, values.instructions, values.active, routineId],
    );
    const routine = result.rows[0];
    if (changedSchedule || !values.active || assignee !== previous.assigned_user_id) {
      await client.query(
        `DELETE FROM care_tasks
         WHERE routine_id = $1 AND status = 'pending'
           AND scheduled_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Bangkok') AT TIME ZONE 'Asia/Bangkok'`,
        [routineId],
      );
    }
    await writeActivity(client, {
      householdId: previous.household_id, actorId, action: 'update', entityType: 'routine',
      entityId: routine.id, beforeData: previous, afterData: routine,
    });
    return { routine };
  });
}

export async function ensureTasksForDate({ householdId, date, client = pool }) {
  const routines = await client.query(
    `SELECT r.id, r.assigned_user_id, r.schedule_value
     FROM routines r JOIN pets p ON p.id = r.pet_id
     JOIN households h ON h.id = p.household_id
     WHERE p.household_id = $1 AND h.archived_at IS NULL
       AND r.active = TRUE AND r.archived_at IS NULL AND p.archived_at IS NULL`,
    [householdId],
  );
  const tasks = [];
  for (const routine of routines.rows) {
    for (const moment of scheduleOccursAt(routine.schedule_value, date)) {
      const inserted = await client.query(
        `INSERT INTO care_tasks (routine_id, scheduled_at, original_scheduled_at, assigned_user_id)
         SELECT $1, $2, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM care_tasks
           WHERE routine_id = $1 AND status IN ('completed', 'skipped')
             AND (scheduled_at AT TIME ZONE 'Asia/Bangkok')::date = ($2::timestamptz AT TIME ZONE 'Asia/Bangkok')::date
         )
         ON CONFLICT (routine_id, scheduled_at) DO NOTHING
         RETURNING *`,
        [routine.id, moment, routine.assigned_user_id],
      );
      if (inserted.rowCount) tasks.push(inserted.rows[0]);
    }
  }
  return tasks;
}

export function ensureTodayTasks(householdId, client = pool) {
  return ensureTasksForDate({ householdId, date: bangkokDate(), client });
}
