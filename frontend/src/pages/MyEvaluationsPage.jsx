
import { confirmAction } from '../utils/confirmAction.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  RefreshCw,
  Save,
  Search,
  Send,
  X,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';

const EDITABLE = [null, undefined, 'draft', 'returned', 'rejected'];
const CLOSED_MESSAGE = /already been submitted|cannot be edited|no longer be changed/i;

const STATUS_LABEL = {
  pending: 'Not started',
  draft: 'In progress',
  submitted: 'Submitted',
  returned: 'Returned',
  rejected: 'Rejected',
  approved: 'Approved',
};

const STATUS_TONE = {
  pending: 'status-gray',
  draft: 'status-amber',
  submitted: 'status-blue',
  returned: 'status-amber',
  rejected: 'status-gray',
  approved: 'status-green',
};

const TYPE_LABEL = {
  student: 'Student evaluation',
  department_head: 'Department head evaluation',
  peer: 'Peer evaluation',
  self: 'Self evaluation',
};

const TYPE_HINT = {
  student: 'You are evaluating this instructor as a student.',
  department_head: 'You are evaluating this instructor as their department head.',
  peer: 'You are evaluating this instructor as a peer.',
  self: 'You are evaluating your own teaching (self-evaluation).',
};

const ROW_BUTTON =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60';

const SECONDARY_BUTTON =
  'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60';

/*
 * Display one professional information field.
 * Missing values are displayed as a dash instead of hiding the field.
 */
function Detail({ label, children }) {
  const empty =
    children === undefined ||
    children === null ||
    (typeof children === 'string' && children.trim() === '');

  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {empty ? '—' : children}
      </p>
    </div>
  );
}

/*
 * Normalize assignment information returned by the backend.
 * Supports both camelCase and snake_case field names.
 */
function normalizeAssignmentDetail(detail = {}) {
  const instructor =
    detail.instructor_name ??
    detail.instructorName ??
    detail.instructor?.name ??
    detail.instructor?.full_name ??
    detail.instructor?.fullName;

  const college =
    detail.college_name ??
    detail.collegeName ??
    detail.college ??
    detail.college?.name ??
    detail.institute_name ??
    detail.instituteName ??
    detail.institute ??
    detail.institute?.name ??
    detail.school_name ??
    detail.schoolName ??
    detail.school ??
    detail.school?.name;

  const department =
    detail.department_name ??
    detail.departmentName ??
    detail.department ??
    detail.department?.name;

  const courseTitle =
    detail.course_title ??
    detail.courseTitle ??
    detail.course?.title ??
    detail.course?.name;

  const courseCode =
    detail.course_code ??
    detail.courseCode ??
    detail.course?.code;

  const batch =
    detail.batch ??
    detail.batch_name ??
    detail.batchName ??
    detail.batch?.name ??
    detail.batch?.title;

  const semester =
    detail.semester ??
    detail.semester_name ??
    detail.semesterName ??
    detail.semester?.name ??
    detail.semester?.title;

  const section =
    detail.section ??
    detail.section_name ??
    detail.sectionName ??
    detail.section?.name ??
    detail.section?.title;

  const academicYear =
    detail.academic_year ??
    detail.academicYear ??
    detail.year ??
    detail.academic_year_name ??
    detail.academicYearName;

  const cycleTitle =
    detail.cycle_title ??
    detail.cycleTitle ??
    detail.cycle_name ??
    detail.cycleName ??
    detail.cycle?.title ??
    detail.cycle?.name;

  return {
    ...detail,

    form_version_id:
      detail.form_version_id ??
      detail.formVersionId ??
      detail.form_version?.id ??
      detail.formVersion?.id,

    instructor_name: instructor,
    college_name: college,
    department_name: department,
    course_title: courseTitle,
    course_code: courseCode,
    batch,
    semester,
    section,
    academic_year: academicYear,
    cycle_title: cycleTitle,

    cycle_status:
      detail.cycle_status ??
      detail.cycleStatus ??
      detail.cycle?.status,

    comment_strengths:
      detail.comment_strengths ??
      detail.commentStrengths ??
      '',

    comment_improvements:
      detail.comment_improvements ??
      detail.commentImprovements ??
      '',

    submitted_at:
      detail.submitted_at ??
      detail.submittedAt,

    evaluation_status:
      detail.evaluation_status ??
      detail.evaluationStatus ??
      null,

    status:
      detail.assignment_status ??
      detail.assignmentStatus ??
      detail.status ??
      'pending',
  };
}

function effectiveStatus(row) {
  return row.evaluation_status ?? row.status;
}

