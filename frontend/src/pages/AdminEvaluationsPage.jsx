import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Lock,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Users,
} from 'lucide-react';

import { adminEvaluationApi as api } from '../services/adminEvaluationApi.js';
import { confirmAction } from '../utils/confirmAction.js';
import { downloadText, toCsv } from '../services/tableImport.js';

// Roles allowed to manage Administrative staffs.
// Must match ADMIN_EVALUATION_ADMINS in adminEvaluations.routes.js.
const ADMIN_EVALUATION_ADMINS = ['admin', 'super_admin', 'administrative_admin'];
const canManageAdminEvaluations = (user) =>
  ADMIN_EVALUATION_ADMINS.includes(user?.role);

const input =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-navy-800 focus:ring-2 focus:ring-navy-100';

const button =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50';

const secondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

const statusClass = {
  draft: 'status-amber',
  submitted: 'status-blue',
  agreed: 'status-green',
  disputed: 'bg-rose-50 text-rose-700',
  needs_team: 'bg-rose-50 text-rose-700',
  collecting: 'status-amber',
  ready_for_supervisor: 'status-blue',
  in_progress: 'status-amber',
  active: 'status-green',
  upcoming: 'status-blue',
  closed: 'status-gray',
};

const label = (status) =>
  ({
    draft: 'Draft',
    submitted: 'Submitted',
    agreed: 'Agreed',
    disputed: 'Disagreed',
    needs_team: 'Needs team assessors',
    collecting: 'Collecting assessments',
    ready_for_supervisor: 'Ready for supervisor',
    in_progress: 'In progress',
    active: 'Active',
    upcoming: 'Upcoming',
    closed: 'Closed',
  })[status] || status || '—';

const fmt = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : Number(value).toFixed(2).replace(/\.00$/, '');

function Notice({ error, success }) {
  return (
    <>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {success}
        </div>
      )}
    </>
  );
}

function Status({ value }) {
  return (
    <span className={`status-pill ${statusClass[value] || 'status-gray'}`}>
      {label(value)}
    </span>
  );
}

function PageHead({
  eyebrow = 'Administrative staff',
  title,
  description,
  actions,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-medium text-slate-500">{eyebrow}</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>

        {description && (
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap gap-2">{actions}</div>
      )}
    </div>
  );
}

function Loading({ text = 'Loading administrative evaluations…' }) {
  return (
    <div className="panel-card p-10 text-center text-sm text-slate-500">
      <span className="mx-auto mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-navy-900" />
      {text}
    </div>
  );
}

// Submission tracking: who has done their part. Team counts are hidden from the employee.
function ProgressChips({ progress }) {
  if (!progress) return null;
  const chip = (ok, text) => (
    <span className={`status-pill ${ok ? 'status-green' : 'status-amber'}`}>{text}</span>
  );
  return (
    <div className="flex flex-wrap gap-1.5">
      {chip(progress.selfSubmitted, progress.selfSubmitted ? 'Self ✓' : 'Self pending')}
      {progress.teamAssigned !== undefined &&
        chip(
          progress.teamAssigned > 0 && progress.teamSubmitted === progress.teamAssigned,
          progress.teamAssigned
            ? `Team ${progress.teamSubmitted}/${progress.teamAssigned}`
            : 'No team assessors',
        )}
    </div>
  );
}

/* =========================================================
   1. ADMINISTRATIVE EVALUATION DASHBOARD
   ========================================================= */

