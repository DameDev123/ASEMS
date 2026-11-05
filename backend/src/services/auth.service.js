import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { writeAudit } from '../utils/audit.js';
import { LOCK_MINUTES, MAX_FAILED_LOGINS } from '../utils/passwordPolicy.js';

const loginSchema = z.object({
  // Despite its name, this field carries an email address OR a username (student ID).
  email: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(128),
  selectedRole: z
    .enum([
      'admin',
      'student',
      'teacher',
      'department_head',
      'dean',
      'committee',
      'management',
      'academic_vp',
      'archives',
      'concerned_office',
    ])
    .optional(),
});

const publicFields = `
  id, name, email, role, status, phone, gender,
  date_of_birth, address, id_number, profile_photo,
  created_at, updated_at
`;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone ?? null,
    gender: user.gender ?? null,
    dateOfBirth: user.date_of_birth ?? null,
    address: user.address ?? null,
    idNumber: user.id_number ?? null,
    profilePhoto: user.profile_photo ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function fail(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

// Counts a wrong password and locks the account after MAX_FAILED_LOGINS in a row.
// MySQL evaluates the SET list left to right, so locked_until must be assigned BEFORE
// failed_login_attempts is changed (it reads the old counter).
async function registerFailedLogin(userId) {
  await pool.execute(
    `UPDATE users
        SET locked_until = IF(failed_login_attempts + 1 >= ?, NOW() + INTERVAL ? MINUTE, locked_until),
            failed_login_attempts = IF(failed_login_attempts + 1 >= ?, 0, failed_login_attempts + 1)
      WHERE id = ?`,
    [MAX_FAILED_LOGINS, LOCK_MINUTES, MAX_FAILED_LOGINS, userId],
  );

  const [rows] = await pool.execute(
    'SELECT (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked FROM users WHERE id = ?',
    [userId],
  );

  if (rows[0] && Number(rows[0].is_locked) === 1) {
    await writeAudit(pool, {
      userId,
      action: 'auth.account_locked',
      entityType: 'user',
      entityId: userId,
      details: { failedAttempts: MAX_FAILED_LOGINS, lockMinutes: LOCK_MINUTES },
    });
  }
}

export async function loginUser(input) {
  const parsed = loginSchema.safeParse(input ?? {});

  if (!parsed.success) {
    fail(
      'Please provide your email or ID and your password.',
      400,
      'VALIDATION_ERROR',
    );
  }

  const identifier = parsed.data.email;
  const password = parsed.data.password;

  // Usernames can never contain "@", so the two lookups cannot collide.
  const byEmail = identifier.includes('@');

  const [rows] = await pool.execute(
    `SELECT id, name, email, password, role, status, profile_photo,
            (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked,
            (password_expires_at IS NOT NULL AND password_expires_at <= NOW()) AS password_expired,
            failed_login_attempts, locked_until
       FROM users
      WHERE ${byEmail ? 'email' : 'username'} = ?
      LIMIT 1`,
    [byEmail ? identifier.toLowerCase() : identifier],
  );

  const user = rows[0];

  // Use the same response for unknown identifiers and incorrect passwords.
  if (!user) {
    fail('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  // A locked account is refused before the password is checked, so guessing during the
  // lock gains nothing and does not extend it.
  if (Number(user.is_locked) === 1) {
    fail(
      `Too many failed sign-in attempts. Please try again in ${LOCK_MINUTES} minutes.`,
      429,
      'ACCOUNT_LOCKED',
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password,
  );

  if (!passwordMatches) {
    await registerFailedLogin(user.id);
    fail('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
  }

  // Checked only after the password is correct, so only its real holder learns it expired.
  // Expired passwords can be renewed only by an administrator reset.
  if (Number(user.password_expired) === 1) {
    fail(
      'Your password has expired. Please contact the system administrator to reset it.',
      403,
      'PASSWORD_EXPIRED',
    );
  }

  if (user.status !== 'active') {
    fail(
      'Your account is unavailable.',
      403,
      'ACCOUNT_UNAVAILABLE',
    );
  }

  // A role selected on the public access screen must match
  // the account's assigned role.
  if (
    parsed.data.selectedRole &&
    user.role !== parsed.data.selectedRole
  ) {
    fail(
      'This account is not assigned to the selected access category. Choose the correct category or use your authorized account.',
      403,
      'ROLE_MISMATCH',
    );
  }

  if (Number(user.failed_login_attempts) > 0 || user.locked_until) {
    await pool.execute(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id],
    );
  }

  const token = jwt.sign(
    {},
    env.JWT_SECRET,
    {
      subject: String(user.id),
      issuer: 'asems-api',
      audience: 'asems-web',
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );

  await writeAudit(pool, {
    userId: user.id,
    action: 'auth.login',
    entityType: 'user',
    entityId: user.id,
    details: {},
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePhoto: user.profile_photo ?? null,
    },
  };
}

export async function getCurrentUser(userId) {
  if (!/^[1-9]\d*$/.test(String(userId))) {
    fail('Invalid user ID.', 400, 'INVALID_USER_ID');
  }

  const [rows] = await pool.execute(
    `SELECT ${publicFields}
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [userId],
  );

  if (!rows[0] || rows[0].status !== 'active') {
    fail(
      'User not found or account unavailable.',
      404,
      'USER_NOT_FOUND',
    );
  }

  return publicUser(rows[0]);
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
});

export async function changePassword(
  userId,
  input,
  ipAddress = null,
) {
  const parsed = changePasswordSchema.safeParse(input ?? {});

  if (!parsed.success) {
    fail(
      'The new password must be between 12 and 128 characters.',
      400,
      'VALIDATION_ERROR',
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    fail(
      'The new password must be different from the current password.',
      400,
      'VALIDATION_ERROR',
    );
  }

  const [rows] = await pool.execute(
    'SELECT id, password, status FROM users WHERE id = ? LIMIT 1',
    [Number(userId)],
  );

  const user = rows[0];

  if (!user || user.status !== 'active') {
    fail(
      'User not found or account unavailable.',
      404,
      'USER_NOT_FOUND',
    );
  }

  // 400 (not 401) so the browser does not discard the session.
  const matches = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!matches) {
    fail(
      'The current password is incorrect.',
      400,
      'INVALID_CURRENT_PASSWORD',
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.execute(
    'UPDATE users SET password = ? WHERE id = ?',
    [passwordHash, user.id],
  );

  await writeAudit(pool, {
    userId: user.id,
    action: 'auth.password_changed',
    entityType: 'user',
    entityId: user.id,
    details: {},
    ipAddress,
  });

  return {
    changed: true,
  };
}

const profileSchema = z.object({
  phone: z.string().trim().max(30).nullable(),
  address: z.string().trim().max(255).nullable(),
});

export async function updateProfile(
  userId,
  input,
  ipAddress = null,
) {
  const parsed = profileSchema.safeParse(input ?? {});

  if (!parsed.success) {
    fail(
      'Please enter a valid phone number (up to 30 characters) and address.',
      400,
      'VALIDATION_ERROR',
    );
  }

  const phone = parsed.data.phone || null;
  const address = parsed.data.address || null;

  await pool.execute(
    'UPDATE users SET phone = ?, address = ? WHERE id = ?',
    [phone, address, Number(userId)],
  );

  await writeAudit(pool, {
    userId: Number(userId),
    action: 'auth.profile_updated',
    entityType: 'user',
    entityId: Number(userId),
    details: {
      fields: ['phone', 'address'],
    },
    ipAddress,
  });

  return getCurrentUser(userId);
}

export async function updateProfilePhoto(
  userId,
  profilePhoto,
  ipAddress = null,
) {
  await pool.execute(
    'UPDATE users SET profile_photo = ? WHERE id = ?',
    [profilePhoto, Number(userId)],
  );

  await writeAudit(pool, {
    userId: Number(userId),
    action: 'auth.profile_photo_updated',
    entityType: 'user',
    entityId: Number(userId),
    details: {},
    ipAddress,
  });

  return getCurrentUser(userId);
}