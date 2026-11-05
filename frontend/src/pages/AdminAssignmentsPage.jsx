/* =========================================================
   5. MY ADMINISTRATIVE EVALUATIONS
   ========================================================= */

export function AdminEvaluationMinePage() {
  const [mine, setMine] = useState({
    asEmployee: [],
    asSupervisor: [],
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

  const rows = [
    ...(mine.asEmployee || []).map((x) => ({
      ...x,
      side: 'Employee',
    })),

    ...(mine.asSupervisor || []).map((x) => ({
      ...x,
      side: 'Supervisor',
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHead
        title="My administrative evaluations"
        description="Your assigned employee self-evaluations and supervisor review responsibilities."
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
        <section className="panel-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Your role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={`${r.side}-${r.id}`}>
                    <td className="px-5 py-4 font-medium">
                      {r.employee?.name}
                    </td>

                    <td className="px-5 py-4">
                      {r.period?.title}
                    </td>

                    <td className="px-5 py-4">
                      {r.side}
                    </td>

                    <td className="px-5 py-4">
                      <Status value={r.status} />
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-navy-800 hover:underline"
                        to={`/admin-evaluations/${r.id}`}
                      >
                        Open evaluation
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!rows.length && (
              <p className="p-10 text-center text-sm text-slate-500">
                No administrative evaluation assignments are linked to your account.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   6. INDIVIDUAL EVALUATION
   Employee + Supervisor
   ========================================================= */

export function AdminEvaluationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const [selfScore, setSelfScore] = useState('');
  const [teamScore, setTeamScore] = useState('');
  const [supervisorScore, setSupervisorScore] = useState('');

  const [strengths, setStrengths] = useState('');
  const [gaps, setGaps] = useState('');

  const [quarters, setQuarters] = useState([]);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const d = await api.get(id);

      setItem(d);

      setSelfScore(
        d.selfScore ?? d.summary?.consolidated?.self ?? '',
      );

      setTeamScore(
        d.summary?.consolidated?.team ?? '',
      );

      setSupervisorScore(
        d.summary?.consolidated?.supervisor ?? '',
      );

      setStrengths(d.strengths || '');
      setGaps(d.gaps || '');

      setQuarters(
        (d.summary?.quarters || []).length
          ? d.summary.quarters.map((q) => ({
              seq: q.seq,
              label: q.label,
              planScore: q.plan ?? '',
              behavioralScore: q.behavioral ?? '',
              level: q.level,
            }))
          : [1, 2, 3, 4].map((n) => ({
              seq: n,
              label: `Quarter ${n}`,
              planScore: '',
              behavioralScore: '',
              level: null,
            })),
      );

      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const relation = item?.relation;

  /* -----------------------------
     Employee self-assessment
     ----------------------------- */

  const saveSelf = async () => {
    if (selfScore === '') {
      setError('Enter your self-assessment score.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const d = await api.saveSelf(id, Number(selfScore));

      setItem(d);
      setSuccess('Self-assessment saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* -----------------------------
     Supervisor assessment
     ----------------------------- */

  const saveSupervisor = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const body = {
        quarters: quarters.map((q) => ({
          seq: q.seq,
          label: q.label,

          planScore:
            q.planScore === ''
              ? null
              : Number(q.planScore),

          behavioralScore:
            q.behavioralScore === ''
              ? null
              : Number(q.behavioralScore),
        })),

        teamScore:
          teamScore === ''
            ? null
            : Number(teamScore),

        supervisorScore:
          supervisorScore === ''
            ? null
            : Number(supervisorScore),

        strengths,
        gaps,

        grade: item.employee.grade,
        workUnit: item.employee.workUnit,
        jobTitle: item.employee.jobTitle,
      };

      const d = await api.saveSupervisor(id, body);

      setItem(d);

      setQuarters(
        (d.summary?.quarters || []).map((q) => ({
          seq: q.seq,
          label: q.label,
          planScore: q.plan ?? '',
          behavioralScore: q.behavioral ?? '',
          level: q.level,
        })),
      );

      setSuccess('Supervisor evaluation saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* -----------------------------
     Submit evaluation
     ----------------------------- */

  const submit = async () => {
    if (
      !await confirmAction(
        'Submit this evaluation? Scores will be locked and sent to the employee for agreement or disagreement.',
      )
    ) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      setItem(await api.submit(id));
      setSuccess('Evaluation submitted and locked.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* -----------------------------
     Employee response
     ----------------------------- */

  const respond = async (response) => {
    if (response === 'disagree' && reason.trim().length < 10) {
      setError(
        'Please provide a disagreement reason of at least 10 characters.',
      );
      return;
    }

    if (
      !await confirmAction(
        `Confirm that you ${response} with this evaluation?`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      setItem(
        await api.respond(id, {
          response,
          reason,
        }),
      );

      setSuccess(
        `Your ${
          response === 'agree' ? 'agreement' : 'disagreement'
        } has been recorded.`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!item) {
    return (
      <div className="space-y-4">
        <Notice error={error} />

        <button
          className={secondary}
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  const c = item.summary?.consolidated || {};

  const isEmployee = relation === 'employee';
  const isSupervisor = relation === 'supervisor';

  const canSelf =
    isEmployee && item.permissions?.canEditSelf;

  const canSupervisor =
    isSupervisor && item.permissions?.canEditSupervisorPart;

  return (
    <div className="space-y-6">
      <PageHead
        title="Six-month performance evaluation"
        description={`${item.employee.name} · ${item.period.title}`}
        actions={
          <>
            <Link
              className={secondary}
              to={`/admin-evaluations/${id}/print`}
            >
              <Printer size={15} />
              Print view
            </Link>

            <button
              className={secondary}
              onClick={load}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </>
        }
      />

      <Notice error={error} success={success} />

      {/* Employee information */}

      <section className="panel-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Employee</p>
          <p className="mt-1 font-semibold">
            {item.employee.name}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Job title / grade
          </p>

          <p className="mt-1 font-semibold">
            {item.employee.jobTitle || '—'} /{' '}
            {item.employee.grade || '—'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Work unit</p>

          <p className="mt-1 font-semibold">
            {item.employee.workUnit ||
              item.employee.department ||
              '—'}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Period / status
          </p>

          <p className="mt-1 font-semibold">
            {item.period.title}
          </p>

          <Status value={item.status} />
        </div>
      </section>

      {/* Employee self-assessment */}

      {isEmployee && (
        <section className="panel-card space-y-3 p-5">
          <h2 className="font-semibold text-slate-900">
            Employee self-assessment
          </h2>

          <p className="text-sm text-slate-500">
            Maximum 5 points. Complete this before the supervisor submits the evaluation.
          </p>

          <label className="block max-w-xs text-sm font-medium text-slate-700">
            Self-assessment score (0–5)

            <input
              className={`${input} mt-1`}
              type="number"
              min="0"
              max="5"
              step="0.01"
              value={selfScore}
              onChange={(e) => setSelfScore(e.target.value)}
              disabled={!canSelf || saving}
            />
          </label>

          {canSelf && (
            <button
              className={button}
              onClick={saveSelf}
              disabled={saving || selfScore === ''}
            >
              <Save size={15} />
              {saving ? 'Saving…' : 'Save self-assessment'}
            </button>
          )}
        </section>
      )}

      {/* Supervisor evaluation */}

      {isSupervisor && (
        <section className="panel-card space-y-4 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">
              Quarterly performance-plan evaluation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Each quarter records planned-results score (maximum 70)
              and work-related behavioral score (maximum 30).
              The backend consolidates plan scores by averaging
              entered quarterly plan scores.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Quarter</th>
                  <th className="px-3 py-3">
                    Performance against plan (0–70)
                  </th>
                  <th className="px-3 py-3">
                    Behavioral (0–30)
                  </th>
                  <th className="px-3 py-3">Quarter total</th>
                  <th className="px-3 py-3">Performance level</th>
                </tr>
              </thead>

              <tbody>
                {quarters.map((q, i) => {
                  const total =
                    q.planScore !== '' &&
                    q.behavioralScore !== ''
                      ? Number(q.planScore) +
                        Number(q.behavioralScore)
                      : null;

                  return (
                    <tr
                      key={q.seq}
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-3 font-medium">
                        {q.label}
                      </td>

                      <td className="px-3 py-3">
                        <input
                          className={`${input} min-w-28`}
                          type="number"
                          min="0"
                          max="70"
                          step="0.01"
                          value={q.planScore}
                          disabled={!canSupervisor || saving}
                          onChange={(e) =>
                            setQuarters((v) =>
                              v.map((x, n) =>
                                n === i
                                  ? {
                                      ...x,
                                      planScore: e.target.value,
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        <input
                          className={`${input} min-w-28`}
                          type="number"
                          min="0"
                          max="30"
                          step="0.01"
                          value={q.behavioralScore}
                          disabled={!canSupervisor || saving}
                          onChange={(e) =>
                            setQuarters((v) =>
                              v.map((x, n) =>
                                n === i
                                  ? {
                                      ...x,
                                      behavioralScore: e.target.value,
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                      </td>

                      <td className="px-3 py-3">
                        {fmt(total)}
                      </td>

                      <td className="px-3 py-3">
                        {q.level || 'Calculated after save'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-slate-900">
            Behavioral assessment components
          </h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Employee self-assessment (0–5)

              <input
                className={`${input} mt-1`}
                value={fmt(c.self)}
                disabled
                readOnly
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Team assessment (0–15)

              <input
                className={`${input} mt-1`}
                type="number"
                min="0"
                max="15"
                step="0.01"
                value={teamScore}
                disabled={!canSupervisor || saving}
                onChange={(e) => setTeamScore(e.target.value)}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Supervisor assessment (0–10)

              <input
                className={`${input} mt-1`}
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={supervisorScore}
                disabled={!canSupervisor || saving}
                onChange={(e) => setSupervisorScore(e.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Employee strengths

            <textarea
              className={`${input} mt-1 h-24 py-2`}
              value={strengths}
              disabled={!canSupervisor || saving}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Gaps / areas for improvement

            <textarea
              className={`${input} mt-1 h-24 py-2`}
              value={gaps}
              disabled={!canSupervisor || saving}
              onChange={(e) => setGaps(e.target.value)}
            />
          </label>

          {canSupervisor && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                className={secondary}
                onClick={saveSupervisor}
                disabled={saving}
              >
                <Save size={15} />
                Save draft
              </button>

              <button
                className={button}
                onClick={submit}
                disabled={
                  saving ||
                  !item.permissions?.canSubmit ||
                  !strengths.trim() ||
                  !gaps.trim()
                }
              >
                Submit evaluation
              </button>
            </div>
          )}
        </section>
      )}

      {/* Employee review of submitted evaluation */}

      {isEmployee &&
        ['submitted', 'agreed', 'disputed'].includes(item.status) && (
          <section className="panel-card space-y-4 p-5">
            <h2 className="font-semibold text-slate-900">
              Supervisor evaluation for your review
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Evaluation period</th>
                    <th className="px-3 py-3">
                      Performance against plan (70)
                    </th>
                    <th className="px-3 py-3">
                      Behavioral score (30)
                    </th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Performance level</th>
                  </tr>
                </thead>

                <tbody>
                  {(item.summary?.quarters || []).map((q) => (
                    <tr
                      key={q.seq}
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-3">{q.label}</td>
                      <td className="px-3 py-3">{fmt(q.plan)}</td>
                      <td className="px-3 py-3">{fmt(q.behavioral)}</td>
                      <td className="px-3 py-3">{fmt(q.total)}</td>
                      <td className="px-3 py-3">{q.level || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Employee strengths
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {item.strengths || 'Not provided.'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Gaps / areas for improvement
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {item.gaps || 'Not provided.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Immediate supervisor: {item.supervisor.name}
            </p>
          </section>
        )}

      {/* Consolidated performance */}

      <section className="panel-card p-5">
        <h2 className="font-semibold text-slate-900">
          Consolidated six-month performance
        </h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Performance against plan (70)', c.plan],
            ['Behavioral performance (30)', c.behavioral],
            ['Total score (100)', c.total],
            ['Performance level', c.level],
          ].map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg bg-slate-50 p-4"
            >
              <p className="text-xs text-slate-500">{key}</p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {value ?? '—'}
              </p>
            </div>
          ))}
        </div>

        {item.summary?.missing?.length > 0 && (
          <p className="mt-3 text-xs text-amber-700">
            Incomplete: {item.summary.missing.join(', ')}
          </p>
        )}
      </section>

      {/* Employee agreement / disagreement */}

      {isEmployee && item.permissions?.canRespond && (
        <section className="panel-card space-y-3 p-5">
          <h2 className="font-semibold text-slate-900">
            Employee agreement / disagreement
          </h2>

          <p className="text-sm text-slate-600">
            Review the submitted scores and supervisor comments before
            responding. Your response cannot be changed after submission.
          </p>

          <label className="block text-sm font-medium text-slate-700">
            Reason for disagreement (required only if disagreeing)

            <textarea
              className={`${input} mt-1 h-24 py-2`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain your concern (minimum 10 characters)."
              disabled={saving}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              className={button}
              disabled={saving}
              onClick={() => respond('agree')}
            >
              I agree
            </button>

            <button
              className="rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              disabled={saving}
              onClick={() => respond('disagree')}
            >
              I disagree
            </button>
          </div>
        </section>
      )}

      {/* Recorded response */}

      {item.response?.value && (
        <section className="panel-card p-5">
          <h2 className="font-semibold text-slate-900">
            Employee response
          </h2>

          <p className="mt-2">
            <Status value={item.status} />
          </p>

          {item.response.reason && (
            <p className="mt-2 text-sm text-slate-600">
              Reason: {item.response.reason}
            </p>
          )}
        </section>
      )}

      <div className="flex justify-between">
        <button
          className={secondary}
          onClick={() => navigate(-1)}
        >
          Back
        </button>

        <Link
          className={button}
          to={`/admin-evaluations/${id}/print`}
        >
          <Printer size={15} />
          Open print view
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   7. OFFICIAL EVALUATION PRINT VIEW
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
    return (
      <div className="p-8 text-rose-700">
        {error}
      </div>
    );
  }

  if (!item) {
    return <Loading text="Preparing print document…" />;
  }

  const c = item.summary?.consolidated || {};

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="print:hidden flex justify-between">
        <Link
          className={secondary}
          to={`/admin-evaluations/${id}`}
        >
          Back to evaluation
        </Link>

        <button
          className={button}
          onClick={() => window.print()}
        >
          <Printer size={15} />
          Print / Save PDF
        </button>
      </div>

      <article className="admin-eval-print bg-white p-8 text-slate-900">
        <h1 className="text-center text-lg font-bold">
          SIX-MONTH PERFORMANCE EVALUATION SUMMARY FORM
        </h1>

        {/* Employee information */}

        <div className="mt-7 grid grid-cols-2 gap-5 text-sm">
          <p>
            Employee's full name:{' '}
            <strong>{item.employee.name}</strong>
          </p>

          <p>
            Job title:{' '}
            <strong>{item.employee.jobTitle || ' '}</strong>
          </p>

          <p>
            Grade:{' '}
            <strong>{item.employee.grade || ' '}</strong>
          </p>

          <p>
            Work process / unit:{' '}
            <strong>
              {item.employee.workUnit ||
                item.employee.department ||
                ' '}
            </strong>
          </p>

          <p className="col-span-2">
            Evaluation period: From{' '}
            <strong>{item.period.startDate}</strong> to{' '}
            <strong>{item.period.endDate}</strong>
          </p>
        </div>

        {/* Performance results */}

        <h2 className="mt-8 border-b border-slate-500 pb-2 text-center font-bold">
          PERFORMANCE EVALUATION RESULTS
        </h2>

        <table className="mt-3 w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="border border-slate-500 p-2">
                Evaluation period
              </th>

              <th className="border border-slate-500 p-2">
                Performance against planned results (70)
              </th>

              <th className="border border-slate-500 p-2">
                Work-related behavioral competencies (30)
              </th>

              <th className="border border-slate-500 p-2">
                Performance level
              </th>
            </tr>
          </thead>

          <tbody>
            {(item.summary?.quarters || []).map((q) => (
              <tr key={q.seq}>
                <td className="border border-slate-500 p-2">
                  {q.label}
                </td>

                <td className="border border-slate-500 p-2">
                  {fmt(q.plan)}
                </td>

                <td className="border border-slate-500 p-2">
                  {fmt(q.behavioral)}
                </td>

                <td className="border border-slate-500 p-2">
                  {q.level || '—'}
                </td>
              </tr>
            ))}

            <tr>
              <th className="border border-slate-500 p-2">
                Consolidated six-month performance
              </th>

              <td className="border border-slate-500 p-2">
                {fmt(c.plan)}
              </td>

              <td className="border border-slate-500 p-2">
                {fmt(c.behavioral)}
              </td>

              <td className="border border-slate-500 p-2">
                {c.level || '—'} · Total {fmt(c.total)}/100
              </td>
            </tr>
          </tbody>
        </table>

        {/* Behavioral breakdown */}

        <h3 className="mt-8 font-bold">
          Behavioral score breakdown
        </h3>

        <table className="mt-2 w-full border-collapse text-sm">
          <tbody>
            {[
              ['Self-assessment (5)', c.self],
              ['Team assessment (15)', c.team],
              ['Immediate supervisor assessment (10)', c.supervisor],
            ].map(([key, value]) => (
              <tr key={key}>
                <td className="border border-slate-500 p-2">
                  {key}
                </td>

                <td className="border border-slate-500 p-2 text-center">
                  {fmt(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Strengths */}

        <h3 className="mt-8 font-bold">
          EMPLOYEE'S STRENGTHS DEMONSTRATED DURING THE PERFORMANCE PERIOD:
        </h3>

        <p className="min-h-16 whitespace-pre-wrap border-b border-slate-400 py-3">
          {item.strengths || ''}
        </p>

        {/* Improvement areas */}

        <h3 className="mt-6 font-bold">
          GAPS / AREAS FOR IMPROVEMENT IDENTIFIED DURING THE PERFORMANCE PERIOD:
        </h3>

        <p className="min-h-16 whitespace-pre-wrap border-b border-slate-400 py-3">
          {item.gaps || ''}
        </p>

        {/* Supervisor signature */}

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
          <p>
            Immediate supervisor's full name:{' '}
            <strong>{item.supervisor.name}</strong>

            <br />
            <br />

            Signature: ____________________

            <br />
            <br />

            Date: ____________________
          </p>

          <p>
            Employee's full name:{' '}
            <strong>{item.employee.name}</strong>

            <br />
            <br />

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

        {/* Agreement section */}

        <h3 className="mt-8 font-bold">
          I AGREE WITH THE RESULT OF THE PERFORMANCE EVALUATION BASED ON PLANNED RESULTS:
        </h3>

        <p className="mt-4 text-sm">
          Employee's name:{' '}
          {item.response?.value === 'agree'
            ? item.employee.name
            : '________________________'}

          {'  '}Signature: __________________

          {'  '}Date: __________________
        </p>

        {/* Disagreement section */}

        <h3 className="mt-8 font-bold">
          I DO NOT AGREE WITH THE RESULT OF THE PERFORMANCE EVALUATION FOR THE FOLLOWING REASON(S):
        </h3>

        <p className="min-h-14 whitespace-pre-wrap border-b border-slate-400 py-3">
          {item.response?.value === 'disagree'
            ? item.response.reason
            : ''}
        </p>

        <p className="mt-4 text-sm">
          Employee's name:{' '}
          {item.response?.value === 'disagree'
            ? item.employee.name
            : '________________________'}

          {'  '}Signature: __________________

          {'  '}Date: __________________
        </p>

        <p className="mt-12 text-center text-xs text-slate-500">
          Six-Month Performance Evaluation Summary Form — English
        </p>
      </article>
    </div>
  );
}