function isEditable(row, readOnly = false) {
  return !readOnly &&
    row.cycle_status === 'active' &&
    EDITABLE.includes(row.evaluation_status ?? null);
}

function formatRole(role) {
  return (role || '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function computeScore(criteria, scores, weight, scaleMax) {
  let sum = 0;
  let counted = 0;
  let na = 0;
  let answered = 0;

  criteria.forEach((criterion) => {
    const value = scores[criterion.id];

    if (value === undefined || value === null) return;

    answered += 1;

    if (value === 'NA') {
      na += 1;
    } else {
      sum += Number(value);
      counted += 1;
    }
  });

  const average = counted ? sum / counted : null;

  return {
    answered,
    na,
    counted,
    average,
    weighted: average === null ? null : (average * weight) / 5,
    percent: average === null
      ? null
      : Math.max(0, Math.min(100, (average / (scaleMax || 5)) * 100)),
  };
}

function labelFor(version, value) {
  try {
    let labels = version?.scaleLabels;

    if (typeof labels === 'string') labels = JSON.parse(labels);
    if (!labels) return '';

    const found = Array.isArray(labels)
      ? labels[value - version.scaleMin]
      : labels[value] ?? labels[String(value)];

    if (found && typeof found === 'object') {
      return String(found.label ?? found.text ?? '');
    }

    return found ? String(found) : '';
  } catch {
    return '';
  }
}

const fmt = (value, digits = 2) =>
  value === null || value === undefined ? '—' : Number(value).toFixed(digits);

function StatTile({ label, value, hint }) {
  return (
    <div className="min-w-[96px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums leading-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function ProgressRing({ done, total }) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="relative h-14 w-14 shrink-0"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={`${done} of ${total} criteria answered`}
    >
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden="true">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-slate-200"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          className={`transition-all duration-300 ${
            percent === 100 ? 'text-emerald-500' : 'text-navy-800'
          }`}
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-slate-900">
        {percent}%
      </span>
    </div>
  );
}

function bandClass(percent) {
  if (percent === null || percent === undefined) return 'bg-slate-300';
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function ScoreTile({ label, value, unit, hint, percent }) {
  return (
    <div className="min-w-[132px]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-0.5 flex items-baseline gap-1 leading-none">
        <span className="text-2xl font-bold tabular-nums text-slate-900">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        )}
      </p>

      {percent !== undefined && (
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${bandClass(percent)}`}
            style={{ width: `${percent ?? 0}%` }}
          />
        </div>
      )}

      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function EvaluationForm({ assignmentId, onBack, readOnly = false }) {
  const [assignment, setAssignment] = useState(null);
  const [version, setVersion] = useState(null);
  const [scores, setScores] = useState({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [savedAt, setSavedAt] = useState(null);
  const [showMissing, setShowMissing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attention, setAttention] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionError, setSectionError] = useState('');
  const [flaggedSection, setFlaggedSection] = useState(null);

  const changeRef = useRef(0);
  const latest = useRef({ scores: {}, strengths: '', improvements: '' });

  latest.current = { scores, strengths, improvements };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    setError('');

    try {
      const response = await apiRequest(`/assignments/${assignmentId}`);

      const rawDetail = response?.data;

      if (!rawDetail) {
        throw new Error('Assignment details were not returned by the server.');
      }

      const detail = normalizeAssignmentDetail(rawDetail);

      if (!detail.form_version_id) {
        throw new Error('The assignment does not have a valid form version ID.');
      }

      const form = (
        await apiRequest(`/forms/versions/${detail.form_version_id}`)
      )?.data?.version;

      if (!form) {
        throw new Error('The evaluation form version could not be found.');
      }

      const saved = {};

      (detail.scores ?? []).forEach((row) => {
        saved[row.criterion_id] = row.is_na ? 'NA' : row.score;
      });

      setAssignment(detail);
      setVersion(form);
      setScores(saved);

      const firstOpen = (form?.sections ?? []).findIndex((section) =>
        section.criteria.some(
          (item) => saved[item.id] === undefined || saved[item.id] === null
        )
      );

      setActiveSection(firstOpen === -1 ? 0 : firstOpen);
      setSectionError('');
      setFlaggedSection(null);
      setStrengths(detail.comment_strengths ?? '');
      setImprovements(detail.comment_improvements ?? '');
      setDirty(false);
      setShowMissing(false);
    } catch (err) {
      setError(err.message || 'Unable to load this evaluation.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const criteria = useMemo(
    () => version?.sections.flatMap((section) => section.criteria) ?? [],
    [version]
  );

  const weight = version?.weight ?? 0;

  const stats = useMemo(
    () => computeScore(criteria, scores, weight, version?.scaleMax),
    [criteria, scores, weight, version]
  );

  const editable = Boolean(assignment) && isEditable(assignment, readOnly);
  const remaining = criteria.length - stats.answered;

  const sectionList = version?.sections ?? [];

  const isAnswered = (item) =>
    scores[item.id] !== undefined && scores[item.id] !== null;

  const sectionComplete = (section) =>
    section.criteria.every(isAnswered);

  const firstOpenSection = sectionList.findIndex(
    (section) => !sectionComplete(section)
  );

  const reachable =
    firstOpenSection === -1
      ? Math.max(sectionList.length - 1, 0)
      : firstOpenSection;

  const currentSection = Math.min(activeSection, reachable);
  const isLastSection = currentSection >= sectionList.length - 1;

  const options = useMemo(() => {
    if (!version) return [];

    const list = [];

    for (
      let value = version.scaleMin;
      value <= version.scaleMax;
      value += 1
    ) {
      list.push(value);
    }

    return list;
  }, [version]);

  const saveDraft = useCallback(async () => {
    const current = latest.current;

    const list = Object.entries(current.scores)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([criterionId, score]) => ({
        criterionId: Number(criterionId),
        score,
      }));

    if (!list.length) return false;

    await apiRequest(`/evaluations/${assignmentId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({
        scores: list,
        commentStrengths: current.strengths || null,
        commentImprovements: current.improvements || null,
      }),
    });

    return true;
  }, [assignmentId]);

  useEffect(() => {
    if (!editable || !dirty || busy) return undefined;

    const timer = setTimeout(async () => {
      const stamp = changeRef.current;

      setSaveState('saving');

      try {
        const saved = await saveDraft();

        if (!saved) {
          setSaveState('idle');
          return;
        }

        setSavedAt(new Date());
        setSaveState('saved');

        if (changeRef.current === stamp) setDirty(false);
      } catch (err) {
        setSaveState('error');

        if (CLOSED_MESSAGE.test(err?.message || '')) {
          load(true);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [dirty, scores, strengths, improvements, editable, busy, saveDraft, load]);

  useEffect(() => {
    if (!dirty) return undefined;

    function warn(event) {
      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warn);

    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (!confirmOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape' && !busy) {
        setConfirmOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, busy]);

  function touch() {
    changeRef.current += 1;
    setDirty(true);
    setSaveState('idle');
    setNotice('');
  }

  function advanceFrom(criterionId, nextScores) {
    const answered = (item) =>
      nextScores[item.id] !== undefined && nextScores[item.id] !== null;

    const list = sectionList[currentSection]?.criteria ?? criteria;
    const target = list.find((item) => !answered(item));

    if (!target) {
      setSectionError('');
      setFlaggedSection(null);
    }

    window.setTimeout(() => {
      if (target) {
        const clickedAt = list.findIndex(
          (item) => item.id === criterionId
        );

        const targetAt = list.findIndex(
          (item) => item.id === target.id
        );

        setAttention({
          id: target.id,
          skipped: targetAt < clickedAt,
        });

        document
          .getElementById(`criterion-${target.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setAttention(null);

        const goal =
          sectionList.length > 1 && !isLastSection
            ? 'section-next'
            : 'strengths';

        document
          .getElementById(goal)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
  }

  function setScore(criterionId, value) {
    if (!editable || busy) return;

    const list = sectionList[currentSection]?.criteria ?? criteria;

    const at = list.findIndex(
      (item) => item.id === criterionId
    );

    if (at === -1) return;

    const firstOpen = list.findIndex(
      (item) => !isAnswered(item)
    );

    if (firstOpen !== -1 && at > firstOpen) {
      setSectionError(
        `Please first answer criterion ${firstOpen + 1} before criterion ${at + 1}. You cannot skip a criterion.`
      );

      setAttention({
        id: list[firstOpen].id,
        skipped: true,
      });

      document
        .getElementById(`criterion-${list[firstOpen].id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return;
    }

    if (scores[criterionId] === value) return;

    const next = {
      ...latest.current.scores,
      [criterionId]: value,
    };

    setScores(next);
    touch();
    setSectionError('');
    advanceFrom(criterionId, next);
  }

  async function handleBack() {
    if (
      dirty &&
      !await confirmAction('You have unsaved changes. Leave without saving?')
    ) {
      return;
    }

    onBack();
  }

  function jumpToNext() {
    const first = criteria.find(
      (item) => scores[item.id] === undefined || scores[item.id] === null
    );

    if (!first) return;

    const at = sectionList.findIndex((section) =>
      section.criteria.some((item) => item.id === first.id)
    );

    const switching =
      editable && at !== -1 && at !== currentSection;

    if (switching) setActiveSection(at);

    window.setTimeout(() => {
      document
        .getElementById(`criterion-${first.id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, switching ? 120 : 0);
  }

  function goToSection(index) {
    if (index < 0 || index >= sectionList.length) return;

    if (index > reachable) {
      const blocker = sectionList[firstOpenSection];

      const open = blocker.criteria.filter(
        (item) => !isAnswered(item)
      ).length;

      setFlaggedSection(firstOpenSection);

      setSectionError(
        `Please first finish the rest of "${blocker.title}" (${open} criteri${open === 1 ? 'on' : 'a'} still need${open === 1 ? 's' : ''} an answer) before opening this section.`
      );

      if (firstOpenSection !== currentSection) {
        setActiveSection(firstOpenSection);
      }

      return;
    }

    setSectionError('');
    setFlaggedSection(null);
    setAttention(null);
    setActiveSection(index);

    window.setTimeout(() => {
      document
        .getElementById('section-top')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  function nextSection() {
    const section = sectionList[currentSection];

    const open = section.criteria.filter(
      (item) => !isAnswered(item)
    );

    if (open.length > 0) {
      setFlaggedSection(currentSection);

      setSectionError(
        `Please first finish the rest of "${section.title}" (${open.length} criteri${open.length === 1 ? 'on' : 'a'} still need${open.length === 1 ? 's' : ''} an answer) before moving to the next section.`
      );

      document
        .getElementById(`criterion-${open[0].id}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      return;
    }

    goToSection(currentSection + 1);
  }

  async function handleSave() {
    if (!editable) return;

    setBusy(true);
    setError('');
    setNotice('');

    const stamp = changeRef.current;

    try {
      const saved = await saveDraft();

      if (!saved) {
        setError('Answer at least one criterion before saving.');
      } else {
        setSavedAt(new Date());
        setSaveState('saved');

        if (changeRef.current === stamp) setDirty(false);

        setNotice('Draft saved.');
      }
    } catch (err) {
      setSaveState('error');

      const message = err.message || 'Unable to save the draft.';

      if (CLOSED_MESSAGE.test(message)) {
        await load(true);
      }

      setError(message);
    } finally {
      setBusy(false);
    }
  }

  function reviewAndSubmit() {
    if (!editable) return;

    if (remaining > 0) {
      setShowMissing(true);

      setError(
        `${remaining} criteri${remaining === 1 ? 'on still needs' : 'a still need'} an answer before you can submit.`
      );

      jumpToNext();
      return;
    }

    setError('');
    setConfirmOpen(true);
  }

  async function doSubmit() {
    if (!editable) return;

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await saveDraft();

      await apiRequest(`/evaluations/${assignmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          commentStrengths: strengths || null,
          commentImprovements: improvements || null,
        }),
      });

      setConfirmOpen(false);
      setDirty(false);

      await load(true);

      setNotice('Evaluation submitted. Thank you.');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setConfirmOpen(false);

      const message =
        err.message || 'Unable to submit the evaluation.';

      if (CLOSED_MESSAGE.test(message)) {
        await load(true);
      }

      setError(message);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading evaluation…</p>;
  }

  if (!assignment || !version) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className={ROW_BUTTON}
        >
          <ArrowLeft size={13} /> Back
        </button>

        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error || 'Evaluation not found.'}
        </div>
      </div>
    );
  }

  const status = effectiveStatus(assignment);

  const saveText =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'error'
        ? 'Autosave failed. Click Save draft.'
        : dirty
          ? 'Unsaved changes'
          : savedAt
            ? `Saved ${savedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : '';

  const legend = options
    .map((value) => [value, labelFor(version, value)])
    .filter(([, text]) => text);

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={handleBack}
          className={ROW_BUTTON}
        >
          <ArrowLeft size={13} /> Back to list
        </button>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-medium text-white">
            {TYPE_LABEL[version.evaluatorType] ?? version.title}
          </span>

          <span className={`status-pill ${STATUS_TONE[status] ?? 'status-gray'}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {version.title}
        </h1>

        {/* Professional Evaluation Information */}
        <section className="panel-card mt-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Evaluation Information
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Instructor, course, department and academic details
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
              <Lock size={17} />
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Instructor">
                {assignment.instructor_name}
              </Detail>

              <Detail label="College/Institute/School">
                {assignment.college_name}
              </Detail>

              <Detail label="Department">
                {assignment.department_name}
              </Detail>

              <Detail label="Course">
                {assignment.course_title}
              </Detail>

              <Detail label="Course Id">
                {assignment.course_code
                  ? `(${assignment.course_code})`
                  : null}
              </Detail>

              <Detail label="Batch">
                {assignment.batch}
              </Detail>

              <Detail label="Semester">
                {assignment.semester}
              </Detail>

              <Detail label="Section">
                {assignment.section}
              </Detail>

              <Detail label="Academic Year">
                {assignment.academic_year}
              </Detail>

              <Detail label="Cycle">
                {assignment.cycle_title}
              </Detail>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs leading-5 text-slate-500">
                {TYPE_HINT[version.evaluatorType]}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="sticky top-[78px] z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <ProgressRing
            done={stats.answered}
            total={criteria.length}
          />

          <div className="min-w-[150px] flex-1">
            <p className="text-sm font-semibold text-slate-800">
              {stats.answered} of {criteria.length} answered
            </p>

            <p className="text-[11px] text-slate-500">
              {remaining > 0
                ? `${remaining} remaining`
                : 'All criteria answered'}
              {stats.na ? ` · ${stats.na} N/A excluded` : ''}
            </p>

            {saveText && (
              <p
                className={`mt-1 text-[11px] ${
                  saveState === 'error'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {saveText}
              </p>
            )}
          </div>

          <ScoreTile
            label="Average score"
            value={stats.average === null ? '—' : fmt(stats.average)}
            unit={`/ ${version.scaleMax}`}
            percent={stats.percent}
            hint={
              stats.average === null
                ? 'Answer a criterion to see it'
                : remaining > 0
                  ? 'Provisional'
                  : 'Final for this form'
            }
          />

          <ScoreTile
            label="Weighted score"
            value={stats.weighted === null ? '—' : fmt(stats.weighted)}
            unit={`/ ${weight} pts`}
            hint="Counts toward the final report"
          />

          <ScoreTile
            label="Performance"
            value={
              stats.percent === null
                ? '—'
                : `${Math.round(stats.percent)}%`
            }
            hint="Of the maximum score"
          />

          {editable && (
            <div className="ml-auto flex flex-wrap gap-2">
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={jumpToNext}
                  className={ROW_BUTTON}
                >
                  <ArrowDown size={13} /> Next unanswered
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className={SECONDARY_BUTTON}
              >
                <Save size={15} /> Save draft
              </button>

              <button
                type="button"
                onClick={reviewAndSubmit}
                disabled={busy}
                className="primary-button disabled:opacity-60"
              >
                <Send size={15} /> Review &amp; submit
              </button>
            </div>
          )}
        </div>
      </div>

      {!editable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {readOnly
            ? 'Administrators can view evaluations but cannot fill them in on behalf of an evaluator.'
            : assignment.cycle_status !== 'active'
              ? 'This evaluation cycle is not active, so the form is read-only.'
              : `This evaluation is ${
                  STATUS_LABEL[status]?.toLowerCase() ?? status
                }${
                  assignment.submitted_at
                    ? ` (submitted ${new Date(
                        assignment.submitted_at
                      ).toLocaleString()})`
                    : ''
                } and can no longer be edited.`}
        </div>
      )}

      {(status === 'returned' || status === 'rejected') && editable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This evaluation was {status} by a reviewer. Update your answers and submit it again.
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {version.instructions && (
        <p className="panel-card whitespace-pre-line p-4 text-sm leading-6 text-slate-600">
          {version.instructions}
        </p>
      )}

      {legend.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg bg-slate-100 px-4 py-2.5 text-xs text-slate-600">
          {legend.map(([value, text]) => (
            <span key={value}>
              <strong className="text-slate-800">{value}</strong> = {text}
            </span>
          ))}

          {version.allowNa && (
            <span>
              <strong className="text-slate-800">N/A</strong> = not applicable (excluded from the average)
            </span>
          )}
        </div>
      )}

      {editable && sectionList.length > 1 && (
        <nav
          id="section-top"
          aria-label="Evaluation sections"
          className="flex flex-wrap gap-2"
        >
          {sectionList.map((section, i) => {
            const done = sectionComplete(section);
            const locked = i > reachable;
            const active = i === currentSection;

            return (
              <button
                key={section.id}
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => goToSection(i)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : locked
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-white/20'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {done ? (
                    <Check size={12} />
                  ) : locked ? (
                    <Lock size={11} />
                  ) : (
                    i + 1
                  )}
                </span>

                {section.title}
              </button>
            );
          })}
        </nav>
      )}

      {editable && sectionError && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {sectionError}
        </div>
      )}

      {(editable ? [sectionList[currentSection]] : sectionList)
        .filter(Boolean)
        .map((section) => {
          const sIndex = sectionList.indexOf(section);

          const sectionStats = computeScore(
            section.criteria,
            scores,
            weight,
            version.scaleMax
          );

          const firstOpenIdx = section.criteria.findIndex(
            (item) => !isAnswered(item)
          );

          return (
            <section
              key={section.id}
              className="panel-card overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  {section.title}
                </h2>

                <p className="text-xs tabular-nums text-slate-500">
                  {sectionStats.answered}/{section.criteria.length} answered
                  {sectionStats.average !== null &&
                    ` · average ${fmt(sectionStats.average)}`}
                </p>
              </div>

              <ul className="divide-y divide-slate-100">
                {section.criteria.map((criterion, index) => {
                  const value = scores[criterion.id];

                  const unanswered =
                    value === undefined || value === null;

                  const missing =
                    (
                      showMissing ||
                      flaggedSection === sIndex ||
                      (attention?.skipped &&
                        attention.id === criterion.id)
                    ) &&
                    editable &&
                    unanswered;

                  const locked =
                    editable &&
                    firstOpenIdx !== -1 &&
                    index > firstOpenIdx;

                  const pointed =
                    editable &&
                    unanswered &&
                    index === firstOpenIdx &&
                    !missing;

                  return (
                    <li
                      key={criterion.id}
                      id={`criterion-${criterion.id}`}
                      className={`flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between ${
                        locked ? 'opacity-50' : ''
                      } ${
                        missing
                          ? 'border-l-4 border-rose-400 bg-rose-50/50'
                          : pointed
                            ? 'border-l-4 border-navy-800 bg-slate-50'
                            : 'border-l-4 border-transparent'
                      }`}
                    >
                      <p className="text-sm text-slate-800">
                        {index + 1}. {criterion.text}

                        {missing && (
                          <span className="ml-2 text-xs font-medium text-rose-600">
                            Required
                          </span>
                        )}

                        {locked && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-500">
                            <Lock size={11} /> Locked until the criterion before it is answered
                          </span>
                        )}
                      </p>

                      <div
                        className="flex flex-wrap gap-1.5"
                        role="radiogroup"
                        aria-label={criterion.text}
                      >
                        {[...options, ...(version.allowNa ? ['NA'] : [])].map(
                          (option) => {
                            const selected = value === option;

                            return (
                              <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                title={
                                  option === 'NA'
                                    ? 'Not applicable'
                                    : labelFor(version, option)
                                }
                                disabled={!editable || busy}
                                aria-disabled={locked || undefined}
                                onClick={() =>
                                  setScore(criterion.id, option)
                                }
                                className={`h-9 min-w-9 rounded-lg border px-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${
                                  locked ? 'cursor-not-allowed' : ''
                                } ${
                                  selected
                                    ? 'border-navy-900 bg-navy-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:hover:bg-white'
                                }`}
                              >
                                {option === 'NA' ? 'N/A' : option}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

      {editable && sectionList.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {currentSection > 0 && (
              <button
                type="button"
                onClick={() => goToSection(currentSection - 1)}
                className={ROW_BUTTON}
              >
                <ArrowLeft size={13} /> Previous section
              </button>
            )}
          </div>

          {!isLastSection && (
            <div className="flex items-center gap-3">
              {sectionComplete(sectionList[currentSection]) && (
                <span className="text-xs font-medium text-emerald-700">
                  Section complete. Continue with the arrow.
                </span>
              )}

              <button
                id="section-next"
                type="button"
                onClick={nextSection}
                className="primary-button"
              >
                Next section <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {(!editable || isLastSection) && (
        <>
          <section className="panel-card grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="strengths"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Strengths
              </label>

              <textarea
                id="strengths"
                rows={4}
                maxLength={10000}
                disabled={!editable || busy}
                value={strengths}
                onChange={(event) => {
                  setStrengths(event.target.value);
                  touch();
                }}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-navy-800 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="improvements"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Areas for improvement
              </label>

              <textarea
                id="improvements"
                rows={4}
                maxLength={10000}
                disabled={!editable || busy}
                value={improvements}
                onChange={(event) => {
                  setImprovements(event.target.value);
                  touch();
                }}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-navy-800 disabled:bg-slate-50"
              />
            </div>
          </section>

          <p className="text-xs leading-5 text-slate-500">
            This is the score for your component only. The instructor&apos;s final
            score is calculated after all four components (student, department
            head, peer, self) are submitted.
          </p>

          {editable && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={busy}
                className={SECONDARY_BUTTON}
              >
                <Save size={15} /> Save draft
              </button>

              <button
                type="button"
                onClick={reviewAndSubmit}
                disabled={busy}
                className="primary-button disabled:opacity-60"
              >
                <Send size={15} /> Review &amp; submit
              </button>
            </div>
          )}
        </>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="panel-card w-full max-w-md space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="confirm-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Submit evaluation?
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  You will not be able to edit it after submitting, unless a
                  reviewer returns it.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                disabled={busy}
                onClick={() => setConfirmOpen(false)}
                className="icon-button -mr-2 -mt-2"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Instructor</dt>
                <dd className="font-medium text-slate-900">
                  {assignment.instructor_name}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Course</dt>
                <dd className="font-medium text-slate-900">
                  {assignment.course_title}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Answered</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {stats.answered}/{criteria.length}
                  {stats.na ? ` (${stats.na} N/A)` : ''}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Average</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {fmt(stats.average)} / {version.scaleMax}
                </dd>
              </div>

              <div className="col-span-2">
                <dt className="text-xs text-slate-500">Weighted score</dt>
                <dd className="font-medium tabular-nums text-slate-900">
                  {fmt(stats.weighted)} / {weight}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Keep editing
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={doSubmit}
                className="primary-button disabled:opacity-60"
              >
                <Send size={15} /> {busy ? 'Submitting…' : 'Submit now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function matchesFilter(row, filter) {
  const status = effectiveStatus(row);

  if (filter === 'all') return true;

  if (filter === 'returned') {
    return status === 'returned' || status === 'rejected';
  }

  return status === filter;
}

/*
 * Convert the backend's camelCase evaluation task fields into the
 * snake_case fields already used by this React page.
 */
function normalizeEvaluationTask(task) {
  return {
    id: task.assignmentId ?? task.assignment_id ?? task.id,

    cycle_id: task.cycleId ?? task.cycle_id,
    cycle_title: task.cycleTitle ?? task.cycle_title,
    cycle_status: task.cycleStatus ?? task.cycle_status,

    instructor_id: task.instructorId ?? task.instructor_id,
    instructor_name:
      task.instructorName ??
      task.instructor_name ??
      task.instructor?.name,

    evaluator_id: task.evaluatorId ?? task.evaluator_id,

    college_name:
      task.collegeName ??
      task.college_name ??
      task.college ??
      task.instituteName ??
      task.institute_name ??
      task.schoolName ??
      task.school_name,

    department_name:
      task.departmentName ??
      task.department_name ??
      task.department,

    form_id: task.formId ?? task.form_id,
    form_code: task.formCode ?? task.form_code,
    evaluator_type: task.evaluatorType ?? task.evaluator_type,

    form_title:
      task.formTitle ??
      task.form_title ??
      task.formCode ??
      task.form_code ??
      'Evaluation form',

    form_version_id: task.formVersionId ?? task.form_version_id,

    course_title: task.courseTitle ?? task.course_title,
    course_code: task.courseCode ?? task.course_code,

    batch: task.batch ?? task.batch_name ?? task.batchName,
    semester: task.semester ?? task.semester_name ?? task.semesterName,
    section: task.section ?? task.section_name ?? task.sectionName,

    academic_year:
      task.academicYear ??
      task.academic_year ??
      task.year,

    evaluation_date: task.evaluationDate ?? task.evaluation_date,

    status:
      task.assignmentStatus ??
      task.assignment_status ??
      task.status ??
      'pending',

    assignment_status:
      task.assignmentStatus ??
      task.assignment_status ??
      task.status ??
      'pending',

    evaluation_id: task.evaluationId ?? task.evaluation_id,

    evaluation_status:
      task.evaluationStatus ??
      task.evaluation_status ??
      null,

    submitted_at: task.submittedAt ?? task.submitted_at,

    total_criteria: task.totalCriteria ?? task.total_criteria ?? 0,
    answered_criteria: task.answeredCriteria ?? task.answered_criteria ?? 0,
  };
}

export default function MyEvaluationsPage({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [cycle, setCycle] = useState('');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  // Administrators oversee evaluations but never fill them in for an evaluator.
  const readOnly = user?.role === 'admin';

  const load = useCallback(async () => {
    if (readOnly) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Load only the evaluations assigned to the logged-in user.
      const result = await apiRequest('/evaluations');

      const tasks = Array.isArray(result?.data?.tasks)
        ? result.data.tasks
        : [];

      const normalizedTasks = tasks
        .map(normalizeEvaluationTask)
        .filter((task) => task.id !== undefined && task.id !== null);

      setRows(normalizedTasks);
    } catch (err) {
      setRows([]);
      setError(err.message || 'Unable to load your evaluations.');
    } finally {
      setLoading(false);
    }
  }, [readOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const result = {
      all: rows.length,
      pending: 0,
      draft: 0,
      returned: 0,
      submitted: 0,
      approved: 0,
    };

    rows.forEach((row) => {
      const status = effectiveStatus(row);

      if (status === 'rejected') {
        result.returned += 1;
      } else if (result[status] !== undefined) {
        result[status] += 1;
      }
    });

    return result;
  }, [rows]);

  const cycles = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      map.set(String(row.cycle_id), row.cycle_title);
    });

    return [...map.entries()];
  }, [rows]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();

    return rows
      .filter((row) => matchesFilter(row, filter))
      .filter((row) => !cycle || String(row.cycle_id) === cycle)
      .filter(
        (row) =>
          !text ||
          `${row.instructor_name ?? ''} ${row.course_title ?? ''} ${row.course_code ?? ''}`
            .toLowerCase()
            .includes(text)
      )
      .sort(
        (a, b) =>
          Number(isEditable(b, readOnly)) -
          Number(isEditable(a, readOnly))
      );
  }, [rows, filter, cycle, query, readOnly]);

  if (openId) {
    return (
      <EvaluationForm
        assignmentId={openId}
        readOnly={readOnly}
        onBack={() => {
          setOpenId(null);
          load();
        }}
      />
    );
  }

  const done = counts.submitted + counts.approved;

  const completion = counts.all
    ? Math.round((done / counts.all) * 100)
    : 0;

  const filters = [
    ['all', 'All'],
    ['pending', 'Not started'],
    ['draft', 'In progress'],
    ['returned', 'Returned'],
    ['submitted', 'Submitted'],
    ['approved', 'Approved'],
  ];

  if (readOnly) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-slate-900">
          Not available for administrators
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Evaluations are filled in and read only by the evaluators and the
          offices that receive their results. Administrators can follow
          progress per cycle under “Evaluation tasks”.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Evaluations
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            My evaluations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Evaluating as{' '}
            <strong className="font-semibold text-slate-700">
              {formatRole(user?.role) || 'evaluator'}
            </strong>.
            Open a form to answer, track your live score and submit.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={SECONDARY_BUTTON}
        >
          <RefreshCw
            size={15}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {!loading && counts.all > 0 && (
        <section className="panel-card p-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <StatTile label="Assigned" value={counts.all} />
            <StatTile label="Not started" value={counts.pending} />
            <StatTile
              label="In progress"
              value={counts.draft + counts.returned}
            />
            <StatTile label="Completed" value={done} />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Overall completion</span>
              <span className="tabular-nums">{completion}%</span>
            </div>

            <div
              className="mt-1.5 h-2 rounded-full bg-slate-100"
              aria-hidden="true"
            >
              <div
                className={`h-2 rounded-full transition-all ${
                  completion === 100
                    ? 'bg-emerald-500'
                    : 'bg-navy-800'
                }`}
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={load}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <section className="panel-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by status"
          >
            {filters.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  filter === value
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}{' '}
                <span className="opacity-70">
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {cycles.length > 1 && (
              <select
                aria-label="Filter by cycle"
                value={cycle}
                onChange={(event) => setCycle(event.target.value)}
                className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-navy-800"
              >
                <option value="">All cycles</option>

                {cycles.map(([id, title]) => (
                  <option key={id} value={id}>
                    {title}
                  </option>
                ))}
              </select>
            )}

            <label className="relative block sm:w-60">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search instructor or course…"
                aria-label="Search evaluations"
                className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-navy-800"
              />
            </label>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-sm text-slate-500">
            Loading evaluations…
          </p>
        ) : visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-800">
              {rows.length === 0
                ? 'No evaluations assigned to you yet'
                : 'No evaluations match your filters'}
            </p>

            {rows.length === 0 && (
              <p className="mt-1 text-sm text-slate-500">
                The committee or your department head assigns evaluation
                tasks to you for each cycle.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">
                    Instructor
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Course
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Form
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Cycle
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Status
                  </th>
                  <th className="px-5 py-3 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => {
                  const status = effectiveStatus(row);
                  const canEdit = isEditable(row, readOnly);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {row.instructor_name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {row.course_title}

                        {row.course_code && (
                          <span className="block text-xs text-slate-400">
                            {row.course_code}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {TYPE_LABEL[row.evaluator_type] ?? row.form_title}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {row.cycle_title}

                        {row.cycle_status !== 'active' && (
                          <span className="block text-xs text-slate-400">
                            {row.cycle_status === 'closed'
                              ? 'Cycle closed'
                              : 'Cycle not active'}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`status-pill ${
                            STATUS_TONE[status] ?? 'status-gray'
                          }`}
                        >
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => setOpenId(row.id)}
                          className={ROW_BUTTON}
                        >
                          {canEdit
                            ? status === 'pending'
                              ? 'Start'
                              : 'Continue'
                            : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
