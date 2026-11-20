// Berisi fungsi agregasi statistik dashboard dan rekapitulasi laporan Opsi A sesuai aturan BL-04.
import {
  ACTIVE_OVERDUE_STATUSES,
  TaskStatus,
  UserEntity,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {getTodayIsoDate} from './format';
import {computeTaskDeadlineStatus, TaskDeadlineStatus} from './overdue';

export interface UnitSummaryStats {
  totalTasks: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  postponedCount: number;
  cancelledCount: number;
  overdueActiveCount: number;
  effectiveTarget: number;
  completionRate: number;
}

export interface EmployeeRecapRow {
  employeeId: string;
  employeeName: string;
  position: string;
  isActive: boolean;
  totalTasks: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  postponedCount: number;
  cancelledCount: number;
  overdueActiveCount: number;
  effectiveTarget: number;
  completionRate: number;
}

export interface CategoryRecapRow {
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  totalTasks: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
  overdueActiveCount: number;
  effectiveTarget: number;
  completionRate: number;
}

export interface UrgentTaskItem {
  task: WorkTaskEntity;
  deadlineStatus: TaskDeadlineStatus;
}

export interface DashboardAnalyticsResult {
  filteredTasks: WorkTaskEntity[];
  summary: UnitSummaryStats;
  byEmployee: EmployeeRecapRow[];
  byCategory: CategoryRecapRow[];
  urgentActiveTasks: UrgentTaskItem[];
}

export interface AnalyticsFilterOptions {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  categoryId?: string;
  status?: TaskStatus | '';
  currentDateIso?: string;
}

/**
 * Mengembalikan rentang tanggal awal hingga akhir bulan berjalan.
 */
export function getDefaultMonthRange(referenceDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  return {
    startDate: `${year}-${monthStr}-01`,
    endDate: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  };
}

/**
 * Menghitung tingkat penyelesaian (%) dengan mengeluarkan tugas Dibatalkan dari pembagi target efektif.
 */
export function calculateCompletionRate(
  completedCount: number,
  effectiveTarget: number,
): number {
  if (effectiveTarget <= 0) {
    return 0;
  }
  return Math.round(((completedCount / effectiveTarget) * 100) * 100) / 100;
}

/**
 * Menyaring daftar tugas berdasarkan periode tanggal tenggat (Keputusan 2A) dan filter opsional.
 */
export function filterTasksForAnalytics(
  tasks: WorkTaskEntity[],
  options: AnalyticsFilterOptions = {},
): WorkTaskEntity[] {
  const start = (options.startDate ?? '').trim();
  const end = (options.endDate ?? '').trim();
  const employeeId = (options.employeeId ?? '').trim();
  const categoryId = (options.categoryId ?? '').trim();
  const status = options.status ?? '';

  return tasks.filter((task) => {
    if (start && task.due_date < start) {
      return false;
    }
    if (end && task.due_date > end) {
      return false;
    }
    if (employeeId && task.employee_id !== employeeId) {
      return false;
    }
    if (categoryId && task.category_id !== categoryId) {
      return false;
    }
    if (status && task.status !== status) {
      return false;
    }
    return true;
  });
}

/**
 * Menghitung ringkasan eksekutif unit dari daftar tugas yang sudah difilter.
 */
export function summarizeTasks(
  tasks: WorkTaskEntity[],
  currentDateIso: string = getTodayIsoDate(),
): UnitSummaryStats {
  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let postponedCount = 0;
  let cancelledCount = 0;
  let overdueActiveCount = 0;

  for (const task of tasks) {
    if (task.status === 'Selesai') completedCount += 1;
    else if (task.status === 'Dalam Proses') inProgressCount += 1;
    else if (task.status === 'Belum Dimulai') notStartedCount += 1;
    else if (task.status === 'Ditunda') postponedCount += 1;
    else if (task.status === 'Dibatalkan') cancelledCount += 1;

    if (computeTaskDeadlineStatus(task, currentDateIso).is_overdue) {
      overdueActiveCount += 1;
    }
  }

  const totalTasks = tasks.length;
  const effectiveTarget = totalTasks - cancelledCount;

  return {
    totalTasks,
    completedCount,
    inProgressCount,
    notStartedCount,
    postponedCount,
    cancelledCount,
    overdueActiveCount,
    effectiveTarget,
    completionRate: calculateCompletionRate(completedCount, effectiveTarget),
  };
}

/**
 * Menghitung seluruh metrik dashboard dan rekapitulasi laporan Opsi A secara konsisten.
 */
export function computeUnitDashboardAnalytics(
  tasks: WorkTaskEntity[],
  users: UserEntity[],
  categories: WorkCategoryEntity[],
  options: AnalyticsFilterOptions = {},
): DashboardAnalyticsResult {
  const currentDateIso = options.currentDateIso ?? getTodayIsoDate();
  const filteredTasks = filterTasksForAnalytics(tasks, options);
  const summary = summarizeTasks(filteredTasks, currentDateIso);

  const tasksByEmployee = new Map<string, WorkTaskEntity[]>();
  for (const task of filteredTasks) {
    const list = tasksByEmployee.get(task.employee_id) ?? [];
    list.push(task);
    tasksByEmployee.set(task.employee_id, list);
  }

  const byEmployee: EmployeeRecapRow[] = users
    .filter(
      (u) =>
        (u.role === 'PEGAWAI' && u.is_active) || tasksByEmployee.has(u.id),
    )
    .map((user) => {
      const empTasks = tasksByEmployee.get(user.id) ?? [];
      const empSummary = summarizeTasks(empTasks, currentDateIso);
      return {
        employeeId: user.id,
        employeeName: user.full_name,
        position: user.position,
        isActive: user.is_active,
        ...empSummary,
      };
    })
    .sort((a, b) => b.totalTasks - a.totalTasks || a.employeeName.localeCompare(b.employeeName));

  const tasksByCategory = new Map<string, WorkTaskEntity[]>();
  for (const task of filteredTasks) {
    const list = tasksByCategory.get(task.category_id) ?? [];
    list.push(task);
    tasksByCategory.set(task.category_id, list);
  }

  const byCategory: CategoryRecapRow[] = categories
    .filter((c) => c.is_active || tasksByCategory.has(c.id))
    .map((category) => {
      const catTasks = tasksByCategory.get(category.id) ?? [];
      const catSummary = summarizeTasks(catTasks, currentDateIso);
      return {
        categoryId: category.id,
        categoryName: category.category_name,
        isActive: category.is_active,
        totalTasks: catSummary.totalTasks,
        completedCount: catSummary.completedCount,
        pendingCount:
          catSummary.inProgressCount +
          catSummary.notStartedCount +
          catSummary.postponedCount,
        cancelledCount: catSummary.cancelledCount,
        overdueActiveCount: catSummary.overdueActiveCount,
        effectiveTarget: catSummary.effectiveTarget,
        completionRate: catSummary.completionRate,
      };
    })
    .sort((a, b) => b.totalTasks - a.totalTasks || a.categoryName.localeCompare(b.categoryName));

  const urgentActiveTasks: UrgentTaskItem[] = filteredTasks
    .filter((task) => ACTIVE_OVERDUE_STATUSES.includes(task.status))
    .map((task) => ({
      task,
      deadlineStatus: computeTaskDeadlineStatus(task, currentDateIso),
    }))
    .sort((a, b) => {
      if (a.deadlineStatus.is_overdue !== b.deadlineStatus.is_overdue) {
        return a.deadlineStatus.is_overdue ? -1 : 1;
      }
      if (a.deadlineStatus.overdue_days !== b.deadlineStatus.overdue_days) {
        return b.deadlineStatus.overdue_days - a.deadlineStatus.overdue_days;
      }
      return a.task.due_date.localeCompare(b.task.due_date);
    });

  return {
    filteredTasks,
    summary,
    byEmployee,
    byCategory,
    urgentActiveTasks,
  };
}
