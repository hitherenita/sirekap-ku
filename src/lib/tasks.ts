// Berisi logika validasi tautan URL, manajemen status pekerjaan, tanggal selesai, dan pencatatan riwayat perubahan (FT-03).
import {
  TASK_STATUS_LIST,
  TaskAuditLogEntity,
  TaskStatus,
  UserEntity,
  VALIDATION_CONFIG,
  VALIDATION_MESSAGES,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {assertAdminRole} from './auth';

export interface TaskFormInput {
  title: string;
  description: string;
  employee_id: string;
  category_id: string;
  start_date: string;
  due_date: string;
  status: TaskStatus;
  status_note: string;
  documentation_url: string;
  completed_date?: string; // Opsional YYYY-MM-DD saat status Selesai
}

export interface TaskFormErrors {
  title?: string;
  employee_id?: string;
  category_id?: string;
  start_date?: string;
  due_date?: string;
  status?: string;
  documentation_url?: string;
  completed_date?: string;
  general?: string;
}

export interface TaskMutationResult {
  ok: boolean;
  statusCode: 200 | 400 | 403;
  tasks?: WorkTaskEntity[];
  auditLogs?: TaskAuditLogEntity[];
  savedTask?: WorkTaskEntity;
  errors?: TaskFormErrors;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Memvalidasi format tautan web http:// atau https:// beserta struktur domain yang sah.
 */
export function isValidHttpUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    const protocolOk = VALIDATION_CONFIG.allowedUrlProtocols.includes(
      parsed.protocol as 'http:' | 'https:',
    );
    if (!protocolOk) {
      return false;
    }
    const host = parsed.hostname.trim();
    if (!host) {
      return false;
    }
    if (host === 'localhost') {
      return true;
    }
    const labels = host.split('.');
    return labels.length >= 2 && labels.every((part) => part.length > 0);
  } catch {
    return false;
  }
}

/**
 * Menambah atau memperbarui data pekerjaan beserta pencatatan log riwayat perubahan (BL-02, BL-03, BL-05).
 */
