import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { requireAuth, allowRoles } from '../middlewares/auth.js';
import { asyncHandler, httpError, sendData } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';

// Evaluation tasks = rows of evaluation_assignments. Only administrators manage them for now:
// department heads and committees cannot be limited to their own department until users are
// linked to departments (employees table).
const router = Router();
router.use(requireAuth, allowRoles('admin'));

const id = z.number().int().positive();

const createSchema = z.object({
  cycleId: id,
  instructorId: id,
  courseTitle: z.string().trim().min(1).max(255),
  courseCode: z.string().trim().max(50).default(''),
  batch: z.enum(['I', 'II', 'III', 'IV', 'V']).nullable().optional(),
  semester: z.enum(['I', 'II']).nullable().optional(),
  studentIds: z.array(id).max(500).default([]),
  departmentHeadId: id.nullable().optional(),
  peerIds: z.array(id).max(50).default([]),
  includeSelf: z.boolean().default(true),
});

function parseId(value, label) {
  if (!/^[1-9]\d*$/.test(String(value))) {
    throw httpError(400, `Invalid ${label}.`, 'VALIDATION_ERROR');
  }
  return Number(value);
}

// GET /api/tasks/candidates - active users that can be chosen as evaluators.
router.get('/candidates', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role FROM users
      WHERE status = 'active' AND role IN ('student', 'teacher', 'department_head')
      ORDER BY name`,
  );
  const pick = (role) => rows
    .filter((row) => row.role === role)
    .map((row) => ({ id: Number(row.id), name: row.name, email: row.email }));
  sendData(res, {
    instructors: pick('teacher'),
    students: pick('student'),
    departmentHeads: pick('department_head'),
  });
}));

// GET /api/tasks?cycleId=&page=&limit=
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const values = [];
  let where = '';
  if (req.query.cycleId) {
    where = 'WHERE a.cycle_id = ?';
    values.push(parseId(req.query.cycleId, 'cycleId'));
  }

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM evaluation_assignments a ${where}`, values,
  );
  const [rows] = await pool.query(
    `SELECT a.id, a.cycle_id, cy.title AS cycle_title, f.code AS form_code,
            instructor.name AS instructor_name, evaluator.name AS evaluator_name,
            a.course_title, a.course_code, a.batch, a.semester, a.status,
            e.status AS evaluation_status
       FROM evaluation_assignments a
       JOIN evaluation_cycles cy ON cy.id = a.cycle_id
       JOIN evaluation_forms f ON f.id = a.form_id
       JOIN users instructor ON instructor.id = a.instructor_id
       JOIN users evaluator ON evaluator.id = a.evaluator_id
       LEFT JOIN evaluations e ON e.assignment_id = a.id
       ${where}
      ORDER BY a.created_at DESC, a.id DESC
      LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit],
  );

  sendData(res, {
    total: Number(total),
    page,
    limit,
    tasks: rows.map((row) => ({
      id: Number(row.id),
      cycleId: Number(row.cycle_id),
      cycleTitle: row.cycle_title,
      formCode: row.form_code,
      instructorName: row.instructor_name,
      evaluatorName: row.evaluator_name,
      courseTitle: row.course_title,
      courseCode: row.course_code,
      batch: row.batch,
      semester: row.semester,
      status: row.status,
      evaluationStatus: row.evaluation_status,
    })),
  });
}));

// POST /api/tasks - create the tasks for one instructor and course. Existing tasks are skipped.
router.post('/', asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw httpError(400, `${issue.path.join('.') || 'body'}: ${issue.message}`, 'VALIDATION_ERROR');
  }
  const input = parsed.data;
  const studentIds = [...new Set(input.studentIds)];
  const peerIds = [...new Set(input.peerIds)];

  if (peerIds.includes(input.instructorId)) {
    throw httpError(400, 'The instructor cannot be their own peer evaluator. Use self evaluation.', 'VALIDATION_ERROR');
  }
  if (!studentIds.length && !input.departmentHeadId && !peerIds.length && !input.includeSelf) {
    throw httpError(400, 'Choose at least one evaluator.', 'VALIDATION_ERROR');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [cycles] = await connection.execute(
      'SELECT id, status FROM evaluation_cycles WHERE id = ? FOR UPDATE', [input.cycleId],
    );
    if (!cycles[0]) throw httpError(404, 'Evaluation cycle not found.', 'NOT_FOUND');
    if (cycles[0].status === 'closed') throw httpError(409, 'This cycle is closed.', 'CYCLE_CLOSED');

    // Every (user, role) pair must match an active user. A user may fill only the role they really have.
    const wanted = [
      [input.instructorId, 'teacher'],
      ...studentIds.map((userId) => [userId, 'student']),
      ...peerIds.map((userId) => [userId, 'teacher']),
    ];
    if (input.departmentHeadId) wanted.push([input.departmentHeadId, 'department_head']);
    const userIds = [...new Set(wanted.map(([userId]) => userId))];
    const [users] = await connection.query(
      'SELECT id, role, status FROM users WHERE id IN (?)', [userIds],
    );
    const byId = new Map(users.map((user) => [Number(user.id), user]));
    for (const [userId, role] of wanted) {
      const user = byId.get(userId);
      if (!user || user.status !== 'active' || user.role !== role) {
        throw httpError(400, `User ${userId} must be an active ${role}.`, 'INVALID_EVALUATOR');
      }
    }

    // Each task uses the form version that is published right now.
    const [versions] = await connection.execute(
      `SELECT v.id AS version_id, f.id AS form_id, f.evaluator_type
         FROM form_versions v JOIN evaluation_forms f ON f.id = v.form_id
        WHERE v.status = 'published' AND f.is_active = 1`,
    );
    const formFor = new Map(versions.map((row) => [row.evaluator_type, row]));

    const planned = [
      ...studentIds.map((evaluatorId) => ['student', evaluatorId]),
      ...(input.departmentHeadId ? [['department_head', input.departmentHeadId]] : []),
      ...peerIds.map((evaluatorId) => ['peer', evaluatorId]),
      ...(input.includeSelf ? [['self', input.instructorId]] : []),
    ];
    for (const [type] of planned) {
      if (!formFor.has(type)) throw httpError(409, `No published form exists for ${type} evaluation.`, 'FORM_NOT_PUBLISHED');
    }

    const [existing] = await connection.execute(
      `SELECT form_id, evaluator_id FROM evaluation_assignments
        WHERE cycle_id = ? AND instructor_id = ? AND course_code = ?`,
      [input.cycleId, input.instructorId, input.courseCode],
    );
    const exists = new Set(existing.map((row) => `${row.form_id}:${row.evaluator_id}`));

    let created = 0;
    let skipped = 0;
    for (const [type, evaluatorId] of planned) {
      const form = formFor.get(type);
      if (exists.has(`${form.form_id}:${evaluatorId}`)) { skipped += 1; continue; }
      await connection.execute(
        `INSERT INTO evaluation_assignments
           (cycle_id, form_id, form_version_id, instructor_id, evaluator_id,
            course_title, course_code, batch, semester, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [input.cycleId, form.form_id, form.version_id, input.instructorId, evaluatorId,
          input.courseTitle, input.courseCode, input.batch ?? null, input.semester ?? null],
      );
      created += 1;
    }

    await writeAudit(connection, {
      userId: req.user.id,
      action: 'tasks.created',
      entityType: 'evaluation_cycle',
      entityId: input.cycleId,
      details: { instructorId: input.instructorId, courseCode: input.courseCode, created, skipped },
      ipAddress: req.ip,
    });
    await connection.commit();
    sendData(res, { created, skipped }, 201);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// DELETE /api/tasks/:id - only tasks that nobody has started.
router.delete('/:id', asyncHandler(async (req, res) => {
  const taskId = parseId(req.params.id, 'task ID');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT a.id, a.status, cy.status AS cycle_status,
              (SELECT COUNT(*) FROM evaluations e WHERE e.assignment_id = a.id) AS evaluations
         FROM evaluation_assignments a JOIN evaluation_cycles cy ON cy.id = a.cycle_id
        WHERE a.id = ? FOR UPDATE`,
      [taskId],
    );
    const task = rows[0];
    if (!task) throw httpError(404, 'Task not found.', 'NOT_FOUND');
    if (task.cycle_status === 'closed') throw httpError(409, 'This cycle is closed.', 'CYCLE_CLOSED');
    if (task.status !== 'pending' || Number(task.evaluations) > 0) {
      throw httpError(409, 'Only tasks that have not been started can be removed.', 'TASK_STARTED');
    }
    await connection.execute('DELETE FROM evaluation_assignments WHERE id = ?', [taskId]);
    await writeAudit(connection, {
      userId: req.user.id, action: 'task.deleted', entityType: 'evaluation_assignment',
      entityId: taskId, details: {}, ipAddress: req.ip,
    });
    await connection.commit();
    sendData(res, { deleted: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

export default router;