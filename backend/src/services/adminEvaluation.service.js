// Administrative staff six-month performance evaluation.
// Fully separate from the academic evaluation module: it only reads users, employees and
// departments, and writes only to the admin_* tables. Access is decided by the assignment
// (employee / supervisor of that evaluation) or the admin role, never by academic roles.
import { pool } from '../config/database.js';
import { writeAudit } from '../utils/audit.js';
import {
  MAX_QUARTERS, MAX_SCORES, buildSummary, parseScore, validateLevels,
} from '../utils/adminScoring.js';

function fail(message, statusCode = 400, code = 'VALIDATION_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

// Turns scoring-rule RangeErrors into 400 responses.
function guard(fn) {
  try {
    return fn();
  } catch (error) {
    if (error instanceof RangeError) fail(error.message);
    throw error;
  }
}

function positiveId(value, label = 'id') {
  if (!/^[1-9]\d{0,17}$/.test(String(value ?? ''))) fail(`A valid ${label} is required.`);
  return String(value);
}

function text(value, max, label) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (v.length > max) fail(`${label} must be at most ${max} characters.`);
  return v || null;
}

const same = (a, b) => String(a) === String(b);

// ---------- levels ----------
export async function getLevels() {
  const [rows] = await pool.execute(
    'SELECT name, min_score FROM admin_performance_levels ORDER BY min_score ASC',
  );
  return rows.map((row) => ({ name: row.name, minScore: Number(row.min_score) }));
}