export function upsertTask(
  tasks: WorkTaskEntity[],
  auditLogs: TaskAuditLogEntity[],
  users: UserEntity[],
  categories: WorkCategoryEntity[],
  actorUser: UserEntity | null,
  rawInput: TaskFormInput,
  editingTaskId?: string,
  nowDate: Date = new Date(),
): TaskMutationResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok || !actorUser) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  const title = rawInput.title.trim();
  const description = rawInput.description.trim();
  const employeeId = rawInput.employee_id.trim();
  const categoryId = rawInput.category_id.trim();
  const startDate = rawInput.start_date.trim();
  const dueDate = rawInput.due_date.trim();
  const status = rawInput.status;
  const statusNote = rawInput.status_note.trim();
  const documentationUrl = rawInput.documentation_url.trim();
  const completedDate = (rawInput.completed_date ?? '').trim();

  const errors: TaskFormErrors = {};

  if (!title) {
    errors.title =
      'Masukkan judul pekerjaan (contoh: Rekapitulasi Laporan Bulanan).';
  } else if (title.length > VALIDATION_CONFIG.titleMaxLength) {
    errors.title = `Judul pekerjaan maksimal ${VALIDATION_CONFIG.titleMaxLength} karakter.`;
  }

  if (!employeeId || !users.some((u) => u.id === employeeId)) {
    errors.employee_id = 'Pilih pegawai pelaksana pekerjaan.';
  }

  if (!categoryId || !categories.some((c) => c.id === categoryId)) {
    errors.category_id = 'Pilih kategori pekerjaan.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    errors.start_date = 'Pilih tanggal mulai pekerjaan.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    errors.due_date = 'Pilih tanggal tenggat pekerjaan.';
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(startDate) && dueDate < startDate) {
    errors.due_date = VALIDATION_MESSAGES.dueDateBeforeStart;
  }

  if (!TASK_STATUS_LIST.includes(status)) {
    errors.status = 'Pilih status pekerjaan yang sesuai.';
  }

  if (status === 'Selesai') {
    if (!documentationUrl) {
      errors.documentation_url = VALIDATION_MESSAGES.completedUrlRequired;
    } else if (!isValidHttpUrl(documentationUrl)) {
      errors.documentation_url = VALIDATION_MESSAGES.invalidUrl;
    }
    if (completedDate && !/^\d{4}-\d{2}-\d{2}$/.test(completedDate)) {
      errors.completed_date = 'Format tanggal selesai tidak valid.';
    }
  } else if (documentationUrl && !isValidHttpUrl(documentationUrl)) {
    errors.documentation_url = VALIDATION_MESSAGES.invalidUrl;
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      statusCode: 400,
      errors,
    };
  }

  const nowIso = nowDate.toISOString();

  if (editingTaskId) {
    const existing = tasks.find((t) => t.id === editingTaskId);
    if (!existing) {
      return {
        ok: false,
        statusCode: 400,
        errors: {general: 'Data pekerjaan yang akan diubah tidak ditemukan.'},
      };
    }

    let nextCompletedAt: string | null = null;
    if (status === 'Selesai') {
      if (completedDate) {
        if (existing.completed_at && existing.completed_at.slice(0, 10) === completedDate) {
          nextCompletedAt = existing.completed_at;
        } else {
          nextCompletedAt = `${completedDate}T12:00:00.000Z`;
        }
      } else {
        nextCompletedAt = existing.completed_at ?? nowIso;
      }
    }

    const updatedTask: WorkTaskEntity = {
      ...existing,
      title,
      description,
      employee_id: employeeId,
      category_id: categoryId,
      start_date: startDate,
      due_date: dueDate,
      status,
      status_note: statusNote,
      documentation_url: documentationUrl,
      completed_at: nextCompletedAt,
      updated_at: nowIso,
    };

    const newLogs: TaskAuditLogEntity[] = [];

    if (existing.status !== updatedTask.status) {
      newLogs.push({
        id: generateId('log'),
        task_id: updatedTask.id,
        changed_by: actorUser.id,
        action_type: 'STATUS_CHANGED',
        field_changed: 'status',
        old_value: existing.status,
        new_value: updatedTask.status,
        note: statusNote,
        created_at: nowIso,
      });
    }

    if (existing.documentation_url !== updatedTask.documentation_url) {
      newLogs.push({
        id: generateId('log'),
        task_id: updatedTask.id,
        changed_by: actorUser.id,
        action_type: 'LINK_UPDATED',
        field_changed: 'documentation_url',
        old_value: existing.documentation_url || '-',
        new_value: updatedTask.documentation_url || '-',
        note: '',
        created_at: nowIso,
      });
    }

    const detailsChanged =
      existing.title !== updatedTask.title ||
      existing.description !== updatedTask.description ||
      existing.employee_id !== updatedTask.employee_id ||
      existing.category_id !== updatedTask.category_id ||
      existing.start_date !== updatedTask.start_date ||
      existing.due_date !== updatedTask.due_date ||
      existing.status_note !== updatedTask.status_note;

    if (detailsChanged && newLogs.length === 0) {
      newLogs.push({
        id: generateId('log'),
        task_id: updatedTask.id,
        changed_by: actorUser.id,
        action_type: 'DETAILS_UPDATED',
        field_changed: 'details',
        old_value: existing.due_date,
        new_value: updatedTask.due_date,
        note: statusNote || 'Rincian pekerjaan diperbarui.',
        created_at: nowIso,
      });
    }

    return {
      ok: true,
      statusCode: 200,
      tasks: tasks.map((t) => (t.id === editingTaskId ? updatedTask : t)),
      auditLogs: [...auditLogs, ...newLogs],
      savedTask: updatedTask,
    };
  }

  const nextCompletedAt =
    status === 'Selesai'
      ? completedDate
        ? `${completedDate}T12:00:00.000Z`
        : nowIso
      : null;

  const newTask: WorkTaskEntity = {
    id: generateId('tsk'),
    title,
    description,
    employee_id: employeeId,
    category_id: categoryId,
    start_date: startDate,
    due_date: dueDate,
    status,
    status_note: statusNote,
    documentation_url: documentationUrl,
    completed_at: nextCompletedAt,
    created_by: actorUser.id,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const createdLog: TaskAuditLogEntity = {
    id: generateId('log'),
    task_id: newTask.id,
    changed_by: actorUser.id,
    action_type: 'CREATED',
    field_changed: 'status',
    old_value: '-',
    new_value: newTask.status,
    note: statusNote || 'Tugas dicatat oleh Admin.',
    created_at: nowIso,
  };

  return {
    ok: true,
    statusCode: 200,
    tasks: [newTask, ...tasks],
    auditLogs: [...auditLogs, createdLog],
    savedTask: newTask,
  };
}

/**
 * Menghapus data pekerjaan dan log terkait oleh Admin dengan penjaga RBAC.
 */
export function deleteTask(
  tasks: WorkTaskEntity[],
  auditLogs: TaskAuditLogEntity[],
  actorUser: UserEntity | null,
  taskId: string,
): TaskMutationResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  const target = tasks.find((t) => t.id === taskId);
  if (!target) {
    return {
      ok: false,
      statusCode: 400,
      errors: {general: 'Data pekerjaan tidak ditemukan.'},
    };
  }

  return {
    ok: true,
    statusCode: 200,
    tasks: tasks.filter((t) => t.id !== taskId),
    auditLogs: auditLogs.filter((log) => log.task_id !== taskId),
  };
}
