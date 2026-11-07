import { confirmAction } from '../utils/confirmAction.js';
﻿import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Save, Send } from 'lucide-react';
import {
  LEADERSHIP_TYPES,
  getLeadershipEvaluation,
  listLeadershipEvaluations,
  saveLeadershipDraft,
  submitLeadershipEvaluation,
} from '../services/leadershipApi.js';
import {
  EmptyBlock, ErrorBanner, LoadingBlock, Pagination, StatusPill, SuccessBanner, formatDate,
} from './StateBlocks.jsx';

const PAGE_SIZE = 10;

// Consecutive criteria with the same section title form one section, in form order.
function groupSections(criteria) {
  const groups = [];
  (criteria || []).forEach((criterion) => {
    const title = criterion.sectionTitle || '';
    const last = groups[groups.length - 1];
    if (last && last.title === title) last.items.push(criterion);
    else groups.push({ title, items: [criterion] });
  });
  return groups;
}

function EvaluationForm({ id, user, onBack }) {
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers] = useState({});
  const [comments, setComments] = useState({ strengths: '', improvements: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [missing, setMissing] = useState([]);
  // Section-by-section, criterion-by-criterion filling: later sections and criteria stay locked.
  const [activeSection, setActiveSection] = useState(0);
  const [sectionError, setSectionError] = useState('');

  const hydrate = useCallback((data) => {
    setEvaluation(data);
    setAnswers(Object.fromEntries(data.criteria.filter((c) => c.answered).map((c) => [c.id, { score: c.score, isNa: c.isNa }])));
    setComments({ strengths: data.commentStrengths || '', improvements: data.commentImprovements || '' });
    // Open the first section that still has an unanswered criterion (the first one when all are done).
    const firstOpen = groupSections(data.criteria).findIndex((group) => group.items.some((c) => !c.answered));
    setActiveSection(firstOpen === -1 ? 0 : firstOpen);
    setSectionError('');
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getLeadershipEvaluation(id)
      .then((data) => { if (active) hydrate(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, hydrate]);

  const sections = useMemo(() => groupSections(evaluation?.criteria), [evaluation]);

  if (loading) return <LoadingBlock label="Loading evaluationâ€¦" />;
  if (!evaluation) return (<><ErrorBanner message={error} /><button type="button" className="mt-4 text-sm font-medium underline" onClick={onBack}>Back to the list</button></>);

  const { form } = evaluation;
  const readOnly = evaluation.status === 'submitted' || evaluation.cycleStatus !== 'active'
    || user?.role === 'admin' || Number(user?.id) !== evaluation.evaluatorId;
  const scale = Array.from({ length: form.scaleMax - form.scaleMin + 1 }, (_, i) => form.scaleMin + i);
  const answeredCount = evaluation.criteria.filter((c) => answers[c.id]).length;

  const isAnswered = (criterion) => Boolean(answers[criterion.id]);
  const sectionComplete = (group) => group.items.every(isAnswered);
  const firstOpenSection = sections.findIndex((group) => !sectionComplete(group));
  // Furthest section that may be opened: the first unfinished one (every section is open once all are done).
  const reachable = firstOpenSection === -1 ? Math.max(sections.length - 1, 0) : firstOpenSection;
  const currentSection = Math.min(activeSection, reachable);
  const isLastSection = currentSection >= sections.length - 1;

  const setAnswer = (criterionId, value) => {
    // A submitted evaluation can never be changed again, whoever the evaluator is.
    if (readOnly || busy) return;
    const items = sections[currentSection]?.items ?? [];
    const at = items.findIndex((item) => item.id === criterionId);
    if (at === -1) return;
    const firstOpen = items.findIndex((item) => !isAnswered(item));
    // Criteria are answered strictly in order: a later one stays locked until every earlier one has an answer.
    if (firstOpen !== -1 && at > firstOpen) {
      setSectionError(`Please first answer criterion ${firstOpen + 1} before criterion ${at + 1}. You cannot skip a criterion.`);
      setMissing([items[firstOpen].id]);
      document.getElementById(`criterion-${items[firstOpen].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setAnswers({ ...answers, [criterionId]: value });
    setMissing([]);
    setSectionError('');
    // Move on to the next criterion, or to the section arrow / submit once this section is finished.
    const nextItem = items.find((item) => item.id !== criterionId && !answers[item.id]);
    window.setTimeout(() => {
      const goal = nextItem ? `criterion-${nextItem.id}` : (isLastSection ? 'submit-evaluation' : 'section-next');
      document.getElementById(goal)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 250);
  };

  function goToSection(index) {
    if (index < 0 || index >= sections.length) return;
    if (index > reachable) {
      const blocker = sections[firstOpenSection];
      const open = blocker.items.filter((item) => !isAnswered(item));
      setMissing(open.map((item) => item.id));
      setSectionError(`Please first finish the rest of "${blocker.title}" (${open.length} criteri${open.length === 1 ? 'on' : 'a'} still need${open.length === 1 ? 's' : ''} an answer) before opening this section.`);
      if (firstOpenSection !== currentSection) setActiveSection(firstOpenSection);
      return;
    }
    setSectionError('');
    setMissing([]);
    setActiveSection(index);
    window.setTimeout(() => document.getElementById('section-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  function nextSection() {
    const group = sections[currentSection];
    const open = group.items.filter((item) => !isAnswered(item));
    if (open.length > 0) {
      setMissing(open.map((item) => item.id));
      setSectionError(`Please first finish the rest of "${group.title}" (${open.length} criteri${open.length === 1 ? 'on' : 'a'} still need${open.length === 1 ? 's' : ''} an answer) before moving to the next section.`);
      document.getElementById(`criterion-${open[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    goToSection(currentSection + 1);
  }

  const payload = () => ({
    scores: Object.entries(answers).map(([criterionId, a]) => (
      a.isNa ? { criterionId: Number(criterionId), isNa: true } : { criterionId: Number(criterionId), score: a.score }
    )),
    commentStrengths: comments.strengths.trim() || null,
    commentImprovements: comments.improvements.trim() || null,
  });

  async function saveDraft() {
    if (readOnly) return;
    setBusy('save'); setError(''); setMessage('');
    try {
      await saveLeadershipDraft(id, payload());
      setMessage('Draft saved. You can continue later.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function submit() {
    if (readOnly) return;
    const unanswered = evaluation.criteria.filter((c) => !answers[c.id]).map((c) => c.id);
    if (unanswered.length) {
      setMissing(unanswered);
      setError(`${unanswered.length} of ${evaluation.criteria.length} criteria are still unanswered.`);
      return;
    }
    if (!await confirmAction('Submit this evaluation? Once submitted it cannot be changed.')) return;
    setBusy('submit'); setError(''); setMessage('');
    try {
      await submitLeadershipEvaluation(id, payload());
      hydrate(await getLeadershipEvaluation(id));
      setMessage('Evaluation submitted. Thank you.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
        <ArrowLeft size={16} /> Back to the list
      </button>

      <header className="panel-card flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{LEADERSHIP_TYPES[evaluation.type]?.label}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Evaluatee: <strong>{evaluation.evaluateeName}</strong> Â· Evaluator: {evaluation.evaluatorName}
          </p>
          <p className="text-sm text-slate-500">{evaluation.cycleTitle} ({evaluation.academicYear}) Â· form version {form.versionNo}</p>
        </div>
        <div className="text-right text-sm">
          <StatusPill status={evaluation.status} />
          <div className="mt-2 text-slate-500">{answeredCount} of {evaluation.criteria.length} answered</div>
        </div>
      </header>

      {readOnly && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700" role="note">
          {evaluation.status === 'submitted'
            ? `This evaluation was submitted on ${formatDate(evaluation.submittedAt)} and can no longer be changed.`
            : evaluation.cycleStatus !== 'active'
              ? 'The evaluation cycle is not active, so this evaluation is read-only.'
              : 'You are viewing this evaluation read-only.'}
        </div>
      )}
      <ErrorBanner message={error} />
      <SuccessBanner message={message} />

      {form.instructions && (
        <div className="panel-card whitespace-pre-line p-5 text-sm text-slate-700">{form.instructions}</div>
      )}
      <p className="text-sm text-slate-600">
        Score each criterion from {form.scaleMin} (lowest) to {form.scaleMax} (highest){form.allowNa ? ', or mark it not applicable' : ''}.
      </p>

      {!readOnly && sections.length > 1 && (
        <nav id="section-top" aria-label="Evaluation sections" className="flex flex-wrap gap-2">
          {sections.map((group, i) => {
            const done = sectionComplete(group);
            const locked = i > reachable;
            const active = i === currentSection;
            return (
              <button
                key={`${group.title}-${i}`}
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
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-white/20' : 'bg-slate-200 text-slate-600'
                }`}
                >
                  {done ? <Check size={12} /> : locked ? <Lock size={11} /> : i + 1}
                </span>
                {group.title || `Section ${i + 1}`}
              </button>
            );
          })}
        </nav>
      )}

      {!readOnly && sectionError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{sectionError}</div>
      )}

      {(readOnly ? sections : [sections[currentSection]]).filter(Boolean).map((section, sectionIndex) => {
        // Index of the first criterion without an answer: everything after it is locked until it is answered.
        const firstOpenIdx = section.items.findIndex((item) => !isAnswered(item));
        return (
        <section key={`${section.title}-${sectionIndex}`} className="panel-card">
          {section.title && <h2 className="border-b border-slate-200 px-5 py-3 text-base font-semibold text-slate-900">{section.title}</h2>}
          <div className="divide-y divide-slate-100">
            {section.items.map((criterion, index) => {
              const answer = answers[criterion.id];
              const flagged = missing.includes(criterion.id);
              const locked = !readOnly && firstOpenIdx !== -1 && index > firstOpenIdx;
              return (
                <fieldset key={criterion.id} id={`criterion-${criterion.id}`} disabled={readOnly || Boolean(busy)}
                  aria-disabled={locked || undefined}
                  className={`p-5 ${flagged ? 'bg-rose-50' : ''} ${locked ? 'opacity-50' : ''}`}>
                  <legend className="mb-3 text-sm font-medium text-slate-900">
                    {criterion.text}
                    {locked && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-slate-500">
                        <Lock size={11} /> Locked until the criterion before it is answered
                      </span>
                    )}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {scale.map((value) => (
                      <label key={value} className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                        answer && !answer.isNa && answer.score === value ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                        <input type="radio" className="sr-only" name={`criterion-${criterion.id}`} tabIndex={locked ? -1 : undefined} checked={Boolean(answer && !answer.isNa && answer.score === value)}
                          onChange={() => setAnswer(criterion.id, { score: value, isNa: false })} />
                        {value}
                      </label>
                    ))}
                    {form.allowNa && (
                      <label className={`inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm font-medium ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                        answer?.isNa ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                        <input type="radio" className="sr-only" name={`criterion-${criterion.id}`} tabIndex={locked ? -1 : undefined} checked={Boolean(answer?.isNa)}
                          onChange={() => setAnswer(criterion.id, { score: null, isNa: true })} />
                        N/A
                      </label>
                    )}
                  </div>
                  {flagged && <p className="mt-2 text-xs font-medium text-rose-700">An answer is required.</p>}
                </fieldset>
              );
            })}
          </div>
        </section>
        );
      })}

      {(readOnly || isLastSection) && (
        <section className="panel-card grid gap-4 p-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Strengths
            <textarea rows={4} maxLength={10000} readOnly={readOnly} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              value={comments.strengths} onChange={(e) => { if (!readOnly) setComments({ ...comments, strengths: e.target.value }); }} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Areas for improvement
            <textarea rows={4} maxLength={10000} readOnly={readOnly} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              value={comments.improvements} onChange={(e) => { if (!readOnly) setComments({ ...comments, improvements: e.target.value }); }} />
          </label>
        </section>
      )}

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            {currentSection > 0 && (
              <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800"
                onClick={() => goToSection(currentSection - 1)}><ArrowLeft size={16} /> Previous section</button>
            )}
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800"
              disabled={Boolean(busy)} onClick={saveDraft}><Save size={16} /> {busy === 'save' ? 'Savingâ€¦' : 'Save draft'}</button>
          </div>
          <div className="flex items-center gap-3">
            {!isLastSection ? (
              <>
                {sectionComplete(sections[currentSection]) && (
                  <span className="text-xs font-medium text-emerald-700">Section complete. Continue with the arrow.</span>
                )}
                <button id="section-next" type="button" className="primary-button" onClick={nextSection}>
                  Next section <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <button id="submit-evaluation" type="button" className="primary-button" disabled={Boolean(busy)} onClick={submit}>
                <Send size={16} /> {busy === 'submit' ? 'Submittingâ€¦' : 'Submit evaluation'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EvaluationList({ onOpen }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setResult(await listLeadershipEvaluations({ status, page, pageSize: PAGE_SIZE }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Leadership evaluations</h1>
        <p className="mt-1 text-sm text-slate-600">Evaluations assigned to you. Open one to score it, save a draft, and submit when complete.</p>
      </header>
      <ErrorBanner message={error} onRetry={load} />
      <section className="panel-card">
        <div className="border-b border-slate-200 p-4">
          <label className="text-sm font-medium text-slate-700">Status
            <select className="ml-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All</option><option value="draft">Draft</option><option value="submitted">Submitted</option>
            </select>
          </label>
        </div>
        {loading ? <LoadingBlock label="Loading your evaluationsâ€¦" /> : result.items.length === 0 ? (
          <EmptyBlock title="No evaluations assigned">When an administrator assigns you an evaluation it will appear here.</EmptyBlock>
        ) : (
          <ul className="divide-y divide-slate-100">
            {result.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-medium text-slate-900">{item.evaluateeName}</div>
                  <div className="text-sm text-slate-500">{LEADERSHIP_TYPES[item.type]?.label} Â· {item.cycleTitle} ({item.academicYear})</div>
                  <div className="mt-1 text-xs text-slate-500">{item.answeredCriteria} of {item.totalCriteria} criteria answered</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={item.status} />
                  <button type="button" className="primary-button" onClick={() => onOpen(item.id)}>
                    {item.status === 'draft' ? 'Open' : 'View'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={result.total} onChange={setPage} />
      </section>
    </div>
  );
}

export default function LeadershipEvaluationsPage({ user }) {
  const [params, setParams] = useSearchParams();
  const openId = params.get('open');
  if (openId && /^[1-9]\d*$/.test(openId)) {
    return <EvaluationForm key={openId} id={Number(openId)} user={user} onBack={() => setParams({})} />;
  }
  return <EvaluationList onOpen={(id) => setParams({ open: String(id) })} />;
}
