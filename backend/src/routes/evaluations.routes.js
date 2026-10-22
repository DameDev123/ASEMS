import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.js';
import { asyncHandler, httpError, sendData } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';
import { scoreProblem } from '../utils/formContent.js';

const router = Router();
router.use(requireAuth);

const evaluationSchema = z.object({
  scores: z.array(z.object({
    criterionId: z.number().int().positive(),
    score: z.union([z.number().int().min(0).max(5), z.literal('NA')]),
  })).min(1),
  commentStrengths: z.string().max(10000).optional().nullable(),
  commentImprovements: z.string().max(10000).optional().nullable(),
});
const commentsSchema = z.object({
  commentStrengths: z.string().max(10000).optional().nullable(),
  commentImprovements: z.string().max(10000).optional().nullable(),
});

async function recomputeInstructorSummary(connection, cycleId, instructorId) {
  const [rows] = await connection.execute(
    `SELECT f.evaluator_type, f.weight, AVG(e.overall_average) AS component_average
       FROM evaluations e
       JOIN evaluation_assignments a ON a.id = e.assignment_id
       JOIN evaluation_forms f ON f.id = a.form_id
      WHERE a.cycle_id = ? AND a.instructor_id = ? AND e.status IN ('submitted', 'approved')
      GROUP BY f.evaluator_type, f.weight`,
    [cycleId, instructorId]
  );
  const byType = new Map(rows.map(row => [row.evaluator_type, {
    average: Number(Number(row.component_average).toFixed(3)),
    weighted: Number((Number(row.component_average) * Number(row.weight) / 5).toFixed(3)),
  }]));
  const required = ['student', 'department_head', 'peer', 'self'];
  const complete = required.every(type => byType.has(type));
  const student = byType.get('student');
  const head = byType.get('department_head');
  const peer = byType.get('peer');
  const self = byType.get('self');
  const total = complete ? required.reduce((sum, type) => sum + byType.get(type).weighted, 0) : 0;

  await connection.execute(
    `INSERT INTO evaluation_summaries
      (cycle_id, instructor_id, student_average, student_weighted,
       department_head_average, department_head_weighted, peer_average, peer_weighted,
       self_average, self_weighted, total_score, status, finalized_by, finalized_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
     ON DUPLICATE KEY UPDATE
       student_average = VALUES(student_average), student_weighted = VALUES(student_weighted),
       department_head_average = VALUES(department_head_average), department_head_weighted = VALUES(department_head_weighted),
       peer_average = VALUES(peer_average), peer_weighted = VALUES(peer_weighted),
       self_average = VALUES(self_average), self_weighted = VALUES(self_weighted),
       total_score = VALUES(total_score), status = VALUES(status), finalized_by = NULL, finalized_at = NULL`,
    [cycleId, instructorId,
      student?.average ?? null, student?.weighted ?? 0,
      head?.average ?? null, head?.weighted ?? 0,
      peer?.average ?? null, peer?.weighted ?? 0,
      self?.average ?? null, self?.weighted ?? 0,
      Number(total.toFixed(3)), complete ? 'complete' : 'incomplete']
  );
}

async function getOwnedAssignment(connection, assignmentId, userId, role) {
  const [rows] = await connection.execute(
    `SELECT a.id, a.cycle_id, a.form_id, a.instructor_id, a.evaluator_id, a.status AS assignment_status,
            cy.status AS cycle_status, f.weight, f.evaluator_type,
            a.form_version_id, fv.scale_min, fv.scale_max, fv.allow_na
       FROM evaluation_assignments a
       JOIN evaluation_cycles cy ON cy.id = a.cycle_id
       JOIN evaluation_forms f ON f.id = a.form_id
       JOIN form_versions fv ON fv.id = a.form_version_id
      WHERE a.id = ? ${role === 'admin' ? '' : 'AND a.evaluator_id = ?'}
      LIMIT 1`,
    role === 'admin' ? [assignmentId] : [assignmentId, userId]
  );
  return rows[0];
}

