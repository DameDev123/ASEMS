import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import {
  importStudents,
  importInstructors,
} from '../services/bulkImport.service.js';

const router = Router();

// Administrator only. Responses may contain one-time initial passwords.
router.use(authenticate, authorize('admin'));
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/students', async (req, res, next) => {
  try {
    const data = await importStudents(req.body, req);
    res.status(data.dryRun ? 200 : 201).json({
      success: true,
      message: data.dryRun
        ? 'Student import validated. Nothing was saved.'
        : 'Student import completed.',
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/instructors', async (req, res, next) => {
  try {
    const data = await importInstructors(req.body, req);
    res.status(data.dryRun ? 200 : 201).json({
      success: true,
      message: data.dryRun
        ? 'Instructor import validated. Nothing was saved.'
        : 'Instructor import completed.',
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;