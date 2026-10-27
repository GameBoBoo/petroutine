import { pool } from '../db.js';
import { bangkokDate } from '../calendar.js';
import { writeActivity, runIdempotentMutation } from './activity-service.js';
import { ServiceError } from './service-errors.js';
import { withTransaction } from './transaction.js';

const TASK_ACTIONS = new Set(['complete', 'skip', 'reschedule', 'reassign', 'reopen']);
const REVERSIBLE_ACTIONS = new Set(['complete', 'skip', 'reschedule', 'reassign']);

function cleanOptionalText(value, max, field) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > max) {
    throw new ServiceError('INVALID_INPUT', 'ข้อมูลไม่ถูกต้อง', 400, { [field]: `ต้องเป็นข้อความไม่เกิน ${max} ตัวอักษร` });
  }
  return value.trim() || null;
}

async function findTask(client, taskId, lock = false) {
  const result = await client.query(
    `SELECT ct.*, r.pet_id, p.household_id
     FROM care_tasks ct
     JOIN routines r ON r.id = ct.routine_id
     JOIN pets p ON p.id = r.pet_id
     WHERE ct.id = $1
     ${lock ? 'FOR UPDATE OF ct' : ''}`,
    [taskId],
  );
  if (!result.rowCount) throw new ServiceError('TASK_NOT_FOUND', 'ไม่พบงานนี้', 404);
  return result.rows[0];
}

async function requireMembership(client, householdId, userId) {
  const result = await client.query(
    `SELECT hm.role FROM household_members hm JOIN households h ON h.id = hm.household_id
     WHERE hm.household_id = $1 AND hm.user_id = $2 AND h.archived_at IS NULL
     FOR SHARE OF h`,
    [householdId, userId],
  );
  if (!result.rowCount) throw new ServiceError('FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึงงานนี้', 403);
  return result.rows[0].role;
}

async function validAssignee(client, householdId, assigneeId) {
  if (assigneeId == null) return true;
  const result = await client.query(
    'SELECT 1 FROM household_members WHERE household_id = $1 AND user_id = $2',
    [householdId, assigneeId],
  );
  return Boolean(result.rowCount);
}

function ensureExpectedVersion(task, expectedVersion) {
  if (!Number.isInteger(expectedVersion) || task.mutation_version !== expectedVersion) {
    throw new ServiceError('STALE_TASK', 'งานนี้มีการเปลี่ยนแปลงแล้ว กรุณาโหลดข้อมูลล่าสุด', 409);
  }
}

function ensurePending(task) {
  if (task.status !== 'pending') {
    throw new ServiceError('TASK_NOT_PENDING', 'งานนี้ไม่อยู่ในสถานะที่ดำเนินการได้', 409);
  }
}

export async function mutateTask({ taskId, actorId, expectedVersion, action, payload = {}, requestKey }) {
  if (!TASK_ACTIONS.has(action)) throw new ServiceError('INVALID_ACTION', 'การกระทำไม่ถูกต้อง', 400);
  return runIdempotentMutation({
    userId: actorId,
    operation: `task:${taskId}:${action}`,
    requestKey,
    requestData: { expectedVersion, action, payload },
    execute: async client => {
      const task = await findTask(client, taskId, true);
      await requireMembership(client, task.household_id, actorId);
      ensureExpectedVersion(task, expectedVersion);
      if (action === 'reopen') {
        const role = await requireMembership(client, task.household_id, actorId);
        if (task.status === 'pending' || (role !== 'owner' && task.completed_by !== actorId)) throw new ServiceError('FORBIDDEN', 'เปิดงานใหม่ได้เฉพาะผู้บันทึกหรือเจ้าของบ้าน', 403);
        if (!cleanOptionalText(payload.reason,500,'reason')) throw new ServiceError('INVALID_INPUT','กรุณาระบุเหตุผลที่แก้ไข',400);
      } else ensurePending(task);

      const next = {
        scheduled_at: task.scheduled_at,
        status: task.status,
        completed_by: task.completed_by,
        completed_at: task.completed_at,
        notes: task.notes,
        assigned_user_id: task.assigned_user_id,
        mutation_reason: task.mutation_reason,
        skip_reason: task.skip_reason,
      };

      if (action === 'reopen') {
        next.status='pending'; next.completed_by=null; next.completed_at=null; next.skip_reason=null;
        next.mutation_reason=cleanOptionalText(payload.reason,500,'reason');
      } else if (action === 'complete' || action === 'skip') {
        if (bangkokDate(new Date(task.scheduled_at)) !== bangkokDate()) {
          throw new ServiceError('TASK_NOT_ACTIONABLE_TODAY', 'ทำรายการได้เฉพาะงานของวันนี้', 409);
        }
        next.status = action === 'complete' ? 'completed' : 'skipped';
        next.completed_by = actorId;
        next.completed_at = new Date();
        next.notes = cleanOptionalText(payload.notes, 1000, 'notes');
        next.skip_reason = action === 'skip'
          ? cleanOptionalText(payload.skip_reason, 160, 'skip_reason')
          : null;
        if (action === 'skip' && !next.skip_reason) {
          throw new ServiceError('INVALID_INPUT', 'กรุณาระบุเหตุผลที่ข้ามงาน', 400, { skip_reason: 'กรุณาเลือกหรือระบุเหตุผล' });
        }
      } else if (action === 'reschedule') {
        const value = new Date(payload.scheduled_at);
        if (typeof payload.scheduled_at !== 'string' || !Number.isFinite(value.getTime())) {
          throw new ServiceError('INVALID_INPUT', 'เวลาใหม่ไม่ถูกต้อง', 400, { scheduled_at: 'กรุณาระบุวันที่และเวลาใหม่' });
        }
        next.scheduled_at = value;
        next.mutation_reason = cleanOptionalText(payload.reason, 500, 'reason');
      } else if (action === 'reassign') {
        const assigneeId = payload.assigned_user_id || null;
        if (!(await validAssignee(client, task.household_id, assigneeId))) {
          throw new ServiceError('INVALID_ASSIGNEE', 'ผู้รับผิดชอบต้องอยู่ในบ้านเดียวกัน', 400);
        }
        next.assigned_user_id = assigneeId;
      }

      const updated = await client.query(
        `UPDATE care_tasks
         SET scheduled_at = $1, status = $2, completed_by = $3, completed_at = $4,
             notes = $5, assigned_user_id = $6, mutation_reason = $7, skip_reason = $8,
             mutation_version = mutation_version + 1
         WHERE id = $9
         RETURNING *`,
        [
          next.scheduled_at, next.status, next.completed_by, next.completed_at,
          next.notes, next.assigned_user_id, next.mutation_reason, next.skip_reason, taskId,
        ],
      );
      const reversibleUntil = new Date(Date.now() + 8_000);
      const activity = await writeActivity(client, {
        householdId: task.household_id,
        actorId,
        action,
        entityType: 'care_task',
        entityId: taskId,
        beforeData: task,
        afterData: updated.rows[0],
        entityVersion: updated.rows[0].mutation_version,
        reversibleUntil,
      });
      return {
        task: updated.rows[0],
        activity: { id: activity.id, reversible_until: activity.reversible_until },
      };
    },
  });
}

