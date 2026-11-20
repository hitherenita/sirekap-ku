// Berisi logika validasi dan pengelolaan data master Pegawai, Kategori Pekerjaan, serta Pengaturan Unit (FT-02).
import {
  UnitSettingEntity,
  UserEntity,
  UserRole,
  WorkCategoryEntity,
} from '../config';
import {assertAdminRole} from './auth';

export interface UserFormInput {
  nip_or_employee_code: string;
  full_name: string;
  position: string;
  email_or_username: string;
  password: string;
  role: UserRole;
}

export interface UserFormErrors {
  nip_or_employee_code?: string;
  full_name?: string;
  position?: string;
  email_or_username?: string;
  password?: string;
  role?: string;
  general?: string;
}

export interface UserMutationResult {
  ok: boolean;
  statusCode: 200 | 400 | 403;
  users?: UserEntity[];
  savedUser?: UserEntity;
  errors?: UserFormErrors;
}

export interface CategoryFormInput {
  category_name: string;
  description: string;
}

export interface CategoryFormErrors {
  category_name?: string;
  general?: string;
}

export interface CategoryMutationResult {
  ok: boolean;
  statusCode: 200 | 400 | 403;
  categories?: WorkCategoryEntity[];
  savedCategory?: WorkCategoryEntity;
  errors?: CategoryFormErrors;
}

export interface UnitSettingErrors {
  unit_name?: string;
  leader_name?: string;
  leader_nip?: string;
  general?: string;
}

export interface UnitSettingResult {
  ok: boolean;
  statusCode: 200 | 400 | 403;
  unitSetting?: UnitSettingEntity;
  errors?: UnitSettingErrors;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Menambah atau memperbarui data pegawai dengan validasi duplikat NIP dan username serta penjaga RBAC Admin.
 */
export function upsertUser(
  users: UserEntity[],
  actorUser: UserEntity | null,
  rawInput: UserFormInput,
  editingUserId?: string,
): UserMutationResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  const nip = rawInput.nip_or_employee_code.trim();
  const fullName = rawInput.full_name.trim();
  const position = rawInput.position.trim();
  const username = rawInput.email_or_username.trim();
  const password = rawInput.password;
  const role = rawInput.role;

  const errors: UserFormErrors = {};

  if (!nip) {
    errors.nip_or_employee_code =
      'Masukkan NIP atau kode pegawai (contoh: 199501012022031001).';
  } else {
    const dupNip = users.some(
      (u) =>
        u.id !== editingUserId &&
        u.nip_or_employee_code.trim().toLowerCase() === nip.toLowerCase(),
    );
    if (dupNip) {
      errors.nip_or_employee_code =
        'NIP atau kode pegawai sudah terdaftar. Gunakan kode lain yang belum terpakai.';
    }
  }

  if (!fullName) {
    errors.full_name = 'Masukkan nama lengkap pegawai (contoh: Ahmad Fauzi).';
  }

  if (!position) {
    errors.position = 'Masukkan jabatan pegawai (contoh: Analis Data).';
  }

  if (!username || /\s/.test(username)) {
    errors.email_or_username =
      'Masukkan username atau email tanpa spasi (contoh: ahmad.fauzi).';
  } else {
    const dupUser = users.some(
      (u) =>
        u.id !== editingUserId &&
        u.email_or_username.trim().toLowerCase() === username.toLowerCase(),
    );
    if (dupUser) {
      errors.email_or_username =
        'Username atau email sudah digunakan pegawai lain. Pilih nama lain.';
    }
  }

  if (!editingUserId) {
    if (password.length < 6) {
      errors.password = 'Kata sandi wajib diisi minimal 6 karakter (contoh: sandi123).';
    }
  } else if (password.length > 0 && password.length < 6) {
    errors.password = 'Kata sandi baru minimal 6 karakter (contoh: sandi123).';
  }

  if (role !== 'ADMIN' && role !== 'PEGAWAI' && role !== 'PIMPINAN') {
    errors.role = 'Pilih salah satu peran pengguna yang tersedia.';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      statusCode: 400,
      errors,
    };
  }

  const now = new Date().toISOString();

  if (editingUserId) {
    const existing = users.find((u) => u.id === editingUserId);
    if (!existing) {
      return {
        ok: false,
        statusCode: 400,
        errors: {general: 'Data pegawai yang akan diubah tidak ditemukan.'},
      };
    }

    const updatedUser: UserEntity = {
      ...existing,
      nip_or_employee_code: nip,
      full_name: fullName,
      position,
      email_or_username: username,
      password: password.length > 0 ? password : existing.password,
      role,
      updated_at: now,
    };

    return {
      ok: true,
      statusCode: 200,
      users: users.map((u) => (u.id === editingUserId ? updatedUser : u)),
      savedUser: updatedUser,
    };
  }

  const newUser: UserEntity = {
    id: generateId('usr'),
    nip_or_employee_code: nip,
    full_name: fullName,
    position,
    email_or_username: username,
    password,
    role,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  return {
    ok: true,
    statusCode: 200,
    users: [...users, newUser],
    savedUser: newUser,
  };
}

