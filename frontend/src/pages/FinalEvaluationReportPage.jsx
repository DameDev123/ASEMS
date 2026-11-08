import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  FileDown,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';

const COMPONENTS = [
  { key: 'student', label: 'Student evaluation', form: 'Form A', weight: '40%' },
  {
    key: 'department_head',
    label: 'Department head evaluation',
    form: 'Form B',
    weight: '35%',
  },
  { key: 'peer', label: 'Peer evaluation', form: 'Form C', weight: '15%' },
  { key: 'self', label: 'Self-evaluation', form: 'Form D', weight: '10%' },
];

const ALLOWED_ROLES = [
  'committee',
  'department_head',
  'dean',
  'management',
];

const STATUS_STYLES = {
  complete: 'bg-emerald-50 text-emerald-700',
  reviewed: 'bg-blue-50 text-blue-700',
  archived: 'bg-slate-100 text-slate-700',
  incomplete: 'bg-amber-50 text-amber-800',
};

const numberOrNull = (value) =>
  value === null || value === undefined || value === ''
    ? null
    : Number(value);

function formatScore(value) {
  const number = numberOrNull(value);
  return number === null || !Number.isFinite(number)
    ? '—'
    : number.toFixed(2);
}

// A component without an average is shown as unavailable, never as 0.00.
function formatWeighted(average, weighted) {
  return numberOrNull(average) === null ? '—' : formatScore(weighted);
}

function isFinalStatus(status) {
  return ['complete', 'reviewed', 'archived'].includes(
    String(status || '').toLowerCase(),
  );
}

// The total of an incomplete summary is not a final score.
function formatFinalScore(row) {
  return isFinalStatus(row.status) ? formatScore(row.total_score) : '—';
}

