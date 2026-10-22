import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth, allowRoles } from '../middlewares/auth.js';
import { asyncHandler, httpError, sendData } from '../utils/http.js';

const router = Router();
router.use(requireAuth);

router.get('/summaries', allowRoles('admin', 'committee', 'department_head', 'dean', 'management'), asyncHandler(async (req, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : null;
  if (cycleId !== null && (!Number.isSafeInteger(cycleId) || cycleId < 1)) throw httpError(400, 'Invalid cycleId.', 'VALIDATION_ERROR');
  const clauses = [];
  const values = [];
  if (cycleId) { clauses.push('s.cycle_id = ?'); values.push(cycleId); }

  if (req.user.role === 'department_head') {
    clauses.push(`EXISTS (
      SELECT 1 FROM employees viewer_emp
      JOIN employees instructor_emp ON instructor_emp.department_id = viewer_emp.department_id
      WHERE viewer_emp.user_id = ? AND instructor_emp.user_id = s.instructor_id
    )`);
    values.push(Number(req.user.id));
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT s.id, s.cycle_id, cy.title AS cycle_title, cy.academic_year,
            s.instructor_id, u.name AS instructor_name, s.student_average, s.student_weighted,
            s.department_head_average, s.department_head_weighted, s.peer_average, s.peer_weighted,
            s.self_average, s.self_weighted, s.total_score, s.status, s.finalized_at
       FROM evaluation_summaries s
       JOIN evaluation_cycles cy ON cy.id = s.cycle_id
       JOIN users u ON u.id = s.instructor_id
       ${where}
      ORDER BY cy.start_date DESC, u.name ASC`, values
  );
  sendData(res, rows);
}));

export default router;