import { pool } from '../db.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

const ENTRY_TYPES = new Set(['allergy', 'condition', 'medication', 'vaccination', 'appointment']);

function cleanText(value, field, maximum, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string') throw new ServiceError('INVALID_INPUT', 'ข้อมูลสมุดสุขภาพไม่ถูกต้อง', 400, { [field]: 'รูปแบบไม่ถูกต้อง' });
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximum) throw new ServiceError('INVALID_INPUT', 'ข้อมูลสมุดสุขภาพไม่ถูกต้อง', 400, { [field]: `ต้องมีความยาวไม่เกิน ${maximum} ตัวอักษร` });
  return cleaned || null;
}

function dateValue(value, field) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ServiceError('INVALID_INPUT', 'วันที่ในสมุดสุขภาพไม่ถูกต้อง', 400, { [field]: 'กรุณาระบุวันที่ให้ถูกต้อง' });
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ServiceError('INVALID_INPUT', 'วันที่ในสมุดสุขภาพไม่ถูกต้อง', 400, { [field]: 'กรุณาระบุวันที่ให้ถูกต้อง' });
  return value;
}

function numberValue(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new ServiceError('INVALID_INPUT', 'ค่าตัวเลขไม่ถูกต้อง', 400, { numeric_value: 'ต้องเป็นเลขตั้งแต่ 0 ขึ้นไป' });
  return parsed;
}

function entryValues(input, previous = null) {
  const entryType = input.entry_type ?? previous?.entry_type;
  if (!ENTRY_TYPES.has(entryType)) throw new ServiceError('INVALID_INPUT', 'ประเภทสมุดสุขภาพไม่ถูกต้อง', 400, { entry_type: 'กรุณาเลือกประเภท' });
  const title = input.title === undefined && previous ? previous.title : cleanText(input.title, 'title', 160, true);
  const details = input.details === undefined && previous ? previous.details : cleanText(input.details, 'details', 5000);
  const numericValue = input.numeric_value === undefined && previous ? (previous.numeric_value == null ? null : Number(previous.numeric_value)) : numberValue(input.numeric_value);
  const unit = input.unit === undefined && previous ? previous.unit : cleanText(input.unit, 'unit', 30);
  const startDate = input.start_date === undefined && previous ? previous.start_date : dateValue(input.start_date, 'start_date');
  const endDate = input.end_date === undefined && previous ? previous.end_date : dateValue(input.end_date, 'end_date');
  const nextDueDate = input.next_due_date === undefined && previous ? previous.next_due_date : dateValue(input.next_due_date, 'next_due_date');
  if (numericValue !== null && !unit) throw new ServiceError('INVALID_INPUT', 'ค่าตัวเลขต้องมีหน่วย', 400, { unit: 'กรุณาระบุหน่วย' });
  if (startDate && endDate && endDate < startDate) throw new ServiceError('INVALID_INPUT', 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม', 400, { end_date: 'กรุณาเลือกวันที่ตั้งแต่วันเริ่มเป็นต้นไป' });
  return { entryType, title, details, numericValue, unit, startDate, endDate, nextDueDate };
}

async function petAccess(client, petId, actorId) {
  const result = await client.query(
    `SELECT p.*, hm.role FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     FOR SHARE OF h`,
    [petId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงสมุดสุขภาพนี้', 403);
  return result.rows[0];
}

async function editableEntry(client, entryId, actorId) {
  const result = await client.query(
    `SELECT entry.*, p.household_id, hm.role FROM pet_passport_entries entry
     JOIN pets p ON p.id = entry.pet_id JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE entry.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL
       AND p.archived_at IS NULL AND entry.archived_at IS NULL
     FOR UPDATE OF entry FOR SHARE OF h`,
    [entryId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงข้อมูลสมุดสุขภาพนี้', 403);
  const entry = result.rows[0];
  if (entry.created_by !== actorId && entry.role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะผู้สร้างหรือเจ้าของบ้านที่แก้ไขข้อมูลนี้ได้', 403);
  return entry;
}

export async function listPassportEntries({ petId, actorId }) {
  const pet = await petAccess(pool, petId, actorId);
  const result = await pool.query(
    `SELECT entry.*, u.name AS created_by_name,
       (entry.created_by = $2 OR $3::boolean) AS can_edit
     FROM pet_passport_entries entry JOIN users u ON u.id = entry.created_by
     JOIN pets p ON p.id = entry.pet_id JOIN households h ON h.id = p.household_id
     WHERE entry.pet_id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL
       AND entry.archived_at IS NULL
     ORDER BY entry.entry_type, entry.next_due_date NULLS LAST, entry.created_at DESC`,
    [petId, actorId, pet.role === 'owner'],
  );
  return { items: result.rows };
}

export async function createPassportEntry({ petId, actorId, input }) {
  return withTransaction(async client => {
    const pet = await petAccess(client, petId, actorId);
    const value = entryValues(input);
    const result = await client.query(
      `INSERT INTO pet_passport_entries
       (pet_id, entry_type, title, details, numeric_value, unit, start_date, end_date, next_due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [petId, value.entryType, value.title, value.details, value.numericValue, value.unit, value.startDate, value.endDate, value.nextDueDate, actorId],
    );
    const entry = result.rows[0];
    await writeActivity(client, { householdId: pet.household_id, actorId, action: 'create', entityType: 'passport_entry', entityId: entry.id, afterData: entry });
    return { entry };
  });
}

export async function updatePassportEntry({ entryId, actorId, input }) {
  return withTransaction(async client => {
    const previous = await editableEntry(client, entryId, actorId);
    const value = entryValues(input, previous);
    const result = await client.query(
      `UPDATE pet_passport_entries SET entry_type = $1, title = $2, details = $3,
       numeric_value = $4, unit = $5, start_date = $6, end_date = $7,
       next_due_date = $8, updated_at = NOW() WHERE id = $9 RETURNING *`,
      [value.entryType, value.title, value.details, value.numericValue, value.unit, value.startDate, value.endDate, value.nextDueDate, entryId],
    );
    const entry = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'update', entityType: 'passport_entry', entityId: entry.id, beforeData: previous, afterData: entry });
    return { entry };
  });
}

export async function archivePassportEntry({ entryId, actorId }) {
  return withTransaction(async client => {
    const previous = await editableEntry(client, entryId, actorId);
    const result = await client.query('UPDATE pet_passport_entries SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *', [entryId]);
    const entry = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'archive', entityType: 'passport_entry', entityId: entry.id, beforeData: previous, afterData: entry });
    return { entry };
  });
}