// Short reason shown under the "Incomplete" badge.
function incompleteReason(row) {
  if (isFinalStatus(row.status)) return '';

  const averages = {
    student: row.student_average,
    department_head: row.department_head_average,
    peer: row.peer_average,
    self: row.self_average,
  };
  const missing = COMPONENTS.filter(
    (component) => numberOrNull(averages[component.key]) === null,
  ).map((component) => component.label);

  if (missing.length) return `No result yet: ${missing.join(', ')}`;

  const total = Number(row.total_assignments ?? 0);
  const approved = Number(row.approved_assignments ?? 0);
  if (total > 0 && approved < total) {
    return `Awaiting approval: ${approved} of ${total} forms approved`;
  }

  return 'Awaiting final review';
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function titleCase(value = '') {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRows(response) {
  const candidates = [
    response?.data?.items,
    response?.data?.reports,
    response?.data?.rows,
    response?.items,
    response?.reports,
    response?.rows,
    response?.data,
  ];

  return candidates.find(Array.isArray) ?? [];
}

function getCycles(rows) {
  const unique = new Map();

  rows.forEach((row) => {
    const id = row.cycle_id;
    if (id !== null && id !== undefined) {
      unique.set(String(id), {
        id: String(id),
        title: row.cycle_title || `Evaluation cycle ${id}`,
        year: row.academic_year || '',
      });
    }
  });

  return [...unique.values()];
}

function getInstructors(rows) {
  const unique = new Map();

  rows.forEach((row) => {
    const id = row.instructor_id;
    if (id !== null && id !== undefined) {
      unique.set(String(id), {
        id: String(id),
        name: row.instructor_name || `Instructor ${id}`,
      });
    }
  });

  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function ScoreCard({ label, value, note }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || 'incomplete').toLowerCase();

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[normalized] || STATUS_STYLES.incomplete
      }`}
    >
      {titleCase(normalized)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// FORM E: TEACHER'S EVALUATION SUMMARY SHEET (the official printed layout)
// ---------------------------------------------------------------------------
const MAX_FORM_E_SHEETS = 40;

const FORM_E_SECTIONS = [
  { type: 'student', numeral: 'I', heading: 'SUMMARY OF EVALUATION BY THE STUDENTS', weight: 40 },
  { type: 'department_head', numeral: 'II', heading: 'SUMMARY OF EVALUATION BY THE DEPARTMENT HEAD', weight: 35 },
  { type: 'peer', numeral: 'III', heading: 'SUMMARY OF EVALUATION BY THE PEER', weight: 15 },
  { type: 'self', numeral: 'IV', heading: 'SUMMARY OF SELF EVALUATION', weight: 10 },
];

const FORM_E_TOTAL_ROWS = [
  { type: 'student', label: 'Evaluation by students out of 40 %' },
  { type: 'department_head', label: 'Evaluation by department/leader out of 35 %' },
  { type: 'peer', label: 'Evaluation by peer out of 15 %' },
  { type: 'self', label: 'Self evaluation by an instructor out of 10 %' },
];

// "Label ........ value" line of the sheet header.
function FormEField({ label, value, wide = false }) {
  return (
    <span className={`fe-field${wide ? ' fe-wide' : ''}`}>
      <span className="fe-lbl">{label}</span>
      <span className="fe-val">{value || ''}</span>
    </span>
  );
}

function FormESheet({ report }) {
  const summary = report?.summary ?? {};
  const meta = report?.metadata ?? {};
  const byType = Object.fromEntries(
    (report?.components ?? []).map((component) => [component.evaluatorType, component]),
  );
  const isFinal = Boolean(report?.completeness?.isFinal);
  const joined = (value) => String(value ?? '').replace(/\s*\|\s*/g, ', ');

  const renderSection = (section) => {
    const component = byType[section.type];
    const categories = component?.categories ?? [];

    return (
      <section key={section.type} className="fe-block">
        <h2 className="fe-heading">
          <span className="fe-num">{section.numeral}.</span>{' '}
          {section.heading} OUT OF {section.weight} (%)
        </h2>
        <table className="fe-table">
          <thead>
            <tr>
              <th className="fe-left">Focus Area of the Evaluation</th>
              <th>Average result out of 5</th>
              <th>Total result out of {section.weight} %</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.code ?? category.title}>
                <td className="fe-left">{category.title}</td>
                <td>{formatScore(category.average)}</td>
                <td>{formatScore(category.weightedContribution)}</td>
                <td>{category.remark || ''}</td>
              </tr>
            ))}
            <tr className="fe-sum">
              <td className="fe-left">Sum Total</td>
              <td>{formatScore(component?.average)}</td>
              <td>{formatScore(component?.weightedContribution)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </section>
    );
  };

  return (
    <article className="fe-sheet">
      <div className={`fe-page${isFinal ? '' : ' fe-draft'}`}>
        <div className="fe-head">
          <h1 className="fe-title">{"FORM E: TEACHER'S EVALUATION SUMMARY SHEET"}</h1>
          <div className="fe-row">
            <FormEField label="Instructor's Name" value={summary.instructorName} wide />
            <FormEField label="Department" value={summary.departmentName} />
          </div>
          <div className="fe-row">
            <FormEField label="College/Institute/School" value={summary.facultyName} />
          </div>
          <div className="fe-row">
            <FormEField label="Course Title" value={joined(meta.courseTitles)} wide />
            <FormEField label="Course Code" value={joined(meta.courseCodes)} />
            <FormEField label="Academic Year" value={summary.academicYear} />
          </div>
          <div className="fe-row">
            <FormEField
              label="Date of evaluation"
              value={meta.evaluationDate ? formatDate(meta.evaluationDate) : ''}
              wide
            />
            <FormEField label="Batch (I, II, III, IV, V)" value={meta.batches} />
            <FormEField label="Semester (I, II)" value={meta.semesters} />
          </div>
        </div>

        {FORM_E_SECTIONS.slice(0, 3).map(renderSection)}
      </div>

      <div className={`fe-page${isFinal ? '' : ' fe-draft'}`}>
        {renderSection(FORM_E_SECTIONS[3])}

        <section className="fe-block">
          <h2 className="fe-heading">
            <span className="fe-num">V.</span> TOTAL RESULT OUT OF 100 (%)
          </h2>
          <table className="fe-table fe-total">
            <thead>
              <tr>
                <th>Evaluator</th>
                <th>Result</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {FORM_E_TOTAL_ROWS.map((row) => (
                <tr key={row.type}>
                  <td className="fe-left">{row.label}</td>
                  <td>{formatScore(byType[row.type]?.weightedContribution)}</td>
                  <td />
                </tr>
              ))}
              <tr className="fe-sum">
                <td className="fe-left">Sum Total</td>
                <td>{isFinal ? formatScore(report?.overall?.totalScore) : '—'}</td>
                <td />
              </tr>
            </tbody>
          </table>
          {!isFinal && (
            <p className="fe-note">
              Provisional sheet: the total result is shown only after every
              evaluation is approved and the report is reviewed.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}

export default function FinalEvaluationReportPage({ user }) {
  const allowed = ALLOWED_ROLES.includes(user?.role);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Form E sheets (one per instructor and cycle) are loaded on demand and cached.
  const sheetsRef = useRef({});
  const [sheets, setSheets] = useState({});
  const [preparing, setPreparing] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [printMode, setPrintMode] = useState('list');

  const loadReports = useCallback(async (isRefresh = false) => {
    setError('');
    sheetsRef.current = {};
    setSheets({});
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await apiRequest('/reports/summaries?limit=100');
      setRows(getRows(response));
    } catch (err) {
      setError(err.message || 'Unable to load final evaluation reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) loadReports();
  }, [allowed, loadReports]);

  const cycles = useMemo(() => getCycles(rows), [rows]);
  const instructors = useMemo(() => getInstructors(rows), [rows]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesCycle =
        cycleFilter === 'all' || String(row.cycle_id) === cycleFilter;

      const matchesInstructor =
        instructorFilter === 'all' ||
        String(row.instructor_id) === instructorFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        String(row.status || 'incomplete').toLowerCase() === statusFilter;

      const searchable =
        `${row.instructor_name || ''} ${row.cycle_title || ''} ${
          row.academic_year || ''
        }`.toLowerCase();

      return (
        matchesCycle &&
        matchesInstructor &&
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [rows, cycleFilter, instructorFilter, statusFilter, search]);

  const selectedRow = visibleRows.length === 1 ? visibleRows[0] : null;

  const storeSheet = useCallback((id, entry) => {
    sheetsRef.current = { ...sheetsRef.current, [id]: entry };
    setSheets(sheetsRef.current);
  }, []);

  const loadSheet = useCallback(async (row) => {
    const cached = sheetsRef.current[row.id];
    if (cached?.status === 'ready') return cached.data;

    storeSheet(row.id, { status: 'loading' });
    try {
      const response = await apiRequest(`/reports/summaries/${row.id}/form-e`);
      const data = response?.data ?? response;
      storeSheet(row.id, { status: 'ready', data });
      return data;
    } catch (err) {
      storeSheet(row.id, {
        status: 'error',
        error: err.message || 'Unable to load Form E.',
      });
      throw err;
    }
  }, [storeSheet]);

  // A single instructor on screen: show the Form E sheet as a preview.
  useEffect(() => {
    if (selectedRow) loadSheet(selectedRow).catch(() => {});
  }, [selectedRow, loadSheet]);

  // After printing, go back to the normal (list) print layout.
  useEffect(() => {
    const reset = () => setPrintMode('list');
    window.addEventListener('afterprint', reset);
    return () => window.removeEventListener('afterprint', reset);
  }, []);

  const sheetRows = visibleRows.slice(0, MAX_FORM_E_SHEETS);

  // Official sheet: one Form E per instructor shown, each starting on a new page.
  async function printFormE() {
    setSheetError('');
    setPreparing(true);
    try {
      for (let index = 0; index < sheetRows.length; index += 4) {
        await Promise.all(sheetRows.slice(index, index + 4).map(loadSheet));
      }
    } catch (err) {
      setSheetError(err.message || 'Unable to prepare the Form E sheets.');
      setPreparing(false);
      return;
    }

    setPreparing(false);
    setPrintMode('forme');
    window.setTimeout(() => window.print(), 200);
  }

  // The summary list of all instructors (previous layout).
  function printReport() {
    setPrintMode('list');
    window.setTimeout(() => window.print(), 100);
  }

  if (!allowed) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-white p-8">
        <h1 className="text-xl font-bold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-600">
          Final evaluation reports are available to authorized management and
          evaluation review roles.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6" data-print-mode={printMode}>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 14mm;
        }


        /* ---- Form E: teacher's evaluation summary sheet ---- */
        .form-e-sheets { display: none; }
        .form-e-sheets.fe-visible { display: block; }

        .fe-page {
          position: relative;
          box-sizing: border-box;
          width: 210mm;
          max-width: 100%;
          min-height: 235mm;
          margin: 0 auto 16px;
          padding: 14mm 14mm;
          background: #fff !important;
          border: 1px solid #cbd5e1;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.3;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .fe-page, .fe-page * { color: #000 !important; }
        .fe-draft::after {
          content: 'DRAFT';
          position: absolute;
          top: 42%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-40deg);
          font-size: 120pt;
          font-weight: 700;
          letter-spacing: 8px;
          color: rgba(0, 0, 0, 0.06) !important;
          pointer-events: none;
        }
        .fe-title {
          margin: 0 0 12px;
          text-align: center;
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
        }
        .fe-row { display: flex; gap: 14px; margin-top: 7px; font-size: 10.5pt; }
        .fe-field { display: flex; flex: 1 1 0; align-items: flex-end; gap: 5px; min-width: 0; }
        .fe-field.fe-wide { flex: 1.5 1 0; }
        .fe-lbl { white-space: nowrap; }
        .fe-val {
          flex: 1 1 auto;
          min-width: 0;
          min-height: 1.25em;
          padding: 0 3px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }
        .fe-block { margin-top: 16px; break-inside: avoid; }
        .fe-heading {
          margin: 0 0 6px;
          text-align: center;
          font-size: 11pt;
          font-weight: 700;
          text-transform: uppercase;
        }
        .fe-num { margin-right: 6px; }
        .fe-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5pt; }
        .fe-table th, .fe-table td {
          height: 8mm;
          padding: 2px 6px;
          text-align: center;
          vertical-align: middle;
        }
        /* The app forces transparent borders everywhere (index.css); the official sheet needs real lines. */
        html body #root .fe-page .fe-table th,
        html body #root .fe-page .fe-table td {
          border: 1px solid #000 !important;
          border-color: #000 !important;
          background: #fff !important; /* plain paper in every theme (dark theme tints table headers) */
        }
        html body #root .fe-page .fe-val {
          border-bottom: 1px dotted #000 !important;
          border-bottom-color: #000 !important;
        }
        .fe-table th { font-weight: 700; }
        .fe-table .fe-left { text-align: left; }
        .fe-table th:first-child, .fe-table td:first-child { width: 40%; }
        .fe-table.fe-total { width: 84%; margin: 0 auto; }
        .fe-table.fe-total th:first-child, .fe-table.fe-total td:first-child { width: 60%; }
        .fe-sum td { height: 12mm; font-weight: 700; }
        .fe-note { margin: 8px 0 0; font-size: 9.5pt; font-style: italic; text-align: center; }

        @media print {
          [data-print-mode='forme'] .report-page { display: none !important; }
          [data-print-mode='forme'] .form-e-sheets { display: block !important; }
          [data-print-mode='list'] .form-e-sheets { display: none !important; }

          .fe-page {
            width: auto;
            max-width: none;
            min-height: 235mm;
            margin: 0;
            padding: 0;
            border: 0;
            box-shadow: none;
          }
          .fe-page + .fe-page,
          .fe-sheet + .fe-sheet { break-before: page; }
          .fe-table th, .fe-table td { font-size: 10.5pt !important; padding: 2px 6px !important; }

          body {
            background: white !important;
            color: #0f172a !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .report-page {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .report-table {
            width: 100%;
            border-collapse: collapse;
          }

          .report-table th,
          .report-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 7px 6px !important;
            font-size: 10px !important;
          }

          .report-section {
            break-inside: avoid;
          }

          .report-heading {
            color: #0f172a !important;
          }
        }
      `}</style>

      <section className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Academic Affairs / Reporting
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Final Evaluation Report
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review instructor evaluation summaries, verify component scores,
            and print an official report or save it as a PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadReports(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={printReport}
            disabled={loading || visibleRows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Printer size={16} />
            Print summary list
          </button>

          <button
            type="button"
            onClick={printFormE}
            disabled={loading || preparing || visibleRows.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <FileDown size={16} />
            {preparing ? 'Preparing Form E…' : 'Print Form E / Save PDF'}
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="no-print flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Could not load the report</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs">
              Confirm that the backend is running and your account has report
              access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadReports(true)}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="no-print grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Evaluation cycle
          </span>
          <select
            value={cycleFilter}
            onChange={(event) => setCycleFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="all">All cycles</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.title}
                {cycle.year ? ` (${cycle.year})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Instructor
          </span>
          <select
            value={instructorFilter}
            onChange={(event) => setInstructorFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="all">All instructors</option>
            {instructors.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Report status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="all">All statuses</option>
            <option value="incomplete">Incomplete</option>
            <option value="complete">Complete</option>
            <option value="reviewed">Reviewed</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Search
          </span>
          <span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3">
            <Search size={15} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Instructor or cycle"
              className="min-w-0 flex-1 text-sm outline-none"
            />
          </span>
        </label>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <RefreshCw className="mx-auto animate-spin text-slate-400" size={24} />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Loading evaluation data…
          </p>
        </div>
      ) : (
        <>
          <section className="no-print grid gap-3 sm:grid-cols-3">
            <ScoreCard
              label="Report records"
              value={visibleRows.length}
              note="Matching current filters"
            />
            <ScoreCard
              label="Reviewed"
              value={
                visibleRows.filter(
                  (row) => String(row.status).toLowerCase() === 'reviewed',
                ).length
              }
              note="Final review status recorded"
            />
            <ScoreCard
              label="Incomplete"
              value={
                visibleRows.filter(
                  (row) => String(row.status).toLowerCase() === 'incomplete',
                ).length
              }
              note="Requires completion or verification"
            />
          </section>

          {sheetError && (
            <div
              role="alert"
              className="no-print rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              {sheetError}
            </div>
          )}

          <section className="no-print rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <strong className="text-slate-800">Form E</strong> prints one
            “Teacher’s Evaluation Summary Sheet” for each instructor shown
            ({Math.min(visibleRows.length, MAX_FORM_E_SHEETS)}).
            {visibleRows.length > MAX_FORM_E_SHEETS &&
              ` Only the first ${MAX_FORM_E_SHEETS} are printed; narrow the filters to print the others.`}
            {!selectedRow && visibleRows.length > 1 &&
              ' Choose one instructor above to preview the sheet here.'}
            {selectedRow && sheets[selectedRow.id]?.status === 'loading' &&
              ' Loading the sheet…'}
            {selectedRow && sheets[selectedRow.id]?.status === 'error' &&
              ` ${sheets[selectedRow.id].error}`}
          </section>

          <div className={`form-e-sheets${selectedRow ? ' fe-visible' : ''}`}>
            {sheetRows.map((row) =>
              sheets[row.id]?.status === 'ready' ? (
                <FormESheet key={row.id} report={sheets[row.id].data} />
              ) : null,
            )}
          </div>

          <section className="report-page rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <header className="report-section border-b-2 border-slate-800 pb-5 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <ShieldCheck size={25} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Academic Staff Evaluation Management System
                  </p>
                  <h2 className="report-heading mt-1 text-xl font-extrabold tracking-wide text-slate-900">
                    AMBO UNIVERSITY
                  </h2>
                </div>
              </div>

              <h3 className="report-heading mt-5 text-lg font-bold uppercase tracking-wide text-slate-900">
                Final Academic Staff Evaluation Report
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Official evaluation summary
              </p>
            </header>

            <div className="report-section mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Prepared for
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  Academic Affairs / Authorized Review
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Report generated
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatDate(new Date())}
                </p>
              </div>
            </div>

            <div className="report-section mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Final evaluation records
                </h4>
                <span className="text-xs text-slate-500">
                  {visibleRows.length} record(s)
                </span>
              </div>

              {visibleRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="font-semibold text-slate-700">
                    No evaluation records found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Change the filters or verify that the backend has
                    calculated summary records for this cycle.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="report-table w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-200 px-3 py-3">
                          No.
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Instructor
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Evaluation cycle
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Student
                          <br />
                          (40%)
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Department head
                          <br />
                          (35%)
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Peer
                          <br />
                          (15%)
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Self
                          <br />
                          (10%)
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Final score
                        </th>
                        <th className="border border-slate-200 px-3 py-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, index) => (
                        <tr
                          key={`${row.cycle_id}-${row.instructor_id}`}
                          className="align-top"
                        >
                          <td className="border border-slate-200 px-3 py-3">
                            {index + 1}
                          </td>
                          <td className="border border-slate-200 px-3 py-3 font-semibold text-slate-900">
                            {row.instructor_name || '—'}
                          </td>
                          <td className="border border-slate-200 px-3 py-3">
                            <p>{row.cycle_title || '—'}</p>
                            <p className="mt-1 text-slate-500">
                              {row.academic_year || ''}
                            </p>
                          </td>
                          <td className="border border-slate-200 px-3 py-3 tabular-nums">
                            {formatScore(row.student_average)}
                            <p className="mt-1 text-slate-500">
                              Weighted:{' '}
                              {formatWeighted(
                                row.student_average,
                                row.student_weighted,
                              )}
                            </p>
                          </td>
                          <td className="border border-slate-200 px-3 py-3 tabular-nums">
                            {formatScore(row.department_head_average)}
                            <p className="mt-1 text-slate-500">
                              Weighted:{' '}
                              {formatWeighted(
                                row.department_head_average,
                                row.department_head_weighted,
                              )}
                            </p>
                          </td>
                          <td className="border border-slate-200 px-3 py-3 tabular-nums">
                            {formatScore(row.peer_average)}
                            <p className="mt-1 text-slate-500">
                              Weighted:{' '}
                              {formatWeighted(
                                row.peer_average,
                                row.peer_weighted,
                              )}
                            </p>
                          </td>
                          <td className="border border-slate-200 px-3 py-3 tabular-nums">
                            {formatScore(row.self_average)}
                            <p className="mt-1 text-slate-500">
                              Weighted:{' '}
                              {formatWeighted(
                                row.self_average,
                                row.self_weighted,
                              )}
                            </p>
                          </td>
                          <td className="border border-slate-200 px-3 py-3 text-sm font-extrabold tabular-nums text-slate-900">
                            {formatFinalScore(row)}
                          </td>
                          <td className="border border-slate-200 px-3 py-3">
                            <StatusBadge status={row.status} />
                            {incompleteReason(row) && (
                              <p className="mt-1 text-slate-500">
                                {incompleteReason(row)}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedRow && (
              <section className="report-section mt-7 rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Selected instructor details
                </h4>
                <p className="mt-2 text-sm text-slate-700">
                  <strong>Instructor:</strong> {selectedRow.instructor_name}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <strong>Evaluation cycle:</strong> {selectedRow.cycle_title}
                  {selectedRow.academic_year
                    ? ` (${selectedRow.academic_year})`
                    : ''}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <strong>Final score:</strong> {formatFinalScore(selectedRow)}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <strong>Workflow status:</strong>{' '}
                  {titleCase(selectedRow.status)}
                </p>
              </section>
            )}

            <section className="report-section mt-8">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Component weights
              </h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {COMPONENTS.map((component) => (
                  <div
                    key={component.key}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">
                      {component.label} ({component.form})
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {component.weight}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Final scores and weighted components are displayed from the
                backend summary records. Missing component values, and the
                final score of an incomplete record, are shown as "—"; they
                are not replaced with zero.
              </p>
            </section>

            <section className="report-section mt-10 grid gap-8 sm:grid-cols-2">
              <div className="border-t border-slate-400 pt-3">
                <p className="text-sm font-semibold text-slate-800">
                  Prepared / reviewed by
                </p>
                <p className="mt-8 text-xs text-slate-500">
                  Name, signature and date
                </p>
              </div>
              <div className="border-t border-slate-400 pt-3">
                <p className="text-sm font-semibold text-slate-800">
                  Authorized approval
                </p>
                <p className="mt-8 text-xs text-slate-500">
                  Name, signature and date
                </p>
              </div>
            </section>

            <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
              ASEMS · Ambo University · Confidential academic evaluation record
            </footer>
          </section>
        </>
      )}
    </div>
  );
}