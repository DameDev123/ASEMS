import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { writeAudit } from '../utils/audit.js';
import {
  generateInitialPassword,
  studentEmailFor,
} from '../utils/credentials.js';
import {
  MAX_IMPORT_ROWS,
  validateInstructorRows,
  validateStudentRows,
} from '../utils/importValidation.js';

const STUDENT_BCRYPT_COST = 10;
const INSTRUCTOR_BCRYPT_COST = 12;
const HASH_CHUNK = 8;

function fail(message, statusCode = 400, code = 'VALIDATION_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

function requireRows(body) {
  if (!Array.isArray(body?.rows) || body.rows.length === 0) {
    fail('Provide a non-empty "rows" array.');
  }

  if (body.rows.length > MAX_IMPORT_ROWS) {
    fail(`Too many rows. Import at most ${MAX_IMPORT_ROWS} rows at a time.`);
  }
}

async function requireDepartment(departmentId) {
  if (!/^[1-9]\d*$/.test(String(departmentId ?? ''))) {
    fail('A valid departmentId is required.', 400, 'INVALID_DEPARTMENT');
  }

  const [rows] = await pool.execute(
    'SELECT id, name FROM departments WHERE id = ?',
    [departmentId],
  );

  if (!rows[0]) {
    fail('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');
  }

  return rows[0];
}

async function hashAll(items, makePassword, cost) {
  const results = new Array(items.length);

  for (let start = 0; start < items.length; start += HASH_CHUNK) {
    const slice = items.slice(start, start + HASH_CHUNK);

    await Promise.all(
      slice.map(async (_, offset) => {
        const password = makePassword();

        results[start + offset] = {
          password,
          hash: await bcrypt.hash(password, cost),
        };
      }),
    );
  }

  return results;
}

async function ensureSection(connection, cache, departmentId, row) {
  const key = `${row.academicYear}|${row.yearLevel}|${row.section}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const [result] = await connection.execute(
    `INSERT INTO sections
       (department_id, academic_year, year_level, section_name)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
    [
      departmentId,
      row.academicYear,
      row.yearLevel,
      row.section,
    ],
  );

  cache.set(key, result.insertId);

  return result.insertId;
}

