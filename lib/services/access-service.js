import { ServiceError } from './service-errors.js';

export async function requireMember(client, householdId, userId) {
  const result = await client.query(
    `SELECT hm.role FROM household_members hm
     JOIN households h ON h.id = hm.household_id
     WHERE hm.household_id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL
     FOR SHARE OF h`,
    [householdId, userId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงข้อมูลบ้านนี้', 403);
  return result.rows[0].role;
}

export async function requireOwner(client, householdId, userId) {
  const role = await requireMember(client, householdId, userId);
  if (role !== 'owner') throw new ServiceError('FORBIDDEN', 'เฉพาะเจ้าของบ้านที่ทำรายการนี้ได้', 403);
  return role;
}
