import { Router } from 'express';

import { authenticate } from '../middlewares/auth.js';
import {
  getCurrentUser,
  loginUser,
} from '../services/auth.service.js';

const router = Router();

/**
 * POST /api/auth/login
 * Public: validates credentials and returns a JWT.
 */
router.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/auth/me
 * Protected: returns the authenticated user's public profile.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;