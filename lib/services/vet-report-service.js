import { bangkokDate, validDate } from '../calendar.js';
import { pool } from '../db.js';
import { shiftDate } from '../wellness-baseline.js';
import { ServiceError } from './service-errors.js';

const DAY_MS = 86_400_000;
const dateOnly = value => value == null ? null : (typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10));

function reportRange(fromValue, toValue) {
  const today = bangkokDate();
  const to = toValue || today;
  const from = fromValue || shiftDate(to, -29);
  if (!validDate(from) || !validDate(to) || from > to || to > today) {
    throw new ServiceError('INVALID_REPORT_RANGE', 'ช่วงวันที่รายงานไม่ถูกต้อง', 400, { range: 'เลือกวันที่ย้อนหลังที่ถูกต้อง' });
  }
  const days = Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
  if (days > 366) throw new ServiceError('INVALID_REPORT_RANGE', 'รายงานเลือกช่วงได้ไม่เกิน 366 วัน', 400, { range: 'ลดช่วงวันที่ให้ไม่เกิน 366 วัน' });
  return { from, to, days };
}

export async function getVetReport({ petId, actorId, from, to }) {
  const range = reportRange(from, to);
  const petResult = await pool.query(
    `SELECT p.*, h.name AS household_name, u.name AS generated_by_name
     FROM pets p JOIN households h ON h.id = p.household_id
     JOIN household_members hm ON hm.household_id = p.household_id AND hm.user_id = $2
     JOIN users u ON u.id = $2
     WHERE p.id = $1 AND h.archived_at IS NULL AND p.archived_at IS NULL`,
    [petId, actorId],
  );
  if (!petResult.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์สร้างรายงานของสัตว์เลี้ยงนี้', 403);
  const [passport, health, wellness, alerts, taskEvents, careEvents] = await Promise.all([
    pool.query(`SELECT entry_type, title, details, numeric_value, unit, start_date, end_date, next_due_date
      FROM pet_passport_entries WHERE pet_id = $1 AND archived_at IS NULL ORDER BY entry_type, title`, [petId]),
    pool.query(`SELECT record_type, title, recorded_at, details, numeric_value, unit
      FROM pet_health_records WHERE pet_id = $1 AND archived_at IS NULL
        AND (recorded_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $2 AND $3
      ORDER BY recorded_at DESC`, [petId, range.from, range.to]),
    pool.query(`SELECT id, recorded_at, food_intake, water_intake, activity_level, sleep_amount,
        stool_condition, mood, weight_kg, notes
      FROM pet_wellness_logs WHERE pet_id = $1 AND archived_at IS NULL
        AND (recorded_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $2 AND $3
      ORDER BY recorded_at DESC, id DESC`, [petId, range.from, range.to]),
    pool.query(`SELECT alert.metric, alert.direction, alert.status, alert.observation_start, alert.observation_end,
        alert.baseline_value, alert.observed_value, alert.evidence, alert.resolution_reason,
        alert.follow_up_due_date, alert.follow_up_note, assigned.name AS assigned_to_name
      FROM wellness_alerts alert LEFT JOIN users assigned ON assigned.id = alert.assigned_to
      WHERE alert.pet_id = $1 AND alert.observation_end >= $2 AND alert.observation_start <= $3
      ORDER BY alert.observation_end DESC`, [petId, range.from, range.to]),
    pool.query(`SELECT ct.completed_at AS event_at, r.title,
        CASE WHEN ct.status = 'completed' THEN 'ทำเสร็จ' ELSE 'ข้าม' END AS event_type,
        ct.notes, u.name AS actor_name
      FROM care_tasks ct JOIN routines r ON r.id = ct.routine_id
      LEFT JOIN users u ON u.id = ct.completed_by
      WHERE r.pet_id = $1 AND ct.status IN ('completed', 'skipped')
        AND (ct.completed_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $2 AND $3`, [petId, range.from, range.to]),
    pool.query(`SELECT ce.occurred_at AS event_at, ce.title, 'ดูแลนอกตาราง'::text AS event_type,
        ce.notes, u.name AS actor_name
      FROM care_entries ce JOIN users u ON u.id = ce.created_by
      WHERE ce.pet_id = $1 AND ce.archived_at IS NULL
        AND (ce.occurred_at AT TIME ZONE 'Asia/Bangkok')::date BETWEEN $2 AND $3`, [petId, range.from, range.to]),
  ]);
  const pet = petResult.rows[0];
  return {
    report: {
      generated_at: new Date().toISOString(),
      generated_by_name: pet.generated_by_name,
      timezone: 'Asia/Bangkok',
      range,
      pet: {
        id: pet.id, name: pet.name, species: pet.species, birth_date: dateOnly(pet.birth_date), breed: pet.breed,
        sex: pet.sex, neuter_status: pet.neuter_status,
        baseline_weight_kg: pet.baseline_weight_kg == null ? null : Number(pet.baseline_weight_kg),
        baseline_weight_recorded_on: dateOnly(pet.baseline_weight_recorded_on), notes: pet.notes,
        vet_contact: pet.vet_contact, household_name: pet.household_name,
      },
      passport: passport.rows.map(item => ({ ...item, numeric_value: item.numeric_value == null ? null : Number(item.numeric_value), start_date: dateOnly(item.start_date), end_date: dateOnly(item.end_date), next_due_date: dateOnly(item.next_due_date) })),
      health_records: health.rows.map(item => ({ ...item, numeric_value: item.numeric_value == null ? null : Number(item.numeric_value) })),
      wellness_logs: wellness.rows.map(item => ({ ...item, weight_kg: item.weight_kg == null ? null : Number(item.weight_kg) })),
      alerts: alerts.rows.map(item => ({ ...item, observation_start: dateOnly(item.observation_start), observation_end: dateOnly(item.observation_end), follow_up_due_date: dateOnly(item.follow_up_due_date) })),
      timeline: [...taskEvents.rows, ...careEvents.rows].sort((a, b) => new Date(b.event_at) - new Date(a.event_at)),
    },
  };
}
