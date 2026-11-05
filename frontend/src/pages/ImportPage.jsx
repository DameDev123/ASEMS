import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Printer, ShieldCheck, Upload } from 'lucide-react';
import { Alert, Restricted, btn, field, label } from '../components/ui.jsx';
import { LoadingBlock } from '../components/StateBlocks.jsx';
import { listDepartments } from '../services/organizationApi.js';
import { importInstructorsRequest, importStudentsRequest } from '../services/importApi.js';
import {
  INSTRUCTOR_COLUMNS, INSTRUCTOR_REQUIRED, INSTRUCTOR_TEMPLATE, MAX_ROWS,
  STUDENT_COLUMNS, STUDENT_REQUIRED, STUDENT_TEMPLATE,
  downloadText, readTable, tableToRows, toCsv,
}      from '../services/tableImport.js'

const primary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#101827] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50';

const KINDS = {
  students: {
    title: 'Students',
    columns: STUDENT_COLUMNS,
    required: STUDENT_REQUIRED,
    template: STUDENT_TEMPLATE,
    templateName: 'students-template.csv',
    hint: 'Columns: studentId, name, gender, phone, academicYear, yearLevel, section. Academic year, year level and section may be left blank in the file and filled in below.',
    send: importStudentsRequest,
  },
  instructors: {
    title: 'Instructors',
    columns: INSTRUCTOR_COLUMNS,
    required: INSTRUCTOR_REQUIRED,
    template: INSTRUCTOR_TEMPLATE,
    templateName: 'instructors-template.csv',
    hint: 'Columns: name, email, idNumber, gender, phone, jobTitle, teachingStartYear.',
    send: importInstructorsRequest,
  },
};

