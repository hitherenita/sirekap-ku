// Berisi penyusunan payload laporan Opsi A serta generator ekspor Excel (.xlsx) dan PDF (.pdf) A4 (FT-09).
import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  UnitSettingEntity,
  UserEntity,
  VALIDATION_MESSAGES,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {
  AnalyticsFilterOptions,
  CategoryRecapRow,
  computeUnitDashboardAnalytics,
  EmployeeRecapRow,
  UnitSummaryStats,
} from './analytics';
import {formatDateId, formatPercentId, getTodayIsoDate} from './format';
import {computeTaskDeadlineStatus} from './overdue';

export interface ReportTaskDetailRow {
  index: number;
  title: string;
  employeeName: string;
  categoryName: string;
  startDateLabel: string;
  dueDateLabel: string;
  statusLabel: string;
  documentationUrl: string;
  statusNote: string;
}

export interface UnitReportPayload {
  unitSetting: UnitSettingEntity;
  periodLabel: string;
  printedDateLabel: string;
  fileBaseName: string;
  summary: UnitSummaryStats;
  byEmployee: EmployeeRecapRow[];
  byCategory: CategoryRecapRow[];
  taskRows: ReportTaskDetailRow[];
}

export interface BuildReportResult {
  ok: boolean;
  statusCode: 200 | 400 | 403;
  report?: UnitReportPayload;
  error?: string;
}

const EMPTY_PERIOD_MESSAGE = 'Tidak ada data pekerjaan pada periode ini.';

/**
 * Menyusun data laporan Opsi A dengan penjaga peran Admin/Pimpinan dan angka yang identik dengan Dashboard.
 */
export function buildUnitReportData(
  tasks: WorkTaskEntity[],
  users: UserEntity[],
  categories: WorkCategoryEntity[],
  unitSetting: UnitSettingEntity,
  actorUser: UserEntity | null,
  options: AnalyticsFilterOptions = {},
): BuildReportResult {
  if (
    !actorUser ||
    !actorUser.is_active ||
    (actorUser.role !== 'ADMIN' && actorUser.role !== 'PIMPINAN')
  ) {
    return {
      ok: false,
      statusCode: 403,
      error: VALIDATION_MESSAGES.forbiddenAction,
    };
  }

  const start = (options.startDate ?? '').trim();
  const end = (options.endDate ?? '').trim();
  if (start && end && end < start) {
    return {
      ok: false,
      statusCode: 400,
      error: 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai.',
    };
  }

  const currentDateIso = options.currentDateIso ?? getTodayIsoDate();
  const analytics = computeUnitDashboardAnalytics(tasks, users, categories, {
    ...options,
    currentDateIso,
  });

  const userMap = new Map(users.map((u) => [u.id, u.full_name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.category_name]));

  const sortedTasks = [...analytics.filteredTasks].sort((a, b) =>
    a.due_date.localeCompare(b.due_date),
  );

  const taskRows: ReportTaskDetailRow[] = sortedTasks.map((task, idx) => {
    const deadline = computeTaskDeadlineStatus(task, currentDateIso);
    const statusLabel = deadline.is_overdue
      ? `${task.status} (Terlambat ${deadline.overdue_days} hari)`
      : deadline.is_completed_late
        ? `${task.status} (Lewat tenggat)`
        : task.status;

    return {
      index: idx + 1,
      title: task.title,
      employeeName: userMap.get(task.employee_id) ?? '-',
      categoryName: categoryMap.get(task.category_id) ?? '-',
      startDateLabel: formatDateId(task.start_date),
      dueDateLabel: formatDateId(task.due_date),
      statusLabel,
      documentationUrl: task.documentation_url || '-',
      statusNote: task.status_note || '-',
    };
  });

  let periodLabel = 'Semua Periode';
  let fileRangePart = 'semua-periode';
  if (start && end) {
    periodLabel = `${formatDateId(start)} s.d. ${formatDateId(end)}`;
    fileRangePart = `${start}_sd_${end}`;
  } else if (start) {
    periodLabel = `Mulai ${formatDateId(start)}`;
    fileRangePart = `mulai-${start}`;
  } else if (end) {
    periodLabel = `Sampai ${formatDateId(end)}`;
    fileRangePart = `sampai-${end}`;
  }

  return {
    ok: true,
    statusCode: 200,
    report: {
      unitSetting,
      periodLabel,
      printedDateLabel: formatDateId(currentDateIso),
      fileBaseName: `laporan-unit-${fileRangePart}`,
      summary: analytics.summary,
      byEmployee: analytics.byEmployee,
      byCategory: analytics.byCategory,
      taskRows,
    },
  };
}

/**
 * Membangun objek workbook Excel (.xlsx) dengan 4 sheet struktur Opsi A.
 */
