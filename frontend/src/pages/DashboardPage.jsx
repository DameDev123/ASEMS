
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
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
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
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
        throw new Error('The dashboard API returned an unexpected response.');
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
  const completion = totalAssignments > 0
    ? Math.round((submittedAssignments / totalAssignments) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gold-700">
            <span className="h-px w-6 bg-gold-500" />
            Academic performance
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[30px]">
            Evaluation overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Live evaluation statistics and recent records from ASEMS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
          className="secondary-button inline-flex items-center gap-2"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          {refreshing ? 'Refreshing…' : 'Refresh data'}
        </button>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Dashboard data could not be loaded</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="panel-card flex items-center gap-3 p-8 text-sm text-slate-600">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-navy-900" />
          Loading live dashboard data…
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="panel-card p-5 sm:p-6">
              <SectionHeading
                title="Assignment completion"
                description="Based on actual assignment statuses"
              />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-semibold text-slate-900">
                    {completion}%
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted assignments
                  </p>
                </div>
                <CheckCircle2 className="mb-1 text-teal-600" size={28} />
              </div>

              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Assignment completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{formatNumber(counts.submitted)} submitted</span>
                <span>{formatNumber(counts.total)} total assignments</span>
              </div>

              {totalAssignments === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  No assignments are available for this dashboard scope yet.
                </p>
              )}
            </div>

            <div className="panel-card p-5 sm:p-6">
              <SectionHeading
                title="Evaluation cycles"
                description="Most recent cycles returned by the API"
                action={
                  <Link
                    to="/cycles"
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-900 hover:text-gold-700"
                  >
                    View all <ArrowRight size={15} />
                  </Link>
                }
              />

              {cycles.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No evaluation cycles were found.
                </p>
              ) : (
                <div className="space-y-4">
                  {cycles.slice(0, 5).map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {cycle.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {cycle.academic_year || 'Academic year not specified'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
                        </p>
                      </div>
                      <span className={`status-pill ${statusClass(cycle.status)}`}>
                        {cycle.status || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="panel-card overflow-hidden">
            <div className="p-5 sm:p-6">
              <SectionHeading
                title="Recent evaluation activity"
                description="Latest assignment records returned by the backend"
                action={
                  <Link
                    to="/tasks"
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-900 hover:text-gold-700"
                  >
                    View tasks <ArrowRight size={15} />
                  </Link>
                }
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-y border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Form</th>
                    <th className="px-5 py-3">Instructor</th>
                    <th className="px-5 py-3">Evaluation cycle</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((item) => {
                    const status = item.evaluation_status || item.assignment_status;

                    return (
                      <tr key={item.assignment_id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {item.form_title || 'Untitled form'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.form_code || `Assignment #${item.assignment_id}`}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.instructor_name || '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {item.cycle_title || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`status-pill ${statusClass(status)}`}>
                            {status || 'Unknown'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(item.submitted_at)}
                        </td>
                      </tr>
                    );
                  })}

                  {recent.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-slate-500"
                      >
                        <Activity className="mx-auto mb-2 text-slate-400" size={22} />
                        No evaluation activity is available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-slate-400">
            Figures reflect the records returned by the current dashboard API.
            Final weighted evaluation scores are not calculated here.
          </p>
        </>
      )}
    </div>
  );
}
