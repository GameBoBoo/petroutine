import { pool } from '../db.js';
import { bangkokDate } from '../calendar.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';
import { writeActivity } from './activity-service.js';

const METRIC_NAMES = {
  food_intake: 'การกินอาหาร', water_intake: 'การดื่มน้ำ', activity_level: 'กิจกรรม',
  sleep_amount: 'การนอน', stool_condition: 'การขับถ่าย', mood: 'อารมณ์', weight_kg: 'น้ำหนัก',
};

export async function listScheduledHealthEvents(householdId, from, to) {
  const [passport, health, followUps, outcomes] = await Promise.all([
    pool.query(`SELECT entry.id, entry.title, entry.entry_type AS activity_type, entry.details,
        entry.next_due_date::text AS date, p.id AS pet_id, p.name AS pet_name
      FROM pet_passport_entries entry JOIN pets p ON p.id=entry.pet_id
      JOIN households h ON h.id=p.household_id
      WHERE p.household_id=$1 AND h.archived_at IS NULL AND p.archived_at IS NULL
        AND entry.archived_at IS NULL
        AND entry.next_due_date BETWEEN $2::date AND $3::date
      ORDER BY entry.next_due_date, entry.created_at`, [householdId, from, to]),
    pool.query(`SELECT hr.id, hr.title, hr.record_type AS activity_type, hr.details,
        hr.recorded_at AS scheduled_at, p.id AS pet_id, p.name AS pet_name
      FROM pet_health_records hr JOIN pets p ON p.id=hr.pet_id
      JOIN households h ON h.id=p.household_id
      WHERE p.household_id=$1 AND h.archived_at IS NULL AND p.archived_at IS NULL
        AND hr.archived_at IS NULL AND hr.record_type IN ('vaccination','appointment')
        AND (hr.recorded_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $2::date AND $3::date
        AND hr.created_at < hr.recorded_at
      ORDER BY hr.recorded_at`, [householdId, from, to]),
    pool.query(`SELECT alert.id, alert.metric, alert.follow_up_note AS details,
        alert.assigned_to AS assigned_user_id, alert.follow_up_completed_at, alert.follow_up_completed_by,
        alert.follow_up_due_date::text AS date, p.id AS pet_id, p.name AS pet_name
      FROM wellness_alerts alert JOIN pets p ON p.id=alert.pet_id
      JOIN households h ON h.id=p.household_id
      WHERE p.household_id=$1 AND h.archived_at IS NULL AND p.archived_at IS NULL
        AND alert.status <> 'resolved' AND alert.follow_up_due_date BETWEEN $2::date AND $3::date
      ORDER BY alert.follow_up_due_date`, [householdId, from, to]),
    pool.query(`SELECT outcome.*, outcome.due_date::text AS due_date_text, actor.name AS completed_by_name
      FROM scheduled_health_outcomes outcome
      LEFT JOIN users actor ON actor.id=outcome.acted_by
      WHERE outcome.due_date BETWEEN $2::date AND $3::date
        AND ((outcome.source_type='passport_due' AND EXISTS (
          SELECT 1 FROM pet_passport_entries entry JOIN pets p ON p.id=entry.pet_id
          WHERE entry.id=outcome.source_id AND p.household_id=$1 AND p.archived_at IS NULL AND entry.archived_at IS NULL
        )) OR (outcome.source_type='health_appointment' AND EXISTS (
          SELECT 1 FROM pet_health_records record JOIN pets p ON p.id=record.pet_id
          WHERE record.id=outcome.source_id AND p.household_id=$1 AND p.archived_at IS NULL AND record.archived_at IS NULL
        )))`, [householdId, from, to]),
  ]);
  const outcomeByOccurrence = new Map(outcomes.rows.map(row => [`${row.source_type}:${row.source_id}:${row.due_date_text}`, row]));
  const withOutcome = event => {
    const outcome = outcomeByOccurrence.get(`${event.source_type}:${event.id}:${event.date}`);
    return outcome ? { ...event, status: outcome.status, skip_reason: outcome.skip_reason, completed_by: outcome.acted_by, completed_by_name: outcome.completed_by_name, completed_at: outcome.acted_at } : event;
  };
  return [
    ...passport.rows.map(row => withOutcome({ ...row, source_type: 'passport_due', date: row.date, scheduled_at: new Date(`${row.date}T12:00:00+07:00`).toISOString(), all_day: true })),
    ...health.rows.map(row => withOutcome({ ...row, source_type: 'health_appointment', date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date(row.scheduled_at)), all_day: false })),
    ...followUps.rows.map(row => ({ ...row, title: `ติดตามสุขภาวะ: ${METRIC_NAMES[row.metric] || row.metric}`, activity_type: 'follow_up', source_type: 'wellness_follow_up', scheduled_at: new Date(`${row.date}T12:00:00+07:00`).toISOString(), all_day: true, status: row.follow_up_completed_at ? 'completed' : 'pending' })),
  ];
}