export async function importStudents(body, req) {
  requireRows(body);

  const department = await requireDepartment(body.departmentId);
  const dryRun = body.dryRun === true;

  const { valid, errors } = validateStudentRows(
    body.rows,
    body.defaults || {},
  );

  const skipped = [];
  let toCreate = valid;

  if (valid.length) {
    const usernames = valid.map((row) => row.username);
    const emails = valid.map((row) => studentEmailFor(row.username));

    const [existing] = await pool.query(
      `SELECT username, email, id_number, role
         FROM users
        WHERE username IN (?)
           OR email IN (?)
           OR (role = 'student' AND id_number IN (?))`,
      [usernames, emails, usernames],
    );

    const taken = new Set();

    for (const user of existing) {
      if (user.username) {
        taken.add(String(user.username).toLowerCase());
      }

      if (user.email) {
        taken.add(String(user.email).toLowerCase());
      }

      if (user.role === 'student' && user.id_number) {
        taken.add(String(user.id_number).toLowerCase());
      }
    }

    toCreate = [];

    for (const row of valid) {
      const isTaken =
        taken.has(row.username.toLowerCase()) ||
        taken.has(studentEmailFor(row.username).toLowerCase());

      if (isTaken) {
        skipped.push({
          rowNumber: row.rowNumber,
          studentId: row.studentId,
          name: row.name,
          reason: 'Already registered. Existing account left unchanged.',
        });
      } else {
        toCreate.push(row);
      }
    }
  }

  const summary = {
    total: body.rows.length,
    toCreate: toCreate.length,
    skipped: skipped.length,
    errors: errors.length,
  };

  if (dryRun) {
    return {
      dryRun: true,
      department,
      summary,

      preview: toCreate.map((row) => ({
        rowNumber: row.rowNumber,
        studentId: row.studentId,
        name: row.name,
        academicYear: row.academicYear,
        yearLevel: row.yearLevel,
        section: row.section,
      })),

      skipped,
      errors,
    };
  }

  if (toCreate.length === 0) {
    return {
      dryRun: false,
      department,
      summary: {
        ...summary,
        created: 0,
      },
      created: [],
      skipped,
      errors,
    };
  }

  const credentials = await hashAll(
    toCreate,
    () => generateInitialPassword(),
    STUDENT_BCRYPT_COST,
  );

  const connection = await pool.getConnection();
  const created = [];

  try {
    await connection.beginTransaction();

    const sectionCache = new Map();

    for (let i = 0; i < toCreate.length; i += 1) {
      const row = toCreate[i];
      const { password, hash } = credentials[i];

      const sectionId = await ensureSection(
        connection,
        sectionCache,
        department.id,
        row,
      );

      const [result] = await connection.execute(
        `INSERT INTO users
           (name, email, username, password, role, status, phone, gender,
            id_number, credentials_issued_at)
         VALUES (?, ?, ?, ?, 'student', 'active', ?, ?, ?, NOW())`,
        [
          row.name,
          studentEmailFor(row.username),
          row.username,
          hash,
          row.phone,
          row.gender,
          row.studentId,
        ],
      );

      await connection.execute(
        `INSERT INTO student_departments
           (user_id, department_id)
         VALUES (?, ?)`,
        [
          result.insertId,
          department.id,
        ],
      );

      await connection.execute(
        `INSERT INTO student_profiles
           (user_id, section_id)
         VALUES (?, ?)`,
        [
          result.insertId,
          sectionId,
        ],
      );

      created.push({
        userId: result.insertId,
        rowNumber: row.rowNumber,
        studentId: row.studentId,
        name: row.name,
        academicYear: row.academicYear,
        yearLevel: row.yearLevel,
        section: row.section,
        username: row.username,
        initialPassword: password,
      });
    }

    // Never write passwords to the audit log.
    await writeAudit(connection, {
      userId: req.user.id,
      action: 'students.bulk_imported',
      entityType: 'user',
      entityId: null,
      details: {
        departmentId: department.id,
        ...summary,
        created: created.length,
      },
      ipAddress: req.ip,
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      fail(
        'Another account with one of these IDs was created at the same time. Nothing was imported; retry.',
        409,
        'DUPLICATE_USER',
      );
    }

    throw error;
  } finally {
    connection.release();
  }

  return {
    dryRun: false,
    department,
    summary: {
      ...summary,
      created: created.length,
    },
    created,
    skipped,
    errors,
  };
}

export async function importInstructors(body, req) {
  requireRows(body);

  const department = await requireDepartment(body.departmentId);
  const dryRun = body.dryRun === true;

  const { valid, errors } = validateInstructorRows(body.rows);

  const skipped = [];
  let toCreate = valid;

  if (valid.length) {
    const [existing] = await pool.query(
      'SELECT email FROM users WHERE email IN (?)',
      [valid.map((row) => row.email)],
    );

    const taken = new Set(
      existing.map((user) =>
        String(user.email).toLowerCase(),
      ),
    );

    toCreate = [];

    for (const row of valid) {
      if (taken.has(row.email)) {
        skipped.push({
          rowNumber: row.rowNumber,
          email: row.email,
          name: row.name,
          reason:
            'Email already registered. Existing account left unchanged.',
        });
      } else {
        toCreate.push(row);
      }
    }
  }

  const summary = {
    total: body.rows.length,
    toCreate: toCreate.length,
    skipped: skipped.length,
    errors: errors.length,
  };

  if (dryRun) {
    return {
      dryRun: true,
      department,
      summary,

      preview: toCreate.map((row) => ({
        rowNumber: row.rowNumber,
        name: row.name,
        email: row.email,
        jobTitle: row.jobTitle,
        teachingStartYear: row.teachingStartYear,
      })),

      skipped,
      errors,
    };
  }

  if (toCreate.length === 0) {
    return {
      dryRun: false,
      department,
      summary: {
        ...summary,
        created: 0,
      },
      created: [],
      skipped,
      errors,
    };
  }

  const credentials = await hashAll(
    toCreate,
    () => generateInitialPassword(),
    INSTRUCTOR_BCRYPT_COST,
  );

  const connection = await pool.getConnection();
  const created = [];

  try {
    await connection.beginTransaction();

    for (let i = 0; i < toCreate.length; i += 1) {
      const row = toCreate[i];
      const { password, hash } = credentials[i];

      const [result] = await connection.execute(
        `INSERT INTO users
           (name, email, password, role, status, phone, gender, id_number,
            credentials_issued_at)
         VALUES (?, ?, ?, 'teacher', 'active', ?, ?, ?, NOW())`,
        [
          row.name,
          row.email,
          hash,
          row.phone,
          row.gender,
          row.idNumber,
        ],
      );

      await connection.execute(
        `INSERT INTO employees
           (user_id, department_id, employee_type, job_title, teaching_start_year)
         VALUES (?, ?, 'academic', ?, ?)`,
        [
          result.insertId,
          department.id,
          row.jobTitle,
          row.teachingStartYear,
        ],
      );

      created.push({
        userId: result.insertId,
        rowNumber: row.rowNumber,
        name: row.name,
        email: row.email,
        initialPassword: password,
      });
    }

    await writeAudit(connection, {
      userId: req.user.id,
      action: 'instructors.bulk_imported',
      entityType: 'user',
      entityId: null,
      details: {
        departmentId: department.id,
        ...summary,
        created: created.length,
      },
      ipAddress: req.ip,
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      fail(
        'Another account with one of these emails was created at the same time. Nothing was imported; retry.',
        409,
        'DUPLICATE_USER',
      );
    }

    throw error;
  } finally {
    connection.release();
  }

  return {
    dryRun: false,
    department,
    summary: {
      ...summary,
      created: created.length,
    },
    created,
    skipped,
    errors,
  };
}