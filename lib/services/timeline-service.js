import { pool } from '../db.js';
import { ServiceError } from './service-errors.js';

function limitValue(value) {
  const limit = value == null || value === '' ? 25 : Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ServiceError('INVALID_LIMIT', 'จำนวนรายการต้องอยู่ระหว่าง 1–100', 400);
  return limit;
}

function cursorValue(cursor) {
  if (!cursor) return null;
  try {
    const [eventAt, sortKey] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!Number.isFinite(new Date(eventAt).getTime()) || typeof sortKey !== 'string') throw new Error('invalid');
    return { eventAt, sortKey };
  } catch { throw new ServiceError('INVALID_CURSOR', 'ตำแหน่งหน้ารายการไม่ถูกต้อง', 400); }
}

export async function getPetTimeline({ petId, actorId, filters = {}, cursor, limit }) {
  const access = await pool.query(
    `SELECT 1 FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL`,
    [petId, actorId],
  );
  if (!access.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์ดู Timeline นี้', 403);
  const take = limitValue(limit);
  const position = cursorValue(cursor);
  const sources = filters.source_type ? String(filters.source_type).split(',') : null;
  const result = await pool.query(
    `WITH timeline AS (
       SELECT 'task'::text AS source_type, ct.id AS source_id, COALESCE(ct.completed_at, ct.scheduled_at) AS event_at,
         r.title, ct.notes, ct.status, NULL::timestamptz AS archived_at, u.name AS actor_name
       FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id LEFT JOIN users u ON u.id = ct.completed_by
       WHERE r.pet_id = $1 AND ct.status IN ('completed', 'skipped')
       UNION ALL
       SELECT 'care_entry', ce.id, ce.occurred_at, ce.title, ce.notes, 'recorded', ce.archived_at, u.name
       FROM care_entries ce JOIN users u ON u.id = ce.created_by WHERE ce.pet_id = $1
       UNION ALL
       SELECT 'health_record', hr.id, hr.recorded_at, hr.title, hr.details, hr.record_type, hr.archived_at, u.name
       FROM pet_health_records hr JOIN users u ON u.id = hr.created_by WHERE hr.pet_id = $1
       UNION ALL
       SELECT 'passport_entry', passport.id,
         COALESCE(passport.start_date::timestamptz, passport.next_due_date::timestamptz, passport.created_at),
         passport.title, passport.details, passport.entry_type, passport.archived_at, u.name
       FROM pet_passport_entries passport JOIN users u ON u.id = passport.created_by WHERE passport.pet_id = $1
       UNION ALL
       SELECT 'wellness_log', wellness.id, wellness.recorded_at, 'เช็กอินสุขภาพรายวัน', wellness.notes,
         'wellness', wellness.archived_at, u.name
       FROM pet_wellness_logs wellness JOIN users u ON u.id = wellness.created_by WHERE wellness.pet_id = $1
       UNION ALL
       SELECT 'wellness_alert', alert.id, alert.first_detected_at,
         'พบการเปลี่ยนแปลง: ' || alert.metric, alert.evidence->>'rule_text', alert.status,
         NULL::timestamptz, NULL::text
       FROM wellness_alerts alert WHERE alert.pet_id = $1
       UNION ALL
       SELECT 'activity', al.id, al.created_at, al.action || ' ' || al.entity_type,
         COALESCE(al.after_data->>'mutation_reason', al.after_data->>'notes'), al.action, NULL, u.name
       FROM activity_logs al JOIN users u ON u.id = al.actor_user_id
       LEFT JOIN routines r ON al.entity_type = 'routine' AND r.id = al.entity_id
       WHERE (al.entity_type = 'pet' AND al.entity_id = $1) OR (al.entity_type = 'routine' AND r.pet_id = $1)
     )
     SELECT *, source_type || ':' || source_id::text AS sort_key FROM timeline
     WHERE EXISTS (SELECT 1 FROM pets p JOIN households h ON h.id = p.household_id WHERE p.id = $1 AND h.archived_at IS NULL)
       AND ($2::text[] IS NULL OR source_type = ANY($2))
       AND ($3::date IS NULL OR (event_at AT TIME ZONE 'Asia/Bangkok')::date >= $3)
       AND ($4::date IS NULL OR (event_at AT TIME ZONE 'Asia/Bangkok')::date <= $4)
       AND ($5::timestamptz IS NULL OR (event_at, source_type || ':' || source_id::text) < ($5, $6))
       AND ($8::text IS NULL OR concat_ws(' ',title,notes,actor_name) ILIKE '%' || $8 || '%')
     ORDER BY event_at DESC, sort_key DESC LIMIT $7`,
    [petId, sources, filters.from || null, filters.to || null, position?.eventAt || null, position?.sortKey || null, take + 1, filters.q?.slice(0,120) || null],
  );
  const hasMore = result.rows.length > take;
  const items = result.rows.slice(0, take);
  const last = items.at(-1);
  return { items, next_cursor: hasMore ? Buffer.from(JSON.stringify([new Date(last.event_at).toISOString(), last.sort_key])).toString('base64url') : null };
}
