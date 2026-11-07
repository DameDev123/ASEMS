
import { z } from 'zod';

/**
 * Password and login security policy.
 *
 * MAX_FAILED_LOGINS:
 * Maximum consecutive failed login attempts before account locking.
 *
 * LOCK_MINUTES:
 * Duration of the temporary account lock.
 */

export const MAX_FAILED_LOGINS = 5;

export const LOCK_MINUTES = 15;

/**
 * Password policy for administrator-set passwords.
 */

export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_LENGTH_MESSAGE =
  `The new password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_LENGTH_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_LENGTH_MESSAGE);
