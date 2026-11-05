import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Users,
} from 'lucide-react';

import { apiRequest } from '../services/api.js';
import { adminEvaluationApi as api } from '../services/adminEvaluationApi.js';
import { confirmAction } from '../utils/confirmAction.js';

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
  eyebrow = 'Administrative staff evaluation',
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

/* =========================================================
   1. ADMINISTRATIVE EVALUATION DASHBOARD
   ========================================================= */

export function AdminEvaluationDashboard({ user }) {
  const admin = user?.role === 'admin';

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
                          <Status value={r.status} />
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
  const admin = user?.role === 'admin';

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
  const admin = user?.role === 'admin';

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
  const admin = user?.role === 'admin';

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
      const [p, a, d] = await Promise.all([
        api.periods(),
        api.all(),
        apiRequest('/organization/departments?page=1&pageSize=100'),
      ]);

      const depts = d?.data?.items || [];

      const memberLists = await Promise.all(
        depts.map((dep) =>
          apiRequest(`/organization/departments/${dep.id}/members`),
        ),
      );

      const all = memberLists.flatMap((result, i) =>
        (
          result?.data?.members ||
          result?.data?.items ||
          result?.data ||
          []
        ).map((member) => ({
          ...member,
          departmentName: depts[i]?.name || '',
        })),
      );

      const unique = [
        ...new Map(
          all.map((person) => [
            String(person.userId ?? person.id),
            person,
          ]),
        ).values(),
      ];

      const active = unique.filter(
        (person) => person.status === 'active',
      );

      setPeriods(p);
      setRows(a);

      setEmployees(
        unique.filter(
          (person) =>
            person.employeeType === 'administrative' &&
            person.status === 'active',
        ),
      );

      setSupervisors(active);

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
            Employee choices are loaded from existing department
            membership records and filtered by employeeType =
            administrative. Supervisor choices are drawn from active
            staff with department membership because the supplied
            backend has no dedicated supervisor directory endpoint.
          </p>
        </>
      )}
    </div>
  );
}