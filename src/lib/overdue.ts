// Berisi perhitungan otomatis status keterlambatan pekerjaan (is_overdue, overdue_days, is_completed_late) sesuai aturan BL-03.
import {ACTIVE_OVERDUE_STATUSES, WorkTaskEntity} from '../config';
import {getTodayIsoDate} from './format';

export interface TaskDeadlineStatus {
  is_overdue: boolean;
  overdue_days: number;
  is_due_today: boolean;
  is_completed_late: boolean;
}

function parseIsoDateToUtcMs(isoDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.slice(0, 10));
  if (!match) {
    return NaN;
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Menghitung selisih hari kalender (laterIso - earlierIso).
 */
export function diffCalendarDays(laterIso: string, earlierIso: string): number {
  const laterMs = parseIsoDateToUtcMs(laterIso);
  const earlierMs = parseIsoDateToUtcMs(earlierIso);
  if (Number.isNaN(laterMs) || Number.isNaN(earlierMs)) {
    return 0;
  }
  return Math.floor((laterMs - earlierMs) / 86400000);
}

/**
 * Menghitung flag keterlambatan aktif dan keterlambatan penyelesaian pekerjaan berdasarkan tanggal hari ini.
 */
export function computeTaskDeadlineStatus(
  task: Pick<WorkTaskEntity, 'status' | 'due_date' | 'completed_at'>,
  currentDateIso: string = getTodayIsoDate(),
): TaskDeadlineStatus {
  const isActiveStatus = ACTIVE_OVERDUE_STATUSES.includes(task.status);
  const diffDays = diffCalendarDays(currentDateIso, task.due_date);

  const is_overdue = isActiveStatus && diffDays > 0;
  const overdue_days = is_overdue ? diffDays : 0;
  const is_due_today = isActiveStatus && diffDays === 0;

  const completedDate = task.completed_at ? task.completed_at.slice(0, 10) : null;
  const is_completed_late =
    task.status === 'Selesai' &&
    completedDate !== null &&
    diffCalendarDays(completedDate, task.due_date) > 0;

  return {
    is_overdue,
    overdue_days,
    is_due_today,
    is_completed_late,
  };
}
