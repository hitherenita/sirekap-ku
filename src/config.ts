// Berisi seluruh konfigurasi bisnis, aturan validasi, daftar peran, dan data contoh awal dari PRD SiRekap Unit.

export type UserRole = 'ADMIN' | 'PEGAWAI' | 'PIMPINAN';

export type TaskStatus =
  | 'Belum Dimulai'
  | 'Dalam Proses'
  | 'Selesai'
  | 'Ditunda'
  | 'Dibatalkan';

export type AuditActionType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'LINK_UPDATED'
  | 'DETAILS_UPDATED';

export interface UserEntity {
  id: string;
  nip_or_employee_code: string;
  full_name: string;
  position: string;
  email_or_username: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkCategoryEntity {
  id: string;
  category_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkTaskEntity {
  id: string;
  title: string;
  description: string;
  employee_id: string;
  category_id: string;
  start_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  status_note: string;
  documentation_url: string;
  completed_at: string | null; // ISO timestamp atau null
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAuditLogEntity {
  id: string;
  task_id: string;
  changed_by: string;
  action_type: AuditActionType;
  field_changed: string;
  old_value: string;
  new_value: string;
  note: string;
  created_at: string;
}

export interface UnitSettingEntity {
  unit_name: string;
  leader_name: string;
  leader_nip: string;
}

export interface AppStorageState {
  users: UserEntity[];
  categories: WorkCategoryEntity[];
  tasks: WorkTaskEntity[];
  auditLogs: TaskAuditLogEntity[];
  unitSetting: UnitSettingEntity;
  activeUserId: string | null;
}

export const APP_INFO = {
  name: 'SiRekap Unit',
  fullTitle: 'Aplikasi Pengelolaan Data dan Otomatisasi Laporan Unit Kerja',
  version: 'v0.1',
} as const;

export const STORAGE_KEY = 'sirekap_unit_state_v1';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin / Sekretariat',
  PEGAWAI: 'Pegawai',
  PIMPINAN: 'Pimpinan',
};

export const TASK_STATUS_LIST: TaskStatus[] = [
  'Belum Dimulai',
  'Dalam Proses',
  'Selesai',
  'Ditunda',
  'Dibatalkan',
];

export const ACTIVE_OVERDUE_STATUSES: TaskStatus[] = [
  'Belum Dimulai',
  'Dalam Proses',
  'Ditunda',
];

export const VALIDATION_CONFIG = {
  titleMaxLength: 200,
  allowedUrlProtocols: ['http:', 'https:'] as const,
} as const;

export const VALIDATION_MESSAGES = {
  loginRequired: 'Masukkan username atau email dan kata sandi Anda.',
  loginInvalid: 'Username atau kata sandi tidak sesuai. Periksa kembali isian Anda.',
  loginInactive: 'Akun ini berstatus nonaktif. Hubungi Admin unit kerja.',
  forbiddenAction: 'Akses ditolak (403): peran Anda tidak memiliki izin untuk mengubah data.',
  invalidUrl: 'Masukkan tautan URL yang valid (diawali http:// atau https://)',
  completedUrlRequired:
    'Tautan dokumentasi wajib diisi untuk status Selesai (contoh: https://drive.google.com/file/d/xyz).',
  dueDateBeforeStart: 'Tanggal tenggat tidak boleh lebih awal dari tanggal mulai.',
} as const;

export type NavigationSectionId =
  | 'dashboard'
  | 'my-tasks'
  | 'tasks'
  | 'master'
  | 'reports';

export interface RolePermissionConfig {
  defaultSection: NavigationSectionId;
  allowedSections: NavigationSectionId[];
  canMutateTasks: boolean;
  canManageMaster: boolean;
  canExportReports: boolean;
  canViewAllTasks: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  ADMIN: {
    defaultSection: 'dashboard',
    allowedSections: ['dashboard', 'tasks', 'master', 'reports'],
    canMutateTasks: true,
    canManageMaster: true,
    canExportReports: true,
    canViewAllTasks: true,
  },
  PEGAWAI: {
    defaultSection: 'my-tasks',
    allowedSections: ['my-tasks'],
    canMutateTasks: false,
    canManageMaster: false,
    canExportReports: false,
    canViewAllTasks: false,
  },
  PIMPINAN: {
    defaultSection: 'dashboard',
    allowedSections: ['dashboard', 'tasks', 'reports'],
    canMutateTasks: false,
    canManageMaster: false,
    canExportReports: true,
    canViewAllTasks: true,
  },
};

export const SECTION_LABELS: Record<NavigationSectionId, string> = {
  dashboard: 'Ringkasan Unit',
  'my-tasks': 'Tugas Saya',
  tasks: 'Daftar Pekerjaan',
  master: 'Data Master',
  reports: 'Laporan Unit',
};

export const INITIAL_UNIT_SETTING: UnitSettingEntity = {
  unit_name: 'Unit Pengelolaan Data dan Pelaporan',
  leader_name: 'Drs. Hendra Wijaya, M.Si',
  leader_nip: '197504122000031002',
};

export const INITIAL_USERS: UserEntity[] = [
  {
    id: 'usr-admin',
    nip_or_employee_code: '198803152014022001',
    full_name: 'Siti Rahmawati',
    position: 'Admin Sekretariat Unit',
    email_or_username: 'admin',
    password: 'password123',
    role: 'ADMIN',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'usr-peg-1',
    nip_or_employee_code: '199207212019031004',
    full_name: 'Budi Santoso',
    position: 'Analis Data Unit',
    email_or_username: 'budi',
    password: 'password123',
    role: 'PEGAWAI',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'usr-peg-2',
    nip_or_employee_code: '199411052020122007',
    full_name: 'Rina Kusuma',
    position: 'Pranata Pelaporan',
    email_or_username: 'rina',
    password: 'password123',
    role: 'PEGAWAI',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'usr-pimp',
    nip_or_employee_code: '197504122000031002',
    full_name: 'Drs. Hendra Wijaya, M.Si',
    position: 'Kepala Unit Kerja',
    email_or_username: 'pimpinan',
    password: 'password123',
    role: 'PIMPINAN',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
  },
];

export const INITIAL_CATEGORIES: WorkCategoryEntity[] = [
  {
    id: 'cat-1',
    category_name: 'Pelaporan Periodik',
    description: 'Penyusunan laporan rutin bulanan dan triwulanan unit kerja.',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'cat-2',
    category_name: 'Pengolahan Data',
    description: 'Verifikasi, pembersihan, dan pemutakhiran data operasional.',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'cat-3',
    category_name: 'Koordinasi Internal',
    description: 'Penyiapan bahan rapat, notulensi, dan tindak lanjut arahan.',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'cat-4',
    category_name: 'Layanan Administrasi',
    description: 'Pengarsipan surat tugas, disposisi, dan dokumen resmi.',
    is_active: true,
    created_at: '2026-10-01T08:00:00.000Z',
  },
];

export const INITIAL_TASKS: WorkTaskEntity[] = [
  {
    id: 'tsk-101',
    title: 'Rekapitulasi Realisasi Kegiatan Oktober 2026',
    description: 'Menyusun tabulasi realisasi capaian seluruh subbagian bulan Oktober.',
    employee_id: 'usr-peg-1',
    category_id: 'cat-1',
    start_date: '2026-11-01',
    due_date: '2026-11-08',
    status: 'Selesai',
    status_note: 'Sudah diverifikasi sekretariat.',
    documentation_url: 'https://drive.google.com/file/d/contoh-rekap-oktober/view',
    completed_at: '2026-11-07T15:30:00.000Z',
    created_by: 'usr-admin',
    created_at: '2026-11-01T08:00:00.000Z',
    updated_at: '2026-11-07T15:30:00.000Z',
  },
  {
    id: 'tsk-102',
    title: 'Validasi Data Pegawai Semester II',
    description: 'Memeriksa kesesuaian NIP, jabatan, dan status keaktifan pegawai.',
    employee_id: 'usr-peg-1',
    category_id: 'cat-2',
    start_date: '2026-11-10',
    due_date: '2026-11-17',
    status: 'Dalam Proses',
    status_note: 'Menunggu konfirmasi dua subbagian.',
    documentation_url: 'https://docs.google.com/spreadsheets/d/contoh-validasi-data',
    completed_at: null,
    created_by: 'usr-admin',
    created_at: '2026-11-10T08:30:00.000Z',
    updated_at: '2026-11-16T10:15:00.000Z',
  },
  {
    id: 'tsk-103',
    title: 'Penyusunan Bahan Rapat Evaluasi Kinerja',
    description: 'Menyiapkan ringkasan grafik dan daftar kendala unit kerja.',
    employee_id: 'usr-peg-2',
    category_id: 'cat-3',
    start_date: '2026-11-12',
    due_date: '2026-11-21',
    status: 'Dalam Proses',
    status_note: 'Draf paparan sedang disusun.',
    documentation_url: '',
    completed_at: null,
    created_by: 'usr-admin',
    created_at: '2026-11-12T09:00:00.000Z',
    updated_at: '2026-11-15T14:00:00.000Z',
  },
  {
    id: 'tsk-104',
    title: 'Arsip Digital Surat Tugas Triwulan IV',
    description: 'Menautkan dokumen pindaian surat tugas ke folder resmi unit.',
    employee_id: 'usr-peg-2',
    category_id: 'cat-4',
    start_date: '2026-11-05',
    due_date: '2026-11-14',
    status: 'Selesai',
    status_note: 'Seluruh surat tugas telah tertaut.',
    documentation_url: 'https://drive.google.com/drive/folders/contoh-arsip-triwulan4',
    completed_at: '2026-11-14T16:10:00.000Z',
    created_by: 'usr-admin',
    created_at: '2026-11-05T08:00:00.000Z',
    updated_at: '2026-11-14T16:10:00.000Z',
  },
  {
    id: 'tsk-105',
    title: 'Pemutakhiran Daftar Inventaris Perangkat Kerja',
    description: 'Mencatat ulang perangkat kerja yang digunakan di ruang sekretariat.',
    employee_id: 'usr-peg-1',
    category_id: 'cat-2',
    start_date: '2026-11-12',
    due_date: '2026-11-18',
    status: 'Ditunda',
    status_note: 'Menunggu jadwal pemeriksaan bagian perlengkapan.',
    documentation_url: '',
    completed_at: null,
    created_by: 'usr-admin',
    created_at: '2026-11-12T08:15:00.000Z',
    updated_at: '2026-11-17T11:00:00.000Z',
  },
  {
    id: 'tsk-106',
    title: 'Persiapan Formulir Survei Kepuasan Layanan',
    description: 'Menyusun kuesioner daring untuk evaluasi layanan internal bulan berjalan.',
    employee_id: 'usr-peg-2',
    category_id: 'cat-1',
    start_date: '2026-11-18',
    due_date: '2026-11-26',
    status: 'Belum Dimulai',
    status_note: '',
    documentation_url: '',
    completed_at: null,
    created_by: 'usr-admin',
    created_at: '2026-11-18T08:00:00.000Z',
    updated_at: '2026-11-18T08:00:00.000Z',
  },
  {
    id: 'tsk-107',
    title: 'Rapat Koordinasi Lintas Subbagian (Edisi Khusus)',
    description: 'Agenda koordinasi tambahan yang digabungkan dengan rapat bulanan.',
    employee_id: 'usr-peg-1',
    category_id: 'cat-3',
    start_date: '2026-11-09',
    due_date: '2026-11-15',
    status: 'Dibatalkan',
    status_note: 'Digabungkan ke agenda rapat evaluasi kinerja bulanan.',
    documentation_url: '',
    completed_at: null,
    created_by: 'usr-admin',
    created_at: '2026-11-09T09:00:00.000Z',
    updated_at: '2026-11-13T10:00:00.000Z',
  },
];

export const INITIAL_AUDIT_LOGS: TaskAuditLogEntity[] = [
  {
    id: 'log-1',
    task_id: 'tsk-101',
    changed_by: 'usr-admin',
    action_type: 'CREATED',
    field_changed: 'status',
    old_value: '-',
    new_value: 'Belum Dimulai',
    note: 'Tugas dicatat oleh Admin.',
    created_at: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'log-2',
    task_id: 'tsk-101',
    changed_by: 'usr-admin',
    action_type: 'STATUS_CHANGED',
    field_changed: 'status',
    old_value: 'Dalam Proses',
    new_value: 'Selesai',
    note: 'Sudah diverifikasi sekretariat.',
    created_at: '2026-11-07T15:30:00.000Z',
  },
  {
    id: 'log-3',
    task_id: 'tsk-102',
    changed_by: 'usr-admin',
    action_type: 'CREATED',
    field_changed: 'status',
    old_value: '-',
    new_value: 'Belum Dimulai',
    note: 'Tugas dicatat oleh Admin.',
    created_at: '2026-11-10T08:30:00.000Z',
  },
  {
    id: 'log-4',
    task_id: 'tsk-102',
    changed_by: 'usr-admin',
    action_type: 'STATUS_CHANGED',
    field_changed: 'status',
    old_value: 'Belum Dimulai',
    new_value: 'Dalam Proses',
    note: 'Menunggu konfirmasi dua subbagian.',
    created_at: '2026-11-16T10:15:00.000Z',
  },
  {
    id: 'log-5',
    task_id: 'tsk-105',
    changed_by: 'usr-admin',
    action_type: 'STATUS_CHANGED',
    field_changed: 'status',
    old_value: 'Dalam Proses',
    new_value: 'Ditunda',
    note: 'Menunggu jadwal pemeriksaan bagian perlengkapan.',
    created_at: '2026-11-17T11:00:00.000Z',
  },
  {
    id: 'log-6',
    task_id: 'tsk-107',
    changed_by: 'usr-admin',
    action_type: 'STATUS_CHANGED',
    field_changed: 'status',
    old_value: 'Belum Dimulai',
    new_value: 'Dibatalkan',
    note: 'Digabungkan ke agenda rapat evaluasi kinerja bulanan.',
    created_at: '2026-11-13T10:00:00.000Z',
  },
];

export const INITIAL_APP_STATE: AppStorageState = {
  users: INITIAL_USERS,
  categories: INITIAL_CATEGORIES,
  tasks: INITIAL_TASKS,
  auditLogs: INITIAL_AUDIT_LOGS,
  unitSetting: INITIAL_UNIT_SETTING,
  activeUserId: null,
};
