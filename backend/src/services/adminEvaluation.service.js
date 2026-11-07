// Administrative staff six-month performance evaluation.
// Fully separate from the academic evaluation module: it only reads users, employees and
// departments, and writes only to the admin_* tables. Access is decided by the assignment
// (employee / supervisor of that evaluation) or the admin role, never by academic roles.
import { pool } from '../config/database.js';
import { writeAudit } from '../utils/audit.js';
import {
  MAX_QUARTERS, MAX_SCORES, MAX_TEAM_MEMBERS, averageTeamScore, buildSummary,
  parseScore, readiness, stageOf, validateLevels,
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

// ---------- assignment candidates (administrator) ----------
// Everything the assignments screen needs in one call, so it does not depend on the
// organization module (which only super admins may read) and does not skip staff that
// have no department yet.
//  - employees: active accounts whose staff record is of type "administrative"
//  - supervisors: active accounts that have a staff record (any type)
export async function listAssignable() {
  const [rows] = await pool.execute(
    `SELECT u.id AS user_id, u.name, u.email, u.role, u.id_number,
            e.employee_type, e.job_title, e.department_id, d.name AS department_name
       FROM employees e
       JOIN users u ON u.id = e.user_id
       LEFT JOIN departments d ON d.id = e.department_id
      WHERE u.status = 'active'
      ORDER BY u.name`,
  );

  const person = (r) => ({
    id: String(r.user_id),
    userId: String(r.user_id),
    name: r.name,
    email: r.email,
    role: r.role,
    idNumber: r.id_number,
    employeeType: r.employee_type,
    jobTitle: r.job_title,
    departmentId: r.department_id ? String(r.department_id) : null,
    departmentName: r.department_name || '',
    status: 'active',
  });

  const supervisors = rows.map(person);
  return {
    employees: supervisors.filter((p) => p.employeeType === 'administrative'),
    supervisors,
  };
}

// ---------- reading ----------
// Who may see and do what (decided by the assignment, never by academic roles):
//   employee    own self-assessment; the final result only after the supervisor submits
//   team member only the evaluated person's name and their own team assessment
//   supervisor  everything, including each team member's individual assessment
//   admin       everything (assigns evaluators, tracks progress); never fills an assessment
const ADMIN_ROLES = ['admin', 'super_admin', 'administrative_admin'];

const LIST_SQL = `
  SELECT e.id, e.status, e.period_id, p.title AS period_title, p.status AS period_status,
         e.employee_user_id, eu.name AS employee_name, e.supervisor_user_id, su.name AS supervisor_name,
         e.job_title, e.work_unit, e.self_submitted_at,
         (SELECT COUNT(*) FROM admin_evaluation_team_assessments t
           WHERE t.evaluation_id = e.id) AS team_total,
         (SELECT COUNT(*) FROM admin_evaluation_team_assessments t
           WHERE t.evaluation_id = e.id AND t.submitted_at IS NOT NULL) AS team_submitted
    FROM admin_evaluations e
    JOIN admin_evaluation_periods p ON p.id = e.period_id
    JOIN users eu ON eu.id = e.employee_user_id
    JOIN users su ON su.id = e.supervisor_user_id`;

function progressOf(r) {
  const progress = {
    selfSubmitted: Boolean(r.self_submitted_at),
    teamAssigned: Number(r.team_total),
    teamSubmitted: Number(r.team_submitted),
  };
  return { progress, stage: stageOf({ status: r.status, ...progress }) };
}

const listOut = (r, { hideTeam = false } = {}) => {
  const { progress, stage } = progressOf(r);
  return {
    id: String(r.id), status: r.status,
    // The evaluated employee only learns "in progress" until the supervisor submits.
    stage: hideTeam && r.status === 'draft' ? 'in_progress' : stage,
    progress: hideTeam ? { selfSubmitted: progress.selfSubmitted } : progress,
    period: { id: String(r.period_id), title: r.period_title, status: r.period_status },
    employee: { userId: String(r.employee_user_id), name: r.employee_name, jobTitle: r.job_title, workUnit: r.work_unit },
    supervisor: { userId: String(r.supervisor_user_id), name: r.supervisor_name },
  };
};

export async function listMine(actor) {
  const [asEmployee] = await pool.execute(`${LIST_SQL} WHERE e.employee_user_id = ? ORDER BY p.start_date DESC`, [actor.id]);
  const [asSupervisor] = await pool.execute(`${LIST_SQL} WHERE e.supervisor_user_id = ? ORDER BY p.start_date DESC, eu.name`, [actor.id]);
  const [asTeam] = await pool.execute(
    `SELECT e.id, e.status, p.id AS period_id, p.title AS period_title, p.status AS period_status,
            eu.name AS employee_name, e.job_title, e.work_unit, t.submitted_at AS my_submitted_at
       FROM admin_evaluation_team_assessments t
       JOIN admin_evaluations e ON e.id = t.evaluation_id
       JOIN admin_evaluation_periods p ON p.id = e.period_id
       JOIN users eu ON eu.id = e.employee_user_id
      WHERE t.evaluator_user_id = ?
      ORDER BY p.start_date DESC, eu.name`,
    [actor.id],
  );
  return {
    asEmployee: asEmployee.map((r) => listOut(r, { hideTeam: true })),
    asSupervisor: asSupervisor.map((r) => listOut(r)),
    asTeamMember: asTeam.map((r) => ({
      id: String(r.id),
      period: { id: String(r.period_id), title: r.period_title, status: r.period_status },
      employee: { name: r.employee_name, jobTitle: r.job_title, workUnit: r.work_unit },
      submitted: Boolean(r.my_submitted_at),
      submittedAt: r.my_submitted_at,
      // A team assessor never sees the evaluation's own status or anyone else's progress.
      open: r.status === 'draft' && r.period_status === 'active' && !r.my_submitted_at,
    })),
  };
}

export async function listAll(query) {
  const params = [];
  let where = '';
  if (query?.periodId) {
    where = 'WHERE e.period_id = ?';
    params.push(positiveId(query.periodId, 'periodId'));
  }
  const [rows] = await pool.execute(`${LIST_SQL} ${where} ORDER BY p.start_date DESC, eu.name`, params);
  return rows.map((r) => listOut(r));
}

async function loadEvaluation(id, db = pool, lock = false) {
  const [rows] = await db.execute(
    `SELECT e.*, p.title AS period_title, p.status AS period_status,
            DATE_FORMAT(p.start_date, '%Y-%m-%d') AS period_start, DATE_FORMAT(p.end_date, '%Y-%m-%d') AS period_end,
            eu.name AS employee_name, su.name AS supervisor_name, d.name AS department_name
       FROM admin_evaluations e
       JOIN admin_evaluation_periods p ON p.id = e.period_id
       JOIN users eu ON eu.id = e.employee_user_id
       JOIN users su ON su.id = e.supervisor_user_id
       LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.id = ? ${lock ? 'FOR UPDATE OF e' : ''}`,
    [id],
  );
  return rows[0] || null;
}

async function loadTeamRows(evaluationId, db = pool) {
  const [rows] = await db.execute(
    `SELECT t.id, t.evaluator_user_id, u.name, t.score, t.comment, t.submitted_at
       FROM admin_evaluation_team_assessments t
       JOIN users u ON u.id = t.evaluator_user_id
      WHERE t.evaluation_id = ?
      ORDER BY u.name, t.id`,
    [evaluationId],
  );
  return rows;
}

// A person can hold several links to one evaluation in theory; the assignment rules prevent
// the combinations that matter (employee/supervisor/team are mutually exclusive).
async function relationsOf(evaluation, actor) {
  const isAdmin = ADMIN_ROLES.includes(actor.role);
  const isSupervisor = same(evaluation.supervisor_user_id, actor.id);
  const isEmployee = same(evaluation.employee_user_id, actor.id);
  const [teamRows] = await pool.execute(
    `SELECT id, score, comment, submitted_at FROM admin_evaluation_team_assessments
      WHERE evaluation_id = ? AND evaluator_user_id = ?`,
    [evaluation.id, actor.id],
  );
  const teamRow = teamRows[0] || null;
  const relation = isSupervisor ? 'supervisor'
    : isEmployee ? 'employee'
      : teamRow ? 'team_member'
        : isAdmin ? 'admin' : null;
  return { relation, isAdmin, isSupervisor, isEmployee, teamRow };
}

async function loadAuthorized(id, actor) {
  const evaluationId = positiveId(id, 'evaluation id');
  const evaluation = await loadEvaluation(evaluationId);
  // 404 (not 403) so the existence of other people's evaluations is not revealed.
  const who = evaluation ? await relationsOf(evaluation, actor) : { relation: null };
  if (!evaluation || !who.relation) fail('Evaluation not found.', 404, 'NOT_FOUND');
  return { evaluation, ...who };
}

// Everything the readiness rule and the summary need, read from one connection.
async function collectState(evaluation, db = pool) {
  const [quarters] = await db.execute(
    'SELECT seq, label, plan_score, behavioral_score FROM admin_evaluation_quarters WHERE evaluation_id = ? ORDER BY seq',
    [evaluation.id],
  );
  const teamRows = await loadTeamRows(evaluation.id, db);
  const submittedTeam = teamRows.filter((t) => t.submitted_at);
  const finalized = evaluation.status !== 'draft';
  const liveAverage = averageTeamScore(submittedTeam.map((t) => t.score));
  const allTeamIn = teamRows.length > 0 && submittedTeam.length === teamRows.length;
  // Finalized evaluations use the snapshot taken at submission (also covers legacy rows).
  const teamScore = finalized ? evaluation.team_score : (allTeamIn ? liveAverage : null);
  const selfSubmitted = Boolean(evaluation.self_submitted_at);
  const ready = readiness({
    selfSubmitted,
    teamAssigned: teamRows.length,
    teamSubmitted: submittedTeam.length,
    planCount: quarters.filter((q) => q.plan_score !== null).length,
    supervisorScore: evaluation.supervisor_score,
    strengths: evaluation.strengths,
    gaps: evaluation.gaps,
  });
  return { quarters, teamRows, submittedTeam, finalized, liveAverage, teamScore, selfSubmitted, ready };
}

export async function getEvaluation(id, actor) {
  const { evaluation, relation, isAdmin, isSupervisor, isEmployee, teamRow } = await loadAuthorized(id, actor);
  const state = await collectState(evaluation);
  const levels = await getLevels();
  const fullView = isAdmin || isSupervisor;
  const employeeView = isEmployee && !fullView;
  const teamView = Boolean(teamRow) && !fullView && !isEmployee;

  const open = evaluation.period_status === 'active' && evaluation.status === 'draft';
  const { stage } = progressOf({
    status: evaluation.status,
    self_submitted_at: evaluation.self_submitted_at,
    team_total: state.teamRows.length,
    team_submitted: state.submittedTeam.length,
  });

  const base = {
    id: String(evaluation.id),
    relation,
    status: evaluation.status,
    stage: employeeView && evaluation.status === 'draft' ? 'in_progress' : stage,
    period: {
      id: String(evaluation.period_id), title: evaluation.period_title, status: evaluation.period_status,
      startDate: evaluation.period_start, endDate: evaluation.period_end,
    },
    employee: {
      userId: String(evaluation.employee_user_id), name: evaluation.employee_name,
      jobTitle: evaluation.job_title, grade: evaluation.grade, workUnit: evaluation.work_unit,
      department: evaluation.department_name,
    },
    levels,
    maxScores: MAX_SCORES,
    permissions: {
      canEditSelf: isEmployee && open && !state.selfSubmitted,
      canSubmitSelf: isEmployee && open && !state.selfSubmitted,
      canSubmitTeamAssessment: Boolean(teamRow) && open && !teamRow.submitted_at,
      canEditSupervisorPart: isSupervisor && open,
      canSubmit: isSupervisor && open && state.ready.ready,
      canManageTeam: isAdmin && open,
      canRespond: isEmployee && evaluation.status === 'submitted',
    },
  };

  // Team assessors see only who is being evaluated and their own assessment.
  if (teamView) {
    return {
      ...base,
      team: {
        mine: {
          score: teamRow.score === null ? null : Number(teamRow.score),
          comment: teamRow.comment,
          submitted: Boolean(teamRow.submitted_at),
          submittedAt: teamRow.submitted_at,
        },
      },
    };
  }

  const selfVisible = state.selfSubmitted || state.finalized;
  const teamMembers = state.teamRows.map((t) => ({
    userId: String(t.evaluator_user_id), name: t.name, submitted: Boolean(t.submitted_at),
    submittedAt: t.submitted_at, score: t.score === null ? null : Number(t.score), comment: t.comment,
  }));

  // The employee sees the self-assessment they entered, and the full result only once submitted.
  if (employeeView && !state.finalized) {
    return {
      ...base,
      supervisor: { userId: String(evaluation.supervisor_user_id), name: evaluation.supervisor_name },
      self: {
        score: evaluation.self_score === null ? null : Number(evaluation.self_score),
        submitted: state.selfSubmitted, submittedAt: evaluation.self_submitted_at,
      },
      response: { value: null, reason: null, respondedAt: null },
      summary: null,
      submittedAt: null,
    };
  }

  const summary = buildSummary(
    {
      selfScore: selfVisible ? evaluation.self_score : null,
      teamScore: state.teamScore,
      supervisorScore: evaluation.supervisor_score,
      quarters: state.quarters,
    },
    levels,
  );

  return {
    ...base,
    supervisor: { userId: String(evaluation.supervisor_user_id), name: evaluation.supervisor_name },
    self: {
      score: selfVisible && evaluation.self_score !== null ? Number(evaluation.self_score) : null,
      submitted: state.selfSubmitted, submittedAt: evaluation.self_submitted_at,
    },
    team: {
      assigned: state.teamRows.length,
      submitted: state.submittedTeam.length,
      average: state.finalized ? state.teamScore === null ? null : Number(state.teamScore) : state.liveAverage,
      // Individual assessments are confidential: only the supervisor and administrators see them.
      members: fullView ? teamMembers : undefined,
    },
    strengths: evaluation.strengths,
    gaps: evaluation.gaps,
    submittedAt: evaluation.submitted_at,
    response: {
      value: evaluation.employee_response, reason: evaluation.employee_reason,
      respondedAt: evaluation.employee_responded_at,
    },
    summary,
    readiness: fullView ? state.ready : undefined,
  };
}

// ---------- writing ----------
function requireOpen(evaluation) {
  if (evaluation.status !== 'draft') fail('This evaluation has already been submitted and is locked.', 409, 'LOCKED');
  if (evaluation.period_status !== 'active') fail('This evaluation period is not active.', 409, 'PERIOD_NOT_ACTIVE');
}

function parseQuarterRows(body) {
  const quarters = Array.isArray(body?.quarters) ? body.quarters : [];
  if (quarters.length > MAX_QUARTERS) throw new RangeError(`At most ${MAX_QUARTERS} quarter rows are allowed.`);
  const seen = new Set();
  return quarters.map((q) => {
    const seq = Number(q?.seq);
    if (!Number.isInteger(seq) || seq < 1 || seq > MAX_QUARTERS || seen.has(seq)) {
      throw new RangeError('Each quarter needs a unique number from 1 to 4.');
    }
    seen.add(seq);
    const label = String(q?.label ?? '').trim() || `Quarter ${seq}`;
    if (label.length > 80) throw new RangeError('A quarter label must be at most 80 characters.');
    return { seq, label, plan: parseScore(q.planScore, MAX_SCORES.plan, `Quarter ${seq} plan score`) };
  });
}

// Immediate supervisor: planned-results quarter scores (70), supervisor assessment (10),
// strengths and gaps. Team and self scores are never accepted here.
export async function saveSupervisorPart(id, body, actor, ip) {
  const { evaluation, isSupervisor } = await loadAuthorized(id, actor);
  if (!isSupervisor) fail('Only the immediate supervisor can enter these scores.', 403, 'FORBIDDEN');
  requireOpen(evaluation);

  const parsed = guard(() => ({
    rows: parseQuarterRows(body),
    supervisor: parseScore(body?.supervisorScore, MAX_SCORES.supervisor, 'Supervisor score'),
  }));

  const grade = text(body?.grade ?? evaluation.grade, 30, 'Grade');
  const workUnit = text(body?.workUnit ?? evaluation.work_unit, 255, 'Work unit');
  const jobTitle = text(body?.jobTitle ?? evaluation.job_title, 150, 'Job title');
  const strengths = text(body?.strengths, 4000, 'Strengths');
  const gaps = text(body?.gaps, 4000, 'Gaps');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE admin_evaluations
          SET supervisor_score = ?, strengths = ?, gaps = ?, grade = ?, work_unit = ?, job_title = ?
        WHERE id = ? AND status = 'draft'`,
      [parsed.supervisor, strengths, gaps, grade, workUnit, jobTitle, evaluation.id],
    );
    if (!result.affectedRows) fail('This evaluation was already submitted.', 409, 'LOCKED');
    await connection.execute('DELETE FROM admin_evaluation_quarters WHERE evaluation_id = ?', [evaluation.id]);
    for (const row of parsed.rows) {
      await connection.execute(
        `INSERT INTO admin_evaluation_quarters (evaluation_id, seq, label, plan_score, behavioral_score)
         VALUES (?, ?, ?, ?, NULL)`,
        [evaluation.id, row.seq, row.label, row.plan],
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

// Employee: self-assessment (5). Saved as a draft, then submitted once and locked.
async function writeSelfScore(id, body, actor, ip, { submit }) {
  const { evaluation, isEmployee } = await loadAuthorized(id, actor);
  if (!isEmployee) fail('Only the evaluated employee can enter the self-assessment.', 403, 'FORBIDDEN');
  requireOpen(evaluation);
  if (evaluation.self_submitted_at) fail('Your self-assessment was already submitted and is locked.', 409, 'SELF_LOCKED');

  const given = guard(() => parseScore(body?.selfScore, MAX_SCORES.self, 'Self-assessment'));
  const score = given !== null ? given : (evaluation.self_score === null ? null : Number(evaluation.self_score));
  if (score === null) fail('Self-assessment is required.');

  const [result] = await pool.execute(
    `UPDATE admin_evaluations
        SET self_score = ?, self_submitted_at = ${submit ? 'NOW()' : 'NULL'}
      WHERE id = ? AND status = 'draft' AND self_submitted_at IS NULL`,
    [score, evaluation.id],
  );
  if (!result.affectedRows) fail('Your self-assessment can no longer be changed.', 409, 'SELF_LOCKED');
  await writeAudit(pool, {
    userId: actor.id, action: submit ? 'admin_evaluation.self_submitted' : 'admin_evaluation.self_saved',
    entityType: 'admin_evaluation', entityId: evaluation.id, details: {}, ipAddress: ip,
  });
  return getEvaluation(evaluation.id, actor);
}

export const saveSelfScore = (id, body, actor, ip) => writeSelfScore(id, body, actor, ip, { submit: false });
export const submitSelfAssessment = (id, body, actor, ip) => writeSelfScore(id, body, actor, ip, { submit: true });

// Team member: individual team assessment (15). Each assessor submits their own, once.
async function writeTeamAssessment(id, body, actor, ip, { submit }) {
  const { evaluation, teamRow, isSupervisor, isEmployee } = await loadAuthorized(id, actor);
  if (!teamRow || isSupervisor || isEmployee) {
    fail('You are not assigned as a team assessor for this evaluation.', 403, 'FORBIDDEN');
  }
  requireOpen(evaluation);
  if (teamRow.submitted_at) fail('You already submitted your team assessment.', 409, 'TEAM_LOCKED');

  const score = guard(() => parseScore(body?.score, MAX_SCORES.team, 'Team assessment'));
  if (submit && score === null) fail('Enter your team assessment score before submitting.');
  const comment = text(body?.comment, 2000, 'Comment');

  const [result] = await pool.execute(
    `UPDATE admin_evaluation_team_assessments t
       JOIN admin_evaluations e ON e.id = t.evaluation_id
        SET t.score = ?, t.comment = ?, t.submitted_at = ${submit ? 'NOW()' : 'NULL'}
      WHERE t.id = ? AND t.submitted_at IS NULL AND e.status = 'draft'`,
    [score, comment, teamRow.id],
  );
  if (!result.affectedRows) fail('This team assessment can no longer be changed.', 409, 'TEAM_LOCKED');
  await writeAudit(pool, {
    userId: actor.id, action: submit ? 'admin_evaluation.team_submitted' : 'admin_evaluation.team_saved',
    entityType: 'admin_evaluation', entityId: evaluation.id, details: {}, ipAddress: ip,
  });
  return getEvaluation(evaluation.id, actor);
}

export const saveTeamAssessment = (id, body, actor, ip) => writeTeamAssessment(id, body, actor, ip, { submit: false });
export const submitTeamAssessment = (id, body, actor, ip) => writeTeamAssessment(id, body, actor, ip, { submit: true });

// Administrator: who the team assessors are. Replaces the list; a member who already
// submitted cannot be removed.
export async function setTeamMembers(id, body, actor, ip) {
  const { evaluation, isAdmin } = await loadAuthorized(id, actor);
  if (!isAdmin) fail('Only an administrator can assign team assessors.', 403, 'FORBIDDEN');
  requireOpen(evaluation);

  const raw = Array.isArray(body?.evaluatorUserIds) ? body.evaluatorUserIds : null;
  if (!raw) fail('evaluatorUserIds must be a list.');
  const ids = [...new Set(raw.map((v) => positiveId(v, 'team assessor id')))];
  if (ids.length > MAX_TEAM_MEMBERS) fail(`At most ${MAX_TEAM_MEMBERS} team assessors are allowed.`);
  if (ids.some((v) => same(v, evaluation.employee_user_id) || same(v, evaluation.supervisor_user_id))) {
    fail('The evaluated employee and the immediate supervisor cannot be team assessors.');
  }

  if (ids.length) {
    const [staff] = await pool.query(
      `SELECT u.id FROM users u JOIN employees e ON e.user_id = u.id
        WHERE u.id IN (?) AND u.status = 'active'`,
      [ids],
    );
    const valid = new Set(staff.map((r) => String(r.id)));
    const invalid = ids.filter((v) => !valid.has(v));
    if (invalid.length) fail('Every team assessor must be an active staff account.', 400, 'INVALID_ASSESSOR');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const locked = await loadEvaluation(evaluation.id, connection, true);
    requireOpen(locked);
    const existing = await loadTeamRows(evaluation.id, connection);
    const keep = new Set(ids);
    const removing = existing.filter((t) => !keep.has(String(t.evaluator_user_id)));
    const blocked = removing.filter((t) => t.submitted_at);
    if (blocked.length) {
      fail(`${blocked.map((t) => t.name).join(', ')} already submitted and cannot be removed.`, 409, 'TEAM_LOCKED');
    }
    for (const t of removing) {
      await connection.execute('DELETE FROM admin_evaluation_team_assessments WHERE id = ?', [t.id]);
    }
    const have = new Set(existing.map((t) => String(t.evaluator_user_id)));
    for (const userId of ids.filter((v) => !have.has(v))) {
      await connection.execute(
        'INSERT INTO admin_evaluation_team_assessments (evaluation_id, evaluator_user_id, assigned_by) VALUES (?, ?, ?)',
        [evaluation.id, userId, actor.id],
      );
    }
    await writeAudit(connection, {
      userId: actor.id, action: 'admin_evaluation.team_assigned', entityType: 'admin_evaluation',
      entityId: evaluation.id, details: { count: ids.length }, ipAddress: ip,
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

// Immediate supervisor finalizes. The system takes the team score as the average of the
// individual assessments and locks the result.
export async function submitEvaluation(id, actor, ip) {
  const { evaluation, isSupervisor } = await loadAuthorized(id, actor);
  if (!isSupervisor) fail('Only the immediate supervisor can submit the evaluation.', 403, 'FORBIDDEN');
  requireOpen(evaluation);

  const connection = await pool.getConnection();
  let total = null;
  try {
    await connection.beginTransaction();
    const locked = await loadEvaluation(evaluation.id, connection, true);
    requireOpen(locked);
    const state = await collectState(locked, connection);
    if (!state.ready.ready) {
      fail(`Cannot submit yet. Missing: ${state.ready.missing.join('; ')}.`, 409, 'INCOMPLETE');
    }
    const levels = await getLevels();
    const summary = buildSummary(
      {
        selfScore: locked.self_score, teamScore: state.liveAverage,
        supervisorScore: locked.supervisor_score, quarters: state.quarters,
      },
      levels,
    );
    total = summary.consolidated.total;
    const [result] = await connection.execute(
      `UPDATE admin_evaluations
          SET status = 'submitted', submitted_at = NOW(), team_score = ?
        WHERE id = ? AND status = 'draft'`,
      [state.liveAverage, evaluation.id],
    );
    if (!result.affectedRows) fail('This evaluation was already submitted.', 409, 'LOCKED');
    await writeAudit(connection, {
      userId: actor.id, action: 'admin_evaluation.submitted', entityType: 'admin_evaluation',
      entityId: evaluation.id, details: { total, teamAssessors: state.teamRows.length }, ipAddress: ip,
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

export async function respondToEvaluation(id, body, actor, ip) {
  const { evaluation, isEmployee } = await loadAuthorized(id, actor);
  if (!isEmployee) fail('Only the evaluated employee can respond.', 403, 'FORBIDDEN');
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

// ---------- period report (administrator) ----------
// Scores are reported only for finalized evaluations. In-progress ones show submission
// progress instead, so partial or unsubmitted scores are never exposed.
export async function periodReport(query) {
  const periodId = positiveId(query?.periodId, 'periodId');
  const [periods] = await pool.execute(
    `SELECT id, title, status, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
       FROM admin_evaluation_periods WHERE id = ?`,
    [periodId],
  );
  if (!periods[0]) fail('Period not found.', 404, 'NOT_FOUND');

  const [rows] = await pool.execute(
    `SELECT e.id, e.status, e.self_score, e.team_score, e.supervisor_score, e.self_submitted_at,
            e.employee_response, e.job_title, e.work_unit,
            eu.name AS employee_name, su.name AS supervisor_name, d.name AS department_name,
            (SELECT COUNT(*) FROM admin_evaluation_team_assessments t WHERE t.evaluation_id = e.id) AS team_total,
            (SELECT COUNT(*) FROM admin_evaluation_team_assessments t
              WHERE t.evaluation_id = e.id AND t.submitted_at IS NOT NULL) AS team_submitted
       FROM admin_evaluations e
       JOIN users eu ON eu.id = e.employee_user_id
       JOIN users su ON su.id = e.supervisor_user_id
       LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.period_id = ?
      ORDER BY d.name, eu.name`,
    [periodId],
  );

  const ids = rows.map((r) => r.id);
  const quartersByEvaluation = new Map();
  if (ids.length) {
    const [quarters] = await pool.query(
      'SELECT evaluation_id, seq, label, plan_score, behavioral_score FROM admin_evaluation_quarters WHERE evaluation_id IN (?) ORDER BY seq',
      [ids],
    );
    for (const q of quarters) {
      const list = quartersByEvaluation.get(String(q.evaluation_id)) || [];
      list.push(q);
      quartersByEvaluation.set(String(q.evaluation_id), list);
    }
  }

  const levels = await getLevels();
  const byStatus = {};
  const byLevel = {};
  const byStage = {};
  let totalSum = 0;
  let totalCount = 0;

  const out = rows.map((r) => {
    const { progress, stage } = progressOf(r);
    const finalized = r.status !== 'draft';
    const summary = finalized
      ? buildSummary(
        {
          selfScore: r.self_score, teamScore: r.team_score, supervisorScore: r.supervisor_score,
          quarters: quartersByEvaluation.get(String(r.id)) || [],
        },
        levels,
      )
      : null;
    const c = summary?.consolidated;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byStage[stage] = (byStage[stage] || 0) + 1;
    if (c?.total !== null && c?.total !== undefined) {
      totalSum += c.total;
      totalCount += 1;
      const key = c.level || 'No level';
      byLevel[key] = (byLevel[key] || 0) + 1;
    }
    return {
      id: String(r.id),
      employee: r.employee_name,
      department: r.department_name || '',
      jobTitle: r.job_title || '',
      supervisor: r.supervisor_name,
      status: r.status,
      stage,
      progress,
      employeeResponse: r.employee_response,
      plan: c?.plan ?? null,
      self: c?.self ?? null,
      team: c?.team ?? null,
      supervisorScore: c?.supervisor ?? null,
      behavioral: c?.behavioral ?? null,
      total: c?.total ?? null,
      level: c?.level ?? null,
    };
  });

  return {
    period: {
      id: String(periods[0].id), title: periods[0].title, status: periods[0].status,
      startDate: periods[0].start_date, endDate: periods[0].end_date,
    },
    stats: {
      total: out.length,
      finalized: totalCount,
      averageTotal: totalCount ? Math.round((totalSum / totalCount) * 100) / 100 : null,
      byStatus,
      byStage,
      levelDistribution: levels
        .map((l) => ({ level: l.name, count: byLevel[l.name] || 0 }))
        .concat(byLevel['No level'] ? [{ level: 'No level', count: byLevel['No level'] }] : []),
    },
    rows: out,
  };
}