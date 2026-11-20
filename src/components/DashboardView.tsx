// Berisi tampilan Dashboard Monitoring Pimpinan dan Admin dengan ringkasan statistik, grafik batang, dan daftar tugas terlambat.
import {ExternalLink, Eye, ShieldAlert} from 'lucide-react';
import {useMemo, useState} from 'react';
import {UserEntity, WorkCategoryEntity, WorkTaskEntity} from '../config';
import {
  computeUnitDashboardAnalytics,
  getDefaultMonthRange,
  getInitialPeriodRange,
} from '../lib/analytics';
import {
  formatDateId,
  formatDecimalId,
  formatPercentId,
  getTodayIsoDate,
} from '../lib/format';
import StatusBadge from './StatusBadge';

interface DashboardViewProps {
  tasks: WorkTaskEntity[];
  users: UserEntity[];
  categories: WorkCategoryEntity[];
  onSelectTaskDetail: (taskId: string) => void;
}

export default function DashboardView({
  tasks,
  users,
  categories,
  onSelectTaskDetail,
}: DashboardViewProps) {
  const defaultRange = useMemo(() => getDefaultMonthRange(), []);
  const initialRange = useMemo(() => getInitialPeriodRange(tasks), [tasks]);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [dateError, setDateError] = useState<string | null>(null);

  const todayIso = getTodayIsoDate();

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.full_name])),
    [users],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.category_name])),
    [categories],
  );

  const analytics = useMemo(
    () =>
      computeUnitDashboardAnalytics(tasks, users, categories, {
        startDate,
        endDate,
        currentDateIso: todayIso,
      }),
    [tasks, users, categories, startDate, endDate, todayIso],
  );

  const handleStartDateChange = (nextStart: string) => {
    if (endDate && nextStart && nextStart > endDate) {
      setDateError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    setDateError(null);
    setStartDate(nextStart);
  };

  const handleEndDateChange = (nextEnd: string) => {
    if (startDate && nextEnd && nextEnd < startDate) {
      setDateError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    setDateError(null);
    setEndDate(nextEnd);
  };

  const handleThisMonth = () => {
    setDateError(null);
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
  };

  const handleAllTime = () => {
    setDateError(null);
    setStartDate('');
    setEndDate('');
  };

  const {summary, byEmployee, byCategory, urgentActiveTasks} = analytics;

  const statusDistribution = [
    {
      label: 'Selesai',
      count: summary.completedCount,
      barClass: 'bg-emerald-600',
    },
    {
      label: 'Dalam Proses',
      count: summary.inProgressCount,
      barClass: 'bg-blue-700',
    },
    {
      label: 'Belum Dimulai',
      count: summary.notStartedCount,
      barClass: 'bg-neutral-500',
    },
    {
      label: 'Ditunda',
      count: summary.postponedCount,
      barClass: 'bg-amber-600',
    },
    {
      label: 'Dibatalkan',
      count: summary.cancelledCount,
      barClass: 'bg-red-600',
    },
  ];

  const maxCategoryCount = Math.max(
    1,
    ...byCategory.map((item) => item.totalTasks),
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Ringkasan Kinerja Unit
            </h1>
            <p className="mt-1 text-base text-neutral-600">
              Pantau capaian penyelesaian, distribusi beban kerja, dan tugas yang melewati tenggat.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="dash-start-date"
                className="mb-1 block text-sm font-medium text-neutral-900"
              >
                Dari Tanggal
              </label>
              <input
                id="dash-start-date"
                name="start_date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label
                htmlFor="dash-end-date"
                className="mb-1 block text-sm font-medium text-neutral-900"
              >
                Sampai Tanggal
              </label>
              <input
                id="dash-end-date"
                name="end_date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
            </div>

            <button
              type="button"
              onClick={handleThisMonth}
              className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Bulan Ini
            </button>

            <button
              type="button"
              onClick={handleAllTime}
              className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Semua Periode
            </button>
          </div>
        </div>

        {dateError && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Total Pekerjaan</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
            {summary.totalTasks}
          </p>
          <p className="mt-1 text-sm tabular-nums text-neutral-600">
            Target efektif: {summary.effectiveTarget} tugas
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Tingkat Penyelesaian</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-blue-700">
            {formatPercentId(summary.completionRate)}
          </p>
          <p className="mt-1 text-sm tabular-nums text-neutral-600">
            {summary.completedCount} dari {summary.effectiveTarget} target efektif
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Dalam Proses</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
            {summary.inProgressCount}
          </p>
          <p className="mt-1 text-sm tabular-nums text-neutral-600">
            Belum dimulai: {summary.notStartedCount}, Ditunda: {summary.postponedCount}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <p className="text-sm font-medium text-neutral-600">Terlambat Aktif</p>
          <p
            className={
              summary.overdueActiveCount > 0
                ? 'mt-2 text-3xl font-semibold tabular-nums text-red-800'
                : 'mt-2 text-3xl font-semibold tabular-nums text-neutral-900'
            }
          >
            {summary.overdueActiveCount}
          </p>
          <p className="mt-1 text-sm tabular-nums text-neutral-600">
            Dibatalkan: {summary.cancelledCount} tugas
          </p>
        </div>
      </div>

      {summary.totalTasks === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-base text-neutral-600">
            Tidak ada data pekerjaan pada periode ini.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Distribusi Status Pekerjaan
              </h2>
              <div className="mt-4 space-y-4">
                {statusDistribution.map((item) => {
                  const pct =
                    summary.totalTasks > 0
                      ? (item.count / summary.totalTasks) * 100
                      : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-900">
                          {item.label}
                        </span>
                        <span className="tabular-nums text-neutral-600">
                          {item.count} tugas ({formatDecimalId(pct, 1)}%)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full ${item.barClass}`}
                          style={{width: `${pct}%`}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Distribusi Per Kategori Pekerjaan
              </h2>
              <div className="mt-4 space-y-4">
                {byCategory.map((cat) => {
                  const barWidth = (cat.totalTasks / maxCategoryCount) * 100;
                  return (
                    <div key={cat.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-neutral-900">
                          {cat.categoryName}
                        </span>
                        <span className="shrink-0 tabular-nums text-neutral-600">
                          {cat.totalTasks} tugas ({formatPercentId(cat.completionRate)} selesai)
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-blue-700"
                          style={{width: `${barWidth}%`}}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              Rekapitulasi Per Pegawai
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 text-sm font-medium text-neutral-600">
                    <th className="py-3 pr-4">Pegawai</th>
                    <th className="py-3 pr-4 text-right">Total</th>
                    <th className="py-3 pr-4 text-right">Selesai</th>
                    <th className="py-3 pr-4 text-right">Proses</th>
                    <th className="py-3 pr-4 text-right">Belum</th>
                    <th className="py-3 pr-4 text-right">Ditunda</th>
                    <th className="py-3 pr-4 text-right">Dibatalkan</th>
                    <th className="py-3 pr-4 text-right">Terlambat</th>
                    <th className="py-3 text-right">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-sm">
                  {byEmployee.map((row) => (
                    <tr key={row.employeeId} className="align-middle">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-neutral-900">{row.employeeName}</p>
                        <p className="text-neutral-600">{row.position}</p>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-neutral-900">
                        {row.totalTasks}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-emerald-800">
                        {row.completedCount}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-blue-800">
                        {row.inProgressCount}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-neutral-700">
                        {row.notStartedCount}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-amber-800">
                        {row.postponedCount}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums text-neutral-600">
                        {row.cancelledCount}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums font-medium text-red-800">
                        {row.overdueActiveCount}
                      </td>
                      <td className="py-3 text-right tabular-nums font-semibold text-neutral-900">
                        {formatPercentId(row.completionRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              Pekerjaan Belum Selesai & Terlambat
            </h2>
            {urgentActiveTasks.length === 0 ? (
              <p className="mt-4 text-base text-neutral-600">
                Seluruh pekerjaan pada periode ini telah diselesaikan atau dibatalkan.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 text-sm font-medium text-neutral-600">
                      <th className="py-3 pr-4">Pekerjaan</th>
                      <th className="py-3 pr-4">Pegawai</th>
                      <th className="py-3 pr-4">Kategori</th>
                      <th className="py-3 pr-4">Tenggat</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Dokumentasi</th>
                      <th className="py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-sm">
                    {urgentActiveTasks.map(({task, deadlineStatus}) => (
                      <tr key={task.id} className="align-top">
                        <td className="py-3.5 pr-4">
                          <button
                            type="button"
                            onClick={() => onSelectTaskDetail(task.id)}
                            className="rounded-md text-left text-base font-medium text-neutral-900 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                          >
                            {task.title}
                          </button>
                          {task.status_note && (
                            <p className="mt-0.5 text-neutral-600">{task.status_note}</p>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-neutral-900">
                          {userMap.get(task.employee_id) ?? '-'}
                        </td>
                        <td className="py-3.5 pr-4 text-neutral-700">
                          {categoryMap.get(task.category_id) ?? '-'}
                        </td>
                        <td className="py-3.5 pr-4 tabular-nums text-neutral-900">
                          {formatDateId(task.due_date)}
                        </td>
                        <td className="py-3.5 pr-4">
                          <StatusBadge
                            status={task.status}
                            deadlineStatus={deadlineStatus}
                          />
                        </td>
                        <td className="py-3.5 pr-4">
                          {task.documentation_url ? (
                            <a
                              href={task.documentation_url}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                            >
                              <span>Buka Tautan</span>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          ) : (
                            <span className="text-neutral-500">Belum ada</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectTaskDetail(task.id)}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                          >
                            <Eye className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
