import { pool } from '../db.js';
import { writeActivity } from './activity-service.js';
import { syncWellnessAlerts } from './wellness-alert-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

const RELATIVE_VALUES = new Set(['very_low', 'low', 'usual', 'high', 'very_high']);
const STOOL_VALUES = new Set(['normal', 'soft', 'watery', 'hard', 'not_observed']);
const MOOD_VALUES = new Set(['usual', 'bright', 'quiet', 'restless', 'irritable']);
const METRICS = [
  ['food_intake', RELATIVE_VALUES],
  ['water_intake', RELATIVE_VALUES],
  ['activity_level', RELATIVE_VALUES],
  ['sleep_amount', RELATIVE_VALUES],
  ['stool_condition', STOOL_VALUES],
  ['mood', MOOD_VALUES],
];

function optionalEnum(value, field, values) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !values.has(value)) {
    throw new ServiceError('INVALID_INPUT', 'ข้อมูลเช็กอินไม่ถูกต้อง', 400, { [field]: 'ค่าที่เลือกไม่ถูกต้อง' });
  }
  return value;
}

function optionalText(value, field, maximum) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') throw new ServiceError('INVALID_INPUT', 'ข้อมูลเช็กอินไม่ถูกต้อง', 400, { [field]: 'รูปแบบไม่ถูกต้อง' });
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.length > maximum) throw new ServiceError('INVALID_INPUT', 'ข้อมูลเช็กอินไม่ถูกต้อง', 400, { [field]: `ต้องยาวไม่เกิน ${maximum} ตัวอักษร` });
  return cleaned;
}

function recordedMoment(value) {
  const parsed = typeof value === 'string' ? new Date(value) : null;
  if (!parsed || !Number.isFinite(parsed.getTime())) {
    throw new ServiceError('INVALID_INPUT', 'วันเวลาที่เช็กอินไม่ถูกต้อง', 400, { recorded_at: 'กรุณาระบุวันและเวลา' });
  }
  if (parsed.getTime() > Date.now() + 5 * 60_000) {
    throw new ServiceError('INVALID_INPUT', 'ยังบันทึกเวลาในอนาคตไม่ได้', 400, { recorded_at: 'เลือกเวลาปัจจุบันหรือย้อนหลัง' });
  }
  return parsed;
}

function weightValue(value) {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1000) {
    throw new ServiceError('INVALID_INPUT', 'น้ำหนักไม่ถูกต้อง', 400, { weight_kg: 'กรุณาระบุน้ำหนักมากกว่า 0 และไม่เกิน 1,000 กก.' });
  }
  return parsed;
}

function valuesFrom(input, previous = null) {
  const value = {};
  for (const [field, allowed] of METRICS) {
    value[field] = input[field] === undefined && previous ? previous[field] : optionalEnum(input[field], field, allowed);
  }
  value.recorded_at = input.recorded_at === undefined && previous ? previous.recorded_at : recordedMoment(input.recorded_at);
  value.weight_kg = input.weight_kg === undefined && previous
    ? (previous.weight_kg == null ? null : Number(previous.weight_kg))
    : weightValue(input.weight_kg);
  value.notes = input.notes === undefined && previous ? previous.notes : optionalText(input.notes, 'notes', 2000);
  if (!METRICS.some(([field]) => value[field] !== null) && value.weight_kg === null && value.notes === null) {
    throw new ServiceError('INVALID_INPUT', 'กรุณาเลือกหรือกรอกอย่างน้อยหนึ่งข้อมูล', 400, { wellness: 'ต้องมีข้อมูลอย่างน้อยหนึ่งรายการ' });
  }
  return value;
}