export function createExcelWorkbook(report: UnitReportPayload): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Unit
  const summaryRows: Array<Array<string | number>> = [
    ['LAPORAN REKAPITULASI PEKERJAAN UNIT KERJA'],
    ['Unit Kerja', report.unitSetting.unit_name],
    ['Periode Laporan', report.periodLabel],
    ['Tanggal Cetak', report.printedDateLabel],
    [],
    ['Indikator', 'Nilai'],
    ['Total Pekerjaan', report.summary.totalTasks],
    ['Target Efektif (Tanpa Dibatalkan)', report.summary.effectiveTarget],
    ['Selesai', report.summary.completedCount],
    ['Dalam Proses', report.summary.inProgressCount],
    ['Belum Dimulai', report.summary.notStartedCount],
    ['Ditunda', report.summary.postponedCount],
    ['Dibatalkan', report.summary.cancelledCount],
    ['Terlambat Aktif', report.summary.overdueActiveCount],
    ['Tingkat Penyelesaian', formatPercentId(report.summary.completionRate)],
  ];
  if (report.summary.totalTasks === 0) {
    summaryRows.push([], [EMPTY_PERIOD_MESSAGE]);
  }
  summaryRows.push(
    [],
    ['Pimpinan Penanda Tangan', report.unitSetting.leader_name],
    ['NIP / ID Pimpinan', report.unitSetting.leader_nip],
  );
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Unit');

  // Sheet 2: Rekap Pegawai
  const empRows: Array<Array<string | number>> = [
    [
      'Nama Pegawai',
      'Jabatan',
      'Total',
      'Selesai',
      'Dalam Proses',
      'Belum Dimulai',
      'Ditunda',
      'Dibatalkan',
      'Terlambat Aktif',
      'Tingkat Penyelesaian',
    ],
    ...report.byEmployee.map((row) => [
      row.employeeName,
      row.position,
      row.totalTasks,
      row.completedCount,
      row.inProgressCount,
      row.notStartedCount,
      row.postponedCount,
      row.cancelledCount,
      row.overdueActiveCount,
      formatPercentId(row.completionRate),
    ]),
  ];
  if (report.summary.totalTasks === 0) {
    empRows.push([EMPTY_PERIOD_MESSAGE]);
  }
  const wsEmp = XLSX.utils.aoa_to_sheet(empRows);
  XLSX.utils.book_append_sheet(wb, wsEmp, 'Rekap Pegawai');

  // Sheet 3: Rekap Kategori
  const catRows: Array<Array<string | number>> = [
    [
      'Kategori Pekerjaan',
      'Total',
      'Selesai',
      'Belum Selesai',
      'Dibatalkan',
      'Terlambat Aktif',
      'Tingkat Penyelesaian',
    ],
    ...report.byCategory.map((row) => [
      row.categoryName,
      row.totalTasks,
      row.completedCount,
      row.pendingCount,
      row.cancelledCount,
      row.overdueActiveCount,
      formatPercentId(row.completionRate),
    ]),
  ];
  if (report.summary.totalTasks === 0) {
    catRows.push([EMPTY_PERIOD_MESSAGE]);
  }
  const wsCat = XLSX.utils.aoa_to_sheet(catRows);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Rekap Kategori');

  // Sheet 4: Rincian Pekerjaan
  const detailRows: Array<Array<string | number>> = [
    [
      'No',
      'Judul Pekerjaan',
      'Pegawai',
      'Kategori',
      'Tanggal Mulai',
      'Tenggat Waktu',
      'Status',
      'Tautan Dokumentasi',
      'Catatan',
    ],
  ];
  if (report.taskRows.length === 0) {
    detailRows.push([EMPTY_PERIOD_MESSAGE]);
  } else {
    for (const row of report.taskRows) {
      detailRows.push([
        row.index,
        row.title,
        row.employeeName,
        row.categoryName,
        row.startDateLabel,
        row.dueDateLabel,
        row.statusLabel,
        row.documentationUrl,
        row.statusNote,
      ]);
    }
  }
  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Rincian Pekerjaan');

  return wb;
}

/**
 * Mengunduh laporan Excel (.xlsx) ke perangkat pengguna.
 */
export function downloadExcelReport(report: UnitReportPayload): void {
  const wb = createExcelWorkbook(report);
  XLSX.writeFile(wb, `${report.fileBaseName}.xlsx`);
}

interface JsPdfWithAutoTable extends jsPDF {
  lastAutoTable?: {finalY: number};
}

/**
 * Membangun dokumen PDF A4 landscape berisi 4 bagian laporan Opsi A.
 */
