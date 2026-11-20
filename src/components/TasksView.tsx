// Berisi tampilan daftar pekerjaan unit kerja beserta pencarian, multi-filter, dan dialog modal tambah, ubah, hapus untuk Admin.
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {FormEvent, useEffect, useMemo, useRef, useState} from 'react';
import {
  ROLE_PERMISSIONS,
  TASK_STATUS_LIST,
  TaskAuditLogEntity,
  TaskStatus,
  UserEntity,
  WorkCategoryEntity,
  WorkTaskEntity,
} from '../config';
import {formatDateId, getTodayIsoDate} from '../lib/format';
import {computeTaskDeadlineStatus} from '../lib/overdue';
import {
  countActiveAdvancedFilters,
  DEFAULT_EXPLORE_FILTER,
  exploreUnitTasks,
  OverdueFilterOption,
  TaskExploreFilter,
} from '../lib/taskExplore';
import {
  deleteTask,
  isValidHttpUrl,
  TaskFormErrors,
  TaskFormInput,
  upsertTask,
} from '../lib/tasks';
import StatusBadge from './StatusBadge';

interface TasksViewProps {
  currentUser: UserEntity;
  tasks: WorkTaskEntity[];
  auditLogs: TaskAuditLogEntity[];
  users: UserEntity[];
  categories: WorkCategoryEntity[];
  onTasksAndLogsChange: (
    nextTasks: WorkTaskEntity[],
    nextLogs: TaskAuditLogEntity[],
  ) => void;
  onSelectTaskDetail: (taskId: string) => void;
}

