
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { adminEvaluationApi as api } from '../services/adminEvaluationApi.js';

const STATUS = {
  draft: {
    label: 'Not submitted',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
    description: 'Your self-assessment is still a draft.',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
    description: 'Your assessment has been submitted.',
  },
  agreed: {
    label: 'Agreed',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    description: 'You have acknowledged the evaluation.',
  },
  disputed: {
    label: 'Disagreed',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
    description: 'Your disagreement has been recorded.',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    description: 'This evaluation period is active.',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
    description: 'This evaluation period has not started.',
  },
  closed: {
    label: 'Closed',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    description: 'This evaluation period is closed.',
  },
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getStatus = (value) => {
  const key = String(value || 'draft').toLowerCase();

  return STATUS[key] || {
    label: key.replaceAll('_', ' '),
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    description: 'Evaluation status',
  };
};

function StatusBadge({ value }) {
  const status = getStatus(value);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${status.className}`}
    >
      {status.label}
    </span>
  );
}

function PageHeader({ user, onRefresh, refreshing }) {
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'Employee';

  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
          <span className="rounded-lg bg-blue-50 p-2">
            <ShieldCheck size={17} />
          </span>
          Administrative Staff Evaluation
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          My Evaluation Dashboard
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Welcome back, {firstName}. Track your assessment, supervisor
          feedback, and evaluation progress from one place.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
      >
        <RefreshCw
          size={15}
          className={refreshing ? 'animate-spin' : ''}
        />
        Refresh
      </button>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <span className={`rounded-xl p-3 ${tones[tone] || tones.blue}`}>
          <Icon size={21} />
        </span>
      </div>
    </section>
  );
}

function LoadingPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <span className="mx-auto mb-4 block h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
      <p className="text-sm font-medium text-slate-700">
        Loading your evaluation information...
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Please wait while your records are retrieved.
      </p>
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-5"
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 text-rose-600" size={20} />

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-rose-800">
            Unable to load your evaluations
          </h2>

          <p className="mt-1 text-sm text-rose-700">{message}</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <ClipboardCheck size={26} />
      </span>

      <h3 className="mt-4 font-semibold text-slate-900">
        No evaluation assignments yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Your administrative evaluation will appear here after an
        administrator assigns you to an evaluation period.
      </p>
    </div>
  );
}

function WorkflowStep({ number, title, description, state }) {
  const styles = {
    complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    current: 'border-blue-200 bg-blue-50 text-blue-700',
    pending: 'border-slate-200 bg-slate-50 text-slate-400',
  };

  return (
    <div className="flex gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${styles[state]}`}
      >
        {state === 'complete' ? <CheckCircle2 size={18} /> : number}
      </span>

      <div className="min-w-0 pb-5">
        <p
          className={`text-sm font-semibold ${
            state === 'pending' ? 'text-slate-400' : 'text-slate-800'
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function getWorkflowState(status) {
  switch (status) {
    case 'draft':
      return 0;
    case 'submitted':
      return 1;
    case 'agreed':
    case 'disputed':
      return 3;
    default:
      return 0;
  }
}

function WorkflowPanel({ assignment }) {
  const current = getWorkflowState(assignment.status);

  const steps = [
    {
      title: 'Self-assessment',
      description: 'Complete and submit your self-assessment.',
    },
    {
      title: 'Supervisor assessment',
      description: 'Your assigned supervisor reviews your performance.',
    },
    {
      title: 'Employee response',
      description: 'Review the supervisor assessment and respond.',
    },
    {
      title: 'Final evaluation',
      description: 'The authorized office finalizes the evaluation record.',
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
          <Activity size={19} />
        </span>

        <div>
          <h2 className="font-semibold text-slate-900">
            Evaluation workflow
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Follow the stages of your administrative evaluation.
          </p>
        </div>
      </div>

      <div>
        {steps.map((step, index) => {
          let state = 'pending';

          if (index < current) state = 'complete';
          if (index === current) state = 'current';

          if (
            assignment.status === 'agreed' ||
            assignment.status === 'disputed'
          ) {
            state = 'complete';
          }

          return (
            <WorkflowStep
              key={step.title}
              number={index + 1}
              title={step.title}
              description={step.description}
              state={state}
            />
          );
        })}
      </div>

      <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
        Your evaluation moves through the official stages. The final result
        becomes available according to the authorized finalization process.
      </p>
    </section>
  );
}

function AssignmentCard({ assignment }) {
  const employee = assignment.employee || {};
  const supervisor = assignment.supervisor || {};
  const period = assignment.period || {};
  const status = getStatus(assignment.status);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={assignment.status} />

            {period.status && (
              <span className="text-xs text-slate-500">
                Period: {getStatus(period.status).label}
              </span>
            )}
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900">
            {period.title || 'Administrative evaluation'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your administrative staff performance assessment
          </p>
        </div>

        <Link
          to={`/admin-evaluations/${assignment.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Open evaluation
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <CalendarDays size={17} className="mt-0.5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Evaluation period</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {formatDate(period.startDate)} – {formatDate(period.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <UserRound size={17} className="mt-0.5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Assigned supervisor</p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              {supervisor.name || 'Not available'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock3 size={17} className="mt-0.5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Current status</p>
            <p className="mt-1 text-sm font-medium capitalize text-slate-800">
              {status.label}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function EmployeeEvaluationPage({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [mine, periodData] = await Promise.all([
        api.mine(),
        api.periods(),
      ]);

      setAssignments(
        Array.isArray(mine?.asEmployee) ? mine.asEmployee : [],
      );

      setPeriods(Array.isArray(periodData) ? periodData : []);
    } catch (err) {
      setError(
        err.message || 'Unable to retrieve your evaluation information.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleAssignments = useMemo(() => {
    if (selectedPeriod === 'all') return assignments;

    return assignments.filter(
      (item) => String(item.period?.id) === String(selectedPeriod),
    );
  }, [assignments, selectedPeriod]);

  const stats = useMemo(() => {
    return {
      total: assignments.length,
      drafts: assignments.filter((item) => item.status === 'draft').length,
      submitted: assignments.filter(
        (item) => item.status === 'submitted',
      ).length,
      completed: assignments.filter((item) =>
        ['agreed', 'disputed'].includes(item.status),
      ).length,
    };
  }, [assignments]);

  const activeAssignment = useMemo(() => {
    return assignments.find(
      (item) =>
        item.period?.status === 'active' &&
        !['agreed', 'disputed'].includes(item.status),
    ) || assignments.find(
      (item) => !['agreed', 'disputed'].includes(item.status),
    );
  }, [assignments]);

  return (
    <div className="min-h-full space-y-6">
      <PageHeader
        user={user}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      />

      {error && <ErrorPanel message={error} onRetry={() => load()} />}

      {loading ? (
        <LoadingPanel />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="My assignments"
              value={stats.total}
              description="Total assigned evaluations"
              icon={FileText}
              tone="blue"
            />

            <StatCard
              title="Self-assessment pending"
              value={stats.drafts}
              description="Assignments still in draft"
              icon={Clock3}
              tone="amber"
            />

            <StatCard
              title="Submitted"
              value={stats.submitted}
              description="Submitted evaluation records"
              icon={Activity}
              tone="violet"
            />

            <StatCard
              title="Responded"
              value={stats.completed}
              description="Agreed or disagreed"
              icon={CheckCircle2}
              tone="green"
            />
          </section>

          {activeAssignment && (
            <section className="overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white shadow-sm">
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    Evaluation requires attention
                  </div>

                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {activeAssignment.period?.title ||
                      'Your active evaluation'}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Open your evaluation to review the required actions,
                    complete your self-assessment, and follow the review
                    process.
                  </p>
                </div>

                <Link
                  to={`/admin-evaluations/${activeAssignment.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  Continue evaluation
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          )}

          {activeAssignment && (
            <WorkflowPanel assignment={activeAssignment} />
          )}

          <section className="space-y-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My evaluation records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  View your assigned evaluation periods and their current
                  status.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <span className="whitespace-nowrap text-slate-500">
                  Filter period
                </span>

                <select
                  value={selectedPeriod}
                  onChange={(event) => setSelectedPeriod(event.target.value)}
                  className="h-10 min-w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All periods</option>

                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {visibleAssignments.length ? (
              <div className="space-y-4">
                {visibleAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <ShieldCheck size={19} />
              </span>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Your evaluation records are protected
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  You can access your own administrative evaluation records.
                  Supervisor reviews, employee responses, and final results
                  are displayed according to the evaluation workflow and
                  your account permissions.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