export async function undoActivity({ activityId, actorId }) {
  return withTransaction(async client => {
    const activityResult = await client.query(
      'SELECT * FROM activity_logs WHERE id = $1 FOR UPDATE',
      [activityId],
    );
    if (!activityResult.rowCount) throw new ServiceError('ACTIVITY_NOT_FOUND', 'ไม่พบรายการที่ต้องการย้อนกลับ', 404);
    const activity = activityResult.rows[0];
    if (activity.actor_user_id !== actorId) throw new ServiceError('FORBIDDEN', 'ย้อนกลับได้เฉพาะการกระทำของคุณ', 403);
    if (activity.household_id) await requireMembership(client, activity.household_id, actorId);
    if (!REVERSIBLE_ACTIONS.has(activity.action) || activity.reversed_activity_id) {
      throw new ServiceError('UNDO_UNAVAILABLE', 'รายการนี้ย้อนกลับไม่ได้หรือถูกย้อนกลับแล้ว', 409);
    }
    if (!activity.reversible_until || new Date(activity.reversible_until) < new Date()) {
      throw new ServiceError('UNDO_EXPIRED', 'หมดเวลาสำหรับย้อนกลับรายการนี้แล้ว', 409);
    }
    if (activity.entity_type !== 'care_task') throw new ServiceError('UNDO_UNAVAILABLE', 'รายการนี้ยังไม่รองรับการย้อนกลับ', 409);

    const task = await findTask(client, activity.entity_id, true);
    if (task.mutation_version !== activity.entity_version) {
      throw new ServiceError('UNDO_CONFLICT', 'งานนี้ถูกแก้ไขต่อแล้ว จึงย้อนกลับรายการเดิมไม่ได้', 409);
    }
    const previous = activity.before_data;
    const restored = await client.query(
      `UPDATE care_tasks
       SET scheduled_at = $1, status = $2, completed_by = $3, completed_at = $4,
           notes = $5, assigned_user_id = $6, mutation_reason = $7, skip_reason = $8,
           mutation_version = mutation_version + 1
       WHERE id = $9
       RETURNING *`,
      [
        previous.scheduled_at, previous.status, previous.completed_by ?? null,
        previous.completed_at ?? null, previous.notes ?? null, previous.assigned_user_id ?? null,
        previous.mutation_reason ?? null, previous.skip_reason ?? null, task.id,
      ],
    );
    const undo = await writeActivity(client, {
      householdId: task.household_id,
      actorId,
      action: 'undo',
      entityType: 'care_task',
      entityId: task.id,
      beforeData: task,
      afterData: restored.rows[0],
      entityVersion: restored.rows[0].mutation_version,
      metadata: { reversed_activity_id: activity.id, reversed_action: activity.action },
    });
    await client.query('UPDATE activity_logs SET reversed_activity_id = $1 WHERE id = $2', [undo.id, activity.id]);
    return { task: restored.rows[0], activity: undo };
  }, pool);
}
