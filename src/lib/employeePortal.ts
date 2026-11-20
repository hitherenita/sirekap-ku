// Berisi logika pengelompokan, pengurutan, dan penyaringan tugas pribadi Pegawai (FT-05).
import {ACTIVE_OVERDUE_STATUSES, TaskStatus, WorkTaskEntity} from '../config';
import {getTodayIsoDate} from './format';
import {computeTaskDeadlineStatus} from './overdue';

export type EmployeePortalTab = 'active' | 'history';

export interface EmployeePortalSummary {
  activeCount: number;
  overdueCount: number;
  completedCount: number;
}

export interface EmployeePortalData {
  activeTasks: WorkTaskEntity[];
  historyTasks: WorkTaskEntity[];
  summary: EmployeePortalSummary;
}

/**
 * Mengelompokkan tugas milik satu pegawai ke dalam Tugas Aktif dan Riwayat Selesai beserta ringkasan angkanya.
 */
export function splitEmployeeTasks(
  tasks: WorkTaskEntity[],
  employeeId: string,
  currentDateIso: string = getTodayIsoDate(),
): EmployeePortalData {
  const ownTasks = tasks.filter((task) => task.employee_id === employeeId);

  const activeTasks = ownTasks
    .filter((task) => ACTIVE_OVERDUE_STATUSES.includes(task.status))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const historyTasks = ownTasks
    .filter((task) => !ACTIVE_OVERDUE_STATUSES.includes(task.status))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const overdueCount = activeTasks.reduce((count, task) => {
    const deadline = computeTaskDeadlineStatus(task, currentDateIso);
    return deadline.is_overdue ? count + 1 : count;
  }, 0);

  const completedCount = ownTasks.filter((t) => t.status === 'Selesai').length;

  return {
    activeTasks,
    historyTasks,
    summary: {
      activeCount: activeTasks.length,
      overdueCount,
      completedCount,
    },
  };
}

/**
 * Menyaring daftar tugas pada tab aktif berdasarkan filter status tertentu.
 */
export function filterEmployeeTabTasks(
  tabTasks: WorkTaskEntity[],
  statusFilter: 'SEMUA' | TaskStatus,
): WorkTaskEntity[] {
  if (statusFilter === 'SEMUA') {
    return tabTasks;
  }
  return tabTasks.filter((task) => task.status === statusFilter);
}