router.put('/:assignmentId/draft', asyncHandler(async (req, res) => {
  const assignmentId = Number(req.params.assignmentId);
  if (!Number.isSafeInteger(assignmentId) || assignmentId < 1) throw httpError(400, 'Invalid assignment ID.', 'VALIDATION_ERROR');
  const parsed = evaluationSchema.safeParse(req.body);
  if (!parsed.success) throw httpError(400, 'Invalid evaluation payload.', 'VALIDATION_ERROR');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const assignment = await getOwnedAssignment(connection, assignmentId, Number(req.user.id), req.user.role);
    if (!assignment) throw httpError(404, 'Assignment not found.', 'NOT_FOUND');
    if (assignment.cycle_status !== 'active') throw httpError(409, 'This evaluation cycle is not active.', 'CYCLE_NOT_ACTIVE');

    const [existingRows] = await connection.execute('SELECT id, status FROM evaluations WHERE assignment_id = ? FOR UPDATE', [assignmentId]);
    if (existingRows[0]?.status === 'approved' || existingRows[0]?.status === 'submitted') {
      throw httpError(409, 'A submitted or approved evaluation cannot be edited.', 'EVALUATION_LOCKED');
    }

    const [allowedRows] = await connection.execute(
      `SELECT c.id FROM form_criteria c
       JOIN form_sections s ON s.id = c.section_id
       WHERE s.form_version_id = ? AND c.is_active = 1`,
      [assignment.form_version_id]
    );
    const allowedIds = new Set(allowedRows.map(row => Number(row.id)));
    const uniqueScores = new Map();
    for (const item of parsed.data.scores) {
      if (!allowedIds.has(item.criterionId)) throw httpError(400, `Criterion ${item.criterionId} does not belong to this evaluation form.`, 'INVALID_CRITERION');
      if (uniqueScores.has(item.criterionId)) throw httpError(400, 'A criterion may only be scored once.', 'DUPLICATE_CRITERION');
      const scale = scoreProblem(item.score, assignment);
      if (scale) throw httpError(400, scale, 'INVALID_SCORE');
      uniqueScores.set(item.criterionId, item.score);
    }

    let evaluationId = existingRows[0]?.id;
    if (evaluationId) {
      await connection.execute(
        `UPDATE evaluations SET status = 'draft', comment_strengths = ?, comment_improvements = ?,
         overall_average = NULL, weighted_score = NULL, submitted_at = NULL WHERE id = ?`,
        [parsed.data.commentStrengths ?? null, parsed.data.commentImprovements ?? null, evaluationId]
      );
      await connection.execute('DELETE FROM evaluation_scores WHERE evaluation_id = ?', [evaluationId]);
    } else {
      const [insert] = await connection.execute(
        `INSERT INTO evaluations (assignment_id, status, comment_strengths, comment_improvements)
         VALUES (?, 'draft', ?, ?)`,
        [assignmentId, parsed.data.commentStrengths ?? null, parsed.data.commentImprovements ?? null]
      );
      evaluationId = insert.insertId;
    }

    for (const [criterionId, score] of uniqueScores) {
      await connection.execute(
        'INSERT INTO evaluation_scores (evaluation_id, criterion_id, score, is_na) VALUES (?, ?, ?, ?)',
        [evaluationId, criterionId, score === 'NA' ? null : score, score === 'NA' ? 1 : 0]
      );
    }
    await connection.execute("UPDATE evaluation_assignments SET status = 'draft' WHERE id = ?", [assignmentId]);
    await writeAudit(connection, { userId: Number(req.user.id), action: 'evaluation_saved_draft', entityType: 'evaluation', entityId: evaluationId, details: { assignmentId, scoreCount: uniqueScores.size }, ipAddress: req.ip });
    await connection.commit();
    sendData(res, { evaluationId, assignmentId, status: 'draft', savedScores: uniqueScores.size }, 200);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.post('/:assignmentId/submit', asyncHandler(async (req, res) => {
  const assignmentId = Number(req.params.assignmentId);
  if (!Number.isSafeInteger(assignmentId) || assignmentId < 1) throw httpError(400, 'Invalid assignment ID.', 'VALIDATION_ERROR');
  const parsed = commentsSchema.safeParse(req.body ?? {});
  if (!parsed.success) throw httpError(400, 'Invalid comments.', 'VALIDATION_ERROR');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const assignment = await getOwnedAssignment(connection, assignmentId, Number(req.user.id), req.user.role);
    if (!assignment) throw httpError(404, 'Assignment not found.', 'NOT_FOUND');
    if (assignment.cycle_status !== 'active') throw httpError(409, 'This evaluation cycle is not active.', 'CYCLE_NOT_ACTIVE');

    const [evaluationRows] = await connection.execute('SELECT id, status FROM evaluations WHERE assignment_id = ? FOR UPDATE', [assignmentId]);
    const evaluation = evaluationRows[0];
    if (!evaluation || !['draft', 'returned', 'rejected'].includes(evaluation.status)) throw httpError(409, 'Save a draft before submitting, or this evaluation has already been submitted.', 'NOT_SUBMITTABLE');
    const [criteriaRows] = await connection.execute(
      `SELECT c.id FROM form_criteria c JOIN form_sections s ON s.id = c.section_id
       WHERE s.form_version_id = ? AND c.is_active = 1`,
      [assignment.form_version_id]
    );
    const [scoreRows] = await connection.execute(
      'SELECT criterion_id, score, is_na FROM evaluation_scores WHERE evaluation_id = ?',
      [evaluation.id]
    );
    const scoreMap = new Map(scoreRows.map(row => [Number(row.criterion_id), row]));
    const missing = criteriaRows.filter(row => !scoreMap.has(Number(row.id)));
    if (missing.length) throw httpError(400, `Complete every criterion before submitting. ${missing.length} response(s) are missing.`, 'INCOMPLETE_EVALUATION');

    // NA responses are excluded from the mean. This is a provisional technical rule and must be confirmed institutionally.
    const numeric = scoreRows.filter(row => !row.is_na && row.score !== null).map(row => Number(row.score));
    if (!numeric.length) throw httpError(400, 'At least one numeric score is required.', 'NO_NUMERIC_SCORES');
    const average = numeric.reduce((sum, score) => sum + score, 0) / numeric.length;
    const weighted = average * Number(assignment.weight) / 5;

    await connection.execute(
      `UPDATE evaluations SET status = 'submitted', comment_strengths = ?, comment_improvements = ?,
       overall_average = ?, weighted_score = ?, submitted_at = NOW() WHERE id = ?`,
      [parsed.data.commentStrengths ?? null, parsed.data.commentImprovements ?? null, average.toFixed(3), weighted.toFixed(3), evaluation.id]
    );
    await connection.execute("UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?", [assignmentId]);
    await recomputeInstructorSummary(connection, assignment.cycle_id, assignment.instructor_id);
    await writeAudit(connection, { userId: Number(req.user.id), action: 'evaluation_submitted', entityType: 'evaluation', entityId: evaluation.id, details: { assignmentId, average: Number(average.toFixed(3)), weightedScore: Number(weighted.toFixed(3)) }, ipAddress: req.ip });
    await connection.commit();
    sendData(res, { evaluationId: evaluation.id, assignmentId, status: 'submitted', overallAverage: Number(average.toFixed(3)), weightedScore: Number(weighted.toFixed(3)), note: 'Component scores are recorded; the final instructor score is calculated only when all four component evaluations are submitted.' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

export default router;