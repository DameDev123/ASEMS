import { randomInt } from 'node:crypto';

// No 0/O, 1/I/L so credentials are easy to read out and type. Uppercase only.
export const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// System-generated passwords are always 4 to 6 characters. 12-character (or any longer)
// passwords are never generated: requests outside the range are clamped into it.
export const GENERATED_PASSWORD_MIN_LENGTH = 4;
export const GENERATED_PASSWORD_MAX_LENGTH = 6;
// Default is the maximum, so the strongest password the policy allows is used.
export const GENERATED_PASSWORD_DEFAULT_LENGTH = GENERATED_PASSWORD_MAX_LENGTH;

export function generateInitialPassword(length = GENERATED_PASSWORD_DEFAULT_LENGTH) {
  const requested = Number.isInteger(length) ? length : GENERATED_PASSWORD_DEFAULT_LENGTH;
  const size = Math.min(
    GENERATED_PASSWORD_MAX_LENGTH,
    Math.max(GENERATED_PASSWORD_MIN_LENGTH, requested),
  );
  let password = '';
  for (let i = 0; i < size; i += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return password;
}

export function normalizeUsername(value) {
  return String(value ?? '').trim();
}

export function isValidUsername(value) {
  return /^[A-Za-z0-9][A-Za-z0-9/_.-]{2,39}$/.test(value);
}

// users.email is NOT NULL + UNIQUE, so students get a system address derived from their ID.
export function studentEmailFor(username) {
  const local = username.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return `${local}@students.asems.local`;
}

// Temporary password issued by an administrator reset: exactly six decimal digits,
// 000000-999999, uniformly random (crypto.randomInt). It is returned as a STRING so leading
// zeros survive ("004721"). Never convert it to a number, and never put it in a CSV
// (spreadsheets drop leading zeros).
export const TEMP_PASSWORD_DIGITS = 6;

export function generateTemporaryPassword(random = randomInt) {
  return String(random(10 ** TEMP_PASSWORD_DIGITS)).padStart(TEMP_PASSWORD_DIGITS, '0');
}