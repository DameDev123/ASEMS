
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../config/env.js';
import { pool } from '../config/database.js';
import { writeAudit } from '../utils/audit.js';

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
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

export async function loginUser(input) {
  const parsed = loginSchema.safeParse(input ?? {});

  if (!parsed.success) {
    fail('Please provide a valid email and password.', 400, 'VALIDATION_ERROR');
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const [rows] = await pool.execute(
    `SELECT id, name, email, password, role, status
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [email],
  );

  const user = rows[0];

  // Use the same response for unknown emails and incorrect passwords.
  if (!user) {
    fail('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    fail('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (user.status !== 'active') {
    fail('Your account is unavailable.', 403, 'ACCOUNT_UNAVAILABLE');
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
    fail('User not found or account unavailable.', 404, 'USER_NOT_FOUND');
  }

  return publicUser(rows[0]);
}
