import crypto from 'node:crypto';
import { pool } from '../db.js';
import { withTransaction } from './transaction.js';
import { requireOwner } from './access-service.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';

export async function manageMembers({ householdId, actorId, action, targetId }) {
  if (action !== 'rotate-invite' && (typeof targetId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId))) throw new ServiceError('INVALID_MEMBER', 'กรุณาเลือกสมาชิกในบ้าน', 400);
  return withTransaction(async client => {
    // Serialize ownership changes and join operations against this household.
    await client.query('SELECT id FROM households WHERE id=$1 FOR UPDATE', [householdId]);
    await requireOwner(client, householdId, actorId);
    if (action === 'rotate-invite') {
      const result = await client.query("UPDATE households SET invite_code=$2, invite_expires_at=NOW()+INTERVAL '7 days' WHERE id=$1 RETURNING invite_code, invite_expires_at", [householdId, crypto.randomBytes(6).toString('hex').toUpperCase()]);
      await writeActivity(client, { householdId, actorId, action: 'rotate_invite', entityType: 'household', entityId: householdId });
      return result.rows[0];
    }
    const target = await client.query('SELECT * FROM household_members WHERE household_id=$1 AND user_id=$2 FOR UPDATE', [householdId, targetId]);
    if (!target.rowCount || targetId === actorId || target.rows[0].role === 'owner') throw new ServiceError('INVALID_MEMBER', 'กรุณาเลือกสมาชิกคนอื่นในบ้าน', 400);
    if (action === 'remove-member') {
      await client.query('UPDATE routines SET assigned_user_id=NULL WHERE assigned_user_id=$2 AND pet_id IN (SELECT id FROM pets WHERE household_id=$1)', [householdId, targetId]);
      await client.query('UPDATE care_tasks SET assigned_user_id=NULL, mutation_version=mutation_version+1 WHERE assigned_user_id=$2 AND routine_id IN (SELECT r.id FROM routines r JOIN pets p ON p.id=r.pet_id WHERE p.household_id=$1)', [householdId, targetId]);
      await client.query('UPDATE wellness_alerts SET assigned_to=NULL WHERE assigned_to=$2 AND pet_id IN (SELECT id FROM pets WHERE household_id=$1)', [householdId, targetId]);
      await client.query('DELETE FROM household_members WHERE household_id=$1 AND user_id=$2', [householdId, targetId]);
    } else if (action === 'transfer-owner') {
      await client.query("UPDATE household_members SET role=CASE WHEN user_id=$2 THEN 'owner' ELSE 'member' END WHERE household_id=$1 AND user_id IN ($2,$3)", [householdId, targetId, actorId]);
      await client.query("UPDATE households SET owner_id=$2, invite_code=$3, invite_expires_at=NOW()+INTERVAL '7 days' WHERE id=$1", [householdId, targetId, crypto.randomBytes(6).toString('hex').toUpperCase()]);
    } else throw new ServiceError('INVALID_ACTION', 'ไม่รองรับการทำรายการนี้', 400);
    await writeActivity(client, { householdId, actorId, action, entityType: 'household_member', entityId: targetId, beforeData: target.rows[0], afterData: { household_id: householdId, user_id: targetId, role: action === 'transfer-owner' ? 'owner' : null } });
    return { success: true };
  });
}

const archivedTypes = {
  pet: ['pets', 'name', 'id'], routine: ['routines', 'title', 'pet_id'],
  care_entry: ['care_entries', 'title', 'pet_id'], health_record: ['pet_health_records', 'title', 'pet_id'],
  passport_entry: ['pet_passport_entries', 'title', 'pet_id'], wellness_log: ['pet_wellness_logs', "'เช็กอินสุขภาพ'", 'pet_id'],
};
export async function listArchived({ householdId, actorId }) {
  await requireOwner(pool, householdId, actorId);
  const items = [];
  for (const [type, [table, title, petKey]] of Object.entries(archivedTypes)) {
    const result = await pool.query(`SELECT e.id, ${title === "'เช็กอินสุขภาพ'" ? title : `e.${title}`} AS title, e.archived_at, p.name AS pet_name FROM ${table} e JOIN pets p ON p.id=e.${petKey} WHERE p.household_id=$1 AND e.archived_at IS NOT NULL ORDER BY e.archived_at DESC LIMIT 200`, [householdId]);
    items.push(...result.rows.map(item => ({ ...item, type })));
  }
  return { items: items.sort((a,b) => new Date(b.archived_at)-new Date(a.archived_at)) };
}
export async function restoreArchived({ householdId, actorId, type, id }) {
  const config = archivedTypes[type];
  if (!config || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new ServiceError('INVALID_TYPE', 'ประเภทหรือรหัสข้อมูลไม่ถูกต้อง', 400);
  return withTransaction(async client => {
    await requireOwner(client, householdId, actorId);
    const [table,, petKey] = config;
    const result = await client.query(`SELECT e.*, p.archived_at AS parent_archived_at FROM ${table} e JOIN pets p ON p.id=e.${petKey} WHERE e.id=$1 AND p.household_id=$2 FOR UPDATE OF e`, [id, householdId]);
    const row=result.rows[0];
    if (!row || !row.archived_at) throw new ServiceError('NOT_FOUND', 'ไม่พบข้อมูลที่เก็บไว้', 404);
    if (type !== 'pet' && row.parent_archived_at) throw new ServiceError('PARENT_ARCHIVED', 'กรุณากู้คืนสัตว์เลี้ยงก่อน', 409);
    const restored=await client.query(`UPDATE ${table} SET archived_at=NULL WHERE id=$1 RETURNING *`, [id]);
    await writeActivity(client, { householdId, actorId, action:'restore', entityType:type, entityId:id, beforeData:row, afterData:restored.rows[0] });
    return { item:restored.rows[0] };
  });
}
