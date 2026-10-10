import { NextResponse } from 'next/server.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { pool } from '../../../../lib/db.js';
import { issueToken, userIdFromRequest } from '../../../../lib/auth.js';
import { bangkokDate, datesInRange } from '../../../../lib/calendar.js';
import { occurrencesInRange, ScheduleValidationError } from '../../../../lib/schedule.js';
import { ServiceError } from '../../../../lib/services/service-errors.js';
import { createRoutine, ensureTasksForDate, ensureTodayTasks, updateRoutine } from '../../../../lib/services/routine-service.js';
import { archiveCareEntry, createCareEntry, listCareEntries, updateCareEntry } from '../../../../lib/services/care-entry-service.js';
import { archiveHealthRecord, createHealthRecord, listHealthRecords, updateHealthRecord } from '../../../../lib/services/health-record-service.js';
import { listAccountActivity, listHouseholdActivity, writeActivity } from '../../../../lib/services/activity-service.js';
import { withTransaction } from '../../../../lib/services/transaction.js';
import { getPetTimeline } from '../../../../lib/services/timeline-service.js';
import { archiveHousehold, listTrashedHouseholds, restoreHousehold } from '../../../../lib/services/household-service.js';
import { mutateTask, undoActivity } from '../../../../lib/services/task-service.js';
import { requireMember, requireOwner } from '../../../../lib/services/access-service.js';

export const runtime = 'nodejs';

const ok = (data, status = 200) => NextResponse.json(data, { status });
const fail = (status, code, message) => ok({ error: { code, message } }, status);
const serviceFailure = error => {
  if (error instanceof ScheduleValidationError) return ok({ error: { code: 'INVALID_INPUT', message: error.message, fields: error.fields } }, 400);
  if (error instanceof ServiceError) return ok({ error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } }, error.status);
  console.error(error);
  return fail(500, 'SERVER_ERROR', 'เกิดข้อผิดพลาดในระบบ');
};
const uid = (request) => userIdFromRequest(request);

async function member(householdId, userId) {
  try { return await requireMember(pool, householdId, userId); }
  catch (error) { if (error instanceof ServiceError && error.code === 'FORBIDDEN') return null; throw error; }
}
async function petAccess(petId, userId, client = pool, lock = false) {
  const result = await client.query(`SELECT p.*, hm.role FROM pets p JOIN households h ON h.id = p.household_id JOIN household_members hm ON hm.household_id = p.household_id WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL ${lock ? 'FOR UPDATE OF p FOR SHARE OF h' : ''}`, [petId, userId]);
  return result.rows[0] || null;
}
async function routineAccess(routineId, userId, client = pool, lock = false) {
  const result = await client.query(`SELECT r.*, p.household_id, hm.role FROM routines r JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id JOIN household_members hm ON hm.household_id = p.household_id WHERE r.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL AND r.archived_at IS NULL ${lock ? 'FOR UPDATE OF r FOR SHARE OF h' : ''}`, [routineId, userId]);
  return result.rows[0] || null;
}
const validDays = days => Array.isArray(days) && days.length > 0 && days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) && new Set(days).size === days.length;
const validTime = time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
};
async function validAssignee(householdId, assigneeId) {
  return !assigneeId || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(assigneeId) && Boolean((await member(householdId, assigneeId))));
}
async function auth(request) { const userId = uid(request); return userId ? userId : null; }
async function expectedTaskVersion(taskId, requested) {
  if (Number.isInteger(requested)) return requested;
  const result = await pool.query('SELECT mutation_version FROM care_tasks WHERE id = $1', [taskId]);
  return result.rows[0]?.mutation_version;
}
const ensureDate = (householdId, date) => ensureTasksForDate({ householdId, date });
const ensureToday = householdId => ensureTodayTasks(householdId);

