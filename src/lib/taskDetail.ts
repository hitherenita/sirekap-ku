// Berisi logika pengambilan detail pekerjaan dan lini masa riwayat perubahan sesuai otorisasi peran (FT-08).
import {
  AuditActionType,
  TaskAuditLogEntity,
  UserEntity,
  VALIDATION_MESSAGES,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {getTodayIsoDate} from './format';
import {computeTaskDeadlineStatus, TaskDeadlineStatus} from './overdue';

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  CREATED: 'Pekerjaan dicatat',
  STATUS_CHANGED: 'Perubahan status',
  LINK_UPDATED: 'Tautan dokumentasi diperbarui',
  DETAILS_UPDATED: 'Rincian pekerjaan diperbarui',
};

export interface TimelineEntry {
  id: string;
  actionLabel: string;
  oldValue: string;
  newValue: string;
  note: string;
  changedByName: string;
  createdAt: string;
}

export interface TaskDetailPayload {
  task: WorkTaskEntity;
  employeeName: string;
  employeePosition: string;
  categoryName: string;
  createdByName: string;
  deadlineStatus: TaskDeadlineStatus;
  timeline: TimelineEntry[];
}

export interface TaskDetailResult {
  ok: boolean;
  statusCode: 200 | 403 | 404;
  detail?: TaskDetailPayload;
  error?: string;
}

/**
 * Mengambil rincian lengkap tugas dan lini masa perubahan terbaru ke terlama dengan validasi hak baca BL-01.
 */
export function getTaskDetailWithTimeline(
  tasks: WorkTaskEntity[],
  auditLogs: TaskAuditLogEntity[],
  users: UserEntity[],
  categories: WorkCategoryEntity[],
  actorUser: UserEntity | null,
  taskId: string,
  currentDateIso: string = getTodayIsoDate(),
): TaskDetailResult {
  if (!actorUser || !actorUser.is_active) {
    return {
      ok: false,
      statusCode: 403,
      error: VALIDATION_MESSAGES.forbiddenAction,
    };
  }

  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    return {
      ok: false,
      statusCode: 404,
      error: 'Data pekerjaan tidak ditemukan.',
    };
  }

  if (actorUser.role === 'PEGAWAI' && task.employee_id !== actorUser.id) {
    return {
      ok: false,
      statusCode: 403,
      error: VALIDATION_MESSAGES.forbiddenAction,
    };
  }

  const userMap = new Map(users.map((u) => [u.id, u]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.category_name]));

  const employee = userMap.get(task.employee_id);
  const creator = userMap.get(task.created_by);

  const timeline: TimelineEntry[] = auditLogs
    .filter((log) => log.task_id === task.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((log) => ({
      id: log.id,
      actionLabel: AUDIT_ACTION_LABELS[log.action_type] ?? log.action_type,
      oldValue: log.old_value,
      newValue: log.new_value,
      note: log.note,
      changedByName: userMap.get(log.changed_by)?.full_name ?? 'Admin Unit',
      createdAt: log.created_at,
    }));

  return {
    ok: true,
    statusCode: 200,
    detail: {
      task,
      employeeName: employee?.full_name ?? '-',
      employeePosition: employee?.position ?? '-',
      categoryName: categoryMap.get(task.category_id) ?? '-',
      createdByName: creator?.full_name ?? 'Admin Unit',
      deadlineStatus: computeTaskDeadlineStatus(task, currentDateIso),
      timeline,
    },
  };
}
