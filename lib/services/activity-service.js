import crypto from 'node:crypto';
import { withTransaction } from './transaction.js';
import { ServiceError } from './service-errors.js';

const SNAPSHOT_FIELDS = {
  care_task: [
    'id', 'routine_id', 'scheduled_at', 'original_scheduled_at', 'status',
    'completed_by', 'completed_at', 'notes', 'assigned_user_id',
    'mutation_version', 'mutation_reason', 'skip_reason',
  ],
  routine: ['id', 'pet_id', 'title', 'activity_type', 'schedule_value', 'assigned_user_id', 'instructions', 'active', 'archived_at'],
  pet: ['id', 'household_id', 'name', 'species', 'birth_date', 'notes', 'vet_contact', 'archived_at'],
  care_entry: ['id', 'household_id', 'pet_id', 'title', 'activity_type', 'occurred_at', 'notes', 'archived_at'],
  health_record: ['id', 'pet_id', 'record_type', 'title', 'recorded_at', 'details', 'numeric_value', 'unit', 'archived_at'],
  household: ['id', 'name', 'owner_id', 'archived_at', 'archived_by'],
  household_member: ['household_id', 'user_id', 'role'],
  user: ['id', 'name', 'email'],
  user_settings: ['user_id', 'notifications_enabled', 'lead_minutes'],
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pageLimit(value) {
  const limit = value == null || value === '' ? 25 : Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ServiceError('INVALID_LIMIT', 'จำนวนรายการต้องอยู่ระหว่าง 1–100', 400);
  return limit;
}

function encodeCursor(row) {
  return Buffer.from(JSON.stringify([new Date(row.created_at).toISOString(), row.id])).toString('base64url');
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const [createdAt, id] = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!UUID_PATTERN.test(id) || !Number.isFinite(new Date(createdAt).getTime())) throw new Error('invalid');
    return { createdAt, id };
  } catch {
    throw new ServiceError('INVALID_CURSOR', 'ตำแหน่งหน้ารายการไม่ถูกต้อง', 400);
  }
}

function dateFilter(value, end = false) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new ServiceError('INVALID_FILTER', 'ตัวกรองวันที่ไม่ถูกต้อง', 400);
  }
  return `${value}T${end ? '23:59:59.999' : '00:00:00'}+07:00`;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
  }
  return value;
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

export function sanitizeActivitySnapshot(entityType, value) {
  if (!value || typeof value !== 'object') return {};
  const allowed = SNAPSHOT_FIELDS[entityType] || [];
  return Object.fromEntries(allowed.filter(field => value[field] !== undefined).map(field => [field, value[field]]));
}

export async function writeActivity(client, entry) {
  const beforeData = sanitizeActivitySnapshot(entry.entityType, entry.beforeData);
  const afterData = sanitizeActivitySnapshot(entry.entityType, entry.afterData);
  const result = await client.query(
    `INSERT INTO activity_logs
       (household_id, actor_user_id, action, entity_type, entity_id,
        before_data, after_data, metadata, entity_version, reversible_until)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)
     RETURNING *`,
    [
      entry.householdId ?? null,
      entry.actorId,
      entry.action,
      entry.entityType,
      entry.entityId,
      JSON.stringify(beforeData),
      JSON.stringify(afterData),
      JSON.stringify(entry.metadata || {}),
      entry.entityVersion ?? null,
      entry.reversibleUntil ?? null,
    ],
  );
  return result.rows[0];
}

export async function runIdempotentMutation({
  userId,
  operation,
  requestKey,
  requestData = {},
  execute,
}) {
  if (!requestKey) return withTransaction(execute);
  if (typeof requestKey !== 'string' || requestKey.length > 120 || !requestKey.trim()) {
    throw new ServiceError('INVALID_IDEMPOTENCY_KEY', 'รหัสคำขอไม่ถูกต้อง', 400);
  }
  const requestFingerprint = fingerprint(requestData);
  return withTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))', [userId, `${operation}:${requestKey}`]);
    const existing = await client.query(
      `SELECT request_fingerprint, response_body
       FROM idempotency_records
       WHERE user_id = $1 AND operation = $2 AND request_key = $3`,
      [userId, operation, requestKey],
    );
    if (existing.rowCount) {
      if (existing.rows[0].request_fingerprint !== requestFingerprint) {
        throw new ServiceError('IDEMPOTENCY_KEY_REUSED', 'คำขอนี้ใช้รหัสเดิมกับข้อมูลที่ต่างกัน', 409);
      }
      return existing.rows[0].response_body;
    }

    const result = await execute(client);
    const responseBody = JSON.parse(JSON.stringify(result));
    await client.query(
      `INSERT INTO idempotency_records
         (user_id, operation, request_key, request_fingerprint, response_status, response_body, expires_at)
       VALUES ($1, $2, $3, $4, 200, $5::jsonb, NOW() + INTERVAL '1 day')`,
      [userId, operation, requestKey, requestFingerprint, JSON.stringify(responseBody)],
    );
    return responseBody;
  });
}

