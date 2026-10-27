import { pool } from '../db.js';
import { bangkokDate, validDate } from '../calendar.js';
import { BASELINE_METRICS } from '../wellness-baseline.js';
import { evaluateAlertResolution, evaluateMetricChange } from '../wellness-detection.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

async function petAccess(client, petId, actorId, lock = false) {
  const result = await client.query(
    `SELECT p.id, p.household_id, hm.role FROM pets p
     JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     ${lock ? 'FOR SHARE OF h' : ''}`,
    [petId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Alert ของสัตว์เลี้ยงนี้', 403);
  return result.rows[0];
}

async function alertAccess(client, alertId, actorId, lock = false) {
  const result = await client.query(
    `SELECT alert.*, p.household_id, hm.role FROM wellness_alerts alert
     JOIN pets p ON p.id = alert.pet_id JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE alert.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     ${lock ? 'FOR UPDATE OF alert FOR SHARE OF h' : ''}`,
    [alertId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Alert นี้', 403);
  return result.rows[0];
}

function limitValue(value) {
  const limit = value == null || value === '' ? 50 : Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ServiceError('INVALID_LIMIT', 'จำนวน Alert ต้องอยู่ระหว่าง 1–100', 400);
  return limit;
}

function statusFilter(value) {
  if (!value || value === 'active') return 'active';
  if (value === 'resolved' || value === 'all') return value;
  throw new ServiceError('INVALID_FILTER', 'สถานะ Alert ไม่ถูกต้อง', 400, { status: 'เลือก active, resolved หรือ all' });
}

function alertOutput(alert) {
  if (!alert) return alert;
  return {
    ...alert,
    baseline_start: bangkokDate(new Date(alert.baseline_start)),
    baseline_end: bangkokDate(new Date(alert.baseline_end)),
    observation_start: bangkokDate(new Date(alert.observation_start)),
    observation_end: bangkokDate(new Date(alert.observation_end)),
    follow_up_due_date: alert.follow_up_due_date ? bangkokDate(new Date(alert.follow_up_due_date)) : null,
  };
}

export async function listWellnessAlerts({ petId, actorId, filters = {} }) {
  await petAccess(pool, petId, actorId);
  const status = statusFilter(filters.status);
  const limit = limitValue(filters.limit);
  const result = await pool.query(
    `SELECT alert.*, acknowledged_user.name AS acknowledged_by_name,
            monitoring_user.name AS monitoring_by_name, assigned_user.name AS assigned_to_name,
            follow_up_user.name AS follow_up_updated_by_name
     FROM wellness_alerts alert
     JOIN pets p ON p.id = alert.pet_id JOIN households h ON h.id = p.household_id
     LEFT JOIN users acknowledged_user ON acknowledged_user.id = alert.acknowledged_by
     LEFT JOIN users monitoring_user ON monitoring_user.id = alert.monitoring_by
     LEFT JOIN users assigned_user ON assigned_user.id = alert.assigned_to
     LEFT JOIN users follow_up_user ON follow_up_user.id = alert.follow_up_updated_by
     WHERE alert.pet_id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL
       AND ($2 = 'all' OR ($2 = 'active' AND alert.status <> 'resolved') OR alert.status = $2)
     ORDER BY (alert.status = 'resolved'), alert.observation_end DESC, alert.created_at DESC
     LIMIT $3`,
    [petId, status, limit],
  );
  return { items: result.rows.map(alertOutput) };
}

async function resolveAlert(client, alert, actorId, reason, metadata = {}) {
  const result = await client.query(
    `UPDATE wellness_alerts SET status = 'resolved', resolved_at = NOW(), resolution_reason = $2,
       updated_at = NOW(), evidence = evidence || $3::jsonb WHERE id = $1 RETURNING *`,
    [alert.id, reason, JSON.stringify(metadata)],
  );
  await writeActivity(client, {
    householdId: alert.household_id,
    actorId,
    action: 'resolve',
    entityType: 'wellness_alert',
    entityId: alert.id,
    beforeData: alert,
    afterData: result.rows[0],
  });
  return result.rows[0];
}

export async function syncWellnessAlerts(client, { petId, actorId, changedLogId = null, mutation = 'create' }) {
  const pet = await petAccess(client, petId, actorId, true);
  const logs = await client.query(
    `SELECT id, recorded_at, food_intake, water_intake, activity_level, sleep_amount,
            stool_condition, mood, weight_kg
     FROM pet_wellness_logs WHERE pet_id = $1 AND archived_at IS NULL
     ORDER BY recorded_at, id`,
    [petId],
  );

  for (const definition of BASELINE_METRICS) {
    const activeResult = await client.query(
      `SELECT alert.*, $2::uuid AS household_id FROM wellness_alerts alert
       WHERE pet_id = $1 AND metric = $3 AND status <> 'resolved'
       FOR UPDATE`,
      [petId, pet.household_id, definition.key],
    );
    let active = activeResult.rows[0] || null;
    const detected = evaluateMetricChange(logs.rows, definition.key);

    if (detected && active && (active.rule_code !== detected.rule_code || active.direction !== detected.direction)) {
      await resolveAlert(client, active, actorId, 'direction_changed');
      active = null;
    }

    if (detected && active) {
      const previous = active;
      const updated = await client.query(
        `UPDATE wellness_alerts SET baseline_start = $2, baseline_end = $3,
           observation_start = $4, observation_end = $5, baseline_value = $6::jsonb,
           observed_value = $7::jsonb, evidence = $8::jsonb, source_log_ids = $9::uuid[],
           last_detected_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
        [active.id, detected.baseline_start, detected.baseline_end, detected.observation_start,
          detected.observation_end, JSON.stringify(detected.baseline_value), JSON.stringify(detected.observed_value),
          JSON.stringify(detected.evidence), detected.source_log_ids],
      );
      await writeActivity(client, { householdId: pet.household_id, actorId, action: 'update', entityType: 'wellness_alert', entityId: active.id, beforeData: previous, afterData: updated.rows[0] });
      continue;
    }

    if (detected) {
      const inserted = await client.query(
        `INSERT INTO wellness_alerts
         (pet_id, metric, rule_code, direction, baseline_start, baseline_end,
          observation_start, observation_end, baseline_value, observed_value, evidence, source_log_ids)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::uuid[])
         RETURNING *`,
        [petId, detected.metric, detected.rule_code, detected.direction, detected.baseline_start,
          detected.baseline_end, detected.observation_start, detected.observation_end,
          JSON.stringify(detected.baseline_value), JSON.stringify(detected.observed_value),
          JSON.stringify(detected.evidence), detected.source_log_ids],
      );
      await writeActivity(client, { householdId: pet.household_id, actorId, action: 'create', entityType: 'wellness_alert', entityId: inserted.rows[0].id, afterData: inserted.rows[0] });
      continue;
    }

    if (!active) continue;
    const resolution = evaluateAlertResolution(logs.rows, active);
    if (resolution) {
      await resolveAlert(client, active, actorId, 'returned_to_baseline', { resolution });
      continue;
    }
    const sourceChanged = changedLogId && ['update', 'archive'].includes(mutation)
      && active.source_log_ids.map(String).includes(String(changedLogId));
    if (sourceChanged) await resolveAlert(client, active, actorId, 'source_changed');
  }
}

async function transitionAlert({ alertId, actorId, status }) {
  return withTransaction(async client => {
    const previous = await alertAccess(client, alertId, actorId, true);
    if (previous.status === 'resolved') throw new ServiceError('ALERT_RESOLVED', 'Alert นี้กลับสู่ปกติแล้ว', 409);
    if (status === 'acknowledged' && previous.status !== 'new') {
      if (previous.status === 'acknowledged') return { alert: alertOutput(previous) };
      throw new ServiceError('INVALID_ALERT_STATE', 'Alert นี้เริ่มติดตามแล้ว', 409);
    }
    if (status === 'monitoring' && !['new', 'acknowledged'].includes(previous.status)) {
      if (previous.status === 'monitoring') return { alert: alertOutput(previous) };
      throw new ServiceError('INVALID_ALERT_STATE', 'สถานะ Alert เปลี่ยนไม่ได้', 409);
    }
    const result = await client.query(
      `UPDATE wellness_alerts SET status = $1::varchar,
         acknowledged_by = CASE WHEN $1::text = 'acknowledged' THEN $2::uuid ELSE acknowledged_by END,
         acknowledged_at = CASE WHEN $1::text = 'acknowledged' THEN NOW() ELSE acknowledged_at END,
         monitoring_by = CASE WHEN $1::text = 'monitoring' THEN $2::uuid ELSE monitoring_by END,
         monitoring_at = CASE WHEN $1::text = 'monitoring' THEN NOW() ELSE monitoring_at END,
         updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, actorId, alertId],
    );
    await writeActivity(client, { householdId: previous.household_id, actorId, action: status === 'acknowledged' ? 'acknowledge' : 'monitor', entityType: 'wellness_alert', entityId: alertId, beforeData: previous, afterData: result.rows[0] });
    return { alert: alertOutput(result.rows[0]) };
  });
}

export const acknowledgeWellnessAlert = input => transitionAlert({ ...input, status: 'acknowledged' });
export const monitorWellnessAlert = input => transitionAlert({ ...input, status: 'monitoring' });

export async function completeWellnessAlertFollowUp({ alertId, actorId, input = {} }) {
  if (input.result != null && (typeof input.result !== 'string' || input.result.length > 1000)) throw new ServiceError('INVALID_INPUT', 'ผลติดตามต้องเป็นข้อความไม่เกิน 1,000 ตัวอักษร', 400);
  return withTransaction(async client => {
    const previous = await alertAccess(client, alertId, actorId, true);
    if (previous.status === 'resolved') throw new ServiceError('ALERT_RESOLVED', 'รายการนี้กลับสู่ปกติแล้ว', 409);
    if (!previous.follow_up_due_date) throw new ServiceError('NO_FOLLOW_UP', 'รายการนี้ยังไม่ได้กำหนดวันติดตาม', 409);
    if (previous.follow_up_completed_at) return { alert: alertOutput(previous) };
    const result = await client.query(
      `UPDATE wellness_alerts SET follow_up_completed_at = NOW(), follow_up_completed_by = $2, follow_up_result = $3,
         updated_at = NOW() WHERE id = $1 RETURNING *`,
      [alertId, actorId, input.result?.trim() || null],
    );
    await writeActivity(client, {
      householdId: previous.household_id, actorId, action: 'complete',
      entityType: 'wellness_alert', entityId: alertId,
      beforeData: previous, afterData: result.rows[0],
    });
    return { alert: alertOutput(result.rows[0]) };
  });
}

export async function updateWellnessAlertFollowUp({ alertId, actorId, input = {} }) {
  const supplied = ['assigned_user_id', 'follow_up_due_date', 'follow_up_note'].some(field => Object.hasOwn(input, field));
  if (!supplied) throw new ServiceError('INVALID_INPUT', 'กรุณาระบุข้อมูลติดตามที่ต้องการแก้ไข', 400);
  return withTransaction(async client => {
    const previous = await alertAccess(client, alertId, actorId, true);
    if (previous.status === 'resolved') throw new ServiceError('ALERT_RESOLVED', 'Alert นี้กลับสู่ปกติแล้ว', 409);
    const assignedTo = Object.hasOwn(input, 'assigned_user_id') ? input.assigned_user_id || null : previous.assigned_to;
    const dueDate = Object.hasOwn(input, 'follow_up_due_date') ? input.follow_up_due_date || null : previous.follow_up_due_date;
    const note = Object.hasOwn(input, 'follow_up_note')
      ? (typeof input.follow_up_note === 'string' ? input.follow_up_note.trim() || null : input.follow_up_note == null ? null : undefined)
      : previous.follow_up_note;
    if (dueDate && (!validDate(dueDate) || dueDate < bangkokDate())) {
      throw new ServiceError('INVALID_INPUT', 'วันติดตามไม่ถูกต้อง', 400, { follow_up_due_date: 'เลือกวันนี้หรือวันในอนาคต' });
    }
    if (note === undefined || (note && note.length > 1000)) {
      throw new ServiceError('INVALID_INPUT', 'หมายเหตุติดตามไม่ถูกต้อง', 400, { follow_up_note: 'ต้องเป็นข้อความไม่เกิน 1,000 ตัวอักษร' });
    }
    if (assignedTo) {
      const member = await client.query(
        `SELECT 1 FROM household_members WHERE household_id = $1 AND user_id = $2`,
        [previous.household_id, assignedTo],
      );
      if (!member.rowCount) throw new ServiceError('INVALID_ASSIGNEE', 'ผู้ติดตามต้องเป็นสมาชิกของบ้านนี้', 400, { assigned_user_id: 'เลือกสมาชิกในบ้าน' });
    }
    const hasFollowUp = Boolean(assignedTo || dueDate || note);
    const result = await client.query(
      `UPDATE wellness_alerts SET assigned_to = $2, follow_up_due_date = $3,
         follow_up_note = $4, follow_up_updated_by = $5, follow_up_updated_at = NOW(),
         follow_up_completed_at = CASE WHEN follow_up_due_date IS DISTINCT FROM $3::date THEN NULL ELSE follow_up_completed_at END,
         follow_up_completed_by = CASE WHEN follow_up_due_date IS DISTINCT FROM $3::date THEN NULL ELSE follow_up_completed_by END,
         follow_up_result = CASE WHEN follow_up_due_date IS DISTINCT FROM $3::date THEN NULL ELSE follow_up_result END,
         status = CASE WHEN $6 THEN 'monitoring' ELSE status END,
         monitoring_by = CASE WHEN $6 THEN COALESCE(monitoring_by, $5) ELSE monitoring_by END,
         monitoring_at = CASE WHEN $6 THEN COALESCE(monitoring_at, NOW()) ELSE monitoring_at END,
         updated_at = NOW() WHERE id = $1 RETURNING *`,
      [alertId, assignedTo, dueDate, note, actorId, hasFollowUp],
    );
    await writeActivity(client, {
      householdId: previous.household_id, actorId, action: 'assign', entityType: 'wellness_alert',
      entityId: alertId, beforeData: previous, afterData: result.rows[0],
    });
    return { alert: alertOutput(result.rows[0]) };
  });
}
