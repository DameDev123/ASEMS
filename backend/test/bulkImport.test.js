import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateInitialPassword,
  PASSWORD_ALPHABET,
  studentEmailFor,
  isValidUsername,
} from '../src/utils/credentials.js';

import {
  validateStudentRows,
  validateInstructorRows,
} from '../src/utils/importValidation.js';

test('initial password uses only unambiguous characters and requested length', () => {
  for (let i = 0; i < 200; i += 1) {
    const p = generateInitialPassword(8);

    assert.equal(p.length, 8);

    for (const ch of p) {
      assert.ok(PASSWORD_ALPHABET.includes(ch));
    }
  }

  assert.equal(generateInitialPassword(12).length, 12);
});

test('student passwords are not shared or predictable', () => {
  const set = new Set(
    Array.from(
      { length: 500 },
      () => generateInitialPassword(8),
    ),
  );

  assert.ok(set.size > 495);
});

test('username and system email derivation', () => {
  assert.ok(isValidUsername('RU/1234/14'));
  assert.ok(!isValidUsername('ab'));
  assert.ok(!isValidUsername('bad id'));

  assert.equal(
    studentEmailFor('RU/1234/14'),
    'ru-1234-14@students.asems.local',
  );
});

test('student rows: defaults, normalization, duplicates and errors', () => {
  const { valid, errors } = validateStudentRows(
    [
      {
        studentId: 'RU1001',
        name: 'Abebe Kebede',
        gender: 'M',
        section: 'a',
      },
      {
        studentId: 'ru1001',
        name: 'Dup Person',
        section: 'A',
      },
      {
        studentId: 'RU1002',
        name: 'Tigist Alemu',
        yearLevel: '3',
        section: 'B',
        academicYear: '2026/27',
      },
      {
        studentId: 'x',
        name: '',
        section: '',
      },
    ],
    {
      academicYear: '2026',
      yearLevel: 2,
      section: 'A',
    },
  );

  assert.equal(valid.length, 2);
  assert.equal(valid[0].gender, 'male');
  assert.equal(valid[0].section, 'A');
  assert.equal(valid[0].academicYear, '2026');
  assert.equal(valid[0].yearLevel, 2);
  assert.equal(valid[1].yearLevel, 3);
  assert.equal(errors.length, 2);
  assert.match(errors[0].message, /Duplicate Student ID/);
});

test('instructor rows: email required, duplicates rejected', () => {
  const { valid, errors } = validateInstructorRows([
    {
      name: 'Dr. Lemma',
      email: 'Lemma@Ambo.edu.et',
    },
    {
      name: 'Dr. Lemma Two',
      email: 'lemma@ambo.edu.et',
    },
    {
      name: 'No Email',
      email: 'nope',
    },
  ]);

  assert.equal(valid.length, 1);
  assert.equal(valid[0].email, 'lemma@ambo.edu.et');
  assert.equal(valid[0].jobTitle, 'Instructor');
  assert.equal(errors.length, 2);
});

test('instructor teachingStartYear: optional, validated', () => {
  const { valid, errors } = validateInstructorRows([
    {
      name: 'Dr. A',
      email: 'a@ambo.edu.et',
      teachingStartYear: '2019',
    },
    {
      name: 'Dr. B',
      email: 'b@ambo.edu.et',
    },
    {
      name: 'Dr. C',
      email: 'c@ambo.edu.et',
      teachingStartYear: '19',
    },
  ]);

  assert.equal(valid.length, 2);
  assert.equal(valid[0].teachingStartYear, 2019);
  assert.equal(valid[1].teachingStartYear, null);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Teaching start year/);
});