export function AdminEvaluationDashboard({ user }) {
  const admin = canManageAdminEvaluations(user);

  const [periods, setPeriods] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const p = await api.periods();

      setPeriods(Array.isArray(p) ? p : []);

      if (admin) {
        const r = await api.all();
        setRows(Array.isArray(r) ? r : []);
      } else {
        const m = await api.mine();

        setRows([
          ...(m.asEmployee || []),
          ...(m.asSupervisor || []),
        ]);
      }
    } catch (e) {
      setError(e.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    load();
  }, [load]);

  const count = (status) =>
    rows.filter((r) => r.status === status).length;

  const uniqueEmployees = new Set(
    rows.map((r) => r.employee?.userId),
  ).size;

  const cards = admin
    ? [
        ['Administrative employees assigned', uniqueEmployees, Users],
        ['Evaluation periods', periods.length, CalendarDays],
        [
          'Active periods',
          periods.filter((p) => p.status === 'active').length,
          Activity,
        ],
        ['Draft evaluations', count('draft'), FileText],
        ['Submitted evaluations', count('submitted'), ClipboardList],
        ['Agreed evaluations', count('agreed'), CheckCircle2],
        ['Disagreed evaluations', count('disputed'), Activity],
        [
          'Pending evaluations',
          count('draft') + count('submitted'),
          Activity,
        ],
      ]
    : [
        ['My assignments', rows.length, ClipboardList],
        ['Draft', count('draft'), FileText],
        ['Submitted', count('submitted'), Activity],
        ['Agreed', count('agreed'), CheckCircle2],
      ];

  const completed = rows.filter((r) =>
    ['submitted', 'agreed', 'disputed'].includes(r.status),
  ).length;

  const progress = rows.length
    ? Math.round((completed / rows.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHead
        title="Administrative evaluation dashboard"
        description="A separate workspace for six-month administrative staff performance evaluations."
        actions={
          <button
            className={secondary}
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <Notice error={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(([name, value, Icon]) => (
              <div key={name} className="panel-card p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{name}</p>
                  <Icon size={18} className="text-slate-400" />
                </div>

                <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <section className="panel-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Evaluation progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Submitted, agreed or disputed evaluations
                </p>
              </div>

              <strong className="text-2xl tabular-nums text-slate-900">
                {progress}%
              </strong>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-navy-800 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {completed} of {rows.length} assignments progressed beyond draft.
            </p>
          </section>

          <section className="panel-card overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900">
                Recent evaluations
              </h2>
            </div>

            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Period</th>
                      <th className="px-5 py-3">Supervisor</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Progress</th>
                      <th className="px-5 py-3">Open</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.slice(0, 12).map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3 font-medium">
                          {r.employee?.name}
                        </td>

                        <td className="px-5 py-3">
                          {r.period?.title}
                        </td>

                        <td className="px-5 py-3">
                          {r.supervisor?.name}
                        </td>

                        <td className="px-5 py-3">
                          <Status value={r.stage || r.status} />
                        </td>

                        <td className="px-5 py-3">
                          <ProgressChips progress={r.progress} />
                        </td>

                        <td className="px-5 py-3">
                          <Link
                            className="font-semibold text-navy-800 hover:underline"
                            to={`/admin-evaluations/${r.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                No administrative evaluations are assigned yet.
              </p>
            )}
          </section>

          <section className="panel-card p-5">
            <h2 className="font-semibold text-slate-900">
              Evaluation periods
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {periods.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-800">
                    {p.title}
                  </span>

                  <span className="ml-2">
                    <Status value={p.status} />
                  </span>
                </div>
              ))}

              {!periods.length && (
                <p className="text-sm text-slate-500">
                  No periods have been created.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* =========================================================
   2. EVALUATION PERIOD MANAGEMENT
   ========================================================= */

export function AdminEvaluationPeriodsPage({ user }) {
  const admin = canManageAdminEvaluations(user);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const d = await api.periods();

      setItems(Array.isArray(d) ? d : []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (
      !form.title.trim() ||
      !form.startDate ||
      !form.endDate ||
      form.endDate < form.startDate
    ) {
      setError(
        'Enter a period name and valid dates. End date cannot precede start date.',
      );
      return;
    }

    setSaving(true);

    try {
      await api.createPeriod(form);

      setForm({
        title: '',
        startDate: '',
        endDate: '',
      });

      setSuccess('Evaluation period created.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const change = async (period, status) => {
    if (
      !await confirmAction(
        `Change "${period.title}" to ${status}? This affects whether evaluations can be saved and submitted.`,
      )
    ) {
      return;
    }

    try {
      await api.setPeriodStatus(period.id, status);

      setSuccess(`Period status changed to ${label(status)}.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Evaluation periods"
        description="Create and manage administrative six-month evaluation periods."
        actions={
          <button className={secondary} onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <Notice error={error} success={success} />

      {admin && (
        <form
          onSubmit={submit}
          className="panel-card grid gap-3 p-5 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end"
        >
          <label className="text-sm font-medium text-slate-700">
            Period name

            <input
              className={`${input} mt-1`}
              maxLength={255}
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              placeholder="e.g. July–December 2026"
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Start date

            <input
              className={`${input} mt-1`}
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
              required
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            End date

            <input
              className={`${input} mt-1`}
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) =>
                setForm({ ...form, endDate: e.target.value })
              }
              required
            />
          </label>

          <button className={button} disabled={saving}>
            <Plus size={15} />
            {saving ? 'Creating…' : 'Create period'}
          </button>
        </form>
      )}

      {loading ? (
        <Loading />
      ) : (
        <section className="panel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Start</th>
                  <th className="px-5 py-3">End</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {p.title}
                    </td>

                    <td className="px-5 py-4">{p.startDate}</td>
                    <td className="px-5 py-4">{p.endDate}</td>

                    <td className="px-5 py-4">
                      <Status value={p.status} />
                    </td>

                    <td className="px-5 py-4">
                      {admin && (
                        <div className="flex flex-wrap gap-2">
                          {p.status !== 'active' && (
                            <button
                              className={secondary}
                              onClick={() => change(p, 'active')}
                            >
                              Activate
                            </button>
                          )}

                          {p.status !== 'closed' && (
                            <button
                              className={secondary}
                              onClick={() => change(p, 'closed')}
                            >
                              Close
                            </button>
                          )}

                          {p.status !== 'upcoming' && (
                            <button
                              className={secondary}
                              onClick={() => change(p, 'upcoming')}
                            >
                              Set upcoming
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!items.length && (
              <p className="p-10 text-center text-sm text-slate-500">
                No administrative evaluation periods found.
              </p>
            )}
          </div>
        </section>
      )}

      <p className="text-xs text-slate-500">
        The current backend supports period creation and status changes only.
        Editing an existing period's name or dates is not available in its API.
      </p>
    </div>
  );
}

/* =========================================================
   3. PERFORMANCE LEVEL MANAGEMENT
   ========================================================= */

export function AdminPerformanceLevelsPage({ user }) {
  const admin = canManageAdminEvaluations(user);

  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const d = await api.levels();

      setLevels(Array.isArray(d) ? d : []);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (index, key, value) => {
    setLevels((old) =>
      old.map((level, i) =>
        i === index
          ? { ...level, [key]: value }
          : level,
      ),
    );
  };

  const save = async () => {
    setError('');
    setSuccess('');

    if (!levels.length) {
      setError('At least one performance level is required.');
      return;
    }

    setSaving(true);

    try {
      const d = await api.saveLevels(
        levels.map((level) => ({
          name: level.name,
          minScore: Number(level.minScore),
        })),
      );

      setLevels(d);
      setSuccess('Performance levels saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Performance levels"
        description="Configure the performance-level bands used by the administrative evaluation summary."
        actions={
          <button className={secondary} onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <Notice error={error} success={success} />

      {loading ? (
        <Loading />
      ) : (
        <section className="panel-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                Configured levels
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Enter the minimum score for each level. The backend sorts
                levels by minimum score.
              </p>
            </div>

            {admin && (
              <button
                className={secondary}
                onClick={() =>
                  setLevels((v) => [
                    ...v,
                    { name: '', minScore: '' },
                  ])
                }
                disabled={levels.length >= 10}
              >
                <Plus size={15} />
                Add level
              </button>
            )}
          </div>

          <div className="space-y-3">
            {levels.map((level, i) => (
              <div
                key={i}
                className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
              >
                <label className="text-sm font-medium text-slate-700">
                  Performance level name

                  <input
                    className={`${input} mt-1`}
                    value={level.name}
                    maxLength={80}
                    onChange={(e) =>
                      update(i, 'name', e.target.value)
                    }
                    disabled={!admin}
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Minimum score (0–100)

                  <input
                    className={`${input} mt-1`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={level.minScore}
                    onChange={(e) =>
                      update(i, 'minScore', e.target.value)
                    }
                    disabled={!admin}
                  />
                </label>

                {admin && (
                  <button
                    className="h-10 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    onClick={() =>
                      setLevels((v) =>
                        v.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {!levels.length && (
            <p className="py-8 text-center text-sm text-slate-500">
              No performance levels configured yet.
            </p>
          )}

          {admin && (
            <div className="mt-5 flex justify-end">
              <button
                className={button}
                onClick={save}
                disabled={saving}
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save levels'}
              </button>
            </div>
          )}
        </section>
      )}

      <p className="text-xs text-slate-500">
        Backend validation requires 1–10 unique names, unique minimum
        scores, a lowest minimum score of 0, and values from 0 to 100.
        The API replaces the complete level set; no separate delete
        endpoint exists.
      </p>
    </div>
  );
}

/* =========================================================
   4. ADMINISTRATIVE EMPLOYEE ASSIGNMENTS
   ========================================================= */

export function AdminAssignmentsPage({ user }) {
  const admin = canManageAdminEvaluations(user);

  const [periods, setPeriods] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [rows, setRows] = useState([]);

  const [periodId, setPeriodId] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [p, a, candidates] = await Promise.all([
        api.periods(),
        api.all(),
        api.candidates(),
      ]);

      setPeriods(p);
      setRows(a);
      setEmployees(candidates.employees || []);
      setSupervisors(candidates.supervisors || []);

      if (
        !periodId &&
        p.find((period) => period.status === 'active')
      ) {
        setPeriodId(
          String(p.find((period) => period.status === 'active').id),
        );
      }
    } catch (e) {
      setError(e.message || 'Unable to load assignment data.');
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    if (admin) {
      load();
    }
  }, [admin, load]);

  const departments = [
    ...new Set(
      employees.map(
        (e) => e.departmentName || e.department || 'Unspecified',
      ),
    ),
  ];

  const assigned = new Set(
    rows
      .filter(
        (r) => String(r.period?.id) === String(periodId),
      )
      .map((r) => String(r.employee?.userId)),
  );

  const visible = employees.filter((e) => {
    const id = String(e.userId ?? e.id);

    const matchesSearch = `${e.name} ${id} ${e.jobTitle || ''}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesDepartment =
      !department ||
      (e.departmentName || e.department || 'Unspecified') === department;

    return (
      matchesSearch &&
      matchesDepartment &&
      !assigned.has(id)
    );
  });

  const assign = async () => {
    setError('');
    setSuccess('');

    if (!periodId || !selected.length || !supervisorId) {
      setError(
        'Choose an evaluation period, at least one employee, and a supervisor.',
      );
      return;
    }

    setSaving(true);

    try {
      const result = await api.assign(
        periodId,
        selected.map((employeeUserId) => ({
          employeeUserId,
          supervisorUserId: supervisorId,
        })),
      );

      setSuccess(
        `${result.created || 0} assignment(s) created. ${
          result.skipped?.length || 0
        } skipped.`,
      );

      setSelected([]);

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Administrative employee assignments"
        description="Assign administrative employees to a period and an immediate supervisor. Academic staff are excluded."
        actions={
          <button className={secondary} onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <Notice error={error} success={success} />

      {!admin ? (
        <div className="panel-card p-8 text-sm text-rose-700">
          Only system administrators can manage assignments.
        </div>
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <section className="panel-card grid gap-4 p-5 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Evaluation period

              <select
                className={`${input} mt-1`}
                value={periodId}
                onChange={(e) => {
                  setPeriodId(e.target.value);
                  setSelected([]);
                }}
              >
                <option value="">Select period</option>

                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({label(p.status)})
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Assigned supervisor

              <select
                className={`${input} mt-1`}
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
              >
                <option value="">Select supervisor</option>

                {supervisors.map((s) => (
                  <option
                    key={s.userId ?? s.id}
                    value={s.userId ?? s.id}
                  >
                    {s.name} · {s.role || s.jobTitle || 'Staff'} · ID{' '}
                    {s.userId ?? s.id}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                className={`${button} w-full`}
                disabled={
                  saving ||
                  !selected.length ||
                  !periodId ||
                  !supervisorId
                }
                onClick={assign}
              >
                <Users size={15} />
                {saving
                  ? 'Assigning…'
                  : `Assign ${selected.length} selected`}
              </button>
            </div>
          </section>

          <section className="panel-card overflow-hidden">
            <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_240px_auto]">
              <label className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-3 text-slate-400"
                />

                <input
                  className={`${input} pl-9`}
                  placeholder="Search employee name or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <select
                className={input}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">All departments</option>

                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <button
                className={secondary}
                onClick={() =>
                  setSelected(
                    visible.map((e) =>
                      String(e.userId ?? e.id),
                    ),
                  )
                }
              >
                Select visible
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Select</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Job title</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visible.map((e) => {
                    const id = String(e.userId ?? e.id);

                    return (
                      <tr key={id}>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`Select ${e.name}`}
                            type="checkbox"
                            checked={selected.includes(id)}
                            onChange={(event) =>
                              setSelected((v) =>
                                event.target.checked
                                  ? [...v, id]
                                  : v.filter((x) => x !== id),
                              )
                            }
                          />
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {e.name}
                        </td>

                        <td className="px-4 py-3">{id}</td>

                        <td className="px-4 py-3">
                          {e.departmentName || e.department || '—'}
                        </td>

                        <td className="px-4 py-3">
                          {e.jobTitle || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {!visible.length && (
                <p className="p-8 text-center text-sm text-slate-500">
                  No unassigned administrative employees found.
                  Confirm that employees are registered with employee
                  type "administrative" in Organization → Departments.
                </p>
              )}
            </div>
          </section>

          <section className="panel-card overflow-hidden">
            <h2 className="border-b border-slate-100 p-5 font-semibold">
              Current assignments
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Supervisor</th>
                    <th className="px-5 py-3">Period</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {rows
                    .filter(
                      (r) =>
                        !periodId ||
                        String(r.period?.id) === String(periodId),
                    )
                    .map((r) => (
                      <tr key={r.id}>
                        <td className="px-5 py-3">
                          {r.employee?.name}
                        </td>

                        <td className="px-5 py-3">
                          {r.supervisor?.name}
                        </td>

                        <td className="px-5 py-3">
                          {r.period?.title}
                        </td>

                        <td className="px-5 py-3">
                          <Status value={r.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-xs text-slate-500">
            Employees listed here are active accounts whose staff type is
            Administrative. Set it in Users &amp; roles when creating or
            editing an account. Supervisors are active staff accounts.
          </p>
        </>
      )}
    </div>
  );
}

/* =========================================================
   5. MY ADMINISTRATIVE EVALUATIONS
   One workspace for the three evaluator roles:
   employee (self-assessment), supervisor, team assessor.
   ========================================================= */

function ListSection({ title, hint, children }) {
  return (
    <section className="panel-card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const th = 'px-5 py-3';
const openLink = 'font-semibold text-navy-800 hover:underline';

export function AdminEvaluationMinePage() {
  const [mine, setMine] = useState({
    asEmployee: [],
    asSupervisor: [],
    asTeamMember: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      setMine(await api.mine());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const asEmployee = mine.asEmployee || [];
  const asSupervisor = mine.asSupervisor || [];
  const asTeamMember = mine.asTeamMember || [];
  const empty = !asEmployee.length && !asSupervisor.length && !asTeamMember.length;

  return (
    <div className="space-y-6">
      <PageHead
        title="My administrative evaluations"
        description="Your own self-assessment, the staff you supervise, and the colleagues you were asked to assess as a team member."
        actions={
          <button className={secondary} onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      <Notice error={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          {asEmployee.length > 0 && (
            <ListSection
              title="My evaluation (self-assessment)"
              hint="Enter and submit your self-assessment (5 points). The rest stays confidential until your supervisor submits."
            >
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className={th}>Period</th>
                    <th className={th}>Supervisor</th>
                    <th className={th}>Status</th>
                    <th className={th}>My self-assessment</th>
                    <th className={th}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asEmployee.map((r) => (
                    <tr key={`e-${r.id}`}>
                      <td className="px-5 py-4 font-medium">{r.period?.title}</td>
                      <td className="px-5 py-4">{r.supervisor?.name}</td>
                      <td className="px-5 py-4"><Status value={r.stage || r.status} /></td>
                      <td className="px-5 py-4">
                        <span className={`status-pill ${r.progress?.selfSubmitted ? 'status-green' : 'status-amber'}`}>
                          {r.progress?.selfSubmitted ? 'Submitted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link className={openLink} to={`/admin-evaluations/${r.id}`}>
                          Open evaluation
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ListSection>
          )}

          {asTeamMember.length > 0 && (
            <ListSection
              title="Team assessments I must complete"
              hint="Enter your own team assessment (15 points) for each colleague. You see only your own assessment."
            >
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className={th}>Colleague</th>
                    <th className={th}>Period</th>
                    <th className={th}>My assessment</th>
                    <th className={th}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asTeamMember.map((r) => (
                    <tr key={`t-${r.id}`}>
                      <td className="px-5 py-4 font-medium">{r.employee?.name}</td>
                      <td className="px-5 py-4">{r.period?.title}</td>
                      <td className="px-5 py-4">
                        <span className={`status-pill ${r.submitted ? 'status-green' : 'status-amber'}`}>
                          {r.submitted ? 'Submitted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link className={openLink} to={`/admin-evaluations/${r.id}`}>
                          {r.open ? 'Assess' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ListSection>
          )}

          {asSupervisor.length > 0 && (
            <ListSection
              title="Staff I supervise"
              hint="Planned results (70) and your assessment (10). You can submit once the self-assessment and every team assessment are in."
            >
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className={th}>Employee</th>
                    <th className={th}>Period</th>
                    <th className={th}>Status</th>
                    <th className={th}>Progress</th>
                    <th className={th}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asSupervisor.map((r) => (
                    <tr key={`s-${r.id}`}>
                      <td className="px-5 py-4 font-medium">{r.employee?.name}</td>
                      <td className="px-5 py-4">{r.period?.title}</td>
                      <td className="px-5 py-4"><Status value={r.stage || r.status} /></td>
                      <td className="px-5 py-4"><ProgressChips progress={r.progress} /></td>
                      <td className="px-5 py-4">
                        <Link className={openLink} to={`/admin-evaluations/${r.id}`}>
                          Open evaluation
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ListSection>
          )}

          {empty && (
            <section className="panel-card p-10 text-center text-sm text-slate-500">
              No administrative evaluation tasks are linked to your account.
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================================
   6. INDIVIDUAL EVALUATION
   One page, panels depend on the person's role in this
   evaluation. Nobody can complete another role's part.
   ========================================================= */

const panel = 'panel-card space-y-4 p-5';
const panelTitle = 'text-base font-semibold text-slate-900';
const hintText = 'text-xs text-slate-500';

function Field({ label: text, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{text}</span>
      {children}
      {hint && <span className={`mt-1 block ${hintText}`}>{hint}</span>}
    </label>
  );
}

function ResultTable({ summary, teamCount }) {
  const c = summary?.consolidated || {};
  const rows = [
    ['Performance against planned results', 70, c.plan, 'Average of the quarter plan scores'],
    ['Self-assessment', 5, c.self, 'Employee'],
    ['Team assessment', 15, c.team, teamCount ? `Average of ${teamCount} team assessors` : 'Team assessors'],
    ['Immediate supervisor assessment', 10, c.supervisor, 'Immediate supervisor'],
    ['Work-related behavioral competencies', 30, c.behavioral, 'Self + team + supervisor (calculated)'],
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Component</th>
            <th className="px-4 py-3">Maximum</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(([name, max, value, source]) => (
            <tr key={name}>
              <td className="px-4 py-3 font-medium">{name}</td>
              <td className="px-4 py-3">{max}</td>
              <td className="px-4 py-3 font-semibold">{fmt(value)}</td>
              <td className="px-4 py-3 text-slate-500">{source}</td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td className="px-4 py-3 font-bold">Total</td>
            <td className="px-4 py-3 font-bold">100</td>
            <td className="px-4 py-3 font-bold">{fmt(c.total)}</td>
            <td className="px-4 py-3 font-bold">{c.level || '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function AdminEvaluationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const [selfScore, setSelfScore] = useState('');
  const [teamScore, setTeamScore] = useState('');
  const [teamComment, setTeamComment] = useState('');
  const [supervisorScore, setSupervisorScore] = useState('');
  const [strengths, setStrengths] = useState('');
  const [gaps, setGaps] = useState('');
  const [quarters, setQuarters] = useState([]);
  const [reason, setReason] = useState('');
  const [assessors, setAssessors] = useState([]);
  const [staff, setStaff] = useState([]);

  const seed = useCallback((d) => {
    setItem(d);
    setSelfScore(d.self?.score ?? '');
    setTeamScore(d.team?.mine?.score ?? '');
    setTeamComment(d.team?.mine?.comment ?? '');
    setSupervisorScore(d.summary?.consolidated?.supervisor ?? '');
    setStrengths(d.strengths || '');
    setGaps(d.gaps || '');

    const saved = d.summary?.quarters || [];
    setQuarters(
      [1, 2, 3, 4].map((n) => {
        const found = saved.find((q) => q.seq === n);
        return { seq: n, label: found?.label || `Quarter ${n}`, planScore: found?.plan ?? '' };
      }),
    );

    setAssessors((d.team?.members || []).map((m) => m.userId));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const d = await api.get(id);
      seed(d);

      if (d.permissions?.canManageTeam) {
        const candidates = await api.candidates();
        setStaff(candidates.supervisors || []);
      }

      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, seed]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(fn, message, confirmText) {
    if (confirmText && !(await confirmAction(confirmText))) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      seed(await fn());
      setSuccess(message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  if (!item) {
    return (
      <div className="space-y-4">
        <Notice error={error || 'Evaluation not found.'} />
        <button className={secondary} onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  const perm = item.permissions || {};
  const relation = item.relation;
  const isEmployee = relation === 'employee';
  const isSupervisor = relation === 'supervisor';
  const isAdminView = relation === 'admin';
  const isTeamMember = relation === 'team_member';
  const fullView = isSupervisor || isAdminView;
  const finalized = ['submitted', 'agreed', 'disputed'].includes(item.status);
  const max = item.maxScores || {};
  const teamMembers = item.team?.members || [];
  const assessorChoices = staff.filter(
    (s) => s.userId !== item.employee.userId && s.userId !== item.supervisor?.userId,
  );

  const toggleAssessor = (userId) =>
    setAssessors((list) =>
      list.includes(userId) ? list.filter((v) => v !== userId) : [...list, userId],
    );

  const supervisorBody = () => ({
    quarters: quarters
      .filter((q) => q.planScore !== '')
      .map((q) => ({ seq: q.seq, label: q.label, planScore: q.planScore })),
    supervisorScore,
    strengths,
    gaps,
  });

  return (
    <div className="space-y-6">
      <PageHead
        title={isTeamMember ? `Team assessment: ${item.employee.name}` : item.employee.name}
        description={`${item.employee.jobTitle || 'Administrative staff'} · ${item.period.title}${
          item.employee.workUnit || item.employee.department
            ? ` · ${item.employee.workUnit || item.employee.department}`
            : ''
        }`}
        actions={
          <>
            <button className={secondary} onClick={() => navigate(-1)}>Back</button>
            {finalized && !isTeamMember && (
              <Link className={secondary} to={`/admin-evaluations/${item.id}/print`}>
                <Printer size={15} />
                Final report
              </Link>
            )}
          </>
        }
      />

      <Notice error={error} success={success} />

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span>Your role in this evaluation:</span>
        <strong className="capitalize">{relation.replace('_', ' ')}</strong>
        {!isTeamMember && <Status value={item.stage || item.status} />}
        {item.period.status !== 'active' && !finalized && (
          <span className="status-pill status-gray">Period {label(item.period.status)}</span>
        )}
      </div>

      {/* ---------- Submission tracking (supervisor / administrator) ---------- */}
      {fullView && (
        <section className={panel}>
          <h2 className={panelTitle}>Submission tracking</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className={item.self?.submitted ? 'text-emerald-600' : 'text-slate-300'} />
              Employee self-assessment {item.self?.submitted ? 'submitted' : 'pending'}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className={item.team?.assigned > 0 && item.team.submitted === item.team.assigned ? 'text-emerald-600' : 'text-slate-300'}
              />
              Team assessments: {item.team?.submitted ?? 0} of {item.team?.assigned ?? 0} submitted
              {!item.team?.assigned && ' — an administrator must assign team assessors'}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className={finalized ? 'text-emerald-600' : 'text-slate-300'} />
              Immediate supervisor evaluation {finalized ? 'submitted' : 'not yet submitted'}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className={item.response?.value ? 'text-emerald-600' : 'text-slate-300'} />
              Employee response:{' '}
              {item.response?.value
                ? item.response.value === 'agree' ? 'agreed' : 'did not agree'
                : 'pending'}
            </li>
          </ul>
          {!finalized && item.readiness && !item.readiness.ready && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Still needed before the supervisor can submit: {item.readiness.missing.join('; ')}.
            </p>
          )}
        </section>
      )}

      {/* ---------- Employee: self-assessment ---------- */}
      {isEmployee && (
        <section className={panel}>
          <div>
            <h2 className={panelTitle}>Your self-assessment (maximum {max.self ?? 5})</h2>
            <p className={hintText}>
              Only you can enter this score. Once submitted it is locked. Your supervisor and your
              team’s assessments stay confidential until the supervisor submits the final evaluation.
            </p>
          </div>

          {item.self?.submitted ? (
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Lock size={15} /> Submitted: <strong>{fmt(item.self.score)}</strong> / {max.self ?? 5}
            </p>
          ) : (
            <>
              <div className="max-w-xs">
                <Field label="Self-assessment score">
                  <input
                    className={input}
                    type="number"
                    min="0"
                    max={max.self ?? 5}
                    step="0.01"
                    value={selfScore}
                    disabled={!perm.canEditSelf || busy}
                    onChange={(e) => setSelfScore(e.target.value)}
                  />
                </Field>
              </div>
              {perm.canEditSelf ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondary}
                    disabled={busy || selfScore === ''}
                    onClick={() => act(() => api.saveSelf(item.id, selfScore), 'Draft saved.')}
                  >
                    <Save size={15} /> Save draft
                  </button>
                  <button
                    className={button}
                    disabled={busy || selfScore === ''}
                    onClick={() =>
                      act(
                        () => api.submitSelf(item.id, selfScore),
                        'Self-assessment submitted.',
                        'Submit your self-assessment? You will not be able to change it afterwards.',
                      )
                    }
                  >
                    Submit self-assessment
                  </button>
                </div>
              ) : (
                <p className={hintText}>This evaluation is not open for input.</p>
              )}
            </>
          )}
        </section>
      )}

      {/* ---------- Team assessor: own assessment ---------- */}
      {isTeamMember && (
        <section className={panel}>
          <div>
            <h2 className={panelTitle}>Your team assessment (maximum {max.team ?? 15})</h2>
            <p className={hintText}>
              You assess {item.employee.name} as a team member. You see only your own assessment. Your
              individual score is visible to the supervisor and administrators, not to the employee.
            </p>
          </div>

          {item.team?.mine?.submitted ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2">
                <Lock size={15} /> Submitted: <strong>{fmt(item.team.mine.score)}</strong> / {max.team ?? 15}
              </p>
              {item.team.mine.comment && <p className="whitespace-pre-wrap">{item.team.mine.comment}</p>}
            </div>
          ) : (
            <>
              <div className="max-w-xs">
                <Field label="Team assessment score">
                  <input
                    className={input}
                    type="number"
                    min="0"
                    max={max.team ?? 15}
                    step="0.01"
                    value={teamScore}
                    disabled={!perm.canSubmitTeamAssessment || busy}
                    onChange={(e) => setTeamScore(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Comment (optional)">
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm"
                  maxLength={2000}
                  value={teamComment}
                  disabled={!perm.canSubmitTeamAssessment || busy}
                  onChange={(e) => setTeamComment(e.target.value)}
                />
              </Field>
              {perm.canSubmitTeamAssessment ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    className={secondary}
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => api.saveTeamAssessment(item.id, { score: teamScore, comment: teamComment }),
                        'Draft saved.',
                      )
                    }
                  >
                    <Save size={15} /> Save draft
                  </button>
                  <button
                    className={button}
                    disabled={busy || teamScore === ''}
                    onClick={() =>
                      act(
                        () => api.submitTeamAssessment(item.id, { score: teamScore, comment: teamComment }),
                        'Team assessment submitted.',
                        'Submit your team assessment? You will not be able to change it afterwards.',
                      )
                    }
                  >
                    Submit team assessment
                  </button>
                </div>
              ) : (
                <p className={hintText}>This evaluation is not open for input.</p>
              )}
            </>
          )}
        </section>
      )}

      {/* ---------- Team assessors: assignment (admin) and individual results ---------- */}
      {fullView && (
        <section className={panel}>
          <div>
            <h2 className={panelTitle}>Team assessors</h2>
            <p className={hintText}>
              Each assessor submits an individual score out of {max.team ?? 15}. The system uses the
              average. Individual scores are confidential: only the supervisor and administrators see them.
            </p>
          </div>

          {perm.canManageTeam && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Assign team assessors ({assessors.length} selected, maximum 15)
              </p>
              <div className="grid max-h-60 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
                {assessorChoices.map((s) => (
                  <label key={s.userId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assessors.includes(s.userId)}
                      disabled={busy}
                      onChange={() => toggleAssessor(s.userId)}
                    />
                    <span>
                      {s.name}
                      <span className="text-slate-500"> · {s.jobTitle || s.role}</span>
                    </span>
                  </label>
                ))}
                {!assessorChoices.length && (
                  <p className={hintText}>No other active staff accounts are available.</p>
                )}
              </div>
              <button
                className={button}
                disabled={busy}
                onClick={() => act(() => api.setTeam(item.id, assessors), 'Team assessors saved.')}
              >
                <Users size={15} /> Save team assessors
              </button>
            </div>
          )}

          {teamMembers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Assessor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((m) => (
                    <tr key={m.userId}>
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">
                        <span className={`status-pill ${m.submitted ? 'status-green' : 'status-amber'}`}>
                          {m.submitted ? 'Submitted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{m.submitted ? fmt(m.score) : '—'}</td>
                      <td className="whitespace-pre-wrap px-4 py-3 text-slate-600">{m.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No team assessors assigned yet.</p>
          )}
        </section>
      )}

      {/* ---------- Supervisor: planned results + supervisor assessment ---------- */}
      {isSupervisor && (
        <section className={panel}>
          <div>
            <h2 className={panelTitle}>Planned results and your assessment</h2>
            <p className={hintText}>
              Enter the performance against planned results for each quarter (maximum {max.plan ?? 70}) and
              your own assessment (maximum {max.supervisor ?? 10}). Self, team and behavioral totals are calculated
              by the system.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {quarters.map((q, i) => (
              <Field key={q.seq} label={`${q.label} plan score (0–${max.plan ?? 70})`}>
                <input
                  className={input}
                  type="number"
                  min="0"
                  max={max.plan ?? 70}
                  step="0.01"
                  value={q.planScore}
                  disabled={!perm.canEditSupervisorPart || busy}
                  onChange={(e) =>
                    setQuarters((rows) =>
                      rows.map((row, idx) => (idx === i ? { ...row, planScore: e.target.value } : row)),
                    )
                  }
                />
              </Field>
            ))}
          </div>

          <div className="max-w-xs">
            <Field label={`Supervisor assessment (0–${max.supervisor ?? 10})`}>
              <input
                className={input}
                type="number"
                min="0"
                max={max.supervisor ?? 10}
                step="0.01"
                value={supervisorScore}
                disabled={!perm.canEditSupervisorPart || busy}
                onChange={(e) => setSupervisorScore(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Employee’s strengths demonstrated during the performance period">
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm"
              maxLength={4000}
              value={strengths}
              disabled={!perm.canEditSupervisorPart || busy}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </Field>

          <Field label="Gaps / areas for improvement identified during the performance period">
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm"
              maxLength={4000}
              value={gaps}
              disabled={!perm.canEditSupervisorPart || busy}
              onChange={(e) => setGaps(e.target.value)}
            />
          </Field>

          {perm.canEditSupervisorPart ? (
            <div className="flex flex-wrap gap-2">
              <button
                className={secondary}
                disabled={busy}
                onClick={() => act(() => api.saveSupervisor(item.id, supervisorBody()), 'Saved.')}
              >
                <Save size={15} /> Save
              </button>
              <button
                className={button}
                disabled={busy || !perm.canSubmit}
                title={perm.canSubmit ? '' : 'Complete the items listed under Submission tracking first'}
                onClick={() =>
                  act(
                    async () => {
                      await api.saveSupervisor(item.id, supervisorBody());
                      return api.submit(item.id);
                    },
                    'Evaluation submitted. The employee can now review and respond.',
                    'Submit the final evaluation? All scores will be locked.',
                  )
                }
              >
                <CheckCircle2 size={15} /> Submit final evaluation
              </button>
            </div>
          ) : (
            !finalized && <p className={hintText}>This evaluation is not open for input.</p>
          )}
        </section>
      )}

      {isAdminView && (item.strengths || item.gaps) && (
        <section className={panel}>
          <h2 className={panelTitle}>Supervisor’s narrative</h2>
          <p className="whitespace-pre-wrap text-sm"><strong>Strengths:</strong> {item.strengths || '—'}</p>
          <p className="whitespace-pre-wrap text-sm"><strong>Gaps:</strong> {item.gaps || '—'}</p>
        </section>
      )}

      {/* ---------- System-calculated result ---------- */}
      {item.summary && (
        <section className={panel}>
          <div>
            <h2 className={panelTitle}>
              {finalized ? 'Final result' : 'Calculated result (preliminary)'}
            </h2>
            <p className={hintText}>
              {finalized
                ? 'Calculated by the system from the submitted assessments.'
                : 'Calculated by the system. Components appear as each role submits; the result is final only after the supervisor submits.'}
            </p>
          </div>
          <ResultTable summary={item.summary} teamCount={item.team?.assigned} />
          {finalized && (item.strengths || item.gaps) && !fullView && (
            <div className="space-y-2 text-sm">
              <p className="whitespace-pre-wrap"><strong>Strengths:</strong> {item.strengths || '—'}</p>
              <p className="whitespace-pre-wrap"><strong>Gaps / areas for improvement:</strong> {item.gaps || '—'}</p>
            </div>
          )}
        </section>
      )}

      {/* ---------- Employee response ---------- */}
      {isEmployee && perm.canRespond && (
        <section className={panel}>
          <div>
            <h2 className={panelTitle}>Your response</h2>
            <p className={hintText}>
              Do you agree with the result? If not, state your reason (at least 10 characters).
            </p>
          </div>
          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm"
            maxLength={4000}
            placeholder="Reason (required only if you do not agree)"
            value={reason}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              className={button}
              disabled={busy}
              onClick={() =>
                act(
                  () => api.respond(item.id, { response: 'agree' }),
                  'Your response was recorded.',
                  'Confirm that you agree with this evaluation result?',
                )
              }
            >
              I agree
            </button>
            <button
              className={secondary}
              disabled={busy || reason.trim().length < 10}
              onClick={() =>
                act(
                  () => api.respond(item.id, { response: 'disagree', reason }),
                  'Your response was recorded.',
                  'Record that you do not agree with this evaluation result?',
                )
              }
            >
              I do not agree
            </button>
          </div>
        </section>
      )}

      {item.response?.value && !isTeamMember && (
        <section className={panel}>
          <h2 className={panelTitle}>Employee response</h2>
          <p className="text-sm">
            {item.response.value === 'agree' ? 'The employee agrees with the result.' : 'The employee does not agree with the result.'}
          </p>
          {item.response.reason && <p className="whitespace-pre-wrap text-sm text-slate-600">{item.response.reason}</p>}
        </section>
      )}
    </div>
  );
}

/* =========================================================
   7. FINAL REPORT (official Six-Month Performance
      Evaluation Summary Form)
   ========================================================= */

export function AdminEvaluationPrintPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(id)
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return <div className="p-8 text-rose-700">{error}</div>;
  }

  if (!item) {
    return <Loading text="Preparing print document…" />;
  }

  // The final report exists only after the supervisor submitted, and only for the
  // employee, the supervisor and administrators.
  if (item.status === 'draft' || item.relation === 'team_member' || !item.summary) {
    return (
      <div className="space-y-4 p-8">
        <p className="text-sm text-slate-600">
          The final report is available after the immediate supervisor submits the evaluation.
        </p>
        <Link className={secondary} to={`/admin-evaluations/${id}`}>Back to evaluation</Link>
      </div>
    );
  }

  const c = item.summary.consolidated || {};
  const teamCount = item.team?.assigned;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="print:hidden flex justify-between">
        <Link className={secondary} to={`/admin-evaluations/${id}`}>
          Back to evaluation
        </Link>
        <button className={button} onClick={() => window.print()}>
          <Printer size={15} />
          Print / Save PDF
        </button>
      </div>

      <article className="admin-eval-print bg-white p-8 text-slate-900">
        <h1 className="text-center text-lg font-bold">
          SIX-MONTH PERFORMANCE EVALUATION SUMMARY FORM
        </h1>

        <div className="mt-7 grid grid-cols-2 gap-5 text-sm">
          <p>Employee's full name: <strong>{item.employee.name}</strong></p>
          <p>Job title: <strong>{item.employee.jobTitle || ' '}</strong></p>
          <p>Grade: <strong>{item.employee.grade || ' '}</strong></p>
          <p>
            Work process / unit:{' '}
            <strong>{item.employee.workUnit || item.employee.department || ' '}</strong>
          </p>
          <p className="col-span-2">
            Evaluation period: From <strong>{item.period.startDate}</strong> to{' '}
            <strong>{item.period.endDate}</strong>
          </p>
        </div>

        <h2 className="mt-8 border-b border-slate-500 pb-2 text-center font-bold">
          PERFORMANCE EVALUATION RESULTS
        </h2>

        <table className="mt-3 w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="border border-slate-500 p-2">Evaluation period</th>
              <th className="border border-slate-500 p-2">Performance against planned results (70)</th>
              <th className="border border-slate-500 p-2">Work-related behavioral competencies (30)</th>
              <th className="border border-slate-500 p-2">Performance level</th>
            </tr>
          </thead>
          <tbody>
            {(item.summary.quarters || []).map((q) => (
              <tr key={q.seq}>
                <td className="border border-slate-500 p-2">{q.label}</td>
                <td className="border border-slate-500 p-2">{fmt(q.plan)}</td>
                <td className="border border-slate-500 p-2">—</td>
                <td className="border border-slate-500 p-2">—</td>
              </tr>
            ))}
            <tr>
              <th className="border border-slate-500 p-2">Consolidated six-month performance</th>
              <td className="border border-slate-500 p-2 font-bold">{fmt(c.plan)}</td>
              <td className="border border-slate-500 p-2 font-bold">{fmt(c.behavioral)}</td>
              <td className="border border-slate-500 p-2 font-bold">
                {c.level || '—'} · Total {fmt(c.total)}/100
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="mt-8 font-bold">Behavioral score breakdown</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <tbody>
            {[
              ['Self-assessment (5)', c.self],
              [`Team assessment (15)${teamCount ? ` — average of ${teamCount} team assessors` : ''}`, c.team],
              ['Immediate supervisor assessment (10)', c.supervisor],
            ].map(([key, value]) => (
              <tr key={key}>
                <td className="border border-slate-500 p-2">{key}</td>
                <td className="border border-slate-500 p-2 text-center">{fmt(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-8 font-bold">
          EMPLOYEE'S STRENGTHS DEMONSTRATED DURING THE PERFORMANCE PERIOD:
        </h3>
        <p className="min-h-16 whitespace-pre-wrap border-b border-slate-400 py-3">
          {item.strengths || ''}
        </p>

        <h3 className="mt-6 font-bold">
          GAPS / AREAS FOR IMPROVEMENT IDENTIFIED DURING THE PERFORMANCE PERIOD:
        </h3>
        <p className="min-h-16 whitespace-pre-wrap border-b border-slate-400 py-3">
          {item.gaps || ''}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
          <p>
            Immediate supervisor's full name: <strong>{item.supervisor.name}</strong>
            <br /><br />
            Signature: ____________________
            <br /><br />
            Date: ____________________
          </p>
          <p>
            Employee's full name: <strong>{item.employee.name}</strong>
            <br /><br />
            Employee response:{' '}
            <strong>
              {item.response?.value === 'agree'
                ? 'AGREES'
                : item.response?.value === 'disagree'
                  ? 'DOES NOT AGREE'
                  : 'PENDING'}
            </strong>
          </p>
        </div>

        <h3 className="mt-8 font-bold">
          I AGREE WITH THE RESULT OF THE PERFORMANCE EVALUATION BASED ON PLANNED RESULTS:
        </h3>
        <p className="mt-4 text-sm">
          Employee's name:{' '}
          {item.response?.value === 'agree' ? item.employee.name : '________________________'}
          {'  '}Signature: __________________{'  '}Date: __________________
        </p>

        <h3 className="mt-8 font-bold">
          I DO NOT AGREE WITH THE RESULT OF THE PERFORMANCE EVALUATION FOR THE FOLLOWING REASON(S):
        </h3>
        <p className="min-h-14 whitespace-pre-wrap border-b border-slate-400 py-3">
          {item.response?.value === 'disagree' ? item.response.reason : ''}
        </p>
        <p className="mt-4 text-sm">
          Employee's name:{' '}
          {item.response?.value === 'disagree' ? item.employee.name : '________________________'}
          {'  '}Signature: __________________{'  '}Date: __________________
        </p>

        <p className="mt-12 text-center text-xs text-slate-500">
          Six-Month Performance Evaluation Summary Form — English
        </p>
      </article>
    </div>
  );
}

/* =========================================================
   8. PERIOD REPORT (administrator)
   ========================================================= */

export function AdminEvaluationReportsPage({ user }) {
  const admin = canManageAdminEvaluations(user);

  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!admin) return;

    api.periods()
      .then((list) => {
        setPeriods(list);
        const pick = list.find((p) => p.status === 'active') || list[0];
        if (pick) setPeriodId(String(pick.id));
        else setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [admin]);

  const load = useCallback(async () => {
    if (!periodId) return;
    setLoading(true);

    try {
      setReport(await api.report(periodId));
      setError('');
    } catch (e) {
      setError(e.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!admin) {
    return (
      <div className="space-y-6">
        <PageHead title="Evaluation reports" />
        <Notice error="Only administrators can view evaluation reports." />
      </div>
    );
  }

  function exportCsv() {
    const headers = [
      { key: 'employee', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'jobTitle', label: 'Job title' },
      { key: 'supervisor', label: 'Supervisor' },
      { key: 'status', label: 'Status' },
      { key: 'plan', label: 'Planned results (70)' },
      { key: 'self', label: 'Self (5)' },
      { key: 'team', label: 'Team (15)' },
      { key: 'supervisorScore', label: 'Supervisor (10)' },
      { key: 'behavioral', label: 'Behavioral (30)' },
      { key: 'total', label: 'Total (100)' },
      { key: 'level', label: 'Performance level' },
    ];

    const records = report.rows.map((r) => ({
      ...r,
      status: label(r.stage || r.status),
      plan: r.plan ?? '',
      self: r.self ?? '',
      team: r.team ?? '',
      supervisorScore: r.supervisorScore ?? '',
      behavioral: r.behavioral ?? '',
      total: r.total ?? '',
      level: r.level ?? '',
    }));

    downloadText(
      `admin-evaluation-report-${report.period.title.replace(/[^A-Za-z0-9]+/g, '-')}.csv`,
      toCsv(headers, records),
    );
  }

  const stats = report?.stats;

  return (
    <div className="space-y-6">
      <PageHead
        title="Evaluation reports"
        description="Results and submission progress per period. Scores are shown only for evaluations the supervisor has submitted."
        actions={
          <>
            <button className={secondary} onClick={load}>
              <RefreshCw size={15} />
              Refresh
            </button>
            <button className={secondary} disabled={!report} onClick={exportCsv}>
              <Download size={15} />
              Export CSV
            </button>
            <button className={secondary} disabled={!report} onClick={() => window.print()}>
              <Printer size={15} />
              Print
            </button>
          </>
        }
      />

      <Notice error={error} />

      <div className="max-w-sm print:hidden">
        <Field label="Evaluation period">
          <select className={input} value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({label(p.status)})
              </option>
            ))}
          </select>
        </Field>
      </div>

      {loading ? (
        <Loading text="Loading report…" />
      ) : !report ? (
        <section className="panel-card p-10 text-center text-sm text-slate-500">
          {periods.length ? 'No report data.' : 'Create an evaluation period first.'}
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Assigned employees', stats.total],
              ['Submitted by supervisors', stats.finalized],
              ['Average total (of 100)', fmt(stats.averageTotal)],
            ].map(([name, value]) => (
              <div key={name} className="panel-card p-5">
                <p className="text-xs font-semibold uppercase text-slate-500">{name}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="panel-card grid gap-6 p-5 sm:grid-cols-2">
            <div>
              <h2 className={panelTitle}>Performance levels</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {stats.levelDistribution.map((l) => (
                  <li key={l.level} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{l.level}</span>
                    <strong>{l.count}</strong>
                  </li>
                ))}
                {!stats.levelDistribution.length && (
                  <li className={hintText}>No performance levels are configured.</li>
                )}
              </ul>
            </div>
            <div>
              <h2 className={panelTitle}>Progress</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {Object.entries(stats.byStage).map(([stage, count]) => (
                  <li key={stage} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{label(stage)}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Supervisor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Plan (70)</th>
                    <th className="px-4 py-3">Self (5)</th>
                    <th className="px-4 py-3">Team (15)</th>
                    <th className="px-4 py-3">Sup. (10)</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3 print:hidden">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium">{r.employee}</td>
                      <td className="px-4 py-3">{r.department || '—'}</td>
                      <td className="px-4 py-3">{r.supervisor}</td>
                      <td className="px-4 py-3">
                        <Status value={r.stage || r.status} />
                        {r.status === 'draft' && <ProgressChips progress={r.progress} />}
                      </td>
                      <td className="px-4 py-3">{fmt(r.plan)}</td>
                      <td className="px-4 py-3">{fmt(r.self)}</td>
                      <td className="px-4 py-3">{fmt(r.team)}</td>
                      <td className="px-4 py-3">{fmt(r.supervisorScore)}</td>
                      <td className="px-4 py-3 font-semibold">{fmt(r.total)}</td>
                      <td className="px-4 py-3">{r.level || '—'}</td>
                      <td className="px-4 py-3 print:hidden">
                        <Link className={openLink} to={`/admin-evaluations/${r.id}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report.rows.length && (
                <p className="p-10 text-center text-sm text-slate-500">
                  No employees are assigned for this period.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}