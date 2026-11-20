// Berisi tampilan manajemen Data Master (Pegawai, Kategori Pekerjaan, dan Pengaturan Unit) khusus Admin.
import {
  Building2,
  CheckCircle2,
  FolderKanban,
  Pencil,
  Plus,
  Power,
  ShieldAlert,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {FormEvent, useEffect, useRef, useState} from 'react';
import {
  ROLE_LABELS,
  UnitSettingEntity,
  UserEntity,
  UserRole,
  WorkCategoryEntity,
} from '../config';
import {
  CategoryFormErrors,
  CategoryFormInput,
  toggleCategoryActive,
  toggleUserActive,
  UnitSettingErrors,
  updateUnitSetting,
  upsertCategory,
  upsertUser,
  UserFormErrors,
  UserFormInput,
} from '../lib/master';

type MasterSubTab = 'users' | 'categories' | 'unit';

interface MasterDataViewProps {
  currentUser: UserEntity;
  users: UserEntity[];
  categories: WorkCategoryEntity[];
  unitSetting: UnitSettingEntity;
  onUsersChange: (nextUsers: UserEntity[]) => void;
  onCategoriesChange: (nextCategories: WorkCategoryEntity[]) => void;
  onUnitSettingChange: (nextUnitSetting: UnitSettingEntity) => void;
}

const EMPTY_USER_FORM: UserFormInput = {
  nip_or_employee_code: '',
  full_name: '',
  position: '',
  email_or_username: '',
  password: '',
  role: 'PEGAWAI',
};

const EMPTY_CATEGORY_FORM: CategoryFormInput = {
  category_name: '',
  description: '',
};

export default function MasterDataView({
  currentUser,
  users,
  categories,
  unitSetting,
  onUsersChange,
  onCategoriesChange,
  onUnitSettingChange,
}: MasterDataViewProps) {
  const [activeTab, setActiveTab] = useState<MasterSubTab>('users');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // State modal pegawai
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>(undefined);
  const [userForm, setUserForm] = useState<UserFormInput>(EMPTY_USER_FORM);
  const [userErrors, setUserErrors] = useState<UserFormErrors>({});

  // State modal kategori
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>(
    undefined,
  );
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormInput>(EMPTY_CATEGORY_FORM);
  const [categoryErrors, setCategoryErrors] = useState<CategoryFormErrors>({});

  // State pengaturan unit
  const [unitForm, setUnitForm] = useState<UnitSettingEntity>(unitSetting);
  const [unitErrors, setUnitErrors] = useState<UnitSettingErrors>({});

  // Refs untuk memindahkan fokus ke kolom error pertama
  const nipRef = useRef<HTMLInputElement>(null);
  const fullNameRef = useRef<HTMLInputElement>(null);
  const positionRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const unitNameRef = useRef<HTMLInputElement>(null);
  const leaderNameRef = useRef<HTMLInputElement>(null);
  const leaderNipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUnitForm(unitSetting);
  }, [unitSetting]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserModalOpen(false);
        setCategoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const openCreateUserModal = () => {
    setEditingUserId(undefined);
    setUserForm(EMPTY_USER_FORM);
    setUserErrors({});
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: UserEntity) => {
    setEditingUserId(user.id);
    setUserForm({
      nip_or_employee_code: user.nip_or_employee_code,
      full_name: user.full_name,
      position: user.position,
      email_or_username: user.email_or_username,
      password: '',
      role: user.role,
    });
    setUserErrors({});
    setUserModalOpen(true);
  };

  const handleUserSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = upsertUser(users, currentUser, userForm, editingUserId);
    if (!result.ok || !result.users) {
      const errs = result.errors ?? {};
      setUserErrors(errs);
      if (errs.nip_or_employee_code) nipRef.current?.focus();
      else if (errs.full_name) fullNameRef.current?.focus();
      else if (errs.position) positionRef.current?.focus();
      else if (errs.email_or_username) usernameRef.current?.focus();
      else if (errs.password) passwordRef.current?.focus();
      return;
    }

    onUsersChange(result.users);
    setUserModalOpen(false);
    setUserErrors({});
    setFeedback({
      type: 'success',
      message: editingUserId
        ? `Data pegawai ${result.savedUser?.full_name ?? ''} berhasil diperbarui.`
        : `Pegawai baru ${result.savedUser?.full_name ?? ''} berhasil ditambahkan.`,
    });
  };

  const handleToggleUserStatus = (targetUser: UserEntity) => {
    const result = toggleUserActive(users, currentUser, targetUser.id);
    if (!result.ok || !result.users) {
      setFeedback({
        type: 'error',
        message: result.errors?.general ?? 'Gagal mengubah status pegawai.',
      });
      return;
    }
    onUsersChange(result.users);
    setFeedback({
      type: 'success',
      message: `${targetUser.full_name} kini berstatus ${
        result.savedUser?.is_active ? 'Aktif' : 'Nonaktif'
      }.`,
    });
  };

  const openCreateCategoryModal = () => {
    setEditingCategoryId(undefined);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryErrors({});
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: WorkCategoryEntity) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      category_name: category.category_name,
      description: category.description,
    });
    setCategoryErrors({});
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = upsertCategory(
      categories,
      currentUser,
      categoryForm,
      editingCategoryId,
    );
    if (!result.ok || !result.categories) {
      const errs = result.errors ?? {};
      setCategoryErrors(errs);
      if (errs.category_name) categoryNameRef.current?.focus();
      return;
    }

    onCategoriesChange(result.categories);
    setCategoryModalOpen(false);
    setCategoryErrors({});
    setFeedback({
      type: 'success',
      message: editingCategoryId
        ? `Kategori "${result.savedCategory?.category_name ?? ''}" berhasil diperbarui.`
        : `Kategori "${result.savedCategory?.category_name ?? ''}" berhasil ditambahkan.`,
    });
  };

  const handleToggleCategoryStatus = (category: WorkCategoryEntity) => {
    const result = toggleCategoryActive(categories, currentUser, category.id);
    if (!result.ok || !result.categories) {
      setFeedback({
        type: 'error',
        message: result.errors?.general ?? 'Gagal mengubah status kategori.',
      });
      return;
    }
    onCategoriesChange(result.categories);
    setFeedback({
      type: 'success',
      message: `Kategori "${category.category_name}" kini berstatus ${
        result.savedCategory?.is_active ? 'Aktif' : 'Nonaktif'
      }.`,
    });
  };

  const handleUnitSettingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = updateUnitSetting(currentUser, unitForm);
    if (!result.ok || !result.unitSetting) {
      const errs = result.errors ?? {};
      setUnitErrors(errs);
      if (errs.unit_name) unitNameRef.current?.focus();
      else if (errs.leader_name) leaderNameRef.current?.focus();
      else if (errs.leader_nip) leaderNipRef.current?.focus();
      return;
    }

    onUnitSettingChange(result.unitSetting);
    setUnitErrors({});
    setFeedback({
      type: 'success',
      message: 'Pengaturan identitas unit kerja berhasil disimpan.',
    });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Manajemen Data Master
            </h1>
            <p className="mt-1 text-base text-neutral-600">
              Kelola daftar pegawai, kategori pekerjaan, dan identitas unit kerja.
            </p>
          </div>
          {activeTab === 'users' && (
            <button
              type="button"
              onClick={openCreateUserModal}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Pegawai</span>
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              type="button"
              onClick={openCreateCategoryModal}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Kategori</span>
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Kelompok data master"
          className="mt-6 flex flex-wrap gap-2 border-t border-neutral-200 pt-4"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            onClick={() => {
              setActiveTab('users');
              setFeedback(null);
            }}
            className={
              activeTab === 'users'
                ? 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                : 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
            }
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Pegawai</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'categories'}
            onClick={() => {
              setActiveTab('categories');
              setFeedback(null);
            }}
            className={
              activeTab === 'categories'
                ? 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                : 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
            }
          >
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
            <span>Kategori</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'unit'}
            onClick={() => {
              setActiveTab('unit');
              setFeedback(null);
            }}
            className={
              activeTab === 'unit'
                ? 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                : 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
            }
          >
            <Building2 className="h-4 w-4" aria-hidden="true" />
            <span>Pengaturan Unit</span>
          </button>
        </div>

        {feedback && (
          <div
            role="status"
            className={
              feedback.type === 'success'
                ? 'mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800'
                : 'mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800'
            }
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {activeTab === 'users' && (
        <div className="rounded-2xl bg-white p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-sm font-medium text-neutral-600">
                  <th className="py-3 pr-4">NIP / Kode</th>
                  <th className="py-3 pr-4">Nama & Jabatan</th>
                  <th className="py-3 pr-4">Username</th>
                  <th className="py-3 pr-4">Peran</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-base">
                {users.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  return (
                    <tr key={user.id} className="align-middle">
                      <td className="py-3.5 pr-4 font-medium tabular-nums text-neutral-900">
                        {user.nip_or_employee_code}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-neutral-900">{user.full_name}</p>
                        <p className="text-sm text-neutral-600">{user.position}</p>
                      </td>
                      <td className="py-3.5 pr-4 text-neutral-700">
                        {user.email_or_username}
                      </td>
                      <td className="py-3.5 pr-4 text-sm font-medium text-neutral-900">
                        {ROLE_LABELS[user.role]}
                      </td>
                      <td className="py-3.5 pr-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditUserModal(user)}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                          >
                            <Pencil className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                            <span>Ubah</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleToggleUserStatus(user)}
                            title={
                              isSelf
                                ? 'Akun yang sedang dipakai tidak dapat dinonaktifkan'
                                : undefined
                            }
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                          >
                            <Power className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                            <span>{user.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="rounded-2xl bg-white p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-sm font-medium text-neutral-600">
                  <th className="py-3 pr-4">Nama Kategori</th>
                  <th className="py-3 pr-4">Keterangan</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-base">
                {categories.map((category) => (
                  <tr key={category.id} className="align-middle">
                    <td className="py-3.5 pr-4 font-medium text-neutral-900">
                      {category.category_name}
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-neutral-600">
                      {category.description || '-'}
                    </td>
                    <td className="py-3.5 pr-4">
                      {category.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCategoryModal(category)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        >
                          <Pencil className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                          <span>Ubah</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryStatus(category)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        >
                          <Power className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                          <span>{category.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'unit' && (
        <div className="rounded-2xl bg-white p-6">
          <h2 className="text-lg font-semibold text-neutral-900">
            Identitas Kop Laporan Unit
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Data ini dicetak pada kepala dan tanda tangan laporan PDF serta Excel.
          </p>

          <form
            onSubmit={handleUnitSettingSubmit}
            noValidate
            className="mt-6 max-w-xl space-y-4"
          >
            <div>
              <label
                htmlFor="unit-name"
                className="mb-1.5 block text-sm font-medium text-neutral-900"
              >
                Nama Unit Kerja
              </label>
              <input
                ref={unitNameRef}
                id="unit-name"
                name="unit_name"
                type="text"
                value={unitForm.unit_name}
                onChange={(event) => {
                  setUnitForm((prev) => ({...prev, unit_name: event.target.value}));
                  setUnitErrors((prev) => ({...prev, unit_name: undefined}));
                }}
                aria-invalid={Boolean(unitErrors.unit_name)}
                className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
              {unitErrors.unit_name && (
                <p className="mt-1.5 text-sm text-red-800">{unitErrors.unit_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="leader-name"
                className="mb-1.5 block text-sm font-medium text-neutral-900"
              >
                Nama Pimpinan
              </label>
              <input
                ref={leaderNameRef}
                id="leader-name"
                name="leader_name"
                type="text"
                value={unitForm.leader_name}
                onChange={(event) => {
                  setUnitForm((prev) => ({...prev, leader_name: event.target.value}));
                  setUnitErrors((prev) => ({...prev, leader_name: undefined}));
                }}
                aria-invalid={Boolean(unitErrors.leader_name)}
                className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
              {unitErrors.leader_name && (
                <p className="mt-1.5 text-sm text-red-800">{unitErrors.leader_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="leader-nip"
                className="mb-1.5 block text-sm font-medium text-neutral-900"
              >
                NIP / ID Pimpinan
              </label>
              <input
                ref={leaderNipRef}
                id="leader-nip"
                name="leader_nip"
                type="text"
                inputMode="numeric"
                value={unitForm.leader_nip}
                onChange={(event) => {
                  setUnitForm((prev) => ({...prev, leader_nip: event.target.value}));
                  setUnitErrors((prev) => ({...prev, leader_nip: undefined}));
                }}
                aria-invalid={Boolean(unitErrors.leader_nip)}
                className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              />
              {unitErrors.leader_nip && (
                <p className="mt-1.5 text-sm text-red-800">{unitErrors.leader_nip}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-base font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>
      )}

      {userModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <h2 id="user-modal-title" className="text-lg font-semibold text-neutral-900">
                {editingUserId ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                aria-label="Tutup dialog pegawai"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {userErrors.general && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {userErrors.general}
              </div>
            )}

            <form onSubmit={handleUserSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="user-nip"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  NIP / Kode Pegawai
                </label>
                <input
                  ref={nipRef}
                  id="user-nip"
                  name="nip_or_employee_code"
                  type="text"
                  value={userForm.nip_or_employee_code}
                  onChange={(event) => {
                    setUserForm((prev) => ({
                      ...prev,
                      nip_or_employee_code: event.target.value,
                    }));
                    setUserErrors((prev) => ({...prev, nip_or_employee_code: undefined}));
                  }}
                  placeholder="Contoh: 199501012022031001"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                {userErrors.nip_or_employee_code && (
                  <p className="mt-1.5 text-sm text-red-800">
                    {userErrors.nip_or_employee_code}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="user-fullname"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Nama Lengkap
                </label>
                <input
                  ref={fullNameRef}
                  id="user-fullname"
                  name="full_name"
                  type="text"
                  value={userForm.full_name}
                  onChange={(event) => {
                    setUserForm((prev) => ({...prev, full_name: event.target.value}));
                    setUserErrors((prev) => ({...prev, full_name: undefined}));
                  }}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                {userErrors.full_name && (
                  <p className="mt-1.5 text-sm text-red-800">{userErrors.full_name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="user-position"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Jabatan
                </label>
                <input
                  ref={positionRef}
                  id="user-position"
                  name="position"
                  type="text"
                  value={userForm.position}
                  onChange={(event) => {
                    setUserForm((prev) => ({...prev, position: event.target.value}));
                    setUserErrors((prev) => ({...prev, position: undefined}));
                  }}
                  placeholder="Contoh: Analis Data"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                {userErrors.position && (
                  <p className="mt-1.5 text-sm text-red-800">{userErrors.position}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="user-username"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Email / Username
                  </label>
                  <input
                    ref={usernameRef}
                    id="user-username"
                    name="email_or_username"
                    type="text"
                    value={userForm.email_or_username}
                    onChange={(event) => {
                      setUserForm((prev) => ({
                        ...prev,
                        email_or_username: event.target.value,
                      }));
                      setUserErrors((prev) => ({...prev, email_or_username: undefined}));
                    }}
                    placeholder="Contoh: ahmad.fauzi"
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  />
                  {userErrors.email_or_username && (
                    <p className="mt-1.5 text-sm text-red-800">
                      {userErrors.email_or_username}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="user-role"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Peran Sistem
                  </label>
                  <select
                    id="user-role"
                    name="role"
                    value={userForm.role}
                    onChange={(event) =>
                      setUserForm((prev) => ({
                        ...prev,
                        role: event.target.value as UserRole,
                      }))
                    }
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  >
                    <option value="PEGAWAI">Pegawai</option>
                    <option value="ADMIN">Admin / Sekretariat</option>
                    <option value="PIMPINAN">Pimpinan</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-password"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  {editingUserId
                    ? 'Kata Sandi Baru (kosongkan jika tetap)'
                    : 'Kata Sandi Awal'}
                </label>
                <input
                  ref={passwordRef}
                  id="user-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={userForm.password}
                  onChange={(event) => {
                    setUserForm((prev) => ({...prev, password: event.target.value}));
                    setUserErrors((prev) => ({...prev, password: undefined}));
                  }}
                  placeholder="Minimal 6 karakter"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                {userErrors.password && (
                  <p className="mt-1.5 text-sm text-red-800">{userErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <h2 id="category-modal-title" className="text-lg font-semibold text-neutral-900">
                {editingCategoryId ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                aria-label="Tutup dialog kategori"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {categoryErrors.general && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {categoryErrors.general}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="category-name"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Nama Kategori
                </label>
                <input
                  ref={categoryNameRef}
                  id="category-name"
                  name="category_name"
                  type="text"
                  value={categoryForm.category_name}
                  onChange={(event) => {
                    setCategoryForm((prev) => ({
                      ...prev,
                      category_name: event.target.value,
                    }));
                    setCategoryErrors((prev) => ({...prev, category_name: undefined}));
                  }}
                  placeholder="Contoh: Pengawasan Lapangan"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                {categoryErrors.category_name && (
                  <p className="mt-1.5 text-sm text-red-800">
                    {categoryErrors.category_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="category-desc"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Keterangan (opsional)
                </label>
                <textarea
                  id="category-desc"
                  name="description"
                  rows={3}
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Ringkasan cakupan pekerjaan"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
