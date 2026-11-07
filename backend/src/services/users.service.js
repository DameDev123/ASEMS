import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { writeAudit } from '../utils/audit.js';
import { generateInitialPassword } from '../utils/credentials.js';

const ROLES = [
  'admin',
  'super_admin',
  'academic_admin',
  'administrative_admin',
  'student',
  'teacher',
  'department_head',
  'dean',
  'committee',
  'management',
  'academic_vp',
  'archives',
  'concerned_office',
];
const STATUSES = ['active', 'inactive', 'suspended'];

const BCRYPT_COST = 12;

const EMPLOYEE_TYPES = ['academic', 'administrative'];

// Account columns plus the staff record (if any). The LEFT JOIN keeps students and
// other accounts without an employees row in the result.
const userSelect = `
  SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.gender,
         u.id_number, u.profile_photo,
         u.created_at, u.updated_at,
         e.employee_type, e.department_id, e.job_title
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id
`;

const userSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  role: z.enum(ROLES),
  phone: z.string().trim().max(20).nullable().optional(),
  gender: z.enum(['male', 'female']).nullable().optional(),
  id_number: z.string().trim().max(40).nullable().optional(),
  profile_photo: z.string().trim().max(255).nullable().optional(),
  // Staff record. employeeType 'administrative' makes the person available in the
  // Administrative Staff Evaluation assignments; leave empty for non-staff accounts.
  employeeType: z.enum(EMPLOYEE_TYPES).nullable().optional(),
  departmentId: z.number().int().positive().nullable().optional(),
  jobTitle: z.string().trim().max(150).nullable().optional(),
});

function fail(message, statusCode = 400, code = 'VALIDATION_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    gender: user.gender,
    idNumber: user.id_number,
    profilePhoto: user.profile_photo,
    employeeType: user.employee_type ?? null,
    departmentId: user.department_id ?? null,
    jobTitle: user.job_title ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

// The form sends '' for empty staff fields and the department id as a string.
function normalizeStaffInput(input = {}) {
  const out = { ...input };

  for (const key of ['employeeType', 'departmentId', 'jobTitle']) {
    if (out[key] === '') out[key] = null;
  }

  if (typeof out.departmentId === 'string') {
    out.departmentId = Number(out.departmentId);
  }

  return out;
}

function parseUser(input) {
  const result = userSchema.safeParse(normalizeStaffInput(input));

  if (!result.success) {
    fail(result.error.issues[0]?.message || 'Invalid user data.');
  }

  return {
    ...result.data,
    email: result.data.email.toLowerCase(),
  };
}

function nullableFields(data) {
  for (const field of [
    'phone',
    'gender',
    'id_number',
    'profile_photo',
  ]) {
    if (data[field] === '') data[field] = null;
  }

  return data;
}

function isDuplicateEmail(error) {
  return error.code === 'ER_DUP_ENTRY';
}

function validateId(id) {
  if (!/^[1-9]\d*$/.test(String(id))) {
    fail('Invalid user ID.', 400, 'INVALID_USER_ID');
  }
}

async function audit(connection, req, action, userId, details = {}) {
  await writeAudit(connection, {
    userId: req.user.id,
    action,
    entityType: 'user',
    entityId: userId,
    details,
    ipAddress: req.ip,
  });
}

// Creates or updates the staff (employees) record of an account. Fields left out of the
// request keep their stored value. Passing no employeeType never deletes an existing record.
async function saveStaffRecord(connection, userId, role, data) {
  if (!data.employeeType) return null;

  if (role === 'student') {
    fail(
      'A student account cannot have a staff type. Choose "Not a staff member".',
      400,
      'STUDENT_NOT_STAFF',
    );
  }

  const [existingRows] = await connection.execute(
    'SELECT department_id, job_title FROM employees WHERE user_id = ? FOR UPDATE',
    [userId],
  );

  const existing = existingRows[0];
  const departmentId = data.departmentId !== undefined
    ? data.departmentId
    : existing?.department_id ?? null;
  const jobTitle = data.jobTitle !== undefined
    ? data.jobTitle
    : existing?.job_title ?? null;

  if (departmentId) {
    const [departments] = await connection.execute(
      'SELECT id FROM departments WHERE id = ?',
      [departmentId],
    );

    if (!departments[0]) fail('Department not found.', 404, 'DEPARTMENT_NOT_FOUND');
  }

  await connection.execute(
    `INSERT INTO employees (user_id, department_id, employee_type, job_title)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       department_id = VALUES(department_id),
       employee_type = VALUES(employee_type),
       job_title = VALUES(job_title)`,
    [userId, departmentId, data.employeeType, jobTitle],
  );

  return { employeeType: data.employeeType, departmentId, jobTitle };
}

export async function listUsers(query, req) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 10),
  );
  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    fail('Invalid pagination parameters.');
  }

  const search = String(query.search || '').trim().slice(0, 255);
  const role = query.role || '';
  const status = query.status || '';

  if (role && !ROLES.includes(role)) fail('Invalid role filter.');
  if (status && !STATUSES.includes(status)) fail('Invalid status filter.');

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.id_number LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }

  if (status) {
    conditions.push('u.status = ?');
    params.push(status);
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users u ${where}`,
    params,
  );

  const [rows] = await pool.execute(
    `${userSelect}
      ${where}
      ORDER BY u.created_at DESC, u.id DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return {
    users: rows.map(publicUser),
    pagination: {
      page,
      limit,
      total: Number(countRows[0].total),
      totalPages: Math.ceil(Number(countRows[0].total) / limit),
    },
  };
}