/**
 * Mengubah status aktif/nonaktif pegawai dengan larangan menonaktifkan akun diri sendiri.
 */
export function toggleUserActive(
  users: UserEntity[],
  actorUser: UserEntity | null,
  targetUserId: string,
): UserMutationResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok || !actorUser) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  if (targetUserId === actorUser.id) {
    return {
      ok: false,
      statusCode: 400,
      errors: {
        general: 'Anda tidak dapat menonaktifkan akun yang sedang dipakai saat ini.',
      },
    };
  }

  const target = users.find((u) => u.id === targetUserId);
  if (!target) {
    return {
      ok: false,
      statusCode: 400,
      errors: {general: 'Data pegawai tidak ditemukan.'},
    };
  }

  const now = new Date().toISOString();
  const updatedUser: UserEntity = {
    ...target,
    is_active: !target.is_active,
    updated_at: now,
  };

  return {
    ok: true,
    statusCode: 200,
    users: users.map((u) => (u.id === targetUserId ? updatedUser : u)),
    savedUser: updatedUser,
  };
}

/**
 * Menambah atau memperbarui kategori pekerjaan dengan validasi unik dan penjaga RBAC Admin.
 */
export function upsertCategory(
  categories: WorkCategoryEntity[],
  actorUser: UserEntity | null,
  rawInput: CategoryFormInput,
  editingCategoryId?: string,
): CategoryMutationResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  const categoryName = rawInput.category_name.trim();
  const description = rawInput.description.trim();

  const errors: CategoryFormErrors = {};
  if (!categoryName) {
    errors.category_name =
      'Masukkan nama kategori pekerjaan (contoh: Pengawasan Lapangan).';
  } else {
    const duplicate = categories.some(
      (c) =>
        c.id !== editingCategoryId &&
        c.category_name.trim().toLowerCase() === categoryName.toLowerCase(),
    );
    if (duplicate) {
      errors.category_name =
        'Nama kategori sudah ada. Masukkan nama kategori lain yang berbeda.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      statusCode: 400,
      errors,
    };
  }

  if (editingCategoryId) {
    const existing = categories.find((c) => c.id === editingCategoryId);
    if (!existing) {
      return {
        ok: false,
        statusCode: 400,
        errors: {general: 'Kategori yang akan diubah tidak ditemukan.'},
      };
    }
    const updatedCategory: WorkCategoryEntity = {
      ...existing,
      category_name: categoryName,
      description,
    };
    return {
      ok: true,
      statusCode: 200,
      categories: categories.map((c) =>
        c.id === editingCategoryId ? updatedCategory : c,
      ),
      savedCategory: updatedCategory,
    };
  }

  const newCategory: WorkCategoryEntity = {
    id: generateId('cat'),
    category_name: categoryName,
    description,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  return {
    ok: true,
    statusCode: 200,
    categories: [...categories, newCategory],
    savedCategory: newCategory,
  };
}

/**
 * Mengubah status aktif/nonaktif kategori pekerjaan.
 */
export function toggleCategoryActive(
  categories: WorkCategoryEntity[],
  actorUser: UserEntity | null,
  targetCategoryId: string,
): CategoryMutationResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  const target = categories.find((c) => c.id === targetCategoryId);
  if (!target) {
    return {
      ok: false,
      statusCode: 400,
      errors: {general: 'Data kategori tidak ditemukan.'},
    };
  }

  const updatedCategory: WorkCategoryEntity = {
    ...target,
    is_active: !target.is_active,
  };

  return {
    ok: true,
    statusCode: 200,
    categories: categories.map((c) =>
      c.id === targetCategoryId ? updatedCategory : c,
    ),
    savedCategory: updatedCategory,
  };
}

/**
 * Memvalidasi dan memperbarui pengaturan kop unit kerja untuk laporan PDF dan Excel.
 */
export function updateUnitSetting(
  actorUser: UserEntity | null,
  rawInput: UnitSettingEntity,
): UnitSettingResult {
  const guard = assertAdminRole(actorUser);
  if (!guard.ok) {
    return {
      ok: false,
      statusCode: 403,
      errors: {general: guard.error},
    };
  }

  const unitName = rawInput.unit_name.trim();
  const leaderName = rawInput.leader_name.trim();
  const leaderNip = rawInput.leader_nip.trim();

  const errors: UnitSettingErrors = {};
  if (!unitName) {
    errors.unit_name =
      'Masukkan nama unit kerja untuk kop laporan (contoh: Subbagian Data).';
  }
  if (!leaderName) {
    errors.leader_name =
      'Masukkan nama lengkap pimpinan penanda tangan laporan (contoh: Drs. Hendra Wijaya).';
  }
  if (!leaderNip) {
    errors.leader_nip =
      'Masukkan NIP atau ID pimpinan (contoh: 197504122000031002).';
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      statusCode: 400,
      errors,
    };
  }

  return {
    ok: true,
    statusCode: 200,
    unitSetting: {
      unit_name: unitName,
      leader_name: leaderName,
      leader_nip: leaderNip,
    },
  };
}
