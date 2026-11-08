
// Mirrors the API password rules in backend/src/utils/passwordPolicy.js.
// Used for admin-typed passwords only; there is no self-service password change.

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;

// Returns an error message, or '' when the password is acceptable.
export function passwordPolicyError(value) {
  if (typeof value !== 'string') {
    return 'A password is required.';
  }

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    return `The password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
  }

  return '';
}
