// Berisi logika autentikasi, pembatasan hak akses peran (RBAC), dan isolasi data pengguna.
import {
  NavigationSectionId,
  ROLE_PERMISSIONS,
  UserEntity,
  UserRole,
  VALIDATION_MESSAGES,
  WorkTaskEntity,
} from '../config';

export interface AuthValidationErrors {
  username?: string;
  password?: string;
  general?: string;
}

export interface AuthResult {
  ok: boolean;
  user?: UserEntity;
  errors?: AuthValidationErrors;
}

export interface GuardResult {
  ok: boolean;
  statusCode: 200 | 403;
  error?: string;
}

/**
 * Memvalidasi input login dan mencocokkan pengguna aktif tanpa sensitif huruf besar/kecil pada username.
 */
export function authenticateUser(
  users: UserEntity[],
  rawUsername: string,
  rawPassword: string,
): AuthResult {
  const username = rawUsername.trim();
  const password = rawPassword;

  const errors: AuthValidationErrors = {};
  if (!username) {
    errors.username = 'Masukkan username atau email Anda (contoh: admin).';
  }
  if (!password) {
    errors.password = 'Masukkan kata sandi Anda (contoh: password123).';
  }
  if (errors.username || errors.password) {
    return {ok: false, errors};
  }

  const matchedUser = users.find(
    (item) => item.email_or_username.trim().toLowerCase() === username.toLowerCase(),
  );

  if (!matchedUser || matchedUser.password !== password) {
    return {
      ok: false,
      errors: {
        general: VALIDATION_MESSAGES.loginInvalid,
      },
    };
  }

  if (!matchedUser.is_active) {
    return {
      ok: false,
      errors: {
        general: VALIDATION_MESSAGES.loginInactive,
      },
    };
  }

  return {
    ok: true,
    user: matchedUser,
  };
}

/**
 * Mengambil pengguna aktif dari daftar pengguna dan memastikan akun masih berstatus aktif.
 */
export function resolveActiveUser(
  users: UserEntity[],
  activeUserId: string | null,
): UserEntity | null {
  if (!activeUserId) {
    return null;
  }
  const found = users.find((user) => user.id === activeUserId);
  if (!found || !found.is_active) {
    return null;
  }
  return found;
}

/**
 * Memeriksa apakah peran pengguna boleh membuka bagian halaman tertentu.
 */
export function canAccessSection(
  role: UserRole,
  sectionId: NavigationSectionId,
): boolean {
  return ROLE_PERMISSIONS[role].allowedSections.includes(sectionId);
}

/**
 * Mengembalikan bagian halaman awal sesuai peran pengguna.
 */
export function getDefaultSectionForRole(role: UserRole): NavigationSectionId {
  return ROLE_PERMISSIONS[role].defaultSection;
}

/**
 * Penjaga mutasi data: hanya peran ADMIN yang diizinkan mengubah data; peran lain ditolak dengan status 403.
 */
export function assertAdminRole(actorUser: UserEntity | null): GuardResult {
  if (!actorUser || !actorUser.is_active || actorUser.role !== 'ADMIN') {
    return {
      ok: false,
      statusCode: 403,
      error: VALIDATION_MESSAGES.forbiddenAction,
    };
  }
  return {
    ok: true,
    statusCode: 200,
  };
}

/**
 * Menyaring daftar tugas sesuai kewenangan peran (BL-01).
 */
export function getVisibleTasksForUser(
  tasks: WorkTaskEntity[],
  actorUser: UserEntity,
): WorkTaskEntity[] {
  if (actorUser.role === 'PEGAWAI') {
    return tasks.filter((task) => task.employee_id === actorUser.id);
  }
  return tasks;
}
