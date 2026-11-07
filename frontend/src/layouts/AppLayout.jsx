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
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
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

  return ADMIN_EVALUATION_WORKSPACE_ROLES.has(role)
    ? [...groups, myAdminEvaluationsGroup]
    : groups;
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
        className={`fixed inset-y-0 left-0 z-40 flex w-max max-w-[85vw] flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO */}
        <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200">
            <img
              src="/mylogo.png"
              alt="Ambo University Logo"
              className="h-full w-full rounded-full object-contain"
            />
          </div>

          <div>
            <div className="text-lg font-semibold tracking-wide">
              AAPEMS
            </div>
            <div className="text-[11px] text-slate-500">
              AMBO UNIVERSITY
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav
          className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-2 py-4"
          aria-label="Main navigation"
        >
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
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100 ${
                    isOpen
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="text-[11px] font-semibold tracking-[0.16em]">
                    {group.label}
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

          {/* SETTINGS */}
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition ${
                isActive
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            { <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              Settings
            </span> }
            <Settings size={15} aria-hidden="true" className="shrink-0" />
          </NavLink>
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="w-0 min-w-full rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AAPEMS workspace
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Academic evaluation and reporting
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="min-h-screen min-w-0 flex-1">

        {/* HEADER */}
        <header className="asems-header sticky top-0 z-20 flex h-[78px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">

          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="icon-button lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="hidden text-sm text-slate-500 sm:block">
              Academic Affairs
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-medium text-slate-800">
                Workspace
              </span>
            </div>

            <div className="text-sm font-semibold sm:hidden">
              AAPEMS
            </div>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <NotificationBell />
            <LanguageSwitcher />
            <ThemeToggle />

            <div className="hidden text-right md:block">
              <p className="text-xs font-medium text-slate-500">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {formatRole(user?.role)}
              </p>
            </div>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            {/* PROFILE */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open user menu"
                className="flex max-w-[220px] items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-sm font-semibold text-white">
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

                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-36 truncate text-xs font-semibold text-slate-800">
                    {user?.name || 'ASEMS User'}
                  </span>
                  <span className="block max-w-36 truncate text-[11px] text-slate-500">
                    {formatRole(user?.role)}
                  </span>
                </span>

                <ChevronDown
                  size={14}
                  className={`hidden shrink-0 text-slate-400 transition sm:block ${
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