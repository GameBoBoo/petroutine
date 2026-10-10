import { pool } from '../db.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

const TYPES = new Set(['feeding', 'water', 'walk', 'grooming', 'medication', 'vet', 'bathing', 'supplies', 'observation', 'other']);

function text(value, field, maximum, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string') throw new ServiceError('INVALID_INPUT', 'ข้อมูลการดูแลไม่ถูกต้อง', 400, { [field]: 'รูปแบบไม่ถูกต้อง' });
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximum) throw new ServiceError('INVALID_INPUT', 'ข้อมูลการดูแลไม่ถูกต้อง', 400, { [field]: `ต้องมีความยาวไม่เกิน ${maximum} ตัวอักษร` });
  return cleaned || null;
}

function moment(value, field) {
  const parsed = typeof value === 'string' ? new Date(value) : null;
  if (!parsed || !Number.isFinite(parsed.getTime())) throw new ServiceError('INVALID_INPUT', 'วันเวลาที่บันทึกไม่ถูกต้อง', 400, { [field]: 'กรุณาระบุวันและเวลา' });
  return parsed;
}

async function membership(client, householdId, actorId) {
  const result = await client.query(`SELECT hm.role FROM household_members hm JOIN households h ON h.id = hm.household_id WHERE hm.household_id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL FOR SHARE OF h`, [householdId, actorId]);
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงข้อมูลบ้านนี้', 403);
  return result.rows[0].role;
}

async function editableEntry(client, entryId, actorId) {
  const result = await client.query(
    `SELECT ce.*, hm.role FROM care_entries ce
     JOIN households h ON h.id = ce.household_id
     JOIN household_members hm ON hm.household_id = ce.household_id
     WHERE ce.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND ce.archived_at IS NULL
     FOR UPDATE OF ce FOR SHARE OF h`,
    [entryId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงรายการดูแลนี้', 403);
  const entry = result.rows[0];
  if (entry.created_by !== actorId && entry.role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะผู้สร้างหรือเจ้าของบ้านที่แก้ไขรายการนี้ได้', 403);
  return entry;
}

export async function listCareEntries({ householdId, actorId }) {
  await membership(pool, householdId, actorId);
  const result = await pool.query(
    `SELECT ce.*, p.name AS pet_name, u.name AS created_by_name
     FROM care_entries ce JOIN pets p ON p.id = ce.pet_id JOIN users u ON u.id = ce.created_by
     JOIN households h ON h.id = ce.household_id
     WHERE ce.household_id = $1 AND h.archived_at IS NULL AND ce.archived_at IS NULL
     ORDER BY ce.occurred_at DESC, ce.id DESC`,
    [householdId],
  );
  return { items: result.rows };
}

export async function createCareEntry({ householdId, actorId, input }) {
  return withTransaction(async client => {
    await membership(client, householdId, actorId);
    const pet = await client.query('SELECT id FROM pets WHERE id = $1 AND household_id = $2 AND archived_at IS NULL', [input.pet_id, householdId]);
    if (!pet.rowCount) throw new ServiceError('INVALID_PET', 'ไม่พบสัตว์เลี้ยงในบ้านนี้', 400, { pet_id: 'ไม่พบสัตว์เลี้ยง' });
    const title = text(input.title, 'title', 160, true);
    if (!TYPES.has(input.activity_type)) throw new ServiceError('INVALID_INPUT', 'ข้อมูลการดูแลไม่ถูกต้อง', 400, { activity_type: 'ประเภทไม่ถูกต้อง' });
    const result = await client.query(
      `INSERT INTO care_entries (household_id, pet_id, title, activity_type, occurred_at, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [householdId, input.pet_id, title, input.activity_type, moment(input.occurred_at, 'occurred_at'), text(input.notes, 'notes', 5000), actorId],
    );
    const entry = result.rows[0];
    await writeActivity(client, { householdId, actorId, action: 'create', entityType: 'care_entry', entityId: entry.id, afterData: entry });
    return { entry };
  });
}

export async function updateCareEntry({ entryId, actorId, input }) {
  return withTransaction(async client => {
    const previous = await editableEntry(client, entryId, actorId);
    const title = input.title === undefined ? previous.title : text(input.title, 'title', 160, true);
    const activityType = input.activity_type ?? previous.activity_type;
    if (!TYPES.has(activityType)) throw new ServiceError('INVALID_INPUT', 'ข้อมูลการดูแลไม่ถูกต้อง', 400, { activity_type: 'ประเภทไม่ถูกต้อง' });
    const occurredAt = input.occurred_at === undefined ? previous.occurred_at : moment(input.occurred_at, 'occurred_at');
    const notes = input.notes === undefined ? previous.notes : text(input.notes, 'notes', 5000);
    const result = await client.query(
      `UPDATE care_entries SET title = $1, activity_type = $2, occurred_at = $3, notes = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, activityType, occurredAt, notes, entryId],
    );
    const entry = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'update', entityType: 'care_entry', entityId: entry.id, beforeData: previous, afterData: entry });
    return { entry };
  });
}

export async function archiveCareEntry({ entryId, actorId }) {
  return withTransaction(async client => {
    const previous = await editableEntry(client, entryId, actorId);
    const result = await client.query('UPDATE care_entries SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *', [entryId]);
    const entry = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'archive', entityType: 'care_entry', entityId: entry.id, beforeData: previous, afterData: entry });
    return { entry };
  });
}