function Summary({ summary, dryRun }) {
  const items = dryRun
    ? [['Rows', summary.total], ['Will be created', summary.toCreate], ['Already registered', summary.skipped], ['Rows with errors', summary.errors]]
    : [['Rows', summary.total], ['Created', summary.created], ['Already registered', summary.skipped], ['Rows with errors', summary.errors]];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map(([name, value]) => (
        <div key={name} className="rounded-xl border border-slate-200 bg-white p-3">
          <dt className="text-xs text-slate-500">{name}</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Problems({ errors, skipped }) {
  if (!errors.length && !skipped.length) return null;
  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-rose-800">Rows with errors (not imported)</h3>
          <div className="max-h-64 overflow-auto rounded-xl border border-rose-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-rose-50 text-xs text-rose-800"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Record</th><th className="px-3 py-2">Problem</th></tr></thead>
              <tbody>
                {errors.map((item) => (
                  <tr key={`e-${item.rowNumber}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">{item.rowNumber}</td>
                    <td className="px-3 py-2">{item.studentId || item.email || '—'} {item.name}</td>
                    <td className="px-3 py-2 text-rose-700">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {skipped.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-amber-800">Already registered (left unchanged)</h3>
          <div className="max-h-48 overflow-auto rounded-xl border border-amber-200 bg-white">
            <table className="w-full text-left text-sm">
              <tbody>
                {skipped.map((item) => (
                  <tr key={`s-${item.rowNumber}`} className="border-t border-slate-100 first:border-0">
                    <td className="px-3 py-2">{item.rowNumber}</td>
                    <td className="px-3 py-2">{item.studentId || item.email}</td>
                    <td className="px-3 py-2">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Credentials({ kind, created, department, onDone }) {
  const students = kind === 'students';
  const headers = students
    ? [
        { key: 'studentId', label: 'Student ID' }, { key: 'name', label: 'Name' },
        { key: 'academicYear', label: 'Academic year' }, { key: 'yearLevel', label: 'Year level' },
        { key: 'section', label: 'Section' }, { key: 'username', label: 'Username' },
        { key: 'initialPassword', label: 'Initial password' },
      ]
    : [
        { key: 'name', label: 'Name' }, { key: 'email', label: 'Username (email)' },
        { key: 'initialPassword', label: 'Initial password' },
      ];

  function download() {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(`${kind}-credentials-${stamp}.csv`, toCsv(headers, created));
  }

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 text-emerald-700" size={20} aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-slate-900">Initial credentials ({created.length})</h2>
          <p className="mt-1 text-sm text-slate-600">
            These passwords are shown <strong>only once</strong> and cannot be retrieved later (only an administrator reset can issue a new one).
            Download or print them now, hand them out securely, then keep the file protected or delete it.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 print:hidden">
        <button type="button" className={primary} onClick={download}><Download size={16} aria-hidden="true" />Download CSV</button>
        <button type="button" className={btn} onClick={() => window.print()}><Printer size={14} aria-hidden="true" />Print</button>
        <button type="button" className={btn} onClick={onDone}>I saved them — clear from screen</button>
      </div>
      <p className="hidden text-sm print:block">Department: {department?.name}</p>
      <div className="max-h-[28rem] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs text-slate-600">
            <tr>{headers.map((h) => <th key={h.key} className="px-3 py-2">{h.label}</th>)}</tr>
          </thead>
          <tbody>
            {created.map((row) => (
              <tr key={row.userId} className="border-t border-slate-100">
                {headers.map((h) => (
                  <td key={h.key} className={`px-3 py-2 ${h.key === 'initialPassword' ? 'font-mono font-semibold tracking-wider' : ''}`}>{row[h.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ImportPage({ user }) {
  const [kind, setKind] = useState('students');
  const [departments, setDepartments] = useState(null);
  const [departmentId, setDepartmentId] = useState('');
  const [defaults, setDefaults] = useState({ academicYear: '', yearLevel: '', section: '' });
  const [fileInfo, setFileInfo] = useState(null);
  const [report, setReport] = useState(null);
  const [validatedKey, setValidatedKey] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const config = KINDS[kind];

  useEffect(() => {
    let active = true;
    listDepartments({ pageSize: 100 })
      .then((data) => { if (active) setDepartments(data?.items || []); })
      .catch((err) => { if (active) { setDepartments([]); setError(err.message); } });
    return () => { active = false; };
  }, []);

  const requestKey = useMemo(
    () => JSON.stringify([kind, departmentId, defaults, fileInfo?.name, fileInfo?.rows.length]),
    [kind, departmentId, defaults, fileInfo],
  );
  const validated = Boolean(report) && validatedKey === requestKey;

  if (user?.role !== 'admin') {
    return <Restricted>Only the system administrator can import students and instructors.</Restricted>;
  }

  function resetAll(nextKind = kind) {
    setKind(nextKind);
    setFileInfo(null); setReport(null); setValidatedKey(''); setResult(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    setReport(null); setValidatedKey(''); setResult(null); setError(''); setFileInfo(null);
    if (!file) return;
    try {
      const table = await readTable(file);
      const parsed = tableToRows(table, config.columns, config.required);
      if (parsed.missing.length) {
        setError(`Required column(s) not found in the first row: ${parsed.missing.join(', ')}. Download the template to see the expected headers.`);
        return;
      }
      if (parsed.rows.length === 0) { setError('The file has no data rows.'); return; }
      if (parsed.rows.length > MAX_ROWS) {
        setError(`The file has ${parsed.rows.length} rows. Import at most ${MAX_ROWS} rows at a time; split the file (for example by section).`);
        return;
      }
      setFileInfo({ name: file.name, rows: parsed.rows, extraHeaders: parsed.extraHeaders });
    } catch (err) {
      setError(err.message || 'Could not read the file.');
    }
  }

  function buildBody(dryRun) {
    const body = { departmentId: Number(departmentId), dryRun, rows: fileInfo.rows };
    if (kind === 'students') {
      body.defaults = {
        academicYear: defaults.academicYear.trim(),
        yearLevel: defaults.yearLevel.trim(),
        section: defaults.section.trim(),
      };
    }
    return body;
  }

  async function run(dryRun) {
    if (busy || !fileInfo || !departmentId) return;
    setBusy(true); setError('');
    try {
      const data = await config.send(buildBody(dryRun));
      if (dryRun) {
        setReport(data);
        setValidatedKey(requestKey);
      } else {
        setResult(data); setReport(null); setValidatedKey(''); setFileInfo(null);
        if (fileRef.current) fileRef.current.value = '';
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function confirmImport() {
    const dept = departments?.find((d) => String(d.id) === String(departmentId))?.name || '';
    const ok = window.confirm(
      `Create ${report.summary.toCreate} ${config.title.toLowerCase()} account(s) in ${dept}?\n\nInitial passwords will be shown once, right after the import.`,
    );
    if (ok) run(false);
  }

  const canValidate = Boolean(fileInfo && departmentId) && !busy;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Bulk import</h1>
        <p className="mt-1 text-sm text-slate-600">
          Register students or instructors from a CSV or Excel (.xlsx) file. Always validate first; nothing is saved until you confirm.
        </p>
      </header>

      <div className="flex gap-2" role="tablist" aria-label="Import type">
        {Object.entries(KINDS).map(([key, item]) => (
          <button
            key={key} type="button" role="tab" aria-selected={kind === key}
            onClick={() => resetAll(key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${kind === key ? 'bg-[#101827] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            {item.title}
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>

      {result ? (
        <div className="space-y-4">
          <Summary summary={result.summary} dryRun={false} />
          {result.created.length > 0 && (
            <Credentials kind={kind} created={result.created} department={result.department} onDone={() => setResult(null)} />
          )}
          <Problems errors={result.errors} skipped={result.skipped} />
          {result.created.length === 0 && (
            <button type="button" className={btn} onClick={() => setResult(null)}>Back</button>
          )}
        </div>
      ) : (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          {departments === null ? <LoadingBlock label="Loading departments…" /> : (
            <>
              <p className="text-sm text-slate-600">{config.hint}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="imp-dept" className={label}>Department</label>
                  <select id="imp-dept" className={`${field} mt-1`} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                    <option value="">Select a department…</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.facultyName})</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="imp-file" className={label}>File (.csv or .xlsx)</label>
                  <input
                    id="imp-file" ref={fileRef} type="file" accept=".csv,.txt,.xlsx" onChange={onFile}
                    className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-2 file:text-sm"
                  />
                </div>
              </div>

              {kind === 'students' && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="imp-ay" className={label}>Default academic year</label>
                    <input id="imp-ay" className={`${field} mt-1`} placeholder="2026 or 2026/27" value={defaults.academicYear} onChange={(e) => setDefaults({ ...defaults, academicYear: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="imp-yl" className={label}>Default year level</label>
                    <input id="imp-yl" className={`${field} mt-1`} inputMode="numeric" placeholder="1–8" value={defaults.yearLevel} onChange={(e) => setDefaults({ ...defaults, yearLevel: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="imp-sec" className={label}>Default section</label>
                    <input id="imp-sec" className={`${field} mt-1`} placeholder="A" value={defaults.section} onChange={(e) => setDefaults({ ...defaults, section: e.target.value })} />
                  </div>
                </div>
              )}

              {fileInfo && (
                <p className="flex items-center gap-2 text-sm text-slate-700">
                  <FileSpreadsheet size={16} aria-hidden="true" />
                  {fileInfo.name}: {fileInfo.rows.length} data row(s) read.
                  {fileInfo.extraHeaders.length > 0 && <span className="text-slate-500">Ignored columns: {fileInfo.extraHeaders.join(', ')}</span>}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" className={primary} disabled={!canValidate} onClick={() => run(true)}>
                  <Upload size={16} aria-hidden="true" />{busy ? 'Working…' : 'Validate file'}
                </button>
                <button type="button" className={btn} onClick={() => downloadText(config.templateName, config.template)}>
                  <Download size={14} aria-hidden="true" />Download template
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {report && !result && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-semibold text-slate-900">Validation result — nothing saved yet</h2>
          <Summary summary={report.summary} dryRun />
          <Problems errors={report.errors} skipped={report.skipped} />
          {report.preview.length > 0 && (
            <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    {kind === 'students'
                      ? <><th className="px-3 py-2">Student ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Year</th><th className="px-3 py-2">Level</th><th className="px-3 py-2">Section</th></>
                      : <><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Start year</th></>}
                  </tr>
                </thead>
                <tbody>
                  {report.preview.map((p) => (
                    <tr key={p.rowNumber} className="border-t border-slate-100">
                      <td className="px-3 py-2">{p.rowNumber}</td>
                      {kind === 'students'
                        ? <><td className="px-3 py-2">{p.studentId}</td><td className="px-3 py-2">{p.name}</td><td className="px-3 py-2">{p.academicYear}</td><td className="px-3 py-2">{p.yearLevel}</td><td className="px-3 py-2">{p.section}</td></>
                        : <><td className="px-3 py-2">{p.name}</td><td className="px-3 py-2">{p.email}</td><td className="px-3 py-2">{p.teachingStartYear ?? '—'}</td></>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" className={primary} disabled={!validated || busy || report.summary.toCreate === 0} onClick={confirmImport}>
            {busy ? 'Importing…' : `Import ${report.summary.toCreate} valid record(s)`}
          </button>
          {report.summary.errors > 0 && (
            <p className="text-xs text-slate-500">Rows with errors are skipped. Fix them in the file and import that file again; already registered records are skipped automatically.</p>
          )}
        </section>
      )}
    </div>
  );
}