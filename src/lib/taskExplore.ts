// Berisi logika pencarian kata kunci dan multi-filter eksplorasi daftar pekerjaan unit kerja (FT-07).
import {TaskStatus, UserEntity, WorkTaskEntity} from '../config';
import {getTodayIsoDate} from './format';
import {computeTaskDeadlineStatus} from './overdue';

export type OverdueFilterOption = 'SEMUA' | 'TERLAMBAT' | 'TIDAK_TERLAMBAT';

export interface TaskExploreFilter {
  keyword: string;
  startDate: string;
  endDate: string;
  employeeId: string;
  categoryId: string;
  status: '' | TaskStatus;
  overdueFilter: OverdueFilterOption;
}

export const DEFAULT_EXPLORE_FILTER: TaskExploreFilter = {
  keyword: '',
  startDate: '',
  endDate: '',
  employeeId: '',
  categoryId: '',
  status: '',
  overdueFilter: 'SEMUA',
};

/**
 * Menghitung jumlah filter tambahan yang sedang aktif (di luar kotak pencarian kata kunci).
 */
export function countActiveAdvancedFilters(filter: TaskExploreFilter): number {
  let count = 0;
  if (filter.startDate) count += 1;
  if (filter.endDate) count += 1;
  if (filter.employeeId) count += 1;
  if (filter.categoryId) count += 1;
  if (filter.status) count += 1;
  if (filter.overdueFilter !== 'SEMUA') count += 1;
  return count;
}

/**
 * Menyaring dan mengurutkan daftar pekerjaan berdasarkan kata kunci dan seluruh kriteria filter aktif.
 */
export function exploreUnitTasks(
  tasks: WorkTaskEntity[],
  users: UserEntity[],
  filter: TaskExploreFilter,
  currentDateIso: string = getTodayIsoDate(),
): WorkTaskEntity[] {
  const keyword = filter.keyword.trim().toLowerCase();
  const userNameMap = new Map(
    users.map((u) => [u.id, u.full_name.toLowerCase()]),
  );

  const filtered = tasks.filter((task) => {
    if (keyword) {
      const empName = userNameMap.get(task.employee_id) ?? '';
      const haystack = `${task.title} ${task.description} ${task.status_note} ${empName}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (filter.startDate && task.due_date < filter.startDate) {
      return false;
    }

    if (filter.endDate && task.due_date > filter.endDate) {
      return false;
    }

    if (filter.employeeId && task.employee_id !== filter.employeeId) {
      return false;
    }

    if (filter.categoryId && task.category_id !== filter.categoryId) {
      return false;
    }

    if (filter.status && task.status !== filter.status) {
      return false;
    }

    if (filter.overdueFilter !== 'SEMUA') {
      const {is_overdue} = computeTaskDeadlineStatus(task, currentDateIso);
      if (filter.overdueFilter === 'TERLAMBAT' && !is_overdue) {
        return false;
      }
      if (filter.overdueFilter === 'TIDAK_TERLAMBAT' && is_overdue) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    const aStatus = computeTaskDeadlineStatus(a, currentDateIso);
    const bStatus = computeTaskDeadlineStatus(b, currentDateIso);
    if (aStatus.is_overdue !== bStatus.is_overdue) {
      return aStatus.is_overdue ? -1 : 1;
    }
    if (aStatus.overdue_days !== bStatus.overdue_days) {
      return bStatus.overdue_days - aStatus.overdue_days;
    }
    return a.due_date.localeCompare(b.due_date);
  });
}