export async function setLevels(body, actor, ip) {
  const levels = guard(() => validateLevels(body?.levels));
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM admin_performance_levels');
    for (const level of levels) {
      await connection.execute(
        'INSERT INTO admin_performance_levels (name, min_score) VALUES (?, ?)',
        [level.name, level.minScore],
      );
    }
    await writeAudit(connection, {
      userId: actor.id, action: 'admin_levels.updated', entityType: 'admin_performance_levels',
      details: { count: levels.length }, ipAddress: ip,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return levels;
}

// ---------- periods ----------
const PERIOD_STATUSES = ['upcoming', 'active', 'closed'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const periodOut = (r) => ({
  id: String(r.id), title: r.title, startDate: r.start_date, endDate: r.end_date, status: r.status,
});

export async function listPeriods() {
  const [rows] = await pool.execute(
    `SELECT id, title, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, status
       FROM admin_evaluation_periods ORDER BY start_date DESC, id DESC`,
  );
  return rows.map(periodOut);
}

export async function createPeriod(body, actor, ip) {
  const title = text(body?.title, 255, 'Title');
  if (!title) fail('Title is required.');
  const startDate = String(body?.startDate ?? '');
  const endDate = String(body?.endDate ?? '');
  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) fail('Start and end dates are required (YYYY-MM-DD).');
  if (endDate < startDate) fail('End date cannot be before the start date.');
  const status = body?.status ?? 'upcoming';
  if (!PERIOD_STATUSES.includes(status)) fail('Invalid status.');

  try {
    const [result] = await pool.execute(
      `INSERT INTO admin_evaluation_periods (title, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [title, startDate, endDate, status, actor.id],
    );
    await writeAudit(pool, {
      userId: actor.id, action: 'admin_period.created', entityType: 'admin_evaluation_period',
      entityId: result.insertId, details: { title }, ipAddress: ip,
    });
    return { id: String(result.insertId), title, startDate, endDate, status };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') fail('A period with this title already exists.', 409, 'DUPLICATE_PERIOD');
    throw error;
  }
}

export async function updatePeriodStatus(id, body, actor, ip) {
  const periodId = positiveId(id, 'period id');
  const status = body?.status;
  if (!PERIOD_STATUSES.includes(status)) fail('Invalid status.');
  const [result] = await pool.execute('UPDATE admin_evaluation_periods SET status = ? WHERE id = ?', [status, periodId]);
  if (!result.affectedRows) fail('Period not found.', 404, 'NOT_FOUND');
  await writeAudit(pool, {
    userId: actor.id, action: 'admin_period.status_changed', entityType: 'admin_evaluation_period',
    entityId: periodId, details: { status }, ipAddress: ip,
  });
  return { id: periodId, status };
}

// ---------- assignments (administrator) ----------
export async function assignEvaluations(body, actor, ip) {
  const periodId = positiveId(body?.periodId, 'period id');
  const list = body?.assignments;
  if (!Array.isArray(list) || list.length === 0 || list.length > 500) {
    fail('Provide 1 to 500 assignments.');
  }

  const [periods] = await pool.execute('SELECT id, status FROM admin_evaluation_periods WHERE id = ?', [periodId]);
  if (!periods[0]) fail('Period not found.', 404, 'NOT_FOUND');
  if (periods[0].status === 'closed') fail('This period is closed.', 409, 'PERIOD_CLOSED');

  const items = list.map((raw) => ({
    employeeUserId: positiveId(raw?.employeeUserId, 'employeeUserId'),
    supervisorUserId: positiveId(raw?.supervisorUserId, 'supervisorUserId'),
    grade: text(raw?.grade, 30, 'Grade'),
    workUnit: text(raw?.workUnit, 255, 'Work unit'),
  }));

  const employeeIds = [...new Set(items.map((i) => i.employeeUserId))];
  const supervisorIds = [...new Set(items.map((i) => i.supervisorUserId))];

  const [employees] = await pool.query(
    `SELECT e.user_id, e.department_id, e.job_title, e.employee_type, u.status, d.name AS department_name
       FROM employees e JOIN users u ON u.id = e.user_id
       LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.user_id IN (?)`,
    [employeeIds],
  );
  const [supervisors] = await pool.query('SELECT id, status FROM users WHERE id IN (?)', [supervisorIds]);
  const [existing] = await pool.query(
    'SELECT employee_user_id FROM admin_evaluations WHERE period_id = ? AND employee_user_id IN (?)',
    [periodId, employeeIds],
  );

  const employeeById = new Map(employees.map((e) => [String(e.user_id), e]));
  const supervisorById = new Map(supervisors.map((s) => [String(s.id), s]));
  const already = new Set(existing.map((e) => String(e.employee_user_id)));

  const toCreate = [];
  const skipped = [];
  const seen = new Set();
  for (const item of items) {
    const employee = employeeById.get(item.employeeUserId);
    const supervisor = supervisorById.get(item.supervisorUserId);
    let reason = null;
    if (seen.has(item.employeeUserId)) reason = 'Listed twice in this request.';
    else if (!employee || employee.employee_type !== 'administrative') reason = 'Not an administrative employee.';
    else if (employee.status !== 'active') reason = 'Employee account is not active.';
    else if (!supervisor || supervisor.status !== 'active') reason = 'Supervisor not found or not active.';
    else if (same(item.employeeUserId, item.supervisorUserId)) reason = 'An employee cannot supervise themselves.';
    else if (already.has(item.employeeUserId)) reason = 'Already assigned for this period.';
    seen.add(item.employeeUserId);
    if (reason) skipped.push({ employeeUserId: item.employeeUserId, reason });
    else toCreate.push({ ...item, employee });
  }

  if (toCreate.length) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of toCreate) {
        await connection.execute(
          `INSERT INTO admin_evaluations
             (period_id, employee_user_id, supervisor_user_id, department_id, job_title, grade, work_unit)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            periodId, item.employeeUserId, item.supervisorUserId, item.employee.department_id,
            item.employee.job_title, item.grade, item.workUnit || item.employee.department_name || null,
          ],
        );
      }
      await writeAudit(connection, {
        userId: actor.id, action: 'admin_evaluations.assigned', entityType: 'admin_evaluation_period',
        entityId: periodId, details: { created: toCreate.length, skipped: skipped.length }, ipAddress: ip,
      });
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') fail('Some employees were assigned at the same time. Nothing was saved; retry.', 409, 'DUPLICATE');
      throw error;
    } finally {
      connection.release();
    }
  }

  return { created: toCreate.length, skipped };
}