export default function TasksView({
  currentUser,
  tasks,
  auditLogs,
  users,
  categories,
  onTasksAndLogsChange,
  onSelectTaskDetail,
}: TasksViewProps) {
  const canMutate = ROLE_PERMISSIONS[currentUser.role].canMutateTasks;
  const todayIso = getTodayIsoDate();

  const [exploreFilter, setExploreFilter] = useState<TaskExploreFilter>(
    DEFAULT_EXPLORE_FILTER,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDateError, setFilterDateError] = useState<string | null>(null);

  const filteredTasks = useMemo(
    () => exploreUnitTasks(tasks, users, exploreFilter, todayIso),
    [tasks, users, exploreFilter, todayIso],
  );

  const activeAdvancedCount = useMemo(
    () => countActiveAdvancedFilters(exploreFilter),
    [exploreFilter],
  );
  const hasAnyFilter =
    Boolean(exploreFilter.keyword.trim()) || activeAdvancedCount > 0;

  const deadlineStatusMap = useMemo(
    () =>
      new Map(
        tasks.map((task) => [task.id, computeTaskDeadlineStatus(task, todayIso)]),
      ),
    [tasks, todayIso],
  );

  const overdueCount = useMemo(
    () =>
      tasks.reduce(
        (count, task) =>
          deadlineStatusMap.get(task.id)?.is_overdue ? count + 1 : count,
        0,
      ),
    [tasks, deadlineStatusMap],
  );

  const activeUsers = useMemo(
    () => users.filter((u) => u.is_active),
    [users],
  );
  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories],
  );

  const userNameMap = useMemo(
    () => new Map(users.map((u) => [u.id, u.full_name])),
    [users],
  );
  const categoryNameMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.category_name])),
    [categories],
  );

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>(undefined);
  const [taskForm, setTaskForm] = useState<TaskFormInput>(() => ({
    title: '',
    description: '',
    employee_id: activeUsers[0]?.id ?? '',
    category_id: activeCategories[0]?.id ?? '',
    start_date: getTodayIsoDate(),
    due_date: getTodayIsoDate(),
    status: 'Belum Dimulai',
    status_note: '',
    documentation_url: '',
    completed_date: '',
  }));
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});

  const [deleteTarget, setDeleteTarget] = useState<WorkTaskEntity | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const employeeRef = useRef<HTMLSelectElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const selectableEmployees = useMemo(() => {
    if (!editingTaskId || !taskForm.employee_id) {
      return activeUsers;
    }
    const assigned = users.find((u) => u.id === taskForm.employee_id);
    if (assigned && !assigned.is_active) {
      return [...activeUsers, assigned];
    }
    return activeUsers;
  }, [activeUsers, users, editingTaskId, taskForm.employee_id]);

  const selectableCategories = useMemo(() => {
    if (!editingTaskId || !taskForm.category_id) {
      return activeCategories;
    }
    const assigned = categories.find((c) => c.id === taskForm.category_id);
    if (assigned && !assigned.is_active) {
      return [...activeCategories, assigned];
    }
    return activeCategories;
  }, [activeCategories, categories, editingTaskId, taskForm.category_id]);

  const openCreateModal = () => {
    const today = getTodayIsoDate();
    setEditingTaskId(undefined);
    setTaskForm({
      title: '',
      description: '',
      employee_id:
        activeUsers.find((u) => u.role === 'PEGAWAI')?.id ??
        activeUsers[0]?.id ??
        '',
      category_id: activeCategories[0]?.id ?? '',
      start_date: today,
      due_date: today,
      status: 'Belum Dimulai',
      status_note: '',
      documentation_url: '',
      completed_date: '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (task: WorkTaskEntity) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description,
      employee_id: task.employee_id,
      category_id: task.category_id,
      start_date: task.start_date,
      due_date: task.due_date,
      status: task.status,
      status_note: task.status_note,
      documentation_url: task.documentation_url,
      completed_date: task.completed_at ? task.completed_at.slice(0, 10) : '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = upsertTask(
      tasks,
      auditLogs,
      users,
      categories,
      currentUser,
      taskForm,
      editingTaskId,
    );

    if (!result.ok || !result.tasks || !result.auditLogs) {
      const errs = result.errors ?? {};
      setFormErrors(errs);
      if (errs.title) titleRef.current?.focus();
      else if (errs.employee_id) employeeRef.current?.focus();
      else if (errs.category_id) categoryRef.current?.focus();
      else if (errs.start_date) startDateRef.current?.focus();
      else if (errs.due_date) dueDateRef.current?.focus();
      else if (errs.documentation_url) urlRef.current?.focus();
      return;
    }

    onTasksAndLogsChange(result.tasks, result.auditLogs);
    setModalOpen(false);
    setFormErrors({});
    setFeedback({
      type: 'success',
      message: editingTaskId
        ? `Pekerjaan "${result.savedTask?.title ?? ''}" berhasil diperbarui.`
        : `Pekerjaan "${result.savedTask?.title ?? ''}" berhasil ditambahkan.`,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) {
      return;
    }
    const result = deleteTask(tasks, auditLogs, currentUser, deleteTarget.id);
    if (!result.ok || !result.tasks || !result.auditLogs) {
      setFeedback({
        type: 'error',
        message: result.errors?.general ?? 'Gagal menghapus data pekerjaan.',
      });
      setDeleteTarget(null);
      return;
    }

    onTasksAndLogsChange(result.tasks, result.auditLogs);
    setFeedback({
      type: 'success',
      message: `Pekerjaan "${deleteTarget.title}" telah dihapus.`,
    });
    setDeleteTarget(null);
  };

  const handleFilterStartDate = (nextStart: string) => {
    if (exploreFilter.endDate && nextStart && nextStart > exploreFilter.endDate) {
      setFilterDateError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    setFilterDateError(null);
    setExploreFilter((prev) => ({...prev, startDate: nextStart}));
  };

  const handleFilterEndDate = (nextEnd: string) => {
    if (exploreFilter.startDate && nextEnd && nextEnd < exploreFilter.startDate) {
      setFilterDateError('Tanggal akhir tidak boleh lebih awal dari tanggal mulai.');
      return;
    }
    setFilterDateError(null);
    setExploreFilter((prev) => ({...prev, endDate: nextEnd}));
  };

  const handleResetFilters = () => {
    setFilterDateError(null);
    setExploreFilter(DEFAULT_EXPLORE_FILTER);
  };

  const canTestLink = isValidHttpUrl(taskForm.documentation_url);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Daftar Pekerjaan Unit
            </h1>
            <p className="mt-1 text-base text-neutral-600">
              Catat, perbarui status, dan tautkan bukti dokumentasi pekerjaan pegawai.
            </p>
          </div>
          {canMutate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Tambah Pekerjaan</span>
            </button>
          )}
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="explore-keyword"
                className="mb-1.5 block text-sm font-medium text-neutral-900"
              >
                Cari Pekerjaan
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-500"
                  aria-hidden="true"
                />
                <input
                  id="explore-keyword"
                  name="keyword"
                  type="search"
                  value={exploreFilter.keyword}
                  onChange={(e) =>
                    setExploreFilter((prev) => ({...prev, keyword: e.target.value}))
                  }
                  placeholder="Cari judul, catatan, atau nama pegawai"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white py-2.5 pr-3.5 pl-10 text-base text-neutral-900 placeholder:text-neutral-500 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((prev) => !prev)}
                className={
                  filtersOpen || activeAdvancedCount > 0
                    ? 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                    : 'inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                }
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>
                  {filtersOpen ? 'Tutup Filter' : 'Tampilkan Filter'}
                  {activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ''}
                </span>
              </button>

              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Atur Ulang Filter</span>
                </button>
              )}
            </div>
          </div>

          {filtersOpen && (
            <div className="mt-4 grid gap-4 border-t border-neutral-200 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="filter-start-date"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Dari Tanggal Tenggat
                </label>
                <input
                  id="filter-start-date"
                  type="date"
                  value={exploreFilter.startDate}
                  onChange={(e) => handleFilterStartDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-end-date"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Sampai Tanggal Tenggat
                </label>
                <input
                  id="filter-end-date"
                  type="date"
                  value={exploreFilter.endDate}
                  onChange={(e) => handleFilterEndDate(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-employee"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Pegawai
                </label>
                <select
                  id="filter-employee"
                  value={exploreFilter.employeeId}
                  onChange={(e) =>
                    setExploreFilter((prev) => ({
                      ...prev,
                      employeeId: e.target.value,
                    }))
                  }
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
                  htmlFor="filter-category"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Kategori
                </label>
                <select
                  id="filter-category"
                  value={exploreFilter.categoryId}
                  onChange={(e) =>
                    setExploreFilter((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                    }))
                  }
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

              <div>
                <label
                  htmlFor="filter-status"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Status
                </label>
                <select
                  id="filter-status"
                  value={exploreFilter.status}
                  onChange={(e) =>
                    setExploreFilter((prev) => ({
                      ...prev,
                      status: e.target.value as '' | TaskStatus,
                    }))
                  }
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  <option value="">Semua Status</option>
                  {TASK_STATUS_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-overdue"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Keterlambatan
                </label>
                <select
                  id="filter-overdue"
                  value={exploreFilter.overdueFilter}
                  onChange={(e) =>
                    setExploreFilter((prev) => ({
                      ...prev,
                      overdueFilter: e.target.value as OverdueFilterOption,
                    }))
                  }
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  <option value="SEMUA">Semua</option>
                  <option value="TERLAMBAT">Terlambat saja</option>
                  <option value="TIDAK_TERLAMBAT">Tidak terlambat</option>
                </select>
              </div>
            </div>
          )}

          {filterDateError && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {filterDateError}
            </p>
          )}
        </div>

        {overdueCount > 0 && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              {overdueCount} pekerjaan melewati tenggat waktu dan belum selesai.
            </span>
          </div>
        )}

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

      <div className="rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
          <p className="text-sm font-medium tabular-nums text-neutral-600">
            Menampilkan {filteredTasks.length} dari {tasks.length} pekerjaan
          </p>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-base text-neutral-600">
              {tasks.length === 0
                ? 'Belum ada data pekerjaan tercatat.'
                : 'Tidak ada pekerjaan yang cocok dengan filter Anda.'}
            </p>
            {hasAnyFilter && tasks.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Atur Ulang Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-sm font-medium text-neutral-600">
                  <th className="py-3 pr-4">Pekerjaan</th>
                  <th className="py-3 pr-4">Pegawai</th>
                  <th className="py-3 pr-4">Kategori</th>
                  <th className="py-3 pr-4">Tenggat Waktu</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Dokumentasi</th>
                  <th className="py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-base">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="align-top">
                    <td className="py-3.5 pr-4">
                      <button
                        type="button"
                        onClick={() => onSelectTaskDetail(task.id)}
                        className="rounded-md text-left font-medium text-neutral-900 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                      >
                        {task.title}
                      </button>
                      {task.status_note && (
                        <p className="mt-0.5 text-sm text-neutral-600">
                          {task.status_note}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-neutral-900">
                      {userNameMap.get(task.employee_id) ?? '-'}
                    </td>
                    <td className="py-3.5 pr-4 text-sm text-neutral-700">
                      {categoryNameMap.get(task.category_id) ?? '-'}
                    </td>
                    <td className="py-3.5 pr-4 text-sm tabular-nums text-neutral-900">
                      {formatDateId(task.due_date)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <StatusBadge
                        status={task.status}
                        deadlineStatus={deadlineStatusMap.get(task.id)}
                      />
                    </td>
                    <td className="py-3.5 pr-4">
                      {task.documentation_url ? (
                        <a
                          href={task.documentation_url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        >
                          <span>Buka Tautan</span>
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-sm text-neutral-500">Belum ada</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectTaskDetail(task.id)}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                        >
                          <Eye className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                          <span>Detail</span>
                        </button>
                        {canMutate && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                            >
                              <Pencil className="h-4 w-4 text-neutral-600" aria-hidden="true" />
                              <span>Ubah</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(task)}
                              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              <span>Hapus</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <h2 id="task-modal-title" className="text-lg font-semibold text-neutral-900">
                {editingTaskId ? 'Ubah Data Pekerjaan' : 'Tambah Pekerjaan Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup dialog pekerjaan"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {formErrors.general && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="task-title"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Judul Pekerjaan
                </label>
                <input
                  ref={titleRef}
                  id="task-title"
                  name="title"
                  type="text"
                  maxLength={200}
                  value={taskForm.title}
                  onChange={(event) => {
                    setTaskForm((prev) => ({...prev, title: event.target.value}));
                    setFormErrors((prev) => ({...prev, title: undefined}));
                  }}
                  placeholder="Contoh: Rekapitulasi Laporan Bulanan"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
                {formErrors.title && (
                  <p className="mt-1.5 text-sm text-red-800">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Deskripsi atau Output (opsional)
                </label>
                <textarea
                  id="task-description"
                  name="description"
                  rows={2}
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((prev) => ({...prev, description: event.target.value}))
                  }
                  placeholder="Rincian singkat pekerjaan"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-employee"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Pegawai Pelaksana
                  </label>
                  <select
                    ref={employeeRef}
                    id="task-employee"
                    name="employee_id"
                    value={taskForm.employee_id}
                    onChange={(event) => {
                      setTaskForm((prev) => ({
                        ...prev,
                        employee_id: event.target.value,
                      }));
                      setFormErrors((prev) => ({...prev, employee_id: undefined}));
                    }}
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  >
                    {selectableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                        {!emp.is_active ? ' (Nonaktif)' : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.employee_id && (
                    <p className="mt-1.5 text-sm text-red-800">
                      {formErrors.employee_id}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="task-category"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Kategori Pekerjaan
                  </label>
                  <select
                    ref={categoryRef}
                    id="task-category"
                    name="category_id"
                    value={taskForm.category_id}
                    onChange={(event) => {
                      setTaskForm((prev) => ({
                        ...prev,
                        category_id: event.target.value,
                      }));
                      setFormErrors((prev) => ({...prev, category_id: undefined}));
                    }}
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  >
                    {selectableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.category_name}
                        {!cat.is_active ? ' (Nonaktif)' : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.category_id && (
                    <p className="mt-1.5 text-sm text-red-800">
                      {formErrors.category_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-start-date"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Tanggal Mulai
                  </label>
                  <input
                    ref={startDateRef}
                    id="task-start-date"
                    name="start_date"
                    type="date"
                    value={taskForm.start_date}
                    onChange={(event) => {
                      setTaskForm((prev) => ({...prev, start_date: event.target.value}));
                      setFormErrors((prev) => ({
                        ...prev,
                        start_date: undefined,
                        due_date: undefined,
                      }));
                    }}
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  />
                  {formErrors.start_date && (
                    <p className="mt-1.5 text-sm text-red-800">
                      {formErrors.start_date}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="task-due-date"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Tenggat Waktu
                  </label>
                  <input
                    ref={dueDateRef}
                    id="task-due-date"
                    name="due_date"
                    type="date"
                    value={taskForm.due_date}
                    onChange={(event) => {
                      setTaskForm((prev) => ({...prev, due_date: event.target.value}));
                      setFormErrors((prev) => ({...prev, due_date: undefined}));
                    }}
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  />
                  {formErrors.due_date && (
                    <p className="mt-1.5 text-sm text-red-800">{formErrors.due_date}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="task-status"
                    className="mb-1.5 block text-sm font-medium text-neutral-900"
                  >
                    Status Pekerjaan
                  </label>
                  <select
                    id="task-status"
                    name="status"
                    value={taskForm.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value as TaskStatus;
                      setTaskForm((prev) => ({
                        ...prev,
                        status: nextStatus,
                        completed_date:
                          nextStatus === 'Selesai' ? prev.completed_date : '',
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        status: undefined,
                        documentation_url: undefined,
                      }));
                    }}
                    className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  >
                    {TASK_STATUS_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {taskForm.status === 'Selesai' && (
                  <div>
                    <label
                      htmlFor="task-completed-date"
                      className="mb-1.5 block text-sm font-medium text-neutral-900"
                    >
                      Tanggal Selesai (opsional)
                    </label>
                    <input
                      id="task-completed-date"
                      name="completed_date"
                      type="date"
                      value={taskForm.completed_date ?? ''}
                      onChange={(event) =>
                        setTaskForm((prev) => ({
                          ...prev,
                          completed_date: event.target.value,
                        }))
                      }
                      className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base tabular-nums text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                    />
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="task-url"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Link Dokumentasi (URL{' '}
                  {taskForm.status === 'Selesai' ? 'wajib' : 'opsional'})
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={urlRef}
                    id="task-url"
                    name="documentation_url"
                    type="url"
                    inputMode="url"
                    value={taskForm.documentation_url}
                    onChange={(event) => {
                      setTaskForm((prev) => ({
                        ...prev,
                        documentation_url: event.target.value,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        documentation_url: undefined,
                      }));
                    }}
                    placeholder="https://drive.google.com/file/d/..."
                    className="min-h-[44px] flex-1 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                  />
                  {canTestLink ? (
                    <a
                      href={taskForm.documentation_url.trim()}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                    >
                      <span>Uji Tautan</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-500">
                      Uji Tautan
                    </span>
                  )}
                </div>
                {formErrors.documentation_url && (
                  <p className="mt-1.5 text-sm text-red-800">
                    {formErrors.documentation_url}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="task-note"
                  className="mb-1.5 block text-sm font-medium text-neutral-900"
                >
                  Catatan Status (opsional)
                </label>
                <input
                  id="task-note"
                  name="status_note"
                  type="text"
                  value={taskForm.status_note}
                  onChange={(event) =>
                    setTaskForm((prev) => ({...prev, status_note: event.target.value}))
                  }
                  placeholder="Alasan penundaan, pembatalan, atau keterangan singkat"
                  className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-base text-neutral-900 focus-visible:border-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Simpan Pekerjaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-task-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
            <h2 id="delete-task-title" className="text-lg font-semibold text-neutral-900">
              Hapus Data Pekerjaan
            </h2>
            <p className="mt-2 text-base text-neutral-600">
              Apakah Anda yakin ingin menghapus pekerjaan &ldquo;{deleteTarget.title}&rdquo;?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[44px] rounded-xl bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
