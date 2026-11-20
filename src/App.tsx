// Berisi pengelolaan sesi pengguna aktif, pengalihan halaman sesuai peran (RBAC), dan tampilan utama SiRekap Unit.
import {Component, ErrorInfo, ReactNode, useEffect, useMemo, useState} from 'react';
import AppHeader from './components/AppHeader';
import DashboardView from './components/DashboardView';
import EmployeeTasksView from './components/EmployeeTasksView';
import LoginView from './components/LoginView';
import MasterDataView from './components/MasterDataView';
import ReportsView from './components/ReportsView';
import TaskDetailModal from './components/TaskDetailModal';
import TasksView from './components/TasksView';
import {
  AppStorageState,
  NavigationSectionId,
  ROLE_LABELS,
  SECTION_LABELS,
  STORAGE_KEY,
  UserEntity,
} from './config';
import {
  canAccessSection,
  getDefaultSectionForRole,
  getVisibleTasksForUser,
  resolveActiveUser,
} from './lib/auth';
import {loadAppState, saveAppState} from './lib/storage';
import {getTaskDetailWithTimeline} from './lib/taskDetail';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  {children: ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false};

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Tangkap error tak terduga agar layar tidak kosong di browser pengguna.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center">
            <h1 className="text-xl font-semibold text-neutral-900">
              Terjadi Gangguan Tampilan
            </h1>
            <p className="mt-2 text-base text-neutral-600">
              Muat ulang data awal aplikasi untuk memulihkan sesi Anda.
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  window.localStorage.removeItem(STORAGE_KEY);
                } catch {
                  // Abaikan jika localStorage tidak tersedia.
                }
                window.location.reload();
              }}
              className="mt-4 min-h-[44px] rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              Muat Ulang Data Awal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <SiRekapAppContent />
    </AppErrorBoundary>
  );
}

function SiRekapAppContent() {
  const [appState, setAppState] = useState<AppStorageState>(() => loadAppState());
  const currentUser = useMemo(
    () => resolveActiveUser(appState.users, appState.activeUserId),
    [appState.users, appState.activeUserId],
  );

  const [activeSection, setActiveSection] = useState<NavigationSectionId>(() => {
    if (currentUser) {
      return getDefaultSectionForRole(currentUser.role);
    }
    return 'dashboard';
  });

  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    if (currentUser && !canAccessSection(currentUser.role, activeSection)) {
      setActiveSection(getDefaultSectionForRole(currentUser.role));
    }
  }, [currentUser, activeSection]);

  const handleLoginSuccess = (user: UserEntity) => {
    setAppState((prev) => ({
      ...prev,
      activeUserId: user.id,
    }));
    setSelectedDetailTaskId(null);
    setActiveSection(getDefaultSectionForRole(user.role));
  };

  const handleLogout = () => {
    setSelectedDetailTaskId(null);
    setAppState((prev) => ({
      ...prev,
      activeUserId: null,
    }));
  };

  const handleSelectSection = (section: NavigationSectionId) => {
    if (!currentUser) {
      return;
    }
    if (!canAccessSection(currentUser.role, section)) {
      setActiveSection(getDefaultSectionForRole(currentUser.role));
      return;
    }
    setActiveSection(section);
  };

  if (!currentUser) {
    return <LoginView users={appState.users} onLoginSuccess={handleLoginSuccess} />;
  }

  const safeSection = canAccessSection(currentUser.role, activeSection)
    ? activeSection
    : getDefaultSectionForRole(currentUser.role);

  const visibleTasks = getVisibleTasksForUser(appState.tasks, currentUser);

  const detailResult = useMemo(() => {
    if (!selectedDetailTaskId) {
      return null;
    }
    return getTaskDetailWithTimeline(
      appState.tasks,
      appState.auditLogs,
      appState.users,
      appState.categories,
      currentUser,
      selectedDetailTaskId,
    );
  }, [
    selectedDetailTaskId,
    appState.tasks,
    appState.auditLogs,
    appState.users,
    appState.categories,
    currentUser,
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <AppHeader
        currentUser={currentUser}
        activeSection={safeSection}
        onSelectSection={handleSelectSection}
        onLogout={handleLogout}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {safeSection === 'dashboard' ? (
          <DashboardView
            tasks={visibleTasks}
            users={appState.users}
            categories={appState.categories}
            onSelectTaskDetail={setSelectedDetailTaskId}
          />
        ) : safeSection === 'master' && currentUser.role === 'ADMIN' ? (
          <MasterDataView
            currentUser={currentUser}
            users={appState.users}
            categories={appState.categories}
            unitSetting={appState.unitSetting}
            onUsersChange={(nextUsers) =>
              setAppState((prev) => ({...prev, users: nextUsers}))
            }
            onCategoriesChange={(nextCategories) =>
              setAppState((prev) => ({...prev, categories: nextCategories}))
            }
            onUnitSettingChange={(nextUnitSetting) =>
              setAppState((prev) => ({...prev, unitSetting: nextUnitSetting}))
            }
          />
        ) : safeSection === 'tasks' ? (
          <TasksView
            currentUser={currentUser}
            tasks={visibleTasks}
            auditLogs={appState.auditLogs}
            users={appState.users}
            categories={appState.categories}
            onTasksAndLogsChange={(nextTasks, nextLogs) =>
              setAppState((prev) => ({
                ...prev,
                tasks: nextTasks,
                auditLogs: nextLogs,
              }))
            }
            onSelectTaskDetail={setSelectedDetailTaskId}
          />
        ) : safeSection === 'my-tasks' ? (
          <EmployeeTasksView
            currentUser={currentUser}
            tasks={visibleTasks}
            categories={appState.categories}
            onSelectTaskDetail={setSelectedDetailTaskId}
          />
        ) : safeSection === 'reports' ? (
          <ReportsView
            currentUser={currentUser}
            tasks={visibleTasks}
            users={appState.users}
            categories={appState.categories}
            unitSetting={appState.unitSetting}
          />
        ) : (
          <section className="rounded-2xl bg-white p-6">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {SECTION_LABELS[safeSection]}
            </h1>
            <p className="mt-2 text-base text-neutral-600">
              Masuk sebagai {currentUser.full_name} ({ROLE_LABELS[currentUser.role]}).
              Terdapat {visibleTasks.length} tugas yang dapat Anda akses sesuai peran.
            </p>
          </section>
        )}
      </main>

      {detailResult?.ok && detailResult.detail && (
        <TaskDetailModal
          detail={detailResult.detail}
          onClose={() => setSelectedDetailTaskId(null)}
        />
      )}
    </div>
  );
}