export function createPdfDocument(report: UnitReportPayload): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as JsPdfWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 16;

  doc.setFontSize(14);
  doc.text('LAPORAN REKAPITULASI PEKERJAAN UNIT KERJA', 14, cursorY);
  cursorY += 6;

  doc.setFontSize(10);
  doc.text(`Unit Kerja: ${report.unitSetting.unit_name}`, 14, cursorY);
  cursorY += 5;
  doc.text(`Periode: ${report.periodLabel}`, 14, cursorY);
  doc.text(`Tanggal Cetak: ${report.printedDateLabel}`, pageWidth - 14, cursorY, {
    align: 'right',
  });
  cursorY += 6;

  if (report.summary.totalTasks === 0) {
    doc.setFontSize(10);
    doc.text(EMPTY_PERIOD_MESSAGE, 14, cursorY);
    cursorY += 6;
  }

  // Bagian 1: Ringkasan Statistik Unit
  doc.setFontSize(11);
  doc.text('1. Ringkasan Statistik Unit', 14, cursorY);
  autoTable(doc, {
    startY: cursorY + 2,
    head: [
      [
        'Total',
        'Target Efektif',
        'Selesai',
        'Dalam Proses',
        'Belum Dimulai',
        'Ditunda',
        'Dibatalkan',
        'Terlambat Aktif',
        'Tingkat Penyelesaian',
      ],
    ],
    body: [
      [
        report.summary.totalTasks,
        report.summary.effectiveTarget,
        report.summary.completedCount,
        report.summary.inProgressCount,
        report.summary.notStartedCount,
        report.summary.postponedCount,
        report.summary.cancelledCount,
        report.summary.overdueActiveCount,
        formatPercentId(report.summary.completionRate),
      ],
    ],
    styles: {fontSize: 9},
    headStyles: {fillColor: [29, 78, 216]},
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 8;

  // Bagian 2: Rekapitulasi Per Pegawai
  doc.setFontSize(11);
  doc.text('2. Rekapitulasi Per Pegawai', 14, cursorY);
  autoTable(doc, {
    startY: cursorY + 2,
    head: [
      [
        'Pegawai',
        'Jabatan',
        'Total',
        'Selesai',
        'Proses',
        'Belum',
        'Ditunda',
        'Batal',
        'Terlambat',
        'Capaian',
      ],
    ],
    body: report.byEmployee.map((row) => [
      row.employeeName,
      row.position,
      row.totalTasks,
      row.completedCount,
      row.inProgressCount,
      row.notStartedCount,
      row.postponedCount,
      row.cancelledCount,
      row.overdueActiveCount,
      formatPercentId(row.completionRate),
    ]),
    styles: {fontSize: 8.5},
    headStyles: {fillColor: [29, 78, 216]},
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 8;

  // Bagian 3: Rekapitulasi Per Kategori
  doc.setFontSize(11);
  doc.text('3. Rekapitulasi Per Kategori Pekerjaan', 14, cursorY);
  autoTable(doc, {
    startY: cursorY + 2,
    head: [
      [
        'Kategori',
        'Total',
        'Selesai',
        'Belum Selesai',
        'Dibatalkan',
        'Terlambat Aktif',
        'Capaian',
      ],
    ],
    body: report.byCategory.map((row) => [
      row.categoryName,
      row.totalTasks,
      row.completedCount,
      row.pendingCount,
      row.cancelledCount,
      row.overdueActiveCount,
      formatPercentId(row.completionRate),
    ]),
    styles: {fontSize: 8.5},
    headStyles: {fillColor: [29, 78, 216]},
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 8;

  // Bagian 4: Lampiran Rincian Pekerjaan
  doc.setFontSize(11);
  doc.text('4. Lampiran Rincian Pekerjaan', 14, cursorY);
  autoTable(doc, {
    startY: cursorY + 2,
    head: [
      [
        'No',
        'Judul Pekerjaan',
        'Pegawai',
        'Kategori',
        'Tenggat',
        'Status',
        'Tautan Dokumentasi',
      ],
    ],
    body:
      report.taskRows.length === 0
        ? [['-', EMPTY_PERIOD_MESSAGE, '-', '-', '-', '-', '-']]
        : report.taskRows.map((row) => [
            row.index,
            row.title,
            row.employeeName,
            row.categoryName,
            row.dueDateLabel,
            row.statusLabel,
            row.documentationUrl,
          ]),
    styles: {fontSize: 8, overflow: 'linebreak'},
    columnStyles: {
      0: {cellWidth: 10},
      1: {cellWidth: 55},
      6: {cellWidth: 65},
    },
    headStyles: {fillColor: [29, 78, 216]},
  });

  const finalY = (doc.lastAutoTable?.finalY ?? cursorY + 20) + 12;
  const pageHeight = doc.internal.pageSize.getHeight();
  let signY = finalY;
  if (signY + 28 > pageHeight) {
    doc.addPage();
    signY = 20;
  }

  const signX = pageWidth - 75;
  doc.setFontSize(10);
  doc.text(`Mengetahui,`, signX, signY);
  doc.text(`Pimpinan ${report.unitSetting.unit_name}`, signX, signY + 5);
  doc.text(report.unitSetting.leader_name, signX, signY + 22);
  doc.text(`NIP ${report.unitSetting.leader_nip}`, signX, signY + 27);

  return doc;
}

/**
 * Mengunduh berkas laporan PDF A4 ke perangkat pengguna.
 */
export function downloadPdfReport(report: UnitReportPayload): void {
  const doc = createPdfDocument(report);
  doc.save(`${report.fileBaseName}.pdf`);
}
