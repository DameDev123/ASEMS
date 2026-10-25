
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import StatCard from '../components/StatCard.jsx';
import { apiRequest } from '../services/api.js';

function formatNumber(value) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? new Intl.NumberFormat().format(number)
    : '—';
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function statusClass(status) {
  switch (String(status || '').toLowerCase()) {
    case 'submitted':
    case 'approved':
    case 'completed':
      return 'status-green';

    case 'pending':
    case 'in_progress':
      return 'status-amber';

    case 'draft':
      return 'status-blue';

    default:
      return 'status-gray';
  }
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="asems-text-primary text-base font-semibold">
          {title}
        </h2>

        <p className="asems-muted mt-1 text-sm">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}

function DashboardLink({ to, children }) {
  return (
    <Link
      to={to}
      className="asems-dashboard-link inline-flex items-center gap-1 text-sm font-medium"
    >
      {children}
    </Link>
  );
}

function LoadingPanel() {
  return (
    <div className="asems-surface flex items-center gap-3 rounded-xl border p-8 text-sm">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--asems-border)] border-t-[var(--asems-accent)]"
        aria-hidden="true"
      />

      <span className="asems-muted">
        Loading live dashboard data…
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const response = await apiRequest('/dashboard');

      if (!response?.success || !response?.data) {
        throw new Error(
          'The dashboard API returned an unexpected response.',
        );
      }

      setDashboard(response.data);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const counts = dashboard?.counts ?? {};
  const users = dashboard?.users;
  const cycles = dashboard?.cycles ?? [];
  const recent = dashboard?.recent ?? [];

  const totalAssignments = Number(counts.total ?? 0);
  const submittedAssignments = Number(counts.submitted ?? 0);

  const completion =
    totalAssignments > 0
      ? Math.round(
          (submittedAssignments / totalAssignments) * 100,
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="asems-dashboard-eyebrow mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em]">
            <span className="h-px w-6 bg-gold-500" />
            Academic performance
          </div>

          <h1 className="asems-text-primary text-2xl font-semibold tracking-tight sm:text-[30px]">
            Evaluation overview
          </h1>

          <p className="asems-muted mt-2 max-w-2xl text-sm leading-6">
            Live evaluation statistics and recent records from ASEMS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
          className="asems-secondary-button inline-flex items-center gap-2"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
            aria-hidden="true"
          />

          {refreshing ? 'Refreshing…' : 'Refresh data'}
        </button>
      </section>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="asems-error-panel rounded-xl border p-4 text-sm"
        >
          <p className="font-semibold">
            Dashboard data could not be loaded
          </p>

          <p className="mt-1">{error}</p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <LoadingPanel />
      ) : (
        <>
          {/* Statistics */}
          <section
            aria-label="Evaluation statistics"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {users !== null && users !== undefined && (
              <StatCard
                label="Total users"
                value={formatNumber(users.total)}
                note={`${formatNumber(users.active)} active accounts`}
                icon={UsersRound}
                tone="navy"
              />
            )}

            <StatCard
              label="Active evaluation cycles"
              value={formatNumber(dashboard?.activeCycles)}
              note="Cycles currently marked active"
              icon={CalendarDays}
              tone="teal"
            />

            <StatCard
              label="Evaluation assignments"
              value={formatNumber(counts.total)}
              note={`${formatNumber(counts.submitted)} submitted`}
              icon={ClipboardCheck}
              tone="gold"
            />

            <StatCard
              label="Pending assignments"
              value={formatNumber(counts.pending)}
              note={`${formatNumber(counts.draft)} drafts`}
              icon={Clock3}
              tone="slate"
            />
          </section>

          {/* Completion and evaluation cycles */}
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="asems-surface rounded-xl border p-5 shadow-sm sm:p-6">
              <SectionHeading
                title="Assignment completion"
                description="Based on actual assignment statuses"
              />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="asems-text-primary text-3xl font-semibold">
                    {completion}%
                  </p>

                  <p className="asems-muted mt-1 text-sm">
                    Submitted assignments
                  </p>
                </div>

                <CheckCircle2
                  className="mb-1 text-teal-500"
                  size={28}
                  aria-hidden="true"
                />
              </div>

              <div
                className="asems-progress-track mt-5 h-3 overflow-hidden rounded-full"
                role="progressbar"
                aria-label="Assignment completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <div className="asems-muted mt-4 flex flex-wrap justify-between gap-2 text-xs">
                <span>
                  {formatNumber(counts.submitted)} submitted
                </span>

                <span>
                  {formatNumber(counts.total)} total assignments
                </span>
              </div>

              {totalAssignments === 0 && (
                <p className="asems-muted mt-4 text-sm">
                  No assignments are available for this dashboard scope yet.
                </p>
              )}
            </div>

            <div className="asems-surface rounded-xl border p-5 shadow-sm sm:p-6">
              <SectionHeading
                title="Evaluation cycles"
                description="Most recent cycles returned by the API"
                action={
                  <DashboardLink to="/cycles">
                    View all <ArrowRight size={15} />
                  </DashboardLink>
                }
              />

              {cycles.length === 0 ? (
                <p className="asems-muted py-4 text-sm">
                  No evaluation cycles were found.
                </p>
              ) : (
                <div className="divide-y divide-[var(--asems-border)]">
                  {cycles.slice(0, 5).map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="asems-text-primary truncate text-sm font-medium">
                          {cycle.title}
                        </p>

                        <p className="asems-muted mt-1 text-xs">
                          {cycle.academic_year ||
                            'Academic year not specified'}
                        </p>

                        <p className="asems-muted mt-1 text-xs">
                          {formatDate(cycle.start_date)} –{' '}
                          {formatDate(cycle.end_date)}
                        </p>
                      </div>

                      <span
                        className={`status-pill shrink-0 ${statusClass(cycle.status)}`}
                      >
                        {cycle.status || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent evaluation activity */}
          <section className="asems-surface overflow-hidden rounded-xl border shadow-sm">
            <div className="p-5 sm:p-6">
              <SectionHeading
                title="Recent evaluation activity"
                description="Latest assignment records returned by the backend"
                action={
                  <DashboardLink to="/tasks">
                    View tasks <ArrowRight size={15} />
                  </DashboardLink>
                }
              />
            </div>

            <div className="overflow-x-auto">
              <table className="asems-dashboard-table min-w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-3">Form</th>
                    <th className="px-5 py-3">Instructor</th>
                    <th className="px-5 py-3">Evaluation cycle</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Submitted</th>
                  </tr>
                </thead>

                <tbody>
                  {recent.map((item) => {
                    const status =
                      item.evaluation_status || item.assignment_status;

                    return (
                      <tr key={item.assignment_id}>
                        <td className="px-5 py-4">
                          <p className="asems-text-primary font-medium">
                            {item.form_title || 'Untitled form'}
                          </p>

                          <p className="asems-muted mt-1 text-xs">
                            {item.form_code ||
                              `Assignment #${item.assignment_id}`}
                          </p>
                        </td>

                        <td className="asems-table-secondary px-5 py-4">
                          {item.instructor_name || '—'}
                        </td>

                        <td className="asems-table-secondary px-5 py-4">
                          {item.cycle_title || '—'}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`status-pill ${statusClass(status)}`}
                          >
                            {status || 'Unknown'}
                          </span>
                        </td>

                        <td className="asems-muted whitespace-nowrap px-5 py-4">
                          {formatDate(item.submitted_at)}
                        </td>
                      </tr>
                    );
                  })}

                  {recent.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="asems-muted px-5 py-10 text-center text-sm"
                      >
                        <Activity
                          className="mx-auto mb-2 opacity-70"
                          size={22}
                          aria-hidden="true"
                        />

                        No evaluation activity is available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="asems-muted text-xs">
            Figures reflect the records returned by the current dashboard API.
            Final weighted evaluation scores are not calculated here.
          </p>
        </>
      )}
    </div>
  );
}
