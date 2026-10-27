import { bangkokDate, validDate } from '../calendar.js';
import { pool } from '../db.js';
import { baselineWindow, computeWellnessBaseline, shiftDate } from '../wellness-baseline.js';
import { ServiceError } from './service-errors.js';

async function requirePetAccess(petId, actorId) {
  const result = await pool.query(
    `SELECT p.id FROM pets p
     JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id
     WHERE p.id = $1 AND hm.user_id = $2
       AND h.archived_at IS NULL AND p.archived_at IS NULL
     FOR SHARE OF h`,
    [petId, actorId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง Baseline ของสัตว์เลี้ยงนี้', 403);
}

function baselineDate(value) {
  const date = value || bangkokDate();
  if (!validDate(date)) {
    throw new ServiceError('INVALID_FILTER', 'วันที่คำนวณ Baseline ไม่ถูกต้อง', 400, { as_of: 'ใช้รูปแบบ YYYY-MM-DD' });
  }
  if (date > bangkokDate()) {
    throw new ServiceError('INVALID_FILTER', 'ยังคำนวณ Baseline สำหรับวันในอนาคตไม่ได้', 400, { as_of: 'เลือกวันนี้หรือวันที่ย้อนหลัง' });
  }
  return date;
}

export async function getWellnessBaseline({ petId, actorId, asOf }) {
  await requirePetAccess(petId, actorId);
  const date = baselineDate(asOf);
  const window = baselineWindow(date);
  const endExclusive = shiftDate(date, 1);
  const result = await pool.query(
    `SELECT id, recorded_at, food_intake, water_intake, activity_level, sleep_amount,
            stool_condition, mood, weight_kg
     FROM pet_wellness_logs
     WHERE pet_id = $1 AND archived_at IS NULL
       AND recorded_at >= $2::date::timestamp AT TIME ZONE 'Asia/Bangkok'
       AND recorded_at < $3::date::timestamp AT TIME ZONE 'Asia/Bangkok'
     ORDER BY recorded_at, id`,
    [petId, window.from, endExclusive],
  );
  return { baseline: computeWellnessBaseline(result.rows, { asOf: date }) };
}
