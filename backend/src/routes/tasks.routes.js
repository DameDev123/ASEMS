
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { requireAuth, allowRoles } from '../middlewares/auth.js';
import { asyncHandler, httpError, sendData } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

router.use(requireAuth, allowRoles('committee', 'department_head'));

async function scopeFor(db, user) {
  if (user.role === 'admin') return null;

  const [rows] = await db.execute(
    'SELECT department_id FROM employees WHERE user_id = ? LIMIT 1',
    [Number(user.id)]
  );

  const departmentId = rows[0]?.department_id;

  if (!departmentId) {
    throw httpError(
      403,
      'Your account is not assigned to a department.',
      'NO_DEPARTMENT'
    );
  }

  return Number(departmentId);
}

const IN_DEPARTMENT = `
  SELECT user_id FROM employees WHERE department_id = ?
  UNION
  SELECT user_id FROM student_departments WHERE department_id = ?
`;

async function departmentUserIds(db, departmentId) {
  const [rows] = await db.execute(IN_DEPARTMENT, [
    departmentId,
    departmentId
  ]);

  return new Set(rows.map(row => Number(row.user_id)));
}

const id = z.number().int().positive();

const createSchema = z.object({
  cycleId: id,
  instructorId: id,
  assignmentId: id,

  batch: z.enum(['I', 'II', 'III', 'IV', 'V']).nullable().optional(),

  studentIds: z.array(id).max(500).default([]),

  departmentHeadId: id.nullable().optional(),

  peerIds: z.array(id).max(50).default([]),

  includeSelf: z.boolean().default(true),

  evaluationDate: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Use YYYY-MM-DD for evaluationDate'
  ),

  section: z.enum(['I', 'II']),

  collegeName: z.string().trim().min(1).max(255),
  departmentName: z.string().trim().min(1).max(255),
  instructorName: z.string().trim().min(1).max(255),
  courseTitle: z.string().trim().min(1).max(255),
  courseCode: z.string().trim().min(1).max(100),
  academicYear: z.string().trim().min(1).max(30),
  semester: z.string().trim().min(1).max(30),
});

function toTaskSemester(value) {
  const text = String(value ?? '').trim().toUpperCase();

  if (/(^|[^A-Z0-9])(2|II|TWO|SECOND)([^A-Z0-9]|$)/.test(text)) {
    return 'II';
  }

  if (/(^|[^A-Z0-9])(1|I|ONE|FIRST)([^A-Z0-9]|$)/.test(text)) {
    return 'I';
  }

  return null;
}

function sameYear(a, b) {
  const clean = value =>
    String(value ?? '').trim().toLowerCase();

  return clean(a) === clean(b);
}

function parseId(value, label) {
  if (!/^[1-9]\d*$/.test(String(value))) {
    throw httpError(
      400,
      `Invalid ${label}.`,
      'VALIDATION_ERROR'
    );
  }

  return Number(value);
}

// =====================================================
// GET /api/tasks/candidates
// Load instructors, students, department heads and
// instructor college/department/course information.
// =====================================================

