import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';

// The app config validates the environment when imported. A real .env wins (dotenv never
// overrides existing variables); these fallbacks only matter on a machine without one.
process.env.JWT_SECRET ||= 'test-only-secret-that-is-long-enough-0123456789';
process.env.DB_USER ||= 'test';

const { pool } = await import('../src/config/database.js');
const { loginUser } = await import('../src/services/auth.service.js');
const { importStudents } = await import('../src/services/bulkImport.service.js');

// Replaces the pool with an in-memory fake that honours the column the SQL asks for,
// so a login that searches the wrong column fails these tests.
function installFakeDb(existingUsers = []) {
  const inserted = [];
  const lookups = [];

  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params) => {
      if (/INSERT INTO sections/.test(sql)) return [{ insertId: 5 }];
      if (/INSERT INTO users/.test(sql)) {
        const row = {
          id: 100 + inserted.length,
          name: params[0],
          email: params[1],
          username: params[2],
          password: params[3],
          role: 'student',
          status: 'active',
          profile_photo: null,
        };
        inserted.push(row);
        return [{ insertId: row.id }];
      }
      return [{ insertId: 0 }]; // student_departments, student_profiles, audit_logs
    },
  };

  pool.getConnection = async () => connection;
  pool.query = async (sql) => {
    if (/FROM users/.test(sql)) return [[]];
    throw new Error('Unexpected pool.query in test');
  };
  pool.execute = async (sql, params) => {
    if (/FROM departments/.test(sql)) return [[{ id: 2, name: 'ELEC' }]];
    if (/INSERT INTO audit_logs/.test(sql)) return [{}];
    const match = sql.match(/FROM users\s+WHERE (email|username) = \?/);
    if (match) {
      const column = match[1];
      lookups.push(column);
      const wanted = String(params[0]).toLowerCase();
      const hit = [...existingUsers, ...inserted].find(
        (user) => String(user[column] ?? '').toLowerCase() === wanted,
      );
      return [hit ? [hit] : []];
    }
    throw new Error('Unexpected pool.execute in test');
  };

  return {
    inserted,
    lookups,
    restore() {
      delete pool.getConnection;
      delete pool.query;
      delete pool.execute;
    },
  };
}

async function importTwoStudents() {
  const result = await importStudents(
    {
      departmentId: 2,
      dryRun: false,
      defaults: { academicYear: '2026', yearLevel: 2, section: 'A' },
      rows: [
        { studentId: 'RU1001', name: 'Abebe Kebede' },
        { studentId: 'RU1002', name: 'Tigist Alemu' },
      ],
    },
    { user: { id: 1 }, ip: '127.0.0.1' },
  );
  return result.created;
}

async function expectLoginError(input, code) {
  await assert.rejects(
    () => loginUser(input),
    (error) => {
      assert.equal(error.code, code);
      return true;
    },
  );
}

test('an imported student can sign in with the Student ID (username) and the issued password', async () => {
  const db = installFakeDb();
  try {
    const [first] = await importTwoStudents();

    // The importer stored a bcrypt hash, never the plain password.
    assert.ok(db.inserted[0].password.startsWith('$2b$'));
    assert.notEqual(db.inserted[0].password, first.initialPassword);
    assert.equal(db.inserted[0].username, 'RU1001');

    const result = await loginUser({
      email: 'RU1001',
      password: first.initialPassword,
      selectedRole: 'student',
    });

    assert.equal(result.user.role, 'student');
    assert.equal(result.user.name, 'Abebe Kebede');
    assert.ok(typeof result.token === 'string' && result.token.length > 20);
    assert.ok(!('password' in result.user));
    // A username must be searched in the username column, not the email column.
    assert.deepEqual(db.lookups, ['username']);
  } finally {
    db.restore();
  }
});

test('each student only signs in with their own issued password', async () => {
  const db = installFakeDb();
  try {
    const [first, second] = await importTwoStudents();
    assert.notEqual(first.initialPassword, second.initialPassword);
    await expectLoginError({ email: 'RU1001', password: second.initialPassword }, 'INVALID_CREDENTIALS');
    const ok = await loginUser({ email: 'RU1002', password: second.initialPassword });
    assert.equal(ok.user.name, 'Tigist Alemu');
  } finally {
    db.restore();
  }
});

test('invalid student credentials are rejected with the same generic error', async () => {
  const db = installFakeDb();
  try {
    const [first] = await importTwoStudents();

    await expectLoginError({ email: 'RU1001', password: 'WRONGPASS' }, 'INVALID_CREDENTIALS');
    await expectLoginError({ email: 'RU9999', password: first.initialPassword }, 'INVALID_CREDENTIALS');
    await expectLoginError({ email: 'RU1001', password: `${first.initialPassword} ` }, 'INVALID_CREDENTIALS');

    // Wrong password and unknown user are indistinguishable to the caller.
    const errors = [];
    for (const input of [
      { email: 'RU1001', password: 'WRONGPASS' },
      { email: 'RU9999', password: 'WRONGPASS' },
    ]) {
      try { await loginUser(input); } catch (error) { errors.push([error.statusCode, error.message]); }
    }
    assert.deepEqual(errors[0], errors[1]);
  } finally {
    db.restore();
  }
});

test('a student account cannot sign in through another access category', async () => {
  const db = installFakeDb();
  try {
    const [first] = await importTwoStudents();
    await expectLoginError(
      { email: 'RU1001', password: first.initialPassword, selectedRole: 'teacher' },
      'ROLE_MISMATCH',
    );
  } finally {
    db.restore();
  }
});

test('an inactive student account is refused even with the right password', async () => {
  const db = installFakeDb();
  try {
    const [first] = await importTwoStudents();
    db.inserted[0].status = 'inactive';
    await expectLoginError({ email: 'RU1001', password: first.initialPassword }, 'ACCOUNT_UNAVAILABLE');
  } finally {
    db.restore();
  }
});

test('email login for other roles still works and searches the email column', async () => {
  const hash = await bcrypt.hash('Teacher-Pass-123', 4);
  const db = installFakeDb([
    { id: 7, name: 'saamii', email: 'sami@gmail.com', username: null, password: hash, role: 'teacher', status: 'active', profile_photo: null },
  ]);
  try {
    const result = await loginUser({ email: 'Sami@Gmail.com', password: 'Teacher-Pass-123', selectedRole: 'teacher' });
    assert.equal(result.user.role, 'teacher');
    assert.deepEqual(db.lookups, ['email']);

    await expectLoginError({ email: 'sami@gmail.com', password: 'not-the-password' }, 'INVALID_CREDENTIALS');
  } finally {
    db.restore();
  }
});