// ---------- reading ----------
const LIST_SQL = `
  SELECT e.id, e.status, e.period_id, p.title AS period_title, p.status AS period_status,
         e.employee_user_id, eu.name AS employee_name, e.supervisor_user_id, su.name AS supervisor_name,
         e.job_title, e.work_unit
    FROM admin_evaluations e
    JOIN admin_evaluation_periods p ON p.id = e.period_id
    JOIN users eu ON eu.id = e.employee_user_id
    JOIN users su ON su.id = e.supervisor_user_id`;

const listOut = (r) => ({
  id: String(r.id), status: r.status,
  period: { id: String(r.period_id), title: r.period_title, status: r.period_status },
  employee: { userId: String(r.employee_user_id), name: r.employee_name, jobTitle: r.job_title, workUnit: r.work_unit },
  supervisor: { userId: String(r.supervisor_user_id), name: r.supervisor_name },
});

export async function listMine(actor) {
  const [asEmployee] = await pool.execute(`${LIST_SQL} WHERE e.employee_user_id = ? ORDER BY p.start_date DESC`, [actor.id]);
  const [asSupervisor] = await pool.execute(`${LIST_SQL} WHERE e.supervisor_user_id = ? ORDER BY p.start_date DESC, eu.name`, [actor.id]);
  return { asEmployee: asEmployee.map(listOut), asSupervisor: asSupervisor.map(listOut) };
}

export async function listAll(query) {
  const params = [];
  let where = '';
  if (query?.periodId) {
    where = 'WHERE e.period_id = ?';
    params.push(positiveId(query.periodId, 'periodId'));
  }
  const [rows] = await pool.execute(`${LIST_SQL} ${where} ORDER BY p.start_date DESC, eu.name`, params);
  return rows.map(listOut);
}

async function loadEvaluation(id) {
  const [rows] = await pool.execute(
    `SELECT e.*, p.title AS period_title, p.status AS period_status,
            DATE_FORMAT(p.start_date, '%Y-%m-%d') AS period_start, DATE_FORMAT(p.end_date, '%Y-%m-%d') AS period_end,
            eu.name AS employee_name, su.name AS supervisor_name, d.name AS department_name
       FROM admin_evaluations e
       JOIN admin_evaluation_periods p ON p.id = e.period_id
       JOIN users eu ON eu.id = e.employee_user_id
       JOIN users su ON su.id = e.supervisor_user_id
       LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.id = ?`,
    [id],
  );
  return rows[0] || null;
}

function relationOf(evaluation, actor) {
  if (actor.role === 'admin') return 'admin';
  if (same(evaluation.supervisor_user_id, actor.id)) return 'supervisor';
  if (same(evaluation.employee_user_id, actor.id)) return 'employee';
  return null;
}

async function loadAuthorized(id, actor) {
  const evaluationId = positiveId(id, 'evaluation id');
  const evaluation = await loadEvaluation(evaluationId);
  // 404 (not 403) so the existence of other people's evaluations is not revealed.
  const relation = evaluation ? relationOf(evaluation, actor) : null;
  if (!evaluation || !relation) fail('Evaluation not found.', 404, 'NOT_FOUND');
  return { evaluation, relation };
}