router.get('/candidates', asyncHandler(async (req, res) => {
  const departmentId = await scopeFor(pool, req.user);

  const limit = departmentId === null
    ? ''
    : `AND u.id IN (${IN_DEPARTMENT})`;

  const [rows] = await pool.execute(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.role,

       (
         SELECT e.department_id
         FROM employees e
         WHERE e.user_id = u.id
         LIMIT 1
       ) AS department_id,

       (
         SELECT d.name
         FROM employees e
         JOIN departments d ON d.id = e.department_id
         WHERE e.user_id = u.id
         LIMIT 1
       ) AS department_name,

       (
         SELECT f.name
         FROM employees e
         JOIN departments d ON d.id = e.department_id
         JOIN faculties f ON f.id = d.faculty_id
         WHERE e.user_id = u.id
         LIMIT 1
       ) AS faculty_name

     FROM users u

     WHERE u.status = 'active'
       AND u.role IN (
         'student',
         'teacher',
         'department_head'
       )
       ${limit}

     ORDER BY u.name`,
    departmentId === null
      ? []
      : [departmentId, departmentId]
  );

  const pick = role => rows
    .filter(row => row.role === role)
    .map(row => ({
      id: Number(row.id),
      name: row.name,
      email: row.email,

      departmentId:
        row.department_id == null
          ? null
          : Number(row.department_id),

      departmentName: row.department_name ?? '',
      facultyName: row.faculty_name ?? ''
    }));

  const instructors = pick('teacher');

  const byInstructor = new Map();

  if (instructors.length) {
    const [assignments] = await pool.query(
      `SELECT
         ci.id,
         ci.instructor_id,
         ci.academic_year,
         ci.semester,
         c.title,
         c.course_code

       FROM course_instructors ci

       JOIN courses c
         ON c.id = ci.course_id

       WHERE c.active = 1
         AND ci.instructor_id IN (?)

       ORDER BY
         c.title,
         ci.academic_year DESC,
         ci.id`,
      [instructors.map(person => person.id)]
    );

    for (const row of assignments) {
      const instructorId = Number(row.instructor_id);

      const list = byInstructor.get(instructorId) ?? [];

      list.push({
        id: Number(row.id),
        courseCode: row.course_code,
        courseTitle: row.title,
        academicYear: row.academic_year,
        semester: toTaskSemester(row.semester)
      });

      byInstructor.set(instructorId, list);
    }
  }

  sendData(res, {
    instructors: instructors.map(person => ({
      ...person,
      assignments: byInstructor.get(person.id) ?? []
    })),

    students: pick('student'),

    departmentHeads: pick('department_head')
  });
}));

// =====================================================
// GET /api/tasks
// List tasks.
// =====================================================

router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(
    1,
    Number.parseInt(req.query.page, 10) || 1
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(req.query.limit, 10) || 25
    )
  );

  const departmentId = await scopeFor(pool, req.user);

  const values = [];
  const conditions = [];

  if (req.query.cycleId) {
    conditions.push('a.cycle_id = ?');

    values.push(
      parseId(req.query.cycleId, 'cycleId')
    );
  }

  if (departmentId !== null) {
    conditions.push(`
      a.instructor_id IN (
        SELECT user_id
        FROM employees
        WHERE department_id = ?
      )
    `);

    values.push(departmentId);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM evaluation_assignments a
     ${where}`,
    values
  );

  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.cycle_id,
       cy.title AS cycle_title,

       f.code AS form_code,

       instructor.name AS instructor_name,
       evaluator.name AS evaluator_name,

       a.course_title,
       a.course_code,
       a.batch,
       a.semester,
       a.status,

       a.evaluation_date,
       a.section,
       a.college_name,
       a.department_name,
       a.instructor_name AS instructor_name_snapshot,
       a.academic_year,

       e.status AS evaluation_status

     FROM evaluation_assignments a

     JOIN evaluation_cycles cy
       ON cy.id = a.cycle_id

     JOIN evaluation_forms f
       ON f.id = a.form_id

     JOIN users instructor
       ON instructor.id = a.instructor_id

     JOIN users evaluator
       ON evaluator.id = a.evaluator_id

     LEFT JOIN evaluations e
       ON e.assignment_id = a.id

     ${where}

     ORDER BY a.created_at DESC, a.id DESC

     LIMIT ? OFFSET ?`,
    [...values, limit, (page - 1) * limit]
  );

  sendData(res, {
    total: Number(total),
    page,
    limit,

    tasks: rows.map(row => ({
      id: Number(row.id),

      cycleId: Number(row.cycle_id),
      cycleTitle: row.cycle_title,

      formCode: row.form_code,

      instructorName: row.instructor_name,
      instructorNameSnapshot: row.instructor_name_snapshot,

      evaluatorName: row.evaluator_name,

      courseTitle: row.course_title,
      courseCode: row.course_code,

      batch: row.batch,
      semester: row.semester,

      evaluationDate: row.evaluation_date,
      section: row.section,

      collegeName: row.college_name,
      departmentName: row.department_name,
      academicYear: row.academic_year,

      status: row.status,
      evaluationStatus: row.evaluation_status
    }))
  });
}));

// =====================================================
// POST /api/tasks
// Create tasks for all four evaluator types.
// =====================================================

router.post('/', asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body ?? {});

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    throw httpError(
      400,
      `${issue.path.join('.') || 'body'}: ${issue.message}`,
      'VALIDATION_ERROR'
    );
  }

  const input = parsed.data;

  const studentIds = [...new Set(input.studentIds)];
  const peerIds = [...new Set(input.peerIds)];

  if (peerIds.includes(input.instructorId)) {
    throw httpError(
      400,
      'The instructor cannot be their own peer evaluator.',
      'VALIDATION_ERROR'
    );
  }

  if (
    input.departmentHeadId &&
    Number(input.departmentHeadId) === Number(input.instructorId)
  ) {
    throw httpError(
      400,
      'The instructor cannot be their own Department Head evaluator.',
      'VALIDATION_ERROR'
    );
  }

  if (
    !studentIds.length &&
    !input.departmentHeadId &&
    !peerIds.length &&
    !input.includeSelf
  ) {
    throw httpError(
      400,
      'Choose at least one evaluator.',
      'VALIDATION_ERROR'
    );
  }

  const departmentId = await scopeFor(pool, req.user);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verify cycle.

    const [cycles] = await connection.execute(
      `SELECT *
       FROM evaluation_cycles
       WHERE id = ?
       FOR UPDATE`,
      [input.cycleId]
    );

    if (!cycles[0]) {
      throw httpError(
        404,
        'Evaluation cycle not found.',
        'NOT_FOUND'
      );
    }

    if (cycles[0].status === 'closed') {
      throw httpError(
        409,
        'This cycle is closed.',
        'CYCLE_CLOSED'
      );
    }

    // Verify instructor's assigned course.

    const [assignmentRows] = await connection.execute(
      `SELECT
         ci.id,
         ci.semester,
         ci.academic_year,
         c.title,
         c.course_code,
         c.active

       FROM course_instructors ci

       JOIN courses c
         ON c.id = ci.course_id

       WHERE ci.id = ?
         AND ci.instructor_id = ?`,
      [input.assignmentId, input.instructorId]
    );

    const courseAssignment = assignmentRows[0];

    if (!courseAssignment) {
      throw httpError(
        400,
        'This instructor has no such course assignment.',
        'NO_COURSE_ASSIGNMENT'
      );
    }

    if (!Number(courseAssignment.active)) {
      throw httpError(
        409,
        'This course is not active.',
        'COURSE_INACTIVE'
      );
    }

    const cycleYear =
      cycles[0].academic_year ??
      cycles[0].academicYear;

    if (
      String(cycleYear ?? '').trim() &&
      String(courseAssignment.academic_year ?? '').trim() &&
      !sameYear(cycleYear, courseAssignment.academic_year)
    ) {
      throw httpError(
        409,
        'The course academic year does not match the evaluation cycle.',
        'ACADEMIC_YEAR_MISMATCH'
      );
    }

    // Verify all evaluator roles.

    const wanted = [
      [input.instructorId, 'teacher'],

      ...studentIds.map(userId => [
        userId,
        'student'
      ]),

      ...peerIds.map(userId => [
        userId,
        'teacher'
      ])
    ];

    if (input.departmentHeadId) {
      wanted.push([
        input.departmentHeadId,
        'department_head'
      ]);
    }

    const userIds = [
      ...new Set(wanted.map(([userId]) => userId))
    ];

    if (departmentId !== null) {
      const allowed = await departmentUserIds(
        connection,
        departmentId
      );

      if (userIds.some(userId => !allowed.has(userId))) {
        throw httpError(
          403,
          'Every instructor and evaluator must belong to your department.',
          'OUTSIDE_DEPARTMENT'
        );
      }
    }

    const [users] = await connection.query(
      `SELECT id, role, status
       FROM users
       WHERE id IN (?)`,
      [userIds]
    );

    const byId = new Map(
      users.map(user => [Number(user.id), user])
    );

    for (const [userId, role] of wanted) {
      const user = byId.get(userId);

      if (
        !user ||
        user.status !== 'active' ||
        user.role !== role
      ) {
        throw httpError(
          400,
          `User ${userId} must be an active ${role}.`,
          'INVALID_EVALUATOR'
        );
      }
    }

    // Department Head must belong to the instructor's department.

    if (input.departmentHeadId) {
      const [sameDepartment] = await connection.execute(
        `SELECT 1

         FROM employees head

         JOIN employees instructor
           ON instructor.department_id = head.department_id

         WHERE head.user_id = ?
           AND instructor.user_id = ?
           AND head.department_id IS NOT NULL

         LIMIT 1`,
        [
          input.departmentHeadId,
          input.instructorId
        ]
      );

      if (!sameDepartment.length) {
        throw httpError(
          400,
          'The Department Head must belong to the instructor department.',
          'HEAD_DEPARTMENT_MISMATCH'
        );
      }
    }

    // Load published forms for all evaluator types.

    const [versions] = await connection.execute(
      `SELECT
         v.id AS version_id,
         f.id AS form_id,
         f.evaluator_type

       FROM form_versions v

       JOIN evaluation_forms f
         ON f.id = v.form_id

       WHERE v.status = 'published'
         AND f.is_active = 1`
    );

    const formFor = new Map(
      versions.map(row => [
        row.evaluator_type,
        row
      ])
    );

    // Create one task per selected evaluator.

    const planned = [
      ...studentIds.map(evaluatorId => [
        'student',
        evaluatorId
      ]),

      ...(input.departmentHeadId
        ? [[
            'department_head',
            input.departmentHeadId
          ]]
        : []),

      ...peerIds.map(evaluatorId => [
        'peer',
        evaluatorId
      ]),

      ...(input.includeSelf
        ? [[
            'self',
            input.instructorId
          ]]
        : [])
    ];

    for (const [type] of planned) {
      if (!formFor.has(type)) {
        throw httpError(
          409,
          `No published form exists for ${type} evaluation.`,
          'FORM_NOT_PUBLISHED'
        );
      }
    }

    // Check duplicates.

    const [existing] = await connection.execute(
      `SELECT form_id, evaluator_id

       FROM evaluation_assignments

       WHERE cycle_id = ?
         AND instructor_id = ?
         AND course_code = ?
         AND course_title = ?`,
      [
        input.cycleId,
        input.instructorId,
        input.courseCode,
        input.courseTitle
      ]
    );

    const exists = new Set(
      existing.map(row =>
        `${row.form_id}:${row.evaluator_id}`
      )
    );

    let created = 0;
    let skipped = 0;

    // Save each evaluator task with the same permanent
    // instructor/course/date/section information.

    for (const [type, evaluatorId] of planned) {
      const form = formFor.get(type);

      if (exists.has(`${form.form_id}:${evaluatorId}`)) {
        skipped += 1;
        continue;
      }

      await connection.execute(
        `INSERT INTO evaluation_assignments (
           cycle_id,
           form_id,
           form_version_id,
           instructor_id,
           evaluator_id,

           course_title,
           course_code,
           batch,
           semester,

           evaluation_date,
           section,
           college_name,
           department_name,
           instructor_name,
           academic_year,

           status
         )

         VALUES (
           ?, ?, ?, ?, ?,
           ?, ?, ?, ?,
           ?, ?, ?, ?, ?, ?,
           'pending'
         )`,
        [
          input.cycleId,
          form.form_id,
          form.version_id,
          input.instructorId,
          evaluatorId,

          input.courseTitle,
          input.courseCode,
          input.batch ?? null,
          input.semester,

          input.evaluationDate,
          input.section,
          input.collegeName,
          input.departmentName,
          input.instructorName,
          input.academicYear
        ]
      );

      created += 1;
    }

    await writeAudit(connection, {
      userId: req.user.id,
      action: 'tasks.created',
      entityType: 'evaluation_cycle',
      entityId: input.cycleId,

      details: {
        instructorId: input.instructorId,
        assignmentId: input.assignmentId,
        courseCode: input.courseCode,
        created,
        skipped,
        departmentId
      },

      ipAddress: req.ip
    });

    await connection.commit();

    sendData(
      res,
      {
        created,
        skipped,
        message: 'Evaluation tasks created successfully.'
      },
      201
    );

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
}));

// =====================================================
// DELETE /api/tasks/:id
// Remove one unstarted task.
// =====================================================

router.delete('/:id', asyncHandler(async (req, res) => {
  const taskId = parseId(req.params.id, 'task ID');

  const departmentId = await scopeFor(pool, req.user);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT
         a.id,
         a.instructor_id,
         a.status,
         cy.status AS cycle_status,

         (
           SELECT COUNT(*)
           FROM evaluations e
           WHERE e.assignment_id = a.id
         ) AS evaluations

       FROM evaluation_assignments a

       JOIN evaluation_cycles cy
         ON cy.id = a.cycle_id

       WHERE a.id = ?
       FOR UPDATE`,
      [taskId]
    );

    const task = rows[0];

    if (!task) {
      throw httpError(
        404,
        'Task not found.',
        'NOT_FOUND'
      );
    }

    if (departmentId !== null) {
      const allowed = await departmentUserIds(
        connection,
        departmentId
      );

      if (!allowed.has(Number(task.instructor_id))) {
        throw httpError(
          404,
          'Task not found.',
          'NOT_FOUND'
        );
      }
    }

    if (task.cycle_status === 'closed') {
      throw httpError(
        409,
        'This evaluation cycle is closed.',
        'CYCLE_CLOSED'
      );
    }

    if (
      task.status !== 'pending' ||
      Number(task.evaluations) > 0
    ) {
      throw httpError(
        409,
        'Only tasks that have not been started can be removed.',
        'TASK_STARTED'
      );
    }

    await connection.execute(
      'DELETE FROM evaluation_assignments WHERE id = ?',
      [taskId]
    );

    await writeAudit(connection, {
      userId: req.user.id,
      action: 'task.deleted',
      entityType: 'evaluation_assignment',
      entityId: taskId,
      details: {},
      ipAddress: req.ip
    });

    await connection.commit();

    sendData(res, {
      deleted: true,
      message: 'Task deleted successfully.'
    });

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
}));

export default router;
