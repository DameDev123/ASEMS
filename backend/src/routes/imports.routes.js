
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import {
  importStudents,
  importInstructors,
} from '../services/bulkImport.service.js';

const router = Router();

// Only Super Admin and legacy system admin can perform bulk imports.
// Academic Admin and Administrative Admin are intentionally excluded.
router.use(
  authenticate,
  authorize('super_admin', 'admin'),
);

// Initial credentials must never be cached.
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
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