export async function listHouseholdActivity({ householdId, actorId, filters = {}, cursor, limit }) {
  const member = await (await import('../db.js')).pool.query(
    `SELECT 1 FROM household_members hm JOIN households h ON h.id = hm.household_id
     WHERE hm.household_id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL`,
    [householdId, actorId],
  );
  if (!member.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Activity ของบ้านนี้', 403);
  const take = pageLimit(limit);
  const position = decodeCursor(cursor);
  if (filters.member_id && !UUID_PATTERN.test(filters.member_id)) throw new ServiceError('INVALID_FILTER', 'สมาชิกไม่ถูกต้อง', 400);
  if (filters.pet_id && !UUID_PATTERN.test(filters.pet_id)) throw new ServiceError('INVALID_FILTER', 'สัตว์เลี้ยงไม่ถูกต้อง', 400);
  const from = dateFilter(filters.from);
  const to = dateFilter(filters.to, true);
  const result = await (await import('../db.js')).pool.query(
    `SELECT al.*, actor.name AS actor_name,
            COALESCE(ce.pet_id, hr.pet_id, routine.pet_id, task_routine.pet_id,
              CASE WHEN al.entity_type = 'pet' THEN al.entity_id END) AS pet_id,
            pet.name AS pet_name
     FROM activity_logs al
     JOIN users actor ON actor.id = al.actor_user_id
     LEFT JOIN care_entries ce ON al.entity_type = 'care_entry' AND ce.id = al.entity_id
     LEFT JOIN pet_health_records hr ON al.entity_type = 'health_record' AND hr.id = al.entity_id
     LEFT JOIN routines routine ON al.entity_type = 'routine' AND routine.id = al.entity_id
     LEFT JOIN care_tasks task ON al.entity_type = 'care_task' AND task.id = al.entity_id
     LEFT JOIN routines task_routine ON task_routine.id = task.routine_id
     LEFT JOIN pets pet ON pet.id = COALESCE(ce.pet_id, hr.pet_id, routine.pet_id, task_routine.pet_id,
       CASE WHEN al.entity_type = 'pet' THEN al.entity_id END)
     WHERE al.household_id = $1
       AND EXISTS (SELECT 1 FROM households h WHERE h.id = al.household_id AND h.archived_at IS NULL)
       AND ($2::uuid IS NULL OR al.actor_user_id = $2)
       AND ($3::uuid IS NULL OR pet.id = $3)
       AND ($4::text IS NULL OR al.action = $4)
       AND ($5::timestamptz IS NULL OR al.created_at >= $5)
       AND ($6::timestamptz IS NULL OR al.created_at <= $6)
       AND ($7::timestamptz IS NULL OR (al.created_at, al.id) < ($7, $8::uuid))
     ORDER BY al.created_at DESC, al.id DESC LIMIT $9`,
    [householdId, filters.member_id || null, filters.pet_id || null, filters.action || null, from, to, position?.createdAt || null, position?.id || null, take + 1],
  );
  const hasMore = result.rows.length > take;
  const items = result.rows.slice(0, take);
  return { items, next_cursor: hasMore ? encodeCursor(items.at(-1)) : null };
}

export async function listAccountActivity({ actorId, cursor, limit }) {
  const take = pageLimit(limit);
  const position = decodeCursor(cursor);
  const result = await (await import('../db.js')).pool.query(
    `SELECT al.*, u.name AS actor_name FROM activity_logs al JOIN users u ON u.id = al.actor_user_id
     WHERE al.household_id IS NULL AND al.actor_user_id = $1
       AND ($2::timestamptz IS NULL OR (al.created_at, al.id) < ($2, $3::uuid))
     ORDER BY al.created_at DESC, al.id DESC LIMIT $4`,
    [actorId, position?.createdAt || null, position?.id || null, take + 1],
  );
  const hasMore = result.rows.length > take;
  const items = result.rows.slice(0, take);
  return { items, next_cursor: hasMore ? encodeCursor(items.at(-1)) : null };
}
