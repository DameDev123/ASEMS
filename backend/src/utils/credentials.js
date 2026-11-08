
import { randomInt } from 'node:crypto';

// No 0/O, 1/I/L so credentials are easy to read and type.
// Uppercase letters and digits only.
export const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// System-generated initial passwords are always exactly 6 characters.
export const GENERATED_PASSWORD_MIN_LENGTH = 6;
export const GENERATED_PASSWORD_MAX_LENGTH = 6;
export const GENERATED_PASSWORD_DEFAULT_LENGTH = 6;

export function generateInitialPassword(
  length = GENERATED_PASSWORD_DEFAULT_LENGTH,
) {
  const requested = Number.isInteger(length)
    ? length
    : GENERATED_PASSWORD_DEFAULT_LENGTH;

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

// Normalize usernames without changing their original case.
export function normalizeUsername(value) {
  return String(value ?? '').trim();
}

// Valid username: 3-40 characters.
// Allowed: letters, numbers, slash, underscore, dot and hyphen.
export function isValidUsername(value) {
  return /^[A-Za-z0-9][A-Za-z0-9/_.-]{2,39}$/.test(value);
}

// users.email is NOT NULL + UNIQUE.
// Students receive a system-generated email based on their username.
export function studentEmailFor(username) {
  const local = username.toLowerCase().replace(/[^a-z0-9._-]/g, '-');

  return `${local}@students.asems.local`;
}

// Temporary password issued during administrator password resets.
// Exactly 6 decimal digits (000000-999999).
// Returned as a STRING to preserve leading zeros.
export const TEMP_PASSWORD_DIGITS = 6;

export function generateTemporaryPassword(random = randomInt) {
  return String(
    random(10 ** TEMP_PASSWORD_DIGITS),
  ).padStart(TEMP_PASSWORD_DIGITS, '0');
}
