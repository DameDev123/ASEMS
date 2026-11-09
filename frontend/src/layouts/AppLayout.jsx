import { useEffect, useState } from 'react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { getAssetUrl } from '../services/api.js';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LanguageSwitcher } from '../i18n/LanguageLayer.jsx';

import {
  BookOpen,
  Building2,
  CalendarDays,
  Archive,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Share2,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

/* =========================================================
   ADMIN NAVIGATION
========================================================= */

const adminGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'ORGANIZATION',
    items: [
      { label: 'Users & roles', to: '/users', icon: Users },
      { label: 'Bulk import', to: '/imports', icon: Upload },
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
    ],
  },
  {
    label: 'WORKFLOW',
    items: [
      { label: 'Leadership evaluations', to: '/leadership', icon: UserCheck },
      { label: 'Performance improvement', to: '/improvement', icon: Share2 },
      { label: 'Evaluation archives', to: '/archive', icon: Archive },
    ],
  },
  {
    label: 'REPORTING',
    items: [
      { label: 'Audit trail', to: '/audit', icon: ShieldCheck },
    ],
  },
  {
    label: 'ADMINISTRATIVE STAFF EVALUATION',
    items: [
      {
        label: 'Administrative evaluations',
        to: '/admin-evaluations',
        icon: FileText,
      },
      {
        label: 'Evaluation periods',
        to: '/admin-evaluation-periods',
        icon: CalendarDays,
      },
      {
        label: 'Performance levels',
        to: '/admin-performance-levels',
        icon: ClipboardList,
      },
      {
        label: 'Employee assignments',
        to: '/admin-assignments',
        icon: Users,
      },
      {
        label: 'Reports',
        to: '/admin-evaluation-reports',
        icon: FileText,
      },
    ],
  },
];

/* =========================================================
   STUDENT NAVIGATION
========================================================= */

const evaluationGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MY WORK',
    items: [
      { label: 'My evaluations', to: '/my-evaluations', icon: FileText },
    ],
  },
];

/* =========================================================
   INSTRUCTOR NAVIGATION
========================================================= */

const instructorGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'MY WORK',
    items: [
      { label: 'My Evaluations', to: '/my-evaluations', icon: FileText },
      {
        label: 'My Results',
        to: '/my-results',
        icon: ChartNoAxesCombined,
      },
    ],
  },
];

/* =========================================================
   MANAGEMENT NAVIGATION
========================================================= */

const managementGroups = [
  {
    label: 'OVERVIEW',
    items: [
      {
        label: 'Dashboard',
        to: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'EVALUATION',
    items: [
      {
        label: 'My evaluations',
        to: '/my-evaluations',
        icon: FileText,
      },
      {
        label: 'Reports & workflow',
        to: '/reports',
        icon: ChartNoAxesCombined,
      },
      {
        label: 'Final Evaluation Report',
        to: '/final-report',
        icon: FileText,
      },
    ],
  },
];

/* =========================================================
   LEADERSHIP EVALUATION
========================================================= */

const leadershipEvaluatorGroup = {
  label: 'LEADERSHIP EVALUATION',
  items: [
    {
      label: 'Leadership evaluations',
      to: '/leadership',
      icon: UserCheck,
    },
  ],
};

/* =========================================================
   OTHER NAVIGATION GROUPS
========================================================= */

const academicVpGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'REPORTING',
    items: [
      {
        label: 'Reports & workflow',
        to: '/reports',
        icon: ChartNoAxesCombined,
      },
    ],
  },
  leadershipEvaluatorGroup,
];

const participationGroup = {
  label: 'PARTICIPATION',
  items: [
    {
      label: 'Evaluation tasks',
      to: '/tasks',
      icon: ClipboardCheck,
    },
  ],
};

const improvementGroup = {
  label: 'IMPROVEMENT',
  items: [
    {
      label: 'Performance improvement',
      to: '/improvement',
      icon: Share2,
    },
  ],
};

const archivesGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'ARCHIVE',
    items: [
      { label: 'Evaluation archives', to: '/archive', icon: Archive },
    ],
  },
];

const concernedOfficeGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'SUPPORT PLANNING',
    items: [
      { label: 'My referrals', to: '/improvement', icon: Share2 },
    ],
  },
];

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

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