export async function getEvaluation(id, actor) {
  const { evaluation, relation } = await loadAuthorized(id, actor);
  const [quarters] = await pool.execute(
    'SELECT seq, label, plan_score, behavioral_score FROM admin_evaluation_quarters WHERE evaluation_id = ? ORDER BY seq',
    [evaluation.id],
  );
  const levels = await getLevels();
  const summary = buildSummary(
    {
      selfScore: evaluation.self_score, teamScore: evaluation.team_score,
      supervisorScore: evaluation.supervisor_score, quarters,
    },
    levels,
  );

  const open = evaluation.period_status === 'active' && evaluation.status === 'draft';
  return {
    id: String(evaluation.id),
    relation,
    status: evaluation.status,
    period: {
      id: String(evaluation.period_id), title: evaluation.period_title, status: evaluation.period_status,
      startDate: evaluation.period_start, endDate: evaluation.period_end,
    },
    employee: {
      userId: String(evaluation.employee_user_id), name: evaluation.employee_name,
      jobTitle: evaluation.job_title, grade: evaluation.grade, workUnit: evaluation.work_unit,
      department: evaluation.department_name,
    },
    supervisor: { userId: String(evaluation.supervisor_user_id), name: evaluation.supervisor_name },
    strengths: evaluation.strengths,
    gaps: evaluation.gaps,
    submittedAt: evaluation.submitted_at,
    response: {
      value: evaluation.employee_response, reason: evaluation.employee_reason,
      respondedAt: evaluation.employee_responded_at,
    },
    summary,
    levels,
    maxScores: MAX_SCORES,
    permissions: {
      canEditSupervisorPart: relation === 'supervisor' && open,
      canEditSelf: relation === 'employee' && open,
      canSubmit: relation === 'supervisor' && open && summary.complete,
      canRespond: relation === 'employee' && evaluation.status === 'submitted',
    },
  };
}

// ---------- writing ----------
function requireOpen(evaluation) {
  if (evaluation.status !== 'draft') fail('This evaluation has already been submitted and is locked.', 409, 'LOCKED');
  if (evaluation.period_status !== 'active') fail('This evaluation period is not active.', 409, 'PERIOD_NOT_ACTIVE');
}

