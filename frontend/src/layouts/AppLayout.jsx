
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Archive,
} from 'lucide-react';

import ThemeToggle from '../components/ThemeToggle.jsx';

const adminGroups = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'ORGANIZATION',
    items: [
      { label: 'Users & roles', to: '/users', icon: Users },
      { label: 'Departments', to: '/departments', icon: Building2 },
      { label: 'Academic units', to: '/academic-units', icon: GraduationCap },
      { label: 'Courses & instructors', to: '/academic', icon: BookOpen },
    ],
  },
  {
    label: 'EVALUATIONS',
    items: [
      { label: 'Evaluation cycles', to: '/cycles', icon: CalendarDays },
      { label: 'Official forms', to: '/forms', icon: ClipboardList },
      { label: 'Evaluation tasks', to: '/tasks', icon: ClipboardCheck },
      { label: 'My evaluations', to: '/my-evaluations', icon: FileText },
    ],
  },
  {
    label: 'REPORTING',
    items: [
      { label: 'Reports & workflow', to: '/reports', icon: ChartNoAxesCombined },
      { label: 'Final Evaluation Report', to: '/final-report', icon: FileText },
      { label: 'Audit trail', to: '/audit', icon: ShieldCheck },
    ],
  },
];

const evaluationGroups = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'MY WORK',
    items: [{ label: 'My evaluations', to: '/my-evaluations', icon: FileText }],
  },
];

const instructorGroups = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'MY WORK',
    items: [
      { label: 'My Evaluations', to: '/my-evaluations', icon: FileText },
      { label: 'My Results', to: '/my-results', icon: ChartNoAxesCombined },
    ],
  },
];

const managementGroups = [
  {
    label: 'OVERVIEW',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'EVALUATION',
    items: [
      { label: 'My evaluations', to: '/my-evaluations', icon: FileText },
      { label: 'Reports & workflow', to: '/reports', icon: ChartNoAxesCombined },
      { label: 'Final Evaluation Report', to: '/final-report', icon: FileText },
    ],
  },
];

function getInitials(user) {
  const name = user?.name?.trim();

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  return user?.email?.[0]?.toUpperCase() || 'U';
}

function formatRole(role) {
  if (!role) return 'Account';

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const overviewGroup = {
  label: 'OVERVIEW',
  items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
};

const leadershipItem = {
  label: 'Leadership evaluations',
  to: '/leadership',
  icon: UserCheck,
};

const improvementItem = {
  label: 'Performance improvement',
  to: '/improvement',
  icon: TrendingUp,
};

const archiveItem = {
  label: 'Evaluation archives',
  to: '/archive',
  icon: Archive,
};

function workflowItems(role) {
  switch (role) {
    case 'admin':
      return [leadershipItem, improvementItem, archiveItem];
    case 'dean':
      return [leadershipItem, improvementItem];
    case 'academic_vp':
      return [leadershipItem];
    case 'committee':
    case 'department_head':
    case 'concerned_office':
      return [improvementItem];
    case 'archives':
      return [archiveItem];
    default:
      return [];
  }
}

function baseGroups(role) {
  switch (role) {
    case 'admin':
      return adminGroups;
    case 'teacher':
      return instructorGroups;
    case 'department_head':
    case 'committee':
    case 'dean':
    case 'management':
      return managementGroups;
    case 'academic_vp':
    case 'archives':
    case 'concerned_office':
      return [overviewGroup];
    case 'student':
    default:
      return evaluationGroups;
  }
}

function getNavigationGroups(role) {
  const base = baseGroups(role);
  const extra = workflowItems(role);

  return extra.length
    ? [...base, { label: 'WORKFLOW', items: extra }]
    : base;
}

export default function AppLayout({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigationGroups = getNavigationGroups(user?.role);

  function closeMenus() {
    setMobileOpen(false);
    setProfileOpen(false);
  }

  function handleLogout() {
    closeMenus();
    onLogout?.();
  }

  return (
    <div className="asems-app-shell min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`asems-sidebar fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-white/10 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500 text-white">
            <GraduationCap size={23} />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-wide text-white">
              ASEMS
            </div>
            <div className="asems-sidebar-heading text-[11px]">
              AMBO UNIVERSITY
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav
          className="scrollbar-thin flex-1 space-y-7 overflow-y-auto px-3 py-6"
          aria-label="Main navigation"
        >
          {navigationGroups.map((group) => (
            <section key={group.label}>
              <h2 className="asems-sidebar-heading mb-2 px-3 text-[10px] font-semibold tracking-[0.16em]">
                {group.label}
              </h2>

              <div className="space-y-1">
                {group.items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `asems-sidebar-link relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${
                        isActive
                          ? 'is-active font-semibold'
                          : ''
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r bg-gold-400"
                          />
                        )}
                        <Icon
                          size={17}
                          strokeWidth={isActive ? 2.2 : 1.8}
                          aria-hidden="true"
                        />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="asems-sidebar-footer shrink-0 border-t border-white/10 p-4">
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `asems-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive ? 'is-active font-semibold' : ''
              }`
            }
          >
            <Settings size={17} aria-hidden="true" />
            Settings
          </NavLink>

          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              ASEMS workspace
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              Academic evaluation and reporting
            </p>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="asems-header sticky top-0 z-20 flex h-[78px] items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="icon-button lg:hidden"
              aria-label="Open navigation"
              aria-controls="asems-sidebar"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="hidden text-sm sm:block">
              <span className="asems-muted">Academic Affairs</span>
              <span className="mx-2 asems-muted">/</span>
              <span className="asems-text-primary font-medium">Workspace</span>
            </div>

            <div className="asems-text-primary text-sm font-semibold sm:hidden">
              ASEMS
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <ThemeToggle />

            <div className="hidden text-right md:block">
              <p className="asems-muted text-xs font-medium">Signed in as</p>
              <p className="asems-text-primary text-sm font-semibold">
                {formatRole(user?.role)}
              </p>
            </div>

            <div className="asems-profile-divider hidden h-8 w-px sm:block" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Open user menu"
                className="asems-profile-trigger flex max-w-[220px] items-center gap-2 rounded-lg p-1.5 transition"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--asems-primary)] text-sm font-semibold text-white">
                  {getInitials(user)}
                </span>

                <span className="hidden min-w-0 text-left sm:block">
                  <span className="asems-text-primary block max-w-36 truncate text-xs font-semibold">
                    {user?.name || 'ASEMS User'}
                  </span>
                  <span className="asems-muted block max-w-36 truncate text-[11px]">
                    {formatRole(user?.role)}
                  </span>
                </span>

                <ChevronDown
                  size={14}
                  className={`asems-muted hidden shrink-0 transition sm:block ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close user menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div
                    role="menu"
                    aria-label="User profile options"
                    className="asems-themed-card absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl p-2 shadow-xl"
                  >
                    <div className="border-b border-[var(--asems-border)] px-3 py-3">
                      <p className="asems-text-primary truncate text-sm font-semibold">
                        {user?.name || 'ASEMS User'}
                      </p>
                      <p className="asems-muted mt-1 truncate text-xs">
                        {user?.email || ''}
                      </p>
                      <p className="asems-muted mt-2 text-xs font-medium">
                        {formatRole(user?.role)}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="asems-signout-button mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="asems-main mx-auto min-h-[calc(100vh-78px)] max-w-[1600px] p-4 sm:p-7 lg:p-8">
          <Outlet />
        </main>

        <footer className="asems-footer border-t px-7 py-4 text-center text-xs">
          ASEMS · Ambo University
        </footer>
      </div>
    </div>
  );
}
