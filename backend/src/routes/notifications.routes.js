import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, httpError, sendData } from '../utils/http.js';

// Every user can only read and update their own notifications.
const router = Router();
router.use(requireAuth);

// GET /api/notifications?unread=1&limit=30
router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 30));
  const onlyUnread = ['1', 'true'].includes(String(req.query.unread || ''));

  const [rows] = await pool.query(
    `SELECT id, title, message, is_read, created_at
       FROM notifications
      WHERE user_id = ? ${onlyUnread ? 'AND is_read = 0' : ''}
      ORDER BY created_at DESC, id DESC
      LIMIT ?`,
    [Number(req.user.id), limit],
  );

  return sendData(res, rows.map((row) => ({ ...row, is_read: Boolean(row.is_read) })));
}));

// GET /api/notifications/unread-count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const [[row]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
    [Number(req.user.id)],
  );
  return sendData(res, { unread: Number(row.total) });
}));

// PATCH /api/notifications/read-all
router.patch('/read-all', asyncHandler(async (req, res) => {
  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [Number(req.user.id)],
  );
  return sendData(res, { updated: result.affectedRows });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) {
    throw httpError(400, 'Invalid notification id.', 'VALIDATION_ERROR');
  }

  const [result] = await pool.execute(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, Number(req.user.id)],
  );
  if (result.affectedRows === 0) {
    throw httpError(404, 'Notification not found.', 'NOT_FOUND');
  }
  return sendData(res, { id, is_read: true });
}));

export default router;