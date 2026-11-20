// Berisi komponen badge status pekerjaan dan lencana keterlambatan otomatis beserta ikon sesuai aturan desain.
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  PauseCircle,
} from 'lucide-react';
import {TaskStatus} from '../config';
import {TaskDeadlineStatus} from '../lib/overdue';

interface StatusBadgeProps {
  status: TaskStatus;
  deadlineStatus?: TaskDeadlineStatus;
}

function MainStatusPill({status}: {status: TaskStatus}) {
  switch (status) {
    case 'Selesai':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Selesai</span>
        </span>
      );
    case 'Dalam Proses':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Dalam Proses</span>
        </span>
      );
    case 'Ditunda':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
          <PauseCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Ditunda</span>
        </span>
      );
    case 'Dibatalkan':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-800">
          <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">
          <CircleDashed className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Belum Dimulai</span>
        </span>
      );
  }
}

export default function StatusBadge({status, deadlineStatus}: StatusBadgeProps) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <MainStatusPill status={status} />
      {deadlineStatus?.is_overdue && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium tabular-nums text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Terlambat ({deadlineStatus.overdue_days} hari)</span>
        </span>
      )}
      {deadlineStatus?.is_due_today && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Jatuh tempo hari ini</span>
        </span>
      )}
      {deadlineStatus?.is_completed_late && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Selesai lewat tenggat</span>
        </span>
      )}
    </div>
  );
}
