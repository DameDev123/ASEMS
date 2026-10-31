import { pool } from '../config/database.js';

// In-app notifications. Every function accepts an optional `executor`
// (a transaction connection) so a notification can be written in the same
// transaction as the event that caused it. Without one, the pool is used.

/** Notify one user. */
export async function notify(userId, title, message = null, executor = pool) {
  if (!userId) return;
  await executor.execute(
    'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
    [Number(userId), String(title).slice(0, 255), message],
  );
}

/** Notify several users at once (duplicates and empty ids are ignored). */
export async function notifyMany(userIds, title, message = null, executor = pool) {
  const ids = [...new Set((userIds || []).map(Number).filter(Boolean))];
  for (const id of ids) {
    await notify(id, title, message, executor);
  }
}

/** Notify every active user that holds the given role. */
export async function notifyRole(role, title, message = null, executor = pool) {
  await executor.execute(
    `INSERT INTO notifications (user_id, title, message)
     SELECT id, ?, ? FROM users WHERE role = ? AND status = 'active'`,
    [String(title).slice(0, 255), message, role],
  );
}