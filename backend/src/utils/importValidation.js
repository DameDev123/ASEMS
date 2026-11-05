import { isValidUsername, normalizeUsername } from './credentials.js';

export const MAX_IMPORT_ROWS = 1500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACADEMIC_YEAR_RE = /^\d{4}([/-]\d{2,4})?$/;

function clean(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeGender(value) {
  const v = clean(value).toLowerCase();
  if (!v) return null;
  if (v === 'male' || v === 'm') return 'male';
  if (v === 'female' || v === 'f') return 'female';
  return undefined;
}

function rowNumberOf(raw, index) {
  return Number.isInteger(raw?.rowNumber) ? raw.rowNumber : index + 1;
}

export function validateStudentRows(rows, defaults = {}) {
  const valid = [];
  const errors = [];
  const seen = new Map();

  rows.forEach((raw, index) => {
    const rowNumber = rowNumberOf(raw, index);
    const problems = [];

    const studentId = normalizeUsername(raw?.studentId);
    const name = clean(raw?.name);
    const phone = clean(raw?.phone);
    const gender = normalizeGender(raw?.gender);
    const academicYear = clean(raw?.academicYear) || clean(defaults.academicYear);
    const yearLevelText = clean(raw?.yearLevel) || clean(defaults.yearLevel);
    const section = (clean(raw?.section) || clean(defaults.section)).toUpperCase();
    const yearLevel = Number(yearLevelText);

    if (!isValidUsername(studentId)) {
      problems.push('Student ID must be 3-40 characters (letters, digits, / _ . -).');
    }
    if (name.length < 2 || name.length > 255) {
      problems.push('Full name is required (2-255 characters).');
    }
    if (gender === undefined) problems.push('Gender must be male or female (or blank).');
    if (phone.length > 20) problems.push('Phone must be at most 20 characters.');
    if (!ACADEMIC_YEAR_RE.test(academicYear) || academicYear.length > 20) {
      problems.push('Academic year is required, e.g. 2026 or 2026/27.');
    }
    if (!Number.isInteger(yearLevel) || yearLevel < 1 || yearLevel > 8) {
      problems.push('Year level must be a whole number from 1 to 8.');
    }
    if (!section || section.length > 50) {
      problems.push('Section is required (max 50 characters).');
    }

    const key = studentId.toLowerCase();
    if (studentId && seen.has(key)) {
      problems.push(`Duplicate Student ID in the file (first on row ${seen.get(key)}).`);
    } else if (studentId) {
      seen.set(key, rowNumber);
    }

    if (problems.length) {
      errors.push({ rowNumber, studentId, name, message: problems.join(' ') });
      return;
    }

    valid.push({
      rowNumber,
      studentId,
      username: studentId,
      name,
      gender,
      phone: phone || null,
      academicYear,
      yearLevel,
      section,
    });
  });

  return { valid, errors };
}
export function validateInstructorRows(rows) {
  const valid = [];
  const errors = [];
  const seen = new Map();

  rows.forEach((raw, index) => {
    const rowNumber = rowNumberOf(raw, index);
    const problems = [];

    const name = clean(raw?.name);
    const email = clean(raw?.email).toLowerCase();
    const phone = clean(raw?.phone);
    const idNumber = clean(raw?.idNumber);
    const jobTitle = clean(raw?.jobTitle) || 'Instructor';
    const gender = normalizeGender(raw?.gender);
    const startYearText = clean(raw?.teachingStartYear);
    // Strictly 4 digits: Number() alone would accept hex ("0x7E3") or exponent ("2e3") text.
    const startYear = /^\d{4}$/.test(startYearText)
      ? Number(startYearText)
      : startYearText ? Number.NaN : null;

    if (name.length < 2 || name.length > 255) {
      problems.push('Full name is required (2-255 characters).');
    }
    if (
      startYear !== null &&
      (!Number.isInteger(startYear) || startYear < 1950 || startYear > new Date().getFullYear() + 1)
    ) {
      problems.push('Teaching start year must be a 4-digit year (1950 or later), or blank.');
    }
    if (!EMAIL_RE.test(email) || email.length > 255) {
      problems.push('A valid email is required.');
    }
    if (gender === undefined) problems.push('Gender must be male or female (or blank).');
    if (phone.length > 20) problems.push('Phone must be at most 20 characters.');
    if (idNumber.length > 40) problems.push('ID number must be at most 40 characters.');
    if (jobTitle.length > 150) problems.push('Job title must be at most 150 characters.');

    if (email && seen.has(email)) {
      problems.push(`Duplicate email in the file (first on row ${seen.get(email)}).`);
    } else if (email) {
      seen.set(email, rowNumber);
    }

    if (problems.length) {
      errors.push({ rowNumber, email, name, message: problems.join(' ') });
      return;
    }

    valid.push({
      rowNumber,
      name,
      email,
      gender,
      phone: phone || null,
      idNumber: idNumber || null,
      jobTitle,
      teachingStartYear: startYear,
    });
  });

  return { valid, errors };
}