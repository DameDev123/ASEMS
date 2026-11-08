// Self-service password changes are disabled for every account, whatever the role.
// Passwords are changed only by an administrator (POST /api/users/:id/reset-password).
//
// The route is kept (instead of being deleted) so a request to it is refused with a clear
// 403 rather than an ambiguous 404. It deliberately runs without authentication: the answer
// does not depend on who is asking and reveals nothing.
export const PASSWORD_CHANGE_DENIED_MESSAGE =
  'Passwords can only be changed by an administrator. Please contact your system administrator.';

export function denyPasswordChange(req, res) {
  return res.status(403).json({
    success: false,
    message: PASSWORD_CHANGE_DENIED_MESSAGE,
    code: 'PASSWORD_CHANGE_NOT_ALLOWED',
  });
}