export async function changeScheduledHealthOutcome({ sourceType, sourceId, actorId, action, skipReason }) {
  if (!['passport_due', 'health_appointment'].includes(sourceType) || !['complete', 'skip', 'reopen'].includes(action)
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceId)) {
    throw new ServiceError('INVALID_ACTION', 'รายการสุขภาพหรือการกระทำไม่ถูกต้อง', 400);
  }
  const reason = typeof skipReason === 'string' ? skipReason.trim() : '';
  if (action === 'skip' && (!reason || reason.length > 160)) throw new ServiceError('INVALID_INPUT', 'กรุณาระบุเหตุผลที่ข้ามไม่เกิน 160 ตัวอักษร', 400);
  return withTransaction(async client => {
    const source = sourceType === 'passport_due'
      ? await client.query(`SELECT entry.next_due_date::text AS date, p.household_id, entry.title
          FROM pet_passport_entries entry JOIN pets p ON p.id=entry.pet_id JOIN households h ON h.id=p.household_id
          WHERE entry.id=$1 AND entry.archived_at IS NULL AND p.archived_at IS NULL AND h.archived_at IS NULL
          FOR UPDATE OF entry FOR SHARE OF p, h`, [sourceId])
      : await client.query(`SELECT (record.recorded_at AT TIME ZONE 'Asia/Bangkok')::date::text AS date,
          p.household_id, record.title FROM pet_health_records record
          JOIN pets p ON p.id=record.pet_id JOIN households h ON h.id=p.household_id
          WHERE record.id=$1 AND record.archived_at IS NULL AND record.record_type IN ('vaccination','appointment')
            AND record.created_at < record.recorded_at AND p.archived_at IS NULL AND h.archived_at IS NULL
          FOR UPDATE OF record FOR SHARE OF p, h`, [sourceId]);
    if (!source.rowCount) throw new ServiceError('NOT_FOUND', 'ไม่พบรายการสุขภาพนี้', 404);
    const { date, household_id: householdId } = source.rows[0];
    const member = await client.query('SELECT role FROM household_members WHERE household_id=$1 AND user_id=$2', [householdId, actorId]);
    if (!member.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์จัดการรายการสุขภาพนี้', 403);
    if (date !== bangkokDate()) throw new ServiceError('NOT_ACTIONABLE_TODAY', 'ทำรายการได้เฉพาะกำหนดของวันนี้', 409);
    const existing = await client.query(`SELECT * FROM scheduled_health_outcomes
      WHERE source_type=$1 AND source_id=$2 AND due_date=$3::date FOR UPDATE`, [sourceType, sourceId, date]);
    const previous = existing.rows[0];
    if (action === 'reopen') {
      if (!previous || previous.status === 'pending') throw new ServiceError('NOT_COMPLETED', 'รายการนี้ยังไม่ได้บันทึกผล', 409);
      if (previous.acted_by !== actorId && member.rows[0].role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะผู้บันทึกหรือเจ้าของบ้านที่แก้ไขได้', 403);
    } else if (previous && previous.status !== 'pending') throw new ServiceError('ALREADY_HANDLED', 'รายการนี้ถูกบันทึกแล้ว กรุณาโหลดข้อมูลล่าสุด', 409);
    const status = action === 'reopen' ? 'pending' : action === 'complete' ? 'completed' : 'skipped';
    const result = await client.query(`INSERT INTO scheduled_health_outcomes
      (source_type, source_id, due_date, status, skip_reason, acted_by, acted_at)
      VALUES ($1,$2,$3::date,$4,$5,$6,NOW())
      ON CONFLICT (source_type, source_id, due_date) DO UPDATE
      SET status=EXCLUDED.status, skip_reason=EXCLUDED.skip_reason, acted_by=EXCLUDED.acted_by,
          acted_at=EXCLUDED.acted_at, updated_at=NOW() RETURNING *`,
    [sourceType, sourceId, date, status, action === 'skip' ? reason : null, actorId]);
    const outcome = result.rows[0];
    await writeActivity(client, { householdId, actorId, action, entityType: 'scheduled_health_outcome', entityId: outcome.id,
      beforeData: previous, afterData: outcome, metadata: { title: source.rows[0].title, source_type: sourceType, source_id: sourceId, due_date: date } });
    return { outcome };
  });
}
