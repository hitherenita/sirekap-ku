// Berisi bilah atas aplikasi dengan navigasi peran, info pengguna aktif, dan tombol keluar.
import {LogOut, ShieldCheck} from 'lucide-react';
import {
  APP_INFO,
  NavigationSectionId,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  SECTION_LABELS,
  UserEntity,
} from '../config';

interface AppHeaderProps {
  currentUser: UserEntity;
  activeSection: NavigationSectionId;
  onSelectSection: (section: NavigationSectionId) => void;
  onLogout: () => void;
}

export default function AppHeader({
  currentUser,
  activeSection,
  onSelectSection,
  onLogout,
}: AppHeaderProps) {
  const allowedSections = ROLE_PERMISSIONS[currentUser.role].allowedSections;

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold tracking-tight text-neutral-900">
              {APP_INFO.name}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{ROLE_LABELS[currentUser.role]}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-900">
                {currentUser.full_name}
              </p>
              <p className="text-sm text-neutral-600">{currentUser.position}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 transition-colors duration-150 ease-out hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
            >
              <LogOut className="h-4 w-4 text-neutral-600" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        <nav
          aria-label="Menu utama"
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-3"
        >
          {allowedSections.map((sectionId) => {
            const isActive = activeSection === sectionId;
            return (
              <button
                key={sectionId}
                type="button"
                onClick={() => onSelectSection(sectionId)}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'min-h-[44px] rounded-xl border border-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                    : 'min-h-[44px] rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2'
                }
              >
                {SECTION_LABELS[sectionId]}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