export async function saveSupervisorPart(id, body, actor, ip) {
  const { evaluation, relation } = await loadAuthorized(id, actor);
  if (relation !== 'supervisor') fail('Only the immediate supervisor can enter these scores.', 403, 'FORBIDDEN');
  requireOpen(evaluation);

  const parsed = guard(() => {
    const quarters = Array.isArray(body?.quarters) ? body.quarters : [];
    if (quarters.length > MAX_QUARTERS) throw new RangeError(`At most ${MAX_QUARTERS} quarter rows are allowed.`);
    const seen = new Set();
    const rows = quarters.map((q) => {
      const seq = Number(q?.seq);
      if (!Number.isInteger(seq) || seq < 1 || seq > MAX_QUARTERS || seen.has(seq)) {
        throw new RangeError('Each quarter needs a unique number from 1 to 4.');
      }
      seen.add(seq);
      const label = String(q?.label ?? '').trim() || `Quarter ${seq}`;
      if (label.length > 80) throw new RangeError('A quarter label must be at most 80 characters.');
      return {
        seq, label,
        plan: parseScore(q.planScore, MAX_SCORES.plan, `Quarter ${seq} plan score`),
        behavioral: parseScore(q.behavioralScore, MAX_SCORES.behavioral, `Quarter ${seq} behavioral score`),
      };
    });
    return {
      rows,
      team: parseScore(body?.teamScore, MAX_SCORES.team, 'Team score'),
      supervisor: parseScore(body?.supervisorScore, MAX_SCORES.supervisor, 'Supervisor score'),
    };
  });

  const grade = text(body?.grade ?? evaluation.grade, 30, 'Grade');
  const workUnit = text(body?.workUnit ?? evaluation.work_unit, 255, 'Work unit');
  const jobTitle = text(body?.jobTitle ?? evaluation.job_title, 150, 'Job title');
  const strengths = text(body?.strengths, 4000, 'Strengths');
  const gaps = text(body?.gaps, 4000, 'Gaps');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE admin_evaluations
          SET team_score = ?, supervisor_score = ?, strengths = ?, gaps = ?,
              grade = ?, work_unit = ?, job_title = ?
        WHERE id = ? AND status = 'draft'`,
      [parsed.team, parsed.supervisor, strengths, gaps, grade, workUnit, jobTitle, evaluation.id],
    );
    await connection.execute('DELETE FROM admin_evaluation_quarters WHERE evaluation_id = ?', [evaluation.id]);
    for (const row of parsed.rows) {
      await connection.execute(
        `INSERT INTO admin_evaluation_quarters (evaluation_id, seq, label, plan_score, behavioral_score)
         VALUES (?, ?, ?, ?, ?)`,
        [evaluation.id, row.seq, row.label, row.plan, row.behavioral],
      );
    }
    await writeAudit(connection, {
      userId: actor.id, action: 'admin_evaluation.supervisor_saved', entityType: 'admin_evaluation',
      entityId: evaluation.id, details: {}, ipAddress: ip,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getEvaluation(evaluation.id, actor);
}

export async function saveSelfScore(id, body, actor, ip) {
  const { evaluation, relation } = await loadAuthorized(id, actor);
  if (relation !== 'employee') fail('Only the evaluated employee can enter the self-assessment.', 403, 'FORBIDDEN');
  requireOpen(evaluation);
  const score = guard(() => parseScore(body?.selfScore, MAX_SCORES.self, 'Self-assessment'));
  if (score === null) fail('Self-assessment is required.');

  await pool.execute("UPDATE admin_evaluations SET self_score = ? WHERE id = ? AND status = 'draft'", [score, evaluation.id]);
  await writeAudit(pool, {
    userId: actor.id, action: 'admin_evaluation.self_saved', entityType: 'admin_evaluation',
    entityId: evaluation.id, details: {}, ipAddress: ip,
  });
  return getEvaluation(evaluation.id, actor);
}

export async function submitEvaluation(id, actor, ip) {
  const { evaluation, relation } = await loadAuthorized(id, actor);
  if (relation !== 'supervisor') fail('Only the immediate supervisor can submit the evaluation.', 403, 'FORBIDDEN');
  requireOpen(evaluation);

  const current = await getEvaluation(evaluation.id, actor);
  if (!current.summary.complete) {
    fail(`Cannot submit yet. Missing: ${current.summary.missing.join(', ')}.`, 409, 'INCOMPLETE');
  }
  if (!current.strengths || !current.gaps) {
    fail('Cannot submit yet. Enter the employee\u2019s strengths and the gaps / areas for improvement.', 409, 'INCOMPLETE');
  }

  const [result] = await pool.execute(
    "UPDATE admin_evaluations SET status = 'submitted', submitted_at = NOW() WHERE id = ? AND status = 'draft'",
    [evaluation.id],
  );
  if (!result.affectedRows) fail('This evaluation was already submitted.', 409, 'LOCKED');
  await writeAudit(pool, {
    userId: actor.id, action: 'admin_evaluation.submitted', entityType: 'admin_evaluation',
    entityId: evaluation.id, details: { total: current.summary.consolidated.total }, ipAddress: ip,
  });
  return getEvaluation(evaluation.id, actor);
}

export async function respondToEvaluation(id, body, actor, ip) {
  const { evaluation, relation } = await loadAuthorized(id, actor);
  if (relation !== 'employee') fail('Only the evaluated employee can respond.', 403, 'FORBIDDEN');
  if (evaluation.status !== 'submitted') fail('There is nothing to respond to, or you already responded.', 409, 'NOT_RESPONDABLE');

  const response = body?.response;
  if (response !== 'agree' && response !== 'disagree') fail('Response must be "agree" or "disagree".');
  const reason = text(body?.reason, 4000, 'Reason');
  if (response === 'disagree' && (!reason || reason.length < 10)) {
    fail('Please explain the reason you do not agree (at least 10 characters).');
  }

  const [result] = await pool.execute(
    `UPDATE admin_evaluations
        SET status = ?, employee_response = ?, employee_reason = ?, employee_responded_at = NOW()
      WHERE id = ? AND status = 'submitted'`,
    [response === 'agree' ? 'agreed' : 'disputed', response, response === 'disagree' ? reason : null, evaluation.id],
  );
  if (!result.affectedRows) fail('You already responded to this evaluation.', 409, 'NOT_RESPONDABLE');
  await writeAudit(pool, {
    userId: actor.id, action: 'admin_evaluation.employee_responded', entityType: 'admin_evaluation',
    entityId: evaluation.id, details: { response }, ipAddress: ip,
  });
  return getEvaluation(evaluation.id, actor);
}