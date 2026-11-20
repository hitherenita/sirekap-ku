// Berisi tampilan portal monitoring tugas pribadi khusus peran Pegawai (Read-Only).
import {Calendar, ExternalLink, Eye, Folder} from 'lucide-react';
import {useMemo, useState} from 'react';
import {
  TaskStatus,
  UserEntity,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {
  EmployeePortalTab,
  filterEmployeeTabTasks,
  splitEmployeeTasks,
} from '../lib/employeePortal';
import {formatDateId, getTodayIsoDate} from '../lib/format';
import {computeTaskDeadlineStatus} from '../lib/overdue';
import StatusBadge from './StatusBadge';

interface EmployeeTasksViewProps {
  currentUser: UserEntity;
  tasks: WorkTaskEntity[];
  categories: WorkCategoryEntity[];
  onSelectTaskDetail: (taskId: string) => void;
}

const ACTIVE_FILTERS: Array<'SEMUA' | TaskStatus> = [
  'SEMUA',
  'Belum Dimulai',
  'Dalam Proses',
  'Ditunda',
];

const HISTORY_FILTERS: Array<'SEMUA' | TaskStatus> = [
  'SEMUA',
  'Selesai',
  'Dibatalkan',
];

export default function EmployeeTasksView({
  currentUser,
  tasks,
  categories,
  onSelectTaskDetail,
}: EmployeeTasksViewProps) {
  const [activeTab, setActiveTab] = useState<EmployeePortalTab>('active');
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | TaskStatus>('SEMUA');

  const todayIso = getTodayIsoDate();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.category_name])),
    [categories],
  );

  const portalData = useMemo(
    () => splitEmployeeTasks(tasks, currentUser.id, todayIso),
    [tasks, currentUser.id, todayIso],
  );

  const tabTasks =
    activeTab === 'active' ? portalData.activeTasks : portalData.historyTasks;

  const filteredTasks = useMemo(
    () => filterEmployeeTabTasks(tabTasks, statusFilter),
    [tabTasks, statusFilter],
  );

  const availableFilters =
    activeTab === 'active' ? ACTIVE_FILTERS : HISTORY_FILTERS;

  const handleTabChange = (nextTab: EmployeePortalTab) => {
    setActiveTab(nextTab);
    setStatusFilter('SEMUA');
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Tugas Saya
        </h1>
        <p className="mt-1 text-base text-neutral-600">
          Pantau daftar tugas aktif, tenggat waktu, dan riwayat pekerjaan Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Tugas Aktif</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
            {portalData.summary.activeCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Melewati Tenggat</p>
          <p
            className={
              portalData.summary.overdueCount > 0
                ? 'mt-2 text-3xl font-semibold tabular-nums text-red-800'
                : 'mt-2 text-3xl font-semibold tabular-nums text-neutral-900'
            }
          >
            {portalData.summary.overdueCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Selesai</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-800">
            {portalData.summary.completedCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6">
        <div
          role="tablist"
          aria-label="Kelompok tugas pegawai"
          className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            onClick={() => handleTabChange('active')}
            className={
              activeTab === 'active'
                ? 'min-h-[44px] rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium tabular-nums text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                : 'min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium tabular-nums text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
            }
          >
            Tugas Aktif ({portalData.activeTasks.length})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => handleTabChange('history')}
            className={
              activeTab === 'history'
                ? 'min-h-[44px] rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium tabular-nums text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                : 'min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium tabular-nums text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
            }
          >
            Riwayat Selesai ({portalData.historyTasks.length})
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {availableFilters.map((filterValue) => {
            const selected = statusFilter === filterValue;
            return (
              <button
                key={filterValue}
                type="button"
                onClick={() => setStatusFilter(filterValue)}
                className={
                  selected
                    ? 'min-h-[44px] rounded-xl border border-blue-700 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                    : 'min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                }
              >
                {filterValue === 'SEMUA' ? 'Semua Status' : filterValue}
              </button>
            );
          })}
        </div>

        <div className="mt-4 divide-y divide-neutral-200">
          {filteredTasks.length === 0 ? (
            <p className="py-8 text-center text-base text-neutral-600">
              Tidak ada pekerjaan pada filter ini.
            </p>
          ) : (
            filteredTasks.map((task) => {
              const deadline = computeTaskDeadlineStatus(task, todayIso);
              return (
                <article
                  key={task.id}
                  className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-start"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-base font-semibold text-neutral-900">
                      <button
                        type="button"
                        onClick={() => onSelectTaskDetail(task.id)}
                        className="rounded-md text-left hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                      >
                        {task.title}
                      </button>
                    </h2>
                    {task.description && (
                      <p className="text-sm text-neutral-600">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Folder className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                        <span>{categoryMap.get(task.category_id) ?? '-'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Calendar className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                        <span>Tenggat: {formatDateId(task.due_date)}</span>
                      </span>
                    </div>
                    {task.status_note && (
                      <p className="text-sm text-neutral-600">
                        Catatan: {task.status_note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <StatusBadge status={task.status} deadlineStatus={deadline} />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectTaskDetail(task.id)}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                      >
                        <Eye className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                        <span>Detail</span>
                      </button>
                      {task.documentation_url ? (
                        <a
                          href={task.documentation_url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-blue-700 hover:border-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        >
                          <span>Buka Tautan</span>
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-500">
                          Belum ada tautan bukti
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
