// Berisi dialog modal Detail Pekerjaan lengkap beserta lini masa riwayat perubahan (FT-08).
import {Clock, ExternalLink, X} from 'lucide-react';
import {useEffect} from 'react';
import {formatDateId, formatDateTimeId} from '../lib/format';
import {TaskDetailPayload} from '../lib/taskDetail';
import StatusBadge from './StatusBadge';

interface TaskDetailModalProps {
  detail: TaskDetailPayload;
  onClose: () => void;
}

export default function TaskDetailModal({detail, onClose}: TaskDetailModalProps) {
  const {
    task,
    employeeName,
    employeePosition,
    categoryName,
    createdByName,
    deadlineStatus,
    timeline,
  } = detail;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-4">
          <div>
            <p className="text-sm font-medium text-neutral-600">Detail Pekerjaan</p>
            <h2
              id="task-detail-modal-title"
              className="mt-1 text-xl font-semibold text-neutral-900"
            >
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pekerjaan"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={task.status} deadlineStatus={deadlineStatus} />
            {task.documentation_url ? (
              <a
                href={task.documentation_url}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                <span>Buka Tautan</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-sm text-neutral-500">
                Belum ada tautan dokumentasi
              </span>
            )}
          </div>

          {task.description && (
            <div>
              <p className="text-sm font-medium text-neutral-600">Deskripsi</p>
              <p className="mt-1 text-base text-neutral-900">{task.description}</p>
            </div>
          )}

          <dl className="grid gap-4 border-t border-b border-neutral-200 py-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-neutral-600">
                Pegawai Pelaksana
              </dt>
              <dd className="mt-1 text-base font-medium text-neutral-900">
                {employeeName}
              </dd>
              <dd className="text-sm text-neutral-600">{employeePosition}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-neutral-600">Kategori</dt>
              <dd className="mt-1 text-base text-neutral-900">{categoryName}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-neutral-600">Tanggal Mulai</dt>
              <dd className="mt-1 text-base tabular-nums text-neutral-900">
                {formatDateId(task.start_date)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-neutral-600">
                Tenggat Waktu
              </dt>
              <dd className="mt-1 text-base tabular-nums text-neutral-900">
                {formatDateId(task.due_date)}
              </dd>
            </div>

            {task.completed_at && (
              <div>
                <dt className="text-sm font-medium text-neutral-600">
                  Waktu Selesai
                </dt>
                <dd className="mt-1 text-base tabular-nums text-neutral-900">
                  {formatDateTimeId(task.completed_at)}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-neutral-600">Dicatat Oleh</dt>
              <dd className="mt-1 text-base text-neutral-900">{createdByName}</dd>
            </div>
          </dl>

          {task.status_note && (
            <div>
              <p className="text-sm font-medium text-neutral-600">Catatan Status</p>
              <p className="mt-1 text-base text-neutral-900">{task.status_note}</p>
            </div>
          )}

          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              Riwayat Perubahan
            </h3>

            {timeline.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">
                Belum ada catatan riwayat perubahan.
              </p>
            ) : (
              <ol className="mt-3 divide-y divide-neutral-200 border-t border-neutral-200">
                {timeline.map((entry) => (
                  <li key={entry.id} className="py-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {entry.actionLabel}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm tabular-nums text-neutral-600">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatDateTimeId(entry.createdAt)}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-700">
                      Dari <span className="font-medium">{entry.oldValue}</span> menjadi{' '}
                      <span className="font-medium text-neutral-900">
                        {entry.newValue}
                      </span>
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-sm text-neutral-600">
                        Catatan: {entry.note}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-neutral-500">
                      Oleh: {entry.changedByName}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