export async function GET(request, context) {
  const path = (await context.params).path || [];
  try {
    if (path.join('/') === 'health') { await pool.query('SELECT 1'); return ok({ status: 'ok', database: 'ok' }); }
    const userId = await auth(request);
    if (!userId) return fail(401, 'UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
    if (path.join('/') === 'auth/me') {
      const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [userId]);
      return result.rowCount ? ok({ user: result.rows[0] }) : fail(404, 'USER_NOT_FOUND', 'ไม่พบผู้ใช้');
    }
    if (path.join('/') === 'auth/settings') {
      const result = await pool.query('SELECT notifications_enabled, lead_minutes FROM user_settings WHERE user_id = $1', [userId]);
      return ok({ settings: result.rows[0] || { notifications_enabled: true, lead_minutes: 60 } });
    }
    if (path.join('/') === 'auth/activity') {
      const params = new URL(request.url).searchParams;
      return ok(await listAccountActivity({ actorId: userId, cursor: params.get('cursor'), limit: params.get('limit') }));
    }
    if (path.join('/') === 'households') {
      const result = await pool.query('SELECT h.id, h.name, hm.role, h.created_at FROM households h JOIN household_members hm ON hm.household_id = h.id WHERE hm.user_id = $1 AND h.archived_at IS NULL ORDER BY h.created_at DESC', [userId]);
      return ok({ households: result.rows });
    }
    if (path.join('/') === 'households/trash') {
      return ok(await listTrashedHouseholds({ actorId: userId }));
    }
    if (path[0] === 'households' && path.length === 2) {
      const role = await member(path[1], userId);
      if (!role) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      const result = await pool.query('SELECT id, name, owner_id, invite_code, created_at FROM households WHERE id = $1 AND archived_at IS NULL', [path[1]]);
      if (!result.rowCount) return fail(404, 'HOUSEHOLD_NOT_FOUND', 'ไม่พบบ้านนี้');
      const household = { ...result.rows[0], role };
      if (role !== 'owner') delete household.invite_code;
      return ok({ household });
    }
    if (path[0] === 'households' && path[2] === 'members') {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      const result = await pool.query('SELECT u.id, u.name, u.email, hm.role, hm.created_at FROM household_members hm JOIN users u ON u.id = hm.user_id JOIN households h ON h.id = hm.household_id WHERE hm.household_id = $1 AND h.archived_at IS NULL ORDER BY hm.created_at', [path[1]]);
      return ok({ members: result.rows });
    }
    if (path[0] === 'households' && path[2] === 'pets') {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      const result = await pool.query('SELECT p.* FROM pets p JOIN households h ON h.id = p.household_id WHERE p.household_id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL ORDER BY p.created_at DESC', [path[1]]);
      return ok({ pets: result.rows });
    }
    if (path[0] === 'households' && path[2] === 'tasks' && path[3] === 'today') {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      await ensureToday(path[1]);
      const result = await pool.query(`SELECT ct.*, r.title, r.activity_type, p.id AS pet_id, p.name AS pet_name, u.name AS completed_by_name, CASE WHEN ct.status = 'pending' AND ct.scheduled_at < NOW() THEN 'overdue' ELSE ct.status END AS display_status FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id LEFT JOIN users u ON u.id = ct.completed_by WHERE p.household_id = $1 AND h.archived_at IS NULL AND (ct.scheduled_at AT TIME ZONE 'Asia/Bangkok')::date = (NOW() AT TIME ZONE 'Asia/Bangkok')::date AND (ct.status <> 'pending' OR (r.active AND r.archived_at IS NULL AND p.archived_at IS NULL)) ORDER BY ct.scheduled_at`, [path[1]]);
      return ok({ tasks: result.rows });
    }
    if (path[0] === 'households' && path[2] === 'calendar' && path.length === 3) {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      const params = new URL(request.url).searchParams;
      let dates;
      try { dates = datesInRange(params.get('from'), params.get('to')); }
      catch { return fail(400, 'INVALID_RANGE', 'กรุณาเลือกช่วงวันที่ไม่เกิน 42 วัน'); }
      const [from, to] = [dates[0], dates.at(-1)];
      if (dates.includes(bangkokDate())) await ensureToday(path[1]);
      const stored = await pool.query(`SELECT ct.*, r.title, r.activity_type, r.assigned_user_id, p.id AS pet_id, p.name AS pet_name FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id WHERE p.household_id = $1 AND h.archived_at IS NULL AND (ct.scheduled_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $2::date AND $3::date AND (ct.status <> 'pending' OR (r.active AND r.archived_at IS NULL AND p.archived_at IS NULL)) ORDER BY ct.scheduled_at`, [path[1], from, to]);
      const events = stored.rows.map(row => ({ id: row.id, routine_id: row.routine_id, pet_id: row.pet_id, pet_name: row.pet_name, title: row.title, activity_type: row.activity_type, assigned_user_id: row.assigned_user_id, date: bangkokDate(new Date(row.scheduled_at)), scheduled_at: row.scheduled_at, status: row.status === 'pending' ? (bangkokDate(new Date(row.scheduled_at)) > bangkokDate() ? 'scheduled' : new Date(row.scheduled_at) < new Date() ? 'overdue' : 'pending') : row.status }));
      const routines = await pool.query(`SELECT r.id, r.title, r.activity_type, r.assigned_user_id, r.schedule_value, p.id AS pet_id, p.name AS pet_name FROM routines r JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id WHERE p.household_id = $1 AND h.archived_at IS NULL AND r.active AND r.archived_at IS NULL AND p.archived_at IS NULL`, [path[1]]);
      const today = bangkokDate();
      for (const routine of routines.rows) {
        for (const occurrence of occurrencesInRange(routine.schedule_value, from, to)) {
          if (occurrence.date <= today) continue;
          const scheduledAt = occurrence.scheduledAt.toISOString();
          if (events.some(event => event.routine_id === routine.id && new Date(event.scheduled_at).toISOString() === scheduledAt)) continue;
          events.push({ id: null, routine_id: routine.id, pet_id: routine.pet_id, pet_name: routine.pet_name, title: routine.title, activity_type: routine.activity_type, assigned_user_id: routine.assigned_user_id, date: occurrence.date, scheduled_at: scheduledAt, status: 'scheduled' });
        }
      }
      events.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
      return ok({ events });
    }
    if (path[0] === 'households' && path[2] === 'activity' && path.length === 3) {
      const params = new URL(request.url).searchParams;
      return ok(await listHouseholdActivity({
        householdId: path[1], actorId: userId, cursor: params.get('cursor'), limit: params.get('limit'),
        filters: { member_id: params.get('member_id'), pet_id: params.get('pet_id'), action: params.get('action'), from: params.get('from'), to: params.get('to') },
      }));
    }
    if (path[0] === 'households' && path[2] === 'notifications' && path.length === 3) {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      const settings = await pool.query('SELECT notifications_enabled, lead_minutes FROM user_settings WHERE user_id = $1', [userId]);
      if (settings.rows[0]?.notifications_enabled === false) return ok({ notifications: [] });
      await ensureToday(path[1]);
      const lead = settings.rows[0]?.lead_minutes ?? 60;
      if (lead > 0) await ensureDate(path[1], bangkokDate(new Date(Date.now() + 86_400_000)));
      const result = await pool.query(`SELECT ct.id, ct.scheduled_at, r.title, r.activity_type, p.name AS pet_name, CASE WHEN ct.scheduled_at < NOW() THEN 'overdue' ELSE 'upcoming' END AS status FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id WHERE p.household_id = $1 AND h.archived_at IS NULL AND ct.status = 'pending' AND r.active AND r.archived_at IS NULL AND p.archived_at IS NULL AND ct.scheduled_at <= NOW() + ($2::integer * INTERVAL '1 minute') ORDER BY ct.scheduled_at`, [path[1], lead]);
      return ok({ notifications: result.rows });
    }
    if (path[0] === 'households' && path[2] === 'history') {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้');
      const params = new URL(request.url).searchParams;
      const petId = params.get('pet_id'); const activity = params.get('activity_type'); const from = params.get('from'); const to = params.get('to');
      if ((petId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(petId)) || (from && !validDate(from)) || (to && !validDate(to)) || (from && to && from > to) || (activity && !['feeding', 'water', 'walk', 'grooming', 'medication', 'vet', 'bathing', 'supplies', 'observation', 'other'].includes(activity))) return fail(400, 'INVALID_FILTER', 'ตัวกรองประวัติไม่ถูกต้อง');
      const result = await pool.query(`WITH history AS (
        SELECT ct.id, ct.routine_id, ct.scheduled_at, ct.status, ct.completed_by, ct.completed_at, ct.notes,
          r.title, r.activity_type, p.id AS pet_id, p.name AS pet_name, u.name AS completed_by_name,
          'task'::text AS source_type, NULL::timestamptz AS archived_at
        FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id
        LEFT JOIN users u ON u.id = ct.completed_by
        WHERE p.household_id = $1 AND h.archived_at IS NULL AND ct.status IN ('completed', 'skipped')
        UNION ALL
        SELECT ce.id, NULL::uuid, ce.occurred_at, 'completed', ce.created_by, ce.occurred_at, ce.notes,
          ce.title, ce.activity_type, p.id, p.name, u.name, 'care_entry', ce.archived_at
        FROM care_entries ce JOIN pets p ON p.id = ce.pet_id JOIN users u ON u.id = ce.created_by JOIN households h ON h.id = ce.household_id
        WHERE ce.household_id = $1 AND h.archived_at IS NULL
      )
      SELECT * FROM history WHERE ($2::uuid IS NULL OR pet_id = $2) AND ($3::text IS NULL OR activity_type = $3)
        AND ($4::date IS NULL OR (completed_at AT TIME ZONE 'Asia/Bangkok')::date >= $4)
        AND ($5::date IS NULL OR (completed_at AT TIME ZONE 'Asia/Bangkok')::date <= $5)
      ORDER BY completed_at DESC NULLS LAST LIMIT 100`, [path[1], petId || null, activity || null, from || null, to || null]);
      return ok({ history: result.rows });
    }
    if (path[0] === 'households' && path[2] === 'care-entries' && path.length === 3) {
      return ok(await listCareEntries({ householdId: path[1], actorId: userId }));
    }
    if (path[0] === 'pets' && path[2] === 'routines') {
      if (!(await petAccess(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงสัตว์เลี้ยงนี้');
      const result = await pool.query('SELECT r.* FROM routines r JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id WHERE r.pet_id = $1 AND h.archived_at IS NULL AND r.archived_at IS NULL ORDER BY r.active DESC, r.created_at DESC', [path[1]]);
      return ok({ routines: result.rows });
    }
    if (path[0] === 'pets' && path[2] === 'health-records' && path.length === 3) {
      return ok(await listHealthRecords({ petId: path[1], actorId: userId }));
    }
    if (path[0] === 'pets' && path[2] === 'timeline' && path.length === 3) {
      const params = new URL(request.url).searchParams;
      return ok(await getPetTimeline({
        petId: path[1], actorId: userId, cursor: params.get('cursor'), limit: params.get('limit'),
        filters: { source_type: params.get('source_type'), from: params.get('from'), to: params.get('to') },
      }));
    }
    if (path[0] === 'pets' && path[2] === 'history') {
      if (!(await petAccess(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์ดูประวัติสัตว์เลี้ยงนี้');
      const result = await pool.query('SELECT ct.*, r.title, r.activity_type, u.name AS completed_by_name FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id JOIN pets p ON p.id = r.pet_id JOIN households h ON h.id = p.household_id LEFT JOIN users u ON u.id = ct.completed_by WHERE r.pet_id = $1 AND h.archived_at IS NULL ORDER BY ct.scheduled_at DESC LIMIT 100', [path[1]]);
      return ok({ history: result.rows });
    }
    return fail(404, 'NOT_FOUND', 'ไม่พบ API นี้');
  } catch (error) { return serviceFailure(error); }
}

export async function POST(request, context) {
  const path = (await context.params).path || [];
  try {
    const body = await request.json().catch(() => ({}));
    if (path.join('/') === 'auth/register') {
      const { name, email, password } = body;
      if (typeof name !== 'string' || name.trim().length < 2 || typeof email !== 'string' || typeof password !== 'string' || password.length < 8) return fail(400, 'INVALID_INPUT', 'กรุณาระบุชื่อ อีเมล และรหัสผ่านอย่างน้อย 8 ตัวอักษร');
      const normalized = email.trim().toLowerCase();
      if ((await pool.query('SELECT id FROM users WHERE email = $1', [normalized])).rowCount) return fail(409, 'EMAIL_ALREADY_EXISTS', 'อีเมลนี้ถูกใช้งานแล้ว');
      const hash = await bcrypt.hash(password, 12);
      const user = await withTransaction(async client => {
        const result = await client.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at', [name.trim(), normalized, hash]);
        await writeActivity(client, { actorId: result.rows[0].id, action: 'create', entityType: 'user', entityId: result.rows[0].id, afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ user, token: issueToken(user.id) }, 201);
    }
    if (path.join('/') === 'auth/login') {
      const { email, password } = body; const result = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [String(email || '').trim().toLowerCase()]); const user = result.rows[0];
      if (!user || !(await bcrypt.compare(String(password || ''), user.password_hash))) return fail(401, 'INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      return ok({ user: { id: user.id, name: user.name, email: user.email }, token: issueToken(user.id) });
    }
    const userId = await auth(request); if (!userId) return fail(401, 'UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
    if (path.join('/') === 'households') {
      if (typeof body.name !== 'string' || body.name.trim().length < 2) return fail(400, 'INVALID_INPUT', 'กรุณาระบุชื่อ Household');
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      const household = await withTransaction(async client => {
        const result = await client.query('INSERT INTO households (name, owner_id, invite_code) VALUES ($1, $2, $3) RETURNING id, name, owner_id, invite_code, created_at', [body.name.trim(), userId, code]);
        await client.query('INSERT INTO household_members (household_id, user_id, role) VALUES ($1, $2, $3)', [result.rows[0].id, userId, 'owner']);
        await writeActivity(client, { householdId: result.rows[0].id, actorId: userId, action: 'create', entityType: 'household', entityId: result.rows[0].id, afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ household }, 201);
    }
    if (path.join('/') === 'households/join') {
      const result = await pool.query('SELECT id, name FROM households WHERE invite_code = $1 AND archived_at IS NULL', [String(body.invite_code || '').trim().toUpperCase()]); if (!result.rowCount) return fail(404, 'INVITE_NOT_FOUND', 'ไม่พบ Invite Code');
      const joinedHousehold = await withTransaction(async client => {
        const active = await client.query('SELECT id, name FROM households WHERE id = $1 AND archived_at IS NULL FOR SHARE', [result.rows[0].id]);
        if (!active.rowCount) throw new ServiceError('INVITE_NOT_FOUND', 'ไม่พบรหัสเชิญนี้', 404);
        const joined = await client.query('INSERT INTO household_members (household_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING household_id, user_id, role', [active.rows[0].id, userId, 'member']);
        if (joined.rowCount) await writeActivity(client, { householdId: active.rows[0].id, actorId: userId, action: 'join', entityType: 'household_member', entityId: userId, afterData: joined.rows[0] });
        return active.rows[0];
      });
      return ok({ household: joinedHousehold }, 201);
    }
    if (path[0] === 'households' && path[2] === 'archive' && path.length === 3) {
      return ok(await archiveHousehold({ householdId: path[1], actorId: userId }));
    }
    if (path[0] === 'households' && path[2] === 'restore' && path.length === 3) {
      return ok(await restoreHousehold({ householdId: path[1], actorId: userId }));
    }
    if (path[0] === 'households' && path[2] === 'pets') {
      if (!(await member(path[1], userId))) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Household นี้'); if (!body.name || !['dog', 'cat'].includes(body.species)) return fail(400, 'INVALID_INPUT', 'ต้องระบุชื่อและประเภท dog หรือ cat');
      const pet = await withTransaction(async client => {
        await requireMember(client, path[1], userId);
        const result = await client.query('INSERT INTO pets (household_id, name, species, birth_date, notes, vet_contact) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [path[1], body.name.trim(), body.species, body.birth_date || null, body.notes || null, body.vet_contact || null]);
        await writeActivity(client, { householdId: path[1], actorId: userId, action: 'create', entityType: 'pet', entityId: result.rows[0].id, afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ pet }, 201);
    }
    if (path[0] === 'households' && path[2] === 'care-entries' && path.length === 3) {
      return ok(await createCareEntry({ householdId: path[1], actorId: userId, input: body }), 201);
    }
    if (path[0] === 'pets' && path[2] === 'health-records' && path.length === 3) {
      return ok(await createHealthRecord({ petId: path[1], actorId: userId, input: body }), 201);
    }
    if (path[0] === 'care-entries' && path[2] === 'archive') {
      return ok(await archiveCareEntry({ entryId: path[1], actorId: userId }));
    }
    if (path[0] === 'health-records' && path[2] === 'archive') {
      return ok(await archiveHealthRecord({ recordId: path[1], actorId: userId }));
    }
    if (path[0] === 'pets' && path[2] === 'archive') {
      const pet = await petAccess(path[1], userId);
      if (!pet || pet.role !== 'owner') return fail(403, 'FORBIDDEN', 'เฉพาะเจ้าของบ้านที่เก็บโปรไฟล์สัตว์เลี้ยงได้');
      const archivedPet = await withTransaction(async client => {
        const lockedPet = await petAccess(path[1], userId, client, true);
        if (!lockedPet || lockedPet.role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะเจ้าของบ้านที่เก็บโปรไฟล์สัตว์เลี้ยงได้', 403);
        const result = await client.query('UPDATE pets SET archived_at = NOW() WHERE id = $1 AND archived_at IS NULL RETURNING *', [path[1]]);
        if (!result.rowCount) throw new ServiceError('PET_NOT_FOUND', 'ไม่พบสัตว์เลี้ยงนี้', 404);
        await writeActivity(client, { householdId: pet.household_id, actorId: userId, action: 'archive', entityType: 'pet', entityId: path[1], beforeData: pet, afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ pet: archivedPet });
    }
    if (path[0] === 'pets' && path[2] === 'routines') {
      return ok(await createRoutine({ petId: path[1], actorId: userId, input: body }), 201);
    }
    if (path[0] === 'routines' && path[2] === 'archive') {
      const routine = await routineAccess(path[1], userId);
      if (!routine || routine.role !== 'owner') return fail(403, 'FORBIDDEN', 'เฉพาะเจ้าของบ้านที่เก็บกิจวัตรได้');
      const archivedRoutine = await withTransaction(async client => {
        const lockedRoutine = await routineAccess(path[1], userId, client, true);
        if (!lockedRoutine || lockedRoutine.role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะเจ้าของบ้านที่เก็บกิจวัตรได้', 403);
        const result = await client.query('UPDATE routines SET archived_at = NOW(), active = FALSE WHERE id = $1 AND archived_at IS NULL RETURNING *', [path[1]]);
        if (!result.rowCount) throw new ServiceError('ROUTINE_NOT_FOUND', 'ไม่พบกิจวัตรนี้', 404);
        await writeActivity(client, { householdId: routine.household_id, actorId: userId, action: 'archive', entityType: 'routine', entityId: path[1], beforeData: routine, afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ routine: archivedRoutine });
    }
    if (path[0] === 'tasks' && (path[2] === 'complete' || path[2] === 'skip')) {
      return ok(await mutateTask({
        taskId: path[1], actorId: userId,
        expectedVersion: await expectedTaskVersion(path[1], body.expected_version),
        action: path[2], payload: body,
        requestKey: request.headers.get('idempotency-key') || body.idempotency_key,
      }));
    }
    if (path[0] === 'activity' && path[2] === 'undo') {
      return ok(await undoActivity({ activityId: path[1], actorId: userId }));
    }
    return fail(404, 'NOT_FOUND', 'ไม่พบ API นี้');
  } catch (error) { return serviceFailure(error); }
}

export async function PATCH(request, context) {
  const path = (await context.params).path || [];
  try {
    const userId = await auth(request);
    if (!userId) return fail(401, 'UNAUTHENTICATED', 'กรุณาเข้าสู่ระบบก่อนใช้งาน');
    const body = await request.json().catch(() => ({}));
    if (path.join('/') === 'auth/me') {
      if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 120) return fail(400, 'INVALID_INPUT', 'กรุณาระบุชื่อ 2–120 ตัวอักษร');
      const user = await withTransaction(async client => {
        const previous = await client.query('SELECT id, name, email, created_at FROM users WHERE id = $1 FOR UPDATE', [userId]);
        const result = await client.query('UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, email, created_at', [body.name.trim(), userId]);
        await writeActivity(client, { actorId: userId, action: 'update', entityType: 'user', entityId: userId, beforeData: previous.rows[0], afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ user });
    }
    if (path.join('/') === 'auth/settings') {
      if (typeof body.notifications_enabled !== 'boolean' || !Number.isInteger(body.lead_minutes) || body.lead_minutes < 0 || body.lead_minutes > 1440) return fail(400, 'INVALID_INPUT', 'การตั้งค่าแจ้งเตือนไม่ถูกต้อง');
      const settings = await withTransaction(async client => {
        const previous = await client.query('SELECT user_id, notifications_enabled, lead_minutes FROM user_settings WHERE user_id = $1', [userId]);
        const result = await client.query('INSERT INTO user_settings (user_id, notifications_enabled, lead_minutes) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET notifications_enabled = EXCLUDED.notifications_enabled, lead_minutes = EXCLUDED.lead_minutes, updated_at = NOW() RETURNING user_id, notifications_enabled, lead_minutes', [userId, body.notifications_enabled, body.lead_minutes]);
        await writeActivity(client, { actorId: userId, action: 'update', entityType: 'user_settings', entityId: userId, beforeData: previous.rows[0], afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ settings: { notifications_enabled: settings.notifications_enabled, lead_minutes: settings.lead_minutes } });
    }
    if (path[0] === 'households' && path.length === 2) {
      if ((await member(path[1], userId)) !== 'owner') return fail(403, 'FORBIDDEN', 'เฉพาะเจ้าของบ้านที่แก้ไขชื่อบ้านได้');
      if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 120) return fail(400, 'INVALID_INPUT', 'กรุณาระบุชื่อบ้าน 2–120 ตัวอักษร');
      const household = await withTransaction(async client => {
        await requireOwner(client, path[1], userId);
        const previous = await client.query('SELECT id, name, owner_id FROM households WHERE id = $1 FOR UPDATE', [path[1]]);
        const result = await client.query('UPDATE households SET name = $1 WHERE id = $2 RETURNING id, name, owner_id, invite_code, created_at', [body.name.trim(), path[1]]);
        await writeActivity(client, { householdId: path[1], actorId: userId, action: 'update', entityType: 'household', entityId: path[1], beforeData: previous.rows[0], afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ household });
    }
    if (path[0] === 'pets' && path.length === 2) {
      const pet = await petAccess(path[1], userId);
      if (!pet) return fail(403, 'FORBIDDEN', 'ไม่มีสิทธิ์แก้ไขสัตว์เลี้ยงนี้');
      const name = body.name ?? pet.name; const species = body.species ?? pet.species;
      if (typeof name !== 'string' || !name.trim() || name.length > 120 || !['dog', 'cat'].includes(species) || (body.birth_date && !validDate(body.birth_date))) return fail(400, 'INVALID_INPUT', 'ข้อมูลสัตว์เลี้ยงไม่ถูกต้อง');
      const updatedPet = await withTransaction(async client => {
        const lockedPet = await petAccess(path[1], userId, client, true);
        if (!lockedPet) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์แก้ไขสัตว์เลี้ยงนี้', 403);
        const result = await client.query('UPDATE pets SET name = $1, species = $2, birth_date = $3, notes = $4, vet_contact = $5 WHERE id = $6 AND archived_at IS NULL RETURNING *', [name.trim(), species, body.birth_date === undefined ? pet.birth_date : body.birth_date || null, body.notes === undefined ? pet.notes : body.notes || null, body.vet_contact === undefined ? pet.vet_contact : body.vet_contact || null, path[1]]);
        await writeActivity(client, { householdId: pet.household_id, actorId: userId, action: 'update', entityType: 'pet', entityId: path[1], beforeData: pet, afterData: result.rows[0] });
        return result.rows[0];
      });
      return ok({ pet: updatedPet });
    }
    if (path[0] === 'tasks' && path.length === 2) {
      const action = body.action || (body.scheduled_at !== undefined ? 'reschedule' : body.assigned_user_id !== undefined ? 'reassign' : null);
      if (!action) throw new ServiceError('INVALID_ACTION', 'กรุณาระบุการแก้ไขงาน', 400, { action: 'เลือกเลื่อนเวลาหรือเปลี่ยนผู้รับผิดชอบ' });
      return ok(await mutateTask({
        taskId: path[1], actorId: userId,
        expectedVersion: await expectedTaskVersion(path[1], body.expected_version),
        action, payload: body,
        requestKey: request.headers.get('idempotency-key') || body.idempotency_key,
      }));
    }
    if (path[0] === 'care-entries' && path.length === 2) {
      return ok(await updateCareEntry({ entryId: path[1], actorId: userId, input: body }));
    }
    if (path[0] === 'health-records' && path.length === 2) {
      return ok(await updateHealthRecord({ recordId: path[1], actorId: userId, input: body }));
    }
    if (path[0] === 'routines' && path.length === 2) {
      return ok(await updateRoutine({ routineId: path[1], actorId: userId, input: body }));
    }
    return fail(404, 'NOT_FOUND', 'ไม่พบ API นี้');
  } catch (error) { return serviceFailure(error); }
}