function withoutMyEvaluations(groups) {
  return groups
    .map((group) => ({
      ...group,
      items: (group.items || []).filter(
        (item) => item.to !== '/my-evaluations',
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/* =========================================================
   ROLE-BASED NAVIGATION
========================================================= */

function getBaseNavigationGroups(role) {
  switch (role) {
    // Full system administration
    case 'super_admin':
    case 'admin':
      return adminGroups;

    // Academic evaluation administration
    case 'academic_admin':
      return [
        {
          label: 'OVERVIEW',
          items: [
            { label: 'Dashboard', to: '/', icon: LayoutDashboard },
          ],
        },
        {
          label: 'ACADEMIC ORGANIZATION',
          items: [
            { label: 'Departments', to: '/departments', icon: Building2 },
            { label: 'Academic units', to: '/academic-units', icon: GraduationCap },
            { label: 'Courses & instructors', to: '/academic', icon: BookOpen },
          ],
        },
        {
          label: 'ACADEMIC EVALUATIONS',
          items: [
            { label: 'Evaluation cycles', to: '/cycles', icon: CalendarDays },
            { label: 'Official forms', to: '/forms', icon: ClipboardList },
            { label: 'Evaluation tasks', to: '/tasks', icon: ClipboardCheck },
          ],
        },
        {
          label: 'WORKFLOW',
          items: [
            { label: 'Leadership evaluations', to: '/leadership', icon: UserCheck },
            { label: 'Performance improvement', to: '/improvement', icon: Share2 },
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

    // Administrative staff evaluation administration
    case 'administrative_admin':
      return [
        {
          label: 'OVERVIEW',
          items: [
            { label: 'Dashboard', to: '/', icon: LayoutDashboard },
          ],
        },
        {
          label: 'ADMINISTRATIVE STAFF EVALUATION',
          items: [
            {
              label: 'Administrative evaluations',
              to: '/admin-evaluations',
              icon: FileText,
            },
            {
              label: 'Evaluation periods',
              to: '/admin-evaluation-periods',
              icon: CalendarDays,
            },
            {
              label: 'Performance levels',
              to: '/admin-performance-levels',
              icon: ClipboardList,
            },
            {
              label: 'Employee assignments',
              to: '/admin-assignments',
              icon: Users,
            },
          ],
        },
      ];

    case 'teacher':
      return instructorGroups;

    case 'dean':
      return [
        ...withoutMyEvaluations(managementGroups),
        leadershipEvaluatorGroup,
        improvementGroup,
      ];

    case 'academic_vp':
      return academicVpGroups;

    case 'archives':
      return archivesGroups;

    case 'concerned_office':
      return concernedOfficeGroups;

    case 'committee':
      return [
        ...withoutMyEvaluations(managementGroups),
        participationGroup,
        improvementGroup,
      ];

    case 'department_head':
      return [
        ...managementGroups,
        participationGroup,
        improvementGroup,
      ];

    case 'management':
      return withoutMyEvaluations(managementGroups);

    case 'student':
    default:
      return evaluationGroups;
  }
}





/* =========================================================
   ADMINISTRATIVE STAFF EVALUATION - EMPLOYEE / SUPERVISOR ACCESS
   Administrative employees and their supervisors sign in with their
   existing roles (dean, management, concerned_office, department_head...).
   Access to an individual evaluation is decided by the assignment on the
   server, so every non-student, non-administrator role gets this link.
   It shows an empty state when the person has no assignment.
========================================================= */

const ADMIN_EVALUATION_WORKSPACE_ROLES = new Set([
  'teacher',
  'department_head',
  'dean',
  'committee',
  'management',
  'academic_vp',
  'archives',
  'concerned_office',
]);

const myAdminEvaluationsGroup = {
  label: 'ADMINISTRATIVE EVALUATION',
  items: [
    {
      label: 'My administrative evaluations',
      to: '/my-admin-evaluations',
      icon: ClipboardCheck,
    },
  ],
};

function getNavigationGroups(role) {
  const groups = getBaseNavigationGroups(role);

  const allGroups = ADMIN_EVALUATION_WORKSPACE_ROLES.has(role)
    ? [...groups, myAdminEvaluationsGroup]
    : groups;

  // Dashboard is opened from the top bar, so the sidebar no longer lists it
  // (a group that only held the Dashboard disappears with it).
  return allGroups
    .map((group) => ({
      ...group,
      items: (group.items || []).filter((item) => item.to !== '/'),
    }))
    .filter((group) => group.items.length > 0);
}

/* =========================================================
   ACTIVE NAVIGATION GROUP
========================================================= */

function groupContainsPath(group, pathname) {
  return (group?.items || []).some(({ to }) =>
    to === '/'
      ? pathname === '/'
      : pathname === to || pathname.startsWith(`${to}/`),
  );
}

/* =========================================================
   MAIN APP LAYOUT
========================================================= */

export default function AppLayout({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigationGroups = getNavigationGroups(user?.role);
  const { pathname } = useLocation();

  const [openGroups, setOpenGroups] = useState(() => {
    const active = navigationGroups.find((group) =>
      groupContainsPath(group, pathname),
    );

    return active ? { [active.label]: true } : {};
  });

  useEffect(() => {
    const active = getNavigationGroups(user?.role).find((group) =>
      groupContainsPath(group, pathname),
    );

    if (active) {
      setOpenGroups((current) =>
        current[active.label] &&
        Object.keys(current).length === 1
          ? current
          : { [active.label]: true },
      );
    }
  }, [pathname, user?.role]);

  // Top-bar menu button: collapse/expand the sidebar on desktop, open the drawer on small screens.
  function toggleSidebar() {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setSidebarCollapsed((collapsed) => !collapsed);
    } else {
      setMobileOpen(true);
    }
  }

  function toggleGroup(label) {
    setOpenGroups((current) =>
      current[label] ? {} : { [label]: true },
    );
  }

  function closeMenus() {
    setMobileOpen(false);
    setProfileOpen(false);
  }

  function handleLogout() {
    closeMenus();
    onLogout?.();
  }

  return (
    <div className="asems-app-shell min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <style>{`
        /* Top bar and sidebar colours of the university portal (light theme).
           The app forces transparent borders (index.css), so the thin portal lines are set explicitly here. */
        html[data-theme='light'] body #root .asems-header.asems-topbar {
          background-color: #ffffff;
          color: #333333;
          border-bottom: 1px solid #d2d6de !important;
          border-bottom-color: #d2d6de !important;
        }
        html[data-theme='light'] body #root .asems-sidebar {
          background-color: #f9fafc;
          border-right: 1px solid #d2d6de !important;
          border-right-color: #d2d6de !important;
        }
        html[data-theme='light'] body #root .asems-sidebar-brand {
          background-color: #ffffff;
          border-bottom: 1px solid #d2d6de !important;
          border-bottom-color: #d2d6de !important;
        }
        html[data-theme='light'] .asems-sidebar .asems-sidebar-group,
        html[data-theme='light'] .asems-sidebar .asems-sidebar-group svg,
        html[data-theme='light'] .asems-sidebar .asems-sidebar-nav a {
          color: #444444;
        }
        html[data-theme='light'] .asems-sidebar .asems-sidebar-abbr { color: #333333; }
        html[data-theme='dark'] .asems-sidebar .asems-sidebar-abbr { color: #edf5f1; }
        .asems-topbar-icon,
        .asems-topbar-link,
        .asems-topbar-welcome { color: inherit; }
        html[data-theme='light'] .asems-topbar .asems-topbar-link:hover,
        html[data-theme='light'] .asems-topbar .asems-topbar-icon:hover { color: #3c8dbc; }
        html[data-theme='dark'] .asems-topbar .asems-topbar-link:hover,
        html[data-theme='dark'] .asems-topbar .asems-topbar-icon:hover { color: #ffcb3d; }
      `}</style>


      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`asems-sidebar fixed inset-y-0 left-0 z-40 flex w-[min(344px,88vw)] flex-col border-r border-slate-200 bg-slate-50 text-slate-900 transition-all duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-[88px]' : 'lg:w-[288px]'
        }`}
      >
        {/* UNIVERSITY BRAND HEADER */}
        <div
          className={`asems-sidebar-brand flex h-[96px] shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4 ${
            sidebarCollapsed ? 'lg:justify-center lg:px-1' : ''
          }`}
        >
          <img
            src="/mylogo.png"
            alt="Ambo University"
            className={`asems-sidebar-logo h-[76px] min-w-0 max-w-[218px] flex-1 object-contain object-left ${
              sidebarCollapsed ? 'lg:hidden' : ''
            }`}
          />

          {/* Minimised sidebar: the short name takes the place of the logo. */}
          <span
            title="AAPEMS"
            className={`asems-sidebar-abbr hidden text-center text-[15px] font-bold tracking-tight ${
              sidebarCollapsed ? 'lg:block' : ''
            }`}
          >
            AAPEMS
          </span>
        </div>

        {/* NAVIGATION */}
        <nav
          className="asems-sidebar-nav scrollbar-thin flex-1 space-y-2 overflow-y-auto px-3 py-4"
          aria-label="Main navigation"
        >
          <div className="asems-sidebar-heading px-2 pb-2 text-[15px] font-medium text-slate-500">
            Main Menu
          </div>
          {navigationGroups.map((group, index) => {
            const isOpen = Boolean(openGroups[group.label]);
            const panelId = `nav-group-${index}`;
            const items = Array.isArray(group.items) ? group.items : [];

            return (
              <section key={`${group.label}-${index}`}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={`asems-sidebar-group flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-white ${
                    isOpen
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="asems-sidebar-group-label flex min-w-0 items-center gap-3 text-[16px] font-semibold">
                    <GraduationCap size={21} strokeWidth={2} className="shrink-0 text-slate-700" />
                    <span className="truncate">{group.label.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
                  </span>

                  <ChevronRight
                    size={15}
                    aria-hidden="true"
                    className={`shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                <div
                  id={panelId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen
                      ? 'grid-rows-[1fr]'
                      : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-1 pb-2 pt-1">
                      {items.map(({ label, to, icon: Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          end={to === '/'}
                          tabIndex={isOpen ? 0 : -1}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `relative ml-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${
                              isActive
                                ? 'bg-slate-100 font-semibold text-slate-900 before:absolute before:left-0 before:h-7 before:w-1 before:rounded-r before:bg-gold-400'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`
                          }
                        >
                          {Icon && (
                            <Icon size={17} strokeWidth={1.8} />
                          )}

                          <span className="whitespace-nowrap">
                            {label}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="min-h-screen min-w-0 flex-1">

        {/* HEADER */}
        <header className="asems-header asems-topbar sticky top-0 z-20 flex h-[96px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">

          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="asems-topbar-icon shrink-0 rounded-md p-2 transition"
              aria-label="Toggle navigation"
              title="Toggle navigation"
              onClick={toggleSidebar}
            >
              <Menu size={24} strokeWidth={2.6} />
            </button>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            <NavLink
              to="/"
              end
              onClick={closeMenus}
              className={({ isActive }) =>
                `asems-topbar-link hidden items-center gap-2 text-[17px] transition sm:flex ${
                  isActive ? 'font-semibold' : ''
                }`
              }
            >
              <Home size={22} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>

            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {/* WELCOME */}
            <div className="hidden min-w-0 items-center gap-3 md:flex">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-sm font-semibold text-white">
                {user?.profilePhoto ? (
                  <img
                    src={getAssetUrl(user.profilePhoto)}
                    alt={`${user?.name || 'User'} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user)
                )}
              </span>

              <p className="asems-topbar-welcome hidden max-w-[420px] truncate text-[15px] 2xl:block">
                Welcome {user?.name || 'ASEMS User'}, Signed in as:{' '}
                <em className="font-bold underline">{formatRole(user?.role)}</em>
              </p>
            </div>

            {/* SETTINGS / ACCOUNT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open user menu"
                title="Account and settings"
                className="asems-topbar-icon rounded-md p-2 transition"
              >
                <Settings size={24} strokeWidth={2.4} />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close user menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />

                  <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {user?.name || 'ASEMS User'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user?.email || ''}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        {formatRole(user?.role)}
                      </p>
                    </div>

                    <NavLink
                      to="/settings"
                      onClick={closeMenus}
                      className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      <Settings size={16} />
                      Settings
                    </NavLink>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
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

        {/* PAGE CONTENT */}
        <main className="asems-main mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-8">
          <Outlet />
        </main>

        {/* FOOTER */}
        <footer className="asems-footer border-t border-slate-200 px-7 py-4 text-center text-xs text-slate-400">
          AAPEMS · Ambo University
        </footer>
      </div>
    </div>
  );
}