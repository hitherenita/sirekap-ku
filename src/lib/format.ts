// Berisi fungsi pemformatan angka, persentase, tanggal, dan waktu sesuai pedoman format Indonesia.

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Mengubah string tanggal YYYY-MM-DD atau ISO timestamp ke format Indonesia (contoh: 18 November 2026).
 */
export function formatDateId(dateInput: string | null | undefined): string {
  if (!dateInput) {
    return '-';
  }
  const datePart = dateInput.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    return '-';
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = INDONESIAN_MONTHS[monthIndex];
  if (!monthName || day < 1 || day > 31) {
    return '-';
  }
  return `${day} ${monthName} ${year}`;
}

/**
 * Mengubah ISO timestamp ke format tanggal dan jam Indonesia (contoh: 18 November 2026, 15.30 WIB).
 */
export function formatDateTimeId(isoInput: string | null | undefined): string {
  if (!isoInput) {
    return '-';
  }
  const parsed = new Date(isoInput);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  const day = parsed.getDate();
  const monthName = INDONESIAN_MONTHS[parsed.getMonth()];
  const year = parsed.getFullYear();
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${day} ${monthName} ${year}, ${hours}.${minutes} WIB`;
}

/**
 * Memformat angka desimal dengan koma Indonesia tanpa angka nol berlebih di belakang.
 */
export function formatDecimalId(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const factor = Math.pow(10, maxFractionDigits);
  const rounded = Math.round(value * factor) / factor;
  return rounded.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/**
 * Memformat persentase penyelesaian (contoh: 69,57% atau 75%).
 */
export function formatPercentId(value: number): string {
  return `${formatDecimalId(value, 2)}%`;
}

/**
 * Mengambil tanggal hari ini dalam format lokal YYYY-MM-DD.
 */
export function getTodayIsoDate(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
