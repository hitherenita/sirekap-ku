// Berisi halaman pratinjau laporan unit kerja Opsi A serta tombol unduh PDF dan Excel (.xlsx).
import {
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import {
  UnitSettingEntity,
  UserEntity,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {getDefaultMonthRange} from '../lib/analytics';
import {formatPercentId, getTodayIsoDate} from '../lib/format';
import {
  buildUnitReportData,
  downloadExcelReport,
  downloadPdfReport,
} from '../lib/reports';

interface ReportsViewProps {
  currentUser: UserEntity;
  tasks: WorkTaskEntity[];
  users: UserEntity[];
  categories: WorkCategoryEntity[];
  unitSetting: UnitSettingEntity;
}

export default function ReportsView({
  currentUser,
  tasks,
  users,
  categories,
  unitSetting,
}: ReportsViewProps) {
  const defaultRange = useMemo(() => getDefaultMonthRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [employeeId, setEmployeeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const todayIso = getTodayIsoDate();

  const reportResult = useMemo(
    () =>
      buildUnitReportData(tasks, users, categories, unitSetting, currentUser, {
        startDate,
        endDate,
        employeeId,
        categoryId,
        currentDateIso: todayIso,
      }),
    [
      tasks,
      users,
      categories,
      unitSetting,
      currentUser,
      startDate,
      endDate,
      employeeId,
      categoryId,
      todayIso,
    ],
  );

  const handleStartChange = (nextStart: string) => {
    setExportMessage(null);
    if (endDate && nextStart && nextStart > endDate) {
      setDateError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    setDateError(null);
    setStartDate(nextStart);
  };

  const handleEndChange = (nextEnd: string) => {
    setExportMessage(null);
    if (startDate && nextEnd && nextEnd < startDate) {
      setDateError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    setDateError(null);
    setEndDate(nextEnd);
  };

  const handleThisMonth = () => {
    setDateError(null);
    setExportMessage(null);
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
  };

  const handleAllPeriod = () => {
    setDateError(null);
    setExportMessage(null);
    setStartDate('');
    setEndDate('');
  };

  const handleDownloadPdf = () => {
    if (!reportResult.ok || !reportResult.report || dateError) {
      return;
    }
    downloadPdfReport(reportResult.report);
    setExportMessage(
      `Berkas ${reportResult.report.fileBaseName}.pdf berhasil dibuat dan diunduh.`,
    );
  };

  const handleDownloadExcel = () => {
    if (!reportResult.ok || !reportResult.report || dateError) {
      return;
    }
    downloadExcelReport(reportResult.report);
    setExportMessage(
      `Berkas ${reportResult.report.fileBaseName}.xlsx berhasil dibuat dan diunduh.`,
    );
  };

  const report = reportResult.report;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Otomatisasi Laporan Unit Kerja
            </h1>
            <p className="mt-1 text-base text-neutral-600">
              Pilih periode laporan untuk melihat pratinjau rekapitulasi serta mengunduh berkas PDF dan Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!report || Boolean(dateError)}
              onClick={handleDownloadPdf}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Unduh PDF</span>
            </button>

            <button
              type="button"
              disabled={!report || Boolean(dateError)}
              onClick={handleDownloadExcel}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-700 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors duration-150 ease-out hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="report-start-date"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Dari Tanggal Tenggat
            </label>
            <input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label
              htmlFor="report-end-date"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Sampai Tanggal Tenggat
            </label>
            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label
              htmlFor="report-employee"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Pegawai (opsional)
            </label>
            <select
              id="report-employee"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setExportMessage(null);
              }}
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <option value="">Semua Pegawai</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="report-category"
              className="mb-1.5 block text-sm font-medium text-neutral-900"
            >
              Kategori (opsional)
            </label>
            <select
              id="report-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setExportMessage(null);
              }}
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleThisMonth}
            className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={handleAllPeriod}
            className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Semua Periode
          </button>
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

        {exportMessage && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{exportMessage}</span>
          </div>
        )}
      </div>

      {report && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Pratinjau Laporan Opsi A
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Unit Kerja: {report.unitSetting.unit_name} | Periode:{' '}
                {report.periodLabel}
              </p>
            </div>

            {report.summary.totalTasks === 0 && (
              <div className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm font-medium text-neutral-800">
                Tidak ada data pekerjaan pada periode ini.
              </div>
            )}

            <h3 className="mt-6 text-base font-semibold text-neutral-900">
              1. Ringkasan Statistik Unit
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 font-medium text-neutral-600">
                    <th className="py-2.5 pr-4">Total</th>
                    <th className="py-2.5 pr-4">Target Efektif</th>
                    <th className="py-2.5 pr-4">Selesai</th>
                    <th className="py-2.5 pr-4">Proses</th>
                    <th className="py-2.5 pr-4">Belum</th>
                    <th className="py-2.5 pr-4">Ditunda</th>
                    <th className="py-2.5 pr-4">Dibatalkan</th>
                    <th className="py-2.5 pr-4">Terlambat</th>
                    <th className="py-2.5 text-right">Capaian</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-200 tabular-nums text-neutral-900">
                    <td className="py-3 pr-4 font-medium">{report.summary.totalTasks}</td>
                    <td className="py-3 pr-4">{report.summary.effectiveTarget}</td>
                    <td className="py-3 pr-4">{report.summary.completedCount}</td>
                    <td className="py-3 pr-4">{report.summary.inProgressCount}</td>
                    <td className="py-3 pr-4">{report.summary.notStartedCount}</td>
                    <td className="py-3 pr-4">{report.summary.postponedCount}</td>
                    <td className="py-3 pr-4">{report.summary.cancelledCount}</td>
                    <td className="py-3 pr-4 font-medium text-red-800">
                      {report.summary.overdueActiveCount}
                    </td>
                    <td className="py-3 text-right font-semibold text-blue-700">
                      {formatPercentId(report.summary.completionRate)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 text-base font-semibold text-neutral-900">
              2. Rekapitulasi Per Pegawai
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 font-medium text-neutral-600">
                    <th className="py-2.5 pr-4">Pegawai</th>
                    <th className="py-2.5 pr-4 text-right">Total</th>
                    <th className="py-2.5 pr-4 text-right">Selesai</th>
                    <th className="py-2.5 pr-4 text-right">Proses</th>
                    <th className="py-2.5 pr-4 text-right">Belum</th>
                    <th className="py-2.5 pr-4 text-right">Ditunda</th>
                    <th className="py-2.5 pr-4 text-right">Dibatalkan</th>
                    <th className="py-2.5 pr-4 text-right">Terlambat</th>
                    <th className="py-2.5 text-right">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.byEmployee.map((row) => (
                    <tr key={row.employeeId}>
                      <td className="py-2.5 pr-4 font-medium text-neutral-900">
                        {row.employeeName}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.totalTasks}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.completedCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.inProgressCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.notStartedCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.postponedCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.cancelledCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-red-800">
                        {row.overdueActiveCount}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-semibold">
                        {formatPercentId(row.completionRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 text-base font-semibold text-neutral-900">
              3. Rekapitulasi Per Kategori Pekerjaan
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 font-medium text-neutral-600">
                    <th className="py-2.5 pr-4">Kategori</th>
                    <th className="py-2.5 pr-4 text-right">Total</th>
                    <th className="py-2.5 pr-4 text-right">Selesai</th>
                    <th className="py-2.5 pr-4 text-right">Belum Selesai</th>
                    <th className="py-2.5 pr-4 text-right">Dibatalkan</th>
                    <th className="py-2.5 pr-4 text-right">Terlambat</th>
                    <th className="py-2.5 text-right">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.byCategory.map((row) => (
                    <tr key={row.categoryId}>
                      <td className="py-2.5 pr-4 font-medium text-neutral-900">
                        {row.categoryName}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.totalTasks}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.completedCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.pendingCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {row.cancelledCount}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-red-800">
                        {row.overdueActiveCount}
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-semibold">
                        {formatPercentId(row.completionRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-6 text-base font-semibold text-neutral-900">
              4. Lampiran Rincian Pekerjaan
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 font-medium text-neutral-600">
                    <th className="py-2.5 pr-3">No</th>
                    <th className="py-2.5 pr-4">Judul Pekerjaan</th>
                    <th className="py-2.5 pr-4">Pegawai</th>
                    <th className="py-2.5 pr-4">Kategori</th>
                    <th className="py-2.5 pr-4">Tenggat</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5">Dokumentasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {report.taskRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-neutral-600">
                        Tidak ada data pekerjaan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    report.taskRows.map((row) => (
                      <tr key={row.index} className="align-top">
                        <td className="py-2.5 pr-3 tabular-nums text-neutral-600">
                          {row.index}
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-neutral-900">
                          {row.title}
                        </td>
                        <td className="py-2.5 pr-4 text-neutral-900">
                          {row.employeeName}
                        </td>
                        <td className="py-2.5 pr-4 text-neutral-700">
                          {row.categoryName}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-neutral-900">
                          {row.dueDateLabel}
                        </td>
                        <td className="py-2.5 pr-4 text-neutral-900">
                          {row.statusLabel}
                        </td>
                        <td className="py-2.5">
                          {row.documentationUrl !== '-' ? (
                            <a
                              href={row.documentationUrl}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                            >
                              <span>Buka Tautan</span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          ) : (
                            <span className="text-neutral-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
              <p>
                Penanda tangan: <strong className="text-neutral-900">{report.unitSetting.leader_name}</strong> (NIP{' '}
                <span className="tabular-nums">{report.unitSetting.leader_nip}</span>)
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
