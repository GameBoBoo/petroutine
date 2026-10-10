import { pool } from '../db.js';
import { writeActivity } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

async function ownedHousehold(client, householdId, actorId, lock = false) {
  const result = await client.query(
    `SELECT id, name, owner_id, invite_code, created_at, archived_at, archived_by
     FROM households
     WHERE id = $1 AND owner_id = $2
     ${lock ? 'FOR UPDATE' : ''}`,
    [householdId, actorId],
  );
  if (!result.rowCount) {
    throw new ServiceError('FORBIDDEN', 'เฉพาะเจ้าของบ้านเท่านั้นที่จัดการถังขยะได้', 403);
  }
  return result.rows[0];
}

export async function listTrashedHouseholds({ actorId }) {
  const result = await pool.query(
    `SELECT id, name, owner_id, created_at, archived_at
     FROM households
     WHERE owner_id = $1 AND archived_at IS NOT NULL
     ORDER BY archived_at DESC, id DESC`,
    [actorId],
  );
  return { households: result.rows };
}

export async function archiveHousehold({ householdId, actorId }) {
  return withTransaction(async client => {
    const previous = await ownedHousehold(client, householdId, actorId, true);
    if (previous.archived_at) {
      throw new ServiceError('HOUSEHOLD_ALREADY_ARCHIVED', 'บ้านนี้อยู่ในถังขยะแล้ว', 409);
    }
    const result = await client.query(
      `UPDATE households SET archived_at = NOW(), archived_by = $1
       WHERE id = $2 RETURNING id, name, owner_id, created_at, archived_at, archived_by`,
      [actorId, householdId],
    );
    await writeActivity(client, {
      householdId,
      actorId,
      action: 'archive',
      entityType: 'household',
      entityId: householdId,
      beforeData: previous,
      afterData: result.rows[0],
    });
    return { household: result.rows[0] };
  });
}

export async function restoreHousehold({ householdId, actorId }) {
  return withTransaction(async client => {
    const previous = await ownedHousehold(client, householdId, actorId, true);
    if (!previous.archived_at) {
      throw new ServiceError('HOUSEHOLD_NOT_ARCHIVED', 'บ้านนี้ไม่ได้อยู่ในถังขยะ', 409);
    }
    const result = await client.query(
      `UPDATE households SET archived_at = NULL, archived_by = NULL
       WHERE id = $1 RETURNING id, name, owner_id, created_at, archived_at, archived_by`,
      [householdId],
    );
    await writeActivity(client, {
      householdId,
      actorId,
      action: 'restore',
      entityType: 'household',
      entityId: householdId,
      beforeData: previous,
      afterData: result.rows[0],
    });
    return { household: result.rows[0] };
  });
}