export async function createUser(input, req) {
  const data = nullableFields(parseUser(input));

  // The administrator never supplies a password. It is generated here, on the server,
  // returned once in the create response, and only its bcrypt hash is stored.
  // 4-6 characters, see utils/credentials.js.
  const initialPassword = generateInitialPassword();
  const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_COST);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO users
        (name, email, password, role, status, phone, gender,
         id_number, profile_photo, credentials_issued_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, NOW())`,
      [
        data.name,
        data.email,
        passwordHash,
        data.role,
        data.phone ?? null,
        data.gender ?? null,
        data.id_number ?? null,
        data.profile_photo ?? null,
      ],
    );

    const staff = await saveStaffRecord(
      connection,
      result.insertId,
      data.role,
      data,
    );

    // Never write the password (or its hash) to the audit log.
    await audit(connection, req, 'user.created', result.insertId, {
      role: data.role,
      employeeType: staff?.employeeType ?? null,
      passwordGenerated: true,
    });

    const [rows] = await connection.execute(
      `${userSelect} WHERE u.id = ?`,
      [result.insertId],
    );

    await connection.commit();

    return { user: publicUser(rows[0]), initialPassword };
  } catch (error) {
    await connection.rollback();

    if (isDuplicateEmail(error)) {
      fail('A user with this email or ID number already exists.', 409, 'DUPLICATE_USER');
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function updateUser(id, input, req) {
  validateId(id);

  const data = nullableFields(parseUser(input));
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `SELECT id, role, status FROM users WHERE id = ? FOR UPDATE`,
      [id],
    );

    const existing = existingRows[0];
    if (!existing) fail('User not found.', 404, 'USER_NOT_FOUND');

    if (
  ['admin', 'super_admin'].includes(existing.role) &&
  existing.status === 'active' &&
  data.role !== existing.role
) {
  const [admins] = await connection.execute(
    `SELECT id
       FROM users
      WHERE role = ?
        AND status = 'active'
      FOR UPDATE`,
    [existing.role],
  );

  if (admins.length <= 1) {
    fail(
      `Cannot demote the last active ${existing.role.replaceAll('_', ' ')}.`,
      409,
      'LAST_ADMIN',
    );
  }
}



    await connection.execute(
      `UPDATE users
          SET name = ?, email = ?, role = ?, phone = ?, gender = ?,
              id_number = ?, profile_photo = ?
        WHERE id = ?`,
      [
        data.name,
        data.email,
        data.role,
        data.phone ?? null,
        data.gender ?? null,
        data.id_number ?? null,
        data.profile_photo ?? null,
        id,
      ],
    );

    const staff = await saveStaffRecord(connection, id, data.role, data);

    await audit(connection, req, 'user.updated', id, {
      previousRole: existing.role,
      newRole: data.role,
      employeeType: staff?.employeeType ?? null,
    });

    const [rows] = await connection.execute(
      `${userSelect} WHERE u.id = ?`,
      [id],
    );

    await connection.commit();

    return publicUser(rows[0]);
  } catch (error) {
    await connection.rollback();

    if (isDuplicateEmail(error)) {
      fail('A user with this email or ID number already exists.', 409, 'DUPLICATE_USER');
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function changeUserStatus(id, status, req) {
  validateId(id);

  if (!STATUSES.includes(status)) fail('Invalid account status.');

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id, role, status FROM users WHERE id = ? FOR UPDATE`,
      [id],
    );

    const user = rows[0];
    if (!user) fail('User not found.', 404, 'USER_NOT_FOUND');

    if (Number(user.id) === Number(req.user.id) && status !== 'active') {
      fail('You cannot deactivate or suspend your own account.', 409, 'SELF_DEACTIVATION');
    }

    if (
  ['admin', 'super_admin'].includes(user.role) &&
  user.status === 'active' &&
  status !== 'active'
) {
  const [admins] = await connection.execute(
    `SELECT id
       FROM users
      WHERE role = ?
        AND status = 'active'
      FOR UPDATE`,
    [user.role],
  );

  if (admins.length <= 1) {
    fail(
      `Cannot deactivate the last active ${user.role.replaceAll('_', ' ')}.`,
      409,
      'LAST_ADMIN',
    );
  }
}

    await connection.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id],
    );

    await audit(connection, req, 'user.status_changed', id, {
      previousStatus: user.status,
      newStatus: status,
    });

    await connection.commit();

    return { id: user.id, status };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}