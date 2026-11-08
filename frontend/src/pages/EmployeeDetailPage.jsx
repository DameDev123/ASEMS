
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileText,
  MessageSquare,
  Save,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { adminEvaluationApi as api } from '../services/adminEvaluationApi.js';

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

const ratingOptions = [
  { value: 1, label: 'Poor', description: 'Performance needs significant improvement.' },
  { value: 2, label: 'Fair', description: 'Performance is below expectations.' },
  { value: 3, label: 'Good', description: 'Performance meets expectations.' },
  { value: 4, label: 'Very good', description: 'Performance exceeds expectations.' },
  { value: 5, label: 'Excellent', description: 'Performance consistently exceeds expectations.' },
];

function getStatus(status) {
  const values = {
    draft: ['Draft', 'bg-amber-50 text-amber-700'],
    submitted: ['Submitted', 'bg-blue-50 text-blue-700'],
    agreed: ['Agreed', 'bg-emerald-50 text-emerald-700'],
    disputed: ['Disagreed', 'bg-rose-50 text-rose-700'],
    finalized: ['Finalized', 'bg-emerald-50 text-emerald-700'],
  };

  return values[String(status || '').toLowerCase()] ||
    ['In progress', 'bg-slate-100 text-slate-600'];
}

function Notice({ error, success }) {
  if (!error && !success) return null;

  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`rounded-xl border p-4 text-sm ${
        error
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <div className="flex items-start gap-2">
        {error ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
        <p>{error || success}</p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
      <span className="mx-auto mb-3 block h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" />
      <p className="text-sm text-slate-500">Loading evaluation...</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
        <Icon size={19} />
      </span>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function RatingControl({ value, onChange, disabled }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ratingOptions.map((option) => {
        const selected = Number(value) === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            title={`${option.label}: ${option.description}`}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition ${
              selected
                ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <span>{option.value}</span>
          </button>
        );
      })}
    </div>
  );
}

function normalizeCriteria(detail) {
  const possible =
    detail?.criteria ||
    detail?.period?.criteria ||
    detail?.assessmentCriteria ||
    [];

  if (!Array.isArray(possible)) return [];

  return possible.map((criterion) => ({
    id: criterion.id ?? criterion.criterionId,
    title:
      criterion.title ||
      criterion.name ||
      criterion.criterion ||
      criterion.description ||
      'Evaluation criterion',
    description: criterion.description || '',
    category: criterion.category || '',
    required: criterion.required !== false,
    rating:
      criterion.rating ??
      criterion.score ??
      criterion.selfRating ??
      '',
    comments: criterion.comments || '',
  }));
}

function normalizeScores(detail, criteria) {
  const assessment =
    detail?.selfAssessment ||
    detail?.self ||
    detail?.assessments?.self ||
    {};

  const scoreRows =
    assessment.scores ||
    detail?.selfScores ||
    [];

  const byId = new Map(
    Array.isArray(scoreRows)
      ? scoreRows.map((row) => [
          String(row.criterionId ?? row.criterion_id ?? row.id),
          row,
        ])
      : [],
  );

  return Object.fromEntries(
    criteria.map((criterion) => {
      const saved = byId.get(String(criterion.id));

      return [
        String(criterion.id),
        {
          rating:
            saved?.rating ??
            saved?.score ??
            criterion.rating ??
            '',
          comments:
            saved?.comments ??
            criterion.comments ??
            '',
        },
      ];
    }),
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();

  const [detail, setDetail] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [response, setResponse] = useState('');
  const [responseComments, setResponseComments] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await api.detail(id);
      setDetail(result);

      const rows = normalizeCriteria(result);
      setCriteria(rows);
      setScores(normalizeScores(result, rows));

      const self =
        result?.selfAssessment ||
        result?.self ||
        result?.assessments?.self ||
        {};

      setStrengths(
        self.strengths ||
        self.commentStrengths ||
        '',
      );

      setImprovements(
        self.improvementAreas ||
        self.commentImprovements ||
        '',
      );

      const existingResponse =
        result?.employeeResponse ||
        result?.response ||
        {};

      setResponse(existingResponse.response || '');
      setResponseComments(
        existingResponse.employeeComments ||
        existingResponse.comments ||
        '',
      );
    } catch (err) {
      setError(err.message || 'Unable to load this evaluation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const assignmentStatus = String(detail?.status || '').toLowerCase();

  const selfAssessment =
    detail?.selfAssessment ||
    detail?.self ||
    detail?.assessments?.self ||
    {};

  const supervisorAssessment =
    detail?.supervisorAssessment ||
    detail?.supervisor ||
    detail?.assessments?.supervisor ||
    {};

  const permissions = detail?.permissions || {};

  const canEdit =
    permissions.canEditSelf ??
    (['draft', ''].includes(assignmentStatus) &&
      selfAssessment.status !== 'submitted');

  const canRespond =
    permissions.canRespond ??
    (assignmentStatus === 'awaiting_response' ||
      assignmentStatus === 'supervisor_submitted');

  const isFinalized =
    assignmentStatus === 'finalized' ||
    detail?.result?.status === 'finalized';

  const completedCount = useMemo(
    () =>
      criteria.filter((criterion) => {
        const rating = scores[String(criterion.id)]?.rating;
        return rating !== '' && rating !== null && rating !== undefined;
      }).length,
    [criteria, scores],
  );

  const requiredCount = criteria.filter((item) => item.required).length;

  const requiredCompleted = criteria.filter((criterion) => {
    const rating = scores[String(criterion.id)]?.rating;
    return (
      criterion.required &&
      rating !== '' &&
      rating !== null &&
      rating !== undefined
    );
  }).length;

  const progress = criteria.length
    ? Math.round((completedCount / criteria.length) * 100)
    : 0;

  const updateScore = (criterionId, field, value) => {
    setScores((previous) => ({
      ...previous,
      [String(criterionId)]: {
        ...(previous[String(criterionId)] || {}),
        [field]: value,
      },
    }));
  };

  const buildPayload = () => ({
    scores: criteria.map((criterion) => ({
      criterionId: Number(criterion.id),
      rating: Number(scores[String(criterion.id)]?.rating),
      comments: scores[String(criterion.id)]?.comments?.trim() || null,
    })).filter((item) => Number.isFinite(item.rating)),
    strengths: strengths.trim(),
    improvementAreas: improvements.trim(),
  });

  const saveDraft = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.self(id, buildPayload());
      setSuccess('Your self-assessment draft has been saved.');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to save your self-assessment.');
    } finally {
      setSaving(false);
    }
  };

  const submitSelfAssessment = async () => {
    if (requiredCompleted !== requiredCount) {
      setError('Please rate every required criterion before submitting.');
      return;
    }

    if (!criteria.length) {
      setError('No evaluation criteria are available for this period.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.self(id, buildPayload());
      await api.submit(id);
      setSuccess('Your self-assessment has been submitted successfully.');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to submit your assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitResponse = async () => {
    if (!response) {
      setError('Please select Agree or Disagree.');
      return;
    }

    if (response === 'disagreed' && !responseComments.trim()) {
      setError('Please explain why you disagree with the assessment.');
      return;
    }

    setResponding(true);
    setError('');
    setSuccess('');

    try {
      await api.response(id, {
        response,
        employeeComments: responseComments.trim(),
      });

      setSuccess('Your response has been recorded.');
      await load();
    } catch (err) {
      setError(err.message || 'Unable to record your response.');
    } finally {
      setResponding(false);
    }
  };

  if (loading) return <Loading />;

  if (!detail) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {error || 'Evaluation not found or you do not have access.'}
        <div className="mt-4">
          <Link to="/admin-evaluations/employee" className="font-semibold underline">
            Return to my evaluations
          </Link>
        </div>
      </div>
    );
  }

  const period = detail.period || {};
  const employee = detail.employee || {};
  const supervisor = detail.supervisor || {};
  const result = detail.result || detail.summary?.consolidated || {};

  const [statusLabel, statusClass] = getStatus(assignmentStatus);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/admin-evaluations/employee"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to my evaluations
      </Link>

      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-medium text-blue-700">
              Administrative staff
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {period.title || 'My performance evaluation'}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Review your evaluation details, complete your self-assessment,
              and respond to supervisor feedback.
            </p>
          </div>

          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </span>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Employee</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {employee.name || 'My account'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Supervisor</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {supervisor.name || 'Not assigned'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Evaluation period</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {period.startDate || '—'} – {period.endDate || '—'}
            </p>
          </div>
        </div>
      </header>

      <Notice error={error} success={success} />

      {canEdit && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={ClipboardCheck}
            title="My self-assessment"
            description="Rate your performance against the approved criteria for this evaluation period."
          />

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">
                Assessment completion
              </span>
              <span className="font-semibold tabular-nums text-blue-700">
                {completedCount} / {criteria.length} ({progress}%)
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-blue-700 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {!criteria.length ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No criteria have been configured for this evaluation period yet.
              Please contact the responsible office.
            </div>
          ) : (
            <div className="space-y-5">
              {criteria.map((criterion, index) => {
                const current = scores[String(criterion.id)] || {};

                return (
                  <article
                    key={criterion.id}
                    className="rounded-xl border border-slate-200 p-4 sm:p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Criterion {index + 1}
                          {criterion.category ? ` · ${criterion.category}` : ''}
                        </p>

                        <h3 className="mt-1 font-semibold text-slate-900">
                          {criterion.title}
                          {criterion.required && (
                            <span className="ml-1 text-rose-600">*</span>
                          )}
                        </h3>

                        {criterion.description &&
                          criterion.description !== criterion.title && (
                            <p className="mt-1 text-sm leading-5 text-slate-500">
                              {criterion.description}
                            </p>
                          )}
                      </div>

                      {current.rating !== '' && (
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          {current.rating}/5
                        </span>
                      )}
                    </div>

                    <RatingControl
                      value={current.rating}
                      disabled={!canEdit}
                      onChange={(value) =>
                        updateScore(criterion.id, 'rating', value)
                      }
                    />

                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                        Evidence or comments
                      </label>

                      <textarea
                        className={inputClass}
                        rows={2}
                        maxLength={3000}
                        placeholder="Describe relevant work, achievements, or evidence..."
                        value={current.comments || ''}
                        onChange={(event) =>
                          updateScore(
                            criterion.id,
                            'comments',
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              My strengths and achievements
              <textarea
                className={`${inputClass} mt-2`}
                rows={4}
                maxLength={5000}
                value={strengths}
                onChange={(event) => setStrengths(event.target.value)}
                placeholder="Describe your major achievements during this period..."
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Areas for improvement
              <textarea
                className={`${inputClass} mt-2`}
                rows={4}
                maxLength={5000}
                value={improvements}
                onChange={(event) => setImprovements(event.target.value)}
                placeholder="Identify areas where you want to improve..."
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <button
              type="button"
              className={secondaryButton}
              onClick={saveDraft}
              disabled={saving || submitting}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save draft'}
            </button>

            <button
              type="button"
              className={primaryButton}
              onClick={submitSelfAssessment}
              disabled={
                saving ||
                submitting ||
                !criteria.length ||
                requiredCompleted !== requiredCount
              }
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit self-assessment'}
            </button>
          </div>
        </section>
      )}

      {!canEdit && selfAssessment.status === 'submitted' && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-emerald-700" size={20} />
            <div>
              <h2 className="font-semibold text-emerald-900">
                Self-assessment submitted
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Your self-assessment has been submitted. It is now available
                for the next stage of the evaluation workflow.
              </p>
            </div>
          </div>
        </section>
      )}

      {supervisorAssessment.status === 'submitted' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={UserRound}
            title="Supervisor assessment"
            description="Review the assessment submitted by your assigned supervisor."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Supervisor</p>
              <p className="mt-1 font-semibold text-slate-900">
                {supervisor.name || 'Assigned supervisor'}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Assessment status</p>
              <p className="mt-1 font-semibold text-slate-900">Submitted</p>
            </div>
          </div>

          {supervisorAssessment.strengths && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Recognized strengths
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {supervisorAssessment.strengths}
              </p>
            </div>
          )}

          {supervisorAssessment.improvementAreas && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Areas for improvement
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {supervisorAssessment.improvementAreas}
              </p>
            </div>
          )}

          {Array.isArray(supervisorAssessment.scores) && (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Criterion</th>
                    <th className="px-4 py-3">Supervisor rating</th>
                    <th className="px-4 py-3">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supervisorAssessment.scores.map((score, index) => (
                    <tr key={score.criterionId || score.criterion_id || index}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {score.criterionTitle || score.title || `Criterion ${index + 1}`}
                      </td>
                      <td className="px-4 py-3">
                        {score.rating ?? score.score ?? '—'} / 5
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {score.comments || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {canRespond && (
        <section className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionHeading
            icon={MessageSquare}
            title="Your response to the evaluation"
            description="After reviewing your supervisor's assessment, record whether you agree or disagree."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setResponse('agreed')}
              className={`rounded-xl border p-4 text-left transition ${
                response === 'agreed'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <CheckCircle2
                className="mb-2 text-emerald-700"
                size={22}
              />
              <p className="font-semibold text-slate-900">
                I agree with the assessment
              </p>
              <p className="mt-1 text-xs text-slate-500">
                I acknowledge the supervisor's evaluation.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setResponse('disagreed')}
              className={`rounded-xl border p-4 text-left transition ${
                response === 'disagreed'
                  ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-100'
                  : 'border-slate-200 hover:border-rose-300'
              }`}
            >
              <CircleAlert className="mb-2 text-rose-700" size={22} />
              <p className="font-semibold text-slate-900">
                I disagree with the assessment
              </p>
              <p className="mt-1 text-xs text-slate-500">
                I want to record my concerns or clarification.
              </p>
            </button>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Your comments
            <textarea
              className={`${inputClass} mt-2`}
              rows={4}
              maxLength={5000}
              value={responseComments}
              onChange={(event) => setResponseComments(event.target.value)}
              placeholder={
                response === 'disagreed'
                  ? 'Explain the reasons for your disagreement...'
                  : 'Add any comments you would like included in the record...'
              }
            />
          </label>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className={primaryButton}
              disabled={
                responding ||
                !response ||
                (response === 'disagreed' && !responseComments.trim())
              }
              onClick={submitResponse}
            >
              <Send size={16} />
              {responding ? 'Recording response...' : 'Submit response'}
            </button>
          </div>
        </section>
      )}

      {detail.employeeResponse && !canRespond && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeading
            icon={MessageSquare}
            title="Your recorded response"
            description="Your response is preserved in the evaluation history."
          />

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">
              Response:
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-800">
              {detail.employeeResponse.response}
            </span>
          </div>

          {detail.employeeResponse.employeeComments && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {detail.employeeResponse.employeeComments}
            </p>
          )}
        </section>
      )}

      {isFinalized && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={21} className="mt-0.5 text-emerald-700" />
            <div>
              <h2 className="font-semibold text-emerald-900">
                Final evaluation available
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Your evaluation has been finalized by the authorized office.
              </p>
              <p className="mt-3 text-2xl font-bold text-emerald-900">
                {result.finalPercentage != null
                  ? `${Number(result.finalPercentage).toFixed(2)}%`
                  : result.final_percentage != null
                    ? `${Number(result.final_percentage).toFixed(2)}%`
                    : 'Score recorded'}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
        <FileText size={17} className="shrink-0" />
        Your submitted assessment and response are recorded in the evaluation
        history. Submitted assessments cannot be edited unless the authorized
        process permits reopening.
      </div>
    </div>
  );
}
