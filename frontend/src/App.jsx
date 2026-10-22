
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import AppLayout from './layouts/AppLayout.jsx';

import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import CyclesPage from './pages/CyclesPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import MyEvaluationsPage from './pages/MyEvaluationsPage.jsx';
import MyResultsPage from './pages/MyResultsPage.jsx';
import ReportsWorkflowPage from './pages/ReportsWorkflowPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

import {
  clearToken,
  getCurrentUser,
  getToken,
} from './services/api.js';

const pages = [
  {
    path: 'users',
    title: 'Users & roles',
    description:
      'Manage accounts and permission assignments with server-side authorization.',
  },
  {
    path: 'departments',
    title: 'Departments',
    description:
      'Maintain department records and authorized organizational scope.',
  },
  {
    path: 'academic-units',
    title: 'Academic units',
    description:
      'Organize colleges, schools, institutes, and academic units.',
  },
  {
    path: 'academic',
    title: 'Courses & instructors',
    description:
      'Manage course and instructor records and their approved assignments.',
  },
  {
    path: 'cycles',
    title: 'Evaluation cycles',
    description:
      'Configure evaluation periods, deadlines, and completion tracking.',
  },
  {
    path: 'forms',
    title: 'Official evaluation forms',
    description:
      'Configure evaluation criteria and sections from the official university forms.',
  },
  {
    path: 'tasks',
    title: 'Evaluation tasks',
    description:
      'Assign eligible evaluators and track required component submissions.',
  },
  {
    path: 'my-evaluations',
    title: 'My evaluations',
    description:
      'View assigned forms and submit evaluations securely.',
  },
  {
    path: 'my-results',
    title: 'My results',
    description:
      'View your released evaluation scores.',
  },
  {
    path: 'reports',
    title: 'Reports & workflow',
    description:
      "Route summary reports through Committee → Department Head → College → VP's Office.",
  },
  {
    path: 'audit',
    title: 'Audit trail',
    description:
      'Review authorized records of sensitive actions and workflow decisions.',
  },
  {
    path: 'settings',
    title: 'Settings',
    description:
      'Configure approved system options and user profile preferences.',
  },
];

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-navy-900" />
        Checking your session…
      </div>
    </div>
  );
}

function ProtectedWorkspace({ user, loading, onLogout }) {
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout user={user} onLogout={onLogout} />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getToken()) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        const result = await getCurrentUser();

        if (active) {
          setUser(result?.data?.user ?? null);
        }
      } catch {
        clearToken();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  function handleLogin(authenticatedUser) {
    setUser(authenticatedUser);
    navigate('/', { replace: true });
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    navigate('/login', { replace: true });
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          loading ? (
            <LoadingScreen />
          ) : (
            <LoginPage user={user} onLogin={handleLogin} />
          )
        }
      />

      <Route
        element={
          <ProtectedWorkspace
            user={user}
            loading={loading}
            onLogout={handleLogout}
          />
        }
      >
        <Route index element={<DashboardPage />} />

        {pages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={
              page.path === 'users' ? (
                <UsersPage user={user} />
              ) : page.path === 'cycles' ? (
                <CyclesPage user={user} />
              ) : page.path === 'tasks' ? (
                <TasksPage user={user} />
              ) : page.path === 'my-evaluations' ? (
                <MyEvaluationsPage user={user} />
              ) : page.path === 'my-results' ? (
                <MyResultsPage user={user} />
              ) : page.path === 'reports' ? (
                <ReportsWorkflowPage user={user} />
              ) : (
                <PlaceholderPage
                  title={page.title}
                  description={page.description}
                />
              )
            }
          />
        ))}

        <Route
          path="*"
          element={
            <PlaceholderPage
              title="Page not found"
              description="The requested page does not exist in this workspace."
            />
          }
        />
      </Route>
    </Routes>
  );
}
