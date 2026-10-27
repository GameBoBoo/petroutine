import { bangkokDate, validDate } from '../calendar.js';
import { pool } from '../db.js';
import { DASHBOARD_RANGES, computeWellnessDashboard } from '../wellness-dashboard.js';
import { shiftDate } from '../wellness-baseline.js';
import { ServiceError } from './service-errors.js';

function dashboardRange(value) {
  const range = value == null || value === '' ? 14 : Number(value);
  if (!DASHBOARD_RANGES.includes(range)) {
    throw new ServiceError('INVALID_RANGE', 'ช่วงแนวโน้มไม่ถูกต้อง', 400, { range: 'เลือก 7, 14, 30 หรือ 90 วัน' });
  }
  return range;
}

function dashboardDate(value) {
  const date = value || bangkokDate();
  if (!validDate(date)) throw new ServiceError('INVALID_FILTER', 'วันที่ Dashboard ไม่ถูกต้อง', 400, { as_of: 'ใช้รูปแบบ YYYY-MM-DD' });
  if (date > bangkokDate()) throw new ServiceError('INVALID_FILTER', 'ยังดู Dashboard สำหรับวันในอนาคตไม่ได้', 400, { as_of: 'เลือกวันนี้หรือวันที่ย้อนหลัง' });
  return date;
}

export async function getWellnessDashboard({ petId, actorId, range, asOf }) {
  const access = await pool.query(
    `SELECT p.id FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL AND p.archived_at IS NULL
     FOR SHARE OF h`,
    [petId, actorId],
  );
  if (!access.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Wellness Dashboard ของสัตว์เลี้ยงนี้', 403);
  const rangeDays = dashboardRange(range);
  const date = dashboardDate(asOf);
  const from = shiftDate(date, -(Math.max(rangeDays, 14) - 1));
  const endExclusive = shiftDate(date, 1);
  const [logs, alerts] = await Promise.all([
    pool.query(
      `SELECT id, recorded_at, food_intake, water_intake, activity_level, sleep_amount,
              stool_condition, mood, weight_kg
       FROM pet_wellness_logs
       WHERE pet_id = $1 AND archived_at IS NULL
         AND recorded_at >= $2::date::timestamp AT TIME ZONE 'Asia/Bangkok'
         AND recorded_at < $3::date::timestamp AT TIME ZONE 'Asia/Bangkok'
       ORDER BY recorded_at, id`,
      [petId, from, endExclusive],
    ),
    pool.query(
      `SELECT id, metric, rule_code, direction, status, observation_start, observation_end, evidence
       FROM wellness_alerts WHERE pet_id = $1 AND status <> 'resolved'
       ORDER BY observation_end DESC, created_at DESC`,
      [petId],
    ),
  ]);
  return { dashboard: computeWellnessDashboard(logs.rows, alerts.rows, { asOf: date, rangeDays }) };
}
