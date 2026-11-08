import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';

import {
  listUsers,
  createUser,
  updateUser,
  changeUserStatus,
  resetUserPassword,
} from '../services/users.service.js';

const router = Router();

// Super Admin manages system accounts.
// Legacy admin remains temporarily supported.
router.use(
  authenticate,
  authorize('super_admin', 'admin'),
);

router.get('/', async (req, res, next) => {
  try {
    const result = await listUsers(req.query, req);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = await createUser(req.body, req);

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const user = await updateUser(req.params.id, req.body, req);

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const result = await changeUserStatus(
      req.params.id,
      req.body.status,
      req,
    );

    res.json({
      success: true,
      message: 'Account status updated successfully.',
      data: { user: result },
    });
  } catch (error) {
    next(error);
  }
});

// Administrator password reset - the only way a password can be changed.
// Optional body { newPassword }. Without it the server generates a secure password and
// returns it once.
router.post('/:id/reset-password', async (req, res, next) => {
  try {
    const result = await resetUserPassword(req.params.id, req.body, req);

    // The response may contain a temporary password: never cache it.
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      message: 'Password reset. Existing sessions for this account were ended.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;