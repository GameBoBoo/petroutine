import { pool } from '../db.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

const TYPES = new Set(['weight', 'vaccination', 'medication', 'appointment', 'observation', 'other']);

function text(value, field, maximum, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== 'string') throw new ServiceError('INVALID_INPUT', 'ข้อมูลสุขภาพไม่ถูกต้อง', 400, { [field]: 'รูปแบบไม่ถูกต้อง' });
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximum) throw new ServiceError('INVALID_INPUT', 'ข้อมูลสุขภาพไม่ถูกต้อง', 400, { [field]: `ต้องมีความยาวไม่เกิน ${maximum} ตัวอักษร` });
  return cleaned || null;
}

function moment(value) {
  const parsed = typeof value === 'string' ? new Date(value) : null;
  if (!parsed || !Number.isFinite(parsed.getTime())) throw new ServiceError('INVALID_INPUT', 'วันเวลาที่บันทึกไม่ถูกต้อง', 400, { recorded_at: 'กรุณาระบุวันและเวลา' });
  return parsed;
}

function numeric(value) {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new ServiceError('INVALID_INPUT', 'ค่าตัวเลขไม่ถูกต้อง', 400, { numeric_value: 'ต้องเป็นเลขตั้งแต่ 0 ขึ้นไป' });
  return parsed;
}

function recordValues(input, previous = null) {
  const recordType = input.record_type ?? previous?.record_type;
  if (!TYPES.has(recordType)) throw new ServiceError('INVALID_INPUT', 'ข้อมูลสุขภาพไม่ถูกต้อง', 400, { record_type: 'ประเภทไม่ถูกต้อง' });
  const title = input.title === undefined && previous ? previous.title : text(input.title, 'title', 160, true);
  const recordedAt = input.recorded_at === undefined && previous ? previous.recorded_at : moment(input.recorded_at);
  const details = input.details === undefined && previous ? previous.details : text(input.details, 'details', 5000);
  const numericValue = input.numeric_value === undefined && previous ? (previous.numeric_value == null ? null : Number(previous.numeric_value)) : numeric(input.numeric_value);
  const unit = input.unit === undefined && previous ? previous.unit : text(input.unit, 'unit', 30);
  if (recordType === 'weight' && (numericValue === null || !unit)) {
    throw new ServiceError('INVALID_INPUT', 'น้ำหนักต้องมีค่าและหน่วย', 400, { numeric_value: 'กรุณาระบุน้ำหนัก', unit: 'กรุณาระบุหน่วย' });
  }
  if (numericValue !== null && !unit) throw new ServiceError('INVALID_INPUT', 'ค่าตัวเลขต้องมีหน่วย', 400, { unit: 'กรุณาระบุหน่วย' });
  return { recordType, title, recordedAt, details, numericValue, unit };
}

async function petAccess(client, petId, actorId) {
  const result = await client.query(
    `SELECT p.*, hm.role FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     FOR SHARE OF h`,
    [petId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงข้อมูลสัตว์เลี้ยงนี้', 403);
  return result.rows[0];
}

async function editableRecord(client, recordId, actorId) {
  const result = await client.query(
    `SELECT phr.*, p.household_id, hm.role FROM pet_health_records phr
     JOIN pets p ON p.id = phr.pet_id JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE phr.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND phr.archived_at IS NULL
     FOR UPDATE OF phr FOR SHARE OF h`,
    [recordId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงข้อมูลสุขภาพนี้', 403);
  const record = result.rows[0];
  if (record.created_by !== actorId && record.role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะผู้สร้างหรือเจ้าของบ้านที่แก้ไขข้อมูลนี้ได้', 403);
  return record;
}

export async function listHealthRecords({ petId, actorId }) {
  const pet = await petAccess(pool, petId, actorId);
  const result = await pool.query(
    `SELECT phr.*, u.name AS created_by_name, (phr.created_by = $2 OR $3::boolean) AS can_edit FROM pet_health_records phr
     JOIN users u ON u.id = phr.created_by JOIN pets p ON p.id = phr.pet_id JOIN households h ON h.id = p.household_id
     WHERE phr.pet_id = $1 AND h.archived_at IS NULL AND phr.archived_at IS NULL ORDER BY phr.recorded_at DESC, phr.id DESC`,
    [petId, actorId, pet.role === 'owner'],
  );
  return { items: result.rows };
}

export async function createHealthRecord({ petId, actorId, input }) {
  return withTransaction(async client => {
    const pet = await petAccess(client, petId, actorId);
    const value = recordValues(input);
    const result = await client.query(
      `INSERT INTO pet_health_records (pet_id, record_type, title, recorded_at, details, numeric_value, unit, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [petId, value.recordType, value.title, value.recordedAt, value.details, value.numericValue, value.unit, actorId],
    );
    const record = result.rows[0];
    await writeActivity(client, { householdId: pet.household_id, actorId, action: 'create', entityType: 'health_record', entityId: record.id, afterData: record });
    return { record };
  });
}

export async function updateHealthRecord({ recordId, actorId, input }) {
  return withTransaction(async client => {
    const previous = await editableRecord(client, recordId, actorId);
    const value = recordValues(input, previous);
    const result = await client.query(
      `UPDATE pet_health_records SET record_type = $1, title = $2, recorded_at = $3, details = $4,
         numeric_value = $5, unit = $6, updated_at = NOW() WHERE id = $7 RETURNING *`,
      [value.recordType, value.title, value.recordedAt, value.details, value.numericValue, value.unit, recordId],
    );
    const record = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'update', entityType: 'health_record', entityId: record.id, beforeData: previous, afterData: record });
    return { record };
  });
}

export async function archiveHealthRecord({ recordId, actorId }) {
  return withTransaction(async client => {
    const previous = await editableRecord(client, recordId, actorId);
    const result = await client.query('UPDATE pet_health_records SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *', [recordId]);
    const record = result.rows[0];
    await writeActivity(client, { householdId: previous.household_id, actorId, action: 'archive', entityType: 'health_record', entityId: record.id, beforeData: previous, afterData: record });
    return { record };
  });
}
