import { bangkokDate } from '../calendar.js';
import { pool } from '../db.js';
import { ServiceError } from './service-errors.js';

export async function listWellnessReminders({ householdId, actorId, days, asOf = bangkokDate() }) {
  const windowDays = Number(days);
  if (![7, 14, 30, 60, 90].includes(windowDays)) {
    throw new ServiceError('INVALID_REMINDER_WINDOW', 'ช่วงเวลาแจ้งเตือนสุขภาพไม่ถูกต้อง', 400);
  }
  const access = await pool.query(
    `SELECT 1 FROM household_members hm JOIN households h ON h.id = hm.household_id
     WHERE hm.household_id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL`,
    [householdId, actorId],
  );
  if (!access.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงการแจ้งเตือนของบ้านนี้', 403);
  const [passport, alerts] = await Promise.all([
    pool.query(
      `SELECT entry.id, 'health_due'::text AS type, entry.entry_type, entry.title,
              entry.next_due_date AS due_date, p.id AS pet_id, p.name AS pet_name,
              CASE WHEN entry.next_due_date < $2::date THEN 'overdue'
                   WHEN entry.next_due_date = $2::date THEN 'due_today' ELSE 'upcoming' END AS status
       FROM pet_passport_entries entry
       JOIN pets p ON p.id = entry.pet_id JOIN households h ON h.id = p.household_id
       WHERE p.household_id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL
         AND entry.archived_at IS NULL AND entry.entry_type IN ('vaccination', 'appointment')
         AND entry.next_due_date IS NOT NULL
         AND entry.next_due_date <= $2::date + $3::integer
         AND NOT EXISTS (SELECT 1 FROM scheduled_health_outcomes outcome
           WHERE outcome.source_type='passport_due' AND outcome.source_id=entry.id
             AND outcome.due_date=entry.next_due_date AND outcome.status IN ('completed','skipped'))
       ORDER BY entry.next_due_date, entry.created_at`,
      [householdId, asOf, windowDays],
    ),
    pool.query(
      `SELECT alert.id, 'wellness_alert'::text AS type, alert.metric, alert.status AS alert_status,
              alert.follow_up_due_date AS due_date, alert.follow_up_note,
              alert.assigned_to, assigned.name AS assigned_to_name, p.id AS pet_id, p.name AS pet_name,
              CASE WHEN alert.follow_up_due_date < $2::date THEN 'overdue'
                   WHEN alert.follow_up_due_date = $2::date THEN 'due_today'
                   WHEN alert.follow_up_due_date IS NOT NULL THEN 'upcoming' ELSE 'attention' END AS status
       FROM wellness_alerts alert
       JOIN pets p ON p.id = alert.pet_id JOIN households h ON h.id = p.household_id
       LEFT JOIN users assigned ON assigned.id = alert.assigned_to
       WHERE p.household_id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL
         AND alert.status <> 'resolved'
         AND alert.follow_up_completed_at IS NULL
         AND (alert.follow_up_due_date IS NULL OR alert.follow_up_due_date <= $2::date + $3::integer)
       ORDER BY alert.follow_up_due_date NULLS FIRST, alert.last_detected_at DESC`,
      [householdId, asOf, windowDays],
    ),
  ]);
  return [...passport.rows, ...alerts.rows];
}
