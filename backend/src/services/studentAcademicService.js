import { z } from 'zod';
import { pool } from '../config/database.js';
import { httpError } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';
import { inTransaction, parseBody } from '../utils/db.js';

const num = (value) => Number(value);

const groupSchema = z.object({
  departmentId: z.number().int().positive(),
  academicYear: z.string().trim().min(4).max(20),
  yearLevel: z.number().int().min(1).max(8),
  sectionCode: z.string().trim().toUpperCase().regex(/^[A-Z]{1,3}$/),
});

const groupPatchSchema = z.object({
  isActive: z.boolean(),
});

export async function listStudentGroups(query = {}) {
  const departmentId = query.departmentId
    ? Number(query.departmentId)
    : null;

  if (
    departmentId !== null &&
    (!Number.isSafeInteger(departmentId) || departmentId < 1)
  ) {
    throw httpError(
      400,
      'Invalid department ID.',
      'VALIDATION_ERROR',
    );
  }

  const clauses = [];
  const params = [];

  if (departmentId) {
    clauses.push('g.department_id = ?');
    params.push(departmentId);
  }

  if (query.active === 'true') {
    clauses.push('g.is_active = 1');
  }

  if (query.active === 'false') {
    clauses.push('g.is_active = 0');
  }

  const where = clauses.length
    ? `WHERE ${clauses.join(' AND ')}`
    : '';

  const [rows] = await pool.execute(
    `SELECT
        g.id,
        g.department_id AS departmentId,
        d.name AS departmentName,
        f.name AS academicUnitName,
        g.academic_year AS academicYear,
        g.year_level AS yearLevel,
        g.section_code AS sectionCode,
        g.is_active AS isActive,
        (
          SELECT COUNT(*)
          FROM student_academic_enrollments e
          WHERE e.academic_group_id = g.id
            AND e.is_current = 1
        ) AS studentCount
     FROM student_academic_groups g
     JOIN departments d ON d.id = g.department_id
     JOIN faculties f ON f.id = d.faculty_id
     ${where}
     ORDER BY
        d.name,
        g.academic_year DESC,
        g.year_level,
        g.section_code`,
    params,
  );

  return rows.map((row) => ({
    ...row,
    id: num(row.id),
    departmentId: num(row.departmentId),
    yearLevel: num(row.yearLevel),
    isActive: Boolean(row.isActive),
    studentCount: num(row.studentCount),
  }));
}

export async function createStudentGroup(user, body, ipAddress) {
  const data = parseBody(
    groupSchema,
    body,
    'Invalid student academic group.',
  );

  return inTransaction(async (connection) => {
    const [[department]] = await connection.execute(
      'SELECT id FROM departments WHERE id = ? FOR SHARE',
      [data.departmentId],
    );

    if (!department) {
      throw httpError(
        404,
        'Department not found.',
        'NOT_FOUND',
      );
    }

    let id;

    try {
      const [result] = await connection.execute(
        `INSERT INTO student_academic_groups
          (
            department_id,
            academic_year,
            year_level,
            section_code,
            created_by
          )
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.departmentId,
          data.academicYear,
          data.yearLevel,
          data.sectionCode,
          num(user.id),
        ],
      );

      id = num(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw httpError(
          409,
          'This department already has that year and section for the selected academic year.',
          'DUPLICATE_STUDENT_GROUP',
        );
      }

      throw error;
    }

    await writeAudit(connection, {
      userId: num(user.id),
      action: 'student_academic_group.created',
      entityType: 'student_academic_group',
      entityId: id,
      details: data,
      ipAddress,
    });

    return {
      id,
      ...data,
      isActive: true,
      studentCount: 0,
    };
  });
}

export async function updateStudentGroup(
  user,
  groupId,
  body,
  ipAddress,
) {
  const data = parseBody(
    groupPatchSchema,
    body,
    'Invalid student academic group update.',
  );

  return inTransaction(async (connection) => {
    const [[group]] = await connection.execute(
      `SELECT id, is_active
       FROM student_academic_groups
       WHERE id = ?
       FOR UPDATE`,
      [groupId],
    );

    if (!group) {
      throw httpError(
        404,
        'Student academic group not found.',
        'NOT_FOUND',
      );
    }

    await connection.execute(
      `UPDATE student_academic_groups
       SET is_active = ?
       WHERE id = ?`,
      [data.isActive ? 1 : 0, groupId],
    );

    await writeAudit(connection, {
      userId: num(user.id),
      action: 'student_academic_group.status_changed',
      entityType: 'student_academic_group',
      entityId: groupId,
      details: {
        previous: Boolean(group.is_active),
        next: data.isActive,
      },
      ipAddress,
    });

    return {
      id: groupId,
      isActive: data.isActive,
    };
  });
}

// Must be called inside the user-creation/update transaction.
export async function setCurrentStudentGroup(
  connection,
  { userId, academicGroupId, changedBy },
) {
  if (!academicGroupId) {
    throw httpError(
      422,
      'Select the student department, academic year, year level, and section.',
      'STUDENT_PLACEMENT_REQUIRED',
    );
  }

  const [[group]] = await connection.execute(
    `SELECT id, department_id
     FROM student_academic_groups
     WHERE id = ? AND is_active = 1
     FOR UPDATE`,
    [academicGroupId],
  );

  if (!group) {
    throw httpError(
      422,
      'The selected student academic group is unavailable.',
      'INVALID_STUDENT_GROUP',
    );
  }

  const [currentRows] = await connection.execute(
    `SELECT id, academic_group_id
     FROM student_academic_enrollments
     WHERE user_id = ? AND is_current = 1
     FOR UPDATE`,
    [userId],
  );

  const current = currentRows[0];

  if (
    current &&
    num(current.academic_group_id) !== num(academicGroupId)
  ) {
    await connection.execute(
      `UPDATE student_academic_enrollments
       SET is_current = 0,
           effective_to = CURRENT_DATE
       WHERE id = ?`,
      [current.id],
    );
  }

  if (
    !current ||
    num(current.academic_group_id) !== num(academicGroupId)
  ) {
    await connection.execute(
      `INSERT INTO student_academic_enrollments
        (
          user_id,
          academic_group_id,
          is_current,
          effective_from,
          changed_by
        )
       VALUES (?, ?, 1, CURRENT_DATE, ?)`,
      [userId, academicGroupId, changedBy],
    );
  }

  await connection.execute(
    `INSERT INTO student_departments
      (user_id, department_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       department_id = VALUES(department_id)`,
    [userId, group.department_id],
  );

  return {
    academicGroupId: num(group.id),
    departmentId: num(group.department_id),
  };
}

export async function clearCurrentStudentGroup(
  connection,
  userId,
) {
  await connection.execute(
    `UPDATE student_academic_enrollments
     SET is_current = 0,
         effective_to = CURRENT_DATE
     WHERE user_id = ? AND is_current = 1`,
    [userId],
  );

  await connection.execute(
    'DELETE FROM student_departments WHERE user_id = ?',
    [userId],
  );
}