async function petAccess(client, petId, actorId) {
  const result = await client.query(
    `SELECT p.*, hm.role FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     FOR SHARE OF h`,
    [petId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงเช็กอินของสัตว์เลี้ยงนี้', 403);
  return result.rows[0];
}

async function editableLog(client, logId, actorId) {
  const result = await client.query(
    `SELECT wellness.*, p.household_id, hm.role FROM pet_wellness_logs wellness
     JOIN pets p ON p.id = wellness.pet_id JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE wellness.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL
       AND p.archived_at IS NULL AND wellness.archived_at IS NULL
     FOR UPDATE OF wellness FOR SHARE OF h`,
    [logId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงเช็กอินนี้', 403);
  const log = result.rows[0];
  if (log.created_by !== actorId && log.role !== 'owner') {
    throw new ServiceError('FORBIDDEN', 'เฉพาะผู้บันทึกหรือเจ้าของบ้านที่แก้ไขข้อมูลนี้ได้', 403);
  }
  return log;
}

function dateFilter(value, end = false) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new ServiceError('INVALID_FILTER', 'ช่วงวันที่ไม่ถูกต้อง', 400, { [end ? 'to' : 'from']: 'รูปแบบวันที่ไม่ถูกต้อง' });
  }
  return `${value}T${end ? '23:59:59.999' : '00:00:00'}+07:00`;
}

export async function listWellnessLogs({ petId, actorId, filters = {} }) {
  const pet = await petAccess(pool, petId, actorId);
  const from = dateFilter(filters.from);
  const to = dateFilter(filters.to, true);
  if (from && to) {
    const span = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
    if (new Date(from) > new Date(to) || span > 366) throw new ServiceError('INVALID_FILTER', 'ช่วงวันที่ต้องไม่เกิน 366 วัน', 400);
  }
  const limit = filters.limit == null || filters.limit === '' ? 100 : Number(filters.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ServiceError('INVALID_LIMIT', 'จำนวนรายการต้องอยู่ระหว่าง 1–100', 400);
  const result = await pool.query(
    `SELECT wellness.*, u.name AS created_by_name,
       (wellness.created_by = $2 OR $5::boolean) AS can_edit
     FROM pet_wellness_logs wellness JOIN users u ON u.id = wellness.created_by
     JOIN pets p ON p.id = wellness.pet_id JOIN households h ON h.id = p.household_id
     WHERE wellness.pet_id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL
       AND wellness.archived_at IS NULL
       AND ($3::timestamptz IS NULL OR wellness.recorded_at >= $3)
       AND ($4::timestamptz IS NULL OR wellness.recorded_at <= $4)
     ORDER BY wellness.recorded_at DESC, wellness.id DESC LIMIT $6`,
    [petId, actorId, from, to, pet.role === 'owner', limit],
  );
  return { items: result.rows };
}

export async function createWellnessLog({ petId, actorId, input }) {
  return withTransaction(async client => {
    const pet = await petAccess(client, petId, actorId);
    const value = valuesFrom(input);
    const result = await client.query(
      `INSERT INTO pet_wellness_logs
       (pet_id, recorded_at, food_intake, water_intake, activity_level, sleep_amount,
        stool_condition, mood, weight_kg, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [petId, value.recorded_at, value.food_intake, value.water_intake, value.activity_level,
        value.sleep_amount, value.stool_condition, value.mood, value.weight_kg, value.notes, actorId],
    );
    const log = result.rows[0];
    await writeActivity(client, { householdId: pet.household_id, actorId, action: 'create', entityType: 'wellness_log', entityId: log.id, afterData: log });
    await syncWellnessAlerts(client, { petId, actorId, changedLogId: log.id, mutation: 'create' });
    return { log };
  });
}

export async function updateWellnessLog({ logId, actorId, input }) {
  return withTransaction(async client => {
    const previous = await editableLog(client, logId, actorId);
    const value = valuesFrom(input, previous);
    const result = await client.query(
      `UPDATE pet_wellness_logs SET recorded_at = $1, food_intake = $2, water_intake = $3,
       activity_level = $4, sleep_amount = $5, stool_condition = $6, mood = $7,
       weight_kg = $8, notes = $9, updated_at = NOW() WHERE id = $10 RETURNING *`,
      [value.recorded_at, value.food_intake, value.water_intake, value.activity_level,
        value.sleep_amount, value.stool_condition, value.mood, value.weight_kg, value.notes, logId],
    );
    const log = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'update', entityType: 'wellness_log', entityId: log.id, beforeData: previous, afterData: log });
    await syncWellnessAlerts(client, { petId: previous.pet_id, actorId, changedLogId: log.id, mutation: 'update' });
    return { log };
  });
}

export async function archiveWellnessLog({ logId, actorId }) {
  return withTransaction(async client => {
    const previous = await editableLog(client, logId, actorId);
    const result = await client.query('UPDATE pet_wellness_logs SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *', [logId]);
    const log = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'archive', entityType: 'wellness_log', entityId: log.id, beforeData: previous, afterData: log });
    await syncWellnessAlerts(client, { petId: previous.pet_id, actorId, changedLogId: log.id, mutation: 'archive' });
    return { log };
  });
}
