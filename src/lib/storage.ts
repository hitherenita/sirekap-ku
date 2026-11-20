// Berisi fungsi pembacaan dan penyimpanan seluruh data aplikasi pada satu kunci localStorage dengan penanganan data kosong atau rusak.
import {
  AppStorageState,
  INITIAL_APP_STATE,
  ROLE_PERMISSIONS,
  STORAGE_KEY,
  UserEntity,
  UserRole,
} from '../config';

const VALID_ROLES = new Set<UserRole>(['ADMIN', 'PEGAWAI', 'PIMPINAN']);

function isValidStoredUser(value: unknown): value is UserEntity {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const u = value as Partial<UserEntity>;
  return (
    typeof u.id === 'string' &&
    u.id.length > 0 &&
    typeof u.email_or_username === 'string' &&
    typeof u.password === 'string' &&
    typeof u.full_name === 'string' &&
    typeof u.role === 'string' &&
    VALID_ROLES.has(u.role as UserRole) &&
    typeof u.is_active === 'boolean'
  );
}

function cloneInitialState(): AppStorageState {
  return {
    users: INITIAL_APP_STATE.users.map((item) => ({...item})),
    categories: INITIAL_APP_STATE.categories.map((item) => ({...item})),
    tasks: INITIAL_APP_STATE.tasks.map((item) => ({...item})),
    auditLogs: INITIAL_APP_STATE.auditLogs.map((item) => ({...item})),
    unitSetting: {...INITIAL_APP_STATE.unitSetting},
    activeUserId: INITIAL_APP_STATE.activeUserId,
  };
}

/**
 * Memuat data aplikasi dari localStorage; mengembalikan data awal bila kosong atau rusak.
 */
export function loadAppState(): AppStorageState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return cloneInitialState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneInitialState();
    }
    const parsed = JSON.parse(raw) as Partial<AppStorageState> | null;
    if (!parsed || typeof parsed !== 'object') {
      return cloneInitialState();
    }

    const validUsers = Array.isArray(parsed.users)
      ? parsed.users.filter(isValidStoredUser)
      : [];
    const hasActiveAdmin = validUsers.some(
      (user) => user.role === 'ADMIN' && user.is_active,
    );
    const resolvedUsers =
      validUsers.length > 0 && hasActiveAdmin
        ? validUsers
        : cloneInitialState().users;

    const rawActiveId =
      typeof parsed.activeUserId === 'string' ? parsed.activeUserId : null;
    const activeUser = rawActiveId
      ? resolvedUsers.find((u) => u.id === rawActiveId && u.is_active)
      : undefined;
    const resolvedActiveUserId =
      activeUser && ROLE_PERMISSIONS[activeUser.role] ? activeUser.id : null;

    return {
      users: resolvedUsers,
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
        : cloneInitialState().categories,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : cloneInitialState().tasks,
      auditLogs: Array.isArray(parsed.auditLogs)
        ? parsed.auditLogs
        : cloneInitialState().auditLogs,
      unitSetting:
        parsed.unitSetting && typeof parsed.unitSetting === 'object'
          ? {
              unit_name:
                typeof parsed.unitSetting.unit_name === 'string'
                  ? parsed.unitSetting.unit_name
                  : INITIAL_APP_STATE.unitSetting.unit_name,
              leader_name:
                typeof parsed.unitSetting.leader_name === 'string'
                  ? parsed.unitSetting.leader_name
                  : INITIAL_APP_STATE.unitSetting.leader_name,
              leader_nip:
                typeof parsed.unitSetting.leader_nip === 'string'
                  ? parsed.unitSetting.leader_nip
                  : INITIAL_APP_STATE.unitSetting.leader_nip,
            }
          : {...INITIAL_APP_STATE.unitSetting},
      activeUserId: resolvedActiveUserId,
    };
  } catch {
    return cloneInitialState();
  }
}

/**
 * Menyimpan seluruh status aplikasi ke localStorage.
 */
export function saveAppState(state: AppStorageState): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Abaikan kegagalan penulisan kuota penyimpanan agar antarmuka tidak berhenti.
  }
}
