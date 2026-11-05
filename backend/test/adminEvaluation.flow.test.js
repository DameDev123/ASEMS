import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET ||= 'test-only-secret-that-is-long-enough-0123456789';
process.env.DB_USER ||= 'test';

const { pool } = await import('../src/config/database.js');
const svc = await import('../src/services/adminEvaluation.service.js');

const EMP = { id: 21, role: 'management' };      // any role: access comes from the assignment
const SUP = { id: 30, role: 'department_head' };
const OTHER = { id: 99, role: 'dean' };
const ADMIN = { id: 1, role: 'admin' };

// In-memory stand-in for the database, dispatching on the SQL each service function sends.
function installFake({ periodStatus = 'active', levels = [] } = {}) {
  const ev = {
    id: 5, period_id: 1, employee_user_id: 21, supervisor_user_id: 30, department_id: 2,
    job_title: 'Officer', grade: 'VII', work_unit: 'Registrar', self_score: null, team_score: null,
    supervisor_score: null, strengths: null, gaps: null, status: 'draft', submitted_at: null,
    employee_response: null, employee_reason: null, employee_responded_at: null,
  };
  let quarters = [];
  const audit = [];

  const run = async (sql, params) => {
    if (/INSERT INTO audit_logs/.test(sql)) { audit.push(params[1]); return [{}]; }
    if (/FROM admin_evaluations e\s+JOIN admin_evaluation_periods p[\s\S]*WHERE e\.id = \?/.test(sql)) {
      return [[{ ...ev, period_title: 'Jul-Dec 2026', period_status: periodStatus, period_start: '2026-07-01', period_end: '2026-12-31', employee_name: 'Emp', supervisor_name: 'Sup', department_name: 'Reg' }]];
    }
    if (/FROM admin_evaluation_quarters/.test(sql)) return [quarters];
    if (/FROM admin_performance_levels/.test(sql)) return [levels.map((l) => ({ name: l.name, min_score: String(l.minScore) }))];
    if (/SET self_score = \?/.test(sql)) { ev.self_score = String(params[0]); return [{ affectedRows: 1 }]; }
    if (/SET team_score = \?/.test(sql)) {
      [ev.team_score, ev.supervisor_score, ev.strengths, ev.gaps] = [params[0], params[1], params[2], params[3]];
      return [{ affectedRows: 1 }];
    }
    if (/DELETE FROM admin_evaluation_quarters/.test(sql)) { quarters = []; return [{}]; }
    if (/INSERT INTO admin_evaluation_quarters/.test(sql)) {
      quarters.push({ seq: params[1], label: params[2], plan_score: params[3], behavioral_score: params[4] });
      return [{}];
    }
    if (/SET status = 'submitted'/.test(sql)) {
      if (ev.status !== 'draft') return [{ affectedRows: 0 }];
      ev.status = 'submitted'; return [{ affectedRows: 1 }];
    }
    if (/SET status = \?, employee_response/.test(sql)) {
      if (ev.status !== 'submitted') return [{ affectedRows: 0 }];
      [ev.status, ev.employee_response, ev.employee_reason] = [params[0], params[1], params[2]];
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected SQL in test: ${sql.slice(0, 70)}`);
  };

  const connection = { execute: run, beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {} };
  pool.execute = run;
  pool.getConnection = async () => connection;
  return { ev, audit, restore() { delete pool.execute; delete pool.getConnection; delete pool.query; } };
}

const supervisorBody = {
  quarters: [
    { seq: 1, label: 'Q1', planScore: 60, behavioralScore: 25 },
    { seq: 2, label: 'Q2', planScore: 50, behavioralScore: 20 },
  ],
  teamScore: 12, supervisorScore: 8, strengths: 'Reliable and punctual.', gaps: 'Needs better reporting.',
};

async function rejects(promise, code, status) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code);
    if (status) assert.equal(error.statusCode, status);
    return true;
  });
}

test('only the assigned employee, supervisor or admin can see an evaluation', async () => {
  const db = installFake();
  try {
    assert.equal((await svc.getEvaluation(5, EMP)).relation, 'employee');
    assert.equal((await svc.getEvaluation(5, SUP)).relation, 'supervisor');
    assert.equal((await svc.getEvaluation(5, ADMIN)).relation, 'admin');
    await rejects(svc.getEvaluation(5, OTHER), 'NOT_FOUND', 404);
  } finally { db.restore(); }
});

test('each side can only enter its own part', async () => {
  const db = installFake();
  try {
    await rejects(svc.saveSelfScore(5, { selfScore: 4 }, SUP), 'FORBIDDEN', 403);
    await rejects(svc.saveSupervisorPart(5, supervisorBody, EMP), 'FORBIDDEN', 403);
    await rejects(svc.saveSupervisorPart(5, supervisorBody, ADMIN), 'FORBIDDEN', 403);
    await rejects(svc.saveSelfScore(5, { selfScore: 6 }, EMP), 'VALIDATION_ERROR', 400);
    await rejects(svc.saveSupervisorPart(5, { ...supervisorBody, teamScore: 16 }, SUP), 'VALIDATION_ERROR', 400);
  } finally { db.restore(); }
});

test('full flow: self score, supervisor scores, submit, lock, employee response', async () => {
  const db = installFake({ levels: [{ name: 'Low', minScore: 0 }, { name: 'High', minScore: 75 }] });
  try {
    await rejects(svc.submitEvaluation(5, SUP), 'INCOMPLETE', 409);

    await svc.saveSelfScore(5, { selfScore: 4 }, EMP);
    const saved = await svc.saveSupervisorPart(5, supervisorBody, SUP);
    assert.equal(saved.summary.consolidated.plan, 55);
    assert.equal(saved.summary.consolidated.behavioral, 24);
    assert.equal(saved.summary.consolidated.total, 79);
    assert.equal(saved.summary.consolidated.level, 'High');
    assert.equal(saved.permissions.canSubmit, true);

    const submitted = await svc.submitEvaluation(5, SUP);
    assert.equal(submitted.status, 'submitted');

    // Locked after submission.
    await rejects(svc.saveSelfScore(5, { selfScore: 5 }, EMP), 'LOCKED', 409);
    await rejects(svc.saveSupervisorPart(5, supervisorBody, SUP), 'LOCKED', 409);
    await rejects(svc.submitEvaluation(5, SUP), 'LOCKED', 409);

    // Employee response rules.
    await rejects(svc.respondToEvaluation(5, { response: 'agree' }, SUP), 'FORBIDDEN', 403);
    await rejects(svc.respondToEvaluation(5, { response: 'disagree', reason: 'no' }, EMP), 'VALIDATION_ERROR', 400);
    await rejects(svc.respondToEvaluation(5, { response: 'maybe' }, EMP), 'VALIDATION_ERROR', 400);

    const done = await svc.respondToEvaluation(5, { response: 'disagree', reason: 'Targets were changed mid-period.' }, EMP);
    assert.equal(done.status, 'disputed');
    assert.equal(done.response.value, 'disagree');
    await rejects(svc.respondToEvaluation(5, { response: 'agree' }, EMP), 'NOT_RESPONDABLE', 409);
    assert.ok(db.audit.includes('admin_evaluation.submitted'));
  } finally { db.restore(); }
});

test('agreeing records the response without a reason', async () => {
  const db = installFake();
  try {
    await svc.saveSelfScore(5, { selfScore: 5 }, EMP);
    await svc.saveSupervisorPart(5, supervisorBody, SUP);
    await svc.submitEvaluation(5, SUP);
    const done = await svc.respondToEvaluation(5, { response: 'agree', reason: 'ignored' }, EMP);
    assert.equal(done.status, 'agreed');
    assert.equal(done.response.reason, null);
  } finally { db.restore(); }
});

test('submission requires strengths and gaps, and an active period', async () => {
  let db = installFake();
  try {
    await svc.saveSelfScore(5, { selfScore: 4 }, EMP);
    await svc.saveSupervisorPart(5, { ...supervisorBody, strengths: '', gaps: '' }, SUP);
    await rejects(svc.submitEvaluation(5, SUP), 'INCOMPLETE', 409);
  } finally { db.restore(); }

  db = installFake({ periodStatus: 'closed' });
  try {
    await rejects(svc.saveSelfScore(5, { selfScore: 4 }, EMP), 'PERIOD_NOT_ACTIVE', 409);
    await rejects(svc.saveSupervisorPart(5, supervisorBody, SUP), 'PERIOD_NOT_ACTIVE', 409);
  } finally { db.restore(); }
});

test('assignments only accept active administrative employees with a different active supervisor', async () => {
  const inserted = [];
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {},
    execute: async (sql, params) => { if (/INSERT INTO admin_evaluations/.test(sql)) inserted.push(params); return [{}]; },
  };
  pool.getConnection = async () => connection;
  pool.execute = async (sql) => {
    if (/FROM admin_evaluation_periods/.test(sql)) return [[{ id: 1, status: 'active' }]];
    return [{}];
  };
  pool.query = async (sql) => {
    if (/FROM employees/.test(sql)) {
      return [[
        { user_id: 21, department_id: 2, job_title: 'Officer', employee_type: 'administrative', status: 'active', department_name: 'Registrar' },
        { user_id: 22, department_id: 2, job_title: 'Instructor', employee_type: 'academic', status: 'active', department_name: 'Reg' },
        { user_id: 23, department_id: 2, job_title: 'Clerk', employee_type: 'administrative', status: 'inactive', department_name: 'Reg' },
      ]];
    }
    if (/FROM users/.test(sql)) return [[{ id: 30, status: 'active' }]];
    if (/FROM admin_evaluations/.test(sql)) return [[]];
    throw new Error('Unexpected query');
  };
  try {
    const result = await svc.assignEvaluations(
      {
        periodId: 1,
        assignments: [
          { employeeUserId: 21, supervisorUserId: 30 },
          { employeeUserId: 22, supervisorUserId: 30 },
          { employeeUserId: 23, supervisorUserId: 30 },
          { employeeUserId: 21, supervisorUserId: 30 },
          { employeeUserId: 30, supervisorUserId: 30 },
        ],
      },
      ADMIN, '127.0.0.1',
    );
    assert.equal(result.created, 1);
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0][7 - 1], 'Registrar'); // work unit defaults to the department name
    const reasons = Object.fromEntries(result.skipped.map((s) => [s.employeeUserId, s.reason]));
    assert.match(reasons['22'], /Not an administrative employee/);
    assert.match(reasons['23'], /not active/);
    assert.match(reasons['30'], /Not an administrative employee|supervise themselves/);
  } finally {
    delete pool.execute; delete pool.query; delete pool.getConnection;
  }
});