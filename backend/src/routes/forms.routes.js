import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, sendData } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

// The dump contains two parallel sets of sections for each form (IDs 1-19 and 39-56).
// Until the owner confirms which set is authoritative, use the original lower-ID set.
router.get('/', asyncHandler(async (req, res) => {
  const [forms] = await pool.execute(
    'SELECT id, code, title, evaluator_type, weight FROM evaluation_forms WHERE is_active = 1 ORDER BY code'
  );
  const [sections] = await pool.execute(
    `SELECT s.id, s.form_id, s.section_key, s.title, s.sort_order
       FROM form_sections s
       JOIN evaluation_forms f ON f.id = s.form_id
      WHERE f.is_active = 1 AND s.id BETWEEN 1 AND 19
      ORDER BY s.form_id, s.sort_order`
  );
  const [criteria] = await pool.execute(
    `SELECT c.id, c.section_id, c.text, c.sort_order
       FROM form_criteria c
       JOIN form_sections s ON s.id = c.section_id
       JOIN evaluation_forms f ON f.id = s.form_id
      WHERE c.is_active = 1 AND s.id BETWEEN 1 AND 19 AND f.is_active = 1
      ORDER BY s.form_id, s.sort_order, c.sort_order`
  );
  const grouped = forms.map(form => ({
    ...form,
    sections: sections.filter(section => Number(section.form_id) === Number(form.id)).map(section => ({
      ...section,
      criteria: criteria.filter(item => Number(item.section_id) === Number(section.id)),
    })),
  }));
  sendData(res, { forms: grouped, ratingScale: [5, 4, 3, 2, 1, 0, 'NA'], note: 'NA and missing-response calculation rules require institutional confirmation.' });
}));

export default router;
